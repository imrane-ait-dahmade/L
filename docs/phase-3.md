# Phase 3 — scene flow and interaction

The browser still runs on its own. Python only rebuilds the pictures.

## Run

From the project root:

```text
.\.venv\Scripts\python.exe generate.py
.\.venv\Scripts\python.exe -m http.server 8765 --directory site
```

Open `http://127.0.0.1:8765/`. ES modules need that local server. `file://` will not load them.

## Scenes

`site/js/copy.js` lists the five scenes and the lines that appear on screen. Only the first two are the artwork. The other three open a titled placeholder so the navigation is real, and the story can be written later by editing `COPY`.

| Order | Title | What it does now |
| --- | --- | --- |
| 1 | The Beginning | Night, title, and the flower set a little farther back |
| 2 | The Flower | The full meadow. Touch the flower, petals, moon, stars, fireflies, clouds, buds, and the stone |
| 3 | Little Memories | Placeholder |
| 4 | A Secret Letter | Placeholder |
| 5 | Forever in This Moment | Placeholder |

`site/js/scenes.js` swaps `data-scene` and `data-kind` on `#scene`. The kinds are `opening`, `meadow`, and `placeholder`. A short veil covers the change. `prefers-reduced-motion` skips that fade.

The row under the picture is the only scene navigation: Back, five numbered scenes, and Continue. Pause and Sound stay in the corner. Sound stays off until it is turned on.

## What a touch does

Motion has to be playing. Placeholder scenes do not take these touches.

- The daisy sheds a ring of petals and brightens.
- A falling petal pops into sparks, and the blossom brightens more softly.
- A firefly flares and throws a few sparks.
- A star flares and sends a short shooting star.
- A cloud lifts in opacity.
- The moon’s halo pulses.
- A bud or the stone takes a brief outline and sparks.

Wind, grass, petals, fireflies, and the pause control are the same loop as before. Pointer position shifts the sky, the moon, the flower, and the grass by a few pixels. Reduced motion skips that shift.

## Pictures

`python generate.py` writes `site/assets/` and `manifest.json`. The night sky uses `#09152D` at the top and `#172D55` through the middle. Grass tips use `#B7CE93`. `tokens.png` is a pebble and a closed bud, 16 pixels each.

The page colors are the same set: deep navy `#09152D`, night blue `#172D55`, soft blue `#A9B9E8`, warm white `#F5EBD1`, a little pink `#E9A9C8`, and green `#B7CE93`.

## Files that carry the new behavior

- `site/js/copy.js` — titles and placeholder lines
- `site/js/scenes.js` — which scene is showing
- `site/js/main.js` — input, parallax, and the existing frame loop
- `site/js/sky.js`, `fireflies.js`, `flower.js`, `glow.js` — responses
- `site/css/scene.css` — type, navigation, and scene layouts
- `generators/tokens.py` — the bud and the stone
