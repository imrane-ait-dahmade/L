import { sampleSin } from "./wind.js";

/**
 * Draws the daisy in art pixels: the stem bends with the wind,
 * the head leans, and a touch opens the blossom for a moment.
 */
export function createFlower(canvas, image, neck) {
  const context = canvas.getContext("2d", { alpha: true });
  const width = image.width;
  const height = image.height;
  let pixel = 2;
  let impulse = 0;
  let glowBoost = 0;
  let bloomAmount = 0;
  let stem = 0;
  let nod = 0;
  let lean = 0;

  function resize(nextPixel) {
    pixel = nextPixel;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width * pixel}px`;
    canvas.style.height = `${height * pixel}px`;
  }

  function rustle() {
    impulse = 1;
  }

  function notice() {
    glowBoost = 1;
  }

  function bloom() {
    bloomAmount = 1;
    glowBoost = 1;
  }

  function glide(current, target, dt, rate) {
    return current + (target - current) * (1 - Math.exp(-dt * rate));
  }

  function update(dt, enabled, wind) {
    if (!enabled || !wind) {
      return;
    }
    const gust = 1 + wind.value * 0.35;
    const bend = Math.sin(wind.time * 0.5);
    stem = glide(stem, bend * gust * 1.7, dt, 1.7);
    nod = glide(nod, sampleSin(wind.time * 0.09 + 0.4) * 0.8, dt, 1.4);
    lean = glide(lean, sampleSin(wind.time * 0.06 + 0.2) * (0.8 + bloomAmount * 0.35), dt, 1.3);
    if (impulse > 0) {
      impulse *= Math.exp(-dt * 2.4);
      if (impulse < 0.02) {
        impulse = 0;
      }
    }
    if (glowBoost > 0) {
      glowBoost *= Math.exp(-dt * 1.15);
      if (glowBoost < 0.02) {
        glowBoost = 0;
      }
    }
    if (bloomAmount > 0) {
      bloomAmount *= Math.exp(-dt * 0.85);
      if (bloomAmount < 0.02) {
        bloomAmount = 0;
      }
    }
  }

  function draw(wind, enabled) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    const shake = impulse > 0 ? Math.sin(wind.time * 9) * impulse * 0.8 : 0;
    const neckShift = Math.round(stem + shake);
    const headShift = neckShift + Math.round(nod);
    const stemSpan = Math.max(1, height - neck);
    const mid = width * 0.5;

    for (let y = neck; y < height; y += 1) {
      const along = (y - neck) / stemSpan;
      const shift = Math.round(neckShift * (1 - along));
      context.drawImage(image, 0, y, width, 1, shift, y, width, 1);
    }
    const headRows = neck + 1;
    for (let x = 0; x < width; x += 1) {
      const side = x - mid;
      const reach = Math.abs(side);
      const edge = reach / mid;
      const open = reach > 8 && bloomAmount > 0.22 + (1 - edge) * 0.5 ? Math.sign(side) : 0;
      const tilt = Math.round((lean * (x / width - 0.5)) * 2);
      const base = x + headShift + tilt;
      context.drawImage(image, x, 0, 1, headRows, base, 0, 1, headRows);
      if (open !== 0) {
        context.drawImage(image, x, 0, 1, headRows, base + open, 0, 1, headRows);
      }
    }

    if (enabled) {
      const glow = 0.035 + 0.045 * (0.5 + 0.5 * Math.sin(wind.time * 0.7)) + glowBoost * 0.16;
      context.globalCompositeOperation = "source-atop";
      context.fillStyle = `rgba(245, 235, 209, ${glow.toFixed(3)})`;
      context.fillRect(0, 0, width, neck + 1);
      context.globalCompositeOperation = "source-over";
    }
  }

  return { resize, update, draw, rustle, notice, bloom };
}
