const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    // Navigate to localhost:3001
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Wait a bit for animations to settle
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'localhost-3001-fixed.png', fullPage: true });

    console.log('Screenshot saved as localhost-3001-fixed.png');
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
})();