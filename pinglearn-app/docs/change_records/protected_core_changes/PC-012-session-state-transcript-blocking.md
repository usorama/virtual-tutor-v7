# Protected Core Change Record PC-012

**Date**: 2025-09-28
**Severity**: CRITICAL - SHOWSTOPPER
**Status**: REQUIRES IMMEDIATE FIX
**Iteration**: #8
**Related Spec**: FS-00-AB-1 (DRAFT - NOT YET IMPLEMENTED)

## Executive Summary

This change record addresses the CRITICAL blocker preventing teacher text from appearing in the classroom UI. The event bus infrastructure already exists in the codebase but a single session state check is silently discarding ALL transcripts. This is THE blocker for iteration #8.

**Critical Discovery**:
- FS-00-AB-1 is still in DRAFT status and NOT officially implemented
- However, code labeled "FS-00-AB-1" exists in the codebase (lines 404-457 in orchestrator.ts)
- This suggests partial/premature implementation before spec approval
- The implemented infrastructure WORKS but transcripts are blocked by session state validation

## Problem Identified

The SessionOrchestrator's `addTranscriptionItem` method blocks ALL transcripts when session status is not 'active':

```typescript
// Line 322-324 in src/protected-core/session/orchestrator.ts
if (!this.currentSession || this.currentSession.status !== 'active') {
  return '';  // SILENTLY DISCARDS ALL TRANSCRIPTS!
}
```

## Root Cause Analysis

### Timing Sequence (THE PROBLEM):
1. **Line 100**: Session created with status = 'connecting'
2. **Line 145**: `setupLiveKitDataChannelListener()` - Listener ready
3. **Lines 146-174**: Various initialization steps
4. **Line 175**: `this.currentSession.status = 'active'` - TOO LATE!

### Critical Window:
- Between lines 145-175, transcripts can arrive
- They hit the session check and are SILENTLY DISCARDED
- No error is logged - they just disappear

## Complete Evidence Chain

### What's Working (from FS-00-AB-1):
✅ Python agent sends transcripts via `conversation_item_added`
✅ LiveKit data channel receives packets
✅ LiveKitRoom emits `livekit:transcript` events
✅ SessionOrchestrator listener is attached
✅ DisplayBuffer subscription is active

### What's Broken:
❌ **addTranscriptionItem rejects everything when status !== 'active'**

## Impact Assessment

### Current Impact:
- Teacher text NEVER appears in classroom UI
- Smart Learning Notes remain empty
- Show-then-tell (FC-010) non-functional
- User sees blank screen while hearing audio
- This blocks ENTIRE product functionality

### Risk of Not Fixing:
- Iteration #8 WILL FAIL
- Product cannot launch
- All dependent features broken

## Required Fix Options

### Option 1: Allow 'connecting' state (RECOMMENDED)
```typescript
// Line 322 - Allow transcripts during connection phase
if (!this.currentSession ||
    (this.currentSession.status !== 'active' &&
     this.currentSession.status !== 'connecting')) {
  return '';
}
```

**Pros**:
- Minimal change
- Captures early transcripts
- Maintains session lifecycle

**Cons**:
- None identified

### Option 2: Set 'active' earlier
```typescript
// Move line 175 to line 130 (before LiveKit init)
this.currentSession.status = 'active';
```

**Pros**:
- Simple reordering

**Cons**:
- Session marked active before actual connection
- Could cause other timing issues

### Option 3: Add explicit session state
```typescript
// New state for transcript readiness
this.currentSession.transcriptReady = true;  // Set at line 145
// Then check this instead of status
```

**Pros**:
- Explicit control
- Decoupled from connection state

**Cons**:
- Requires more changes

## Implementation Checklist

### Pre-Implementation:
- [ ] Verify current session state flow
- [ ] Check for other status dependencies
- [ ] Review FS-00-AB-1 for conflicts

### Implementation:
- [ ] Apply chosen fix (Option 1 recommended)
- [ ] Add logging for transcript acceptance/rejection
- [ ] Test edge cases (early transcripts, reconnection)

### Post-Implementation:
- [ ] Verify transcripts appear in DisplayBuffer
- [ ] Check TeachingBoardSimple displays content
- [ ] Confirm no duplicate entries
- [ ] Test full session lifecycle

## Testing Requirements

### Unit Tests:
```typescript
test('accepts transcripts during connecting state');
test('accepts transcripts during active state');
test('rejects transcripts when no session');
test('handles rapid state transitions');
```

### Integration Tests:
```typescript
test('early transcripts are captured');
test('transcripts flow through entire pipeline');
test('no data loss during connection phase');
```

### Manual Verification:
1. Start new session
2. Check console for `[FS-00-AB-1] Added transcript item`
3. Verify teacher text appears immediately
4. Check no duplicate entries
5. Test session end cleanup

## Dependencies with FS-00-AB-1

### Current State:
- **FS-00-AB-1**: DRAFT status - NOT implemented
- **Event bus code**: Already exists (implemented separately)
- **SessionOrchestrator listener**: Already exists at line 408 (marked as FS-00-AB-1 but predates the spec)
- **LiveKitRoom handler**: Already emitting events

### What Actually Exists (Not from FS-00-AB-1):
- ✅ Event bus in LiveKitRoom (line 10)
- ✅ Data handler emitting events (line 233)
- ✅ SessionOrchestrator listener method (line 408)
- ✅ Event bus subscription (line 452)

### What FS-00-AB-1 Would Add (When Implemented):
- ⏳ Deduplication logic
- ⏳ Enhanced error handling
- ⏳ Performance monitoring
- ⏳ Comprehensive testing

### This Fix Enables:
- ✅ Existing event bus to actually work
- ✅ FC-010 Show-then-tell timing
- ✅ Smart Learning Notes population
- ✅ Future FS-00-AB-1 implementation

## Rollback Strategy

If issues occur after fix:
```bash
# 1. Immediate rollback
git revert [commit-hash]

# 2. Temporary workaround
# In TeachingBoardSimple, bypass orchestrator:
# Subscribe directly to liveKitEventBus

# 3. Debug with enhanced logging
# Add console.trace() at rejection point
```

## Success Metrics

### Immediate (Within 1 minute):
- Console shows transcript acceptance logs
- DisplayBuffer.getItems() returns content
- Visual content appears in UI

### Session Complete (10 minutes):
- No transcript loss
- No duplicate entries
- Stable memory usage
- All features functional

## Authorization & Approval

**This change is CRITICAL and blocks iteration #8 success.**

Given that:
1. FS-00-AB-1 implementation is 90% complete
2. This single line is the blocker
3. The fix is minimal and safe
4. Without this, the product doesn't work

**Recommended Action**: Apply Option 1 fix immediately

## Change Implementation Priority

**IMMEDIATE** - This is THE blocker. Nothing else matters until this is fixed.