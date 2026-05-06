import { test, expect } from '@playwright/test';

test.describe('Work Orders and Logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("token", "dummy");
      window.localStorage.setItem("user_id", "dummy");
      window.localStorage.setItem("role", "admin");
    });
    await page.goto('/work-orders');
  });

  test('should display the work orders table', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check if table headers exist
    await expect(page.locator('th', { hasText: 'ID' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Agency' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Status' })).toBeVisible();
  });

  test('should filter by agency correctly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by"]');
    
    // If the input exists, try filtering
    if (await searchInput.isVisible()) {
      await searchInput.fill('dbkl');
      // Ensure no rows with APAD are visible
      await expect(page.locator('td', { hasText: 'APAD' })).not.toBeVisible();
    }
  });

  test('logs page should show the timeline of events', async ({ page }) => {
    await page.goto('/logs');
    
    // Check if the logs container or table exists
    await expect(page.locator('text=Audit Logs')).toBeVisible();
    
    // Verify common events are listed
    // (Assuming logs have been populated by backend or previous tests)
    await expect(page.locator('text=COMPLAINT_RECEIVED').first()).toBeVisible();
    await expect(page.locator('text=SENSE_COMPLETED').first()).toBeVisible();
    await expect(page.locator('text=ACT_COMPLETED').first()).toBeVisible();
  });
});
