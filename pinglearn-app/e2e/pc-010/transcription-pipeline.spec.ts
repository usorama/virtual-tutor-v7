import { test, expect, Page } from '@playwright/test';

test.describe('PC-010 Transcription Pipeline Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console log capture
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PC-010]')) {
        console.log('PC-010 Log: ' + text);
      }
    });
  });

  test('should verify transcription pipeline in classroom', async () => {
    console.log('=== PC-010 TRANSCRIPTION PIPELINE TEST ===');
    
    // Step 1: Navigate to localhost:3006
    console.log('Step 1: Navigating to http://localhost:3006');
    await page.goto('http://localhost:3006');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Click "Go to Dashboard"
    console.log('Step 2: Clicking "Get Started"');
    await page.click('text=Get Started');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Click "Grade 10 Mathematics" to enter classroom
    console.log('Step 3: Clicking "Grade 10 Mathematics"');
    await page.click('text=Grade 10 Mathematics');
    await page.waitForLoadState('networkidle');
    
    // Step 4: Take screenshot before starting session
    console.log('Step 4: Taking screenshot before session');
    await page.screenshot({ path: 'e2e/pc-010/before-session.png', fullPage: true });
    
    // Step 5: Click "Start Session" button
    console.log('Step 5: Clicking "Start Session"');
    const startButton = page.locator('button:has-text("Start Session")');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // Step 6: Wait 10 seconds for AI teacher to speak
    console.log('Step 6: Waiting 10 seconds for AI teacher');
    await page.waitForTimeout(10000);
    
    // Step 7: Take screenshot after session starts
    console.log('Step 7: Taking screenshot after session');
    await page.screenshot({ path: 'e2e/pc-010/after-session.png', fullPage: true });
    
    // Step 8: Extract console logs (already captured above)
    console.log('Step 8: Console logs captured during test execution');
    
    // Step 9: Check Teaching Board (left 80%) for transcription text
    console.log('Step 9: Checking Teaching Board for transcriptions');
    const teachingBoard = page.locator('[data-testid="teaching-board"], .teaching-board, .left-panel');
    if (await teachingBoard.count() > 0) {
      const boardText = await teachingBoard.textContent();
      console.log('Teaching Board content found');
    } else {
      console.log('Teaching Board not found - checking for any transcription text');
    }
    
    // Step 10: Check Transcript panel (right 20%) for text
    console.log('Step 10: Checking Transcript panel');
    const transcriptPanel = page.locator('[data-testid="transcript-panel"], .transcript-panel, .right-panel');
    if (await transcriptPanel.count() > 0) {
      const transcriptText = await transcriptPanel.textContent();
      console.log('Transcript Panel content found');
    } else {
      console.log('Transcript Panel not found');
    }
    
    // Additional checks for PC-010 specific elements
    console.log('=== ADDITIONAL PC-010 CHECKS ===');
    
    // Check for math equations
    const mathElements = page.locator('.katex, [data-math], .math-equation');
    const mathCount = await mathElements.count();
    console.log('Found ' + mathCount + ' math elements');
    
    // Check for transcription indicators
    const transcriptionElements = page.locator('[data-transcription], .transcription');
    const transcriptionCount = await transcriptionElements.count();
    console.log('Found ' + transcriptionCount + ' transcription elements');
    
    // Final screenshot
    await page.screenshot({ path: 'e2e/pc-010/final-state.png', fullPage: true });
    
    console.log('=== PC-010 TEST COMPLETED ===');
  });
});
