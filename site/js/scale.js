/** CSS pixels per art pixel, matched to how the sky image covers the viewport. */
export function artPixelSize(skyWidth, skyHeight) {
  const scale = Math.max(window.innerWidth / skyWidth, window.innerHeight / skyHeight);
  return Math.max(2, Math.round(scale));
}
