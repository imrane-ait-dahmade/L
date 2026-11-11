"""Small night clouds. They stay faint so the stars remain visible."""

from __future__ import annotations

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import RGBA

CELL_W = 46
CELL_H = 18
COUNT = 3

_BODY = (186, 204, 224, 118)
_TOP = (214, 224, 236, 96)
_EDGE = (160, 178, 206, 64)

# Three hand-placed puff layouts, in cell-local pixels.
_SHAPES: tuple[tuple[tuple[int, int, int, int], ...], ...] = (
    ((10, 9, 8, 4), (20, 7, 10, 5), (30, 9, 8, 4), (18, 11, 12, 3)),
    ((12, 10, 7, 3), (22, 8, 9, 4), (31, 10, 6, 3)),
    ((8, 9, 6, 3), (16, 7, 11, 5), (28, 9, 8, 4), (20, 12, 8, 3)),
)


def _stamp(grid: PixelGrid, origin: int, cx: int, cy: int, rx: int, ry: int) -> None:
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            distance = (x / rx) ** 2 + (y / ry) ** 2
            if distance > 1:
                continue
            if distance > 0.78:
                color: RGBA = _EDGE
            elif y < 0:
                color = _TOP
            else:
                color = _BODY
            grid.set(origin + cx + x, cy + y, color)


def render_clouds() -> Image.Image:
    grid = PixelGrid(CELL_W * COUNT, CELL_H)
    for index, puffs in enumerate(_SHAPES):
        origin = index * CELL_W
        for cx, cy, rx, ry in puffs:
            _stamp(grid, origin, cx, cy, rx, ry)
    return grid.to_image()
