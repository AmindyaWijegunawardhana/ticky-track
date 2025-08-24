// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'ui-tests',
  testMatch: ['**/*.spec.js'],
  testIgnore: ['**/test/**', '**/node_modules/**'],
  timeout: 30_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:5000'
  },
  webServer: {
    command: 'node src/index.js',
    url: 'http://localhost:5000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_USER: process.env.DB_USER || 'root',
      DB_PASS: process.env.DB_PASS || '',
      DB_NAME: process.env.DB_NAME || 'ticky_track'
    }
  },
  reporter: [['list']]
});
