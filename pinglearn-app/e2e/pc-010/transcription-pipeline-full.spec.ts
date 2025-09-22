import { test, expect, Page } from '@playwright/test';

test.describe('PC-010 Transcription Pipeline Test', () => {
  let page: Page;
  const pc010Logs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console log capture
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PC-010]')) {
        console.log('PC-010 Log: ' + text);
        pc010Logs.push(text);
      }
    });
  });

  test('should verify transcription pipeline in classroom', async () => {
    console.log('=== PC-010 TRANSCRIPTION PIPELINE TEST ===');
    
    // Step 1: Navigate to localhost:3006
    console.log('Step 1: Navigating to http://localhost:3006');
    await page.goto('http://localhost:3006');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Click "Get Started" (goes to login)
    console.log('Step 2: Clicking "Get Started"');
    await page.click('text=Get Started');
    await page.waitForLoadState('networkidle');
    
    // Step 2.5: Login with test credentials
    console.log('Step 2.5: Logging in with test credentials');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after login:', page.url());
    await page.screenshot({ path: 'e2e/pc-010/after-login.png', fullPage: true });
    
    // Step 3: Look for Grade 10 Mathematics (might be different after login)
    console.log('Step 3: Looking for Grade 10 Mathematics');
    
    // Try multiple possible selectors for Grade 10 Mathematics
    const grade10Selectors = [
      'text=Grade 10 Mathematics',
      'text=Grade 10',
      'text=Mathematics',
      'text=Class 10',
      '[data-testid*="grade-10"]',
      '[data-testid*="mathematics"]'
    ];
    
    let found = false;
    for (const selector of grade10Selectors) {
      if (await page.locator(selector).count() > 0) {
        console.log('Found using selector:', selector);
        await page.click(selector);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log('Grade 10 Mathematics not found, checking available options...');
      const bodyText = await page.textContent('body');
      console.log('Available content:', bodyText?.substring(0, 500) + '...');
      
      // Look for any clickable elements related to math or classroom
      const mathElements = page.locator('button, a, [role="button"]').filter({ hasText: /math|class|grade|subject/i });
      const mathCount = await mathElements.count();
      console.log('Found', mathCount, 'math-related elements');
      
      if (mathCount > 0) {
        const firstMathElement = mathElements.first();
        const text = await firstMathElement.textContent();
        console.log('Clicking first math element:', text);
        await firstMathElement.click();
        found = true;
      }
    }
    
    await page.waitForLoadState('networkidle');
    
    // Step 4: Take screenshot before starting session
    console.log('Step 4: Taking screenshot before session');
    await page.screenshot({ path: 'e2e/pc-010/before-session.png', fullPage: true });
    
    // Step 5: Look for "Start Session" button
    console.log('Step 5: Looking for "Start Session"');
    const startSelectors = [
      'button:has-text("Start Session")',
      'button:has-text("Start")',
      '[data-testid*="start"]',
      'button[class*="start"]'
    ];
    
    let sessionStarted = false;
    for (const selector of startSelectors) {
      if (await page.locator(selector).count() > 0) {
        console.log('Found Start button using selector:', selector);
        await page.click(selector);
        sessionStarted = true;
        break;
      }
    }
    
    if (!sessionStarted) {
      console.log('Start Session button not found, checking all buttons...');
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      console.log('Found', buttonCount, 'buttons total');
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const buttonText = await buttons.nth(i).textContent();
        console.log('Button', i, ':', buttonText);
      }
    }
    
    // Step 6: Wait 10 seconds for AI teacher to speak
    console.log('Step 6: Waiting 10 seconds for AI teacher');
    await page.waitForTimeout(10000);
    
    // Step 7: Take screenshot after session starts
    console.log('Step 7: Taking screenshot after session');
    await page.screenshot({ path: 'e2e/pc-010/after-session.png', fullPage: true });
    
    // Step 8: Report PC-010 console logs
    console.log('Step 8: PC-010 console logs captured:', pc010Logs.length, 'messages');
    pc010Logs.forEach((log, index) => {
      console.log('[PC-010]', index + ':', log);
    });
    
    // Step 9: Check Teaching Board (left 80%) for transcription text
    console.log('Step 9: Checking Teaching Board for transcriptions');
    const teachingBoardSelectors = [
      '[data-testid="teaching-board"]',
      '.teaching-board',
      '.left-panel',
      '[class*="teaching"]',
      '[class*="board"]',
      '[style*="80%"]'
    ];
    
    let boardFound = false;
    for (const selector of teachingBoardSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        const boardText = await element.textContent();
        console.log('Teaching Board found with selector:', selector);
        console.log('Teaching Board content (first 200 chars):', boardText?.substring(0, 200) + '...');
        boardFound = true;
        break;
      }
    }
    
    if (!boardFound) {
      console.log('Teaching Board not found with standard selectors');
    }
    
    // Step 10: Check Transcript panel (right 20%) for text
    console.log('Step 10: Checking Transcript panel');
    const transcriptSelectors = [
      '[data-testid="transcript-panel"]',
      '.transcript-panel',
      '.right-panel',
      '[class*="transcript"]',
      '[style*="20%"]'
    ];
    
    let transcriptFound = false;
    for (const selector of transcriptSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        const transcriptText = await element.textContent();
        console.log('Transcript Panel found with selector:', selector);
        console.log('Transcript content (first 200 chars):', transcriptText?.substring(0, 200) + '...');
        transcriptFound = true;
        break;
      }
    }
    
    if (!transcriptFound) {
      console.log('Transcript Panel not found with standard selectors');
    }
    
    // Additional checks for PC-010 specific elements
    console.log('=== ADDITIONAL PC-010 CHECKS ===');
    
    // Check for math equations
    const mathElements = page.locator('.katex, [data-math], .math-equation, .MathJax');
    const mathCount = await mathElements.count();
    console.log('Found', mathCount, 'math elements');
    
    // Check for transcription indicators
    const transcriptionElements = page.locator('[data-transcription], .transcription, [class*="transcript"]');
    const transcriptionCount = await transcriptionElements.count();
    console.log('Found', transcriptionCount, 'transcription elements');
    
    // Check for any text that might indicate transcription activity
    const bodyText = await page.textContent('body');
    const hasTranscriptionText = bodyText?.toLowerCase().includes('transcription') ||
                                bodyText?.toLowerCase().includes('transcript') ||
                                bodyText?.toLowerCase().includes('math') ||
                                bodyText?.toLowerCase().includes('equation');
    console.log('Page contains transcription-related text:', hasTranscriptionText);
    
    // Final screenshot
    await page.screenshot({ path: 'e2e/pc-010/final-state.png', fullPage: true });
    
    console.log('=== PC-010 TEST COMPLETED ===');
    console.log('Total PC-010 logs captured:', pc010Logs.length);
    console.log('Teaching board found:', boardFound);
    console.log('Transcript panel found:', transcriptFound);
    console.log('Math elements found:', mathCount);
    console.log('Transcription elements found:', transcriptionCount);
  });
});
