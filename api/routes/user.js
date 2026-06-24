const { Router } = require('express');
const db = require('../../db/database');
const { LocalError } = require('../../middlewares/error-handler');

const userRouter = Router();

const MAX_SCORE_INCREMENT = 100_000;

userRouter.get('/profile', async (req, res) => {
  const { id: tg_id, first_name, last_name, username, language_code = 'en', photo_url } = req.tgUser;
  const tgKey = String(tg_id);

  const [userUpsertResult] = await db.execute(
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
    [tgKey, first_name ?? null, last_name ?? null, username, language_code, photo_url ?? null],
  );

  const [[row]] = await db.execute('SELECT score FROM users WHERE tg_id = ? LIMIT 1', [tgKey]);

  // affectedRows is 1 only when the row was newly inserted (per MySQL INSERT ... ON DUPLICATE KEY UPDATE semantics).
  const isNewUser = userUpsertResult.affectedRows === 1;
  if (isNewUser) {
    await db.execute(
      `
      INSERT INTO user_resources (tg_id, resource_type, amount)
      VALUES (?, 'metals', 0), (?, 'minerals', 0)
    `,
      [tgKey, tgKey],
    );
  }

  const [resourceRows] = await db.execute(
    'SELECT resource_type, amount FROM user_resources WHERE tg_id = ?',
    [tgKey],
  );
  const resources = { metals: 0, minerals: 0 };
  resourceRows.forEach((resourceRow) => {
    resources[resourceRow.resource_type] = Number(resourceRow.amount);
  });

  res.json({
    id: req.tgUser?.id,
    first_name: req.tgUser?.first_name,
    last_name: req.tgUser?.last_name,
    username: req.tgUser?.username,
    language_code: req.tgUser?.language_code,
    photo_url: req.tgUser?.photo_url,
    score: row?.score != null ? String(row.score) : null,
    metals: resources.metals,
    minerals: resources.minerals,
  });
});

// DEPRECATED: the client no longer tracks or sends score (replaced by metals/minerals).
// Route and the `score` column are kept as-is for backwards compatibility; nothing calls this anymore.
userRouter.post('/score', async (req, res) => {
  const raw = req.body?.amount ?? 1;
  const amount = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);

  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_SCORE_INCREMENT) {
    throw new LocalError(400, `amount must be an integer from 1 to ${MAX_SCORE_INCREMENT}`);
  }

  const { id: tg_id } = req.tgUser;
  const tgKey = String(tg_id);

  const [updateResult] = await db.execute(
    `
    UPDATE users
    SET score = COALESCE(score, 0) + ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE tg_id = ?
  `,
    [amount, tgKey],
  );

  if (updateResult.affectedRows === 0) {
    throw new LocalError(404, 'User not found');
  }

  res.status(204).end();
});

module.exports = {
  userRouter,
};
