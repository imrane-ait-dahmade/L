/**
 * Stages scene motion so gestures, idle beats, and the finale
 * do not all fire their heaviest effects in the same moment.
 * Cues run from the shared animation frame. Nothing is scheduled
 * while the page is hidden or motion is paused.
 */
const PROFILES = {
  opening: { wind: 0.5, petals: 0.4, flies: 0.7, sky: 0.55, glow: 0.75 },
  meadow: { wind: 1, petals: 1, flies: 1, sky: 1, glow: 1 },
  memories: { wind: 0.72, petals: 0.6, flies: 0.85, sky: 0.8, glow: 0.85 },
  letter: { wind: 0.42, petals: 0.4, flies: 0.5, sky: 0.5, glow: 0.7 },
  forever: { wind: 1.12, petals: 1.35, flies: 1.28, sky: 1.2, glow: 1.35 },
};

const FINALE_AT = [0.5, 1.3, 2.1, 2.9, 3.7, 4.6, 5.5];

export function createDirector(options) {
  const cueAt = new Float32Array(8);
  const cueRun = new Array(8);
  const cueDone = new Uint8Array(8);
  const readyAt = { flower: 0, star: 0, moon: 0, idle: 0 };
  let cueCount = 0;
  let cueClock = 0;
  let busy = false;
  let priority = 0;
  let kind = "opening";
  let finaleOn = false;
  let finaleTime = 0;
  let finaleStep = 0;
  let idle = 0;
  let nextIdle = 14;
  let beat = 0;
  const blend = { wind: 1, petals: 1, flies: 1, sky: 1, glow: 1 };

  function applyProfile(dt) {
    const profile = PROFILES[kind] || PROFILES.opening;
    const step = Math.min(1, dt * 0.9);
    blend.wind += (profile.wind - blend.wind) * step;
    blend.glow += (profile.glow - blend.glow) * step;
    options.wind.scale = blend.wind;
    options.glow.setLevel(0.85 + blend.glow * 0.2);
    if (Math.abs(profile.petals - blend.petals) > 0.08) {
      blend.petals = profile.petals;
      options.petals.setDensity(profile.petals);
    }
    if (Math.abs(profile.flies - blend.flies) > 0.08) {
      blend.flies = profile.flies;
      options.fireflies.setPace(profile.flies);
    }
    if (Math.abs(profile.sky - blend.sky) > 0.08) {
      blend.sky = profile.sky;
      options.sky.setPace(profile.sky);
    }
  }

  function clearCues() {
    cueCount = 0;
    cueClock = 0;
    busy = false;
    priority = 0;
  }

  function flush() {
    for (let index = 0; index < cueCount; index += 1) {
      if (cueDone[index] || cueClock < cueAt[index]) {
        continue;
      }
      cueDone[index] = 1;
      cueRun[index]();
    }
    let finished = cueCount > 0;
    for (let index = 0; index < cueCount; index += 1) {
      if (!cueDone[index]) {
        finished = false;
      }
    }
    if (finished) {
      clearCues();
    }
  }

  function play(name, level, cooldown, times, runs) {
    if (options.reducedMotion.matches) {
      return false;
    }
    if (finaleOn && level < 3) {
      return false;
    }
    if (busy && level < priority) {
      return false;
    }
    const now = options.wind.time;
    if (now < readyAt[name]) {
      return false;
    }
    readyAt[name] = now + cooldown;
    priority = level;
    busy = true;
    cueCount = times.length;
    cueClock = 0;
    for (let index = 0; index < cueCount; index += 1) {
      cueAt[index] = times[index];
      cueRun[index] = runs[index];
      cueDone[index] = 0;
    }
    flush();
    return true;
  }

  function flowerTouch() {
    return play("flower", 2, 1.6, [0, 0.22], [
      () => {
        options.flower.bloom();
      },
      () => {
        const point = options.blossom();
        options.petals.shed(point.x, point.y, 5);
        options.sparks.burst(point.x, point.y, 6);
      },
    ]);
  }

  function starWish(star) {
    star.flash = 1;
    return play("star", 1, 1.4, [0, 0.16], [
      () => {
        options.sparks.burst(star.sx, star.sy, 4);
      },
      () => {
        options.sky.wish(star.sx, star.sy);
      },
    ]);
  }

  function moonTouch(x, y) {
    return play("moon", 1, 1.8, [0], [
      () => {
        options.glow.pulse();
        options.sparks.burst(x, y, 8);
      },
    ]);
  }

  function revealMessage() {
    options.finale.classList.add("is-revealed");
  }

  function beginFinale() {
    finaleOn = true;
    finaleTime = 0;
    finaleStep = 0;
    priority = 3;
    options.finale.classList.remove("is-revealed");
    options.glow.swellTo(0);
  }

  function runFinale(step) {
    if (step === 0) {
      options.glow.swellTo(0.35);
      return;
    }
    if (step === 1) {
      options.glow.swellTo(1);
      return;
    }
    if (step === 2) {
      options.flower.bloom();
      return;
    }
    if (step === 3) {
      const point = options.blossom();
      options.petals.shed(point.x, point.y, 6);
      return;
    }
    if (step === 4) {
      const point = options.blossom();
      options.fireflies.gather(point.x, point.y, 0.85);
      return;
    }
    if (step === 5) {
      options.sky.constellation();
      return;
    }
    revealMessage();
    options.glow.swellTo(0.45);
  }

  function enter(nextKind) {
    kind = nextKind;
    clearCues();
    finaleOn = false;
    finaleStep = 0;
    options.glow.swellTo(0);
    options.fireflies.gather(0, 0, 0);
    if (nextKind !== "forever") {
      options.finale.classList.remove("is-revealed");
    }
    const profile = PROFILES[nextKind] || PROFILES.opening;
    options.petals.setDensity(profile.petals);
    options.fireflies.setPace(profile.flies);
    options.sky.setPace(profile.sky);
    blend.petals = profile.petals;
    blend.flies = profile.flies;
    blend.sky = profile.sky;
    if (nextKind === "forever") {
      if (options.reducedMotion.matches) {
        revealMessage();
        return;
      }
      beginFinale();
    }
  }

  function update(dt) {
    applyProfile(dt);
    if (finaleOn) {
      finaleTime += dt;
      while (finaleStep < FINALE_AT.length && finaleTime >= FINALE_AT[finaleStep]) {
        runFinale(finaleStep);
        finaleStep += 1;
      }
      if (finaleStep >= FINALE_AT.length) {
        finaleOn = false;
        priority = 0;
      }
    }
    if (busy) {
      cueClock += dt;
      flush();
    }
    if (options.reducedMotion.matches || finaleOn || busy || kind === "letter") {
      idle = 0;
      return;
    }
    idle += dt;
    if (idle < nextIdle) {
      return;
    }
    idle = 0;
    nextIdle = 12 + Math.random() * 9;
    beat = (beat + 1) % 3;
    if (beat === 0) {
      options.sky.glint();
      return;
    }
    const point = options.blossom();
    options.fireflies.gather(point.x, point.y * 0.72, 0.2);
  }

  return { enter, update, flowerTouch, starWish, moonTouch, revealMessage };
}
