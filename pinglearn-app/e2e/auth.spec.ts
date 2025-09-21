import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/);
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/Register/);
    await expect(page.getByText('Create an Account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    // Generate unique email
    const timestamp = Date.now();
    const email = `test.user.${timestamp}@example.com`;
    
    // Fill registration form
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign up|register|create account/i }).click();
    
    // Should show success message (stays on same page)
    await expect(page.getByText(/registration successful/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Use test credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword');
    
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid.*credentials|incorrect|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');
    
    // Try to submit
    await page.getByRole('button', { name: /sign up|register|create account/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/invalid.*email|valid.*email/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByLabel(/confirm password/i).fill('weak');
    
    // Try to submit
    await page.getByRole('button', { name: /sign up|register|create account/i }).click();
    
    // Should show password requirements
    await expect(page.getByText(/at least 8 characters|must be at least/i)).toBeVisible();
  });
});