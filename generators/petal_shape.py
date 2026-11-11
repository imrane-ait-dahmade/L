"""Shared daisy-petal raster used by the flower and the falling-petal sheet."""

from __future__ import annotations

import math
from dataclasses import dataclass

# 0 long daisy petal, 1 narrower under-petal, 2 rounder sprite petal.
VARIANTS = (0, 1, 2)


@dataclass(frozen=True)
class PetalSample:
    x: int
    y: int
    local_x: float
    local_y: float
    edge: bool


def _profile(t: float, variant: int) -> float:
    """Width factor from 0 at the base and tip to 1 at the fullest point."""
    if t < 0.0 or t > 1.0:
        return 0.0
    if variant == 1:
        return math.sin(math.pi * (t**0.9)) ** 0.95 * 0.82
    if variant == 2:
        return math.sin(math.pi * (t**0.8)) ** 0.5
    return math.sin(math.pi * (t**0.68)) ** 0.58


def _inside(local_x: float, local_y: float, length: float, half_width: float, variant: int) -> bool:
    if length <= 0:
        return False
    return abs(local_y) <= half_width * _profile(local_x / length, variant)


def rasterize_petal(
    origin_x: float,
    origin_y: float,
    angle: float,
    inner: float,
    length: float,
    half_width: float,
    variant: int,
    *,
    min_x: int,
    min_y: int,
    max_x: int,
    max_y: int,
) -> list[PetalSample]:
    """Rasterize one petal.

    ``angle`` uses math coordinates: 0 points right, pi/2 points up.
    ``origin`` is the flower center in pixel space, where y grows downward.
    ``inner`` is the distance from the center to the petal base. A negative
    inner centers a lone petal on the origin, which the sprite sheet needs.
    """
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    covered: dict[tuple[int, int], tuple[float, float]] = {}

    for py in range(min_y, max_y + 1):
        for px in range(min_x, max_x + 1):
            hits: list[tuple[float, float]] = []
            for oy in (0.3, 0.7):
                for ox in (0.3, 0.7):
                    math_x = (px + ox) - origin_x
                    math_y = origin_y - (py + oy)
                    local_along = math_x * cos_a + math_y * sin_a - inner
                    local_across = -math_x * sin_a + math_y * cos_a
                    if _inside(local_along, local_across, length, half_width, variant):
                        hits.append((local_along, local_across))
            if len(hits) >= 2:
                along = sum(hit[0] for hit in hits) / len(hits)
                across = sum(hit[1] for hit in hits) / len(hits)
                covered[(px, py)] = (along, across)

    samples: list[PetalSample] = []
    for (px, py), (along, across) in covered.items():
        edge = False
        for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
            if (nx, ny) not in covered:
                edge = True
                break
        samples.append(PetalSample(px, py, along, across, edge))
    return samples
