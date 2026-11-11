"""Procedural white daisy on a transparent background."""

from __future__ import annotations

import math

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import (
    CENTER,
    CENTER_DARK,
    CENTER_DEEP,
    CENTER_LIGHT,
    CENTER_MID,
    GRASS,
    GRASS_DARK,
    GRASS_LIGHT,
    GRASS_TIP,
    LEAF,
    LEAF_DARK,
    LEAF_LIGHT,
    LEAF_VEIN,
    PETAL,
    PETAL_DEEP,
    PETAL_EDGE,
    PETAL_HIGHLIGHT,
    PETAL_SHADOW,
    RGBA,
    STEM,
    STEM_DARK,
    STEM_DEEP,
    STEM_LIGHT,
)
from generators.petal_shape import rasterize_petal

WIDTH = 104
HEIGHT = 156
CENTER_X = 52
CENTER_Y = 48
CENTER_RADIUS = 10
STEM_BOTTOM = 146
PETAL_COUNT = 12
INNER = 6.0
PETAL_LENGTH = 20.0
HALF_WIDTH = 3.55
LIGHT = (0.50, 0.86)  # upper right, where the moon sits; y is up

_UNDER_BODY = (226, 230, 240, 255)
_UNDER_SHADOW = (176, 188, 214, 255)
_UNDER_EDGE = (132, 148, 184, 255)


def _unit(vector: tuple[float, float]) -> tuple[float, float]:
    magnitude = math.hypot(vector[0], vector[1])
    return (vector[0] / magnitude, vector[1] / magnitude)


def _petal_color(angle: float, local_x: float, local_y: float, edge: bool, under: bool) -> RGBA:
    light_x, light_y = _unit(LIGHT)
    axis_light = math.cos(angle) * light_x + math.sin(angle) * light_y
    # Positive when this side of the petal faces the moon.
    facing = local_y * (-math.sin(angle) * light_x + math.cos(angle) * light_y)
    progress = local_x / PETAL_LENGTH

    if under:
        color = _UNDER_BODY if facing >= 0 else _UNDER_SHADOW
        if edge:
            return _UNDER_EDGE
        return color

    if axis_light > 0.15 and abs(local_y) < 1.15 and 0.30 < progress < 0.84:
        color: RGBA = PETAL_HIGHLIGHT
    elif axis_light > -0.2 and facing >= -0.4:
        color = PETAL
    elif axis_light > -0.62:
        color = PETAL_SHADOW
    else:
        color = PETAL_DEEP
    if edge and axis_light < 0.72:
        return PETAL_EDGE
    return color


def _draw_petals(grid: PixelGrid, under: bool) -> None:
    count = PETAL_COUNT
    step = math.tau / count
    start = math.pi / 2 + (step / 2 if under else 0.0)
    length = PETAL_LENGTH * (0.62 if under else 1.0)
    half_width = HALF_WIDTH * (0.72 if under else 1.0)
    inner = INNER if not under else INNER + 1.0
    angles = sorted((start + index * step for index in range(count)), key=math.sin)
    reach = int(math.ceil(inner + length + half_width + 3))

    for angle in angles:
        # Slight organic difference between neighbors, stable across runs.
        index_wave = math.sin(angle * count)
        petal_length = length + (0.7 if index_wave > 0 else -0.35)
        samples = rasterize_petal(
            CENTER_X,
            CENTER_Y,
            angle,
            inner,
            petal_length,
            half_width,
            1 if under else 0,
            min_x=CENTER_X - reach,
            min_y=CENTER_Y - reach,
            max_x=CENTER_X + reach,
            max_y=CENTER_Y + reach,
        )
        for sample in samples:
            grid.set(
                sample.x,
                sample.y,
                _petal_color(angle, sample.local_x, sample.local_y, sample.edge and not under, under),
            )


def _stem_x(y: int, stem_top: int) -> int:
    span = max(1, STEM_BOTTOM - stem_top)
    progress = (y - stem_top) / span
    return CENTER_X + int(round(math.sin(progress * math.pi) * 1.5))


def _draw_stem(grid: PixelGrid) -> int:
    stem_top = CENTER_Y + CENTER_RADIUS - 3
    for y in range(stem_top, STEM_BOTTOM + 1):
        progress = (y - stem_top) / max(1, STEM_BOTTOM - stem_top)
        x = _stem_x(y, stem_top)
        columns = (-1, 0, 1) if progress > 0.12 else (0, 1)
        for offset in columns:
            if offset > 0:
                color = STEM_LIGHT
            elif offset == 0:
                color = STEM if y % 9 else STEM_DARK
            else:
                color = STEM_DEEP if progress > 0.72 else STEM_DARK
            grid.set(x + offset, y, color)
    return stem_top


def _draw_leaf(
    grid: PixelGrid,
    origin_x: int,
    origin_y: int,
    direction: int,
    length: int,
    half_width: float,
) -> None:
    for step in range(length):
        progress = step / max(1, length - 1)
        x = origin_x + direction * step
        y = origin_y - int(round(step * 0.46))
        half = math.sin(math.pi * progress) ** 0.8 * half_width
        offset = -int(math.ceil(half))
        while offset <= half:
            if abs(offset) <= half:
                if abs(offset) <= 0.5:
                    color = LEAF_VEIN
                elif offset > 0:
                    color = LEAF_DARK
                elif direction > 0:
                    color = LEAF_LIGHT
                else:
                    color = LEAF
                if abs(offset) >= half - 0.75:
                    color = LEAF_DARK if offset > 0 else LEAF
                grid.set(x, y + offset, color)
            offset += 1


def _draw_leaves(grid: PixelGrid, stem_top: int) -> None:
    span = STEM_BOTTOM - stem_top
    attachments = (
        (0.40, -1, 18, 4.3),
        (0.58, 1, 16, 3.8),
        (0.74, -1, 12, 3.1),
    )
    for progress, direction, length, half_width in attachments:
        y = stem_top + int(span * progress)
        x = _stem_x(y, stem_top) + (1 if direction > 0 else -1)
        _draw_leaf(grid, x, y, direction, length, half_width)


def _draw_center(grid: PixelGrid) -> None:
    radius = CENTER_RADIUS
    for y in range(CENTER_Y - radius - 1, CENTER_Y + radius + 2):
        for x in range(CENTER_X - radius - 1, CENTER_X + radius + 2):
            dx = (x + 0.5) - CENTER_X
            dy = (y + 0.5) - CENTER_Y
            distance = math.hypot(dx, dy * 1.04)
            if distance > radius:
                continue
            # Moonlight arrives from the upper right. Screen y grows downward,
            # so "up" is a negative dy.
            light = dx * 0.55 - dy * 0.42
            if distance >= radius - 1.15:
                color = CENTER_DEEP
            elif light > 3.2:
                color = CENTER_LIGHT
            elif light > 0.4:
                color = CENTER
            else:
                color = CENTER_MID
            grid.set(x, y, color)

    golden = math.pi * (3 - math.sqrt(5))
    for index in range(46):
        ring = 1.2 * math.sqrt(index)
        if ring > radius - 1.6:
            continue
        theta = index * golden
        x = int(round(CENTER_X + math.cos(theta) * ring))
        y = int(round(CENTER_Y + math.sin(theta) * ring * 0.96))
        grid.set(x, y, CENTER_DARK if index % 2 == 0 else CENTER_DEEP)

    for dx, dy in ((-2, -3), (-1, -3), (-3, -2), (0, -4)):
        grid.set(CENTER_X + dx, CENTER_Y + dy, CENTER_LIGHT)


def _draw_shadow(grid: PixelGrid) -> None:
    for dy in range(-2, 3):
        for dx in range(-16, 17):
            ellipse = (dx / 16) ** 2 + (dy / 2.3) ** 2
            if ellipse > 1:
                continue
            alpha = 78 if ellipse < 0.35 else 46 if ellipse < 0.7 else 22
            grid.blend(CENTER_X + dx, STEM_BOTTOM + dy, (6, 16, 10, alpha))


def _draw_tufts(grid: PixelGrid) -> None:
    specs = (
        (-10, 8, GRASS_DARK, GRASS),
        (-6, 11, GRASS, GRASS_LIGHT),
        (-2, 7, GRASS_DARK, GRASS),
        (3, 12, GRASS, GRASS_TIP),
        (7, 9, GRASS_DARK, GRASS_LIGHT),
        (11, 6, GRASS, GRASS),
        (14, 8, GRASS_DARK, GRASS_LIGHT),
    )
    for offset, height, body, tip in specs:
        x = CENTER_X + offset
        for step in range(height):
            grid.set(x, STEM_BOTTOM - step, tip if step >= height - 2 else body)
        if height > 6:
            lean = 1 if offset >= 0 else -1
            grid.set(x + lean, STEM_BOTTOM - height + 2, tip)


def render_daisy() -> Image.Image:
    """Return a cropped daisy sprite with a transparent background."""
    grid = PixelGrid(WIDTH, HEIGHT)
    _draw_shadow(grid)
    stem_top = _draw_stem(grid)
    _draw_leaves(grid, stem_top)
    _draw_petals(grid, under=True)
    _draw_petals(grid, under=False)
    _draw_center(grid)
    _draw_tufts(grid)
    return grid.cropped(pad=2).to_image()
