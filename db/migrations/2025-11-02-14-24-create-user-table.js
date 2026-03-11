const { withTransaction } = require('../transaction-helper');

async function createUserTable() {
  return await withTransaction(async (connection) => {
    // Create users table with UUID
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE KEY unique_user_email (email, is_deleted)
      )
    `);
  });
}

module.exports = {
  createUserTable
};
