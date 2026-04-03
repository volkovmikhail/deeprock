const { withTransaction } = require('../transaction-helper');

async function addUserScoreColumn() {
  return await withTransaction(async (connection) => {
    await connection.execute(`
      ALTER TABLE users
      ADD COLUMN score BIGINT NULL
    `);
  });
}

module.exports = {
  addUserScoreColumn,
};
