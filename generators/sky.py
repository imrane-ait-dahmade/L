"""Deep navy night sky: a fine quantized gradient, then a seeded star field."""

from __future__ import annotations

import random

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import STAR, STAR_BLUE, STAR_DIM, STAR_GOLD

WIDTH = 360
HEIGHT = 240
SEED = 20261110

# Ordered dither breaks the horizontal steps a quantized gradient would leave.
_BAYER = (
    (0, 8, 2, 10),
    (12, 4, 14, 6),
    (3, 11, 1, 9),
    (15, 7, 13, 5),
)

_TOP = (9, 21, 45)
_MID = (23, 45, 85)
_LOW = (70, 104, 158)


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[float, float, float]:
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def _gradient(y: int) -> tuple[float, float, float]:
    t = y / (HEIGHT - 1)
    if t < 0.58:
        return _lerp(_TOP, _MID, t / 0.58)
    return _lerp(_MID, _LOW, (t - 0.58) / 0.42)


def _moon_lift(x: int, y: int) -> float:
    """Broad upper-right light so the separate moon always sits in a glow."""
    nx = x / (WIDTH - 1)
    ny = y / (HEIGHT - 1)
    if nx <= 0.4 or ny >= 0.62:
        return 0.0
    return ((nx - 0.4) / 0.6) * ((0.62 - ny) / 0.62)


def _quantize(value: float) -> int:
    stepped = int(value / 4 + 0.5) * 4
    return max(0, min(252, stepped))


def _sky_color(x: int, y: int) -> tuple[int, int, int]:
    red, green, blue = _gradient(y)
    lift = _moon_lift(x, y)
    red += 14 * lift
    green += 18 * lift
    blue += 28 * lift
    # A small dither keeps neighboring rows from forming a hard stripe.
    wobble = (_BAYER[y & 3][x & 3] - 7.5) / 7.5
    red += wobble * 2.5
    green += wobble * 2.5
    blue += wobble * 3.0
    return (_quantize(red), _quantize(green), _quantize(blue))


def _paint_star(grid: PixelGrid, x: int, y: int, color: tuple[int, int, int, int], kind: str) -> None:
    grid.set(x, y, color)
    if kind == "cross":
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            grid.set(x + dx, y + dy, color)
    elif kind == "bold":
        grid.set(x + 1, y, color)
        grid.set(x, y + 1, color)
        grid.set(x + 1, y + 1, color)


def _paint_stars(grid: PixelGrid) -> None:
    rng = random.Random(SEED)
    for _ in range(210):
        x = rng.randrange(2, WIDTH - 2)
        y = rng.randrange(2, int(HEIGHT * 0.92))
        roll = rng.random()
        if roll > 0.95:
            _paint_star(grid, x, y, STAR, "cross")
        elif roll > 0.88:
            _paint_star(grid, x, y, STAR_GOLD if rng.random() > 0.5 else STAR, "bold")
        elif roll > 0.74:
            _paint_star(grid, x, y, STAR_BLUE, "point")
        elif roll > 0.36:
            _paint_star(grid, x, y, STAR, "point")
        else:
            _paint_star(grid, x, y, STAR_DIM, "point")


def render_sky() -> Image.Image:
    grid = PixelGrid(WIDTH, HEIGHT)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            red, green, blue = _sky_color(x, y)
            grid.set(x, y, (red, green, blue, 255))
    _paint_stars(grid)
    return grid.to_image()
