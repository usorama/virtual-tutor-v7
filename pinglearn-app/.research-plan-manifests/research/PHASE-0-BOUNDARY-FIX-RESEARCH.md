# PHASE-0 Protected-Core Boundary Fix - Research Manifest

**Task ID**: protected-core-boundary-fix
**Agent**: boundary-enforcer-001
**Date**: 2025-09-30
**Status**: RESEARCH COMPLETE

---

## Executive Summary

Discovered **15 files** with protected-core boundary violations where code imports internal implementation details instead of using the public API exported from `@/protected-core/index.ts`.

**Impact**: These violations bypass the protected-core abstraction layer, creating tight coupling and making the codebase fragile to internal refactoring.

---

## Discovery Method

### Search Pattern
```bash
grep -r "from ['"]@/protected-core/[^'"]+/[^'"]+['"]" src/
```

### Rationale
- Public API: `@/protected-core` (imports from index.ts)
- Violations: `@/protected-core/*/...` (imports from internal paths)

---

## Violation Inventory (15 Files)

### Category 1: Type-Only Imports from Contracts (7 files)
These files import types directly from contract files instead of using the public API.

| File | Line | Current Import | Issue |
|------|------|----------------|-------|
| `src/hooks/useStreamingTranscript.ts` | 2 | `type { DisplayItem } from '@/protected-core/contracts/transcription.contract'` | Should use public API |
| `src/hooks/useWordTiming.ts` | 2 | `{ DisplayItem } from '@/protected-core/contracts/transcription.contract'` | Should use public API |
| `src/components/classroom/WordHighlighter.tsx` | 2 | `{ DisplayItem, WordTiming } from '@/protected-core/contracts/transcription.contract'` | Should use public API |
| `src/components/classroom/MessageBubble.tsx` | 7 | `type { DisplayItem } from '@/protected-core/contracts/transcription.contract'` | Should use public API |
| `src/components/classroom/ProgressiveMath.tsx` | 3 | `{ MathFragmentData } from '@/protected-core/contracts/transcription.contract'` | Should use public API |
| `src/components/classroom/ChatInterface.tsx` | 8 | `type { DisplayItem } from '@/protected-core/contracts/transcription.contract'` | Should use public API |
| `src/components/classroom/StreamingMessage.tsx` | 8 | `type { MathFragmentData } from '@/protected-core/contracts/transcription.contract'` | Should use public API |

**Fix Strategy**: Replace all with `from '@/protected-core'` - these types ARE exported in the public API (lines 16-24 of index.ts)

---

### Category 2: Service Implementation Imports (2 files)

| File | Line | Current Import | Issue |
|------|------|----------------|-------|
| `src/tests/session/orchestrator.test.ts` | 7 | `{ SessionOrchestrator } from '@/protected-core/session/orchestrator'` | Should use public API |
| `src/tests/e2e/session.e2e.test.ts` | 8 | `{ SessionOrchestrator } from '@/protected-core/session/orchestrator'` | Should use public API |

**Fix Strategy**: Replace with `from '@/protected-core'` - SessionOrchestrator IS exported (line 84)

---

### Category 3: Internal Module Imports (4 files)

| File | Line | Current Import | Issue |
|------|------|----------------|-------|
| `src/tests/e2e/session.e2e.test.ts` | 9 | `{ getDisplayBuffer } from '@/protected-core/transcription/display'` | Should use public API |
| `src/tests/e2e/session.e2e.test.ts` | 10 | `{ TranscriptionService } from '@/protected-core/transcription'` | Should use public API |
| `src/tests/integration/transcript-flow.test.ts` | 8 | `{ SessionOrchestrator } from '@/protected-core/session/orchestrator'` | Should use public API |
| `src/tests/integration/transcript-flow.test.ts` | 9 | `{ getDisplayBuffer } from '@/protected-core/transcription/display'` | Should use public API |

**Fix Strategy**: Replace with `from '@/protected-core'` - both are exported (lines 71, 74)

---

### Category 4: Deep Internal Imports (2 files)

| File | Line | Current Import | Issue |
|------|------|----------------|-------|
| `src/lib/error-handling/voice-session-recovery.ts` | 12 | `{ ExponentialBackoff, type RetryConfig } from '@/protected-core/websocket/retry/exponential-backoff'` | Deep import path |
| `src/tests/integration/voice-session-recovery.test.ts` | 20 | `{ ExponentialBackoff } from '@/protected-core/websocket/retry/exponential-backoff'` | Deep import path |

**Fix Strategy**: Replace with `from '@/protected-core'` - ExponentialBackoff IS exported (line 33), RetryConfig IS exported (line 38)

---

### Category 5: Test-Specific Deep Imports (2 files)

| File | Line | Current Import | Issue |
|------|------|----------------|-------|
| `src/tests/transcription/display/buffer.test.ts` | 7 | `{ DisplayBuffer } from '@/protected-core/transcription/display/buffer'` | Deep test import |
| `src/tests/transcription/display/buffer.test.ts` | 8 | `type { DisplayItem } from '@/protected-core/transcription/display/types'` | Deep test import |

**Fix Strategy**: Replace with `from '@/protected-core'` - DisplayBuffer IS exported (line 70), DisplayItem IS exported (line 20)

---

## Public API Reference

From `src/protected-core/index.ts`, ALL the following are PROPERLY EXPORTED:

### Types (Contracts)
- `DisplayItem` (line 20)
- `WordTiming` (line 21)
- `MathFragmentData` (line 22)
- `ProcessedText` (line 17)
- `TextSegment` (line 18)
- `MathSegment` (line 19)

### Services
- `SessionOrchestrator` (line 84)
- `TranscriptionService` (line 74)
- `DisplayBuffer` (line 70)
- `getDisplayBuffer` (line 71)
- `ExponentialBackoff` (line 33)

### Types (Retry)
- `RetryConfig` (line 38)
- `RetryAttempt` (line 38)

---

## Root Cause Analysis

**Why These Violations Exist**:
1. **Historical Development**: Code written before public API was finalized
2. **IDE Auto-Import**: IDEs suggest deep paths when auto-importing
3. **Copy-Paste**: Developers copied import patterns from existing code
4. **Lack of Awareness**: Not all developers knew about the public API constraint

**Risk Assessment**:
- **Severity**: MEDIUM - No functional breakage, but architectural violation
- **Fragility**: HIGH - Internal refactoring would break these files
- **Maintenance**: HIGH - Difficult to track which code uses protected-core

---

## Verification Strategy

After fixing all imports:

1. **TypeScript Compilation**
   ```bash
   npm run typecheck
   # MUST show: 0 errors
   ```

2. **Pattern Search**
   ```bash
   grep -r "from ['\"']@/protected-core/[^'\"']+/[^'\"']+['\"']" src/ | grep -v node_modules
   # MUST show: NO matches (except in comments)
   ```

3. **Import Analysis**
   ```bash
   # All imports should be:
   import { X } from '@/protected-core'
   # NOT:
   import { X } from '@/protected-core/path/to/internal'
   ```

---

## Implementation Order

**Priority**: Fix from least to most risky

1. **Type-only imports** (7 files) - Safest, no runtime impact
2. **Test files** (6 files) - Isolated, won't affect production
3. **Library files** (1 file) - `voice-session-recovery.ts` - Most critical
4. **Hook files** (2 files) - Already counted in type-only

Total: **15 unique files to fix**

---

## Expected Outcome

After fixes:
- ✅ 0 TypeScript errors
- ✅ All imports use `@/protected-core` public API
- ✅ No deep path imports remaining
- ✅ Code remains functionally identical
- ✅ Architecture properly enforced

---

[RESEARCH-COMPLETE-PHASE-0-BOUNDARY-FIX]