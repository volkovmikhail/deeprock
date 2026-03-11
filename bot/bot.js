const { Telegraf, Markup } = require('telegraf');
const config = require('../config/env');

const bot = new Telegraf(config.tgToken);

bot.command('start', (ctx) => {
  ctx.reply(
    'Hello! Press start to open the game.',
    Markup.inlineKeyboard([Markup.button.webApp('Open game', 'https://example.com')]),
  );
});

module.exports = { bot };
