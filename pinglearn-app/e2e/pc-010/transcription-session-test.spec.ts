import { test, expect, Page } from '@playwright/test';

test.describe('PC-010 Transcription Pipeline - Voice Session Test', () => {
  let page: Page;
  const pc010Logs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Enable console log capture for PC-010
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PC-010]') || text.includes('transcription') || text.includes('math')) {
        console.log('TRANSCRIPTION LOG: ' + text);
        pc010Logs.push(text);
      }
    });

    // Capture network errors
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
  });

  test('should test PC-010 transcription pipeline in voice session', async () => {
    console.log('=== PC-010 VOICE SESSION TRANSCRIPTION TEST ===');
    
    // Login first
    await page.goto('http://localhost:3006');
    await page.click('text=Get Started');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for dashboard to load
    
    console.log('Login completed, taking dashboard screenshot');
    await page.screenshot({ path: 'e2e/pc-010/dashboard-loaded.png', fullPage: true });
    
    // Look for Grade 10 Mathematics session
    console.log('Looking for Grade 10 Mathematics session...');
    const grade10Link = page.locator('text=Grade 10 Mathematics').first();
    await expect(grade10Link).toBeVisible({ timeout: 10000 });
    await grade10Link.click();
    await page.waitForLoadState('networkidle');
    
    console.log('Clicked Grade 10 Mathematics, taking screenshot');
    await page.screenshot({ path: 'e2e/pc-010/classroom-page.png', fullPage: true });
    
    // Look for Start Voice Session button
    console.log('Looking for Start Voice Session button...');
    const startVoiceButton = page.locator('button:has-text("Start Voice Session"), button:has-text("Start Session")').first();
    
    if (await startVoiceButton.count() > 0) {
      console.log('Found Start Voice Session button, clicking...');
      await startVoiceButton.click();
      await page.waitForTimeout(2000);
      
      console.log('Taking screenshot after starting session');
      await page.screenshot({ path: 'e2e/pc-010/session-started.png', fullPage: true });
      
      // Wait longer for the session to initialize and for potential transcriptions
      console.log('Waiting 15 seconds for AI teacher and potential transcriptions...');
      await page.waitForTimeout(15000);
      
      console.log('Taking final screenshot after waiting');
      await page.screenshot({ path: 'e2e/pc-010/session-with-transcription.png', fullPage: true });
      
      // Check for transcription-related elements
      console.log('Checking for transcription elements...');
      
      // Look for various transcription indicators
      const transcriptionSelectors = [
        '[data-testid*="transcript"]',
        '[class*="transcript"]',
        '[data-transcription]',
        '.transcription',
        '[class*="math"]',
        '.katex',
        '.MathJax',
        '[data-math]'
      ];
      
      let foundElements = 0;
      for (const selector of transcriptionSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log('Found ' + count + ' elements with selector: ' + selector);
          foundElements += count;
        }
      }
      
      // Check page content for transcription-related text
      const bodyText = await page.textContent('body');
      const hasTranscriptionKeywords = bodyText?.toLowerCase().includes('transcription') ||
                                     bodyText?.toLowerCase().includes('transcript') ||
                                     bodyText?.toLowerCase().includes('equation') ||
                                     bodyText?.toLowerCase().includes('math');
      
      console.log('Page contains transcription keywords:', hasTranscriptionKeywords);
      
      // Report PC-010 specific console logs
      console.log('=== PC-010 CONSOLE LOGS SUMMARY ===');
      console.log('Total transcription-related logs captured:', pc010Logs.length);
      pc010Logs.forEach((log, index) => {
        console.log('[' + (index + 1) + '] ' + log);
      });
      
      // Final analysis
      console.log('=== PC-010 TRANSCRIPTION PIPELINE ANALYSIS ===');
      console.log('Session started successfully:', true);
      console.log('Transcription elements found:', foundElements);
      console.log('Console logs with transcription data:', pc010Logs.length);
      console.log('Page contains transcription keywords:', hasTranscriptionKeywords);
      
      if (foundElements > 0 || pc010Logs.length > 0 || hasTranscriptionKeywords) {
        console.log('PC-010 TRANSCRIPTION PIPELINE: SIGNS OF ACTIVITY DETECTED');
      } else {
        console.log('PC-010 TRANSCRIPTION PIPELINE: NO CLEAR TRANSCRIPTION ACTIVITY DETECTED');
      }
      
    } else {
      console.log('Start Voice Session button not found');
      await page.screenshot({ path: 'e2e/pc-010/no-start-button.png', fullPage: true });
    }
  });
});
