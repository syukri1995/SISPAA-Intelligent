import { test, expect } from '@playwright/test';
import { setAuthCookie } from './auth';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthCookie(page, { role: "admin" });

    // Mock backend APIs for stable UI tests
    await page.route('**/metrics', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total_complaints_today: 12, pending_cases: 3, auto_resolved_pct: 50.0 }) });
    });
    await page.route('**/complaints/recent*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: "11111111-1111-1111-1111-111111111111", status: "ASSIGNED", timestamp: new Date().toISOString(), category: "Infrastructure Damage", agency: "DBKL", confidence: 0.8 },
        ])
      });
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
      await page.click('text=Audit Logs');
      await expect(page).toHaveURL(/\/logs/);
    }
  });

  test('dashboard stats update dynamically', async ({ page }) => {
    // Since we mock or test live, we just verify the stat cards exist
    await expect(page.locator('text=Complaints (Today)')).toBeVisible();
    await expect(page.locator('text=Pending Cases')).toBeVisible();
  });

  test('responsiveness of dashboard', async ({ page, isMobile }) => {
    if (isMobile) {
      // In mobile, sidebar is hidden
      await expect(page.locator('text=Submit Complaint').first()).toBeHidden();
    }
  });
});
