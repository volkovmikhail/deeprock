import {
  GAME_WIDTH,
  GAME_HEIGHT,
  isNarrowViewport,
  setImageContain,
  setImageCover,
} from '../config.js';
import { hapticGemBreak } from '../haptics.js';
import { getScore, setScore } from '../state.js';

/** Масштаб рамки после contain (чуть >1 — немного шире/выше всплывающий декор). */
const BORDER_FRAME_SCALE = 1.1;

/** Макс. ширина рамки относительно ширины backdrop (1 = не шире фона; чуть >1 — допустимый люфт). */
const BORDER_MAX_WIDTH_VS_BACKDROP = 1.10;

/**
 * Внутреннее «окно» под поле: доли от размера спрайта рамки (толщина декора по краям текстуры).
 * Подогнано под border_frame.webp ~928×1232.
 */
const FRAME_INNER_PAD_X_RATIO = 0.22;
const FRAME_INNER_PAD_TOP_RATIO = 0.2;
const FRAME_INNER_PAD_BOTTOM_RATIO = 0.1;
const FRAME_INNER_PAD_X_MIN = 10;
const FRAME_INNER_PAD_TOP_MIN = 70;
const FRAME_INNER_PAD_BOTTOM_MIN = 12;
const FALL_ANIMATION_DURATION = 360;
const MATCH_RESOLVE_DELAY = 260;
const DESTROY_FADE_DURATION = 110;
const RENDER_STEP_DELAY_MIN = 90;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    this.load.image('game_backdrop', 'assets/bg.png');
    this.load.image('game_border_bg', 'assets/border_frame.webp');

    this.load.image('ore_copper', 'assets/copper_ore.webp');
    this.load.image('ore_gold', 'assets/gold_ore.webp');
    this.load.image('ore_emerald', 'assets/emerald_ore.webp');
    this.load.image('ore_lapis', 'assets/lapis_lazuli_ore.webp');
    this.load.image('ore_ruby', 'assets/ruby_ore.webp');
    this.load.image('ore_silver', 'assets/ssilver_ore.webp');
  }

  create() {
    this.GRID_ROWS = 9;
    this.GRID_COLS = 6;

    this.ORE_KEYS = ['ore_copper', 'ore_gold', 'ore_emerald', 'ore_lapis', 'ore_ruby', 'ore_silver'];

    this.board = [];
    this.gemsGroup = this.add.group();
    this.selectedGem = null;
    this.isResolvingBoard = false;
    this.activeSwapCount = 0;
    this.swapBatch = [];
    this.renderQueue = [];
    this.isRenderingQueue = false;
    this.visualVersion = 0;
    this.score = getScore();

    const narrow = isNarrowViewport(GAME_WIDTH, GAME_HEIGHT);

    const backdrop = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'game_backdrop')
      .setOrigin(0.5)
      .setDepth(-3);
    if (narrow) {
      setImageCover(backdrop, GAME_WIDTH, GAME_HEIGHT);
    } else {
      setImageContain(backdrop, GAME_WIDTH, GAME_HEIGHT);
    }

    const border = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'game_border_bg')
      .setOrigin(0.5)
      .setDepth(-2);
    setImageContain(border, GAME_WIDTH, GAME_HEIGHT);
    border.setDisplaySize(
      border.displayWidth * BORDER_FRAME_SCALE,
      border.displayHeight * BORDER_FRAME_SCALE,
    );
    const maxBorderW = backdrop.displayWidth * BORDER_MAX_WIDTH_VS_BACKDROP;
    if (border.displayWidth > maxBorderW) {
      const s = maxBorderW / border.displayWidth;
      border.setDisplaySize(border.displayWidth * s, border.displayHeight * s);
    }
    this.bgRect = {
      x: (GAME_WIDTH - border.displayWidth) / 2,
      y: (GAME_HEIGHT - border.displayHeight) / 2,
      width: border.displayWidth,
      height: border.displayHeight,
    };

    const padX = Math.max(FRAME_INNER_PAD_X_MIN, this.bgRect.width * FRAME_INNER_PAD_X_RATIO);
    const padTop = Math.max(FRAME_INNER_PAD_TOP_MIN, this.bgRect.height * FRAME_INNER_PAD_TOP_RATIO);
    const padBottom = Math.max(
      FRAME_INNER_PAD_BOTTOM_MIN,
      this.bgRect.height * FRAME_INNER_PAD_BOTTOM_RATIO,
    );
    const innerW = this.bgRect.width - 2 * padX;
    const innerH = this.bgRect.height - padTop - padBottom;

    this.CELL_SIZE = Math.min(innerW / this.GRID_COLS, innerH / this.GRID_ROWS);
    this.boardOffsetX =
      this.bgRect.x + padX + (innerW - this.GRID_COLS * this.CELL_SIZE) / 2;
    this.boardOffsetY =
      this.bgRect.y + padTop + (innerH - this.GRID_ROWS * this.CELL_SIZE) / 2;

    this.cameras.main.setBackgroundColor('#000000');

    const scoreFont = Math.max(18, Math.min(34, Math.round(this.bgRect.width * 0.06)));

    this.scoreText = this.add
      .text(
        this.bgRect.x + 44,
        Math.max(16, this.bgRect.y - 16),
        `Score: ${this.score}`,
        {
          fontFamily: 'Arial',
          fontSize: `${scoreFont}px`,
          color: '#ffffff',
        },
      )
      .setOrigin(0, 0.5)
      .setDepth(10);

    const menuFont = Math.max(13, Math.round(this.bgRect.width * 0.032));
    const menuBtnY = Math.max(2, this.bgRect.y - 32);
    const menuBtn = this.add
      .text(this.bgRect.x + this.bgRect.width - 50, menuBtnY, 'Main menu', {
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

    this.swipeStateByPointer = new Map();
    // Explicitly allow multi-touch gestures (2+ fingers in parallel).
    this.input.addPointer(2);

    this.input.on('pointerup', (pointer) => {
      this.onGemPointerUp(pointer);
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

  drawBoard(movement = [], boardState = this.board) {
    this.gemsGroup.clear(true, true);

    const offsetX = this.boardOffsetX;
    const offsetY = this.boardOffsetY;

    const movementMap = new Map();
    movement.forEach((cell) => {
      movementMap.set(`${cell.row},${cell.col}`, cell.fromRow);
    });
    const fallDuration = FALL_ANIMATION_DURATION;

    for (let row = 0; row < this.GRID_ROWS; row++) {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const colorIndex = boardState[row][col];
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
            ease: 'Cubic.easeOut',
          });
        }

        gem.setData('row', row);
        gem.setData('col', col);
        gem.setData('isAnimating', false);

        gem.setInteractive({ useHandCursor: true });
        gem.on('pointerdown', (pointer) => {
          if (gem.getData('isAnimating')) return;
          const swipeState = {
            gem,
            startX: pointer.worldX,
            startY: pointer.worldY,
            deferSameGemTap: false,
          };
          if (this.selectedGem === gem) {
            swipeState.deferSameGemTap = true;
          } else {
            this.onGemClicked(gem);
          }
          this.swipeStateByPointer.set(pointer.id, swipeState);
        });

        this.gemsGroup.add(gem);
      }
    }
  }

  findGemAt(row, col) {
    for (const g of this.gemsGroup.getChildren()) {
      if (g.getData('row') === row && g.getData('col') === col) {
        return g;
      }
    }
    return null;
  }

  onGemPointerUp(pointer) {
    const swipeState = this.swipeStateByPointer.get(pointer.id);
    if (!swipeState) {
      return;
    }
    this.swipeStateByPointer.delete(pointer.id);

    const gem = swipeState.gem;
    if (!gem || !gem.active) return;

    const dx = pointer.worldX - swipeState.startX;
    const dy = pointer.worldY - swipeState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const threshold = Math.max(18, this.CELL_SIZE * 0.22);

    if (dist >= threshold) {
      let dr = 0;
      let dc = 0;
      if (Math.abs(dx) >= Math.abs(dy)) {
        if (Math.abs(dx) < 1) {
          return;
        }
        dc = dx > 0 ? 1 : -1;
      } else {
        if (Math.abs(dy) < 1) {
          return;
        }
        dr = dy > 0 ? 1 : -1;
      }

      const r = gem.getData('row');
      const c = gem.getData('col');
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= this.GRID_ROWS || nc < 0 || nc >= this.GRID_COLS) {
        return;
      }

      const neighbor = this.findGemAt(nr, nc);
      if (neighbor) {
        this.attemptAdjacentSwap(gem, neighbor);
      }
      return;
    }

    if (swipeState.deferSameGemTap) {
      this.onGemClicked(gem);
    }
  }

  onGemClicked(gem) {
    if (gem.getData('isAnimating')) return;
    if (this.selectedGem && this.selectedGem.getData('isAnimating')) {
      this.selectedGem = null;
    }

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

      this.attemptAdjacentSwap(this.selectedGem, gem);
    }
  }

  attemptAdjacentSwap(gem1, gem2) {
    if (gem1.getData('isAnimating') || gem2.getData('isAnimating')) return;
    // Any new player swap invalidates previously queued visual cascade frames.
    this.visualVersion += 1;
    this.renderQueue = [];
    const r1 = gem1.getData('row');
    const c1 = gem1.getData('col');
    const r2 = gem2.getData('row');
    const c2 = gem2.getData('col');
    this.activeSwapCount += 1;
    this.swapBatch.push({ r1, c1, r2, c2 });
    const started = this.swapGems(gem1, gem2, () => {
      this.finalizeSwapStep();
    });
    if (!started) {
      this.activeSwapCount = Math.max(0, this.activeSwapCount - 1);
    }
    this.deselectGem(this.selectedGem);
    this.selectedGem = null;
  }

  finalizeSwapStep() {
    if (this.activeSwapCount > 0) {
      return;
    }

    const matches = this.findMatches(this.board);
    if (matches.length > 0) {
      this.swapBatch = [];
      this.handleMatches(matches);
      return;
    }

    this.revertSwapBatch();
  }

  revertSwapBatch() {
    if (this.swapBatch.length === 0) return;

    const swapsToRevert = this.swapBatch.slice().reverse();
    this.swapBatch = [];

    const runNextRevert = () => {
      if (swapsToRevert.length === 0) {
        return;
      }

      const { r1, c1, r2, c2 } = swapsToRevert.shift();
      const gem1 = this.findGemAt(r1, c1);
      const gem2 = this.findGemAt(r2, c2);
      if (!gem1 || !gem2 || gem1.getData('isAnimating') || gem2.getData('isAnimating')) {
        runNextRevert();
        return;
      }
      this.activeSwapCount += 1;
      const started = this.swapGems(gem1, gem2, () => {
        runNextRevert();
      });
      if (!started) {
        this.activeSwapCount = Math.max(0, this.activeSwapCount - 1);
        runNextRevert();
      }
    };

    runNextRevert();
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
    if (!gem1 || !gem2 || !gem1.active || !gem2.active) {
      onComplete();
      return false;
    }
    const r1 = gem1.getData('row');
    const c1 = gem1.getData('col');
    const r2 = gem2.getData('row');
    const c2 = gem2.getData('col');
    if (
      r1 === undefined ||
      c1 === undefined ||
      r2 === undefined ||
      c2 === undefined ||
      !this.board[r1] ||
      !this.board[r2] ||
      this.board[r1][c1] === undefined ||
      this.board[r2][c2] === undefined
    ) {
      onComplete();
      return false;
    }

    const tmp = this.board[r1][c1];
    this.board[r1][c1] = this.board[r2][c2];
    this.board[r2][c2] = tmp;

    gem1.setData('row', r2);
    gem1.setData('col', c2);
    gem2.setData('row', r1);
    gem2.setData('col', c1);

    const tweenDuration = 150;
    gem1.setData('isAnimating', true);
    gem2.setData('isAnimating', true);
    let completedTweens = 0;
    const finalizeSwap = () => {
      completedTweens += 1;
      if (completedTweens < 2) return;
      gem1.setData('isAnimating', false);
      gem2.setData('isAnimating', false);
      this.activeSwapCount = Math.max(0, this.activeSwapCount - 1);
      onComplete();
    };

    this.tweens.add({
      targets: gem1,
      x: gem2.x,
      y: gem2.y,
      duration: tweenDuration,
      ease: 'Quad.easeInOut',
      onComplete: finalizeSwap,
    });

    this.tweens.add({
      targets: gem2,
      x: gem1.x,
      y: gem1.y,
      duration: tweenDuration,
      ease: 'Quad.easeInOut',
      onComplete: finalizeSwap,
    });
    return true;
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
    let workBoard = this.board.map((row) => row.slice());
    let currentMatches = matches;
    const renderSteps = [];
    let totalRemoved = 0;

    while (currentMatches.length > 0) {
      const toRemove = new Set();
      currentMatches.forEach((m) => {
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

      totalRemoved += toRemove.size;
      toRemove.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        workBoard[r][c] = null;
      });

      const movement = [];
      const newBoard = [];
      for (let row = 0; row < this.GRID_ROWS; row++) {
        newBoard[row] = new Array(this.GRID_COLS).fill(null);
      }

      for (let col = 0; col < this.GRID_COLS; col++) {
        let pointer = this.GRID_ROWS - 1;
        for (let row = this.GRID_ROWS - 1; row >= 0; row--) {
          if (workBoard[row][col] !== null) {
            newBoard[pointer][col] = workBoard[row][col];
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

      workBoard = newBoard;
      const removedCells = Array.from(toRemove, (key) => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
      });
      renderSteps.push({
        board: newBoard.map((row) => row.slice()),
        movement,
        removedCells,
        visualVersion: this.visualVersion,
      });
      currentMatches = this.findMatches(workBoard);
    }

    if (totalRemoved > 0) {
      hapticGemBreak();
      const delta = totalRemoved * 10;
      this.score += delta;
      setScore(this.score);
      this.scoreText.setText(`Score: ${this.score}`);
      this.syncScoreDelta(delta);
    }

    this.board = workBoard;
    if (renderSteps.length > 0) {
      this.enqueueRenderSteps(renderSteps);
    }
    this.finalizeSwapStep();
  }

  enqueueRenderSteps(steps) {
    this.renderQueue.push(...steps);
    if (!this.isRenderingQueue) {
      this.playRenderQueue();
    }
  }

  playRenderQueue() {
    if (this.renderQueue.length === 0) {
      this.isRenderingQueue = false;
      return;
    }
    this.isRenderingQueue = true;
    const step = this.renderQueue.shift();
    if (step.visualVersion !== this.visualVersion) {
      this.drawBoard([], this.board);
      this.time.delayedCall(0, () => {
        this.playRenderQueue();
      });
      return;
    }
    const removedTargets = [];
    if (step.removedCells) {
      step.removedCells.forEach(({ row, col }) => {
        const gem = this.findGemAt(row, col);
        if (gem) removedTargets.push(gem);
      });
    }

    const continueRender = () => {
      this.drawBoard(step.movement, step.board);
      this.time.delayedCall(this.getRenderStepDelay(), () => {
        this.playRenderQueue();
      });
    };

    if (removedTargets.length > 0) {
      this.tweens.add({
        targets: removedTargets,
        alpha: 0.2,
        scale: (target) => target.scale * 0.9,
        duration: DESTROY_FADE_DURATION,
        ease: 'Sine.easeIn',
        onComplete: continueRender,
      });
      return;
    }

    continueRender();
  }

  getRenderStepDelay() {
    const queuePressure = this.renderQueue.length;
    const speedup = Math.min(140, queuePressure * 18);
    return Math.max(RENDER_STEP_DELAY_MIN, MATCH_RESOLVE_DELAY - speedup);
  }
}
