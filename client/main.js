import { createGameConfig } from './config.js';
import { setUsername, setScore, setMetals, setMinerals } from './state.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';

const tg = window?.Telegram?.WebApp;

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
    setUsername(user.username);
    setScore(user.score ?? 0);
    setMetals(user.metals ?? 0);
    setMinerals(user.minerals ?? 0);

    const config = createGameConfig([MainMenuScene, GameScene]);
    new Phaser.Game(config);
  });
