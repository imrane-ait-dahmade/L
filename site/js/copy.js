/**
 * Editable scene text.
 * Replace the placeholder lines when the story is written.
 * Animation modules read this file. They do not keep their own copy.
 */
export function sceneLine(id) {
  const value = COPY[id];
  if (typeof value === "string") {
    return value;
  }
  return value && value.line ? value.line : "";
}

export const COPY = {
  beginning: "Placeholder. Write the opening line of the piece here.",
  flower: "Placeholder. Write the meadow line here.",
  memories: {
    line: "Placeholder. Touch a light when you want to read.",
    finds: [
      {
        id: "lantern",
        label: "Touch the lantern",
        text: "Placeholder. Write the first note here.",
      },
      {
        id: "firefly",
        label: "Touch the firefly",
        text: "Placeholder. Write the second note here.",
      },
      {
        id: "star",
        label: "Touch the star",
        text: "Placeholder. Write the third note here.",
      },
      {
        id: "bud",
        label: "Touch the small flower",
        text: "Placeholder. Write the fourth note here.",
      },
    ],
  },
  letter: {
    line: "Placeholder. The envelope can wait.",
    open: "Open the envelope",
    lines: [
      "Placeholder. Write the first line of the letter here.",
      "Placeholder. Write the next line here.",
      "Placeholder. Write the last line here.",
    ],
  },
  forever: {
    line: "Placeholder. Write the closing line of the piece here.",
    replay: "Replay",
  },
  stepCloser: "Step closer",
  continue: "Continue",
  back: "Back",
};

export const SCENES = [
  { id: "beginning", title: "The Beginning", kind: "opening" },
  { id: "flower", title: "The Flower", kind: "meadow" },
  { id: "memories", title: "Little Memories", kind: "memories" },
  { id: "letter", title: "A Secret Letter", kind: "letter" },
  { id: "forever", title: "Forever in This Moment", kind: "forever" },
];
