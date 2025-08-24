'use strict';

require('dotenv').config();

const { ensureSchema } = require('./db');
const app = require('./middleware/app'); // this builds the Express app with routes/static/etc.

const PORT = process.env.PORT || 5000;

/**
 * Start HTTP server (used in normal/dev/Playwright runs).
 * In Jest we DO NOT call this; Jest will import the app only.
 */
async function start() {
  await ensureSchema();
  const server = app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
  return server;
}

/**
 * If running under Jest (JEST_WORKER_ID is set) or NODE_ENV=test,
 * export the app WITHOUT listening to avoid port conflicts & hanging handles.
 */
if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test') {
  module.exports = app;
} else if (require.main === module) {
  // CLI run: start server
  start();
  module.exports = app;
} else {
  // Imported by Playwright webServer or other tools: just export app;
  // the caller can decide to start it.
  module.exports = app;
}
