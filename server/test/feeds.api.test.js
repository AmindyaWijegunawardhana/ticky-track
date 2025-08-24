'use strict';

const request = require('supertest');
const mysql = require('mysql2/promise');

const {
  DB_HOST = '127.0.0.1',
  DB_USER = 'root',
  DB_PASS = process.env.CI ? 'root' : '',
  DB_NAME = 'ticky_track',
  DB_PORT = 3306,
} = process.env;

let pool;
let app;

beforeAll(async () => {
  // 1) ensure DB exists
  const admin = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
  });
  await admin.query(
    'CREATE DATABASE IF NOT EXISTS `' +
      DB_NAME +
      '` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'
  );
  await admin.end();

  // 2) create a dedicated pool for tests
  pool = await mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    dateStrings: true,
  });

  // 3) ensure table exists
  await pool.query(
    'CREATE TABLE IF NOT EXISTS `feeding_logs` (' +
      '`id` INT AUTO_INCREMENT PRIMARY KEY,' +
      '`quantity_ml` DECIMAL(6,2) NOT NULL,' +
      '`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' +
      ') ENGINE=InnoDB;'
  );

  // 4) import the app (supertest will use it without starting a port)
  app = require('../src/index');
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE `feeding_logs`');
});

afterAll(async () => {
  await pool.end();
});

test('POST /api/feeds with valid quantity creates a row', async () => {
  const res = await request(app)
    .post('/api/feeds')
    .send({ quantity_ml: 120 })
    .set('Content-Type', 'application/json');

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id');
  expect(res.body.quantity_ml).toBe(120);

  const [rows] = await pool.query('SELECT * FROM `feeding_logs` WHERE id = ?', [
    res.body.id,
  ]);
  expect(rows.length).toBe(1);
  expect(Number(rows[0].quantity_ml)).toBe(120);
});

test('POST /api/feeds with invalid quantity returns 400', async () => {
  const res = await request(app)
    .post('/api/feeds')
    .send({ quantity_ml: '1 OR 1=1' })
    .set('Content-Type', 'application/json');

  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty('error');
});
