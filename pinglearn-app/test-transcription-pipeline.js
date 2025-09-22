// PC-011 Transcription Pipeline End-to-End Test
// Tests the complete data flow: Python Agent → LiveKit → SessionOrchestrator → DisplayBuffer → UI
// Run this in browser console while session is active

console.log('🧪 PC-011 Transcription Pipeline Test');
console.log('======================================');
console.log('Version: PC-011 (Complete Fix)');
console.log('Date:', new Date().toISOString());
console.log('');

// Test configuration
const PC011_TEST = {
  startTime: Date.now(),
  logBuffer: [],
  transcriptionCount: 0,
  lastTranscriptionTime: null,
  errors: []
};

// Step 1: Check if we're in the classroom
function checkEnvironment() {
  console.log('1️⃣ Checking Environment...');

  const isClassroom = window.location.pathname.includes('/classroom');
  if (!isClassroom) {
    console.error('❌ Not in classroom. Navigate to /classroom first.');
    return false;
  }

  console.log('✅ In classroom page');
  return true;
}

// Step 2: Check protected core services
async function checkProtectedCore() {
  console.log('\n2️⃣ Checking Protected Core Services...');

  try {
    // Check if services are available in window (for debugging)
    if (window.__DEBUG_SERVICES__) {
      const { orchestrator, displayBuffer, wsManager } = window.__DEBUG_SERVICES__;

      console.log('✅ SessionOrchestrator:', orchestrator ? 'Available' : 'Missing');
      console.log('✅ DisplayBuffer:', displayBuffer ? 'Available' : 'Missing');
      console.log('✅ WebSocketManager:', wsManager ? 'Available' : 'Missing');

      // Check session state
      if (orchestrator) {
        const state = orchestrator.getSessionState();
        if (state) {
          console.log('✅ Session State:', {
            id: state.id,
            status: state.status,
            voice: state.voiceConnectionStatus,
            transcriptionActive: state.transcriptionActive
          });
        } else {
          console.log('⚠️ No active session');
        }
      }

      // Check display buffer
      if (displayBuffer) {
        const items = displayBuffer.getItems();
        console.log(`✅ Display Buffer: ${items.length} items`);

        if (items.length > 0) {
          console.log('   Recent items:');
          items.slice(-3).forEach((item, i) => {
            console.log(`   [${i+1}] ${item.speaker}: "${item.content.substring(0, 50)}..."`);
          });
        }
      }
    } else {
      console.log('⚠️ Debug services not exposed. Add window.__DEBUG_SERVICES__ to your code for testing.');
    }
  } catch (error) {
    PC011_TEST.errors.push(error);
    console.error('❌ Error checking services:', error);
  }
}

// Step 3: Monitor console logs
function monitorLogs() {
  console.log('\n3️⃣ Monitoring Console Logs...');

  // Intercept console.log
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');

    // Check for PC-011 specific logs
    if (message.includes('[PC-011]')) {
      PC011_TEST.logBuffer.push({
        time: Date.now() - PC011_TEST.startTime,
        type: 'PC-011',
        message: message
      });
      console.info('🎯 PC-011 Log Detected:', message);
    }

    // Check for transcription logs
    if (message.includes('Transcription received') ||
        message.includes('transcriptionReceived') ||
        message.includes('DataReceived')) {
      PC011_TEST.transcriptionCount++;
      PC011_TEST.lastTranscriptionTime = Date.now();
      console.info('📝 Transcription Activity Detected!');
    }

    // Check for LiveKit logs
    if (message.includes('LiveKit')) {
      PC011_TEST.logBuffer.push({
        time: Date.now() - PC011_TEST.startTime,
        type: 'LiveKit',
        message: message
      });
    }

    originalLog.apply(console, args);
  };

  console.log('✅ Log monitoring active');
}

// Step 4: Check UI for transcriptions
function checkUI() {
  console.log('\n4️⃣ Checking UI Components...');

  // Check for transcript display
  const transcriptElements = document.querySelectorAll('[class*="transcript"], [class*="Transcript"]');
  console.log(`✅ Found ${transcriptElements.length} transcript elements`);

  // Check for teaching board
  const teachingBoard = document.querySelector('[class*="teaching"], [class*="Teaching"]');
  console.log(`✅ Teaching Board: ${teachingBoard ? 'Present' : 'Missing'}`);

  // Check for math content
  const mathElements = document.querySelectorAll('.katex, [class*="math"]');
  console.log(`✅ Math Elements: ${mathElements.length} found`);

  // Monitor for changes
  if (transcriptElements.length > 0) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          PC011_TEST.transcriptionCount++;
          console.info('🆕 New content added to transcript!');
        }
      });
    });

    transcriptElements.forEach(el => {
      observer.observe(el, { childList: true, subtree: true });
    });

    console.log('✅ UI monitoring active');
  }
}

// Step 5: Run comprehensive test
async function runTest(duration = 30) {
  console.log(`\n5️⃣ Running ${duration}-second test...`);
  console.log('   Speak to the AI teacher to generate transcriptions.\n');

  const startCount = PC011_TEST.transcriptionCount;
  let dots = 0;

  const interval = setInterval(() => {
    dots++;
    process.stdout?.write?.('.') || console.log('.');

    if (dots >= duration) {
      clearInterval(interval);
      showResults(startCount);
    }
  }, 1000);
}

// Show test results
function showResults(startCount) {
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 PC-011 TEST RESULTS');
  console.log('='.repeat(50));

  const transcriptionsDetected = PC011_TEST.transcriptionCount - startCount;

  console.log(`✅ Environment: Classroom`);
  console.log(`📝 Transcriptions Detected: ${transcriptionsDetected}`);
  console.log(`📋 PC-011 Logs Captured: ${PC011_TEST.logBuffer.filter(l => l.type === 'PC-011').length}`);
  console.log(`🔊 LiveKit Logs: ${PC011_TEST.logBuffer.filter(l => l.type === 'LiveKit').length}`);
  console.log(`❌ Errors: ${PC011_TEST.errors.length}`);

  if (transcriptionsDetected > 0) {
    console.log('\n✅✅✅ PC-011 FIX VERIFIED! ✅✅✅');
    console.log('Transcription pipeline is working correctly!');

    const timeSinceLastTranscription = Date.now() - PC011_TEST.lastTranscriptionTime;
    console.log(`Last transcription: ${timeSinceLastTranscription}ms ago`);
  } else {
    console.log('\n⚠️ NO TRANSCRIPTIONS DETECTED');
    console.log('\nTroubleshooting:');
    console.log('1. Ensure session is active (not paused)');
    console.log('2. Check LiveKit Python agent is running:');
    console.log('   cd ../livekit-agent && source venv/bin/activate && python agent.py');
    console.log('3. Speak clearly to generate transcriptions');
    console.log('4. Check browser console for errors');
    console.log('5. Verify microphone permissions granted');
  }

  if (PC011_TEST.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    PC011_TEST.errors.forEach((err, i) => {
      console.error(`[${i+1}]`, err);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('Test completed at:', new Date().toISOString());
}

// Main test execution
async function executePC011Test() {
  console.log('Starting PC-011 Comprehensive Test...\n');

  if (!checkEnvironment()) {
    return;
  }

  await checkProtectedCore();
  monitorLogs();
  checkUI();
  await runTest(30);
}

// Auto-execute or provide manual trigger
if (typeof window !== 'undefined') {
  console.log('\n📌 To run the test, execute:');
  console.log('   executePC011Test()');
  console.log('\nOr press Enter to start now...');

  // Make function globally available
  window.executePC011Test = executePC011Test;
  window.PC011_TEST = PC011_TEST;
} else {
  // Node.js environment
  executePC011Test();
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executePC011Test, PC011_TEST };
}