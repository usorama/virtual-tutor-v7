import { test, expect } from '@playwright/test';

test('Debug homepage to see what elements are available', async ({ page }) => {
  console.log('Navigating to http://localhost:3006');
  await page.goto('http://localhost:3006');
  await page.waitForLoadState('networkidle');
  
  console.log('Taking screenshot of homepage');
  await page.screenshot({ path: 'e2e/pc-010/homepage-debug.png', fullPage: true });
  
  console.log('Getting page content...');
  const bodyText = await page.textContent('body');
  console.log('Page content:', bodyText?.substring(0, 500) + '...');
  
  // Look for buttons and links
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('Found', buttonCount, 'buttons');
  
  for (let i = 0; i < Math.min(buttonCount, 5); i++) {
    const buttonText = await buttons.nth(i).textContent();
    console.log('Button', i, ':', buttonText);
  }
  
  const links = page.locator('a');
  const linkCount = await links.count();
  console.log('Found', linkCount, 'links');
  
  for (let i = 0; i < Math.min(linkCount, 5); i++) {
    const linkText = await links.nth(i).textContent();
    console.log('Link', i, ':', linkText);
  }
});
