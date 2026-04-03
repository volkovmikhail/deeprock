const db = require('./database');
const { createUserTable } = require('./migrations/2025-11-02-14-24-create-user-table');
const { addUserScoreColumn } = require('./migrations/2026-03-22-add-user-score');

// Array of migrations - add new migrations here
const migrations = [
  {
    name: '001_create_migrations_table',
    up: async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  },
  {
    name: createUserTable.name,
    up: createUserTable,
  },
  {
    name: addUserScoreColumn.name,
    up: addUserScoreColumn,
  },
];

class MigrationRunner {
  /**
   * Get list of executed migrations from database
   */
  async getExecutedMigrations() {
    try {
      const [rows] = await db.execute(
        'SELECT name FROM migrations ORDER BY id'
      );

      return rows.map(row => row.name);
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Migrations table not found:', error.code);

        return [];
      }

      throw error;
    }
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration) {
    try {
      // Run the migration function
      await migration.up();

      // Record the migration as executed
      await db.execute(
        'INSERT INTO migrations (name) VALUES (?)',
        [migration.name]
      );

      console.log(`✅ Migration completed: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Failed to execute migration ${migration.name}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations in strict sequential order
   */
  async runMigrations() {
    try {
      console.log('🚀 Starting migration runner...');

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();

      console.log(`📋 Total migrations in code: ${migrations.length}`);
      console.log(`✅ Already executed: ${executedMigrations.length} migrations`);

      // Execute migrations in strict order - each must complete before next starts
      for (const migration of migrations) {
        if (executedMigrations.includes(migration.name)) {
          console.log(`⏭️  Skipping already executed: ${migration.name}`);
          continue;
        }

        console.log(`⏳ Executing migration: ${migration.name}`);
        await this.executeMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');

    } catch (error) {
      console.error('💥 Migration runner failed:', error);
      throw error;
    }
  }
}

// Export the runner instance and utilities
const migrationRunner = new MigrationRunner();

module.exports = {
  migrationRunner,
  migrations,
  runMigrations: () => migrationRunner.runMigrations()
};
