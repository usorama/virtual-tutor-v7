# Transcript Display Investigation
**Date**: 2025-10-03
**Issue**: No transcripts appearing in UI after 1 minute conversation
**Related**: PC-015 metadata flow fix

## 🔍 Investigation Summary

### Issues Reported by User

1. ❌ AI teacher introduced as "General Studies" instead of "English Language"
2. ⚠️ White bar appearing before text shows
3. ❌ **CRITICAL**: After 1 minute conversation, NO text appearing in UI

### Findings from 10-Agent Investigation

#### ✅ Issue #1: FIXED - Metadata Flow
**Root Cause**: LiveKitRoom called `/api/livekit/token` without metadata parameter
- Python agent received empty `room.metadata`
- Used fallback values: "Grade 10 General Studies"

**Fix Applied** (Commit f3a089a):
- Updated `LiveKitRoom.tsx` to accept metadata props
- Changed endpoint to `/api/v2/livekit/token`
- Classroom page extracts and passes metadata

**Expected Result**: AI teacher should now say correct grade/subject

#### ✅ Issue #2: NOT A BUG - ShowThenTell Feature
**Finding**: White bar is INTENTIONAL design (WordHighlighter.tsx:29)
- Words start with `opacity-0 translate-y-1`
- Fade in over 400ms animation
- Message bubble renders first (white bar), then text appears progressively
- This is the ShowThenTell feature working as designed

#### ✅ Issue #1: FIXED - Metadata Now Flows Correctly (Commit 03c908c)

**Root Cause Found**: Python agent was reading `room.metadata` (empty) instead of `participant.metadata` (has session context)

**Fix Applied**:
- Reordered agent.py: connect → wait for participant → read metadata
- Changed from `ctx.room.metadata` to `participant.metadata`
- Frontend sets metadata via `AccessToken({ metadata })` → sets participant metadata
- Agent now reads from correct source

**Result**: ✅ AI teacher now introduces with correct subject (e.g., "English Language")

#### ❌ Issue #3: STILL INVESTIGATING - No Transcripts in UI

### Python Agent Analysis

**Evidence from logs**:
```
INFO: [REALTIME] Progressive streaming complete: 9 chunks sent
INFO: Sent proactive greeting to student
```

✅ Python agent IS sending transcripts via LiveKit data channel

### Frontend Flow Analysis

**Expected Flow**:
```
Python Agent → LiveKit Data Channel → LiveKitRoom (data event)
    ↓
liveKitEventBus.emit('livekit:transcript', data)
    ↓
SessionOrchestrator listener (setupLiveKitDataChannelListener)
    ↓
DisplayBuffer.addItem()
    ↓
UI Components subscribe and display
```

**Verified Components**:
1. ✅ `VoiceSessionManager.startSession()` calls `SessionOrchestrator.startSession()`
2. ✅ `SessionOrchestrator.startSession()` calls `setupLiveKitDataChannelListener()`
3. ✅ Listener attaches to `liveKitEventBus.on('livekit:transcript')`
4. ✅ Classroom page calls `controls.start()` which triggers flow above
5. ✅ `LiveKitRoom` listens to `RoomEvent.DataReceived` and emits to event bus
6. ✅ UI components (ChatInterface, TranscriptSimple) use DisplayBuffer subscriptions

**Potential Issues**:
1. ⚠️ **Old polling code** still running (TranscriptionDisplay.tsx:145)
   ```typescript
   const updateInterval = setInterval(checkForUpdates, 250); // OLD POLLING
   ```
   This was supposed to be eliminated by PC-015

2. ⚠️ **Listener timing**: Listener attached in `startSession()` but LiveKitRoom connects separately
   - If LiveKitRoom connects BEFORE listener is attached, early messages are lost
   - Need to verify connection timing

3. ⚠️ **Missing logs**: No frontend logs showing:
   - `[FS-00-AB-1] Setting up LiveKit data channel listener`
   - `[FS-00-AB-1] Received transcript from LiveKit`
   - `[LiveKitRoom] Transcript received, emitting to SessionOrchestrator`

## 🎯 Next Debugging Steps

### Step 1: Add Enhanced Logging
Add console logs to verify each step:
```typescript
// In LiveKitRoom.tsx handleDataReceived
console.log('[DEBUG] Data packet received:', data.type, data.segments?.length);

// In SessionOrchestrator listener
console.log('[DEBUG] Transcript listener triggered, segments:', data.segments?.length);

// In DisplayBuffer.addItem
console.log('[DEBUG] DisplayBuffer adding item:', item);
```

### Step 2: Check Connection Timing
Verify order of operations:
1. When is `controls.start()` called?
2. When does LiveKitRoom connect?
3. When is listener attached?
4. When does Python agent send first message?

### Step 3: Test DisplayBuffer Directly
```typescript
// In classroom page after session start
const orchestrator = SessionOrchestrator.getInstance();
console.log('[DEBUG] DisplayBuffer items:', orchestrator.getDisplayBufferItems());
```

### Step 4: Remove Old Polling Code
Migrate or remove TranscriptionDisplay.tsx polling (line 145)

### Step 5: Verify Data Channel
Check LiveKitRoom is emitting events:
```typescript
liveKitEventBus.emit('livekit:transcript', {
  segments: [...],
  speaker: 'teacher'
});
```

## 📋 Code References

### Files Modified (PC-015)
- `/src/components/voice/LiveKitRoom.tsx` (lines 12-34, 75-84)
- `/src/app/classroom/page.tsx` (lines 538-578)

### Files to Investigate
- `/src/protected-core/session/orchestrator.ts` (lines 431-480: listener setup)
- `/src/components/transcription/TranscriptionDisplay.tsx` (line 145: old polling)
- `/src/features/voice/VoiceSessionManager.ts` (lines 196-270: startSession flow)

### Event Flow Checkpoints
1. `classroom/page.tsx:233` - controls.start()
2. `VoiceSessionManager.ts:224` - SessionOrchestrator.startSession()
3. `orchestrator.ts:145` - setupLiveKitDataChannelListener()
4. `LiveKitRoom.tsx:206` - handleDataReceived()
5. `LiveKitRoom.tsx:233` - emit('livekit:transcript')
6. `orchestrator.ts:442-472` - listener processes data
7. `DisplayBuffer` - addItem() called

## 🔄 Testing Protocol

### Manual Test
1. Login as deethya@gmail.com (Grade 12 English)
2. Start session
3. Open browser DevTools console
4. Look for debug logs at each checkpoint
5. Check DisplayBuffer contents
6. Verify Python agent logs show data sent

### Expected Logs
```
[LiveKitRoom] Transcript received, emitting to SessionOrchestrator
[FS-00-AB-1] Setting up LiveKit data channel listener
[FS-00-AB-1] Received transcript from LiveKit data channel
[DisplayBuffer] Item added: {type: "teacher", ...}
```

### Success Criteria
- ✅ Metadata shows "Grade 12 English Language" in Python logs
- ✅ Console shows all checkpoint logs
- ✅ DisplayBuffer contains items
- ✅ Text appears in ChatInterface/TranscriptSimple

## 📊 Investigation Status

| Issue | Status | Next Action |
|-------|--------|-------------|
| Metadata flow | ✅ FIXED (03c908c) | ✅ Verified - Teacher says "English" |
| White bar | ✅ NOT A BUG | ShowThenTell feature (WordHighlighter) |
| No transcripts | ⚠️ INVESTIGATING | Add LiveKitRoom debug logs |
| Old polling code | ⚠️ TODO | Remove/migrate |

**Latest Update (2025-10-03)**:
- Metadata fix verified working - AI teacher now identifies correctly
- User reports white bars still showing (empty transcript area)
- Python agent sending transcripts (11 chunks confirmed in logs)
- Frontend NOT receiving data - no LiveKitRoom logs appearing
- Next: Add debug logs to LiveKitRoom data reception

## 🚀 Quick Fix Recommendations

### Priority 1: Debug Logging
Add comprehensive logging at every step of transcript flow

### Priority 2: Connection Timing
Ensure listener is attached BEFORE LiveKit connects and receives data

### Priority 3: Remove Legacy Code
Eliminate old polling code in TranscriptionDisplay.tsx

### Priority 4: Add Error Handling
Catch and log any errors in:
- Event bus emission
- Listener callback
- DisplayBuffer operations
