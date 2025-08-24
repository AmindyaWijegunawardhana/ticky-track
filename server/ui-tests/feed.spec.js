const { test, expect } = require('@playwright/test');

test('add valid feeding shows in Recent Feeds', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByLabel('Quantity (ml)').fill('120');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.locator('#flash')).toBeVisible();
  await expect(page.locator('#flash')).toHaveClass(/ok/);

  const qtyCell = page.locator('#tbody tr td:nth-child(2)').first();
  await expect(qtyCell).toHaveText(/120\.00/);
});
