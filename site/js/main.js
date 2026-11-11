import { createFireflies } from "./fireflies.js";
import { createFlower } from "./flower.js";
import { createMoonGlow } from "./glow.js";
import { createGrass } from "./grass.js";
import { createMeadow } from "./meadow.js";
import { PetalField } from "./petals.js";
import { artPixelSize } from "./scale.js";
import { createDirector } from "./director.js";
import { createChapter } from "./scenes.js";
import { createStory } from "./story.js";
import { createSky } from "./sky.js";
import { createSound } from "./sound.js";
import { createSparks } from "./sparks.js";
import { createWind } from "./wind.js";

const scene = document.querySelector("#scene");
const moonWrap = document.querySelector("#moon-wrap");
const daisyButton = document.querySelector("#daisy-button");
const daisyShift = document.querySelector("#daisy-shift");
const motionToggle = document.querySelector("#motion-toggle");
const soundToggle = document.querySelector("#sound-toggle");
const status = document.querySelector("#status");
const meadowRoot = document.querySelector(".meadow");
const meadowTrack = document.querySelector("#meadow-track");
const skyImage = document.querySelector(".sky");
const tokens = document.querySelectorAll(".token");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const look = { x: 0, y: 0 };
const lookTarget = { x: 0, y: 0 };
let shownShift = "";

async function loadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
}

function bootError(error) {
  console.error(error);
  status.textContent = "The still scene is here, but motion could not start.";
}

async function boot() {
  const response = await fetch("assets/manifest.json");
  if (!response.ok) {
    throw new Error(`manifest ${response.status}`);
  }
  const manifest = await response.json();
  const [sheet, meadowImage, daisyImage, cloudSheet] = await Promise.all([
    loadImage(`assets/${manifest.petals.src}`),
    loadImage(`assets/${manifest.meadow.src}`),
    loadImage(`assets/${manifest.daisy.src}`),
    loadImage(`assets/${manifest.clouds.src}`),
  ]);

  const meadow = createMeadow(meadowRoot, meadowTrack, manifest.meadow.width, manifest.meadow.height);
  const grass = createGrass(
    document.querySelector("#grass"),
    meadowImage,
    manifest.meadow.width,
    manifest.meadow.height,
    manifest.meadow.ground,
  );
  const flower = createFlower(document.querySelector("#daisy-canvas"), daisyImage, manifest.daisy.neck);
  const sky = createSky(document.querySelector("#stars"), cloudSheet, manifest.clouds);
  const fireflies = createFireflies(document.querySelector("#fireflies"));
  const glow = createMoonGlow(document.querySelector("#moon-glow"));
  const sparks = createSparks(document.querySelector("#sparks"));
  const petals = new PetalField(
    document.querySelector("#petals-back"),
    document.querySelector("#petals"),
    sheet,
    manifest.petals,
  );
  const wind = createWind();
  const sound = createSound();
  sky.onShoot = () => sound.shoot();
  const live = () => scene.classList.contains("scene--live");
  const worldPlay = () => {
    const kind = scene.dataset.kind;
    return kind === "opening" || kind === "meadow" || kind === "memories" || kind === "forever";
  };
  const blossom = () => {
    const sceneRect = scene.getBoundingClientRect();
    const flowerRect = daisyButton.getBoundingClientRect();
    const bloom = manifest.daisy.neck / manifest.daisy.height;
    return {
      x: flowerRect.left - sceneRect.left + flowerRect.width * 0.5,
      y: flowerRect.top - sceneRect.top + flowerRect.height * bloom * 0.5,
    };
  };
  const director = createDirector({
    wind,
    flower,
    petals,
    sparks,
    sky,
    fireflies,
    glow,
    finale: document.querySelector("#finale"),
    blossom,
    reducedMotion: motionQuery,
  });
  let chapter;
  const story = createStory({
    root: document.querySelector("#story"),
    finds: document.querySelector("#finds"),
    reading: document.querySelector("#reading"),
    envelope: document.querySelector("#envelope"),
    letter: document.querySelector("#letter-sheet"),
    visual: document.querySelector("#letter-visual"),
    liveText: document.querySelector("#letter-live"),
    finale: document.querySelector("#finale"),
    finaleLine: document.querySelector("#finale-line"),
    replay: document.querySelector("#replay"),
    envelopeSpec: manifest.envelope,
    reducedMotion: motionQuery,
    live,
    sound,
    fireflies,
    petals,
    sky,
    onReplay: () => chapter.go(0),
    onScene: (kind) => director.enter(kind),
  });
  chapter = createChapter(scene, {
    title: document.querySelector("#scene-title"),
    kicker: document.querySelector("#chapter-kicker"),
    line: document.querySelector("#chapter-line"),
    prev: document.querySelector("#chapter-prev"),
    next: document.querySelector("#chapter-next"),
    dots: document.querySelectorAll(".dot"),
  }, motionQuery, (current) => story.show(current));

  const paint = () => {
    const moving = live();
    grass.draw(wind, moving, look);
    flower.draw(wind, moving);
    sky.draw(wind, look);
    fireflies.draw(wind, look);
    glow.draw(wind);
    sparks.draw();
    petals.draw();
  };

  const layout = () => {
    const pixel = artPixelSize(manifest.sky.width, manifest.sky.height);
    moonWrap.style.width = `${manifest.moon.width * pixel}px`;
    daisyButton.style.width = `${manifest.daisy.width * pixel}px`;
    meadow.layout(pixel);
    grass.resize(pixel);
    flower.resize(pixel);
    sky.resize(pixel);
    fireflies.resize(pixel);
    sparks.resize(pixel);
    petals.resize(pixel);
    story.layout(pixel);
    const cell = manifest.tokens.cell;
    for (const token of tokens) {
      const frame = Number(token.dataset.frame) || 0;
      token.style.width = `${cell * pixel}px`;
      token.style.height = `${cell * pixel}px`;
      token.style.backgroundSize = `${cell * manifest.tokens.count * pixel}px ${cell * pixel}px`;
      token.style.backgroundPosition = `${-frame * cell * pixel}px 0px`;
    }
    paint();
  };

  function setLive(moving) {
    scene.classList.toggle("scene--live", moving);
    motionToggle.setAttribute("aria-pressed", moving ? "true" : "false");
    motionToggle.textContent = moving ? "Pause motion" : "Play motion";
    petals.setEnabled(moving);
    sky.setEnabled(moving);
    fireflies.setEnabled(moving);
    glow.setEnabled(moving);
    sound.setPaused(!moving);
  }

  layout();
  setLive(!motionQuery.matches);
  scene.classList.add("scene--ready");
  paint();

  let last = performance.now();
  let frameId = 0;

  const stop = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const frame = (now) => {
    frameId = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      director.update(dt);
      wind.update(dt);
      petals.update(dt, wind);
      sky.update(dt, wind);
      fireflies.update(dt);
      glow.update(dt);
      sparks.update(dt);
      flower.update(dt, live(), wind);
      story.update(dt);
      const follow = 1 - Math.exp(-dt * 4.5);
      look.x += (lookTarget.x - look.x) * follow;
      look.y += (lookTarget.y - look.y) * follow;
      const shiftKey = `${Math.round(look.x * 40)}:${Math.round(look.y * 40)}`;
      if (shiftKey !== shownShift) {
        shownShift = shiftKey;
        daisyShift.style.setProperty("--px", `${(-look.x * 12).toFixed(1)}px`);
        daisyShift.style.setProperty("--py", `${(-look.y * 6).toFixed(1)}px`);
        moonWrap.style.setProperty("--px", `${(look.x * 14).toFixed(1)}px`);
        moonWrap.style.setProperty("--py", `${(look.y * 8).toFixed(1)}px`);
        skyImage.style.transform = `translate(${(look.x * 16).toFixed(1)}px, ${(look.y * 10).toFixed(1)}px)`;
      }
      paint();
    } catch (error) {
      bootError(error);
      return;
    }
    if (live() && !document.hidden) {
      frameId = window.requestAnimationFrame(frame);
    }
  };

  const start = () => {
    if (document.hidden || !live()) {
      stop();
      return;
    }
    if (frameId) {
      return;
    }
    last = performance.now();
    frameId = window.requestAnimationFrame(frame);
  };

  start();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  motionToggle.addEventListener("click", () => {
    setLive(!live());
    start();
    paint();
  });

  soundToggle.addEventListener("click", () => {
    sound.toggle().then((on) => {
      soundToggle.setAttribute("aria-pressed", on ? "true" : "false");
      soundToggle.textContent = on ? "Sound on" : "Sound off";
      if (on) {
        sound.tick();
      }
    }).catch(bootError);
  });

  daisyButton.addEventListener("click", () => {
    if (!live() || !worldPlay()) {
      return;
    }
    if (director.flowerTouch()) {
      sound.chime();
      return;
    }
    flower.notice();
  });

  moonWrap.addEventListener("click", () => {
    if (!live() || !worldPlay()) {
      return;
    }
    const sceneRect = scene.getBoundingClientRect();
    const moonRect = moonWrap.getBoundingClientRect();
    const x = moonRect.left - sceneRect.left + moonRect.width * 0.5;
    const y = moonRect.top - sceneRect.top + moonRect.height * 0.42;
    if (!director.moonTouch(x, y)) {
      glow.pulse();
      sparks.burst(x, y, 6);
    }
    sound.moon();
  });

  for (const token of tokens) {
    token.addEventListener("click", () => {
      if (!live() || !worldPlay()) {
        return;
      }
      if (scene.dataset.scene === "memories" && token.dataset.frame === "1") {
        story.reveal("bud");
      }
      token.classList.add("is-lit");
      window.setTimeout(() => token.classList.remove("is-lit"), 700);
      const sceneRect = scene.getBoundingClientRect();
      const tokenRect = token.getBoundingClientRect();
      sparks.burst(
        tokenRect.left - sceneRect.left + tokenRect.width * 0.5,
        tokenRect.top - sceneRect.top + tokenRect.height * 0.4,
        8,
      );
      sound.tick();
    });
  }

  scene.addEventListener("pointerdown", (event) => {
    if (!live() || !worldPlay() || event.target.closest(".hud, .chapter-nav, .token, .moon-wrap, .daisy-button, .story")) {
      return;
    }
    const bounds = scene.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const petal = petals.hit(x, y);
    if (petal) {
      event.preventDefault();
      event.stopPropagation();
      flower.notice();
      sparks.burst(petal.x, petal.y, 10);
      petals.release(petal);
      sound.tick();
      return;
    }
    const fly = fireflies.hit(x, y);
    if (fly) {
      fireflies.excite(fly);
      sparks.burst(fly.x, fly.y, 6);
      sound.tick();
      if (scene.dataset.scene === "memories") {
        story.reveal("firefly");
      }
      return;
    }
    const star = sky.hit(x, y);
    if (star) {
      director.starWish(star);
      if (scene.dataset.scene === "memories") {
        story.reveal("star");
      }
      return;
    }
    if (sky.hitCloud(x, y)) {
      sound.tick();
    }
  }, true);

  const shift = (event) => {
    if (motionQuery.matches) {
      return;
    }
    const rect = scene.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    lookTarget.x = nx;
    lookTarget.y = ny;
  };
  scene.addEventListener("pointermove", shift);
  scene.addEventListener("pointerleave", () => {
    lookTarget.x = 0;
    lookTarget.y = 0;
  });

  motionQuery.addEventListener("change", () => {
    if (motionQuery.matches) {
      setLive(false);
      start();
      paint();
    }
  });

  const observer = new ResizeObserver(() => layout());
  observer.observe(scene);
}

boot().catch(bootError);
