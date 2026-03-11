const mysql = require('mysql2/promise');
const config = require('../config/env');

const pool = mysql.createPool({
  host: config.dbHostname,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  connectionLimit: config.dbConnectionLimit,
  queueLimit: config.dbQueueLimit,
  waitForConnections: true,
});

module.exports = pool;
