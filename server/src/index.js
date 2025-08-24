'use strict';

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { ensureSchema } = require('./db');
const feedsRouter = require('./routes/feeds');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// health
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'Ticky Track API' });
});

// api routes
app.use('/api/feeds', feedsRouter);

// start
(async () => {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log('API running at http://localhost:' + PORT);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();

module.exports = app;
