# PHASE-0 Protected-Core Boundary Fix - Implementation Plan

**Task ID**: protected-core-boundary-fix
**Agent**: boundary-enforcer-001
**Date**: 2025-09-30
**Status**: PLAN APPROVED

---

## Plan Summary

Fix 15 files importing protected-core internals directly. Replace all deep imports with public API imports from `@/protected-core/index.ts`.

**Complexity**: LOW - All required exports already exist in public API
**Risk**: MINIMAL - Simple import path changes, no logic modifications
**Estimated Duration**: 20 minutes

---

## Implementation Strategy

### Principle: "Replace, Don't Refactor"
- **ONLY** change import statements
- **NEVER** modify logic or function bodies
- **PRESERVE** all existing functionality
- **VERIFY** TypeScript after each batch

---

## Execution Batches

### Batch 1: Type-Only Component Imports (5 files) - SAFEST
**Risk Level**: MINIMAL (type-only, no runtime impact)
**Order**: Fix alphabetically

1. `src/components/classroom/ChatInterface.tsx`
   - **Current**: `type { DisplayItem } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `type { DisplayItem } from '@/protected-core'`

2. `src/components/classroom/MessageBubble.tsx`
   - **Current**: `type { DisplayItem } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `type { DisplayItem } from '@/protected-core'`

3. `src/components/classroom/ProgressiveMath.tsx`
   - **Current**: `{ MathFragmentData } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `{ MathFragmentData } from '@/protected-core'`

4. `src/components/classroom/StreamingMessage.tsx`
   - **Current**: `type { MathFragmentData } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `type { MathFragmentData } from '@/protected-core'`

5. `src/components/classroom/WordHighlighter.tsx`
   - **Current**: `{ DisplayItem, WordTiming } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `{ DisplayItem, WordTiming } from '@/protected-core'`

**Checkpoint**: Run `npm run typecheck` - MUST show 0 errors

---

### Batch 2: Hook Imports (2 files)
**Risk Level**: LOW (client-side hooks)

6. `src/hooks/useStreamingTranscript.ts`
   - **Current**: `type { DisplayItem } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `type { DisplayItem } from '@/protected-core'`

7. `src/hooks/useWordTiming.ts`
   - **Current**: `{ DisplayItem } from '@/protected-core/contracts/transcription.contract'`
   - **Replace**: `{ DisplayItem } from '@/protected-core'`

**Checkpoint**: Run `npm run typecheck` - MUST show 0 errors

---

### Batch 3: Test File Imports (6 files)
**Risk Level**: LOW (isolated test environment)

8. `src/tests/session/orchestrator.test.ts`
   - **Current**: `{ SessionOrchestrator } from '@/protected-core/session/orchestrator'`
   - **Replace**: `{ SessionOrchestrator } from '@/protected-core'`

9. `src/tests/e2e/session.e2e.test.ts` (2 imports)
   - **Line 8**: `{ SessionOrchestrator } from '@/protected-core/session/orchestrator'` → `from '@/protected-core'`
   - **Line 9**: `{ getDisplayBuffer } from '@/protected-core/transcription/display'` → `from '@/protected-core'`
   - **Line 10**: Keep as is (already has `TranscriptionService` correctly)

10. `src/tests/integration/transcript-flow.test.ts` (2 imports)
    - **Line 8**: `{ SessionOrchestrator } from '@/protected-core/session/orchestrator'` → `from '@/protected-core'`
    - **Line 9**: `{ getDisplayBuffer } from '@/protected-core/transcription/display'` → `from '@/protected-core'`

11. `src/tests/integration/voice-session-recovery.test.ts`
    - **Current**: `{ ExponentialBackoff } from '@/protected-core/websocket/retry/exponential-backoff'`
    - **Replace**: `{ ExponentialBackoff } from '@/protected-core'`

12. `src/tests/transcription/display/buffer.test.ts` (2 imports)
    - **Line 7**: `{ DisplayBuffer } from '@/protected-core/transcription/display/buffer'` → `from '@/protected-core'`
    - **Line 8**: `type { DisplayItem } from '@/protected-core/transcription/display/types'` → `from '@/protected-core'`

**Checkpoint**: Run `npm run typecheck` - MUST show 0 errors

---

### Batch 4: Library File Import (1 file) - MOST CRITICAL
**Risk Level**: MEDIUM (used in production error recovery)

13. `src/lib/error-handling/voice-session-recovery.ts`
    - **Current**: `{ ExponentialBackoff, type RetryConfig } from '@/protected-core/websocket/retry/exponential-backoff'`
    - **Replace**: `{ ExponentialBackoff, type RetryConfig } from '@/protected-core'`

**Checkpoint**: Run `npm run typecheck` - MUST show 0 errors

---

## Git Checkpoint Strategy

**After each batch completion**:
```bash
git add .
git commit -m "refactor(protected-core): Fix boundary violations - Batch [N]

- Fixed [X] files to use public API imports
- Replaced deep path imports with '@/protected-core'
- TypeScript verification passed: 0 errors

Part of PC-014 PHASE-0 boundary enforcement"
```

---

## Verification Protocol

### After Each Batch
```bash
npm run typecheck
# MUST output: "Found 0 errors"
```

### Final Verification
```bash
# 1. TypeScript compilation
npm run typecheck
# Expected: 0 errors

# 2. Search for remaining violations
grep -r "from ['\"']@/protected-core/[^'\"']+/[^'\"']+['\"']" src/ | grep -v node_modules
# Expected: NO results

# 3. Lint check
npm run lint
# Expected: All passing

# 4. Test run (optional - may have other failing tests)
npm test
# Expected: No NEW failures introduced
```

---

## Rollback Plan

If any batch causes errors:

1. **Immediate Rollback**
   ```bash
   git reset --hard HEAD~1
   ```

2. **Investigate**
   - Check TypeScript error message
   - Verify export exists in public API
   - Check for typos in import statement

3. **Re-attempt**
   - Fix specific file causing issue
   - Verify in isolation
   - Commit only that file

---

## Success Criteria

- ✅ All 15 files updated
- ✅ 0 TypeScript errors
- ✅ No deep path imports remaining
- ✅ All tests still pass (no new failures)
- ✅ Git commits created for each batch
- ✅ Evidence document created

---

## Risk Mitigation

### What Could Go Wrong?

1. **TypeScript Errors After Change**
   - **Cause**: Export missing from public API
   - **Fix**: Add export to `src/protected-core/index.ts`
   - **Likelihood**: VERY LOW (all exports verified in research)

2. **Runtime Errors**
   - **Cause**: Import path resolution issue
   - **Fix**: Verify tsconfig.json paths configuration
   - **Likelihood**: VERY LOW (same import system)

3. **Test Failures**
   - **Cause**: Mock configuration expecting specific import path
   - **Fix**: Update mock configuration to match public API
   - **Likelihood**: LOW (mocks use generic patterns)

---

## Time Estimates

| Batch | Files | Time Estimate |
|-------|-------|---------------|
| Batch 1 (Components) | 5 | 5 minutes |
| Batch 2 (Hooks) | 2 | 2 minutes |
| Batch 3 (Tests) | 6 | 6 minutes |
| Batch 4 (Library) | 1 | 2 minutes |
| Verification | - | 3 minutes |
| Evidence Doc | - | 2 minutes |
| **TOTAL** | **15** | **20 minutes** |

---

## Post-Implementation

1. **Update Tracking**
   - Mark task as completed in `EXECUTION-STATE.json`
   - Update `AGENT-COORDINATION.json`
   - Release file locks in `FILE-REGISTRY.json`

2. **Create Evidence**
   - Document all changes in evidence manifest
   - Include before/after verification results
   - Capture git commit hashes

3. **Update Metrics**
   - `PROGRESS-DASHBOARD.md`: Update violations count to 0

---

[PLAN-APPROVED-PHASE-0-BOUNDARY-FIX]