import { createPool } from "./pool.js";
import { sampleSin } from "./wind.js";

const COLORS = ["#F5EBD1", "#A9B9E8", "#F5EBD1", "#A9B9E8"];

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function blankStar() {
  return { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0.7, length: 6 };
}

function blankCloud(index) {
  return {
    frame: index % 3,
    nx: (index * 0.27) % 1,
    ny: 0.08 + (index % 3) * 0.07,
    speed: 0.008 + (index % 3) * 0.004,
    alpha: 0.28 + (index % 2) * 0.1,
    lift: 0,
    left: 0,
    top: 0,
    w: 0,
    h: 0,
  };
}

/** Twinkling stars, rare shooting stars, and the slow cloud layer. */
export function createSky(canvas, cloudSheet, cloudSpec) {
  const context = canvas.getContext("2d", { alpha: true });
  const random = mulberry32(20261110);
  const stars = Array.from({ length: 22 }, () => ({
    nx: 0.04 + random() * 0.92,
    ny: 0.03 + random() * 0.58,
    phase: random(),
    speed: 0.15 + random() * 0.45,
    cross: random() > 0.72,
    color: random() > 0.9 ? "#E9A9C8" : COLORS[Math.floor(random() * COLORS.length)],
    flash: 0,
    sx: 0,
    sy: 0,
  }));
  const shooters = createPool(2, blankStar);
  const clouds = [0, 1, 2, 3].map((index) => blankCloud(index));
  let pixel = 2;
  let dpr = 1;
  let enabled = false;
  let nextShoot = 7;
  let onShoot = null;
  let lively = false;
  let quiet = false;
  let glintIndex = 0;

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
    quiet = false;
  }

  function setPace(value) {
    lively = value > 1.05;
    quiet = value < 0.7;
  }

  function glint() {
    glintIndex = (glintIndex + 3) % stars.length;
    stars[glintIndex].flash = 1;
  }

  function constellation() {
    const total = Math.min(5, stars.length);
    for (let index = 0; index < total; index += 1) {
      const star = stars[(index * 4) % stars.length];
      star.flash = 0.4 + index * 0.12;
    }
    const lead = stars[4] || stars[0];
    if (lead) {
      wish(lead.sx, lead.sy);
    }
  }

  function launch(width, height) {
    const star = shooters.acquire();
    if (!star) {
      return;
    }
    star.alive = true;
    star.maxLife = 0.62 + Math.random() * 0.28;
    star.x = width * (0.08 + Math.random() * 0.7);
    star.y = height * (0.04 + Math.random() * 0.22);
    const direction = Math.random() < 0.5 ? -1 : 1;
    star.vx = (direction * width * 0.42) / star.maxLife;
    star.vy = (height * 0.1) / star.maxLife;
    star.life = 0;
    star.length = 6 + Math.floor(Math.random() * 3);
    if (onShoot) {
      onShoot();
    }
  }

  function update(dt, wind) {
    if (!enabled) {
      return;
    }
    for (const star of stars) {
      if (star.flash <= 0) {
        continue;
      }
      star.flash *= Math.exp(-dt * 2.6);
      if (star.flash < 0.02) {
        star.flash = 0;
      }
    }
    nextShoot -= dt;
    if (nextShoot <= 0) {
      launch(canvas.clientWidth, canvas.clientHeight);
      nextShoot = lively ? 4 + Math.random() * 6 : quiet ? 16 + Math.random() * 12 : 11 + Math.random() * 14;
    }
    for (const star of shooters.items) {
      if (!star.alive) {
        continue;
      }
      star.life += dt;
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      if (star.life >= star.maxLife) {
        star.alive = false;
      }
    }
    const breeze = 1 + wind.value * 0.35;
    for (const cloud of clouds) {
      cloud.nx += cloud.speed * breeze * dt;
      if (cloud.nx > 1.25) {
        cloud.nx = -0.3;
      }
      if (cloud.lift > 0) {
        cloud.lift *= Math.exp(-dt * 1.6);
        if (cloud.lift < 0.02) {
          cloud.lift = 0;
        }
      }
    }
  }

  function hitCloud(x, y) {
    for (const cloud of clouds) {
      if (x >= cloud.left && x <= cloud.left + cloud.w && y >= cloud.top && y <= cloud.top + cloud.h) {
        cloud.lift = 1;
        return cloud;
      }
    }
    return null;
  }

  function hit(x, y) {
    const radius = Math.max(20, pixel * 3);
    const radiusSq = radius * radius;
    let found = null;
    let best = radiusSq;
    for (const star of stars) {
      const dx = star.sx - x;
      const dy = star.sy - y;
      const distance = dx * dx + dy * dy;
      if (distance <= best) {
        found = star;
        best = distance;
      }
    }
    return found;
  }

  function wish(x, y) {
    const star = shooters.acquire();
    if (!star) {
      return false;
    }
    star.alive = true;
    star.maxLife = 0.7;
    star.x = x;
    star.y = y;
    star.vx = canvas.clientWidth * 0.38;
    star.vy = canvas.clientHeight * 0.08;
    star.life = 0;
    star.length = 7;
    if (onShoot) {
      onShoot();
    }
    return true;
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

    const ox = (look?.x || 0) * 16;
    const oy = (look?.y || 0) * 10;
    for (const cloud of clouds) {
      const drawW = cloudSpec.cellWidth * pixel;
      const drawH = cloudSpec.cellHeight * pixel;
      const left = Math.round(cloud.nx * width + ox);
      const top = Math.round(cloud.ny * height * 0.55 + oy);
      cloud.left = left;
      cloud.top = top;
      cloud.w = drawW;
      cloud.h = drawH;
      context.globalAlpha = Math.min(0.85, cloud.alpha + cloud.lift * 0.4);
      context.drawImage(
        cloudSheet,
        cloud.frame * cloudSpec.cellWidth,
        0,
        cloudSpec.cellWidth,
        cloudSpec.cellHeight,
        left,
        top,
        drawW,
        drawH,
      );
    }

    for (const star of stars) {
      const twinkle = enabled
        ? 0.25 + 0.75 * (0.5 + 0.5 * sampleSin(wind.time * star.speed + star.phase))
        : 0.75;
      context.globalAlpha = Math.max(twinkle, star.flash);
      context.fillStyle = star.flash > 0.25 ? "#F5EBD1" : star.color;
      const x = Math.round((star.nx * width + ox) / pixel) * pixel;
      const y = Math.round((star.ny * height + oy) / pixel) * pixel;
      star.sx = x + pixel * 0.5;
      star.sy = y + pixel * 0.5;
      context.fillRect(x, y, pixel, pixel);
      if (!star.cross && star.flash < 0.3) {
        continue;
      }
      context.fillRect(x - pixel, y, pixel, pixel);
      context.fillRect(x + pixel, y, pixel, pixel);
      context.fillRect(x, y - pixel, pixel, pixel);
      context.fillRect(x, y + pixel, pixel, pixel);
    }

    context.fillStyle = "#F5EBD1";
    for (const star of shooters.items) {
      if (!star.alive) {
        continue;
      }
      const fade = 1 - star.life / star.maxLife;
      const span = Math.hypot(star.vx, star.vy) || 1;
      const stepX = (star.vx / span) * pixel;
      const stepY = (star.vy / span) * pixel;
      for (let step = 0; step < star.length; step += 1) {
        context.globalAlpha = fade * (1 - step / star.length);
        context.fillRect(
          Math.round((star.x - stepX * step) / pixel) * pixel,
          Math.round((star.y - stepY * step) / pixel) * pixel,
          pixel,
          pixel,
        );
      }
    }
    context.globalAlpha = 1;
  }

  return {
    resize,
    setEnabled,
    setLively,
    setPace,
    constellation,
    glint,
    update,
    draw,
    hit,
    hitCloud,
    wish,
    set onShoot(callback) {
      onShoot = callback;
    },
  };
}
