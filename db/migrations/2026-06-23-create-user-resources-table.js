const { withTransaction } = require('../transaction-helper');

async function createUserResourcesTable() {
  return await withTransaction(async (connection) => {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tg_id VARCHAR(255) NOT NULL,
        resource_type ENUM('metals', 'minerals') NOT NULL,
        amount BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_resource (tg_id, resource_type),
        CONSTRAINT fk_user_resources_user FOREIGN KEY (tg_id) REFERENCES users(tg_id)
      )
    `);

    // Backfill one row per existing user for each resource type.
    // (`id = id` is a deliberate no-op on conflict; `tg_id` would be ambiguous since it's also a column on `users`.)
    await connection.execute(`
      INSERT INTO user_resources (tg_id, resource_type, amount)
      SELECT tg_id, 'metals', 0 FROM users
      ON DUPLICATE KEY UPDATE id = id
    `);

    await connection.execute(`
      INSERT INTO user_resources (tg_id, resource_type, amount)
      SELECT tg_id, 'minerals', 0 FROM users
      ON DUPLICATE KEY UPDATE id = id
    `);
  });
}

module.exports = {
  createUserResourcesTable,
};
