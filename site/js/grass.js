import { sampleSin } from "./wind.js";

/**
 * Redraws the meadow tile so each blade column sways on the pixel grid.
 * The ground stays put. Work is done at art resolution, then scaled up crisp.
 */
export function createGrass(canvas, image, tileWidth, tileHeight, groundY) {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = tileWidth;
  sourceCanvas.height = tileHeight;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(image, 0, 0);
  const source = sourceContext.getImageData(0, 0, tileWidth, tileHeight).data;

  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: false });
  let viewWidth = 1;
  let pixel = 2;
  let output = null;
  let phases = new Float32Array(1);

  function resize(nextPixel) {
    pixel = nextPixel;
    const parent = canvas.parentElement;
    const cssWidth = parent ? parent.clientWidth : tileWidth * pixel;
    viewWidth = Math.max(1, Math.ceil(cssWidth / pixel));
    canvas.width = viewWidth;
    canvas.height = tileHeight;
    canvas.style.width = `${viewWidth * pixel}px`;
    canvas.style.height = `${tileHeight * pixel}px`;
    output = new ImageData(viewWidth, tileHeight);
    if (phases.length < viewWidth) {
      phases = new Float32Array(viewWidth);
    }
  }

  function draw(wind, enabled, look) {
    if (!output) {
      return;
    }
    const time = wind.time;
    const gust = enabled ? 0.72 + wind.value * 0.28 : 0;
    const limit = Math.min(viewWidth, phases.length);
    const ease = enabled ? 1 - Math.exp(-(wind.dt || 0.016) * 1.6) : 1;
    for (let x = 0; x < limit; x += 1) {
      const column = x & ~1;
      const sway = sampleSin(time * 0.16 + column * 0.018) * (0.65 + 0.35 * sampleSin(column * 0.07));
      phases[x] += (sway - phases[x]) * ease;
    }
    const data = output.data;
    const drift = enabled ? Math.round((look?.x || 0) * 4) : 0;
    const scroll = drift;
    for (let y = 0; y < tileHeight; y += 1) {
      const above = groundY - 1 - y;
      const reach = above > 0 ? (above / groundY) * 2.05 * gust : 0;
      const row = y * viewWidth;
      for (let x = 0; x < viewWidth; x += 1) {
        let sampleX = x + scroll;
        if (reach > 0) {
          sampleX += Math.round(phases[x] * reach);
        }
        sampleX %= tileWidth;
        if (sampleX < 0) {
          sampleX += tileWidth;
        }
        const from = (y * tileWidth + sampleX) * 4;
        const to = (row + x) * 4;
        data[to] = source[from];
        data[to + 1] = source[from + 1];
        data[to + 2] = source[from + 2];
        data[to + 3] = source[from + 3];
      }
    }
    context.putImageData(output, 0, 0);
  }

  return { resize, draw };
}
