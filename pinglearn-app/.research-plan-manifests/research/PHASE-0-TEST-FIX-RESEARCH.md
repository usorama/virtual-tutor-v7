# PHASE-0 Test Infrastructure Fix - Research Manifest

**Agent ID**: agent_test_fixer_001
**Agent Type**: test-writer-fixer
**Task**: Fix 256 test failures (48% failure rate)
**Date**: 2025-09-30
**Status**: RESEARCH COMPLETE

---

## Executive Summary

**Current State**: 256 test failures out of 534 total tests (48% failure rate)
**Root Cause**: Missing mock methods and incorrect return types in protected-core mocks
**Impact**: Blocking all PC-014 story implementation (Phase 1 cannot start)
**Fix Complexity**: Medium - Isolated to mock files, no protected-core changes needed

---

## Failure Analysis

### 1. MockWebSocketManager Issues (Causes ~50 failures)

**Problem 1**: Missing `addEventListener` and `removeEventListener` methods
**Error**: `manager.addEventListener is not a function`
**Affected Tests**:
- `src/tests/unit/hooks.test.ts` - 16 failures in hook tests
- `src/tests/unit/VoiceSessionManager.test.ts` - Multiple failures

**Root Cause**: The MockWebSocketManager only has `on()` and `off()` methods, but React hooks and VoiceSessionManager call `addEventListener()` which doesn't exist.

**Current Code** (lines 333-350 in protected-core.ts):
```typescript
on(event: string, handler: WebSocketEventHandler): void {
  // exists
}

off(event: string, handler: WebSocketEventHandler): void {
  // exists
}

// Missing:
// addEventListener()
// removeEventListener()
```

**Fix Required**: Add these methods as aliases to `on()` and `off()` - **Already implemented in lines 352-360!**

**Wait, they exist?**: Yes! Lines 352-360 show:
```typescript
addEventListener(event: string, handler: WebSocketEventHandler): void {
  this.on(event, handler);
}

removeEventListener(event: string, handler: WebSocketEventHandler): void {
  this.off(event, handler);
}
```

**So why are tests failing?** Need to investigate further. The methods exist but tests still report they don't exist. This suggests:
1. Tests might be using a different instance
2. Tests might be importing from wrong location
3. Mock might not be properly exported

---

### 2. Health Monitor Integration Missing (Causes 2 failures)

**Problem**: MockWebSocketManager doesn't have health monitor methods
**Error**: `healthMonitor.isMonitoring is not a function`
**Affected Tests**:
- `src/tests/integration/websocket-manager.test.ts` - Health Monitoring Integration tests

**Missing Methods**:
- `getHealthMonitor()` - Should return a mock health monitor
- Health monitor needs: `isMonitoring()`, `getMetrics()`, `startMonitoring()`, `stopMonitoring()`

**Fix Required**: Add health monitor mock integration

---

### 3. Exponential Backoff Integration Missing (Causes 2 failures)

**Problem**: MockWebSocketManager doesn't have backoff integration
**Error**: `backoff.getNextDelay is not a function`
**Affected Tests**:
- `src/tests/integration/websocket-manager.test.ts` - Retry Logic Integration tests

**Missing Methods**:
- `getBackoff()` - Should return a mock ExponentialBackoff instance
- Backoff needs: `getNextDelay()`, `reset()`, `getCurrentAttempt()`

**Fix Required**: Add exponential backoff mock integration

---

### 4. Database Transaction Helper Issue (Causes ~30 failures)

**Problem**: Transaction helper's `single()` returns wrong structure
**Error**: `expected undefined to be null`
**Affected Tests**:
- `src/tests/integration/database-transactions.test.ts` - Multiple transaction tests

**Current Code** (line 181-184 in integration-helpers.ts):
```typescript
single: vi.fn().mockResolvedValue({
  data: (mockData[table] || [])[0] || null,
  error: (mockData[table] || []).length === 0 ? { message: 'No rows found' } : null
})
```

**Problem**: When `mockData[table]` doesn't exist (undefined), the expression evaluates to:
- `(undefined || [])[0]` = `[][0]` = `undefined`
- But it's wrapped in `{ data: undefined, error: null }`
- Tests expect `{ data: null, error: ... }`

**Fix Required**: Change to explicitly return `null` when no data:
```typescript
single: vi.fn().mockResolvedValue({
  data: (mockData[table] || [])[0] ?? null,  // Use ?? null
  error: (mockData[table] || []).length === 0 ? { message: 'No rows found' } : null
})
```

Also need to add `.single()` chaining support in transaction client (currently missing on line 181).

---

### 5. WebSocket Message Handling Failures (Causes ~15 failures)

**Problem**: Mock doesn't properly emit events during send/receive
**Error**: `expected "spy" to be called at least once`
**Affected Tests**:
- `src/tests/integration/websocket-manager.test.ts` - Message Handling tests

**Root Cause**: The mock's `send()` method doesn't trigger any events. Tests expect:
- `send()` should emit 'message' or 'send' event
- `simulateMessage()` should work but isn't being called in tests

**Fix Required**: Enhance `send()` to emit appropriate events

---

### 6. Connection State Management (Causes ~10 failures)

**Problem**: Mock doesn't properly track connection state transitions
**Error**: `expected 'connected' to be 'connecting'`
**Affected Tests**:
- `src/tests/integration/websocket-manager.test.ts` - Connection Management tests

**Root Cause**: The mock immediately sets `connected = true` without a 'connecting' state.

**Fix Required**: Add proper state transitions:
```typescript
async connect(config: WebSocketConfig): Promise<void> {
  this.connectionState = 'connecting';  // Add this state
  await new Promise(resolve => setTimeout(resolve, 10)); // Simulate delay
  this.connected = true;
  this.connectionState = 'connected';
  this.emit('connect', {});
}
```

---

### 7. VoiceSessionManager Mock Issues (Causes ~40 failures)

**Problem**: Tests reference VoiceSessionManager methods that don't exist in mock
**Error**: Various method not found errors
**Affected Tests**:
- `src/tests/unit/VoiceSessionManager.test.ts` - Multiple test suites

**Analysis Needed**: Need to check what methods VoiceSessionManager tests expect

---

### 8. Error Handler Hook Failures (Causes 3 failures)

**Problem**: Minor issues in useErrorHandler tests
**Errors**:
- `expected "spy" to be called at least once`
- `result.current.setState is not a function`

**Fix Required**: Check test expectations and mock setup

---

## Dependency Chain Analysis

1. **Primary Blocker**: MockWebSocketManager issues
   - Blocks all hook tests (16 failures)
   - Blocks integration tests (20+ failures)

2. **Secondary Blocker**: Database transaction helper
   - Blocks database integration tests (30 failures)

3. **Tertiary Issues**: VoiceSessionManager mocks
   - Blocks VoiceSessionManager tests (40 failures)

**Critical Path**: Fix MockWebSocketManager first (will resolve 50+ failures immediately)

---

## Files Requiring Changes

### 1. `/src/tests/mocks/protected-core.ts` (PRIMARY)
**Changes Required**:
- ✅ `addEventListener` / `removeEventListener` - Already exist! Need to investigate why tests fail
- ❌ Add `getHealthMonitor()` method returning mock health monitor
- ❌ Add `getBackoff()` method returning mock exponential backoff
- ❌ Add `connectionState` property tracking 'connecting' | 'connected' | 'disconnected'
- ❌ Enhance `connect()` to include 'connecting' state transition
- ❌ Add proper event emission in `send()` method

**Estimated Lines Changed**: ~50 lines added/modified

### 2. `/src/tests/utils/integration-helpers.ts` (SECONDARY)
**Changes Required**:
- ❌ Fix `single()` return type: change `|| null` to `?? null`
- ❌ Add `.single()` chaining to transaction client (line 181)
- ❌ Ensure consistent null handling across all query methods

**Estimated Lines Changed**: ~10 lines modified

### 3. Investigation Needed
**Files to Check**:
- `/src/tests/unit/VoiceSessionManager.test.ts` - What methods does it expect?
- `/src/tests/unit/hooks.test.ts` - Why does addEventListener fail if it exists?
- Check if tests import mock correctly

---

## Protected Core Boundary Check

**✅ SAFE**: All changes are in test mock files only
**✅ NO PROTECTED CORE MODIFICATIONS**: No files in `src/protected-core/` will be touched
**✅ CONTRACTS RESPECTED**: All changes align with protected-core contracts

**Protected Core Exports Referenced**:
- `ExponentialBackoff` - Need to create mock for this
- `WebSocketHealthMonitor` - Need to create mock for this
- All other types already properly mocked

---

## Risk Assessment

**Risk Level**: LOW
**Reasoning**:
- Changes isolated to test files only
- No production code affected
- Mocks already exist, just incomplete
- Clear error messages guide fixes

**Rollback Strategy**: Git checkpoint created at `c4eb90d`
**Verification**: Run `npm test` after each fix, target 534/534 passing

---

## Next Steps

1. ✅ Create this research manifest
2. ⏭️ Create detailed fix plan (PHASE-0-TEST-FIX-PLAN.md)
3. ⏭️ Implement fixes incrementally
4. ⏭️ Verify with `npm test` after each change
5. ⏭️ Create evidence document
6. ⏭️ Update tracking files

---

## Verification Criteria

**Success Metrics**:
- ✅ `npm test` shows 534/534 passing (100%)
- ✅ `npm run typecheck` shows 0 errors
- ✅ No new issues introduced
- ✅ Git checkpoint created
- ✅ Evidence document generated

---

## Additional Investigation Required

**Question 1**: Why do `addEventListener` tests fail when method exists in mock?
**Action**: Check test imports and mock exports

**Question 2**: What exact methods does VoiceSessionManager expect?
**Action**: Read VoiceSessionManager test file to understand requirements

**Question 3**: Are there other hidden dependencies in protected-core exports?
**Action**: Cross-reference all exports from `src/protected-core/index.ts`

---

[RESEARCH-COMPLETE-PHASE-0-TEST-FIX]

**Research Duration**: 25 minutes
**Confidence Level**: HIGH
**Ready for Planning**: ✅ YES