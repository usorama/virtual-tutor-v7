# PingLearn Issue Tracker
**Created**: 2025-09-27
**Status**: CRITICAL ISSUES IDENTIFIED - NEEDS IMMEDIATE ATTENTION
**Last Updated**: 2025-10-03 - Post User Testing Analysis

---

## 🚨 CRITICAL ACTIVE ISSUES (5 of 7)

### Issue #007: Metadata Pipeline Broken - Grade/Subject Not Reaching Python Agent ⚠️ ACTIVE
**Severity**: P0 - CRITICAL
**Component**: Frontend → Python Agent metadata pipeline
**Feature**: PC-016 (Curriculum context)
**Status**: ⚠️ ACTIVE - Root cause identified
**Related Change Records**: PC-016, PC-015

**Problem**:
- Frontend curriculum panel shows correct data (Grade 12, English)
- Python agent receives NO metadata about grade/subject
- Agent cannot access curriculum-specific content
- Teacher defaults to generic responses without textbook context

**Evidence**:
```
User selected: Grade 12, English
Curriculum panel displays: "Grade 10 Mathematics" (incorrect data)
Agent response: "I don't have access to NCERT textbooks"
```

**Root Cause**:
1. Frontend event bus instance mismatch (PC-016 partial fix)
2. Metadata not being attached to session initialization
3. Python agent not receiving metadata in connection handshake

**Impact**:
- Teacher cannot provide grade-specific instruction
- Textbook content unavailable to AI tutor
- Personalized learning broken
- Core value proposition compromised

**Fix Required**:
1. Debug frontend event bus - ensure metadata events fire
2. Verify WebSocket handshake includes metadata payload
3. Add Python agent logging for received metadata
4. Test end-to-end metadata flow from selection → agent

---

### Issue #008: Show-Then-Tell Inverted - Text After Audio ⚠️ ACTIVE
**Severity**: P0 - CRITICAL
**Component**: Python LiveKit Agent + Frontend timing
**Feature**: FC-010 (400ms visual lead time)
**Status**: ⚠️ ACTIVE - Implementation backwards
**Related Change Records**: PC-015

**Problem**:
- Designed behavior: Text appears 400ms BEFORE audio speaks it
- Actual behavior: Text appears AFTER audio starts playing
- Complete inversion of "SHOW-then-TELL" concept

**Evidence**:
```
User report: "I'm actually seeing this kind of opposite effect"
Expected: Visual → [400ms gap] → Audio
Actual: Audio → Visual (or simultaneous)
```

**Current Implementation** (PC-015):
- Server sends transcripts immediately when audio is generated
- Relies on natural audio streaming latency for gap
- No explicit timing control implemented

**Root Cause**:
1. Audio streaming latency is NOT consistent 400ms
2. No frontend buffer/delay to ensure visual lead
3. Transcript events may arrive AFTER audio track data
4. WebSocket event ordering not guaranteed

**Fix Required**:
1. Add frontend buffer: Display transcript immediately on receive
2. Delay audio track attachment by 400ms after transcript display
3. Add visual indicator for "pre-spoken" text (dim/fade-in)
4. Implement performance monitoring for timing verification

---

### Issue #009: Message Bubble Containers Obstructing View ⚠️ ACTIVE
**Severity**: P1 - HIGH
**Component**: `TeachingBoardSimple.tsx` rendering
**Feature**: Visual display
**Status**: ⚠️ ACTIVE - Partial fix incomplete
**Related Change Records**: PC-015

**Problem**:
- Large white/light rectangular boxes rendering around messages
- Containers obscure content and create visual clutter
- White bar fade-in animation removed but containers remain

**Evidence**:
```
User report: "Still seeing these big rectangle boxes"
PC-015 fix: Removed fade-in animation only
Container structure: Still rendering background boxes
```

**Current State**:
- Animation removed (PC-015)
- Container elements still present in DOM
- Background colors/borders causing white rectangles

**Root Cause**:
1. Message bubble wrapper divs have background styling
2. Container hierarchy creating nested boxes
3. CSS classes applying unwanted backgrounds
4. Layout structure needs simplification

**Fix Required**:
1. Remove container background colors entirely
2. Simplify message bubble structure (remove nested divs)
3. Apply transparent backgrounds to all wrapper elements
4. Test with multiple message types (text, math, code)

---

### Issue #010: Textbook Content Inaccessible to Agent ⚠️ ACTIVE
**Severity**: P0 - CRITICAL
**Component**: Python Agent RAG pipeline
**Feature**: Curriculum-specific instruction
**Status**: ⚠️ ACTIVE - Agent cannot retrieve textbook data
**Related Change Records**: PC-016

**Problem**:
- Database contains NCERT textbook content
- Agent responds: "I don't have access to NCERT textbooks"
- RAG pipeline not retrieving curriculum content
- Generic responses instead of textbook-based teaching

**Evidence**:
```
Agent message: "While I don't have access to NCERT textbooks..."
Database tables: textbooks, curriculum_data (populated)
```

**Root Cause**:
1. Agent missing curriculum context (see Issue #007)
2. RAG retrieval not configured for textbook tables
3. Embeddings may not be generated for textbook content
4. Agent prompt not instructing textbook usage

**Dependencies**:
- Requires Issue #007 fix (metadata pipeline)
- Requires RAG pipeline configuration
- May need embedding generation for textbooks

**Fix Required**:
1. Verify textbook embeddings exist in database
2. Configure agent RAG to query textbook tables
3. Add curriculum context to agent system prompt
4. Test with specific textbook questions

---

### Issue #011: Curriculum Panel Wrong Data Display ⚠️ ACTIVE
**Severity**: P2 - MEDIUM
**Component**: Curriculum panel UI component
**Feature**: Context display
**Status**: ⚠️ ACTIVE - Displaying incorrect cached data
**Related Change Records**: PC-016

**Problem**:
- User selects: Grade 12, English
- Panel displays: "Grade 10 Mathematics"
- Stale data or incorrect state management

**Evidence**:
```
User selection: { grade: 12, subject: "English" }
Panel renders: "Grade 10 Mathematics"
```

**Root Cause**:
1. State not updating after user selection
2. Default/initial data not being overridden
3. Event bus not triggering panel re-render
4. Cached curriculum data from previous session

**Impact**:
- User confusion (displays wrong information)
- Debugging difficulty (misleading visual state)
- Trust erosion (UI not reflecting selections)

**Fix Required**:
1. Debug state management in curriculum panel
2. Ensure event bus triggers re-render on metadata change
3. Add visual loading state during data fetch
4. Clear stale data on new session start

---

## ✅ RESOLVED ISSUES (2 of 7)

### Issue #001: Multi-Second Response Latency ✅ FIXED
**Severity**: CRITICAL
**Component**: Python LiveKit Agent / Communication Pipeline
**Status**: ✅ FIXED via FS-00-AB-1
**Evidence**: User confirms "One thing that's definitely fixed is the speed of response"
**Solution**: Proper event handling through SessionOrchestrator eliminated duplicate processing

### Issue #004: Text Overflow Container ✅ FIXED
**Severity**: MEDIUM
**Component**: `TeachingBoardSimple.tsx` - CSS/Layout
**Status**: ✅ FIXED
**Solution**: Added proper CSS overflow handling and word-break properties

---

## ⚠️ PARTIALLY RESOLVED (3 of 7)

### Issue #002: Event Bus Instance Mismatch ⚠️ PARTIAL FIX
**Severity**: P0 - CRITICAL
**Component**: EventBus singleton management
**Status**: ⚠️ INFRASTRUCTURE FIXED, UX BROKEN
**Related Change Records**: PC-016

**What's Fixed**:
- EventBus singleton working correctly
- No console errors for duplicate instances
- Infrastructure technically sound

**What's Broken** (see Issue #007):
- Metadata not flowing to Python agent
- Event firing but not reaching destination
- User experience completely broken despite infrastructure fix

**Conclusion**: Technical fix successful, but feature still non-functional

---

### Issue #005: White Bar Flash ⚠️ PARTIAL FIX
**Severity**: P2 - MEDIUM
**Component**: `TeachingBoardSimple.tsx` rendering
**Status**: ⚠️ ANIMATION REMOVED, CONTAINERS REMAIN
**Related Change Records**: PC-015

**What's Fixed**:
- Fade-in animation removed
- Initial flash on page load reduced

**What's Broken** (see Issue #009):
- Large white/light rectangle containers still rendering
- Message bubbles have background boxes
- Visual obstruction persists

**Conclusion**: Partial improvement, but core visual issue unresolved

---

### Issue #003: Math Rendering ⚠️ ATTEMPTED
**Severity**: HIGH
**Component**: `TeachingBoardSimple.tsx` - Math detection
**Status**: ⚠️ FIX ATTEMPTED - Still not working
**Evidence**: Math still showing as plain text
**Fix Applied**: Enhanced math detection patterns, added keyword detection
**Needs**: Further investigation of KaTeX integration

---

## 📊 ISSUE ANALYSIS

### Critical Path Issues (Blocking Core Functionality):
1. **Issue #007**: Metadata pipeline broken → Agent has no context
2. **Issue #008**: Show-Then-Tell inverted → Core UX broken
3. **Issue #010**: Textbooks inaccessible → No curriculum content

### High Priority Issues (Degraded UX):
4. **Issue #009**: Message containers obstructing view
5. **Issue #011**: Wrong curriculum data displayed

### Lower Priority (Polish/Enhancement):
6. **Issue #003**: Math rendering not working

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Debug & Diagnose (Today)
**Priority**: Understand WHY metadata isn't flowing

**Actions**:
1. Add extensive logging to frontend metadata selection
2. Add Python agent logging for metadata reception
3. Monitor WebSocket handshake payload
4. Create diagnostic dashboard for metadata flow

**Tools**:
- Browser DevTools → Network → WS tab
- Python agent console logs
- Frontend console logs
- Supabase database inspection

---

### Phase 2: Fix Critical Path (Next)
**Priority**: Restore core functionality

**Fix Order**:
1. **Issue #007** (Metadata pipeline) - BLOCKING everything
2. **Issue #010** (Textbook access) - Depends on #007
3. **Issue #008** (Show-Then-Tell timing) - Core UX
4. **Issue #009** (Message containers) - Visual quality
5. **Issue #011** (Curriculum panel) - User trust

---

### Phase 3: Verification (After Fixes)
**Priority**: Ensure fixes work end-to-end

**Test Cases**:
1. Select Grade 12 English → Agent receives correct metadata
2. Agent can query NCERT Grade 12 English textbook
3. Text appears 400ms before audio speaks it
4. No white rectangles around messages
5. Curriculum panel shows selected grade/subject

---

## 🔧 DEBUGGING COMMANDS

### Frontend Metadata Flow
```javascript
// Browser console
localStorage.setItem('debug:eventBus', 'true');
localStorage.setItem('debug:metadata', 'true');

// Watch for events
window.addEventListener('curriculum:selected', (e) => {
  console.log('Curriculum event:', e.detail);
});
```

### Python Agent Metadata Reception
```python
# Add to agent.py
@livekit.room.on("participant_connected")
async def on_participant_connected(participant):
    metadata = participant.metadata
    logger.info(f"Participant metadata: {metadata}")
```

### WebSocket Inspection
```bash
# Browser DevTools → Network → WS
# Filter: curriculum, metadata, grade, subject
# Check: Connection handshake payload
```

---

## 📝 CHANGE RECORD REFERENCES

### PC-016: EventBus Metadata Flow Fix
- **Status**: Infrastructure complete, UX broken
- **Location**: `/docs/change_records/protected_core_changes/PC-014-stories/PC-016-CHANGE-RECORD.md`
- **Related Issues**: #007, #011

### PC-015: Show-Then-Tell Implementation
- **Status**: Implemented backwards (needs reversal)
- **Location**: `/docs/change_records/protected_core_changes/PC-014-stories/PC-015-CHANGE-RECORD.md`
- **Related Issues**: #008, #009

---

## 📈 PRIORITY MATRIX

| ID | Issue | Severity | Status | Impact | Dependencies |
|----|-------|----------|--------|--------|--------------|
| #007 | Metadata pipeline | P0 | ACTIVE | CRITICAL | None (blocking) |
| #008 | Show-Then-Tell inverted | P0 | ACTIVE | CRITICAL | None |
| #010 | Textbooks inaccessible | P0 | ACTIVE | CRITICAL | #007 |
| #009 | Message containers | P1 | ACTIVE | HIGH | None |
| #011 | Wrong curriculum data | P2 | ACTIVE | MEDIUM | #007 |
| #003 | Math rendering | P2 | ATTEMPTED | MEDIUM | None |
| #002 | Event bus mismatch | -- | PARTIAL | Infrastructure OK | -- |
| #005 | White bar flash | -- | PARTIAL | Animation OK | -- |
| #001 | Response latency | ✅ | RESOLVED | -- | -- |
| #004 | Text overflow | ✅ | RESOLVED | -- | -- |

---

## 📊 FINAL STATUS SUMMARY

**Total Issues Identified**: 11
**Active/Unresolved**: 5 (P0: 3, P1: 1, P2: 2)
**Partially Resolved**: 3 (infrastructure fixed, UX broken)
**Fully Resolved**: 2

**Critical Blockers**: 3 issues preventing core functionality
**User Impact**: High - Core features non-functional despite technical fixes

**Next Step**: Deep debugging of metadata pipeline (Issue #007)

---

**Last Updated**: 2025-10-03
**Updated By**: Claude (Business Analyst role)
**Session**: User testing feedback analysis
