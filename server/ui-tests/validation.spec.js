const { test, expect } = require('@playwright/test');

test('invalid quantity shows error', async ({ page }) => {
  await page.goto('/index.html');

  const qty = page.getByLabel('Quantity (ml)');
  await qty.fill('0');
  await page.getByRole('button', { name: 'Add' }).click();

  const flash = page.locator('#flash');

  // Give the UI a brief moment in case your code sets the flash
  await page.waitForTimeout(250);

  if (await flash.isVisible()) {
    // App-driven error banner path
    await expect(flash).toHaveClass(/err/);
    await expect(flash).toContainText(/must be > 0/i);
  } else {
    // Native HTML validation path (form submit blocked by min/required)
    const isValid = await qty.evaluate(el => el.checkValidity());
    expect(isValid).toBe(false);

    const msg = await qty.evaluate(el => el.validationMessage || '');
    // Different browsers show different wording; accept common phrases
    expect(msg).toMatch(/greater than or equal to|valid|please|enter/i);
  }
});
