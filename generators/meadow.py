"""Seamless meadow strip: transparent sky, blades, then solid ground."""

from __future__ import annotations

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import (
    CENTER,
    GRASS,
    GRASS_DARK,
    GRASS_LIGHT,
    GRASS_TIP,
    GROUND,
    GROUND_DEEP,
    PETAL,
)

WIDTH = 256
HEIGHT = 96
GROUND_Y = 58


def _mix(x: int, y: int = 0) -> int:
    wrapped = x % WIDTH
    value = (wrapped * 374761393 + y * 668265263 + 12345) & 0x7FFFFFFF
    return (value ^ (value >> 13)) & 0x7FFFFFFF


def _draw_blade(grid: PixelGrid, x: int, height: int, body: tuple[int, int, int, int]) -> None:
    for step in range(height):
        color = GRASS_TIP if step >= height - 2 else body
        grid.set(x % WIDTH, GROUND_Y - 1 - step, color)


def _draw_tiny_flower(grid: PixelGrid, x: int) -> None:
    roll = _mix(x, 3)
    height = 16 + (roll % 12)
    y = GROUND_Y - height
    grid.set(x % WIDTH, y, PETAL)
    grid.set((x - 1) % WIDTH, y + 1, PETAL)
    grid.set((x + 1) % WIDTH, y + 1, PETAL)
    grid.set(x % WIDTH, y + 2, PETAL)
    grid.set(x % WIDTH, y + 1, CENTER)


def render_meadow() -> Image.Image:
    grid = PixelGrid(WIDTH, HEIGHT)
    for y in range(GROUND_Y, HEIGHT):
        progress = (y - GROUND_Y) / max(1, HEIGHT - 1 - GROUND_Y)
        for x in range(WIDTH):
            patch = _mix(x // 4, y // 3) % 6
            if progress < 0.35:
                color = GRASS_DARK if patch in (0, 1) else GROUND
            elif patch == 0:
                color = GROUND_DEEP
            elif progress > 0.72 and patch in (1, 2):
                color = GROUND_DEEP
            else:
                color = GROUND
            grid.set(x, y, color)

    bodies = (GRASS_DARK, GRASS, GRASS, GRASS_LIGHT)
    for x in range(WIDTH):
        roll = _mix(x, 1)
        if roll % 3 == 0:
            _draw_blade(grid, x, 7 + (roll % 10), GRASS_DARK)
        if roll % 4 != 0:
            continue
        height = 12 + (_mix(x, 2) % 22)
        _draw_blade(grid, x, height, bodies[roll % 4])
        if roll % 9 == 0:
            _draw_blade(grid, x + 1, max(8, height - 4), GRASS_DARK)
        if roll % 53 == 7:
            _draw_tiny_flower(grid, x)

    return grid.to_image()
