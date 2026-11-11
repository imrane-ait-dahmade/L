"""A closed envelope and the same envelope with the flap lifted."""

from __future__ import annotations

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import rgba

CELL_W = 48
CELL_H = 36
COUNT = 2

PAPER = rgba(245, 235, 209)
SHADE = rgba(214, 206, 186)
INTERIOR = rgba(23, 45, 85)
SEAL = rgba(233, 169, 200)


def _fill(grid: PixelGrid, origin: int, x0: int, y0: int, x1: int, y1: int, color) -> None:
    for y in range(y0, y1):
        for x in range(x0, x1):
            grid.set(origin + x, y, color)


def _triangle(grid: PixelGrid, origin: int, apex_y: int, base_y: int, color) -> None:
    start = min(apex_y, base_y)
    end = max(apex_y, base_y)
    span = end - start or 1
    for y in range(start, end + 1):
        reach = abs(y - apex_y) / span
        half = max(1, round(reach * 18))
        for x in range(24 - half, 25 + half):
            grid.set(origin + x, y, color)


def _closed(grid: PixelGrid, origin: int) -> None:
    _fill(grid, origin, 6, 14, 42, 32, PAPER)
    _fill(grid, origin, 6, 28, 42, 32, SHADE)
    _triangle(grid, origin, 22, 12, SHADE)
    _fill(grid, origin, 22, 20, 26, 24, SEAL)


def _open(grid: PixelGrid, origin: int) -> None:
    _triangle(grid, origin, 4, 16, PAPER)
    _fill(grid, origin, 6, 16, 42, 33, PAPER)
    _fill(grid, origin, 9, 18, 39, 30, INTERIOR)
    _fill(grid, origin, 6, 29, 42, 33, SHADE)


def render_envelope() -> Image.Image:
    grid = PixelGrid(CELL_W * COUNT, CELL_H)
    _closed(grid, 0)
    _open(grid, CELL_W)
    return grid.to_image()
