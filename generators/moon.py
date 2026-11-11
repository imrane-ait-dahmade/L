"""Glowing full moon on a transparent background."""

from __future__ import annotations

import math

from PIL import Image

from generators.grid import PixelGrid
from generators.palette import MOON, MOON_DEEP, MOON_GLOW, MOON_HIGHLIGHT, MOON_SHADE

SIZE = 52
CENTER = SIZE // 2
DISK_RADIUS = 16


def _glow_alpha(distance: float) -> int:
    extra = distance - DISK_RADIUS
    if extra > 5:
        return 22
    if extra > 3:
        return 48
    return 84


def render_moon() -> Image.Image:
    grid = PixelGrid(SIZE, SIZE)
    glow_radius = DISK_RADIUS + 7
    for y in range(SIZE):
        for x in range(SIZE):
            dx = (x + 0.5) - CENTER
            dy = (y + 0.5) - CENTER
            distance = math.hypot(dx, dy)
            if distance > glow_radius:
                continue
            if distance > DISK_RADIUS:
                grid.set(x, y, (MOON_GLOW[0], MOON_GLOW[1], MOON_GLOW[2], _glow_alpha(distance)))
                continue
            # The bright limb sits on the upper left of the disc.
            light = -dx * 0.55 - dy * 0.42
            if distance >= DISK_RADIUS - 1.05 and light < 2:
                color = MOON_DEEP
            elif light > 6.5:
                color = MOON_HIGHLIGHT
            elif light > 0.5:
                color = MOON
            elif light > -5:
                color = MOON_SHADE
            else:
                color = MOON_DEEP
            grid.set(x, y, color)

    craters = ((-5, 2, 2), (4, 4, 2), (1, -5, 1), (-2, 6, 1), (6, -1, 1))
    for cx, cy, radius in craters:
        for y in range(CENTER + cy - radius, CENTER + cy + radius + 1):
            for x in range(CENTER + cx - radius, CENTER + cx + radius + 1):
                if math.hypot(x - (CENTER + cx), y - (CENTER + cy)) > radius + 0.15:
                    continue
                if math.hypot((x + 0.5) - CENTER, (y + 0.5) - CENTER) >= DISK_RADIUS - 0.4:
                    continue
                grid.set(x, y, MOON_DEEP if radius > 1 else MOON_SHADE)
        grid.set(CENTER + cx, CENTER + cy, MOON_DEEP)

    for dx, dy in ((-5, -7), (-4, -8), (-6, -6), (-3, -7)):
        if math.hypot(dx, dy) < DISK_RADIUS - 1:
            grid.set(CENTER + dx, CENTER + dy, MOON_HIGHLIGHT)

    return grid.to_image()
