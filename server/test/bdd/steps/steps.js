const { Given, When, Then } = require('@cucumber/cucumber');
const request = require('supertest');
let app;
let lastResponse;

Given('the API is healthy', async function () {
  app = require('../../../src/middleware/app');
  const res = await request(app).get('/health');
  if (res.status !== 200 || !res.body.ok) throw new Error('API not healthy');
});

When('I submit a feeding with quantity {string}', async function (qty) {
  lastResponse = await request(app)
    .post('/api/feeds')
    .set('Content-Type', 'application/json')
    .send({ quantity_ml: Number(qty) });
});

Then('the request is created successfully', function () {
  if (lastResponse.status !== 201) {
    throw new Error(`Expected 201, got ${lastResponse.status} with body ${JSON.stringify(lastResponse.body)}`);
  }
});

Then('the recent feeds include a row with quantity {string}', async function (qtyStr) {
  const list = await request(app).get('/api/feeds?limit=5');
  if (list.status !== 200) throw new Error('List failed');
  const has = list.body.some(r => Number(r.quantity_ml).toFixed(2) === qtyStr);
  if (!has) throw new Error(`Did not find quantity ${qtyStr} in recent feeds: ${JSON.stringify(list.body)}`);
});

Then('the request is rejected with a validation error', function () {
  if (lastResponse.status !== 400) {
    throw new Error(`Expected 400, got ${lastResponse.status} with body ${JSON.stringify(lastResponse.body)}`);
  }
  if (!lastResponse.body || !lastResponse.body.error) {
    throw new Error('Expected error message in response body');
  }
});
