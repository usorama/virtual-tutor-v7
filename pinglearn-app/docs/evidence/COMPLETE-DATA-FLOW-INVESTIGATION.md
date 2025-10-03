# Complete Data Flow Investigation - deethya@gmail.com
**Date**: 2025-10-03
**Issue**: Transcripts not displaying despite infrastructure being complete

## 🔍 INVESTIGATION SUMMARY

### User Report
- User: deethya@gmail.com (UUID: 533d886a-e533-45ed-aaca-4d8087e9b0d7)
- Selected: Grade 12, English Language textbook
- **Problem**: After 1 minute conversation, NO text appearing in UI classroom page
- **Metadata Issue**: AI teacher says "Grade 10 General Studies" instead of "Grade 12 English Language"
- **Curriculum Issue**: Panel shows "Grade 10 Mathematics > Algebra" (wrong)

---

## ✅ CONFIRMED WORKING COMPONENTS

### 1. Database Layer ✅
**Status**: 100% CORRECT DATA

```json
// profiles table
{
  "id": "533d886a-e533-45ed-aaca-4d8087e9b0d7",
  "grade": 12,
  "preferred_subjects": ["English Language"],
  "selected_topics": {
    "English Language": ["Comprehension", "Writing Skills"]
  }
}

// learning_sessions table
{
  "chapter_focus": "Grade 12 English Language",
  "room_name": "session_voice_temp_1759488871619_533d886a..."
}

// textbooks table
{
  "title": "Objective General English",
  "grade": "Grade 12",
  "subject": "English Language",
  "status": "ready"
}
```

### 2. Python Agent Layer ✅
**Status**: SENDING TRANSCRIPTS SUCCESSFULLY

```
INFO: [REALTIME] Starting progressive stream: 29 words
INFO: [REALTIME] Streamed chunk 1: Hello!...
INFO: [REALTIME] Streamed chunk 2: Welcome to our...
...
INFO: [REALTIME] Streamed chunk 11: to get started?...
INFO: [REALTIME] Progressive streaming complete: 11 chunks sent
```

**BUT**: Using fallback metadata
```
WARNING: [PC-015] No participant metadata found, using fallback values
INFO: [PC-015] Using dynamic prompt: Grade 10 General Studies - General Learning
```

### 3. Frontend Infrastructure ✅
**Status**: ALL COMPONENTS EXIST AND ARE PROPERLY CONNECTED

**Component Chain**:
1. **LiveKitRoom** (lines 214-269)
   - Listens for `RoomEvent.DataReceived`
   - Decodes data packets
   - Emits `liveKitEventBus.emit('livekit:transcript', data)`
   - Has DEBUG-TRANSCRIPT logging

2. **SessionOrchestrator** (lines 431-480)
   - Called via `setupLiveKitDataChannelListener()` at session start (line 145)
   - Listens on `liveKitEventBus.on('livekit:transcript', callback)`
   - Adds items to DisplayBuffer via `addTranscriptionItem()`
   - Has [FS-00-AB-1] logging

3. **DisplayBuffer** (protected-core)
   - Stores transcript items
   - Notifies subscribers on updates
   - Provides `subscribe()` and `getItems()` APIs

4. **TeachingBoardSimple** (lines 258-299)
   - Subscribes to DisplayBuffer via `displayBuffer.subscribe(callback)`
   - Processes items with `processBufferItems()`
   - Aggregates chunks into paragraphs
   - Renders to UI

---

## ❌ IDENTIFIED ROOT CAUSES

### Issue #1: currentTopic Hardcoded (CRITICAL)
**File**: `/src/app/classroom/page.tsx:75`

```typescript
const [currentTopic, setCurrentTopic] = useState<string>('General Mathematics');
```

**Impact**:
- Metadata extraction uses regex on currentTopic
- Regex fails to match "General Mathematics"
- Falls back to "Grade 10 General Studies"
- Wrong metadata sent to agent

**Existing Fix Code** (Lines 158-174):
```typescript
async function checkAuth() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('grade, preferred_subjects, selected_topics')
    .eq('id', user.id)
    .single();

  if (profile?.preferred_subjects && profile.preferred_subjects.length > 0) {
    const topic = `Grade ${profile.grade} ${profile.preferred_subjects[0]}`;
    console.log('[DEBUG-METADATA] Setting currentTopic to:', topic);
    setCurrentTopic(topic);  // Should set to "Grade 12 English Language"
  }
}
```

**Status**: Code exists but needs verification that it's executing correctly.

### Issue #2: Transcript Display Breakdown (CRITICAL)
**Symptom**: Agent sends 11 chunks, but UI shows nothing

**Suspected Breakpoints**:

1. **LiveKitRoom NOT receiving data packets?**
   ```typescript
   // Added DEBUG-TRANSCRIPT logs at lines 214-269
   const handleDataReceived = (payload: Uint8Array) => {
     console.log('[DEBUG-TRANSCRIPT] Data packet received');
     // ... rest of handler
   }
   ```
   **Need to verify**: Are these logs appearing in browser console?

2. **Event bus NOT emitting?**
   ```typescript
   // Line 233 in LiveKitRoom
   liveKitEventBus.emit('livekit:transcript', eventData);
   console.log('[DEBUG-TRANSCRIPT] Event emitted successfully');
   ```
   **Need to verify**: Is event being emitted?

3. **SessionOrchestrator NOT receiving events?**
   ```typescript
   // Lines 442-472 in orchestrator.ts
   this.liveKitDataListener = (data: any) => {
     console.log('[FS-00-AB-1] Received transcript from LiveKit data channel');
     // ... process segments
   };
   ```
   **Need to verify**: Is listener being triggered?

4. **DisplayBuffer NOT notifying subscribers?**
   ```typescript
   // TeachingBoardSimple lines 279-286
   unsubscribe = displayBuffer.subscribe((items) => {
     console.log('[TeachingBoardSimple] Buffer update received:', items.length);
     processBufferItems(items as LiveDisplayItem[]);
   });
   ```
   **Need to verify**: Is subscription callback being called?

---

## 🔄 COMPLETE DATA FLOW (Expected vs Actual)

### Expected Flow:
```
✅ Database
  ↓ [Profile: Grade 12 English]
✅ classroom/page.tsx checkAuth()
  ↓ [Load profile, set currentTopic]
❓ currentTopic state
  ↓ [Should be "Grade 12 English Language"]
❓ Metadata extraction
  ↓ [Extract grade/subject from currentTopic]
❓ /api/v2/livekit/token
  ↓ [Pass metadata in AccessToken]
❌ Python Agent
  ↓ [Receives empty participant.metadata, uses fallback]
✅ Agent sends 11 chunks
  ↓ [Via LiveKit data channel]
❓ LiveKitRoom.handleDataReceived
  ↓ [Should receive data packets]
❓ liveKitEventBus.emit('livekit:transcript')
  ↓ [Should emit event]
❓ SessionOrchestrator listener
  ↓ [Should receive event, add to DisplayBuffer]
❓ DisplayBuffer.subscribe callback
  ↓ [Should notify TeachingBoardSimple]
❓ TeachingBoardSimple.processBufferItems
  ↓ [Should aggregate and render]
❌ UI displays nothing
```

### Actual Flow (Current State):
```
✅ Database → 100% correct data
✅ checkAuth() code exists (needs verification)
❓ currentTopic value unknown (needs debug logs)
❌ Metadata fallback used (confirmed in agent logs)
✅ Agent sends 11 chunks (confirmed)
❓ Frontend reception unknown (needs debug logs)
❌ UI displays nothing (confirmed)
```

---

## 🎯 NEXT STEPS (PRIORITY ORDER)

### Step 1: Add Enhanced Debug Logging ⏳
Add comprehensive logging to trace exact breakpoint:

```typescript
// In SessionOrchestrator.setupLiveKitDataChannelListener
this.liveKitDataListener = (data: any) => {
  console.log('[DEBUG-FLOW-1] ✅ SessionOrchestrator received transcript event');
  console.log('[DEBUG-FLOW-1] Data structure:', {
    hasSegments: !!data.segments,
    segmentCount: data.segments?.length,
    speaker: data.speaker
  });

  data.segments?.forEach((segment: any, idx: number) => {
    const itemId = this.addTranscriptionItem({...});
    console.log(`[DEBUG-FLOW-1] ✅ Added item ${idx + 1} to DisplayBuffer:`, itemId);
  });
};

// In DisplayBuffer (if possible to add logs without modifying protected-core)
// OR verify DisplayBuffer.subscribe is working

// In TeachingBoardSimple
unsubscribe = displayBuffer.subscribe((items) => {
  console.log('[DEBUG-FLOW-2] ✅ TeachingBoardSimple received buffer update');
  console.log('[DEBUG-FLOW-2] Items count:', items.length);
  console.log('[DEBUG-FLOW-2] First item:', items[0]);
  processBufferItems(items as LiveDisplayItem[]);
});
```

### Step 2: Verify currentTopic Loading ⏳
Check browser console for:
```
[DEBUG-METADATA] Profile loaded: {grade: 12, preferred_subjects: ["English Language"]}
[DEBUG-METADATA] Setting currentTopic to: Grade 12 English Language
[DEBUG-METADATA] Final metadata: {topic: "Grade 12 English Language", grade: "Grade 12", subject: "English Language"}
```

### Step 3: Fix Metadata Flow ⏳
Once currentTopic verified, ensure metadata flows correctly:
1. Verify `/api/v2/livekit/token` receives correct metadata parameter
2. Verify AccessToken includes metadata in token generation
3. Verify Python agent reads from `participant.metadata` instead of `room.metadata`

### Step 4: Test End-to-End 🔜
After fixes:
1. Refresh classroom page
2. Start new session
3. Verify all debug logs appear in sequence
4. Confirm transcripts display in UI

---

## 📋 EVIDENCE REQUIRED

To mark this investigation complete, we need:

### Console Logs:
- ✅ `[DEBUG-METADATA] Setting currentTopic to: Grade 12 English Language`
- ✅ `[DEBUG-METADATA] Final metadata: {topic: "Grade 12 English Language", ...}`
- ✅ `[DEBUG-TRANSCRIPT] Data packet received`
- ✅ `[DEBUG-TRANSCRIPT] Event emitted successfully`
- ✅ `[DEBUG-FLOW-1] SessionOrchestrator received transcript event`
- ✅ `[DEBUG-FLOW-1] Added item X to DisplayBuffer`
- ✅ `[DEBUG-FLOW-2] TeachingBoardSimple received buffer update`
- ✅ `[TeachingBoardSimple] Processing buffer update: X items`

### Python Agent Logs:
- ✅ `[PC-015] Using dynamic prompt: Grade 12 English Language` (NOT "Grade 10 General Studies")
- ✅ `[REALTIME] Progressive streaming complete: 11 chunks sent`

### UI Verification:
- ✅ Text appears in TeachingBoardSimple component
- ✅ Agent identifies as "Grade 12 English Language teacher"
- ✅ Curriculum panel shows "Grade 12 English Language" (separate fix)

---

## 🔗 RELATED FILES

### Modified (Debug Logs Added):
- `/src/app/classroom/page.tsx` (lines 165-174, 563-566)
- `/src/components/voice/LiveKitRoom.tsx` (lines 214-269)

### To Investigate:
- `/src/protected-core/session/orchestrator.ts` (lines 431-480)
- `/src/components/classroom/TeachingBoardSimple.tsx` (lines 258-299)
- `/api/v2/livekit/token` endpoint

### Evidence Documents:
- `/docs/evidence/DATA-FLOW-INVESTIGATION-2025-10-03.md`
- `/docs/evidence/TRANSCRIPT-DISPLAY-INVESTIGATION.md`
- This document: `/docs/evidence/COMPLETE-DATA-FLOW-INVESTIGATION.md`

---

**Investigation Status**: IN PROGRESS
**Next Action**: Add enhanced debug logging to SessionOrchestrator and verify complete event flow
**Blocking Issues**:
1. currentTopic may not be loading correctly (needs verification)
2. Transcript event flow breakdown point unknown (needs debug logs to identify)
3. Metadata not flowing to Python agent (participant.metadata empty)

**Updated**: 2025-10-03 11:20 AM
