# Phase 6 — animation director

The five scenes, the navigation, the generated pictures, and the words in `site/js/copy.js` are unchanged. Motion is staged by one director that runs at the start of the existing animation frame.

## Run

From the project root:

```text
.\.venv\Scripts\python.exe generate.py
.\.venv\Scripts\python.exe -m http.server 8765 --directory site
```

Open `http://127.0.0.1:8765/`.

## Director

`site/js/director.js` holds a profile for each scene and blends into it. Wind, petal count, firefly pace, sky pace, and moon glow all follow that profile. Cues are a fixed list of eight. A new cue is refused while a higher-priority one is running, and each gesture has a cooldown so the same effect cannot repeat immediately. The finale has the highest priority, so a touch during it does not start a second burst.

| Scene | Wind | Petals | Fireflies | Sky | Moon |
| --- | --- | --- | --- | --- | --- |
| The Beginning | 0.50 | 0.40 | 0.70 | 0.55 | 0.75 |
| The Flower | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Little Memories | 0.72 | 0.60 | 0.85 | 0.80 | 0.85 |
| A Secret Letter | 0.42 | 0.40 | 0.50 | 0.50 | 0.70 |
| Forever in This Moment | 1.12 | 1.35 | 1.28 | 1.20 | 1.35 |

Nothing is scheduled with a timer. Idle beats, cues, the finale, and the letter all advance only inside the shared frame, and that frame stops while motion is paused or the page is hidden.

## Events

Touching the daisy brightens it and opens the outer petals. About a fifth of a second later, five petals leave and a small spark appears. The blossom settles back on its own. Another touch inside 1.6 seconds only brightens it.

Choosing a star flashes that star. If the sky is free, a few sparks appear and a short shooting star leaves from that point. The cooldown is 1.4 seconds.

Choosing the moon pulses the halo and releases a small burst. The cooldown is 1.8 seconds.

Choosing a firefly flashes it, flashes any firefly nearby, and releases a small burst.

When the page has been still for 12 to 21 seconds, one star glints, or the fireflies drift weakly toward the flower. This is skipped on the letter, during the finale, while another cue is running, and when reduced motion is on.

## Finale

Entering Forever in This Moment, when motion is allowed, plays one sequence:

| Time | What happens |
| --- | --- |
| 0.5s | The moon halo starts to warm |
| 1.3s | The halo expands |
| 2.1s | The flower brightens and opens |
| 2.9s | Petals leave the flower |
| 3.7s | Fireflies drift toward the flower |
| 4.6s | A few stars flash, and one shooting star crosses |
| 5.5s | The closing line fades in |

Leaving the scene drops the remaining steps. Coming back starts the sequence again. The letter keeps whatever has already been written.

Reduced motion does not play the sequence. The closing line is shown at once, and the letter is shown whole. The page also starts paused.

## Picture

The daisy head is drawn one column at a time, so it can lean in the wind and open by a pixel without rotating the bitmap. The stem still bends with the shared wind. Fireflies keep their own paths, vary in brightness, and sometimes drift toward a neighbor. Stars twinkle. Clouds keep their slow drift. The moon’s ring breathes, and the finale can swell it.

## Layout

Titles break on balanced lines. On a narrow screen the chapter sits under the moon, the envelope sits above the title, the letter sits above the navigation, and the closing line and Replay sit in the open sky above the flower. Pause and Sound stay in the corner. The page does not scroll.

## Performance

One `requestAnimationFrame` loop. Delta time is capped at 0.05 seconds. The petal, spark, and shooting-star canvases stay the same size as their CSS box, so they are not drawn at a higher device ratio. Those effects stay in pools. The cue times live in one `Float32Array`.

## Checked

In the browser, at a 627×547 window and at 390×844:

- All five scenes, including the closed envelope, the open letter, and the closing line after the finale.
- A daisy touch produced sparks. A second touch inside the cooldown did not start another burst.
- A firefly touch and a star touch each produced a spark burst. The star touch was followed by a shooting star.
- A memory light revealed its note from `copy.js`.
- The letter paused at 4 characters and continued to 15 after Play.
- Leaving Forever during the sequence kept the open letter. Replay returned to The Beginning and closed the letter.
- The finale line was hidden at 1.5 seconds and visible after the sequence.
- With reduced motion, the page started paused, the grass did not change, the finale line was visible immediately, and the letter appeared whole.
- The status line stayed empty. No console errors were reported during the checks.
- Motion measured about 57 frames per second in the window and 61 at 390×844. The effect canvases matched their CSS size.
