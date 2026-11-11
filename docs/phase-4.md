# Phase 4 — the three later scenes

The first two scenes are unchanged. Little Memories, A Secret Letter, and Forever in This Moment now have their own interactions. Every line they show is read from `site/js/copy.js`.

## Run

From the project root:

```text
.\.venv\Scripts\python.exe generate.py
.\.venv\Scripts\python.exe -m http.server 8765 --directory site
```

Open `http://127.0.0.1:8765/`.

## Where the words live

`COPY` in `site/js/copy.js` is the only place to edit the story.

| Key | What it is |
| --- | --- |
| `beginning`, `flower` | The line under the title |
| `memories.line` | The invitation in Little Memories |
| `memories.finds` | Four notes. Each has `id`, `label`, and `text` |
| `letter.line` | The line beside the envelope |
| `letter.open` | The envelope’s accessible name |
| `letter.lines` | The letter, one string per paragraph |
| `forever.line` | The closing message |
| `forever.replay` | The label on the replay control |

The ids `lantern`, `firefly`, `star`, and `bud` are the four discoveries. Change their text. Leave the ids in place so the buttons still match.

## What each scene does

Little Memories keeps the meadow. Four lights float in the scene: a lantern, a firefly, a star, and a small flower. Choosing one fades in its note. A firefly or a star in the sky reveals the same note as its button. Nothing has to be found before Continue.

A Secret Letter shows a floating envelope. Choosing it lifts the flap and the letter eases out. The paragraphs arrive a few characters at a time. Pause holds the writing where it is. Resume continues it. Reduced motion shows the whole letter at once. The letter stays open if you leave and come back. Replay closes it again.

Forever in This Moment lifts a warm light over the meadow, lets more petals fall, and keeps the fireflies and shooting stars busier. The closing line sits in the sky, with Replay under it. Replay returns to The Beginning and clears the notes and the opened letter. Back and the scene numbers still move one scene at a time and do not clear those discoveries.

## How it is built

`site/js/scenes.js` still owns the five-scene navigation and the fade. When the scene changes it tells `site/js/story.js`. That module builds the lights, the envelope, the letter, and the closing message. It does not keep a second copy of the words.

The envelope picture is `site/assets/envelope.png`, two frames from `generators/envelope.py`. `python generate.py` writes it with the rest of the pictures.

Pause, Sound, and the scene row are the same controls as before. Sound stays off until it is turned on. The page does not scroll.

## Checked

In the browser: all five scenes, Back and Continue, a memory note, the envelope opening, the letter pausing and resuming, Replay returning to the start, and a 390×844 layout with no page scroll. The status line stayed empty. Motion stayed near 60 frames per second.
