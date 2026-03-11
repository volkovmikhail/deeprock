const config = require("../config/env");
const crypto = require('crypto');

const BOT_TOKEN = config.tgToken;

function authenticate(req, res, next) {
  const { initData } = req.body;

  if (!initData) {
    return res.status(401).json({ error: 'No initData provided' });
  }

  // Парсим initData в объект
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  // Сортируем ключи и создаем строку для проверки
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Создаем секретный ключ из токена бота
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

  // Вычисляем HMAC
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Сравниваем с полученным hash
  if (computedHash !== hash) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Проверяем, что данные не устарели (Telegram ставит auth_date)
  const authDate = parseInt(params.get('auth_date'));
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    // 24 часа
    return res.status(403).json({ error: 'Data is too old' });
  }

  // Добавляем пользователя в request
  req.tgUser = JSON.parse(params.get('user') || '{}');
  req.tgData = Object.fromEntries(params.entries());

  next();
}

module.exports = {
  authenticate,
};
