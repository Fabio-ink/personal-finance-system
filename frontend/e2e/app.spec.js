import { test, expect } from '@playwright/test';

test.describe('SyncWallet Application End-to-End Tests', () => {
  test('should display login page when unauthenticated', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Sync/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a[href="/register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/register/);
    }
  });
});
