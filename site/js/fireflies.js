import { sampleSin } from "./wind.js";

const FIREFLY_COUNT = 16;

function blankFirefly(index) {
  return {
    nx: (index * 0.17) % 1,
    band: 0.72 + ((index * 0.13) % 0.24),
    phase: index * 0.37,
    speed: 0.2 + (index % 5) * 0.06,
    drift: 0.012 + (index % 4) * 0.004,
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
    placed: 0,
    flash: 0,
  };
}

/** A fixed handful of blinking pixels just above the grass. */
export function createFireflies(canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  const flies = Array.from({ length: FIREFLY_COUNT }, (_, index) => blankFirefly(index));
  let pixel = 2;
  let dpr = 1;
  let enabled = false;
  let lively = false;
  let pace = 1;
  let gatherX = 0;
  let gatherY = 0;
  let gatherStrength = 0;

  function resize(nextPixel) {
    pixel = nextPixel;
    const rect = canvas.getBoundingClientRect();
    dpr = 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  function setEnabled(value) {
    enabled = value;
  }

  function setLively(value) {
    lively = value;
    pace = value ? 1.25 : 1;
  }

  function setPace(value) {
    pace = value;
    lively = value > 1.05;
  }

  function gather(x, y, strength) {
    gatherX = x;
    gatherY = y;
    gatherStrength = strength;
  }

  function excite(target) {
    target.flash = 1;
    const limit = 96 * 96;
    for (let index = 0; index < flies.length; index += 1) {
      const other = flies[index];
      if (other === target) {
        continue;
      }
      const dx = other.x - target.x;
      const dy = other.y - target.y;
      if (dx * dx + dy * dy < limit) {
        other.flash = Math.max(other.flash, 0.5);
      }
    }
  }

  function update(dt) {
    if (gatherStrength > 0) {
      gatherStrength *= Math.exp(-dt * 0.28);
      if (gatherStrength < 0.02) {
        gatherStrength = 0;
      }
    }
    for (const fly of flies) {
      if (fly.flash <= 0) {
        continue;
      }
      fly.flash *= Math.exp(-dt * 2.4);
      if (fly.flash < 0.02) {
        fly.flash = 0;
      }
    }
  }

  function hit(x, y) {
    const radius = Math.max(22, pixel * 3);
    const radiusSq = radius * radius;
    let found = null;
    let best = radiusSq;
    for (const fly of flies) {
      const dx = fly.x - x;
      const dy = fly.y - y;
      const distance = dx * dx + dy * dy;
      if (distance <= best) {
        found = fly;
        best = distance;
      }
    }
    return found;
  }

  function draw(wind, look) {
    if (!context) {
      return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    const ox = (look?.x || 0) * -10;
    const oy = (look?.y || 0) * -6;
    for (let index = 0; index < flies.length; index += 1) {
      const fly = flies[index];
      const blink = enabled ? 0.5 + 0.5 * Math.sin(wind.time * fly.speed * pace * Math.PI * 2 + fly.phase * 6.2) : 0.45;
      const travel = enabled ? wind.time * fly.drift * pace * (1 + wind.value * 0.4) : 0;
      const wander = enabled ? sampleSin(wind.time * 0.07 * pace + fly.phase) * pixel * 5 : 0;
      let aimX = ((((fly.nx + travel) % 1) + 1) % 1) * width + ox;
      let aimY = fly.band * height + oy + wander;
      const mate = flies[index & ~3];
      if (mate !== fly && pace > 0.75 && mate.placed) {
        aimX += (mate.sx - aimX) * 0.08;
        aimY += (mate.sy - aimY) * 0.08;
      }
      if (gatherStrength > 0.02) {
        aimX += (gatherX - aimX) * gatherStrength * 0.12;
        aimY += (gatherY - aimY) * gatherStrength * 0.12;
      }
      const ease = enabled ? 1 - Math.exp(-(wind.dt || 0.016) * 2.4) : 1;
      if (!fly.placed) {
        fly.sx = aimX;
        fly.sy = aimY;
        fly.placed = 1;
      } else {
        const dx = aimX - fly.sx;
        if (dx > width * 0.5 || dx < -width * 0.5) {
          fly.sx = aimX;
        } else {
          fly.sx += dx * ease;
        }
        fly.sy += (aimY - fly.sy) * ease;
      }
      const x = Math.round(fly.sx / pixel) * pixel;
      const y = Math.round(fly.sy / pixel) * pixel;
      fly.x = x + pixel * 0.5;
      fly.y = y + pixel * 0.5;
      if (blink < (lively ? 0.08 : 0.35) && fly.flash <= 0) {
        continue;
      }
      context.fillStyle = fly.flash > 0.2 ? "#F5EBD1" : "#B7CE93";
      context.globalAlpha = Math.max(blink > 0.72 ? 1 : 0.55, fly.flash);
      context.fillRect(x, y, pixel, pixel);
      if (blink > 0.82 || fly.flash > 0.35) {
        context.globalAlpha = Math.max(0.4, fly.flash * 0.7);
        context.fillRect(x - pixel, y, pixel, pixel);
        context.fillRect(x + pixel, y, pixel, pixel);
        context.fillRect(x, y - pixel, pixel, pixel);
        context.fillRect(x, y + pixel, pixel, pixel);
      }
    }
    context.globalAlpha = 1;
  }

  return { resize, setEnabled, setLively, setPace, gather, excite, update, draw, hit };
}
