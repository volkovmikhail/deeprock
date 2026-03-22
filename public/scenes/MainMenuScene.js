export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');
    this.load.image('drill', 'assets/drill.webp');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add
      .image(w / 2, h / 2, 'bg')
      .setOrigin(0.5)
      .setDisplaySize(w, h)
      .setDepth(-2);

    this.cameras.main.setBackgroundColor('#000000');

    const drill = this.add.image(w / 2, h * 0.58, 'drill').setOrigin(0.5);
    const maxSide = Math.min(w * 0.55, h * 0.42);
    drill.setScale(maxSide / Math.max(drill.width, drill.height));

    drill.setInteractive({ useHandCursor: true });
    drill.on('pointerdown', () => {
      this.scene.start('Game');
    });
  }
}
