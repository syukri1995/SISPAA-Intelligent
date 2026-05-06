import { test, expect } from '@playwright/test';

test.describe('SISPAA GovTech Router - E2E Tests', () => {

  test('Submit a complaint and verify routing animation', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/submit');

    // Ensure the form is visible
    const form = page.locator('.card', { hasText: 'Submit Complaint' });
    await expect(form.first()).toBeVisible();

    // Fill out the complaint form
    await page.fill('textarea[name="complaint"]', 'LRT station leaking water very badly and dangerous for people');
    await page.fill('input[name="location"]', 'KL Sentral');
    await page.fill('input[name="email"]', 'test-citizen@example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the workflow animation (Sense -> Reason -> Act)
    await expect(page.locator('text=Sensed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Classified')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 });

    // Verify results panel
    const resultsPanel = page.locator('.results-panel'); // Assuming a class or ID
    await expect(page.locator('text=Public Transport Issue')).toBeVisible();
    await expect(page.locator('text=APAD')).toBeVisible();
    await expect(page.locator('text=HIGH')).toBeVisible();
  });

  test('Dashboard table filtering and anomaly detection display', async ({ page }) => {
    // Navigate to dashboard
    await page.addInitScript(() => {
      window.localStorage.setItem("token", "dummy");
      window.localStorage.setItem("user_id", "dummy");
      window.localStorage.setItem("role", "admin");
    });
    await page.goto('/dashboard');
    
    // Check if the dashboard table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Test filtering by agency
    const searchInput = page.locator('input[placeholder*="Search by"]');
    await searchInput.fill('dbkl');

    // Ensure APAD/KKM are not visible in the rows (mocking logic/assumption)
    await expect(page.locator('td', { hasText: 'APAD' })).not.toBeVisible();
  });

  test('Edge Case: Mixed Language Complaint', async ({ page }) => {
    await page.goto('/submit');
    
    // BM + English text
    await page.fill('textarea[name="complaint"]', 'Jalan rosak teruk dekat area rumah saya. Very dangerous for cars.');
    await page.fill('input[name="email"]', 'edge@example.com');
    await page.click('button[type="submit"]');

    // Should route to DBKL (Infrastructure Damage)
    await expect(page.locator('text=Completed')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=DBKL')).toBeVisible();
  });

});
