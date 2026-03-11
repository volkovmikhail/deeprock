#!/usr/bin/env node

const { runMigrations } = require('../db/migration-runner');

async function main() {
  try {
    await runMigrations();
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

main();
