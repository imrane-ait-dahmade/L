/** Rebuild the meadow so its pixels stay square and the strip tiles the screen. */
export function createMeadow(root, track, logicalWidth, logicalHeight) {
  let pixel = 0;
  let laidWidth = 0;

  function layout(nextPixel) {
    const viewWidth = root.clientWidth;
    if (nextPixel === pixel && viewWidth === laidWidth && track.childElementCount > 0) {
      return;
    }
    pixel = nextPixel;
    laidWidth = viewWidth;
    const tileWidth = logicalWidth * pixel;
    const tileHeight = logicalHeight * pixel;
    root.style.height = `${tileHeight}px`;
    const tiles = Math.max(2, Math.ceil(viewWidth / tileWidth) + 1);
    const source = "assets/meadow.png";
    const fragment = document.createDocumentFragment();
    for (let copy = 0; copy < 2; copy += 1) {
      for (let index = 0; index < tiles; index += 1) {
        const image = document.createElement("img");
        image.src = source;
        image.alt = "";
        image.draggable = false;
        image.width = logicalWidth;
        image.height = logicalHeight;
        image.style.width = `${tileWidth}px`;
        image.style.height = `${tileHeight}px`;
        fragment.append(image);
      }
    }
    track.replaceChildren(fragment);
  }

  return { layout };
}
