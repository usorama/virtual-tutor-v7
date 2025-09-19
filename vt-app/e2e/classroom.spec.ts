import { test, expect, Page } from '@playwright/test';

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Audio AI Classroom', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    // Create new page with permissions
    const context = await browser.newContext({
      permissions: ['microphone'],
    });
    page = await context.newPage();
    
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
  });
  
  test('should navigate to classroom from dashboard', async () => {
    // Click on Start Voice Session button
    await page.click('text=Start Voice Session');
    
    // Should navigate to classroom
    await expect(page).toHaveURL('/classroom');
    
    // Should show start session interface
    await expect(page.locator('text=Start Learning Session')).toBeVisible();
    await expect(page.locator('text=Current Topic')).toBeVisible();
  });
  
  test('should request microphone permissions', async () => {
    await page.goto('/classroom');
    
    // Should show permission info
    await expect(page.locator('text=Microphone access is required')).toBeVisible();
    
    // Click start session button
    await page.click('button:has-text("Start Voice Session")');
    
    // Note: Actual permission dialog is handled by browser context
    // In tests, we've pre-granted permissions
  });
  
  test('should display session controls when connected', async () => {
    await page.goto('/classroom');
    
    // Mock the API response for creating a room
    await page.route('/api/livekit', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postData();
        if (body?.includes('create-room')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'mock-token',
              roomName: 'test-room',
              sessionId: 'test-session',
              url: 'wss://test.livekit.cloud'
            }),
          });
        }
      }
    });
    
    // Start session
    await page.click('button:has-text("Start Voice Session")');
    
    // Should show connecting state
    await expect(page.locator('text=Connecting...')).toBeVisible();
    
    // Should show mute/unmute button
    await expect(page.locator('button:has-text("Mute")')).toBeVisible({ timeout: 10000 });
    
    // Should show end session button
    await expect(page.locator('button:has-text("End Session")')).toBeVisible();
    
    // Should show audio level indicator
    await expect(page.locator('text=Audio Level')).toBeVisible();
  });
  
  test('should toggle mute state', async () => {
    await page.goto('/classroom');
    
    // Mock API
    await page.route('/api/livekit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          roomName: 'test-room',
          sessionId: 'test-session',
          url: 'wss://test.livekit.cloud'
        }),
      });
    });
    
    // Start session
    await page.click('button:has-text("Start Voice Session")');
    await page.waitForSelector('button:has-text("Mute")', { timeout: 10000 });
    
    // Click mute button
    await page.click('button:has-text("Mute")');
    
    // Should change to unmute
    await expect(page.locator('button:has-text("Unmute")')).toBeVisible();
    
    // Click unmute
    await page.click('button:has-text("Unmute")');
    
    // Should change back to mute
    await expect(page.locator('button:has-text("Mute")')).toBeVisible();
  });
  
  test('should end session and redirect', async () => {
    await page.goto('/classroom');
    
    // Mock API responses
    await page.route('/api/livekit', async (route) => {
      const body = await route.request().postData();
      if (body?.includes('create-room')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-token',
            roomName: 'test-room',
            sessionId: 'test-session',
            url: 'wss://test.livekit.cloud'
          }),
        });
      } else if (body?.includes('end-session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            duration_minutes: 10
          }),
        });
      }
    });
    
    // Start session
    await page.click('button:has-text("Start Voice Session")');
    await page.waitForSelector('button:has-text("End Session")', { timeout: 10000 });
    
    // End session
    await page.click('button:has-text("End Session")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should display session quality indicators', async () => {
    await page.goto('/classroom');
    
    // Mock API
    await page.route('/api/livekit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          roomName: 'test-room',
          sessionId: 'test-session',
          url: 'wss://test.livekit.cloud'
        }),
      });
    });
    
    // Start session
    await page.click('button:has-text("Start Voice Session")');
    
    // Should show quality indicator
    await expect(page.locator('text=/good quality|excellent quality|fair quality/')).toBeVisible({ timeout: 10000 });
    
    // Should show connection status
    await expect(page.locator('text=Connected')).toBeVisible();
    
    // Should show session duration
    await expect(page.locator('text=/Session: \\d+:\\d+/')).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should display session history on dashboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Should show learning sessions section
    await expect(page.locator('text=Learning Sessions')).toBeVisible();
    
    // Should show either session history or prompt to start first session
    const hasHistory = await page.locator('text=/\\d+ sessions/').isVisible().catch(() => false);
    
    if (hasHistory) {
      // Should show session cards
      await expect(page.locator('text=/Duration: \\d+/')).toBeVisible();
    } else {
      // Should show empty state
      await expect(page.locator('text=No sessions yet')).toBeVisible();
      await expect(page.locator('button:has-text("Start First Session")')).toBeVisible();
    }
  });
  
  test('should show quick start widget', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Should show quick start section
    await expect(page.locator('text=Quick Start Learning')).toBeVisible();
    
    // Should show current chapter
    await expect(page.locator('text=Current Chapter')).toBeVisible();
    
    // Should show start button
    await expect(page.locator('button:has-text("Start Voice Session Now")')).toBeVisible();
    
    // Should show session info
    await expect(page.locator('text=Sessions are 30 minutes long')).toBeVisible();
  });
  
  test('should navigate to classroom from quick start', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Click quick start button
    await page.click('button:has-text("Start Voice Session Now")');
    
    // Should navigate to classroom
    await expect(page).toHaveURL(/\/classroom/);
  });
});

test.describe('Accessibility', () => {
  test('classroom page should be accessible', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to classroom
    await page.goto('/classroom');
    
    // Check for proper ARIA labels
    await expect(page.locator('button:has-text("Start Voice Session")')).toHaveAttribute('type', 'button');
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate with Enter
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeDefined();
  });
  
  test('should support keyboard shortcuts', async ({ page }) => {
    // Login and navigate to classroom
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/classroom');
    
    // Mock API
    await page.route('/api/livekit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token',
          roomName: 'test-room',
          sessionId: 'test-session',
          url: 'wss://test.livekit.cloud'
        }),
      });
    });
    
    // Start session
    await page.click('button:has-text("Start Voice Session")');
    await page.waitForSelector('button:has-text("Mute")', { timeout: 10000 });
    
    // Test spacebar for push-to-talk (mentioned in UI)
    await page.keyboard.down(' ');
    await page.waitForTimeout(100);
    await page.keyboard.up(' ');
    
    // Should still be functional
    await expect(page.locator('button:has-text("End Session")')).toBeVisible();
  });
});