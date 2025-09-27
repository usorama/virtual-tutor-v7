# PingLearn Issue Tracker
**Created**: 2025-09-27
**Status**: ACTIVE
**Last Updated**: 2025-09-27

## 🔴 CRITICAL ISSUES

### Issue #001: Show-Then-Tell Timing Reversed
**Severity**: CRITICAL
**Component**: `TeachingBoardSimple.tsx`
**Feature**: FC-010 (400ms visual lead time)
**Current Behavior**: Text appears AFTER audio starts speaking
**Expected Behavior**: Text should appear 400ms BEFORE audio
**Evidence**: User reports "text is still appearing after audio, beats the show-n-tell purpose"
**Root Cause**: The 5-minute fix processes data immediately, but the 400ms delay is applied to DISPLAY not AUDIO
**Will FS-00-AB-1 Fix?**: ⚠️ PARTIALLY - Needs additional timing coordination

### Issue #002: Multi-Second Response Latency
**Severity**: CRITICAL
**Component**: Python LiveKit Agent / Communication Pipeline
**Feature**: Voice interaction latency
**Current Behavior**: "HUGE, multi-second delay between when I say something, and when teacher finally responds"
**Expected Behavior**: <1 second response time
**Evidence**: User reports this wasn't the case before the 5-minute fix
**Root Cause**: Likely double-processing or queuing issue introduced by direct DisplayBuffer update
**Will FS-00-AB-1 Fix?**: ✅ YES - Proper event handling will eliminate duplicate processing

### Issue #003: Math Rendering Broken
**Severity**: HIGH
**Component**: `TeachingBoardSimple.tsx` - Math detection and rendering
**Feature**: KaTeX math rendering
**Current Behavior**: Math formulas showing as plain text with broken formatting
**Expected Behavior**: Properly rendered mathematical notation
**Evidence**: `fraction p/q, wherepandqareintegersandqisnotzero` instead of proper fraction
**Root Cause**: Math detection regex not catching the pattern, or KaTeX not being invoked
**Will FS-00-AB-1 Fix?**: ❌ NO - This is a separate rendering issue

### Issue #004: Text Overflow Container
**Severity**: MEDIUM
**Component**: `TeachingBoardSimple.tsx` - CSS/Layout
**Feature**: Text display container
**Current Behavior**: Long text overflows the container boundaries
**Expected Behavior**: Text should wrap or be contained within boundaries
**Evidence**: Screenshot shows text extending beyond container
**Root Cause**: Missing CSS overflow handling or word-break properties
**Will FS-00-AB-1 Fix?**: ❌ NO - This is a CSS issue

### Issue #005: White Bar Flash
**Severity**: LOW
**Component**: `TeachingBoardSimple.tsx` - Rendering
**Feature**: Visual rendering
**Current Behavior**: White bar appears briefly before text renders
**Expected Behavior**: Smooth transition without flash
**Evidence**: "while printing the text, a white bar appears and then that disappears"
**Root Cause**: Likely a rendering state transition or placeholder element
**Will FS-00-AB-1 Fix?**: ⚠️ MAYBE - Depends on implementation details

### Issue #006: Smart Learning Notes Empty
**Severity**: MEDIUM
**Component**: `NotesPanel.tsx`
**Feature**: FS-00-AA (Smart Learning Notes)
**Current Behavior**: Notes panel remains empty during session
**Expected Behavior**: Auto-populated notes from transcript
**Evidence**: Screenshot shows empty notes panel
**Root Cause**: Notes component not receiving data from DisplayBuffer or transcription service
**Will FS-00-AB-1 Fix?**: ✅ YES - Proper data flow will feed notes

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

## 🎯 RECOMMENDED ACTION PLAN

### Immediate Fixes (Before FS-00-AB-1):

#### Fix #1: Math Rendering (30 minutes)
```typescript
// In TeachingBoardSimple.tsx, fix math detection
const mathPatterns = [
  /\$\$[\s\S]+?\$\$/g,  // Block math
  /\$[^\$]+?\$/g,       // Inline math
  /\\[([][\s\S]+?\\[)\]/g,  // LaTeX delimiters
  /fraction/i,          // Add keyword detection
  /equation/i,
  /formula/i
];
```

#### Fix #2: Text Overflow CSS (15 minutes)
```css
.teaching-board-content {
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  max-width: 100%;
  overflow-x: hidden;
}
```

#### Fix #3: Show-Then-Tell Timing (1 hour)
This requires coordinating AUDIO delay, not just visual delay. The current implementation delays the DISPLAY, but we need to delay the AUDIO instead.

### Then Implement FS-00-AB-1:
This will fix:
- Response latency issues
- Data flow problems
- Smart Learning Notes population
- Overall architecture cleanliness

### Post FS-00-AB-1:
- Implement FS-00-AB-2 for redundancy
- Add performance monitoring
- Optimize math rendering pipeline

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

**Next Steps**:
1. Implement immediate math rendering fix
2. Fix CSS overflow issue
3. Begin FS-00-AB-1 implementation
4. Create separate fix for Show-Then-Tell audio timing