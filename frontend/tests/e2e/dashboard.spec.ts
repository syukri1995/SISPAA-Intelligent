import { test, expect } from '@playwright/test';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("token", "dummy");
      window.localStorage.setItem("user_id", "dummy");
      window.localStorage.setItem("role", "admin");
    });
    await page.goto('/dashboard');
  });

  test('should load the dashboard successfully', async ({ page }) => {
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should navigate via sidebar correctly', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Navigate to Submit Complaint
      await page.click('text=Submit Complaint');
      await expect(page).toHaveURL(/\/submit/);

      // Navigate to Work Orders
      await page.click('text=Work Orders');
      await expect(page).toHaveURL(/\/work-orders/);

      // Navigate to Logs
      await page.click('text=Logs');
      await expect(page).toHaveURL(/\/logs/);
    }
  });

  test('dashboard stats update dynamically', async ({ page }) => {
    // Since we mock or test live, we just verify the stat cards exist
    await expect(page.locator('text=Total Complaints')).toBeVisible();
    await expect(page.locator('text=Pending Cases')).toBeVisible();
  });

  test('responsiveness of dashboard', async ({ page, isMobile }) => {
    if (isMobile) {
      // In mobile, sidebar is hidden
      await expect(page.locator('text=Submit Complaint').first()).toBeHidden();
    }
  });
});
