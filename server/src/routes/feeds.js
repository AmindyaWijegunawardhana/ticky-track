'use strict';

const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // uses server/src/db.js

// validate and normalize quantity
function parseQuantity(input) {
  if (input === null || input === undefined) {
    return { ok: false, error: 'quantity_ml is required' };
  }
  const s = String(input).trim();
  if (s === '') {
    return { ok: false, error: 'quantity_ml is required' };
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return { ok: false, error: 'quantity_ml must be a number' };
  }
  const value = Math.round(n * 100) / 100; // 2 decimals
  if (value <= 0) return { ok: false, error: 'quantity_ml must be > 0' };
  if (value > 500) return { ok: false, error: 'quantity_ml must be between 1 and 500' };
  return { ok: true, value };
}

// POST /api/feeds
router.post('/', async (req, res) => {
  try {
    const parsed = parseQuantity((req.body || {}).quantity_ml);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    // parameterized insert prevents SQL injection
    const [result] = await pool.query(
      'INSERT INTO `feeding_logs` (`quantity_ml`) VALUES (?)',
      [parsed.value]
    );

    return res.status(201).json({
      id: result.insertId,
      quantity_ml: parsed.value,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    const code = err && (err.code || err.errno);
    if (
      code === 'ER_TRUNCATED_WRONG_VALUE' || code === 1292 ||
      code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' || code === 1366 ||
      code === 'ER_DATA_TOO_LONG' || code === 1406
    ) {
      return res.status(400).json({ error: 'quantity_ml is invalid' });
    }
    console.error('POST /api/feeds error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/feeds?limit=5
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const [rows] = await pool.query(
      'SELECT id, quantity_ml, created_at FROM `feeding_logs` ORDER BY id DESC LIMIT ?',
      [limit]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/feeds error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
