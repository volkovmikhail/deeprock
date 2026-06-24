import {
  GAME_HEIGHT,
  GAME_WIDTH,
  getSafeViewportRect,
  isSafeRectDebugEnabled,
  setImageCover,
} from '../config.js';
import { layoutBorderFrame } from '../borderFrame.js';
import { username, getMetals, getMinerals } from '../state.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');
    this.load.image('drill', 'assets/drill.webp');
    this.load.image('factory', 'assets/factory.webp');
    this.load.image('factory_border_bg', 'assets/border_frame.webp');
    this.load.image('res_metal_icon', 'assets/gold_ore.webp');
    this.load.image('res_mineral_icon', 'assets/ruby_ore.webp');
  }

  create() {
    this.factoryWindow = null;
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

    factory.setInteractive({ useHandCursor: true });
    factory.on('pointerdown', () => {
      this.openFactoryWindow(contentRect);
    });

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

  openFactoryWindow(safeRect) {
    if (this.factoryWindow) {
      return;
    }

    // Blocks clicks on menu buttons underneath and closes the window when tapped outside the frame.
    const overlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0)
      .setInteractive();

    const frame = this.add.image(0, 0, 'factory_border_bg');
    // Same fit/scale/padding math as the game board frame, so the window matches the game scene exactly.
    const { bgRect, innerRect } = layoutBorderFrame(frame, safeRect);
    frame.setInteractive();

    const rowFont = Math.max(14, Math.round(innerRect.width * 0.065));
    const iconSize = rowFont * 1.6;
    const padX = innerRect.width * 0.05;
    const padY = innerRect.height * 0.04;
    const rowGap = iconSize + rowFont * 0.5;
    const iconX = innerRect.x + padX + iconSize / 2;
    const textX = iconX + iconSize / 2 + rowFont * 0.4;
    const row1Y = innerRect.y + padY + iconSize / 2;
    const row2Y = row1Y + rowGap;

    const metalIcon = this.add.image(iconX, row1Y, 'res_metal_icon').setOrigin(0.5);
    metalIcon.setDisplaySize(iconSize, iconSize);
    const metalText = this.add
      .text(textX, row1Y, `Metals: ${getMetals()}`, {
        fontFamily: 'Arial',
        fontSize: `${rowFont}px`,
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    const mineralIcon = this.add.image(iconX, row2Y, 'res_mineral_icon').setOrigin(0.5);
    mineralIcon.setDisplaySize(iconSize, iconSize);
    const mineralText = this.add
      .text(textX, row2Y, `Minerals: ${getMinerals()}`, {
        fontFamily: 'Arial',
        fontSize: `${rowFont}px`,
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    const closeFont = Math.max(13, Math.round(bgRect.width * 0.032));
    const closeBtn = this.add
      .text(bgRect.x + bgRect.width - 50, Math.max(2, bgRect.y - 32), 'Close', {
        fontFamily: 'Arial',
        fontSize: `${closeFont}px`,
        color: '#eeeeee',
        backgroundColor: '#2d2d3d',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    this.factoryWindow = this.add
      .container(0, 0, [overlay, frame, metalIcon, metalText, mineralIcon, mineralText, closeBtn])
      .setDepth(50);

    const close = () => {
      this.factoryWindow.destroy(true);
      this.factoryWindow = null;
    };
    overlay.on('pointerdown', close);
    closeBtn.on('pointerdown', close);
  }
}
