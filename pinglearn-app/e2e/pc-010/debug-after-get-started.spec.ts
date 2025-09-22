import { test, expect } from '@playwright/test';

test('Debug what happens after Get Started', async ({ page }) => {
  console.log('Navigating to http://localhost:3006');
  await page.goto('http://localhost:3006');
  await page.waitForLoadState('networkidle');
  
  console.log('Clicking Get Started');
  await page.click('text=Get Started');
  await page.waitForLoadState('networkidle');
  
  console.log('Taking screenshot after Get Started');
  await page.screenshot({ path: 'e2e/pc-010/after-get-started.png', fullPage: true });
  
  console.log('Current URL:', page.url());
  
  const bodyText = await page.textContent('body');
  console.log('Page content after Get Started:', bodyText?.substring(0, 500) + '...');
  
  // Check for login form
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  if (await emailInput.count() > 0) {
    console.log('Found login form - need to authenticate');
  }
});
