# Mandatory 6-Phase Workflow Checklist
**Version**: 1.0
**Status**: MANDATORY FOR ALL STORY IMPLEMENTATION
**Enforcement**: UserPromptSubmit + PostToolUse hooks

---

## 🎯 Quick Reference

**Workflow**: Research → Plan → Implement → Verify → Test → Confirm
**Loop**: Implement→Verify→Test iterates until all conditions met (max 5 iterations)
**Manifests**: `.research-plan-manifests/research/` and `.research-plan-manifests/plans/`
**Evidence**: `docs/change_records/protected_core_changes/PC-014-stories/evidence/`

---

## ✅ PHASE 1: RESEARCH (BLOCKING)

**Create**: `.research-plan-manifests/research/[STORY-ID]-RESEARCH.md`

### Research Requirements:

- [ ] **Local Codebase Research**
  ```bash
  # Search protected-core for existing patterns
  find pinglearn-app/src/protected-core -name "*.ts" | xargs grep -l "[pattern]"

  # Check for similar functionality
  grep -r "[functionality]" pinglearn-app/src/
  ```
  - Document what already exists
  - Identify integration points
  - Note any duplication concerns

- [ ] **Context7 Package Research**
  ```bash
  # Resolve library ID
  mcp__context7__resolve-library-id --libraryName "[package]"

  # Get latest documentation
  mcp__context7__get-library-docs --context7CompatibleLibraryID "[id]"
  ```
  - Get latest official docs (2025)
  - Extract best practices and patterns
  - Note breaking changes from 2024
  - Document recommended approach

- [ ] **Web Research (2025 Best Practices)**
  ```bash
  # Search for industry standards
  WebSearch: "[technical query] 2025 best practices"
  ```
  - Find 3+ authoritative sources
  - Identify known issues and anti-patterns
  - Security and performance considerations
  - Compare with existing approach

- [ ] **Integration Decision**
  - Can protected-core be extended? (YES/NO + evidence)
  - Can existing services be enhanced? (YES/NO + evidence)
  - What new patterns are needed? (List with justification)
  - Decision documented with reasoning

- [ ] **Complete Research Phase**
  - All sections filled with evidence
  - Integration decision made and justified
  - Add signature: `[RESEARCH-COMPLETE-{story-id}]`

**Verification**: Hook will block if signature missing

---

## ✅ PHASE 2: PLAN (BLOCKING)

**Create**: `.research-plan-manifests/plans/[STORY-ID]-PLAN.md`

### Planning Requirements:

- [ ] **Architecture Decisions** (based on research findings)
  - File structure (where code goes)
  - Integration with protected-core (specific APIs)
  - Technology stack choices (with justification)
  - Why this approach over alternatives

- [ ] **Implementation Roadmap**
  ```
  Step 1: [Specific task]
    - Verification: `[command to verify]`
    - Checkpoint: `git commit -m "checkpoint: Step 1"`

  Step 2: [Specific task]
    - Verification: `[command to verify]`
    - Checkpoint: `git commit -m "checkpoint: Step 2"`
  ```
  - Clear numbered steps
  - Dependencies between steps
  - Verification for each step
  - Git checkpoints after each

- [ ] **Testing Strategy**
  - Unit tests: What to test + expected coverage %
  - Integration tests: Which services to test together
  - E2E tests: User scenarios (if applicable)
  - Specific test scenarios documented

- [ ] **Security Patterns**
  - Security considerations from research
  - Validation points
  - Input sanitization approach
  - Threat model if applicable

- [ ] **Success Criteria**
  - Functional requirements checklist
  - Quality gates: TypeScript 0 errors, coverage >80%
  - Integration verification points
  - Performance requirements if applicable

- [ ] **Complete Plan Phase**
  - All sections completed
  - Based on research findings
  - Clear implementation steps
  - Add approval: `[PLAN-APPROVED-{story-id}]`

**Verification**: Hook will block if signature missing

---

## ✅ PHASE 3-5: IMPLEMENT→VERIFY→TEST LOOP

**Loop continues until ALL exit conditions met (max 5 iterations)**

### Exit Conditions:
- TypeScript errors: 0
- Lint errors: 0
- Protected-core violations: 0
- Tests passing: 100%
- Coverage: >80%

---

### IMPLEMENT Phase

- [ ] **Follow Plan Exactly**
  - Implement per roadmap steps
  - Follow researched patterns
  - Use protected-core integration points
  - Create checkpoint after each step

- [ ] **Code Quality Standards**
  - No 'any' types (use proper types)
  - Import from protected-core where needed
  - Follow established patterns
  - Add inline comments for complex logic

- [ ] **Git Checkpoints**
  ```bash
  git commit -m "checkpoint: [STORY-ID] step X - [description]"
  ```

- [ ] **Hooks Validation**
  - Pre-Edit: File mentioned in plan
  - Post-Edit: No protected-core duplication
  - Post-Edit: Follows plan patterns

**If hooks block**: Review plan, ensure file is planned

---

### VERIFY Phase

- [ ] **TypeScript Verification** (MANDATORY)
  ```bash
  npm run typecheck  # MUST show: 0 errors
  ```
  - Zero errors required
  - No 'any' types allowed
  - All imports resolve correctly

- [ ] **Lint Verification** (MANDATORY)
  ```bash
  npm run lint  # MUST pass
  ```
  - Zero errors required
  - Warnings are acceptable but note them

- [ ] **Protected-Core Compliance**
  - No modifications to `src/protected-core/`
  - Correct imports from protected-core
  - No duplicate patterns created
  - Integration points verified

- [ ] **Plan Adherence**
  - All planned files created
  - Architecture matches plan
  - Integration points implemented
  - No deviation from plan

- [ ] **Code Review**
  - Logic correctness
  - Error handling present
  - Edge cases considered
  - Performance acceptable

**If ANY check fails**: Return to IMPLEMENT phase

---

### TEST Phase

- [ ] **Unit Tests** (MANDATORY)
  ```bash
  npm test [test-file-pattern]  # MUST show 100% passing
  ```
  - Happy path tests
  - Error cases
  - Edge cases
  - Integration with protected-core

- [ ] **Coverage Check** (MANDATORY)
  ```bash
  npm run test:coverage  # MUST show >80%
  ```
  - Coverage above threshold
  - Critical paths covered
  - No untested edge cases

- [ ] **Integration Tests**
  - Test integration points from plan
  - Verify protected-core integration
  - Test data flow
  - Cross-service communication

- [ ] **E2E Tests** (if UI changes)
  ```bash
  npm run test:e2e  # If applicable
  ```
  - User workflow scenarios
  - Real browser testing
  - Visual regression (if applicable)

- [ ] **Performance Tests** (if performance critical)
  - Benchmark critical operations
  - Memory usage acceptable
  - No regressions

**If ANY test fails**: Return to IMPLEMENT phase

---

### Loop Control

- [ ] **Iteration Count**: Track current iteration (X of 5)
- [ ] **Exit Check**: All conditions met?
  - TypeScript: 0 errors ✅
  - Lint: 0 errors ✅
  - Protected-core: No violations ✅
  - Tests: 100% passing ✅
  - Coverage: >80% ✅

**If all pass**: Proceed to CONFIRM phase
**If any fail**: Increment iteration and return to IMPLEMENT
**If iteration >= 5**: Document blocker, escalate to human

---

## ✅ PHASE 6: CONFIRM WITH EVIDENCE (FINAL)

**Create**: `docs/change_records/protected_core_changes/PC-014-stories/evidence/[STORY-ID]-EVIDENCE.md`

### Evidence Requirements:

- [ ] **Research Completed** ✅
  - Link: `.research-plan-manifests/research/[STORY-ID]-RESEARCH.md`
  - Protected-core searched: [Results summary]
  - Context7 queries: [Documentation used]
  - Web research: [3+ sources cited]
  - Integration decision: [With reasoning]

- [ ] **Plan Completed** ✅
  - Link: `.research-plan-manifests/plans/[STORY-ID]-PLAN.md`
  - Roadmap: [Summary of steps]
  - Architecture: [Decisions made]
  - Tests planned: [List]

- [ ] **Implementation Completed** ✅
  - Files created: [List with line counts]
  - Git commits: [Checkpoint commit hashes]
  - Integration points: [Verified with evidence]
  - Iterations: [X of 5 maximum]
  - Deviations: [None or documented with approval]

- [ ] **Verification Passed** ✅
  ```bash
  # Include actual command output
  $ npm run typecheck
  > tsc --noEmit
  # 0 errors

  $ npm run lint
  # Passed
  ```
  - TypeScript: 0 errors (output included)
  - Lint: 0 errors (output included)
  - Protected-core: No violations (grep results)
  - Plan adherence: 100% (all files match plan)

- [ ] **Tests Passed** ✅
  ```bash
  # Include test results
  $ npm test
  # X/X tests passing
  # Coverage: Y%
  ```
  - Unit tests: X/X passing (coverage: Y%)
  - Integration tests: X/X passing
  - E2E tests: X/X passing (if applicable)
  - All tests green, no skipped tests

- [ ] **Final Confirmation** ✅
  - All phases complete
  - All checkpoints passed
  - All success criteria met
  - Documentation updated
  - Git committed and pushed
  - Ready for next story

**Verification**: Cannot mark story complete without this evidence

---

## 🚫 Common Pitfalls & Solutions

### "Hook is blocking my implementation"
**Problem**: UserPromptSubmit hook blocks when trying to implement
**Solution**: Complete the missing manifest
- Missing research? Create `[STORY-ID]-RESEARCH.md` with signature
- Missing plan? Create `[STORY-ID]-PLAN.md` with approval

### "My file was deleted after I wrote it"
**Problem**: PostToolUse hook deleted the file
**Solution**: Check violations
- Does code duplicate protected-core? → Use existing patterns
- Does code match plan? → Update plan or fix code
- Is plan manifest complete? → Add `[PLAN-APPROVED-{id}]`

### "TypeScript errors won't go away"
**Problem**: Cannot proceed to TEST phase with errors
**Solution**: Fix errors, don't bypass
- Check imports are correct
- Verify types are defined
- No 'any' types allowed
- Use existing types from protected-core/manifests

### "Tests keep failing"
**Problem**: Stuck in Implement→Verify→Test loop
**Solution**:
- Review test failures carefully
- Check test scenarios match implementation
- Verify mocks and fixtures
- Document blocker if stuck after 3 iterations

### "I'm on iteration 5 and still failing"
**Problem**: Exceeded maximum iterations
**Solution**: **STOP and escalate**
- Document the blocker
- Include error messages
- Describe what's been tried
- Ask for human review

---

## 📋 Quick Start Checklist

Before starting ANY story:

- [ ] Read story YAML from `PC-014-stories/[category]/[STORY-ID].yaml`
- [ ] Understand requirements and success criteria
- [ ] Review related completed stories (dependencies)
- [ ] Check STORY-TEMPLATE.yaml for workflow structure
- [ ] Verify hooks are registered in `~/.claude/settings.json`

Then follow the 6 phases in order. No shortcuts.

---

## 🎯 Success Metrics

After completing workflow correctly:

✅ Research manifest exists with evidence and signature
✅ Plan manifest exists with approval
✅ Implementation matches plan exactly
✅ TypeScript: 0 errors
✅ Lint: passes
✅ Tests: 100% passing, >80% coverage
✅ Evidence document complete with proof
✅ No protected-core modifications
✅ No duplicate infrastructure
✅ Story verifiably complete

---

## 📞 When to Escalate

Escalate to human when:
- After 3 failed Implement→Verify→Test iterations
- Hooks block and you don't understand why
- Story requirements conflict with protected-core boundaries
- Evidence is unclear or you can't gather it
- TypeScript errors seem unfixable
- Tests fail inexplicably

**DO NOT**:
- Skip phases to "save time" ❌
- Mark story complete without all 6 phases ❌
- Create code that duplicates protected-core ❌
- Claim files exist that don't ❌
- Fabricate evidence ❌

---

**This is the standard. Every story follows this workflow. No exceptions.**

**Version**: 1.0 | **Last Updated**: 2025-09-30 | **Status**: MANDATORY