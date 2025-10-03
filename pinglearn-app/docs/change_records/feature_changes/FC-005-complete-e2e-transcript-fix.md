# FC-005: Complete E2E Transcript Flow Fix

**Type**: Feature Change
**Status**: Ready for Implementation
**Priority**: P0 - Critical
**Classification**: Feature-level changes only, NO Protected Core modifications
**Created**: 2025-09-26
**Target**: Phase 3 UAT Stabilization

---

## Executive Summary

This change record addresses three critical issues in the transcript and voice flow that prevent proper end-to-end functionality:

1. ✅ **Metadata Pipeline** - Already implemented but needs verification
2. ❌ **Show-Then-Tell Timing** - Not implemented (only commented about)
3. ❌ **Message Bubble Removal** - Still rendering in TeachingBoard

**CRITICAL FINDING**: All three issues are **FEATURE-LEVEL ONLY** and do NOT require Protected Core modifications. The Protected Core is functioning correctly and provides the necessary APIs.

---

## Issue Analysis

### Issue 1: Metadata Pipeline (Status: ✅ IMPLEMENTED)

#### Current Implementation
```typescript
// Frontend: /src/app/classroom/page.tsx (lines 557-574)
const metadata = {
  topic: currentTopic,
  grade: extractGrade(currentTopic),
  subject: extractSubject(currentTopic)
};

// LiveKitRoom: /src/components/voice/LiveKitRoom.tsx (line 84)
body: JSON.stringify({
  roomName,
  participantId,
  participantName,
  metadata // ✅ PASSED
})

// API: /src/app/api/v2/livekit/token/route.ts (line 35)
metadata: metadata ? JSON.stringify(metadata) : undefined, // ✅ EMBEDDED

// Result: Metadata flows correctly to Python agent via LiveKit token
```

#### Verification Needed
- [ ] Confirm Python agent receives metadata in token
- [ ] Verify dynamic prompt generation uses metadata
- [ ] Test with different topics (Grade 9, Grade 10, different subjects)

#### Files Involved (Feature Layer)
- `/src/app/classroom/page.tsx` - Metadata extraction
- `/src/components/voice/LiveKitRoom.tsx` - Metadata transmission
- `/src/app/api/v2/livekit/token/route.ts` - Token embedding

---

### Issue 2: Show-Then-Tell Timing (Status: ❌ NOT IMPLEMENTED)

#### The Problem
Multiple code comments claim server-side handling, but **actual implementation is missing**:

```typescript
// LiveKitRoom.tsx line 42-44
// FC-010: Show-Then-Tell is now handled server-side
// The Python agent sends transcripts 400ms before audio
// No client-side delay needed  // ❌ FALSE - Not implemented

// LiveKitRoom.tsx line 128-132
// FC-010: Attach audio immediately
// The server-side transcript advance creates the Show-Then-Tell effect
// Transcripts are sent 400ms before audio from the Python agent  // ❌ FALSE

// TeachingBoardSimple.tsx line 282-284
// SHOW-THEN-TELL: Visual content appears IMMEDIATELY
// Audio will be delayed by 400ms in LiveKitRoom  // ❌ FALSE - No delay exists
```

#### The Reality
- **Frontend**: Displays transcripts immediately (correct)
- **Audio**: Plays immediately (WRONG - needs 400ms delay)
- **Python Agent**: Does NOT send transcripts early (not implemented)

#### Correct Implementation Strategy
**Option A: Client-Side Audio Delay (Recommended)**
```typescript
// LiveKitRoom.tsx - handleTrackSubscribed
const handleTrackSubscribed = (track: RemoteTrack, publication: RemoteTrackPublication) => {
  if (track.kind === 'audio' && audioElementRef.current) {
    // 🎯 SHOW-THEN-TELL: Delay audio by 400ms
    const SHOW_THEN_TELL_DELAY = 400; // milliseconds

    // Attach track but mute initially
    track.attach(audioElementRef.current);
    audioElementRef.current.volume = 0;

    // Unmute after delay
    setTimeout(() => {
      if (audioElementRef.current) {
        audioElementRef.current.volume = audioControls.teacherVolume / 100;
        console.log('[SHOW-THEN-TELL] Audio unmuted after 400ms visual lead');
      }
    }, SHOW_THEN_TELL_DELAY);

    // Record timing metrics (existing code)
    performanceMonitor.addMetric({ ... });
  }
};
```

**Option B: Server-Side Transcript Advance (Complex)**
- Requires Python agent modification
- Transcript buffering and timing coordination
- More complex, not recommended for Phase 3

#### Decision: Use Option A (Client-Side Audio Delay)
**Rationale**:
- ✅ No Python agent changes needed
- ✅ Simpler implementation
- ✅ Easier to verify and test
- ✅ Feature-level change only
- ✅ Maintains Protected Core integrity

#### Files to Modify (Feature Layer)
- `/src/components/voice/LiveKitRoom.tsx` - Add audio delay logic

---

### Issue 3: Message Bubbles Still Rendering (Status: ❌ IMPLEMENTED INCORRECTLY)

#### The Problem
TeachingBoardSimple should display content directly on the board like a classroom whiteboard, NOT as chat bubbles.

**Current Behavior**: TeachingBoardSimple uses DisplayBuffer correctly BUT MessageBubble component still exists and could be imported/used

**Desired Behavior**: Clean whiteboard display (already implemented in TeachingBoardSimple)

#### Current Implementation (Correct)
```typescript
// TeachingBoardSimple.tsx - Already renders directly
const renderContent = (item: TeachingContent) => {
  switch (item.type) {
    case 'text':
      return <p className="text-base leading-relaxed mb-3">{item.content}</p>;

    case 'math':
      return <div className="my-4 py-4 px-6"><MathRenderer /></div>;

    case 'step':
      return <div className="flex items-start"><p>{item.content}</p></div>;
  }
};
```

#### What Needs to Happen
1. **Verify no imports** of MessageBubble in TeachingBoardSimple ✅
2. **Document removal** of MessageBubble from active UI flow ✅
3. **Consider deprecation** of MessageBubble.tsx (optional)

#### Analysis Result
**NO CODE CHANGES NEEDED** - TeachingBoardSimple already implements correct behavior.

MessageBubble.tsx exists but is NOT used in the classroom flow. It may be used elsewhere (chat features?) so **should NOT be deleted**.

#### Files Verified (Feature Layer)
- `/src/components/classroom/TeachingBoardSimple.tsx` ✅ No MessageBubble usage
- `/src/components/classroom/MessageBubble.tsx` ℹ️ Exists but unused in main flow

---

## Protected Core Analysis

### Protected Core Files Reviewed
```
✅ /src/protected-core/voice-engine/livekit/service.ts
   - No metadata dependencies
   - No show-then-tell timing logic
   - Provides VoiceServiceContract API only

✅ /src/protected-core/transcription/display/formatter.ts
   - Formats transcripts for display
   - No timing logic
   - Pure data transformation

✅ /src/protected-core/transcription/gemini-connector.ts
   - Handles Gemini API connection
   - No metadata processing
   - No timing coordination

✅ /src/protected-core/contracts/transcription.contract.ts
   - Defines DisplayItem interface
   - No implementation logic
   - Contract only
```

### Verdict: NO PROTECTED CORE MODIFICATIONS NEEDED ✅

All issues are in the **Feature Layer**:
- Metadata: Feature-level API coordination
- Timing: Feature-level audio control
- Bubbles: Feature-level UI component selection

**This is a safe FC change, not a PC change.**

---

## Implementation Plan

### Phase 1: Metadata Verification (1 hour)
```bash
# 1. Start Python LiveKit agent
cd livekit-agent
source venv/bin/activate
python agent.py

# 2. Start Next.js frontend
cd pinglearn-app
npm run dev

# 3. Test metadata flow
# - Login as test user
# - Start classroom session
# - Verify console logs show metadata in token
# - Check Python agent logs for metadata receipt
```

**Success Criteria**:
- [ ] Metadata appears in LiveKit token (check Network tab)
- [ ] Python agent logs show received metadata
- [ ] Dynamic prompts use grade/subject info

### Phase 2: Show-Then-Tell Implementation (2 hours)
```typescript
// File: /src/components/voice/LiveKitRoom.tsx

// Add state for audio control
const [audioDelayActive, setAudioDelayActive] = useState(false);
const audioDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

// Modify handleTrackSubscribed (around line 118)
const handleTrackSubscribed = (
  track: RemoteTrack,
  publication: RemoteTrackPublication
) => {
  if (track.kind === 'audio' && audioElementRef.current) {
    const SHOW_THEN_TELL_DELAY = 400; // milliseconds

    console.log('[SHOW-THEN-TELL] Audio track received, applying 400ms delay');

    // Attach track immediately but mute
    track.attach(audioElementRef.current);
    const audioElement = audioElementRef.current;
    const originalVolume = audioElement.volume;
    audioElement.volume = 0; // Mute initially

    // Record metrics
    const audioTimestamp = performance.now();
    performanceMonitor.addMetric({
      name: 'show-then-tell-audio-attachment',
      value: audioTimestamp,
      unit: 'ms',
      timestamp: Date.now(),
      category: 'user-interaction'
    });

    // Unmute after delay
    setAudioDelayActive(true);
    audioDelayTimerRef.current = setTimeout(() => {
      if (audioElement) {
        audioElement.volume = originalVolume;
        setAudioDelayActive(false);
        console.log('[SHOW-THEN-TELL] Audio unmuted - 400ms visual lead complete');

        // Record unmute timing
        performanceMonitor.addMetric({
          name: 'show-then-tell-audio-unmuted',
          value: performance.now(),
          unit: 'ms',
          timestamp: Date.now(),
          category: 'user-interaction'
        });
      }
    }, SHOW_THEN_TELL_DELAY);

    // Existing audio playback listener (keep for metrics)
    audioElement.addEventListener('playing', handleAudioStart);
  }
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (audioDelayTimerRef.current) {
      clearTimeout(audioDelayTimerRef.current);
    }
  };
}, []);
```

**Testing**:
```bash
# 1. Enable show-then-tell timing feature flag
# File: /src/config/features.ts
export const FEATURES = {
  showThenTellTiming: true, // Already enabled
};

# 2. Start session and observe
# - Text should appear first
# - Audio should play 400ms later
# - Console logs should confirm timing

# 3. Verify performance metrics
# - Check ShowThenTellTimingDashboard component
# - Lead time should be ~400ms (±50ms acceptable)
```

**Success Criteria**:
- [ ] Visual transcripts appear immediately
- [ ] Audio plays 400ms after text display
- [ ] Performance dashboard shows 300-500ms lead time
- [ ] Console logs confirm timing sequence
- [ ] No audio glitches or stuttering

### Phase 3: Message Bubble Verification (30 minutes)
```bash
# 1. Code search
grep -r "MessageBubble" /src/app/classroom
grep -r "MessageBubble" /src/components/classroom
grep -r "MessageBubble" /src/features

# 2. Verify TeachingBoardSimple
# - Check no MessageBubble imports
# - Verify direct content rendering
# - Test classroom session

# 3. Document findings
# - If MessageBubble unused: Mark as deprecated
# - If used elsewhere: Document separation of concerns
```

**Success Criteria**:
- [ ] TeachingBoardSimple has no MessageBubble imports ✅
- [ ] Classroom renders content directly ✅
- [ ] Documentation updated ✅

---

## E2E Verification Checklist

### Test Scenario 1: Metadata Flow
- [ ] Login as test user
- [ ] Select topic: "Grade 10 Algebra"
- [ ] Start classroom session
- [ ] **Verify**: Network tab shows metadata in token request
- [ ] **Verify**: Python agent logs show metadata receipt
- [ ] **Verify**: AI teacher references grade/subject appropriately
- [ ] **Result**: PASS / FAIL

### Test Scenario 2: Show-Then-Tell Timing
- [ ] Start classroom session
- [ ] AI teacher speaks
- [ ] **Verify**: Text appears on board first
- [ ] **Verify**: Audio plays ~400ms later
- [ ] **Verify**: Performance dashboard shows 300-500ms lead time
- [ ] **Verify**: No audio glitches
- [ ] **Verify**: Smooth visual-audio coordination
- [ ] **Result**: PASS / FAIL

### Test Scenario 3: Transcript Display
- [ ] Start classroom session
- [ ] AI teacher speaks multiple sentences
- [ ] **Verify**: Content displays directly on TeachingBoard
- [ ] **Verify**: No chat bubbles appear
- [ ] **Verify**: Math equations render correctly
- [ ] **Verify**: Text formatting is clean
- [ ] **Verify**: Auto-scroll works
- [ ] **Result**: PASS / FAIL

### Test Scenario 4: Complete Session Flow
- [ ] Start session
- [ ] Ask AI teacher a question
- [ ] Receive response
- [ ] **Verify**: Metadata correct throughout
- [ ] **Verify**: Show-then-tell timing consistent
- [ ] **Verify**: Transcript display clean
- [ ] Pause session
- [ ] Resume session
- [ ] **Verify**: All functionality persists
- [ ] End session
- [ ] **Verify**: Session ends cleanly
- [ ] **Result**: PASS / FAIL

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)
```bash
# If any issue occurs during implementation
git reset --hard HEAD~1
git push origin phase-3-stabilization-uat --force

# Restart services
cd pinglearn-app && npm run dev
cd livekit-agent && python agent.py
```

### Selective Rollback

**If Metadata Issue**:
```bash
# Revert token API changes
git checkout HEAD -- src/app/api/v2/livekit/token/route.ts
```

**If Show-Then-Tell Issue**:
```bash
# Revert LiveKitRoom changes
git checkout HEAD -- src/components/voice/LiveKitRoom.tsx

# Disable feature flag
# File: /src/config/features.ts
export const FEATURES = {
  showThenTellTiming: false, // Disable
};
```

**If Display Issue**:
```bash
# Revert TeachingBoardSimple changes (if any)
git checkout HEAD -- src/components/classroom/TeachingBoardSimple.tsx
```

### Rollback Verification
```bash
# After any rollback
npm run typecheck  # Must show 0 errors
npm run lint       # Must pass
npm run build      # Must succeed
npm test           # Must pass

# Manual test
# - Start classroom session
# - Verify basic functionality works
# - Confirm no console errors
```

---

## Files Modified (All Feature Layer)

### Primary Changes
- `/src/components/voice/LiveKitRoom.tsx`
  - Add audio delay logic for show-then-tell
  - Add state management for delay control
  - Add cleanup logic for timers

### Verification Only (No Changes)
- `/src/app/classroom/page.tsx` ✅ Metadata already implemented
- `/src/app/api/v2/livekit/token/route.ts` ✅ Metadata already implemented
- `/src/components/classroom/TeachingBoardSimple.tsx` ✅ Already correct
- `/src/components/classroom/MessageBubble.tsx` ℹ️ Unused but preserved

### Protected Core (NO CHANGES) ✅
- ALL files in `/src/protected-core/` remain UNTOUCHED

---

## Risk Assessment

### Low Risk ✅
- Metadata verification (read-only analysis)
- Message bubble verification (no code changes)

### Medium Risk ⚠️
- Show-then-tell audio delay implementation
  - **Mitigation**: Feature flag control
  - **Mitigation**: Easy rollback with git reset
  - **Mitigation**: Isolated to one file (LiveKitRoom.tsx)

### High Risk ❌
- **NONE** - No Protected Core modifications required

### Overall Risk Level: **LOW-MEDIUM**
This is a safe feature-level change with clear rollback paths.

---

## Success Metrics

### Functional Metrics
- [ ] Metadata flows correctly (100% success rate)
- [ ] Show-then-tell timing within 300-500ms (>95% of time)
- [ ] Transcript display clean and readable (100% sessions)
- [ ] No audio glitches or stuttering (<1% occurrence)

### Performance Metrics
- [ ] TypeScript: 0 errors (strict requirement)
- [ ] Build time: < 30 seconds (current baseline)
- [ ] Session start latency: < 3 seconds (current baseline)
- [ ] Transcript latency: < 300ms (current baseline)

### Quality Metrics
- [ ] Test coverage: >80% for modified code
- [ ] Code review: Approved by human
- [ ] E2E tests: All passing
- [ ] No regression bugs in other features

---

## Timeline

- **Metadata Verification**: 1 hour
- **Show-Then-Tell Implementation**: 2 hours
- **Message Bubble Verification**: 30 minutes
- **E2E Testing**: 2 hours
- **Documentation**: 1 hour
- **Buffer**: 1.5 hours

**Total Estimated Time**: 8 hours (1 working day)

---

## Approval & Sign-off

**Change Record Author**: Claude Code (Architect Agent)
**Review Required**: Human Approval
**Protected Core Impact**: NONE ✅
**Classification**: Feature Change (FC-005)
**Ready for Implementation**: YES

---

## Notes

### Why This is FC-005 (Not PC-XXX)

1. **Metadata**: LiveKit token feature, not core voice processing
2. **Timing**: Audio control in React component, not core transcription
3. **Display**: UI component selection, not core buffer management

### Key Insight

The Protected Core is **working correctly**. It provides:
- ✅ DisplayBuffer API for reactive updates
- ✅ VoiceServiceContract for voice management
- ✅ TranscriptionService for math rendering

This change is about **coordinating those APIs** at the feature level, not modifying the core itself.

### Confidence Level

**HIGH** - This is a well-understood, low-risk feature change with:
- Clear implementation path
- No Protected Core involvement
- Easy rollback strategy
- Comprehensive testing plan

---

**END OF CHANGE RECORD FC-005**
