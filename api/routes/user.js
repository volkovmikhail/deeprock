const { Router } = require('express');
const db = require('../../db/database');

const userRouter = Router();

userRouter.get('/profile', (req, res) => {
  const { id: tg_id, first_name, last_name, username, language_code = 'en', photo_url } = req.tgUser;

  db.execute(
    `
     INSERT INTO users (tg_id, first_name, last_name, username, language_code, photo_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        username = VALUES(username),
        language_code = VALUES(language_code),
        photo_url = VALUES(photo_url),
        updated_at = CURRENT_TIMESTAMP
  `,
    [tg_id, first_name ?? null, last_name ?? null, username, language_code, photo_url ?? null],
  );

  res.json({
    id: req.tgUser?.id,
    first_name: req.tgUser?.first_name,
    last_name: req.tgUser?.last_name,
    username: req.tgUser?.username,
    language_code: req.tgUser?.language_code,
    photo_url: req.tgUser?.photo_url,
  });
});

module.exports = {
  userRouter,
};
