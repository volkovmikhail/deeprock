export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;

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
