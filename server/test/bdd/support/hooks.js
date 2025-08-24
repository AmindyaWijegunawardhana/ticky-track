const { BeforeAll, Before, AfterAll } = require('@cucumber/cucumber');
const mysql = require('mysql2/promise');

let pool;
const { DB_HOST = 'localhost', DB_USER = 'root', DB_PASS = '' } = process.env;
const TEST_DB = 'ticky_track_bdd';

BeforeAll(async function () {
  // Create BDD database
  const admin = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS });
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();

  // Create table in BDD database
  pool = await mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: TEST_DB });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feeding_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quantity_ml DECIMAL(6,2) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Point the app to BDD DB before steps load the app
  process.env.DB_NAME = TEST_DB;
});

Before(async function () {
  // Clean table before each scenario
  await pool.query('TRUNCATE TABLE feeding_logs');
});

AfterAll(async function () {
  if (pool) await pool.end();
});
