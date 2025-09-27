const puppeteer = require('puppeteer');

async function screenshotDashboard() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to login page...');
    await page.goto('http://localhost:3006/login', { waitUntil: 'networkidle2' });

    // Debug: Take screenshot of login page to see what we have
    await page.screenshot({ path: './docs/screenshots/debug-login-page.png' });
    console.log('Debug login page screenshot saved');

    // Try different selectors for the login form
    const possibleSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      '#email',
      '[data-testid="email"]'
    ];

    let emailSelector = null;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        emailSelector = selector;
        console.log(`Found email input with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`Selector ${selector} not found`);
      }
    }

    if (!emailSelector) {
      console.log('Could not find email input field. Taking page screenshot for debugging...');
      await page.screenshot({ path: './docs/screenshots/debug-no-email-field.png' });
      throw new Error('Email input field not found');
    }

    console.log('Filling login form...');
    // Fill in the test credentials using the found selector
    await page.type(emailSelector, 'test@example.com');

    // Find password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      '#password',
      '[data-testid="password"]'
    ];

    let passwordSelector = null;
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        passwordSelector = selector;
        console.log(`Found password input with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`Password selector ${selector} not found`);
      }
    }

    if (!passwordSelector) {
      throw new Error('Password input field not found');
    }

    await page.type(passwordSelector, 'TestPassword123!');

    console.log('Clicking login button...');
    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    console.log('Waiting for dashboard to load...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    // Additional wait to ensure all components are rendered
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: './docs/screenshots/dashboard-authenticated-complete.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved to: ./docs/screenshots/dashboard-authenticated-complete.png');

  } catch (error) {
    console.error('❌ Error taking screenshot:', error.message);
  } finally {
    await browser.close();
  }
}

screenshotDashboard();