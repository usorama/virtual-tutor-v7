import { test, expect } from '@playwright/test';

test.describe('Class Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Skip auth for now, go directly to wizard
    // TODO: Add proper auth flow when Supabase auth is working
  });

  test('should navigate through wizard steps', async ({ page }) => {
    await page.goto('/wizard');
    
    // Step 1: Grade Selection
    await expect(page.getByRole('heading', { name: /select.*grade/i })).toBeVisible();
    await page.getByRole('button', { name: /grade 10/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 2: Subject Selection
    await expect(page.getByRole('heading', { name: /choose.*subjects/i })).toBeVisible();
    await page.getByText('Mathematics').click();
    await page.getByText('Science').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Purpose Selection (NEW)
    await expect(page.getByRole('heading', { name: /learning goal/i })).toBeVisible();
    await page.getByText('New Class').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Topic Selection
    await expect(page.getByRole('heading', { name: /select.*topics/i })).toBeVisible();
    // Select some topics
    await page.getByText('Real Numbers').first().click();
    await page.getByText('Chemical Reactions').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Step 5: Summary
    await expect(page.getByRole('heading', { name: /review.*selections/i })).toBeVisible();
    await expect(page.getByText(/grade.*10/i)).toBeVisible();
    await expect(page.getByText(/mathematics/i)).toBeVisible();
    await expect(page.getByText(/science/i)).toBeVisible();
    await expect(page.getByText(/new class/i)).toBeVisible();
    
    // Complete wizard
    await page.getByRole('button', { name: /complete|finish|start learning/i }).click();
    
    // Should redirect to dashboard or classroom
    await expect(page).toHaveURL(/\/(dashboard|classroom)/);
  });

  test('should allow navigation back and forth', async ({ page }) => {
    await page.goto('/wizard');
    
    // Go to grade selection
    await page.getByRole('button', { name: /grade 11/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Go back
    await page.getByRole('button', { name: /back|previous/i }).click();
    
    // Should be back at grade selection
    await expect(page.getByRole('heading', { name: /select.*grade/i })).toBeVisible();
    
    // Change selection
    await page.getByRole('button', { name: /grade 12/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show Grade 12 subjects
    await expect(page.getByText(/physics|chemistry|biology/i)).toBeVisible();
  });

  test('should persist wizard state', async ({ page }) => {
    await page.goto('/wizard');
    
    // Make selections
    await page.getByRole('button', { name: /grade 9/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByText('Mathematics').click();
    
    // Refresh page
    await page.reload();
    
    // Should maintain state
    await expect(page.getByText('Mathematics')).toHaveAttribute('aria-pressed', 'true');
  });

  test('should validate required selections', async ({ page }) => {
    await page.goto('/wizard');
    
    // Try to proceed without selection
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/please select.*grade/i)).toBeVisible();
    
    // Select grade and continue
    await page.getByRole('button', { name: /grade 10/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Try to proceed without subject selection
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/please select.*subject/i)).toBeVisible();
  });

  test('should show appropriate subjects for each grade', async ({ page }) => {
    await page.goto('/wizard');
    
    // Test Grade 11 (should have Physics, Chemistry, Biology)
    await page.getByRole('button', { name: /grade 11/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    await expect(page.getByText('Physics')).toBeVisible();
    await expect(page.getByText('Chemistry')).toBeVisible();
    await expect(page.getByText('Biology')).toBeVisible();
    
    // Go back and test Grade 9 (should have Science, not individual sciences)
    await page.getByRole('button', { name: /back/i }).click();
    await page.getByRole('button', { name: /grade 9/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    await expect(page.getByText('Science')).toBeVisible();
    await expect(page.getByText('Physics')).not.toBeVisible();
  });
});