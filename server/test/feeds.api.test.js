// feeds.api.test.js
// Uses a separate DB: ticky_track_test

const request = require('supertest');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const TEST_DB = 'ticky_track_test';

let app;
let pool;

beforeAll(async () => {
  // 1) ensure test DB exists
  const admin = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS
  });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  // 2) ensure table exists in test DB
  const bootstrap = await mysql.createPool({
    host: DB_HOST, user: DB_USER, password: DB_PASS, database: TEST_DB
  });
  await bootstrap.query(`
    CREATE TABLE IF NOT EXISTS feeding_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quantity_ml DECIMAL(6,2) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await bootstrap.end();

  // 3) point the app to TEST_DB BEFORE requiring the app/pool
  process.env.DB_NAME = TEST_DB;

  // 4) require app & pool now (they will read DB_NAME from env)
  app = require('../src/middleware/app');
  pool = require('../src/db');
});

beforeEach(async () => {
  await pool.query('TRUNCATE TABLE feeding_logs');
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
  expect(Number(res.body.quantity_ml)).toBe(120);
  expect(res.body).toHaveProperty('created_at');

  const list = await request(app).get('/api/feeds?limit=5');
  expect(list.status).toBe(200);
  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body.length).toBe(1);
  expect(Number(list.body[0].quantity_ml)).toBe(120);
});

test('POST /api/feeds with invalid quantity returns 400', async () => {
  const bad = await request(app)
    .post('/api/feeds')
    .send({ quantity_ml: 0 })
    .set('Content-Type', 'application/json');

  expect(bad.status).toBe(400);
  expect(bad.body).toHaveProperty('error');
});
