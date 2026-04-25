import {
  GAME_HEIGHT,
  GAME_WIDTH,
  getSafeViewportRect,
  isSafeRectDebugEnabled,
  setImageCover,
} from '../config.js';
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
    this.handleResize = () => {
      this.scene.restart();
    };
    this.scale.on('resize', this.handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize);
    });

    const w = this.scale.width;
    const h = this.scale.height;
    const safeRect = getSafeViewportRect(w, h, GAME_WIDTH, GAME_HEIGHT);

    const bg = this.add
      .image(w / 2, h / 2, 'bg')
      .setOrigin(0.5)
      .setDepth(-2);
    setImageCover(bg, w, h);
    const contentRect = safeRect;
    if (isSafeRectDebugEnabled()) {
      this.add
        .graphics()
        .lineStyle(3, 0xff0000, 1)
        .strokeRect(safeRect.x, safeRect.y, safeRect.width, safeRect.height)
        .setDepth(1000);
    }

    this.cameras.main.setBackgroundColor('#000000');

    const titleSize = Math.max(16, Math.round(contentRect.width * 0.045));
    const subtitleSize = Math.max(14, Math.round(contentRect.width * 0.034));
    const hintSize = Math.max(12, Math.round(contentRect.width * 0.028));
    const titleY = contentRect.y + contentRect.height * 0.1;
    const subtitleY = titleY + titleSize + 10;
    const hintY = subtitleY + subtitleSize + 10;

    const line1 = username ? `Welcome ${username}!` : 'Welcome!';
    this.add
      .text(contentRect.x + contentRect.width / 2, titleY, line1, {
        fontFamily: 'Arial',
        fontSize: `${titleSize}px`,
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(contentRect.x + contentRect.width / 2, subtitleY, 'Lets drill some rocks!', {
        fontFamily: 'Arial',
        fontSize: `${subtitleSize}px`,
        color: '#e0e0e0',
        align: 'center',
      })
      .setOrigin(0.5);
    this.add
      .text(contentRect.x + contentRect.width / 2, hintY, 'Click on drill to start game', {
        fontFamily: 'Arial',
        fontSize: `${hintSize}px`,
        color: '#b0b0b0',
        align: 'center',
      })
      .setOrigin(0.5);

    const factory = this.add
      .image(contentRect.x + contentRect.width * 0.25, contentRect.y + contentRect.height * 0.62, 'factory')
      .setOrigin(0.5);
    let maxSide = Math.min(contentRect.width * 0.754, contentRect.height * 0.442);
    factory.setScale(maxSide / Math.max(factory.width, factory.height));

    const drill = this.add
      .image(contentRect.x + contentRect.width * 0.76, contentRect.y + contentRect.height * 0.68, 'drill')
      .setOrigin(0.5);
    maxSide = Math.min(contentRect.width * 0.55, contentRect.height * 0.35);
    drill.setScale(maxSide / Math.max(drill.width, drill.height));

    drill.setInteractive({ useHandCursor: true });
    drill.on('pointerdown', () => {
      this.scene.start('Game');
    });
  }
}
