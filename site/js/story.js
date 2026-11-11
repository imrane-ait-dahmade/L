import { COPY } from "./copy.js";

const CHARACTERS_PER_SECOND = 28;

/** Memories, the letter, and the closing scene. Text comes from copy.js. */
export function createStory(options) {
  const finds = new Map();
  let sceneId = "beginning";
  let opened = false;
  let typing = false;
  let lineIndex = 0;
  let characters = 0;
  let announced = -1;

  for (const find of COPY.memories.finds) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `find find--${find.id}`;
    button.dataset.find = find.id;
    button.setAttribute("aria-label", find.label);
    const glyph = document.createElement("span");
    glyph.className = "find-glyph";
    glyph.setAttribute("aria-hidden", "true");
    button.append(glyph);
    button.addEventListener("click", () => {
      reveal(find.id);
      options.sound.tick();
    });
    options.finds.append(button);
    finds.set(find.id, button);
  }

  options.envelope.addEventListener("click", () => {
    if (sceneId !== "letter" || opened) {
      return;
    }
    opened = true;
    options.envelope.classList.add("is-open");
    options.envelope.setAttribute("aria-expanded", "true");
    options.letter.hidden = false;
    options.letter.classList.add("is-open");
    options.sound.chime();
    const lines = COPY.letter.lines;
    if (options.reducedMotion.matches) {
      options.visual.textContent = lines.join("\n\n");
      options.liveText.textContent = lines.join(" ");
      typing = false;
      return;
    }
    lineIndex = 0;
    characters = 0;
    announced = -1;
    typing = true;
    options.visual.textContent = "";
    options.liveText.textContent = "";
  });

  options.replay.addEventListener("click", () => {
    opened = false;
    typing = false;
    options.envelope.classList.remove("is-open");
    options.envelope.setAttribute("aria-expanded", "false");
    options.letter.classList.remove("is-open");
    options.letter.hidden = true;
    options.visual.textContent = "";
    options.liveText.textContent = "";
    options.reading.textContent = "";
    options.reading.classList.remove("is-shown");
    for (const button of finds.values()) {
      button.classList.remove("is-read");
    }
    options.onReplay();
  });

  function reveal(id) {
    const find = COPY.memories.finds.find((item) => item.id === id);
    if (!find || sceneId !== "memories") {
      return;
    }
    const button = finds.get(id);
    if (button) {
      button.classList.add("is-read");
    }
    options.reading.hidden = false;
    if (options.reducedMotion.matches) {
      options.reading.textContent = find.text;
      options.reading.classList.add("is-shown");
    } else {
      options.reading.classList.remove("is-shown");
      window.setTimeout(() => {
        if (sceneId !== "memories") {
          return;
        }
        options.reading.textContent = find.text;
        options.reading.classList.add("is-shown");
      }, 220);
    }
  }

  function show(scene) {
    sceneId = scene.id;
    const kind = scene.kind;
    const telling = kind === "memories" || kind === "letter" || kind === "forever";
    options.root.hidden = !telling;
    options.finds.hidden = kind !== "memories";
    options.envelope.hidden = kind !== "letter";
    options.letter.hidden = kind !== "letter" || !opened;
    options.finale.hidden = kind !== "forever";
    if (kind !== "memories") {
      options.reading.classList.remove("is-shown");
    }
    options.envelope.setAttribute("aria-label", COPY.letter.open);
    options.finaleLine.textContent = COPY.forever.line;
    options.replay.textContent = COPY.forever.replay;
    if (options.onScene) {
      options.onScene(kind);
    }
  }

  function update(dt) {
    if (!typing || sceneId !== "letter") {
      return;
    }
    if (!options.live()) {
      return;
    }
    const lines = COPY.letter.lines;
    if (lineIndex >= lines.length) {
      typing = false;
      return;
    }
    characters += dt * CHARACTERS_PER_SECOND;
    const written = lines.slice(0, lineIndex);
    const current = lines[lineIndex].slice(0, Math.floor(characters));
    options.visual.textContent = [...written, current].filter((line) => line.length > 0).join("\n\n");
    if (characters < lines[lineIndex].length) {
      return;
    }
    if (announced < lineIndex) {
      announced = lineIndex;
      options.liveText.textContent = lines.slice(0, lineIndex + 1).join(" ");
    }
    lineIndex += 1;
    characters = 0;
    if (lineIndex >= lines.length) {
      typing = false;
    }
  }

  function layout(pixel) {
    const spec = options.envelopeSpec;
    options.envelope.style.width = `${spec.width * pixel}px`;
    options.envelope.style.height = `${spec.height * pixel}px`;
    options.envelope.style.backgroundSize = `${spec.width * spec.frames * pixel}px ${spec.height * pixel}px`;
  }

  return { show, update, reveal, layout };
}
