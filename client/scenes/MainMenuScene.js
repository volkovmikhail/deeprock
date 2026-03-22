import { getContainRect, isNarrowViewport, setImageContain, setImageCover } from '../config.js';
import { username } from '../state.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');
    this.load.image('drill', 'assets/drill.webp');
    this.load.image('factory', 'assets/factory.webp');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const bg = this.add
      .image(w / 2, h / 2, 'bg')
      .setOrigin(0.5)
      .setDepth(-2);
    const narrow = isNarrowViewport(w, h);
    if (narrow) {
      setImageCover(bg, w, h);
    } else {
      setImageContain(bg, w, h);
    }

    const iw = bg.frame.width;
    const ih = bg.frame.height;
    const r = narrow
      ? { x: 0, y: 0, width: w, height: h }
      : getContainRect(w, h, iw, ih);

    this.cameras.main.setBackgroundColor('#000000');

    const titleSize = Math.max(16, Math.round(r.width * 0.045));
    const subtitleSize = Math.max(14, Math.round(r.width * 0.034));
    const hintSize = Math.max(12, Math.round(r.width * 0.028));
    const titleY = r.y + r.height * 0.1;
    const subtitleY = titleY + titleSize + 10;
    const hintY = subtitleY + subtitleSize + 10;

    const line1 = username ? `Welcome ${username}!` : 'Welcome!';
    this.add
      .text(r.x + r.width / 2, titleY, line1, {
        fontFamily: 'Arial',
        fontSize: `${titleSize}px`,
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(r.x + r.width / 2, subtitleY, 'Lets drill some rocks!', {
        fontFamily: 'Arial',
        fontSize: `${subtitleSize}px`,
        color: '#e0e0e0',
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(r.x + r.width / 2, hintY, 'Click on drill to start game', {
        fontFamily: 'Arial',
        fontSize: `${hintSize}px`,
        color: '#b0b0b0',
        align: 'center',
      })
      .setOrigin(0.5);

    const factory = this.add.image(r.x + r.width * 0.25, r.y + r.height * 0.62, 'factory').setOrigin(0.5);
    let maxSide = Math.min(r.width * 0.754, r.height * 0.442);
    factory.setScale(maxSide / Math.max(factory.width, factory.height));

    const drill = this.add.image(r.x + r.width * 0.76, r.y + r.height * 0.68, 'drill').setOrigin(0.5);
    maxSide = Math.min(r.width * 0.55, r.height * 0.35);
    drill.setScale(maxSide / Math.max(drill.width, drill.height));

    drill.setInteractive({ useHandCursor: true });
    drill.on('pointerdown', () => {
      this.scene.start('Game');
    });
  }
}
