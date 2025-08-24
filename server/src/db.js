'use strict';

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'ticky_track';
const DB_PORT = Number(process.env.DB_PORT || 3306);

// MySQL connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Create DB/table if missing
async function ensureSchema() {
  const admin = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT
  });
  await admin.query(
    'CREATE DATABASE IF NOT EXISTS `' + DB_NAME + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'
  );
  await admin.end();

  await pool.query(
    'CREATE TABLE IF NOT EXISTS `feeding_logs` (' +
      '`id` INT AUTO_INCREMENT PRIMARY KEY,' +
      '`quantity_ml` DECIMAL(6,2) NOT NULL,' +
      '`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' +
    ') ENGINE=InnoDB;'
  );

  console.log('Connected to DB: ' + DB_NAME);
  console.log("Table 'feeding_logs' exists.");
}

module.exports = { pool, ensureSchema };
