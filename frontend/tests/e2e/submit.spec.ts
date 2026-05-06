import { test, expect } from '@playwright/test';

test.describe('Submit Complaint Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/submit');
  });

  test('form validation errors on empty submission', async ({ page }) => {
    await page.click('button:has-text("Submit & Process")');
    // Check if error message is shown (depends on your UI implementation, adjust text as needed)
    await expect(page.locator('text=Complaint text is required.')).toBeVisible();
  });

  test('mixed language complaint processing to DBKL', async ({ page }) => {
    // Fill the form
    await page.fill('#complaint_text', 'Jalan rosak teruk dekat Johor, sangat bahaya');
    await page.fill('#location_text', 'Johor Bahru');
    await page.fill('#email', 'tester@example.com');

    // Intercept backend API call to test the loading state
    const submitPromise = page.waitForResponse(response => response.url().includes('/complaint') && response.status() === 200);
    
    // Submit
    await page.click('button:has-text("Submit & Process")');
    
    // Verify loading state (e.g. Processing button state)
    await expect(page.locator('button', { hasText: 'Processing…' })).toBeVisible();
    
    // Wait for the response
    await submitPromise;

    // Verify Result Panel
    await expect(page.locator('text=Result')).toBeVisible();
    
    // Check Work Order generated
    await expect(page.getByText('Work Order ID', { exact: true }).first()).toBeVisible();
  });

  test('handles very short text with warning', async ({ page }) => {
    await page.fill('#complaint_text', 'Bad');
    await page.fill('#email', 'tester@example.com');
    await page.click('button:has-text("Submit & Process")');
    
    // Check if warning is displayed
    await expect(page.locator('text=Please provide more details').first()).toBeVisible();
  });

  test('handles backend error gracefully', async ({ page }) => {
    // Mock the backend API to return an error
    await page.route('**/complaint', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.fill('#complaint_text', 'Pothole on Jalan Sudirman near KLCC. Please fix urgently.');
    await page.fill('#email', 'tester@example.com');
    await page.click('button:has-text("Submit & Process")');

    // UI should show an error message
    await expect(page.locator('text=Failed to submit complaint. Please try again.')).toBeVisible();
  });
});
