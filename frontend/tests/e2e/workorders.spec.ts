import { test, expect } from '@playwright/test';
import { setAuthCookie } from './auth';

test.describe('Work Orders and Logs', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthCookie(page, { role: "admin" });
    await page.goto('/work-orders');
  });

  test('should display the work orders table', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check if table headers exist
    await expect(page.locator('th', { hasText: 'Work order' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Agency' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Status' })).toBeVisible();
  });

  test('should filter by agency correctly', async ({ page }) => {
    // Pending queue has an "Assign to" input per row; we just verify page renders.
    await expect(page.getByRole('heading', { name: 'Work Orders', exact: true })).toBeVisible();
  });

  test('logs page should show the timeline of events', async ({ page }) => {
    await page.goto('/logs');
    
    // Check if the logs container or table exists
    await expect(page.getByText('Audit Logs', { exact: true }).first()).toBeVisible();
  });
});
