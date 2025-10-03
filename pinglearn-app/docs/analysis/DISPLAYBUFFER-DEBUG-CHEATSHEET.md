# DisplayBuffer Debug Cheatsheet

Quick reference for debugging transcript flow issues in PingLearn.

---

## 🚨 Quick Diagnosis

### Symptom: No transcripts appearing in UI

**Run this in browser console:**
```javascript
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();
  const items = buffer.getItems();

  if (items.length === 0) {
    console.log('❌ DisplayBuffer is EMPTY - Issue is UPSTREAM');
    console.log('   Check: Python agent, LiveKit connection, session state');
  } else {
    console.log('✅ DisplayBuffer has', items.length, 'items - Issue is DOWNSTREAM');
    console.log('   Check: UI component subscriptions, React state updates');
    console.log('   Items:', items);
  }
});
```

---

## 🔍 Browser Console Commands

### 1. Check DisplayBuffer Status
```javascript
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();
  console.log('Buffer size:', buffer.getBufferSize());
  console.log('Last item:', buffer.getLastItem());
  console.log('All items:', buffer.getItems());
});
```

### 2. Monitor Real-Time Updates
```javascript
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();
  let count = 0;
  buffer.subscribe(items => {
    count++;
    console.log(`🔄 Update #${count}:`, items.length, 'items');
    console.log('   Latest:', items[items.length - 1]);
  });
  console.log('✅ Monitoring started. Waiting for updates...');
});
```

### 3. Check Session State
```javascript
import('@/protected-core').then(({ SessionOrchestrator }) => {
  const orch = SessionOrchestrator.getInstance();
  const state = orch.getSessionState();
  console.log('Session ID:', state?.id);
  console.log('Status:', state?.status);
  console.log('Voice:', state?.voiceConnectionStatus);
  console.log('Transcription active:', state?.transcriptionActive);
});
```

### 4. Test DisplayBuffer Directly
```javascript
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();

  // Add test item
  buffer.addItem({
    type: 'text',
    content: 'Test transcript item',
    speaker: 'teacher',
    confidence: 1.0
  });

  console.log('✅ Test item added');
  console.log('Buffer size:', buffer.getBufferSize());
  console.log('Last item:', buffer.getLastItem());
});
```

### 5. Check All Subscribers
```javascript
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();
  console.log('Active subscribers:', buffer.subscribers?.size || 'unknown');
  // Note: subscribers is private, but you can check by adding test item
  // If UI updates, subscribers are working
});
```

---

## 🔬 Python Agent Checks

### Check if Agent is Running
```bash
ps aux | grep livekit
```

### View Agent Logs (Real-time)
```bash
tail -f livekit-agent/logs/agent.log
```

### Search for Transcript Sends
```bash
grep "Sending transcript" livekit-agent/logs/agent.log
grep "Data packet sent" livekit-agent/logs/agent.log
```

### Check for Errors
```bash
grep -i "error" livekit-agent/logs/agent.log
grep -i "exception" livekit-agent/logs/agent.log
```

---

## 📝 Expected Console Logs (In Order)

### ✅ Working System
```
[LiveKitRoom] Transcript received, emitting to SessionOrchestrator
[FS-00-AB-1] Setting up LiveKit data channel listener
[FS-00-AB-1] LiveKit data channel listener attached
[FS-00-AB-1] Received transcript from LiveKit data channel
[PC-012] Transcript accepted - session status: active
[PC-012] Transcript successfully added to DisplayBuffer: {...}
[TeachingBoardSimple] Buffer update received: N items
[TranscriptSimple] Buffer update received: N items
```

### ❌ Broken: No Python Agent Data
```
Missing: [LiveKitRoom] Transcript received...
Diagnosis: Python agent not sending data
Fix: Check Python agent logs
```

### ⚠️ Broken: Session Not Active
```
Present: [FS-00-AB-1] Received transcript...
Present: [PC-012] Session not ready - status: ended
Diagnosis: Session ended or not started
Fix: Check session lifecycle
```

---

## 🎯 Quick Fixes

### Problem: DisplayBuffer Empty

**Step 1**: Check Python agent
```bash
ps aux | grep livekit
# If not running: Start it
cd livekit-agent
source venv/bin/activate
python agent.py
```

**Step 2**: Check LiveKit connection
```javascript
// In browser console
room.state // Should be 'connected'
room.participants.size // Should be > 0
```

**Step 3**: Check session state
```javascript
import('@/protected-core').then(({ SessionOrchestrator }) => {
  const state = SessionOrchestrator.getInstance().getSessionState();
  console.log('Session status:', state?.status);
  // Should be 'active' or 'initializing'
});
```

---

### Problem: DisplayBuffer Has Items, But UI Not Updating

**Step 1**: Verify subscriptions
```javascript
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();

  // Add test subscriber
  const unsub = buffer.subscribe(items => {
    console.log('✅ Subscription working! Items:', items.length);
  });

  // Add test item to trigger subscription
  buffer.addItem({
    type: 'text',
    content: 'Subscription test',
    speaker: 'teacher'
  });

  // Cleanup
  setTimeout(() => unsub(), 1000);
});
```

**Step 2**: Check React DevTools
- Open React DevTools in browser
- Find TeachingBoardSimple, TranscriptSimple, or ChatInterface
- Check if their state contains `content`, `transcriptItems`, or `messages`
- If state is empty but DisplayBuffer has items, subscription may not be working

**Step 3**: Check component mounting
```javascript
// Look for these logs in console:
// [TeachingBoardSimple] Successfully subscribed to display buffer
// [TranscriptSimple] Successfully subscribed to display buffer
// If missing, components aren't mounting or subscribing
```

---

## 🔧 Common Issues & Solutions

### Issue: Duplicate Items
```
[DisplayBuffer] Duplicate item detected, skipping
```
**Status**: ✅ NORMAL - This is deduplication working correctly
**Explanation**: Same content sent within 1 second is automatically deduplicated
**Action**: None needed - this is expected behavior

---

### Issue: Buffer Cleared After Session End
```
[TeachingBoardSimple] Buffer update received: 0 items
```
**Status**: ✅ NORMAL if session just ended
**Explanation**: DisplayBuffer clears when new session starts
**Action**: Start a new session to populate buffer

---

### Issue: No Logs at All
```
Nothing in console about DisplayBuffer
```
**Status**: ❌ PROBLEM
**Diagnosis**: Code not running, import failed, or console filtered
**Action**:
1. Check browser console filter (should show all logs, not just errors)
2. Reload page
3. Verify protected-core is built: `npm run build`
4. Check for TypeScript errors: `npm run typecheck`

---

## 📊 Performance Benchmarks

### Normal Operation
- Buffer size: 0-100 items (typical conversation)
- Buffer size: 100-500 items (long session)
- Buffer size: 500-1000 items (max capacity)
- Subscriber count: 3-4 (typical)
- Notification latency: <5ms (synchronous)

### Warning Signs
- Buffer size > 1000 items (auto-cleanup should prevent this)
- Subscriber count > 10 (memory leak?)
- Notification latency > 100ms (performance issue)

---

## 🧪 Test Data Injection

### Inject Test Transcripts
```javascript
import('@/protected-core').then(({ SessionOrchestrator }) => {
  const orch = SessionOrchestrator.getInstance();

  // Inject text transcript
  orch.addTranscriptionItem({
    type: 'text',
    content: 'This is a test transcript',
    speaker: 'teacher',
    confidence: 0.95
  });

  // Inject math transcript
  orch.addTranscriptionItem({
    type: 'math',
    content: 'x^2 + 2x + 1 = 0',
    speaker: 'teacher',
    confidence: 0.98
  });

  console.log('✅ Test transcripts injected');
});
```

### Simulate LiveKit Event
```javascript
import('@/components/voice/LiveKitRoom').then(({ liveKitEventBus }) => {
  liveKitEventBus.emit('livekit:transcript', {
    segments: [
      {
        type: 'text',
        content: 'Simulated transcript from LiveKit',
        confidence: 0.9
      }
    ],
    speaker: 'teacher',
    timestamp: Date.now()
  });

  console.log('✅ LiveKit event simulated');
});
```

---

## 🎓 Understanding the Flow

### Data Enters System
```
Python Agent → LiveKit Cloud → Browser
```

### Browser Processing
```
RoomEvent.DataReceived → liveKitEventBus → SessionOrchestrator
```

### Protected Core
```
addTranscriptionItem() → DisplayBuffer.addItem() → notifySubscribers()
```

### UI Updates
```
Subscription callback → setState() → React re-render → Display
```

---

## 📞 Escalation Path

### Level 1: Check DisplayBuffer
- Use browser console commands above
- If buffer is empty → Go to Level 2
- If buffer has items but UI not updating → Go to Level 3

### Level 2: Check Data Source
- Check Python agent logs
- Verify LiveKit connection
- Test session state
- If no data from Python agent → Fix Python agent
- If data present but not reaching browser → Check network

### Level 3: Check UI Components
- Verify subscriptions are active
- Check React DevTools for state
- Test direct injection (see above)
- If subscriptions working but UI not updating → Check React component implementation

---

## ✅ Verification Checklist

- [ ] Python agent running (`ps aux | grep livekit`)
- [ ] LiveKit room connected (`room.state === 'connected'`)
- [ ] Session active (`SessionOrchestrator.getSessionState().status === 'active'`)
- [ ] DisplayBuffer accessible (`getDisplayBuffer()` works)
- [ ] Subscriptions active (logs show "Successfully subscribed")
- [ ] No TypeScript errors (`npm run typecheck` shows 0 errors)
- [ ] Browser console not filtered (shows all logs, not just errors)

---

**Last Updated**: 2025-10-03
**Related Docs**:
- AGENT-9-DISPLAYBUFFER-FLOW-ANALYSIS.md (detailed analysis)
- DISPLAYBUFFER-FLOW-DIAGRAM.md (visual diagrams)
- AGENT-9-EXECUTIVE-SUMMARY.md (high-level overview)
