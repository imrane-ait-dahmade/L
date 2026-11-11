import { createPool } from "./pool.js";

const SIZE_UNITS = [14, 18, 22];
const POOL_SIZE = 56;

function blankPetal() {
  return {
    alive: false,
    kind: "ambient",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    sway: 0,
    swaySpeed: 0,
    swayAmp: 0,
    spin: 0,
    spinSpeed: 0,
    variant: 0,
    sizeUnits: 18,
    drawSize: 18,
    back: false,
  };
}

/**
 * Pooled falling petals. Ambient petals recycle above the scene.
 * Burst and rustle petals leave once they drift offscreen.
 */
export class PetalField {
  constructor(backCanvas, frontCanvas, sheet, spec) {
    this.backCanvas = backCanvas;
    this.frontCanvas = frontCanvas;
    this.back = backCanvas.getContext("2d", { alpha: true });
    this.front = frontCanvas.getContext("2d", { alpha: true });
    this.sheet = sheet;
    this.spec = spec;
    this.pool = createPool(POOL_SIZE, blankPetal);
    this.pixel = 2;
    this.enabled = false;
    this.lively = false;
    this.density = 1;
    this.dpr = 1;
    this.seeded = false;
  }

  resize(pixel) {
    this.pixel = pixel;
    this.dpr = 1;
    for (const canvas of [this.backCanvas, this.frontCanvas]) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
      canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    }
    for (const petal of this.pool.items) {
      if (petal.alive) {
        petal.drawSize = pixel * petal.sizeUnits;
      }
    }
    if (!this.seeded) {
      this._fillAmbient(true);
      this.seeded = true;
    }
  }

  targetCount() {
    const width = this.frontCanvas.clientWidth || 360;
    const count = Math.round(Math.min(20, Math.max(8, width / 78)) * this.density);
    const capped = Math.min(28, Math.max(4, count));
    return this.enabled ? capped : Math.max(4, Math.round(capped * 0.55));
  }

  setDensity(factor) {
    const next = Math.max(0.35, Math.min(1.4, factor));
    if (Math.abs(next - this.density) < 0.05) {
      return;
    }
    const previous = this.density;
    this.density = next;
    this.lively = next > 1.05;
    if (next > previous) {
      this._fillAmbient(false);
      return;
    }
    let ambient = 0;
    for (const petal of this.pool.items) {
      if (petal.alive && petal.kind === "ambient") {
        ambient += 1;
      }
    }
    const goal = this.targetCount();
    for (const petal of this.pool.items) {
      if (!petal.alive || petal.kind !== "ambient" || ambient <= goal) {
        continue;
      }
      petal.kind = "burst";
      petal.vy = this.pixel * 10;
      ambient -= 1;
    }
  }

  setLively(value) {
    this.lively = value;
    if (value) {
      this._fillAmbient(false);
      return;
    }
    let ambient = 0;
    for (const petal of this.pool.items) {
      if (petal.alive && petal.kind === "ambient") {
        ambient += 1;
      }
    }
    const goal = this.targetCount();
    for (const petal of this.pool.items) {
      if (!petal.alive || petal.kind !== "ambient" || ambient <= goal) {
        continue;
      }
      petal.kind = "burst";
      petal.vy = this.pixel * 10;
      ambient -= 1;
    }
  }

  setEnabled(enabled) {
    const turnedOn = enabled && !this.enabled;
    this.enabled = enabled;
    if (turnedOn) {
      this._fillAmbient(true);
    }
  }

  _fillAmbient(settled) {
    let alive = 0;
    for (const petal of this.pool.items) {
      if (petal.alive && petal.kind === "ambient") {
        alive += 1;
      }
    }
    const goal = this.targetCount();
    while (alive < goal) {
      const petal = this.pool.acquire();
      if (!petal) {
        return;
      }
      this._place(petal, "ambient", settled);
      alive += 1;
    }
  }

  _place(petal, kind, settled) {
    const width = this.frontCanvas.clientWidth || 1;
    const height = this.frontCanvas.clientHeight || 1;
    const pixel = this.pixel;
    const slot = Math.floor(Math.random() * SIZE_UNITS.length);
    petal.alive = true;
    petal.kind = kind;
    petal.sizeUnits = SIZE_UNITS[slot];
    petal.drawSize = pixel * petal.sizeUnits;
    petal.x = Math.random() * width;
    petal.y = settled ? height * (0.04 + Math.random() * 0.9) : -petal.drawSize;
    petal.vx = (-6 + Math.random() * 12) * pixel * 0.25;
    petal.vy = (4.5 + slot * 1.6 + Math.random() * 4.5) * pixel * 0.42;
    petal.sway = Math.random() * 8;
    petal.swaySpeed = 0.35 + Math.random() * 0.55;
    petal.swayAmp = (10 + slot * 6) * pixel * 0.35;
    petal.spin = Math.random() * this.spec.columns;
    petal.spinSpeed = 0.8 + Math.random() * 2.4 + slot * 0.3;
    petal.variant = slot % this.spec.rows;
    petal.back = Math.random() < 0.4;
  }

  _launch(kind, x, y, vx, vy, variant) {
    const petal = this.pool.acquire();
    if (!petal) {
      return;
    }
    const pixel = this.pixel;
    const slot = Math.floor(Math.random() * SIZE_UNITS.length);
    petal.alive = true;
    petal.kind = kind;
    petal.sizeUnits = SIZE_UNITS[slot];
    petal.drawSize = pixel * petal.sizeUnits;
    petal.x = x;
    petal.y = y;
    petal.vx = vx;
    petal.vy = vy;
    petal.sway = Math.random() * 8;
    petal.swaySpeed = 0.8 + Math.random() * 1.2;
    petal.swayAmp = (16 + slot * 6) * pixel * 0.28;
    petal.spin = Math.random() * this.spec.columns;
    petal.spinSpeed = 2.4 + Math.random() * 3;
    petal.variant = variant % this.spec.rows;
    petal.back = Math.random() < 0.25;
  }

  burst(x, y) {
    if (!this.enabled) {
      return;
    }
    const pixel = this.pixel;
    for (let index = 0; index < 8; index += 1) {
      this._launch(
        "burst",
        x + (-10 + Math.random() * 20),
        y,
        (-18 + Math.random() * 36) * pixel * 0.28,
        (-12 + Math.random() * 5) * pixel * 0.35,
        index,
      );
    }
  }

  /** A few petals leave the blossom and drift off on the wind. */
  shed(x, y, count = 5) {
    if (!this.enabled) {
      return;
    }
    const pixel = this.pixel;
    const total = Math.max(1, Math.min(6, count));
    for (let index = 0; index < total; index += 1) {
      const spread = total === 1 ? 0 : index / (total - 1) - 0.5;
      const angle = -Math.PI * 0.5 + spread * 1.4;
      const speed = pixel * (5 + (index % 3));
      this._launch(
        "rustle",
        x + Math.cos(angle) * pixel * 3,
        y + Math.sin(angle) * pixel * 2,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.65 - pixel * 2,
        index,
      );
    }
  }

  /** Petals leave the blossom in a ring, then fall. */
  rustle(x, y) {
    if (!this.enabled) {
      return;
    }
    const pixel = this.pixel;
    const count = 14;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + Math.random() * 0.2;
      const speed = pixel * (7 + (index % 3) * 2.5);
      this._launch(
        "rustle",
        x + Math.cos(angle) * pixel * 4,
        y + Math.sin(angle) * pixel * 3,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.55 - pixel * 5,
        index,
      );
    }
  }

  hit(x, y) {
    let found = null;
    let best = Infinity;
    for (const petal of this.pool.items) {
      if (!petal.alive || petal.back) {
        continue;
      }
      const dx = petal.x - x;
      const dy = petal.y - y;
      const radius = Math.max(22, petal.drawSize * 0.36);
      const distance = dx * dx + dy * dy;
      if (distance <= radius * radius && distance < best) {
        found = petal;
        best = distance;
      }
    }
    return found;
  }

  release(petal) {
    petal.alive = false;
  }

  update(dt, wind) {
    if (!this.enabled) {
      return;
    }
    const width = this.frontCanvas.clientWidth;
    const height = this.frontCanvas.clientHeight;
    const pixel = this.pixel;
    const breeze = wind.value * pixel * 28;
    const gravity = pixel * 17;

    for (const petal of this.pool.items) {
      if (!petal.alive) {
        continue;
      }
      petal.sway += petal.swaySpeed * dt;
      const curve = Math.sin(petal.sway) * petal.swayAmp;
      const desired = breeze * 0.35 + curve * 0.65;
      petal.vx += (desired - petal.vx) * Math.min(1, dt * 1.15);
      petal.x += petal.vx * dt;
      if (petal.kind !== "ambient") {
        petal.vy += gravity * dt;
      }
      petal.y += petal.vy * dt;
      petal.spin += petal.spinSpeed * dt;

      const margin = petal.drawSize;
      const offscreen = petal.y > height + margin || petal.x < -margin * 2 || petal.x > width + margin * 2;
      if (!offscreen) {
        continue;
      }
      if (petal.kind === "ambient") {
        this._place(petal, "ambient", false);
      } else {
        petal.alive = false;
      }
    }
    this._fillAmbient(false);
  }

  draw() {
    const width = this.frontCanvas.clientWidth;
    const height = this.frontCanvas.clientHeight;
    for (const ctx of [this.back, this.front]) {
      if (!ctx) {
        return;
      }
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
    }
    const { columns, cell } = this.spec;
    for (const petal of this.pool.items) {
      if (!petal.alive) {
        continue;
      }
      const ctx = petal.back ? this.back : this.front;
      const frame = ((Math.floor(petal.spin) % columns) + columns) % columns;
      const half = petal.drawSize * 0.5;
      ctx.drawImage(
        this.sheet,
        frame * cell,
        petal.variant * cell,
        cell,
        cell,
        Math.round(petal.x - half),
        Math.round(petal.y - half),
        petal.drawSize,
        petal.drawSize,
      );
    }
  }
}
