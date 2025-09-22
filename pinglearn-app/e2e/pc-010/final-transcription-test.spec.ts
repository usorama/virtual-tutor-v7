import { test, expect, Page } from '@playwright/test';

test.describe('PC-010 Final Transcription Pipeline Test', () => {
  let page: Page;
  const allLogs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture ALL console logs
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      if (text.includes('[PC-010]') || text.includes('transcription') || text.includes('math') || text.includes('PC010')) {
        console.log('TRANSCRIPTION LOG: ' + text);
      }
    });

    // Capture errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
  });

  test('should complete full PC-010 transcription pipeline test', async () => {
    console.log('=== PC-010 COMPLETE TRANSCRIPTION PIPELINE TEST ===');
    
    // STEP 1: Login
    await page.goto('http://localhost:3006');
    await page.click('text=Get Started');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Step 1: Login completed');
    
    // STEP 2: Navigate to Grade 10 Mathematics
    const grade10Link = page.locator('text=Grade 10 Mathematics').first();
    await expect(grade10Link).toBeVisible({ timeout: 10000 });
    await grade10Link.click();
    await page.waitForLoadState('networkidle');
    
    console.log('Step 2: Navigated to Grade 10 Mathematics');
    await page.screenshot({ path: 'e2e/pc-010/step2-grade10-page.png', fullPage: true });
    
    // STEP 3: Click "Start Learning Session" (the actual classroom entry)
    console.log('Step 3: Looking for Start Learning Session button...');
    const startLearningButton = page.locator('button:has-text("Start Voice Session Now")');
    
    if (await startLearningButton.count() > 0) {
      console.log('Found Start Learning Session button - clicking to enter classroom');
      await startLearningButton.click();
      await page.waitForTimeout(5000); // Wait for classroom to load
      
      console.log('Taking screenshot after entering classroom');
      await page.screenshot({ path: 'e2e/pc-010/step3-classroom-entered.png', fullPage: true });
      
      // STEP 4: Wait and monitor for transcription activity
      console.log('Step 4: Waiting 20 seconds for AI teacher and transcription pipeline...');
      
      // Monitor for 20 seconds, taking screenshots every 5 seconds
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'e2e/pc-010/monitoring-' + (i + 1) + '.png', fullPage: true });
        console.log('Monitoring screenshot ' + (i + 1) + '/4 taken');
      }
      
      console.log('Taking final classroom screenshot');
      await page.screenshot({ path: 'e2e/pc-010/final-classroom-state.png', fullPage: true });
      
    } else {
      console.log('Start Learning Session button not found');
      console.log('Checking what buttons are available...');
      
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log('Found ' + buttonCount + ' buttons total:');
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const buttonText = await allButtons.nth(i).textContent();
        console.log('Button ' + (i + 1) + ': "' + buttonText + '"');
      }
    }
    
    // STEP 5: Analyze all captured data
    console.log('=== FINAL PC-010 ANALYSIS ===');
    
    // Filter logs for PC-010 specific content
    const pc010Logs = allLogs.filter(log => 
      log.includes('[PC-010]') || 
      log.includes('PC010') ||
      log.toLowerCase().includes('transcription') ||
      log.toLowerCase().includes('math rendering') ||
      log.toLowerCase().includes('equation')
    );
    
    console.log('PC-010 Related Console Logs:', pc010Logs.length);
    pc010Logs.forEach((log, index) => {
      console.log('[PC-010-' + (index + 1) + '] ' + log);
    });
    
    // Check current page for transcription elements
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Look for UI elements that indicate transcription is working
    const transcriptionIndicators = [
      '.teaching-board',
      '.transcript-panel', 
      '[data-testid*="transcript"]',
      '[class*="transcript"]',
      '.katex',
      '.MathJax',
      '[data-math]',
      '[class*="math"]'
    ];
    
    let totalElements = 0;
    for (const selector of transcriptionIndicators) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log('Found ' + count + ' elements matching: ' + selector);
        totalElements += count;
      }
    }
    
    // Check page content
    const bodyText = await page.textContent('body');
    const hasRelevantContent = bodyText?.toLowerCase().includes('transcript') ||
                              bodyText?.toLowerCase().includes('transcription') ||
                              bodyText?.toLowerCase().includes('math') ||
                              bodyText?.toLowerCase().includes('equation');
    
    // Final verdict
    console.log('=== PC-010 TRANSCRIPTION PIPELINE TEST RESULTS ===');
    console.log('Total Console Logs Captured:', allLogs.length);
    console.log('PC-010 Related Logs:', pc010Logs.length);
    console.log('Transcription UI Elements:', totalElements);
    console.log('Page Contains Relevant Content:', hasRelevantContent);
    console.log('Final URL:', currentUrl);
    
    if (pc010Logs.length > 0) {
      console.log('SUCCESS: PC-010 debug messages detected in console');
    } else if (totalElements > 0) {
      console.log('PARTIAL SUCCESS: Transcription UI elements present');
    } else if (hasRelevantContent) {
      console.log('MINIMAL SUCCESS: Transcription-related content found');
    } else {
      console.log('NO ACTIVITY: No clear signs of PC-010 transcription pipeline activity');
    }
  });
});
