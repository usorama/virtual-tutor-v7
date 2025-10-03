# CRITICAL BUG: Event Bus Instance Mismatch
**Date**: 2025-10-03
**Severity**: P0 - BLOCKING
**Status**: FIX REQUIRES PROTECTED-CORE MODIFICATION

## 🐛 BUG SUMMARY

**Transcripts are not displaying in UI** because the SessionOrchestrator event listener is attached to a DIFFERENT event bus instance than the one LiveKitRoom is emitting to.

---

## 📊 EVIDENCE FROM CONSOLE LOGS

### ✅ LiveKitRoom IS Working Correctly

```javascript
// LiveKitRoom successfully receives 12 transcript chunks
LiveKitRoom.tsx:215 [DEBUG-TRANSCRIPT] Data packet received, size: 200 bytes
LiveKitRoom.tsx:220 [DEBUG-TRANSCRIPT] Decoded data: {"type": "transcript", "speaker": "teacher", "segments": [{"type": "text", "content": "Hello!", ...}]}
LiveKitRoom.tsx:226 [DEBUG-TRANSCRIPT] ✅ Transcript type confirmed
LiveKitRoom.tsx:229 [LiveKitRoom] Transcript received, emitting to SessionOrchestrator
LiveKitRoom.tsx:259 [DEBUG-TRANSCRIPT] Emitting to event bus: {"segments":[{"type":"text","content":"Hello!",...}],...}
LiveKitRoom.tsx:261 [DEBUG-TRANSCRIPT] Event emitted successfully ✅
```

**All 12 chunks received and emitted**: ✅
1. "Hello!"
2. "I'm excited to"
3. "be your AI"
4. "**English Language teacher**" ← CORRECT METADATA!
5. "today."
6. "I'm here to"
7. "help you with"
8. "all your Grade"
9. "**12 English Language**" ← CORRECT!
10. "questions."
11. "Are you ready"
12. "to get started?"

### ❌ SessionOrchestrator Listener NEVER Triggered

```javascript
// Listener attached successfully
orchestrator.ts:432 [FS-00-AB-1] Setting up LiveKit data channel listener
orchestrator.ts:476 [FS-00-AB-1] LiveKit data channel listener attached ✅

// But NEVER triggered - this log NEVER appears:
// [FS-00-AB-1] Received transcript from LiveKit data channel ❌
```

### ❌ TeachingBoardSimple Never Receives Updates

```javascript
// Component initializes successfully
TeachingBoardSimple.tsx:265 [TeachingBoardSimple] Initializing display buffer subscription
TeachingBoardSimple.tsx:275 [TeachingBoardSimple] Initial items: 1
TeachingBoardSimple.tsx:293 [TeachingBoardSimple] Successfully subscribed to display buffer

// But NEVER receives buffer updates - this log NEVER appears:
// [TeachingBoardSimple] Buffer update received: X items ❌
```

---

## 🔍 ROOT CAUSE ANALYSIS

### The Problem: Different Event Bus Instances

**File**: `/src/protected-core/session/orchestrator.ts:435`

```typescript
// ❌ PROBLEM: Dynamic import creates NEW instance
import('@/components/voice/LiveKitRoom').then(({ liveKitEventBus }) => {
  liveKitEventBus.on('livekit:transcript', this.liveKitDataListener);
  // This is a DIFFERENT instance than the one in LiveKitRoom!
});
```

**File**: `/src/components/voice/LiveKitRoom.tsx`

```typescript
// ✅ Static import uses ORIGINAL instance
import { liveKitEventBus } from '@/components/voice/LiveKitRoom';

// Emits to the ORIGINAL instance
liveKitEventBus.emit('livekit:transcript', eventData);
```

### Why This Happens

1. **LiveKitRoom** has a static export: `export const liveKitEventBus = new EventEmitter()`
2. **SessionOrchestrator** uses `import('@/components/voice/LiveKitRoom')` (dynamic)
3. Dynamic imports can create **separate module instances** in some bundler configurations
4. Result: Two separate EventEmitter instances exist
5. LiveKitRoom emits to Instance A
6. SessionOrchestrator listens to Instance B
7. Event never received

---

## ✅ THE FIX

### Option 1: Change Protected-Core to Use Static Import (BLOCKED)

**File**: `/src/protected-core/session/orchestrator.ts`

```typescript
// ❌ CANNOT DO THIS - Protected-core modification forbidden
import { liveKitEventBus } from '@/components/voice/LiveKitRoom';

private setupLiveKitDataChannelListener(): void {
  // Use the SAME instance
  liveKitEventBus.on('livekit:transcript', this.liveKitDataListener);
}
```

**Status**: BLOCKED - Cannot modify protected-core per CLAUDE.md

### Option 2: Create Event Bus Bridge (ALLOWED)

Create a bridge service in `/src/features/` that connects the event buses:

**File**: `/src/features/transcript-bridge/EventBusBridge.ts`

```typescript
import { liveKitEventBus } from '@/components/voice/LiveKitRoom';
import { SessionOrchestrator } from '@/protected-core';

export class EventBusBridge {
  private static instance: EventBusBridge;

  static initialize() {
    if (!this.instance) {
      this.instance = new EventBusBridge();
      this.instance.setupBridge();
    }
  }

  private setupBridge() {
    // Listen on the CORRECT event bus
    liveKitEventBus.on('livekit:transcript', (data) => {
      console.log('[EventBusBridge] Received transcript, forwarding to orchestrator');

      // Add directly to display buffer
      const orchestrator = SessionOrchestrator.getInstance();
      data.segments?.forEach((segment: any) => {
        orchestrator.addTranscriptionItem({
          type: segment.type || 'text',
          content: segment.content,
          speaker: data.speaker || 'teacher',
          confidence: segment.confidence || 1.0
        });
      });
    });
  }
}
```

**Usage in classroom/page.tsx**:
```typescript
import { EventBusBridge } from '@/features/transcript-bridge/EventBusBridge';

useEffect(() => {
  EventBusBridge.initialize();
}, []);
```

### Option 3: Request Protected-Core Modification Approval

**Change Required**: `/src/protected-core/session/orchestrator.ts:435`

**From**:
```typescript
import('@/components/voice/LiveKitRoom').then(({ liveKitEventBus }) => {
```

**To**:
```typescript
import { liveKitEventBus } from '@/components/voice/LiveKitRoom';
// Then directly use liveKitEventBus.on(...) without dynamic import
```

**Justification**: This is a critical P0 bug blocking transcript display. The fix is minimal (2 lines) and doesn't change functionality, only fixes the event bus instance mismatch.

---

## 🎯 RECOMMENDED SOLUTION

**Immediate**: Implement Option 2 (Event Bus Bridge) ← NO PROTECTED-CORE MODIFICATION

**Long-term**: Request approval for Option 3 (Fix protected-core properly)

---

## 📋 VERIFICATION CHECKLIST

After implementing fix:
- [ ] Start new session
- [ ] Check console for `[EventBusBridge] Received transcript` logs
- [ ] Check console for `[TeachingBoardSimple] Buffer update received` logs
- [ ] Verify transcripts appear in UI
- [ ] Verify transcript chunks aggregate into paragraphs

---

## 🔗 RELATED ISSUES

1. ✅ **Metadata Flow** - FIXED (agent says "English Language teacher")
2. ❌ **Transcript Display** - THIS BUG (event bus mismatch)
3. ❌ **Curriculum Panel Wrong** - Separate issue (still shows "Grade 10 Mathematics")

---

**Investigation Complete**: 2025-10-03 11:50 AM
**Fix Status**: Awaiting implementation decision (Option 2 vs Option 3)
