"""Shared night-meadow palette. Every asset snaps to these colors."""

from __future__ import annotations

RGBA = tuple[int, int, int, int]
RGB = tuple[int, int, int]


def rgba(red: int, green: int, blue: int, alpha: int = 255) -> RGBA:
    return (red, green, blue, alpha)


# Sky, listed dark to light. Anchored to the night palette:
# #09152D, #172D55, and the lighter blue above the meadow.
SKY: tuple[RGB, ...] = (
    (9, 21, 45),
    (12, 26, 54),
    (16, 34, 68),
    (23, 45, 85),
    (32, 58, 108),
    (46, 74, 128),
    (64, 96, 150),
    (86, 118, 168),
)

MOON = rgba(255, 244, 214)
MOON_HIGHLIGHT = rgba(255, 252, 242)
MOON_SHADE = rgba(236, 214, 168)
MOON_DEEP = rgba(214, 184, 132)
MOON_GLOW = rgba(255, 232, 190)

PETAL_HIGHLIGHT = rgba(255, 254, 252)
PETAL = rgba(247, 244, 238)
PETAL_SHADOW = rgba(206, 214, 230)
PETAL_DEEP = rgba(164, 178, 208)
PETAL_EDGE = rgba(118, 136, 174)

PETAL_WARM = rgba(255, 248, 236)
PETAL_WARM_SHADOW = rgba(226, 214, 196)
PETAL_COOL = rgba(236, 242, 250)
PETAL_COOL_SHADOW = rgba(186, 202, 224)

CENTER_LIGHT = rgba(255, 226, 132)
CENTER = rgba(242, 192, 58)
CENTER_MID = rgba(214, 148, 36)
CENTER_DARK = rgba(168, 102, 28)
CENTER_DEEP = rgba(132, 74, 24)

STEM_LIGHT = rgba(118, 184, 92)
STEM = rgba(52, 136, 70)
STEM_DARK = rgba(30, 92, 50)
STEM_DEEP = rgba(20, 62, 34)

LEAF_LIGHT = rgba(132, 196, 98)
LEAF = rgba(58, 148, 74)
LEAF_DARK = rgba(32, 100, 52)
LEAF_VEIN = rgba(24, 78, 42)

GRASS_TIP = rgba(183, 206, 147)
GRASS_LIGHT = rgba(110, 168, 96)
GRASS = rgba(44, 124, 62)
GRASS_DARK = rgba(28, 84, 44)
GROUND = rgba(22, 72, 38)
GROUND_DEEP = rgba(14, 48, 26)

SHADOW = rgba(6, 16, 10, 0)

STAR = rgba(245, 235, 209)
STAR_DIM = rgba(169, 185, 232)
STAR_BLUE = rgba(169, 185, 232)
STAR_GOLD = rgba(245, 220, 180)
