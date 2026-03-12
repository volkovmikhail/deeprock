const tg = window?.Telegram?.WebApp;

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

let username;

fetch('/api/user/profile', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    auth: tg?.initData || '',
  },
})
  .then((res) => {
    return res.json();
  })
  .then((user) => {
    username = user.username;

    start();
  });

async function start() {
  const config = {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: 'game-container',
    },
    scene: {
      preload,
      create,
      update,
    },
  };

  const game = new Phaser.Game(config);

  const GRID_ROWS = 8;
  const GRID_COLS = 8;
  const CELL_SIZE = GAME_HEIGHT > GAME_WIDTH ? GAME_WIDTH / (GRID_COLS + 2) : GAME_HEIGHT / (GRID_ROWS + 2);

  const ORE_KEYS = ['ore_copper', 'ore_gold', 'ore_emerald', 'ore_lapis', 'ore_ruby', 'ore_silver'];

  let board = [];
  let gemsGroup;
  let selectedGem = null;
  let isSwapping = false;
  let score = 0;
  let scoreText;
  let backgroundImage;

  function preload() {
    // background
    this.load.image('bg', 'assets/bg.png');

    // ores
    this.load.image('ore_copper', 'assets/copper_ore.webp');
    this.load.image('ore_gold', 'assets/gold_ore.webp');
    this.load.image('ore_emerald', 'assets/emerald_ore.webp');
    this.load.image('ore_lapis', 'assets/lapis_lazuli_ore.webp');
    this.load.image('ore_ruby', 'assets/ruby_ore.webp');
    this.load.image('ore_silver', 'assets/ssilver_ore.webp');
  }

  function create() {
    backgroundImage = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg')
      .setOrigin(0.5);
    backgroundImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    backgroundImage.setDepth(-2);

    this.cameras.main.setBackgroundColor('#000000');

    gemsGroup = this.add.group();
    createBoard(this);
    drawBoard(this);

    scoreText = this.add
      .text(GAME_WIDTH / 2, 40, `${username ?? ''}'s Score: 0`, {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  function update() {}

  function createBoard(scene) {
    board = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      board[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        let colorIndex;
        do {
          colorIndex = Phaser.Math.Between(0, ORE_KEYS.length - 1);
          board[row][col] = colorIndex;
        } while (createsMatchAt(board, row, col));
      }
    }
  }

  function createsMatchAt(b, row, col) {
    const color = b[row][col];
    // horizontal
    if (col >= 2 && b[row][col - 1] === color && b[row][col - 2] === color) {
      return true;
    }
    // vertical
    if (row >= 2 && b[row - 1][col] === color && b[row - 2][col] === color) {
      return true;
    }
    return false;
  }

  function drawBoard(scene, movement = []) {
    gemsGroup.clear(true, true);

    const offsetX = (GAME_WIDTH - GRID_COLS * CELL_SIZE) / 2;
    const offsetY = 100;

    const movementMap = new Map();
    movement.forEach((cell) => {
      movementMap.set(`${cell.row},${cell.col}`, cell.fromRow);
    });
    const fallDuration = 220;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const colorIndex = board[row][col];
        const x = offsetX + col * CELL_SIZE + CELL_SIZE / 2;
        const y = offsetY + row * CELL_SIZE + CELL_SIZE / 2;

        const gemKey = ORE_KEYS[colorIndex];
        const gem = scene.add.image(x, y, gemKey).setOrigin(0.5);

        const scaleFactor = (CELL_SIZE - 6) / Math.max(gem.width, gem.height);
        gem.setScale(scaleFactor);

        const fromRow = movementMap.get(`${row},${col}`);
        if (fromRow !== undefined) {
          const startY = fromRow >= 0 ? offsetY + fromRow * CELL_SIZE + CELL_SIZE / 2 : offsetY - CELL_SIZE;
          gem.y = startY;
          scene.tweens.add({
            targets: gem,
            y,
            duration: fallDuration,
            ease: 'Quad.easeIn',
          });
        }

        gem.setData('row', row);
        gem.setData('col', col);

        gem.setInteractive({ useHandCursor: true });
        gem.on('pointerdown', () => onGemClicked(scene, gem));

        gemsGroup.add(gem);
      }
    }
  }

  function onGemClicked(scene, gem) {
    if (isSwapping) return;

    if (!selectedGem) {
      selectGem(gem);
    } else if (selectedGem === gem) {
      deselectGem(selectedGem);
      selectedGem = null;
    } else {
      const r1 = selectedGem.getData('row');
      const c1 = selectedGem.getData('col');
      const r2 = gem.getData('row');
      const c2 = gem.getData('col');

      const isAdjacent = (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);

      if (!isAdjacent) {
        deselectGem(selectedGem);
        selectGem(gem);
        selectedGem = gem;
        return;
      }

      isSwapping = true;
      swapGems(scene, selectedGem, gem, () => {
        const matches = findMatches(board);
        if (matches.length === 0) {
          // swap back
          swapGems(scene, selectedGem, gem, () => {
            isSwapping = false;
          });
        } else {
          handleMatches(scene, matches);
        }
        deselectGem(selectedGem);
        selectedGem = null;
      });
    }
  }

  function selectGem(gem) {
    gem.setScale(gem.scale * 1.1);
    selectedGem = gem;
  }

  function deselectGem(gem) {
    if (!gem) return;
    gem.setScale(gem.scale / 1.1);
  }

  function swapGems(scene, gem1, gem2, onComplete) {
    const r1 = gem1.getData('row');
    const c1 = gem1.getData('col');
    const r2 = gem2.getData('row');
    const c2 = gem2.getData('col');

    // swap in board
    const tmp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = tmp;

    gem1.setData('row', r2);
    gem1.setData('col', c2);
    gem2.setData('row', r1);
    gem2.setData('col', c1);

    const tweenDuration = 150;

    const tween1 = scene.tweens.add({
      targets: gem1,
      x: gem2.x,
      y: gem2.y,
      duration: tweenDuration,
      ease: 'Quad.easeInOut',
    });

    const tween2 = scene.tweens.add({
      targets: gem2,
      x: gem1.x,
      y: gem1.y,
      duration: tweenDuration,
      ease: 'Quad.easeInOut',
      onComplete,
    });
  }

  function findMatches(b) {
    const matches = [];

    // horizontal
    for (let row = 0; row < GRID_ROWS; row++) {
      let matchLength = 1;
      for (let col = 1; col < GRID_COLS; col++) {
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
          colStart: GRID_COLS - matchLength,
          length: matchLength,
        });
      }
    }

    // vertical
    for (let col = 0; col < GRID_COLS; col++) {
      let matchLength = 1;
      for (let row = 1; row < GRID_ROWS; row++) {
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
          rowStart: GRID_ROWS - matchLength,
          length: matchLength,
        });
      }
    }

    return matches;
  }

  function handleMatches(scene, matches) {
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

    score += toRemove.size * 10;
    scoreText.setText(`${username ?? ''}'s Score: ${score}`);

    // clear matched cells
    toRemove.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      board[r][c] = null;
    });

    // gravity + spawn new
    const movement = [];
    const newBoard = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      newBoard[row] = new Array(GRID_COLS).fill(null);
    }

    for (let col = 0; col < GRID_COLS; col++) {
      let pointer = GRID_ROWS - 1;

      for (let row = GRID_ROWS - 1; row >= 0; row--) {
        if (board[row][col] !== null) {
          newBoard[pointer][col] = board[row][col];
          if (pointer !== row) {
            movement.push({ row: pointer, col, fromRow: row });
          }
          pointer--;
        }
      }

      for (let row = pointer; row >= 0; row--) {
        newBoard[row][col] = Phaser.Math.Between(0, ORE_KEYS.length - 1);
        movement.push({ row, col, fromRow: -1 });
      }
    }

    board = newBoard;

    drawBoard(scene, movement);

    scene.time.delayedCall(260, () => {
      const newMatches = findMatches(board);
      if (newMatches.length > 0) {
        handleMatches(scene, newMatches);
      } else {
        isSwapping = false;
      }
    });
  }
}
