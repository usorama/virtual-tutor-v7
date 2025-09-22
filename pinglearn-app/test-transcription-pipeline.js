// PC-010 Transcription Pipeline Comprehensive Test
// Run in browser console to test transcription functionality

console.log('🧪 Starting PC-010 Transcription Pipeline Test');
console.log('================================================');

// Test configuration
const TEST_CONFIG = {
  HOMEPAGE_URL: 'http://localhost:3006',
  WAIT_TIMES: {
    NAVIGATION: 2000,
    SESSION_START: 5000,
    TRANSCRIPTION_WAIT: 10000
  },
  SELECTORS: {
    GO_TO_DASHBOARD: '[data-testid="go-to-dashboard"], a[href="/dashboard"]',
    MATH_CARD: '[data-testid="math-card"], .curriculum-card',
    CLASSROOM_LINK: 'a[href*="classroom"]',
    START_SESSION: '[data-testid="start-session"], button:contains("Start Session")',
    TEACHING_BOARD: '[data-testid="teaching-board"], .teaching-board',
    TRANSCRIPT_TAB: '[data-testid="transcript-tab"], .transcript-tab',
    TRANSCRIPT_CONTENT: '[data-testid="transcript-content"], .transcript-content'
  }
};

// Test results storage
const testResults = {
  navigation: [],
  console_logs: [],
  transcription_activity: [],
  ui_state: [],
  errors: [],
  screenshots: []
};

// Console log monitoring
let originalConsoleLog = console.log;
let originalConsoleError = console.error;
let originalConsoleWarn = console.warn;

// Override console methods to capture PC-010 logs
console.log = function(...args) {
  const message = args.join(' ');
  if (message.includes('[PC-010]')) {
    testResults.console_logs.push({
      timestamp: new Date().toISOString(),
      type: 'log',
      message: message
    });
  }
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('[PC-010]') || message.includes('transcript')) {
    testResults.console_logs.push({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: message
    });
  }
  originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('[PC-010]') || message.includes('transcript')) {
    testResults.console_logs.push({
      timestamp: new Date().toISOString(),
      type: 'warn',
      message: message
    });
  }
  originalConsoleWarn.apply(console, args);
};

// Utility functions
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function takeSnapshot(step) {
  const snapshot = {
    step: step,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    teaching_board_content: '',
    transcript_content: '',
    visible_elements: []
  };

  // Capture Teaching Board content
  const teachingBoard = document.querySelector(TEST_CONFIG.SELECTORS.TEACHING_BOARD) ||
                       document.querySelector('.w-4/5') || // 80% width left side
                       document.querySelector('[class*="teaching"]');

  if (teachingBoard) {
    snapshot.teaching_board_content = teachingBoard.innerText || teachingBoard.textContent || '';
  }

  // Capture Transcript content
  const transcriptContent = document.querySelector(TEST_CONFIG.SELECTORS.TRANSCRIPT_CONTENT) ||
                           document.querySelector('.w-1/5') || // 20% width right side
                           document.querySelector('[class*="transcript"]');

  if (transcriptContent) {
    snapshot.transcript_content = transcriptContent.innerText || transcriptContent.textContent || '';
  }

  // Capture visible buttons and important elements
  const importantElements = document.querySelectorAll('button, [role="button"], .card, [data-testid]');
  importantElements.forEach(el => {
    if (el.offsetParent !== null) { // visible check
      snapshot.visible_elements.push({
        tag: el.tagName,
        text: el.innerText?.substring(0, 50) || '',
        testId: el.getAttribute('data-testid') || '',
        classes: el.className || ''
      });
    }
  });

  testResults.screenshots.push(snapshot);
  console.log(`📸 Snapshot taken for step: ${step}`);
  return snapshot;
}

function clickElement(selector, description) {
  console.log(`🖱️ Attempting to click: ${description}`);

  // Try multiple selector strategies
  let element = document.querySelector(selector);

  if (!element) {
    // Try finding by text content
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    element = buttons.find(btn =>
      btn.innerText?.toLowerCase().includes(description.toLowerCase()) ||
      btn.textContent?.toLowerCase().includes(description.toLowerCase())
    );
  }

  if (element) {
    console.log(`✅ Found element: ${element.tagName} - "${element.innerText?.substring(0, 30)}"`);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.click();
    return true;
  } else {
    console.log(`❌ Element not found: ${description}`);
    testResults.errors.push(`Failed to find element: ${description}`);
    return false;
  }
}

// Main test execution
async function runTranscriptionTest() {
  console.log('🚀 Starting transcription pipeline test...');

  try {
    // Step 1: Initial page state
    console.log('\n📋 Step 1: Capturing initial page state');
    takeSnapshot('initial_state');
    await wait(TEST_CONFIG.WAIT_TIMES.NAVIGATION);

    // Step 2: Navigate to dashboard
    console.log('\n📋 Step 2: Navigating to dashboard');
    if (clickElement(TEST_CONFIG.SELECTORS.GO_TO_DASHBOARD, 'dashboard')) {
      await wait(TEST_CONFIG.WAIT_TIMES.NAVIGATION);
      takeSnapshot('dashboard_loaded');
    }

    // Step 3: Navigate to classroom
    console.log('\n📋 Step 3: Navigating to classroom');
    if (clickElement(TEST_CONFIG.SELECTORS.MATH_CARD, 'mathematics') ||
        clickElement(TEST_CONFIG.SELECTORS.CLASSROOM_LINK, 'classroom')) {
      await wait(TEST_CONFIG.WAIT_TIMES.NAVIGATION);
      takeSnapshot('classroom_loaded');
    }

    // Step 4: Start session
    console.log('\n📋 Step 4: Starting learning session');
    const sessionStarted = clickElement(TEST_CONFIG.SELECTORS.START_SESSION, 'start session');

    if (sessionStarted) {
      console.log('⏱️ Waiting for session to initialize...');
      await wait(TEST_CONFIG.WAIT_TIMES.SESSION_START);
      takeSnapshot('session_started');

      // Step 5: Monitor for transcription activity
      console.log('\n📋 Step 5: Monitoring for transcription activity');

      // Watch for changes in transcription content
      let previousTeachingContent = '';
      let previousTranscriptContent = '';
      let checkCount = 0;
      const maxChecks = 20; // 20 seconds of monitoring

      const monitorInterval = setInterval(() => {
        checkCount++;

        const currentSnapshot = takeSnapshot(`monitoring_${checkCount}`);

        // Check for new content
        if (currentSnapshot.teaching_board_content !== previousTeachingContent) {
          console.log('🆕 Teaching Board content changed!');
          console.log('New content:', currentSnapshot.teaching_board_content);
          testResults.transcription_activity.push({
            timestamp: new Date().toISOString(),
            type: 'teaching_board_update',
            content: currentSnapshot.teaching_board_content
          });
          previousTeachingContent = currentSnapshot.teaching_board_content;
        }

        if (currentSnapshot.transcript_content !== previousTranscriptContent) {
          console.log('🆕 Transcript content changed!');
          console.log('New content:', currentSnapshot.transcript_content);
          testResults.transcription_activity.push({
            timestamp: new Date().toISOString(),
            type: 'transcript_update',
            content: currentSnapshot.transcript_content
          });
          previousTranscriptContent = currentSnapshot.transcript_content;
        }

        if (checkCount >= maxChecks) {
          clearInterval(monitorInterval);
          generateTestReport();
        }
      }, 1000);

    } else {
      console.log('❌ Failed to start session');
      generateTestReport();
    }

  } catch (error) {
    console.error('💥 Test execution error:', error);
    testResults.errors.push(`Test execution error: ${error.message}`);
    generateTestReport();
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n📊 TRANSCRIPTION PIPELINE TEST REPORT');
  console.log('=====================================');

  // Console logs analysis
  console.log('\n🔍 PC-010 Console Logs:');
  if (testResults.console_logs.length > 0) {
    testResults.console_logs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`);
    });
  } else {
    console.log('❌ No PC-010 debug logs found');
  }

  // Transcription activity analysis
  console.log('\n📝 Transcription Activity:');
  if (testResults.transcription_activity.length > 0) {
    testResults.transcription_activity.forEach(activity => {
      console.log(`[${activity.timestamp}] ${activity.type}: ${activity.content.substring(0, 100)}...`);
    });
  } else {
    console.log('❌ No transcription activity detected');
  }

  // UI state analysis
  console.log('\n🖥️ Final UI State:');
  const latestSnapshot = testResults.screenshots[testResults.screenshots.length - 1];
  if (latestSnapshot) {
    console.log('Teaching Board Content:', latestSnapshot.teaching_board_content || 'Empty');
    console.log('Transcript Content:', latestSnapshot.transcript_content || 'Empty');
    console.log('Visible Elements:', latestSnapshot.visible_elements.length);
  }

  // Errors analysis
  console.log('\n❌ Errors:');
  if (testResults.errors.length > 0) {
    testResults.errors.forEach(error => console.log(error));
  } else {
    console.log('✅ No errors detected');
  }

  // Network analysis
  console.log('\n🌐 Network Analysis:');
  console.log('WebSocket connections:',
    Array.from(window.navigator.connection || []).length || 'Unable to detect');

  // Final assessment
  console.log('\n🎯 FINAL ASSESSMENT:');
  const hasPC010Logs = testResults.console_logs.length > 0;
  const hasTranscriptionActivity = testResults.transcription_activity.length > 0;
  const hasContent = latestSnapshot?.teaching_board_content?.length > 50 ||
                     latestSnapshot?.transcript_content?.length > 10;

  if (hasPC010Logs && hasTranscriptionActivity && hasContent) {
    console.log('✅ TRANSCRIPTION PIPELINE WORKING - Logs, activity, and content detected');
  } else if (hasPC010Logs && !hasTranscriptionActivity) {
    console.log('⚠️ PARTIAL SUCCESS - Logs detected but no transcription activity');
  } else if (!hasPC010Logs) {
    console.log('❌ PIPELINE NOT WORKING - No PC-010 debug logs detected');
  } else {
    console.log('❓ UNCLEAR STATUS - Mixed results detected');
  }

  // Make results available globally
  window.PC010_TEST_RESULTS = testResults;
  console.log('\n💾 Full test results saved to window.PC010_TEST_RESULTS');
}

// Start the test
runTranscriptionTest();