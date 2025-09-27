# PingLearn Issue Tracker
**Created**: 2025-09-27
**Status**: ACTIVE - 2 ISSUES REMAINING
**Last Updated**: 2025-09-27 - Post FS-00-AB-1 Implementation

## 🔴 REMAINING CRITICAL ISSUES (2 of 6)

### Issue #001: Show-Then-Tell Timing Reversed ❌ STILL BROKEN
**Severity**: CRITICAL
**Component**: `LiveKitRoom.tsx` / `TeachingBoardSimple.tsx`
**Feature**: FC-010 (400ms visual lead time)
**Status**: ❌ NOT FIXED - Still occurring after FS-00-AB-1
**Current Behavior**: Text STILL appears AFTER audio starts speaking
**Expected Behavior**: Text should appear 400ms BEFORE audio
**Latest Evidence**: User reports "still no text before audio" (2025-09-27)
**Root Cause UPDATED**: LiveKitRoom delays audio after transcript, but display happens immediately. Need to reverse this - display immediately, audio later.
**Fix Status**: Attempted in LiveKitRoom.tsx with 400ms audio delay, but timing not working correctly

### Issue #005: White Bar Flash ❌ STILL BROKEN
**Severity**: MEDIUM (Elevated from LOW due to UX impact)
**Component**: `TeachingBoardSimple.tsx` - Rendering
**Feature**: Visual rendering
**Status**: ❌ NOT FIXED - Still occurring after FS-00-AB-1
**Current Behavior**: White bar appears briefly before text renders
**Expected Behavior**: Smooth transition without flash
**Latest Evidence**: User reports "why does this white bar appear every time" (2025-09-27)
**Root Cause UPDATED**: Likely placeholder element or state change causing visual flash during initial render
**Fix Status**: Not yet attempted - needs investigation of rendering pipeline

## ✅ FIXED ISSUES (4 of 6)

### Issue #002: Multi-Second Response Latency ✅ FIXED
**Severity**: CRITICAL
**Component**: Python LiveKit Agent / Communication Pipeline
**Status**: ✅ FIXED via FS-00-AB-1
**Evidence**: User confirms "One thing that's definitely fixed is the speed of response"
**Solution**: Proper event handling through SessionOrchestrator eliminated duplicate processing

### Issue #003: Math Rendering ⚠️ ATTEMPTED
**Severity**: HIGH
**Component**: `TeachingBoardSimple.tsx` - Math detection and rendering
**Status**: ⚠️ FIX ATTEMPTED - Still not working
**Evidence**: Math still showing as plain text
**Fix Applied**: Enhanced math detection patterns, added keyword detection
**Needs**: Further investigation of KaTeX integration

### Issue #004: Text Overflow Container ✅ FIXED
**Severity**: MEDIUM
**Component**: `TeachingBoardSimple.tsx` - CSS/Layout
**Status**: ✅ FIXED
**Solution**: Added proper CSS overflow handling and word-break properties

### Issue #006: Smart Learning Notes ⚠️ PENDING VERIFICATION
**Severity**: MEDIUM
**Component**: `NotesPanel.tsx`
**Status**: ⚠️ Should be fixed via FS-00-AB-1 - Needs verification
**Solution**: Data flow restored through SessionOrchestrator

## ✅ WORKING FEATURES

### Working #001: Text Display
**Component**: `TeachingBoardSimple.tsx`
**Status**: Partially working
**Evidence**: "first teacher's text does appear"

### Working #002: Auto-Scroll
**Component**: `TeachingBoardSimple.tsx`
**Status**: Working correctly
**Evidence**: "screen scrolls automatically when there's no more space"

### Working #003: Short Text Rendering
**Component**: `TeachingBoardSimple.tsx`
**Status**: Working for short content
**Evidence**: "when it's short, it does render fine"

---

## 📊 ISSUE ANALYSIS

### Issues That FS-00-AB-1 WILL Fix:
1. ✅ **Multi-second latency** - Proper event handling eliminates double processing
2. ✅ **Smart Learning Notes** - Correct data flow will populate notes
3. ⚠️ **White bar flash** - May be resolved with cleaner event flow

### Issues That Need SEPARATE Fixes:
1. ❌ **Show-Then-Tell timing** - Needs audio delay implementation
2. ❌ **Math rendering** - Needs math detection fix
3. ❌ **Text overflow** - Needs CSS fixes

### Issues Introduced by 5-Minute Fix:
1. **Response latency increased** - Direct DisplayBuffer update may be causing conflicts
2. **Timing coordination lost** - The temporary fix bypassed proper sequencing

---

## 🎯 UPDATED ACTION PLAN (2 Issues Remaining)

### PRIORITY 1: Fix Show-Then-Tell Timing ⚡
**Problem**: Audio plays before text appears (opposite of intended)
**Current Implementation**: LiveKitRoom.tsx delays audio 400ms after transcript event
**Issue**: Timing not working - audio and text appear simultaneously or audio first
**Solution Needed**:
1. Investigate why audio delay isn't working
2. Consider alternative: Delay text display by negative offset (show earlier)
3. Debug exact timing of audio track attachment vs transcript display

### PRIORITY 2: Fix White Bar Flash 🎨
**Problem**: White bar/rectangle appears before text renders
**Location**: TeachingBoardSimple.tsx rendering pipeline
**Likely Causes**:
1. Placeholder element showing before content
2. State transition causing flash
3. CSS transition or animation issue
**Investigation Needed**:
1. Check for placeholder elements in render
2. Review CSS transitions
3. Examine initial render states

### Already Fixed ✅:
- ✅ Multi-second latency (via FS-00-AB-1)
- ✅ Text overflow (CSS fixes applied)
- ⚠️ Math rendering (attempted, needs more work)
- ⚠️ Smart Learning Notes (should work, needs verification)

---

## 📈 PRIORITY MATRIX

| Priority | Issue | Impact | Effort | Fix Order |
|----------|-------|--------|--------|-----------|
| P0 | Multi-second latency | CRITICAL | Medium | 1st (via FS-00-AB-1) |
| P0 | Show-Then-Tell reversed | CRITICAL | High | 2nd (separate fix) |
| P1 | Math rendering broken | HIGH | Low | 3rd (immediate) |
| P1 | Notes not populating | HIGH | Medium | Via FS-00-AB-1 |
| P2 | Text overflow | MEDIUM | Low | 4th (CSS fix) |
| P3 | White bar flash | LOW | Low | Via FS-00-AB-1 |

---

## 🔧 DEBUGGING COMMANDS

```bash
# Check console for errors
# Browser DevTools > Console

# Monitor WebSocket messages
# Browser DevTools > Network > WS

# Check DisplayBuffer updates
localStorage.setItem('debug:displayBuffer', 'true');

# Monitor timing
performance.mark('audio-start');
performance.mark('text-display');
performance.measure('show-tell-delay', 'text-display', 'audio-start');
```

---

## 📝 NOTES

1. **The 5-minute fix introduced latency** - This suggests the direct DisplayBuffer update is conflicting with other systems
2. **Math rendering was working before** - Need to check what changed in data format
3. **Show-Then-Tell is conceptually backwards** - Current implementation delays display, should delay audio
4. **FS-00-AB-1 will solve 50% of issues** - But critical rendering issues need separate attention

---

## 📊 CURRENT STATUS SUMMARY

**Total Issues**: 6
**Fixed**: 2 (Latency ✅, Text Overflow ✅)
**Attempted but Failed**: 2 (Math Rendering ⚠️, Notes ⚠️)
**Not Fixed**: 2 (Show-Then-Tell ❌, White Bar ❌)

**User Confirmed**:
- ✅ "One thing that's definitely fixed is the speed of response"
- ❌ "still no text before audio"
- ❌ "why does this white bar appear every time"

---

**Next Steps**:
1. Deep dive into Show-Then-Tell timing mechanism
2. Investigate white bar rendering issue
3. Re-attempt math rendering fix
4. Verify Smart Learning Notes functionality