const pool = require('../db');

function parseQuantity(input) {
  if (input === undefined || input === null || input === '') {
    return { ok: false, error: 'quantity_ml is required' };
  }
  const num = typeof input === 'number' ? input : Number(String(input).trim());
  if (!Number.isFinite(num)) return { ok: false, error: 'quantity_ml must be a number' };
  if (num <= 0) return { ok: false, error: 'quantity_ml must be > 0' };
  if (num > 500) return { ok: false, error: 'quantity_ml must be <= 500' };
  const rounded = Math.round(num * 100) / 100;
  return { ok: true, value: rounded };
}

async function createFeed(req, res) {
  try {
    const { quantity_ml } = req.body || {};
    const parsed = parseQuantity(quantity_ml);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    const [result] = await pool.query(
      'INSERT INTO `feeding_logs` (`quantity_ml`) VALUES (?)',
      [parsed.value]
    );
    const [rows] = await pool.query(
      'SELECT `id`,`quantity_ml`,`created_at` FROM `feeding_logs` WHERE `id` = ?',
      [result.insertId]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createFeed error:', err);
    // DIAGNOSTIC: expose actual SQL error to the client so we can fix quickly.
    return res.status(500).json({ error: err.sqlMessage || err.message || 'Server error' });
  }
}

async function listFeeds(req, res) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const [rows] = await pool.query(
      'SELECT `id`,`quantity_ml`,`created_at` FROM `feeding_logs` ORDER BY `created_at` DESC LIMIT ?',
      [limit]
    );
    return res.json(rows);
  } catch (err) {
    console.error('listFeeds error:', err);
    return res.status(500).json({ error: err.sqlMessage || err.message || 'Server error' });
  }
}

module.exports = { createFeed, listFeeds };
