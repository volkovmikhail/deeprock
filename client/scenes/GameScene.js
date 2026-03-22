import { GAME_WIDTH, GAME_HEIGHT, setImageContain, getContainRect } from '../config.js';
import { getScore, setScore } from '../state.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');

    this.load.image('ore_copper', 'assets/copper_ore.webp');
    this.load.image('ore_gold', 'assets/gold_ore.webp');
    this.load.image('ore_emerald', 'assets/emerald_ore.webp');
    this.load.image('ore_lapis', 'assets/lapis_lazuli_ore.webp');
    this.load.image('ore_ruby', 'assets/ruby_ore.webp');
    this.load.image('ore_silver', 'assets/ssilver_ore.webp');
  }

  create() {
    this.GRID_ROWS = 8;
    this.GRID_COLS = 8;

    this.ORE_KEYS = ['ore_copper', 'ore_gold', 'ore_emerald', 'ore_lapis', 'ore_ruby', 'ore_silver'];

    this.board = [];
    this.gemsGroup = this.add.group();
    this.selectedGem = null;
    this.isSwapping = false;
    this.score = getScore();

    this.backgroundImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg').setOrigin(0.5);
    setImageContain(this.backgroundImage, GAME_WIDTH, GAME_HEIGHT);
    this.backgroundImage.setDepth(-2);

    const iw = this.backgroundImage.frame.width;
    const ih = this.backgroundImage.frame.height;
    this.bgRect = getContainRect(GAME_WIDTH, GAME_HEIGHT, iw, ih);

    const padX = Math.max(4, this.bgRect.width * 0.02);
    const padTop = Math.max(52, this.bgRect.height * 0.1);
    const padBottom = Math.max(8, this.bgRect.height * 0.02);
    const innerW = this.bgRect.width - 2 * padX;
    const innerH = this.bgRect.height - padTop - padBottom;

    this.CELL_SIZE = Math.min(innerW / this.GRID_COLS, innerH / this.GRID_ROWS);
    this.boardOffsetX =
      this.bgRect.x + padX + (innerW - this.GRID_COLS * this.CELL_SIZE) / 2;
    this.boardOffsetY =
      this.bgRect.y + padTop + (innerH - this.GRID_ROWS * this.CELL_SIZE) / 2;

    this.cameras.main.setBackgroundColor('#000000');

    this.scoreText = this.add
      .text(
        this.bgRect.x + this.bgRect.width / 2,
        this.bgRect.y + Math.min(90, padTop * 0.95) + 16,
        `Score: ${this.score}`,
        {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: '#ffffff',
        },
      )
      .setOrigin(0.5)
      .setDepth(10);

    const menuFont = Math.max(13, Math.round(this.bgRect.width * 0.032));
    const menuBtn = this.add
      .text(this.bgRect.x + this.bgRect.width - 10, this.bgRect.y + 10, 'Main menu', {
        fontFamily: 'Arial',
        fontSize: `${menuFont}px`,
        color: '#eeeeee',
        backgroundColor: '#2d2d3d',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });

    this.createBoard();
    this.drawBoard();
  }

  update() {}

  syncScoreDelta(amount) {
    const tg = window?.Telegram?.WebApp;
    fetch('/api/user/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        auth: tg?.initData || '',
      },
      body: JSON.stringify({ amount }),
    }).catch(() => {});
  }

  createBoard() {
    this.board = [];
    for (let row = 0; row < this.GRID_ROWS; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.GRID_COLS; col++) {
        let colorIndex;
        do {
          colorIndex = Phaser.Math.Between(0, this.ORE_KEYS.length - 1);
          this.board[row][col] = colorIndex;
        } while (this.createsMatchAt(this.board, row, col));
      }
    }
  }

  createsMatchAt(b, row, col) {
    const color = b[row][col];
    if (col >= 2 && b[row][col - 1] === color && b[row][col - 2] === color) {
      return true;
    }
    if (row >= 2 && b[row - 1][col] === color && b[row - 2][col] === color) {
      return true;
    }
    return false;
  }

  drawBoard(movement = []) {
    this.gemsGroup.clear(true, true);

    const offsetX = this.boardOffsetX;
    const offsetY = this.boardOffsetY;

    const movementMap = new Map();
    movement.forEach((cell) => {
      movementMap.set(`${cell.row},${cell.col}`, cell.fromRow);
    });
    const fallDuration = 220;

    for (let row = 0; row < this.GRID_ROWS; row++) {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const colorIndex = this.board[row][col];
        const x = offsetX + col * this.CELL_SIZE + this.CELL_SIZE / 2;
        const y = offsetY + row * this.CELL_SIZE + this.CELL_SIZE / 2;

        const gemKey = this.ORE_KEYS[colorIndex];
        const gem = this.add.image(x, y, gemKey).setOrigin(0.5);

        const scaleFactor = (this.CELL_SIZE - 6) / Math.max(gem.width, gem.height);
        gem.setScale(scaleFactor);

        const fromRow = movementMap.get(`${row},${col}`);
        if (fromRow !== undefined) {
          const startY =
            fromRow >= 0 ? offsetY + fromRow * this.CELL_SIZE + this.CELL_SIZE / 2 : offsetY - this.CELL_SIZE;
          gem.y = startY;
          this.tweens.add({
            targets: gem,
            y,
            duration: fallDuration,
            ease: 'Quad.easeIn',
          });
        }

        gem.setData('row', row);
        gem.setData('col', col);

        gem.setInteractive({ useHandCursor: true });
        gem.on('pointerdown', () => this.onGemClicked(gem));

        this.gemsGroup.add(gem);
      }
    }
  }

  onGemClicked(gem) {
    if (this.isSwapping) return;

    if (!this.selectedGem) {
      this.selectGem(gem);
    } else if (this.selectedGem === gem) {
      this.deselectGem(this.selectedGem);
      this.selectedGem = null;
    } else {
      const r1 = this.selectedGem.getData('row');
      const c1 = this.selectedGem.getData('col');
      const r2 = gem.getData('row');
      const c2 = gem.getData('col');

      const isAdjacent =
        (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);

      if (!isAdjacent) {
        this.deselectGem(this.selectedGem);
        this.selectGem(gem);
        this.selectedGem = gem;
        return;
      }

      this.isSwapping = true;
      this.swapGems(this.selectedGem, gem, () => {
        const matches = this.findMatches(this.board);
        if (matches.length === 0) {
          this.swapGems(this.selectedGem, gem, () => {
            this.isSwapping = false;
          });
        } else {
          this.handleMatches(matches);
        }
        this.deselectGem(this.selectedGem);
        this.selectedGem = null;
      });
    }
  }

  selectGem(gem) {
    gem.setScale(gem.scale * 1.1);
    this.selectedGem = gem;
  }

  deselectGem(gem) {
    if (!gem) return;
    gem.setScale(gem.scale / 1.1);
  }

  swapGems(gem1, gem2, onComplete) {
    const r1 = gem1.getData('row');
    const c1 = gem1.getData('col');
    const r2 = gem2.getData('row');
    const c2 = gem2.getData('col');

    const tmp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = tmp;

    gem1.setData('row', r2);
    gem1.setData('col', c2);
    gem2.setData('row', r1);
    gem2.setData('col', c1);

    const tweenDuration = 150;

    this.tweens.add({
      targets: gem1,
      x: gem2.x,
      y: gem2.y,
      duration: tweenDuration,
      ease: 'Quad.easeInOut',
    });

    this.tweens.add({
      targets: gem2,
      x: gem1.x,
      y: gem1.y,
      duration: tweenDuration,
      ease: 'Quad.easeInOut',
      onComplete,
    });
  }

  findMatches(b) {
    const matches = [];

    for (let row = 0; row < this.GRID_ROWS; row++) {
      let matchLength = 1;
      for (let col = 1; col < this.GRID_COLS; col++) {
        if (b[row][col] === b[row][col - 1]) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            matches.push({
              type: 'row',
              row,
              colStart: col - matchLength,
              length: matchLength,
            });
          }
          matchLength = 1;
        }
      }
      if (matchLength >= 3) {
        matches.push({
          type: 'row',
          row,
          colStart: this.GRID_COLS - matchLength,
          length: matchLength,
        });
      }
    }

    for (let col = 0; col < this.GRID_COLS; col++) {
      let matchLength = 1;
      for (let row = 1; row < this.GRID_ROWS; row++) {
        if (b[row][col] === b[row - 1][col]) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            matches.push({
              type: 'col',
              col,
              rowStart: row - matchLength,
              length: matchLength,
            });
          }
          matchLength = 1;
        }
      }
      if (matchLength >= 3) {
        matches.push({
          type: 'col',
          col,
          rowStart: this.GRID_ROWS - matchLength,
          length: matchLength,
        });
      }
    }

    return matches;
  }

  handleMatches(matches) {
    const toRemove = new Set();

    matches.forEach((m) => {
      if (m.type === 'row') {
        for (let c = m.colStart; c < m.colStart + m.length; c++) {
          toRemove.add(`${m.row},${c}`);
        }
      } else {
        for (let r = m.rowStart; r < m.rowStart + m.length; r++) {
          toRemove.add(`${r},${m.col}`);
        }
      }
    });

    const delta = toRemove.size * 10;
    this.score += delta;
    setScore(this.score);
    this.scoreText.setText(`Score: ${this.score}`);
    this.syncScoreDelta(delta);

    toRemove.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      this.board[r][c] = null;
    });

    const movement = [];
    const newBoard = [];

    for (let row = 0; row < this.GRID_ROWS; row++) {
      newBoard[row] = new Array(this.GRID_COLS).fill(null);
    }

    for (let col = 0; col < this.GRID_COLS; col++) {
      let pointer = this.GRID_ROWS - 1;

      for (let row = this.GRID_ROWS - 1; row >= 0; row--) {
        if (this.board[row][col] !== null) {
          newBoard[pointer][col] = this.board[row][col];
          if (pointer !== row) {
            movement.push({ row: pointer, col, fromRow: row });
          }
          pointer--;
        }
      }

      for (let row = pointer; row >= 0; row--) {
        newBoard[row][col] = Phaser.Math.Between(0, this.ORE_KEYS.length - 1);
        movement.push({ row, col, fromRow: -1 });
      }
    }

    this.board = newBoard;

    this.drawBoard(movement);

    this.time.delayedCall(260, () => {
      const newMatches = this.findMatches(this.board);
      if (newMatches.length > 0) {
        this.handleMatches(newMatches);
      } else {
        this.isSwapping = false;
      }
    });
  }
}
