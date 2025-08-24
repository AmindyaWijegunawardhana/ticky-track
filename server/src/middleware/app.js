const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const feedsRouter = require('../routes/feeds');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'Ticky Track API' }));

// APIs
app.use('/api/feeds', feedsRouter);

// ---- STATIC FRONTEND ----
// IMPORTANT: __dirname = server/src/middleware
// Our public folder is at server/public  => go up two levels: ..\..\
const publicDir = path.resolve(__dirname, '..', '..', 'public');
console.log('📁 Serving static from:', publicDir);

// Serve files (index.html, styles.css, app.js)
app.use(express.static(publicDir));

// Root -> index.html
app.get('/', (_req, res, next) => {
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) next(err);
  });
});

// 404 for anything else (after static & APIs)
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
