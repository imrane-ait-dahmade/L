/** A soft pixel halo that breathes behind the moon image. */
export function createMoonGlow(canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  let enabled = false;
  let pulse = 0;
  let level = 1;
  let swell = 0;
  let swellTarget = 0;

  function setEnabled(value) {
    enabled = value;
  }

  function pulseGlow() {
    pulse = 1;
  }

  function setLevel(value) {
    level = value;
  }

  function swellTo(value) {
    swellTarget = value;
  }

  function update(dt) {
    swell += (swellTarget - swell) * Math.min(1, dt * 0.7);
    if (pulse <= 0) {
      return;
    }
    pulse *= Math.exp(-dt * 2.1);
    if (pulse < 0.02) {
      pulse = 0;
    }
  }

  function draw(wind) {
    if (!context) {
      return;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, size, size);
    context.imageSmoothingEnabled = false;
    const cycle = 0.84 + 0.16 * (0.5 + 0.5 * Math.sin(wind.time * 0.065));
    const breathe = (enabled ? 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(wind.time * 0.8)) : 0.75) * (1 + pulse) * cycle * level;
    const center = size / 2;
    const lift = Math.round(swell * 5);
    context.fillStyle = "#F5EBD1";
    const rings = [
      [20 + lift, 0.05],
      [16 + lift, 0.08],
      [12 + Math.round(lift * 0.5), 0.12],
    ];
    for (const [radius, alpha] of rings) {
      context.globalAlpha = alpha * breathe;
      for (let y = -radius; y <= radius; y += 1) {
        const span = Math.round(Math.sqrt(Math.max(0, radius * radius - y * y)));
        context.fillRect(center - span, center + y, 1, 1);
        context.fillRect(center + span, center + y, 1, 1);
      }
    }
    context.globalAlpha = 1;
  }

  return { setEnabled, setLevel, swellTo, update, draw, pulse: pulseGlow };
}
