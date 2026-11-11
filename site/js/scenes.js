import { COPY, SCENES, sceneLine } from "./copy.js";

/** Shows one scene at a time and keeps the other scenes reachable. */
export function createChapter(scene, elements, reducedMotion, onChange) {
  let index = 0;
  let timer = 0;

  function paint() {
    const current = SCENES[index];
    scene.dataset.scene = current.id;
    scene.dataset.kind = current.kind;
    elements.title.textContent = current.title;
    elements.kicker.textContent = current.title;
    elements.line.textContent = sceneLine(current.id);
    document.title = `LOVE — ${current.title}`;
    if (onChange) {
      onChange(current);
    }
    elements.prev.disabled = index === 0;
    elements.next.disabled = index === SCENES.length - 1;
    elements.next.textContent = index === 0 ? COPY.stepCloser : COPY.continue;
    elements.dots.forEach((dot, dotIndex) => {
      if (dotIndex === index) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function go(nextIndex) {
    if (nextIndex < 0 || nextIndex >= SCENES.length || nextIndex === index) {
      return;
    }
    window.clearTimeout(timer);
    if (reducedMotion.matches) {
      index = nextIndex;
      paint();
      return;
    }
    scene.classList.add("is-fading");
    timer = window.setTimeout(() => {
      index = nextIndex;
      paint();
      scene.classList.remove("is-fading");
    }, 420);
  }

  elements.prev.addEventListener("click", () => go(index - 1));
  elements.next.addEventListener("click", () => go(index + 1));
  elements.dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => go(dotIndex));
  });

  paint();

  return {
    go,
    get index() {
      return index;
    },
    get id() {
      return SCENES[index].id;
    },
    get kind() {
      return SCENES[index].kind;
    },
  };
}
