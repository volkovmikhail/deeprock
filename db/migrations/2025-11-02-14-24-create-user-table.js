const { withTransaction } = require('../transaction-helper');

async function createUserTable() {
  return await withTransaction(async (connection) => {
    // Create users table with UUID
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        tg_id VARCHAR(255) PRIMARY KEY NOT NULL,
        first_name VARCHAR(255) NULL,
        last_name VARCHAR(255) NULL,
        username VARCHAR(255) NOT NULL,
        language_code VARCHAR(255) NOT NULL,
        photo_url VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
  });
}

module.exports = {
  createUserTable
};
