# Implementation Plan (PRP): [STORY-ID]

**Story**: [Story Title]
**Created**: [Date/Time]
**Planner**: [Agent/Human Name]
**Status**: 📋 Planning Phase
**Research Manifest**: `research/[STORY-ID]-RESEARCH.md` ✅

---

## ✅ PREREQUISITES VERIFIED

- [ ] Research manifest exists and is complete
- [ ] Protected-core analysis done
- [ ] Context7 research completed
- [ ] Web research (2025 standards) done
- [ ] Integration decision made

---

## 🎯 IMPLEMENTATION STRATEGY

### Based on Research Findings

**Chosen Approach**: [ ] Extend Existing  [ ] Create New

**Justification**:
```
[From research manifest - why this approach]
```

---

## 🏗️ ARCHITECTURE DECISIONS

### 1. File Structure
```
[Based on research, where will code go?]

pinglearn-app/
├── src/
│   ├── [location]/
│   │   ├── [new-file].ts    [WHY: reason from research]
│   │   └── [new-file].test.ts
```

### 2. Integration Points

**Protected-Core Integration**:
```typescript
// How will this integrate with protected-core?
import { ExistingService } from '@/protected-core/[path]';

// Integration pattern:
[Show how new code uses existing protected-core]
```

**Existing Code Modifications**:
```
Files to modify:
1. [file-path] - [What changes] - [Why]
2. [file-path] - [What changes] - [Why]
```

### 3. Technology Stack

**Packages/Libraries** (from Context7 research):
```
1. [Package@version] - [Purpose] - [Why this version]
2. [Package@version] - [Purpose] - [Why this version]
```

**Patterns to Use** (from 2025 web research):
```
1. [Pattern Name] - [Source/URL] - [Why chosen]
2. [Pattern Name] - [Source/URL] - [Why chosen]
```

---

## 📝 DETAILED IMPLEMENTATION ROADMAP

### Step 1: [First Task]
**Duration**: [Estimate]
**Dependencies**: [List]

**Actions**:
1. [Specific action]
2. [Specific action]

**Files Created/Modified**:
- `[file-path]` - [Purpose]

**Verification**:
```bash
# How to verify this step works
[Command to run]
```

### Step 2: [Second Task]
**Duration**: [Estimate]
**Dependencies**: [Step 1, ...]

**Actions**:
1. [Specific action]
2. [Specific action]

**Files Created/Modified**:
- `[file-path]` - [Purpose]

**Verification**:
```bash
# How to verify this step works
[Command to run]
```

[Continue for all steps...]

---

## 🔒 SECURITY PATTERNS

**Security Considerations** (from research):
1. [Security concern] - [Mitigation strategy]
2. [Security concern] - [Mitigation strategy]

**Validation Points**:
```typescript
// Where/how will input validation occur?
[Code pattern]
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
**Files to Create**:
```
tests/
├── [feature]/
│   ├── [test-file].test.ts
│   └── [test-file].test.ts
```

**Test Cases** (minimum):
1. [ ] Happy path
2. [ ] Error cases
3. [ ] Edge cases
4. [ ] Integration with protected-core
5. [ ] Performance benchmarks

### Integration Tests
**What to Test**:
1. [Integration point 1] - [Test scenario]
2. [Integration point 2] - [Test scenario]

### E2E Tests (if applicable)
**Scenarios**:
1. [User workflow 1]
2. [User workflow 2]

---

## 📊 SUCCESS CRITERIA

### Functional Requirements
- [ ] [Requirement 1 from story]
- [ ] [Requirement 2 from story]
- [ ] [Requirement 3 from story]

### Quality Gates
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Test coverage: >80%
- [ ] Protected-core: No violations
- [ ] Performance: [Specific metrics]

### Integration Verification
- [ ] Integrates with protected-core correctly
- [ ] No duplicate code created
- [ ] Existing patterns extended (not replaced)
- [ ] All imports from protected-core verified

---

## ⚠️ RISK MITIGATION

**Identified Risks** (from research):
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | [H/M/L] | [H/M/L] | [Strategy] |
| [Risk 2] | [H/M/L] | [H/M/L] | [Strategy] |

**Rollback Plan**:
```bash
# If implementation fails, how to rollback?
git reset --hard [checkpoint-commit]
```

---

## 🔄 VALIDATION LOOPS

### Checkpoint 1: After Step [N]
**Validate**:
- [ ] TypeScript compiles
- [ ] Tests pass
- [ ] No protected-core violations

### Checkpoint 2: After Step [N]
**Validate**:
- [ ] Integration verified
- [ ] Performance acceptable
- [ ] Security patterns implemented

### Final Checkpoint: Before Completion
**Validate**:
- [ ] All success criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No technical debt created

---

## 📚 IMPLEMENTATION NOTES

### Code Patterns to Follow
```typescript
// Pattern 1: [From context7/web research]
[Code example]

// Pattern 2: [From existing codebase]
[Code example]
```

### Anti-Patterns to Avoid
```typescript
// ❌ DON'T DO THIS:
[Bad pattern from research]

// ✅ DO THIS INSTEAD:
[Good pattern from research]
```

---

## ✅ PLAN APPROVAL CHECKLIST

Before proceeding to IMPLEMENTATION:
- [ ] Research manifest reviewed
- [ ] Architecture decisions justified
- [ ] All integration points identified
- [ ] Testing strategy defined
- [ ] Security patterns specified
- [ ] Success criteria clear
- [ ] Rollback plan exists
- [ ] No duplication of protected-core
- [ ] Follows 2025 best practices

---

## 🚦 IMPLEMENTATION AUTHORIZATION

**Ready to Implement?**: [ ] YES  [ ] NO

**If NO, what needs revision**:
```
[List blockers]
```

**If YES**:
- Research Phase: ✅ COMPLETE
- Planning Phase: ✅ COMPLETE
- Implementation Phase: 🟢 AUTHORIZED

---

## 📝 Approvals

**Plan Created**: [Date/Time]
**Reviewed By**: [Name]
**Approved By**: [Name]
**Signature**: `[PLAN-APPROVED-{story-id}]`

---

**Next Step**: Begin implementation following this plan exactly.
**Enforcement**: PostToolUse validator will verify adherence to this plan.