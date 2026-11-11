import { createPool } from "./pool.js";

function blankSpark() {
  return {
    alive: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0.45,
    color: "#fff6d2",
    size: 2,
  };
}

const COLORS = ["#F5EBD1", "#A9B9E8", "#F5EBD1", "#E9A9C8"];

/** Short pixel sparks used when a petal is tapped. */
export function createSparks(canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  const pool = createPool(48, blankSpark);
  let pixel = 2;
  let dpr = 1;

  function resize(nextPixel) {
    pixel = nextPixel;
    const rect = canvas.getBoundingClientRect();
    dpr = 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  function burst(x, y, count = 10) {
    let spawned = 0;
    for (const spark of pool.items) {
      if (spark.alive) {
        continue;
      }
      const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = pixel * (18 + Math.random() * 28);
      spark.alive = true;
      spark.x = x;
      spark.y = y;
      spark.vx = Math.cos(angle) * speed;
      spark.vy = Math.sin(angle) * speed;
      spark.life = 0;
      spark.maxLife = 0.32 + Math.random() * 0.28;
      spark.color = COLORS[spawned & 3];
      spark.size = pixel;
      spawned += 1;
      if (spawned >= count) {
        break;
      }
    }
  }

  function update(dt) {
    const gravity = pixel * 20;
    for (const spark of pool.items) {
      if (!spark.alive) {
        continue;
      }
      spark.life += dt;
      if (spark.life >= spark.maxLife) {
        spark.alive = false;
        continue;
      }
      spark.vy += gravity * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
    }
  }

  function draw() {
    if (!context) {
      return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    for (const spark of pool.items) {
      if (!spark.alive) {
        continue;
      }
      const fade = 1 - spark.life / spark.maxLife;
      context.globalAlpha = fade > 0.66 ? 1 : fade > 0.33 ? 0.65 : 0.3;
      context.fillStyle = spark.color;
      context.fillRect(Math.round(spark.x), Math.round(spark.y), spark.size, spark.size);
    }
    context.globalAlpha = 1;
  }

  return { resize, burst, update, draw };
}
