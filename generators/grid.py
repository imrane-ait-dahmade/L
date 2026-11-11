"""Tiny RGBA pixel buffer with cropping and source-over blending."""

from __future__ import annotations

from PIL import Image

from generators.palette import RGBA


class PixelGrid:
    """A sparse-friendly grid. Empty pixels stay fully transparent."""

    def __init__(self, width: int, height: int) -> None:
        if width < 1 or height < 1:
            raise ValueError("grid dimensions must be positive")
        self.width = width
        self.height = height
        self._rows: list[list[RGBA | None]] = [[None] * width for _ in range(height)]

    def get(self, x: int, y: int) -> RGBA | None:
        if 0 <= x < self.width and 0 <= y < self.height:
            return self._rows[y][x]
        return None

    def set(self, x: int, y: int, color: RGBA) -> None:
        if color[3] <= 0:
            return
        if 0 <= x < self.width and 0 <= y < self.height:
            self._rows[y][x] = color

    def blend(self, x: int, y: int, color: RGBA) -> None:
        """Source-over blend. Used for the contact shadow and moon glow."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return
        source_alpha = color[3] / 255
        if source_alpha <= 0:
            return
        existing = self._rows[y][x]
        if existing is None or existing[3] == 0:
            self._rows[y][x] = color
            return
        dest_alpha = existing[3] / 255
        out_alpha = source_alpha + dest_alpha * (1 - source_alpha)
        if out_alpha <= 0:
            return
        channels: list[int] = []
        for index in range(3):
            mixed = (
                color[index] * source_alpha
                + existing[index] * dest_alpha * (1 - source_alpha)
            ) / out_alpha
            channels.append(max(0, min(255, round(mixed))))
        self._rows[y][x] = (channels[0], channels[1], channels[2], round(out_alpha * 255))

    def cropped(self, pad: int = 2) -> PixelGrid:
        min_x, min_y = self.width, self.height
        max_x, max_y = -1, -1
        for y, row in enumerate(self._rows):
            for x, color in enumerate(row):
                if color is None or color[3] == 0:
                    continue
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
        if max_x < 0:
            return PixelGrid(1, 1)
        min_x = max(0, min_x - pad)
        min_y = max(0, min_y - pad)
        max_x = min(self.width - 1, max_x + pad)
        max_y = min(self.height - 1, max_y + pad)
        cropped = PixelGrid(max_x - min_x + 1, max_y - min_y + 1)
        for y in range(min_y, max_y + 1):
            for x in range(min_x, max_x + 1):
                color = self._rows[y][x]
                if color is not None:
                    cropped._rows[y - min_y][x - min_x] = color
        return cropped

    def to_image(self) -> Image.Image:
        image = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        pixels = image.load()
        for y, row in enumerate(self._rows):
            for x, color in enumerate(row):
                if color is not None:
                    pixels[x, y] = color
        return image
