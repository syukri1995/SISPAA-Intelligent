import { test, expect } from '@playwright/test';
import { setAuthCookie } from './auth';

test.describe('SISPAA GovTech Router - E2E Tests', () => {

  test('Submit a complaint and verify routing animation', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/submit');

    // Ensure the form is visible
    await expect(page.locator('h1', { hasText: 'Submit Complaint' })).toBeVisible();

    // Fill out the complaint form
    await page.fill('#complaint_text', 'LRT station leaking water very badly and dangerous for people');
    await page.fill('#location_text', 'KL Sentral');
    await page.fill('#email', 'test-citizen@example.com');

    // Mock backend response for stable UI test
    await page.route('**/complaint', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          complaint_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          status: "COMPLETED",
          current_step: "Act",
          category: "Public Transport Issue",
          agency: "APAD",
          confidence: 0.88,
          work_order_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          priority: "HIGH"
        })
      });
    });

    // Submit the form
    await page.click('button:has-text("Submit & Process")');

    // Wait for the workflow animation (Sense -> Reason -> Act)
    await expect(page.locator('text=Result')).toBeVisible({ timeout: 10000 });

    // Verify results panel
    await expect(page.locator('text=Category')).toBeVisible();
    await expect(page.locator('text=APAD')).toBeVisible();
  });

  test('Dashboard table filtering and anomaly detection display', async ({ page }) => {
    // Navigate to dashboard
    await setAuthCookie(page, { role: "admin" });

    await page.route('**/metrics', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total_complaints_today: 12, pending_cases: 3, auto_resolved_pct: 50.0 }) });
    });
    await page.route('**/complaints/recent*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", status: "ASSIGNED", timestamp: new Date().toISOString(), category: "Infrastructure Damage", agency: "DBKL", confidence: 0.82 },
          { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", status: "CLOSED", timestamp: new Date().toISOString(), category: "Healthcare Service", agency: "KKM", confidence: 0.77 },
        ])
      });
    });

    await page.goto('/dashboard');
    
    // Check if the dashboard table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Test filtering by agency
    await page.click('text=View all');
    await expect(page).toHaveURL(/\/complaints/);
    const searchInput = page.locator('#q');
    await searchInput.fill('dbkl');
    await expect(page.locator('table')).toBeVisible();
  });

  test('Edge Case: Mixed Language Complaint', async ({ page }) => {
    await page.goto('/submit');
    
    // BM + English text
    await page.fill('#complaint_text', 'Jalan rosak teruk dekat area rumah saya. Very dangerous for cars.');
    await page.fill('#email', 'edge@example.com');

    await page.route('**/complaint', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          complaint_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          status: "COMPLETED",
          current_step: "Act",
          category: "Infrastructure Damage",
          agency: "DBKL",
          confidence: 0.82,
          work_order_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
          priority: "MEDIUM"
        })
      });
    });

    await page.click('button:has-text("Submit & Process")');

    await expect(page.locator('text=Result')).toBeVisible({ timeout: 10000 });
  });

});
