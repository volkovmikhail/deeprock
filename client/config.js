export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;

/** Like CSS object-fit: contain — whole image visible; on tall/narrow screens it scales to max height with side bars. */
export function setImageContain(image, vw, vh) {
  const iw = image.frame.width;
  const ih = image.frame.height;
  const s = Math.min(vw / iw, vh / ih);
  image.setDisplaySize(iw * s, ih * s);
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

export function createGameConfig(scenes) {
  return {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    render: {
      pixelArt: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: 'game-container',
    },
    scene: scenes,
  };
}
