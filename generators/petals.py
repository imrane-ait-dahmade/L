"""Tumbling petal sprites, pre-rotated so the canvas never filters them."""

from __future__ import annotations

import math

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import (
    PETAL,
    PETAL_COOL,
    PETAL_COOL_SHADOW,
    PETAL_DEEP,
    PETAL_EDGE,
    PETAL_HIGHLIGHT,
    PETAL_SHADOW,
    PETAL_WARM,
    PETAL_WARM_SHADOW,
    RGBA,
)
from generators.petal_shape import rasterize_petal

CELL = 24
FRAMES = 24
VARIANTS = 3
LIGHT = (0.55, 0.84)

_PALETTES: tuple[dict[str, RGBA], ...] = (
    {
        "highlight": PETAL_HIGHLIGHT,
        "body": PETAL,
        "shadow": PETAL_SHADOW,
        "deep": PETAL_DEEP,
        "edge": PETAL_EDGE,
    },
    {
        "highlight": PETAL_HIGHLIGHT,
        "body": PETAL_WARM,
        "shadow": PETAL_WARM_SHADOW,
        "deep": PETAL_SHADOW,
        "edge": PETAL_EDGE,
    },
    {
        "highlight": PETAL_COOL,
        "body": PETAL_COOL,
        "shadow": PETAL_COOL_SHADOW,
        "deep": PETAL_DEEP,
        "edge": PETAL_EDGE,
    },
)
# Shape 0 matches the daisy petal. Shape 2 is a rounder companion petal.
_SPECS = (
    (14.0, 3.85, 0),
    (12.5, 3.45, 0),
    (11.5, 4.05, 2),
)


def _color(angle: float, local_x: float, local_y: float, length: float, edge: bool, variant: int) -> RGBA:
    palette = _PALETTES[variant]
    light_x, light_y = LIGHT
    magnitude = math.hypot(light_x, light_y)
    light_x /= magnitude
    light_y /= magnitude
    axis_light = math.cos(angle) * light_x + math.sin(angle) * light_y
    facing = local_y * (-math.sin(angle) * light_x + math.cos(angle) * light_y)
    progress = local_x / length
    if axis_light > 0.2 and abs(local_y) < 1.05 and 0.28 < progress < 0.8:
        color = palette["highlight"]
    elif facing >= 0 and axis_light > -0.35:
        color = palette["body"]
    elif axis_light > -0.7:
        color = palette["shadow"]
    else:
        color = palette["deep"]
    if edge and axis_light < 0.8:
        return palette["edge"]
    return color


def render_petal_sheet() -> Image.Image:
    """24 rotation frames by 3 petal variants. Cell origin is the top-left."""
    sheet = PixelGrid(CELL * FRAMES, CELL * VARIANTS)
    origin = CELL / 2
    for variant in range(VARIANTS):
        length, half_width, shape = _SPECS[variant]
        for frame in range(FRAMES):
            angle = math.pi / 2 - frame * (math.tau / FRAMES)
            samples = rasterize_petal(
                origin,
                origin,
                angle,
                inner=-length / 2,
                length=length,
                half_width=half_width,
                variant=shape,
                min_x=0,
                min_y=0,
                max_x=CELL - 1,
                max_y=CELL - 1,
            )
            ox = frame * CELL
            oy = variant * CELL
            for sample in samples:
                sheet.set(
                    ox + sample.x,
                    oy + sample.y,
                    _color(angle, sample.local_x, sample.local_y, length, sample.edge, variant),
                )
    return sheet.to_image()
