"""Small meadow objects: a pebble and a closed bud."""

from __future__ import annotations

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import CENTER, GRASS, PETAL, PETAL_SHADOW, rgba

STONE = rgba(169, 185, 210)
STONE_DARK = rgba(90, 108, 140)

CELL = 16
COUNT = 2


def _pebble(grid: PixelGrid) -> None:
    body = (
        "......####......",
        "....########....",
        "...##########...",
        "..############..",
        "..############..",
        "...##########...",
        "....########....",
        "......####......",
    )
    for y, row in enumerate(body):
        for x, mark in enumerate(row):
            if mark == "#":
                grid.set(x, y + 4, STONE_DARK if y > 5 else STONE)


def _bud(grid: PixelGrid, origin: int) -> None:
    for y in range(8, 15):
        grid.set(origin + 8, y, GRASS)
    grid.set(origin + 7, 9, GRASS)
    for y, row in enumerate(
        (
            ".....##.",
            "...#####",
            "..######",
            "...#####",
            "....##..",
        )
    ):
        for x, mark in enumerate(row):
            if mark != "#":
                continue
            color = PETAL if x + y < 6 else PETAL_SHADOW
            if x == 3 or x == 4:
                color = CENTER
            grid.set(origin + 4 + x, 3 + y, color)


def render_tokens() -> Image.Image:
    grid = PixelGrid(CELL * COUNT, CELL)
    _pebble(grid)
    _bud(grid, CELL)
    return grid.to_image()
