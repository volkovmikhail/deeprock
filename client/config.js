/**
 * Canonical portrait frame used for all layout math.
 * UI is designed against 430x932 and then fitted into a centered safe rectangle.
 */
export const GAME_WIDTH = 430;
export const GAME_HEIGHT = 932;
export const SAFE_RECT_DEBUG = false;

/** Like CSS object-fit: contain — whole image visible; on tall/narrow screens it scales to max height with side bars. */
export function setImageContain(image, vw, vh) {
  const iw = image.frame.width;
  const ih = image.frame.height;
  const s = Math.min(vw / iw, vh / ih);
  image.setDisplaySize(iw * s, ih * s);
}

/** Like CSS object-fit: cover — fills viewport; may crop edges; no letterboxing from the image. */
export function setImageCover(image, vw, vh) {
  const iw = image.frame.width;
  const ih = image.frame.height;
  const s = Math.max(vw / iw, vh / ih);
  image.setDisplaySize(iw * s, ih * s);
}

/** Portrait / «узкий» экран по ширине — там фон лучше вести как cover, без боковых полос. */
export function isNarrowViewport(vw, vh) {
  return vw < vh;
}

/** Axis-aligned rect of a contained image centered in (vw, vh), same math as setImageContain. */
export function getContainRect(vw, vh, iw, ih) {
  const s = Math.min(vw / iw, vh / ih);
  const w = iw * s;
  const h = ih * s;
  return {
    x: (vw - w) / 2,
    y: (vh - h) / 2,
    width: w,
    height: h,
  };
}

/**
 * Centered fixed-aspect rectangle that fits into the current screen.
 * Use it as the single source of truth for stable UI placement.
 */
export function getSafeViewportRect(screenW, screenH, targetW = GAME_WIDTH, targetH = GAME_HEIGHT) {
  const targetAspect = targetW / targetH;
  const screenAspect = screenW / screenH;

  if (screenAspect > targetAspect) {
    const height = screenH;
    const width = height * targetAspect;
    return {
      x: (screenW - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  const width = screenW;
  const height = width / targetAspect;
  return {
    x: 0,
    y: (screenH - height) / 2,
    width,
    height,
  };
}

export function isSafeRectDebugEnabled() {
  return SAFE_RECT_DEBUG;
}

export function createGameConfig(scenes) {
  return {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    render: {
      pixelArt: true,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'game-container',
    },
    scene: scenes,
  };
}
