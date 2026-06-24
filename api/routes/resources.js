const { Router } = require('express');
const db = require('../../db/database');
const { LocalError } = require('../../middlewares/error-handler');

const resourcesRouter = Router();

const MAX_RESOURCE_INCREMENT = 100_000;
const RESOURCE_TYPES = ['metals', 'minerals'];

resourcesRouter.get('/', async (req, res) => {
  const tgKey = String(req.tgUser.id);

  const [rows] = await db.execute(
    'SELECT resource_type, amount FROM user_resources WHERE tg_id = ?',
    [tgKey],
  );

  const result = { metals: 0, minerals: 0 };
  rows.forEach((row) => {
    result[row.resource_type] = Number(row.amount);
  });

  res.json(result);
});

resourcesRouter.post('/', async (req, res) => {
  const tgKey = String(req.tgUser.id);

  const deltas = [];
  for (const type of RESOURCE_TYPES) {
    const raw = req.body?.[type] ?? 0;
    const amount = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);

    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_RESOURCE_INCREMENT) {
      throw new LocalError(400, `${type} must be an integer from 0 to ${MAX_RESOURCE_INCREMENT}`);
    }

    if (amount > 0) {
      deltas.push({ type, amount });
    }
  }

  if (deltas.length === 0) {
    throw new LocalError(400, 'No resource deltas provided');
  }

  for (const { type, amount } of deltas) {
    // Upsert: creates the resource row on the user's first earn of this type, otherwise increments it.
    await db.execute(
      `
      INSERT INTO user_resources (tg_id, resource_type, amount)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        amount = amount + VALUES(amount),
        updated_at = CURRENT_TIMESTAMP
    `,
      [tgKey, type, amount],
    );
  }

  res.status(204).end();
});

module.exports = {
  resourcesRouter,
};
