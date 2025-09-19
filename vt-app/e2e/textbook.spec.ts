import { test, expect } from '@playwright/test';

test.describe('Textbook Upload and Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display textbook management page', async ({ page }) => {
    await page.goto('/textbooks');
    
    await expect(page.getByRole('heading', { name: /textbook.*library/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upload.*textbook/i })).toBeVisible();
  });

  test('should open upload dialog', async ({ page }) => {
    await page.goto('/textbooks');
    
    await page.getByRole('button', { name: /upload.*textbook/i }).click();
    
    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/grade/i)).toBeVisible();
    await expect(page.getByLabel(/subject/i)).toBeVisible();
  });

  test('should validate upload form', async ({ page }) => {
    await page.goto('/textbooks');
    
    await page.getByRole('button', { name: /upload.*textbook/i }).click();
    
    // Try to submit without filling form
    await page.getByRole('button', { name: /upload|submit/i }).last().click();
    
    // Should show validation errors
    await expect(page.getByText(/required|please/i)).toBeVisible();
  });

  test('should upload a textbook', async ({ page }) => {
    await page.goto('/textbooks');
    
    await page.getByRole('button', { name: /upload.*textbook/i }).click();
    
    // Fill form
    await page.getByLabel(/title/i).fill('Real Numbers - Class 10 Mathematics');
    await page.getByLabel(/grade/i).selectOption('10');
    await page.getByLabel(/subject/i).selectOption('Mathematics');
    
    // Upload actual NCERT textbook PDF
    const filePath = '/Users/umasankrudhya/Projects/vt-new-2/text-books/Class X Mathematics/001-real-numbers.pdf';
    await page.setInputFiles('input[type="file"]', filePath);
    
    // Submit
    await page.getByRole('button', { name: /upload|submit/i }).last().click();
    
    // Should show success message
    await expect(page.getByText(/upload.*success|processing/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display uploaded textbooks', async ({ page }) => {
    await page.goto('/textbooks');
    
    // Should show textbook grid or list
    await expect(page.locator('[data-testid="textbook-grid"], [data-testid="textbook-list"]')).toBeVisible();
  });

  test('should filter textbooks by grade', async ({ page }) => {
    await page.goto('/textbooks');
    
    // Apply grade filter
    await page.getByRole('combobox', { name: /grade/i }).selectOption('10');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Check that only Grade 10 textbooks are shown
    const textbooks = page.locator('[data-testid="textbook-item"]');
    const count = await textbooks.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(textbooks.nth(i)).toContainText(/grade.*10/i);
      }
    }
  });

  test('should filter textbooks by subject', async ({ page }) => {
    await page.goto('/textbooks');
    
    // Apply subject filter
    await page.getByRole('combobox', { name: /subject/i }).selectOption('Mathematics');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Check that only Mathematics textbooks are shown
    const textbooks = page.locator('[data-testid="textbook-item"]');
    const count = await textbooks.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(textbooks.nth(i)).toContainText(/mathematics/i);
      }
    }
  });

  test('should show textbook processing status', async ({ page }) => {
    await page.goto('/textbooks');
    
    // Look for status indicators
    const statusBadges = page.locator('[data-testid="status-badge"]');
    const count = await statusBadges.count();
    
    if (count > 0) {
      // Check that status badges show valid states
      for (let i = 0; i < count; i++) {
        await expect(statusBadges.nth(i)).toContainText(/pending|processing|ready|failed/i);
      }
    }
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.goto('/textbooks');
    
    await page.getByRole('button', { name: /upload.*textbook/i }).click();
    
    // Fill form with invalid data
    await page.getByLabel(/title/i).fill('Test');
    await page.getByLabel(/grade/i).selectOption('10');
    await page.getByLabel(/subject/i).selectOption('Mathematics');
    
    // Try to upload without file
    await page.getByRole('button', { name: /upload|submit/i }).last().click();
    
    // Should show error
    await expect(page.getByText(/select.*file|no file/i)).toBeVisible();
  });
});