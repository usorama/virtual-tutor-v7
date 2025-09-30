# ARCH-002 Implementation Plan - Service Layer Architecture

**Story ID**: ARCH-002
**Title**: Service Layer Architecture Implementation
**Category**: Architecture
**Priority**: High (Wave 2, Batch 1)
**Plan Created**: 2025-09-30
**Planner**: Claude Code (Story Implementer Agent)

**Research Manifest**: `.research-plan-manifests/research/ARCH-002-RESEARCH.md` [RESEARCH-COMPLETE-ARCH-002]

---

## 1. ARCHITECTURE DECISIONS

### File Structure (Exact Paths)

```
pinglearn-app/src/lib/services/
├── base-service.ts          # Abstract BaseService class (NEW - 250 lines)
├── service-container.ts     # ServiceContainer singleton (NEW - 200 lines)
├── service-tokens.ts        # Service identification tokens (NEW - 50 lines)
├── service-lifecycle.ts     # Lifecycle types and interfaces (NEW - 100 lines)
├── service-errors.ts        # Service-specific error classes (NEW - 80 lines)
├── transaction-manager.ts   # Transaction context manager (NEW - 150 lines)
├── dependency-injector.ts   # Dependency injection utilities (NEW - 180 lines)
├── repository-base.ts       # Existing, no changes
├── index.ts                 # Public API exports (UPDATE - add 50 lines)

pinglearn-app/src/lib/testing/
├── service-test-utils.ts    # Service testing utilities (NEW - 200 lines)
├── mock-service-factory.ts  # Mock service creation (NEW - 150 lines)
├── index.ts                 # Test utilities export (NEW - 20 lines)

pinglearn-app/src/types/
├── services.ts              # Service layer types (NEW - 120 lines)

pinglearn-app/tests/services/
├── base-service.test.ts     # BaseService unit tests (NEW - 300 lines)
├── service-container.test.ts # ServiceContainer tests (NEW - 250 lines)
├── dependency-injector.test.ts # DI tests (NEW - 200 lines)
├── transaction-manager.test.ts # Transaction tests (NEW - 180 lines)
├── integration.test.ts      # Integration tests (NEW - 250 lines)
```

**Total New Files**: 16 files
**Total New Lines**: ~2,530 lines
**Existing Files Modified**: 1 file (src/lib/services/index.ts)

### Integration with Protected-Core (Specific APIs)

**Protected-Core Contracts to Import**:
```typescript
// From @/protected-core/contracts
import type {
  VoiceServiceContract,
  TranscriptionServiceContract,
  WebSocketContract
} from '@/protected-core/contracts';
```

**Integration Strategy**:
- **Read-Only Imports**: Import contracts as types only, never modify
- **Composition Over Inheritance**: Application services compose with protected-core services
- **Event-Based Communication**: Use EventBus pattern for decoupled communication
- **No Direct Dependencies**: BaseService does NOT depend on protected-core implementations

**Example Integration Pattern**:
```typescript
// Application service using protected-core service
class NotesGenerationService extends BaseService {
  constructor(
    private transcriptionService: TranscriptionServiceContract // Injected, not imported
  ) {
    super('NotesGenerationService');
  }
}
```

### Integration with Existing Services

**BaseRepository (src/lib/services/repository-base.ts)**:
- **Current**: Standalone abstract class
- **Future**: Can extend BaseService
- **ARCH-002 Action**: NO CHANGES (leave for future story)
- **Reason**: BaseRepository is stable, migration can be gradual

**VoiceSessionRecovery (src/services/voice-session-recovery.ts)**:
- **Current**: Standalone service with lifecycle
- **Future**: Register with ServiceContainer
- **ARCH-002 Action**: NO CHANGES (reference pattern only)
- **Reason**: Production code, working well

**FeatureFlagService (src/shared/services/feature-flags.ts)**:
- **Current**: Stateless static service
- **Future**: Remains independent
- **ARCH-002 Action**: NO CHANGES
- **Reason**: Different pattern, no lifecycle needed

### Technology Stack Choices

**Core Technologies**:
- **TypeScript**: Strict mode, generics, advanced types
- **Symbols**: For service tokens (unique identifiers)
- **WeakMap**: For private service metadata
- **Async/Await**: For lifecycle operations
- **EventEmitter Pattern**: For service events (lightweight, no external deps)

**No External Dependencies**:
- No DI containers (InversifyJS, TSyringe) - keep it simple
- No ORMs - use existing QueryObject pattern
- No external event libraries - custom EventBus
- Reason: Minimize bundle size, maintain control, easier testing

**Type Safety**:
- Generic constraints for service types
- Branded types for service tokens
- Discriminated unions for service states
- Conditional types for dependency resolution

---

## 2. IMPLEMENTATION ROADMAP

### Step 1: Core Type Definitions
**Files**: `src/types/services.ts`, `src/lib/services/service-tokens.ts`, `src/lib/services/service-lifecycle.ts`
**Task**: Create foundational types and interfaces
**Verification**: `npm run typecheck` - 0 errors
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 1 - core type definitions"`

**Details**:
- Service state types (INITIALIZING, READY, STOPPING, STOPPED, ERROR)
- Service lifecycle hooks interface
- Service configuration types
- Service token type (branded string)
- Service metadata types
- Health check types

### Step 2: Service Error Classes
**Files**: `src/lib/services/service-errors.ts`
**Task**: Create service-specific error hierarchy
**Verification**: `npm run typecheck` + basic error instantiation tests
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 2 - service error classes"`

**Details**:
- ServiceError base class (extends Error)
- ServiceInitializationError
- ServiceDependencyError
- ServiceConfigurationError
- ServiceTimeoutError
- ServiceTransactionError
- Integration with existing ErrorSeverity enum

### Step 3: BaseService Abstract Class
**Files**: `src/lib/services/base-service.ts`
**Task**: Implement core BaseService functionality
**Verification**: `npm run typecheck` + `npm test tests/services/base-service.test.ts`
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 3 - BaseService implementation"`

**Details**:
- Abstract class with generic configuration type
- Lifecycle management (init, destroy, restart)
- Error handling integration
- Logging hooks (onLog, onError)
- Health check interface
- Service state management
- Event emission capabilities
- Protected helper methods
- Abstract methods for subclasses

### Step 4: Service Token System
**Files**: Update `src/lib/services/service-tokens.ts`
**Task**: Implement service identification and lookup
**Verification**: `npm run typecheck` + token uniqueness tests
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 4 - service token system"`

**Details**:
- createServiceToken factory function
- Symbol-based token creation
- Token registry for debugging
- TypeScript branded types for type safety
- Example tokens for common services

### Step 5: ServiceContainer Registry
**Files**: `src/lib/services/service-container.ts`
**Task**: Implement service registry and lifecycle orchestration
**Verification**: `npm run typecheck` + `npm test tests/services/service-container.test.ts`
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 5 - ServiceContainer registry"`

**Details**:
- Singleton pattern implementation
- Service registration with tokens
- Service retrieval with type safety
- Lifecycle orchestration (initialize all, destroy all)
- Dependency graph management
- Circular dependency detection
- Service replacement support (for testing)
- Health check aggregation

### Step 6: Dependency Injection
**Files**: `src/lib/services/dependency-injector.ts`
**Task**: Implement constructor-based dependency injection
**Verification**: `npm run typecheck` + `npm test tests/services/dependency-injector.test.ts`
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 6 - dependency injection"`

**Details**:
- Dependency metadata collection
- Constructor parameter analysis
- Automatic dependency resolution
- Optional vs required dependencies
- Circular dependency prevention
- Lazy injection support
- Service factory registration
- Mock injection for testing

### Step 7: Transaction Management
**Files**: `src/lib/services/transaction-manager.ts`
**Task**: Implement transaction context propagation
**Verification**: `npm run typecheck` + `npm test tests/services/transaction-manager.test.ts`
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 7 - transaction management"`

**Details**:
- Transaction context interface
- Async transaction execution
- Commit/rollback support
- Nested transaction handling
- Transaction timeout management
- Integration with existing QueryObject pattern
- Compensation pattern for distributed transactions

### Step 8: Testing Utilities
**Files**: `src/lib/testing/service-test-utils.ts`, `src/lib/testing/mock-service-factory.ts`
**Task**: Create service testing infrastructure
**Verification**: `npm run typecheck` + use utilities in existing tests
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 8 - testing utilities"`

**Details**:
- MockService base class
- createMockService factory
- Service test harness
- Lifecycle test helpers
- Async operation test utilities
- Service spy/stub utilities
- Integration test helpers

### Step 9: Integration Tests
**Files**: `tests/services/integration.test.ts`
**Task**: End-to-end service layer testing
**Verification**: `npm test tests/services/` - all pass
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 9 - integration tests"`

**Details**:
- Multiple service initialization
- Dependency injection scenarios
- Transaction execution across services
- Error propagation testing
- Health check aggregation
- Graceful shutdown testing
- Service replacement testing

### Step 10: Public API and Documentation
**Files**: `src/lib/services/index.ts`, inline documentation
**Task**: Finalize exports and add comprehensive JSDoc
**Verification**: `npm run typecheck` + `npm run lint`
**Git Checkpoint**: `git commit -m "checkpoint: ARCH-002 step 10 - public API and docs"`

**Details**:
- Clean public API exports
- Hide internal implementation details
- Comprehensive JSDoc for all public APIs
- Usage examples in comments
- Integration guide in service-container.ts
- Type-safe exports with proper generics

---

## 3. TESTING STRATEGY

### Unit Tests (>80% Coverage Target)

**BaseService Tests** (`tests/services/base-service.test.ts` - 300 lines):
- Lifecycle: init, destroy, restart
- State transitions: INITIALIZING → READY → STOPPING → STOPPED
- Error handling: initialization failures, runtime errors
- Health checks: healthy, degraded, unhealthy states
- Event emission: lifecycle events, error events
- Configuration: valid config, invalid config, missing config
- Abstract method enforcement

**ServiceContainer Tests** (`tests/services/service-container.test.ts` - 250 lines):
- Singleton pattern: getInstance returns same instance
- Service registration: register, retrieve, replace
- Token system: unique tokens, type safety
- Lifecycle orchestration: initializeAll, destroyAll order
- Dependency graph: correct initialization order
- Circular dependency: detection and error
- Health checks: aggregate status from all services
- Service not found: proper error handling

**Dependency Injector Tests** (`tests/services/dependency-injector.test.ts` - 200 lines):
- Constructor injection: automatic resolution
- Optional dependencies: handling missing dependencies
- Required dependencies: error when missing
- Circular dependencies: detection and prevention
- Lazy injection: deferred resolution
- Factory functions: custom service creation
- Mock injection: test doubles

**Transaction Manager Tests** (`tests/services/transaction-manager.test.ts` - 180 lines):
- Transaction execution: successful commit
- Rollback: error triggers rollback
- Nested transactions: proper nesting behavior
- Timeout: transaction timeout handling
- Compensation: distributed transaction rollback
- Context propagation: async context maintained
- Concurrent transactions: isolation

### Integration Tests (scenarios)

**Integration Tests** (`tests/services/integration.test.ts` - 250 lines):
- **Scenario 1**: Multiple service initialization with dependencies
  - Register 3 services with dependency chain
  - Initialize in correct order
  - Verify all services reach READY state

- **Scenario 2**: Service failure during initialization
  - One service fails to initialize
  - Dependent services handle gracefully
  - System remains stable

- **Scenario 3**: Transaction across multiple services
  - Start transaction
  - Execute operations in 2 services
  - Commit successfully
  - Verify state consistency

- **Scenario 4**: Transaction rollback scenario
  - Start transaction
  - Service operation fails
  - Rollback executed
  - State reverted correctly

- **Scenario 5**: Health check aggregation
  - Multiple services with different health states
  - Container reports aggregate health
  - Degraded services identified

- **Scenario 6**: Graceful shutdown
  - Initiate container shutdown
  - All services stop in reverse order
  - Resources cleaned up
  - No memory leaks

- **Scenario 7**: Service replacement for testing
  - Register real service
  - Replace with mock
  - Mock behaves correctly
  - Restore real service

### Edge Cases

- Initialization timeout
- Destroy during initialization
- Concurrent initialization attempts
- Transaction deadlock
- Service name conflicts
- Invalid configuration types
- Memory leaks (verify with cleanup)
- Race conditions in async operations

### Coverage Requirements

**Minimum Coverage**: 80% on new code
**Target Coverage**: 85-90%

**Coverage Breakdown**:
- BaseService: >85% (core functionality)
- ServiceContainer: >85% (critical registry)
- DependencyInjector: >80% (complex logic)
- TransactionManager: >80% (transaction safety)
- Testing utilities: >75% (less critical)

**Verification**:
```bash
npm run test:coverage -- tests/services/
```

---

## 4. SECURITY & QUALITY PATTERNS

### Security Considerations

1. **Service Isolation**:
   - Services cannot access each other's private state
   - Use dependency injection, not direct imports
   - Token-based service lookup prevents typos

2. **Configuration Validation**:
   - Validate all configuration on initialization
   - Type-safe configuration objects
   - No dynamic configuration at runtime (immutable after init)

3. **Error Information Disclosure**:
   - Sanitize error messages in production
   - Log full errors internally
   - Return safe error messages to clients
   - Use error codes instead of detailed messages

4. **Transaction Safety**:
   - Automatic rollback on errors
   - Timeout enforcement (prevent hanging transactions)
   - Compensation patterns for distributed operations
   - Audit logging for sensitive operations

5. **Resource Management**:
   - Proper cleanup in destroy lifecycle
   - WeakMap for automatic garbage collection
   - No circular references in service graph
   - Memory leak detection in tests

### Validation Points

**Service Registration**:
- Validate service token is unique
- Validate service class extends BaseService
- Validate no duplicate service names
- Validate configuration schema

**Dependency Injection**:
- Validate all required dependencies exist
- Validate no circular dependencies
- Validate dependency types match expectations
- Validate factory functions are valid

**Transaction Execution**:
- Validate transaction context is active
- Validate operations are idempotent where possible
- Validate timeout values are reasonable
- Validate compensation logic exists for critical operations

### Input Sanitization Approach

**Configuration Objects**:
```typescript
// Use Zod-like validation (manual implementation)
const configSchema = {
  name: (v: unknown) => typeof v === 'string' && v.length > 0,
  timeout: (v: unknown) => typeof v === 'number' && v > 0,
  retries: (v: unknown) => typeof v === 'number' && v >= 0
};

function validateConfig<T>(config: unknown, schema: Record<string, (v: unknown) => boolean>): T {
  // Validation logic
}
```

**Service Tokens**:
- Use Symbol primitive (cannot be forged)
- Branded types for compile-time safety
- Runtime validation on registration

**Transaction Context**:
- Validate transaction ID format (UUID)
- Validate timestamp is recent
- Validate parent transaction exists for nested transactions

### TypeScript Strict Mode Compliance

**Enabled Strict Flags**:
- `strict: true` (enables all strict checks)
- `noUncheckedIndexedAccess: true` (array/object access safety)
- `noImplicitReturns: true` (all code paths return)
- `noFallthroughCasesInSwitch: true` (switch exhaustiveness)

**Type Safety Patterns**:
- Generic constraints for all service types
- Branded types for unique identifiers
- Discriminated unions for service states
- Readonly types for immutable data
- Unknown type for external data (never any)

**Example Strict Pattern**:
```typescript
// ✅ CORRECT: Branded type for service token
type ServiceToken<T> = string & { readonly __brand: unique symbol };

// ✅ CORRECT: Discriminated union for service state
type ServiceState =
  | { status: 'INITIALIZING'; progress: number }
  | { status: 'READY'; startTime: number }
  | { status: 'ERROR'; error: Error };

// ✅ CORRECT: Generic constraint for configuration
abstract class BaseService<TConfig extends Record<string, unknown>> {
  constructor(protected config: TConfig) {}
}

// ❌ FORBIDDEN: any type
// const service: any = getService(); // NEVER DO THIS

// ❌ FORBIDDEN: unchecked array access
// const item = array[0]; // Could be undefined
// ✅ CORRECT:
const item = array[0]; // TypeScript knows this could be undefined
if (item !== undefined) {
  // Safe to use item here
}
```

---

## 5. SUCCESS CRITERIA

### Functional Requirements Checklist

- [ ] BaseService abstract class with lifecycle management
- [ ] ServiceContainer singleton for service registry
- [ ] Service token system with type safety
- [ ] Dependency injection with constructor injection
- [ ] Transaction manager with commit/rollback
- [ ] Service composition patterns (service using service)
- [ ] Error handling integration (ServiceError classes)
- [ ] Health check support (healthy, degraded, unhealthy)
- [ ] Testing utilities (MockService, test harness)
- [ ] Public API with comprehensive JSDoc

### Quality Gates

**TypeScript Compilation**:
```bash
npm run typecheck
# Expected: 0 errors ✅
```

**Linting**:
```bash
npm run lint
# Expected: 0 errors in new code ✅
```

**Unit Tests**:
```bash
npm test tests/services/
# Expected: All tests passing ✅
```

**Test Coverage**:
```bash
npm run test:coverage -- tests/services/
# Expected: >80% coverage on new code ✅
```

**Build Success**:
```bash
npm run build
# Expected: Build completes successfully ✅
```

### Integration Verification Points

**With Protected-Core**:
- [ ] Import contracts as types only (no runtime imports)
- [ ] No modifications to protected-core files
- [ ] Services can compose with protected-core services via DI
- [ ] Event-based communication works correctly

**With Existing Services**:
- [ ] BaseRepository continues to work (no changes)
- [ ] VoiceSessionRecovery continues to work (no changes)
- [ ] FeatureFlagService continues to work (no changes)
- [ ] New services can coexist with existing services

**With Error Handling (ERR-006)**:
- [ ] ServiceError classes use ErrorSeverity enum
- [ ] Error monitoring can track service errors
- [ ] Error recovery patterns work with services

**With Testing Infrastructure**:
- [ ] Service test utilities work with existing test framework
- [ ] Mock services can replace real services in tests
- [ ] Integration tests run successfully

### Performance Benchmarks

**Service Initialization**:
- Single service: <10ms
- 10 services with dependencies: <50ms
- 100 services: <500ms

**Service Lookup**:
- By token: <1ms (Map lookup)
- With type safety: compile-time only (0 runtime cost)

**Transaction Execution**:
- Empty transaction: <5ms
- Transaction with 3 operations: <50ms
- Rollback: <20ms

**Memory Footprint**:
- BaseService instance: <1KB
- ServiceContainer singleton: <10KB + (num_services * 1KB)
- No memory leaks (verified with heap snapshots)

**Verification**:
```typescript
// Add performance tests in integration.test.ts
describe('Performance benchmarks', () => {
  it('initializes single service under 10ms', async () => {
    const start = performance.now();
    await service.init();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);
  });
});
```

---

## 6. RISK MITIGATION

### Identified Risks

**Risk 1: Circular Dependency at Runtime**
- **Likelihood**: Medium
- **Impact**: High (prevents initialization)
- **Mitigation**:
  - Detect circular dependencies during registration
  - Throw ServiceDependencyError with clear message
  - Provide dependency graph visualization in error
  - Add extensive tests for circular dependency scenarios

**Risk 2: Transaction Deadlock**
- **Likelihood**: Low
- **Impact**: High (system hang)
- **Mitigation**:
  - Implement transaction timeout (default 30s)
  - Use async/await properly (no blocking operations)
  - Add transaction monitoring and logging
  - Test with concurrent transaction scenarios

**Risk 3: Service Initialization Order Issues**
- **Likelihood**: Medium
- **Impact**: Medium (failed initialization)
- **Mitigation**:
  - Topological sort for dependency graph
  - Initialize dependencies before dependents
  - Provide clear error messages for missing dependencies
  - Test complex dependency chains

**Risk 4: Memory Leaks in Long-Running Services**
- **Likelihood**: Low
- **Impact**: High (degraded performance over time)
- **Mitigation**:
  - Proper cleanup in destroy lifecycle
  - Use WeakMap for service metadata
  - Test for memory leaks with heap snapshots
  - Implement health checks that detect memory issues

**Risk 5: Type Safety Loopholes**
- **Likelihood**: Low
- **Impact**: Medium (runtime errors)
- **Mitigation**:
  - Use TypeScript strict mode
  - Branded types for service tokens
  - Runtime validation of critical inputs
  - Comprehensive type tests

### Rollback Strategy

**If Issues Detected During Implementation**:
1. Revert to last git checkpoint: `git reset --hard <checkpoint>`
2. Review step where issue occurred
3. Fix issue in isolation
4. Re-run verification for that step
5. Continue from next step

**If Tests Fail**:
1. Do NOT proceed to next step
2. Fix failing tests immediately
3. Re-run all previous tests to prevent regression
4. Continue only when all tests pass

**If TypeScript Errors Appear**:
1. STOP implementation immediately
2. Fix TypeScript errors (zero tolerance)
3. Re-run `npm run typecheck`
4. Continue only when 0 errors

**If Protected-Core Violation Detected**:
1. IMMEDIATE ROLLBACK to before violation
2. Review research findings
3. Re-plan integration approach
4. Implement without touching protected-core

---

## 7. PLAN APPROVAL

### Pre-Implementation Checklist

- [x] Research completed with evidence ([RESEARCH-COMPLETE-ARCH-002])
- [x] Architecture decisions documented
- [x] File structure defined with exact paths
- [x] Implementation steps have clear verification
- [x] Testing strategy covers all scenarios
- [x] Security patterns documented
- [x] Success criteria defined
- [x] Risk mitigation strategies in place
- [x] Integration points with protected-core clarified
- [x] No modifications to protected-core planned

### Quality Checkpoints

- TypeScript: 0 errors enforced at every step
- Tests: 100% passing enforced before next step
- Coverage: >80% target for new code
- Lint: 0 errors in new code
- Protected-core: NO modifications

### Estimated Duration

**Total**: 8 hours (matches story estimate)
- Steps 1-2: 0.5 hours (types and errors)
- Steps 3-4: 1.5 hours (BaseService and tokens)
- Step 5: 1 hour (ServiceContainer)
- Step 6: 1 hour (DependencyInjector)
- Step 7: 1 hour (TransactionManager)
- Steps 8-9: 2 hours (testing utilities and integration tests)
- Step 10: 0.5 hours (public API and docs)
- Buffer: 0.5 hours

### Next Phase

After plan approval, proceed to:
**PHASE 3-5: IMPLEMENT→VERIFY→TEST LOOP**
- Follow roadmap steps exactly
- Git checkpoint after each step
- Run verification after each step
- Maximum 5 iterations to meet all exit conditions

---

**[PLAN-APPROVED-ARCH-002]**

**Plan Quality**: HIGH
**Feasibility**: HIGH
**Ready for Implementation**: YES

*Plan completed: 2025-09-30*
*Time spent: Planning phase (comprehensive)*
*Planner: Claude Code (Story Implementer Agent)*
