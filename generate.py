"""Generate Project LOVE pixel-art assets and verify them.

Run from the project root:

    python generate.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image

from generators.clouds import CELL_H as CLOUD_H
from generators.clouds import CELL_W as CLOUD_W
from generators.clouds import COUNT as CLOUD_COUNT
from generators.clouds import render_clouds
from generators.daisy import render_daisy
from generators.meadow import GROUND_Y
from generators.meadow import HEIGHT as MEADOW_H
from generators.meadow import WIDTH as MEADOW_W
from generators.meadow import render_meadow
from generators.moon import render_moon
from generators.petals import CELL, FRAMES, VARIANTS, render_petal_sheet
from generators.sky import HEIGHT as SKY_H
from generators.sky import WIDTH as SKY_W
from generators.envelope import CELL_H as ENVELOPE_H
from generators.envelope import CELL_W as ENVELOPE_W
from generators.envelope import COUNT as ENVELOPE_COUNT
from generators.envelope import render_envelope
from generators.sky import render_sky
from generators.tokens import CELL as TOKEN_CELL
from generators.tokens import COUNT as TOKEN_COUNT
from generators.tokens import render_tokens

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "site" / "assets"
BUILD = ROOT / "build"
NEAREST = Image.Resampling.NEAREST


def _save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def _opaque_ratio(image: Image.Image, y: int) -> float:
    pixels = image.load()
    opaque = 0
    for x in range(image.width):
        if pixels[x, y][3] > 200:
            opaque += 1
    return opaque / image.width


def _mean_luma(image: Image.Image, y0: int, y1: int) -> float:
    pixels = image.load()
    total = 0.0
    count = 0
    for y in range(y0, y1):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 250:
                continue
            total += 0.2126 * red + 0.7152 * green + 0.0722 * blue
            count += 1
    return total / max(1, count)


def _count_kinds(image: Image.Image) -> dict[str, int]:
    pixels = image.load()
    kinds = {"clear": 0, "white": 0, "yellow": 0, "green": 0, "other": 0}
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 20:
                kinds["clear"] += 1
            elif red > 220 and green > 210 and blue > 190 and abs(red - blue) < 80:
                kinds["white"] += 1
            elif red > 180 and green > 110 and blue < 140 and red > blue + 40:
                kinds["yellow"] += 1
            elif green > red + 10 and green > blue:
                kinds["green"] += 1
            else:
                kinds["other"] += 1
    return kinds


def _centroid(image: Image.Image, predicate) -> tuple[float, float]:
    pixels = image.load()
    total_x = 0.0
    total_y = 0.0
    count = 0
    for y in range(image.height):
        for x in range(image.width):
            if predicate(pixels[x, y]):
                total_x += x
                total_y += y
                count += 1
    if count == 0:
        raise RuntimeError("expected colored pixels were missing")
    return total_x / count, total_y / count


def verify(assets: dict[str, Image.Image]) -> list[str]:
    """Return a list of problems. An empty list means the assets look sound."""
    problems: list[str] = []
    daisy = assets["daisy"]
    sky = assets["sky"]
    moon = assets["moon"]
    meadow = assets["meadow"]
    petals = assets["petals"]

    if daisy.mode != "RGBA" or sky.mode != "RGBA":
        problems.append("assets must be RGBA pngs")
    kinds = _count_kinds(daisy)
    if kinds["clear"] < daisy.width * daisy.height * 0.15:
        problems.append("daisy background is not transparent enough")
    if kinds["white"] < 80:
        problems.append(f"daisy is missing white petals ({kinds['white']})")
    if kinds["yellow"] < 30:
        problems.append(f"daisy center is missing ({kinds['yellow']})")
    if kinds["green"] < 60:
        problems.append(f"daisy stem or leaves are missing ({kinds['green']})")
    if daisy.getpixel((1, 1))[3] != 0:
        problems.append("daisy top corner should stay transparent")

    yellow_y = _centroid(
        daisy,
        lambda px: px[3] > 200 and px[0] > 180 and px[1] > 110 and px[2] < 140,
    )[1]
    green_y = _centroid(
        daisy,
        lambda px: px[3] > 200 and px[1] > px[0] + 10 and px[1] > px[2],
    )[1]
    if green_y < yellow_y + 8:
        problems.append("stem should sit below the flower center")

    if sky.size != (SKY_W, SKY_H):
        problems.append(f"unexpected sky size {sky.size}")
    if _opaque_ratio(sky, 0) < 0.99 or _opaque_ratio(sky, sky.height - 1) < 0.99:
        problems.append("sky should be fully opaque")
    if _mean_luma(sky, 0, 24) >= _mean_luma(sky, sky.height - 24, sky.height):
        problems.append("sky horizon should be lighter than the zenith")
    colors: dict[tuple[int, int, int, int], int] = {}
    for pixel in sky.get_flattened_data():
        colors[pixel] = colors.get(pixel, 0) + 1
    most = max(colors.values())
    if len(colors) < 24 or most > sky.width * sky.height * 0.12:
        problems.append("sky gradient collapsed into large flat bands")

    if moon.getpixel((0, 0))[3] != 0:
        problems.append("moon glow should fade to transparency at the corner")
    moon_disk = moon.getpixel((moon.width // 2, moon.height // 2))
    if moon_disk[3] < 250 or moon_disk[0] < moon_disk[2] + 20:
        problems.append("moon disk should be warm and opaque")

    if meadow.size != (MEADOW_W, MEADOW_H):
        problems.append(f"unexpected meadow size {meadow.size}")
    if _opaque_ratio(meadow, 0) > 0.05:
        problems.append("meadow top row should be transparent sky")
    if _opaque_ratio(meadow, meadow.height - 1) < 0.95:
        problems.append("meadow bottom row should be solid ground")

    if petals.size != (CELL * FRAMES, CELL * VARIANTS):
        problems.append(f"unexpected petal sheet size {petals.size}")
    frame_pixels = petals.load()
    for variant in range(VARIANTS):
        for frame in range(FRAMES):
            opaque = 0
            for y in range(CELL):
                for x in range(CELL):
                    if frame_pixels[frame * CELL + x, variant * CELL + y][3] > 20:
                        opaque += 1
            if opaque < 24:
                problems.append(f"petal frame {variant}:{frame} is almost empty ({opaque})")
                return problems
    clouds = assets.get("clouds")
    if clouds is not None:
        if clouds.size != (CLOUD_W * CLOUD_COUNT, CLOUD_H):
            problems.append(f"unexpected cloud sheet size {clouds.size}")
        visible = sum(1 for pixel in clouds.get_flattened_data() if pixel[3] > 40)
        if visible < 80:
            problems.append("cloud sheet is missing cloud pixels")
        if clouds.getpixel((0, 0))[3] != 0:
            problems.append("cloud sheet corner should stay transparent")
    tokens = assets.get("tokens")
    if tokens is not None:
        if tokens.size != (TOKEN_CELL * TOKEN_COUNT, TOKEN_CELL):
            problems.append(f"unexpected token sheet size {tokens.size}")
        if tokens.getpixel((0, 0))[3] != 0:
            problems.append("token sheet corner should stay transparent")
        visible = sum(1 for pixel in tokens.get_flattened_data() if pixel[3] > 200)
        if visible < 40:
            problems.append("token sheet is missing objects")
    envelope = assets.get("envelope")
    if envelope is not None:
        if envelope.size != (ENVELOPE_W * ENVELOPE_COUNT, ENVELOPE_H):
            problems.append(f"unexpected envelope size {envelope.size}")
        if envelope.getpixel((0, 0))[3] != 0:
            problems.append("envelope corner should stay transparent")
        visible = sum(1 for pixel in envelope.get_flattened_data() if pixel[3] > 200)
        if visible < 200:
            problems.append("envelope sheet is missing pixels")
    return problems


def _favicon(daisy: Image.Image) -> Image.Image:
    pixels = daisy.load()
    points: list[tuple[int, int]] = []
    for y in range(daisy.height):
        for x in range(daisy.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 200 and red > 180 and green > 120 and blue < 130:
                points.append((x, y))
    if not points:
        center_x, center_y = daisy.width // 2, daisy.height // 3
    else:
        center_x = sum(point[0] for point in points) // len(points)
        center_y = sum(point[1] for point in points) // len(points)
    half = 32
    icon = Image.new("RGBA", (half * 2, half * 2), (7, 11, 30, 255))
    left = center_x - half
    top = center_y - half
    crop = daisy.crop(
        (
            max(0, left),
            max(0, top),
            min(daisy.width, left + half * 2),
            min(daisy.height, top + half * 2),
        )
    )
    icon.alpha_composite(crop, (max(0, -left), max(0, -top)))
    return icon


def _cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    scale = max(width / image.width, height / image.height)
    if scale > 1:
        factor = math.ceil(scale)
        image = image.resize((image.width * factor, image.height * factor), NEAREST)
    left = max(0, (image.width - width) // 2)
    top = max(0, (image.height - height) // 2)
    return image.crop((left, top, left + width, top + height))


def _compose(assets: dict[str, Image.Image], size: tuple[int, int], pixel: int) -> Image.Image:
    width, height = size
    sky = assets["sky"].resize((SKY_W * pixel, SKY_H * pixel), NEAREST)
    canvas = _cover(sky, size).convert("RGBA")
    moon = assets["moon"].resize((assets["moon"].width * pixel, assets["moon"].height * pixel), NEAREST)
    meadow = assets["meadow"].resize(
        (assets["meadow"].width * pixel, assets["meadow"].height * pixel),
        NEAREST,
    )
    daisy = assets["daisy"].resize(
        (assets["daisy"].width * pixel, assets["daisy"].height * pixel),
        NEAREST,
    )
    canvas.alpha_composite(moon, (width - moon.width - int(width * 0.06), int(height * 0.05)))
    ground_y = height - meadow.height
    x = 0
    while x < width:
        canvas.alpha_composite(meadow, (x, ground_y))
        x += meadow.width
    canvas.alpha_composite(daisy, ((width - daisy.width) // 2, height - daisy.height - int(height * 0.02)))

    cell = CELL * pixel
    sheet = assets["petals"].resize((assets["petals"].width * pixel, assets["petals"].height * pixel), NEAREST)
    for index, (fx, fy, frame, variant) in enumerate(
        (
            (int(width * 0.18), int(height * 0.22), 3, 0),
            (int(width * 0.72), int(height * 0.30), 10, 1),
            (int(width * 0.30), int(height * 0.48), 16, 2),
            (int(width * 0.62), int(height * 0.58), 7, 0),
        )
    ):
        sprite = sheet.crop((frame * cell, variant * cell, (frame + 1) * cell, (variant + 1) * cell))
        canvas.alpha_composite(sprite, (fx, fy))
        if index > 6:
            break
    return canvas


def _neck_row(image: Image.Image) -> int:
    """First narrow row under the blossom, where the stem takes over."""
    pixels = image.load()
    widths: list[int] = []
    for y in range(image.height):
        left = -1
        right = -1
        for x in range(image.width):
            if pixels[x, y][3] > 40:
                if left < 0:
                    left = x
                right = x
        widths.append(0 if left < 0 else right - left + 1)
    search_end = max(1, int(image.height * 0.72))
    peak = max(range(search_end), key=lambda y: widths[y])
    limit = max(4, int(widths[peak] * 0.22))
    for y in range(peak, image.height):
        if 0 < widths[y] <= limit:
            return y
    return max(1, int(image.height * 0.42))


def _upscale(image: Image.Image, factor: int) -> Image.Image:
    return image.resize((image.width * factor, image.height * factor), NEAREST)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)

    assets = {
        "daisy": render_daisy(),
        "sky": render_sky(),
        "moon": render_moon(),
        "meadow": render_meadow(),
        "petals": render_petal_sheet(),
        "clouds": render_clouds(),
        "tokens": render_tokens(),
        "envelope": render_envelope(),
    }
    problems = verify(assets)
    if problems:
        for problem in problems:
            print(f"ERROR: {problem}", file=sys.stderr)
        return 1

    _save(assets["daisy"], OUT / "daisy.png")
    _save(assets["sky"], OUT / "night-sky.png")
    _save(assets["moon"], OUT / "moon.png")
    _save(assets["meadow"], OUT / "meadow.png")
    _save(assets["petals"], OUT / "petals.png")
    _save(assets["clouds"], OUT / "clouds.png")
    _save(assets["tokens"], OUT / "tokens.png")
    _save(assets["envelope"], OUT / "envelope.png")
    _save(_favicon(assets["daisy"]), OUT / "favicon.png")
    neck = _neck_row(assets["daisy"])

    manifest = {
        "sky": {"src": "night-sky.png", "width": assets["sky"].width, "height": assets["sky"].height},
        "moon": {"src": "moon.png", "width": assets["moon"].width, "height": assets["moon"].height},
        "meadow": {
            "src": "meadow.png",
            "width": assets["meadow"].width,
            "height": assets["meadow"].height,
            "ground": GROUND_Y,
        },
        "daisy": {
            "src": "daisy.png",
            "width": assets["daisy"].width,
            "height": assets["daisy"].height,
            "neck": neck,
        },
        "petals": {
            "src": "petals.png",
            "columns": FRAMES,
            "rows": VARIANTS,
            "cell": CELL,
        },
        "clouds": {
            "src": "clouds.png",
            "cellWidth": CLOUD_W,
            "cellHeight": CLOUD_H,
            "count": CLOUD_COUNT,
        },
        "tokens": {
            "src": "tokens.png",
            "cell": TOKEN_CELL,
            "count": TOKEN_COUNT,
        },
        "envelope": {
            "src": "envelope.png",
            "width": ENVELOPE_W,
            "height": ENVELOPE_H,
            "frames": ENVELOPE_COUNT,
        },
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    _save(_upscale(assets["daisy"], 4), BUILD / "daisy-4x.png")
    _save(_upscale(assets["moon"], 4), BUILD / "moon-4x.png")
    _save(_upscale(assets["meadow"], 3), BUILD / "meadow-3x.png")
    _save(_upscale(assets["petals"], 3), BUILD / "petals-3x.png")
    _save(_compose(assets, (420, 900), 3), BUILD / "preview-mobile.png")
    _save(_compose(assets, (1200, 760), 3), BUILD / "preview-desktop.png")

    kinds = _count_kinds(assets["daisy"])
    print("Generated assets")
    for name, image in assets.items():
        path = {
            "daisy": OUT / "daisy.png",
            "sky": OUT / "night-sky.png",
            "moon": OUT / "moon.png",
            "meadow": OUT / "meadow.png",
            "petals": OUT / "petals.png",
            "clouds": OUT / "clouds.png",
            "tokens": OUT / "tokens.png",
            "envelope": OUT / "envelope.png",
        }[name]
        print(f"  {path.relative_to(ROOT)}  {image.width}x{image.height}  {path.stat().st_size} bytes")
    print(f"  daisy pixels  white={kinds['white']} yellow={kinds['yellow']} green={kinds['green']} clear={kinds['clear']}")
    print("Verification passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
