# PC-014 Forward Path - Single Prompt for Implementation

**Current Reality**: 8-10 stories truly complete (~15-19% progress)
**Next Story**: ERR-006 (Error handling continuation)
**Workflow**: Research→Plan→Implement→Verify→Test→Confirm (ENFORCED)

---

## 🎯 THE PROMPT (Copy This Exactly)

```
PC-014 Story Implementation with Mandatory Workflow Enforcement

CONTEXT:
- Current progress: 15-19% (not 32% - that was inflated)
- Enforcement system: ACTIVE (.research-plan-manifests/templates/)
- Hooks registered: UserPromptSubmit + PostToolUse
- Protected-core: NEVER modify
- Next story: ERR-006 (Advanced error recovery patterns)

INSTRUCTION:
Implement ERR-006 following the MANDATORY 6-phase workflow:

PHASE 1: RESEARCH (BLOCKING - MUST COMPLETE FIRST)
==================
Create: .research-plan-manifests/research/ERR-006-RESEARCH.md

1. **Local Codebase Research**:
   - Search protected-core for existing error patterns
   - Command: `find pinglearn-app/src/protected-core -name "*.ts" | xargs grep -l "error\|recovery\|retry"`
   - Check src/services/voice-session-recovery.ts (ERR-002)
   - Identify integration points with protected-core

2. **Context7 Package Research**:
   - Resolve error handling library IDs
   - Get latest error pattern documentation (2025)
   - Research circuit breaker best practices
   - Document recommended patterns from official sources

3. **Web Research (2025 Best Practices)**:
   - Search: "error recovery patterns 2025 best practices"
   - Search: "circuit breaker pattern TypeScript 2025"
   - Search: "graceful degradation error handling"
   - Find 3+ authoritative sources
   - Note security and performance considerations

4. **Integration Decision**:
   - Can protected-core be extended? (YES/NO with evidence)
   - Can ERR-002 recovery service be enhanced? (YES/NO)
   - What new patterns are needed? (List with justification)

5. **Complete Research**:
   - Add signature: `[RESEARCH-COMPLETE-ERR-006]`

PHASE 2: PLAN (BLOCKING - MUST COMPLETE AFTER RESEARCH)
===========
Create: .research-plan-manifests/plans/ERR-006-PLAN.md

Based on ERR-006 research findings:

1. **Architecture Decisions**:
   - File structure (where code goes)
   - Integration with protected-core (specific APIs)
   - Integration with ERR-002 recovery service
   - Technology stack choices (with justification from research)

2. **Implementation Roadmap**:
   Step 1: [Specific task] - Verification: `[command]`
   Step 2: [Specific task] - Verification: `[command]`
   ...
   (Include git checkpoint after each step)

3. **Testing Strategy**:
   - Unit tests: [What to test, expected coverage %]
   - Integration tests: [Which services to test together]
   - E2E tests: [User scenarios if applicable]

4. **Security Patterns**:
   - Security considerations from research
   - Validation points
   - Input sanitization approach

5. **Success Criteria**:
   - Functional requirements checklist
   - Quality gates: TypeScript 0 errors, coverage >80%
   - Integration verification points

6. **Complete Plan**:
   - Add approval: `[PLAN-APPROVED-ERR-006]`

PHASE 3-5: IMPLEMENT→VERIFY→TEST LOOP (ITERATIVE UNTIL CONDITIONS MET)
===================================
This loop continues until ALL exit conditions are met.

Exit Conditions:
- typescript_errors: 0
- lint_errors: 0
- protected_core_violations: 0
- tests_passing: 100%
- coverage: >80%

MAX ITERATIONS: 5 (escalate to human if exceeded)

### IMPLEMENT Phase:
1. Follow plan roadmap EXACTLY
2. Import from protected-core where needed
3. Extend ERR-002 if applicable
4. Create git checkpoint after each step: `git commit -m "checkpoint: ERR-006 step X"`
5. No 'any' types
6. Add inline comments for complex logic

Hooks will validate:
- Pre-Edit: File mentioned in plan
- Post-Edit: No protected-core duplication, follows plan patterns

### VERIFY Phase:
Run MANDATORY checks:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # MUST pass without errors
```

Check:
- No modifications to protected-core/
- Correct imports from protected-core
- No duplicate patterns created
- Plan adherence (all planned files created)
- Code quality (logic correctness, error handling, edge cases)

If ANY check fails: RETURN TO IMPLEMENT

### TEST Phase:
Run MANDATORY tests:
```bash
npm test [test-file-pattern]  # MUST show 100% passing
npm run test:coverage          # MUST show >80% coverage
```

Create tests for:
- Happy path
- Error cases
- Edge cases
- Integration with protected-core

If ANY test fails: RETURN TO IMPLEMENT

PHASE 6: CONFIRM WITH EVIDENCE (FINAL - BLOCKING)
================================
Create: docs/change_records/protected_core_changes/PC-014-stories/evidence/ERR-006-EVIDENCE.md

Document:
1. **Research Completed** ✅
   - Manifest: [link to ERR-006-RESEARCH.md]
   - Protected-core searched: [results summary]
   - Context7 queries: [documentation used]
   - Web research: [3+ sources cited]
   - Integration decision: [extend vs new with reasoning]

2. **Plan Completed** ✅
   - Manifest: [link to ERR-006-PLAN.md]
   - Roadmap: [summary of steps]
   - Architecture: [decisions made]
   - Tests planned: [list]

3. **Implementation Completed** ✅
   - Files created: [list with line counts]
   - Git commits: [checkpoint hashes]
   - Integration points: [verified with evidence]
   - Iterations: [X of 5 maximum]

4. **Verification Passed** ✅
   - TypeScript: 0 errors (command output)
   - Lint: 0 errors (command output)
   - Protected-core: No violations (grep results)
   - Plan adherence: 100% (all files created)

5. **Tests Passed** ✅
   - Unit tests: X/X passing (coverage: Y%)
   - Integration tests: X/X passing
   - E2E tests: X/X passing (if applicable)
   - Test report: [link or summary]

6. **Final Confirmation** ✅
   - All phases complete
   - All criteria met
   - Story ready for next

ENFORCEMENT ACTIVE:
- UserPromptSubmit hook will BLOCK if research or plan missing
- PostToolUse hook will DELETE code that violates plan or duplicates protected-core
- Verify and Test phases MUST pass before Confirm
- Evidence MUST exist before story marked complete

SUCCESS METRICS:
- Zero TypeScript errors maintained
- No protected-core violations
- No duplicate infrastructure
- 100% test pass rate
- >80% coverage on new code

FAILURE HANDLING:
- If stuck after 3 iterations: Document blocker and escalate
- If hooks block: Complete missing manifest phase
- If tests fail: Fix and re-verify full workflow
- If evidence incomplete: Cannot mark story complete

EXECUTE THIS WORKFLOW WITH ZERO SHORTCUTS.
```

---

## 📋 Workflow Checklist (For Reference)

### Before You Start:
- [ ] Read ERR-006.yaml from `PC-014-stories/error-handling/ERR-006.yaml`
- [ ] Understand story requirements and success criteria
- [ ] Review ERR-002 (voice-session-recovery.ts) as foundation
- [ ] Check STORY-TEMPLATE.yaml for embedded workflow requirements

### Phase 1 Checklist:
- [ ] Search protected-core for existing patterns
- [ ] Use Context7 for latest error handling docs
- [ ] Web search for 2025 best practices
- [ ] Document all findings with evidence
- [ ] Make integration vs new code decision
- [ ] Add `[RESEARCH-COMPLETE-ERR-006]` signature

### Phase 2 Checklist:
- [ ] Architecture decisions based on research
- [ ] Step-by-step implementation roadmap
- [ ] Testing strategy with specific scenarios
- [ ] Security patterns documented
- [ ] Success criteria defined
- [ ] Add `[PLAN-APPROVED-ERR-006]` signature

### Phase 3-5 Checklist (Loop until pass):
- [ ] Implement following plan exactly
- [ ] Git checkpoint after each step
- [ ] Run `npm run typecheck` → 0 errors
- [ ] Run `npm run lint` → passes
- [ ] Check protected-core not modified
- [ ] Run tests → 100% passing
- [ ] Check coverage → >80%
- [ ] If any fail: Fix and repeat loop
- [ ] Max 5 iterations

### Phase 6 Checklist:
- [ ] Create ERR-006-EVIDENCE.md with all proof
- [ ] Link to research and plan manifests
- [ ] Document implementation details
- [ ] Include verification results (TypeScript, lint)
- [ ] Include test results (unit, integration, E2E)
- [ ] Show files created with line counts
- [ ] Confirm integration points working
- [ ] Mark story complete only after evidence exists

---

## 🚫 Common Pitfalls to Avoid

1. **Skipping Research**: Hook will block you - complete research first
2. **Skipping Plan**: Hook will block you - complete plan after research
3. **Deviating from Plan**: PostToolUse hook will delete violating code
4. **Duplicating Protected-Core**: Hook will detect and delete
5. **Using 'any' Types**: Not allowed in strict TypeScript
6. **Marking Complete Without Evidence**: Not allowed - evidence required
7. **Accepting TypeScript Errors**: Must fix - zero tolerance
8. **Skipping Tests**: Loop won't complete - tests must pass

---

## 🎯 Expected Outcome

After completing ERR-006 with this workflow:

✅ Research manifest exists with signatures
✅ Plan manifest exists with approval
✅ Implementation follows plan exactly
✅ TypeScript: 0 errors
✅ Tests: 100% passing, >80% coverage
✅ Evidence document complete
✅ No protected-core modifications
✅ No duplicate infrastructure
✅ Story verifiably complete

Progress: 16-20% → 18-22% (one legitimate story added)

---

## 📞 When to Ask for Help

- After 3 failed Implement→Verify→Test iterations
- If hooks block and you don't understand why
- If ERR-006 requirements conflict with protected-core boundaries
- If evidence is unclear or incomplete
- If TypeScript errors seem unfixable

**DO NOT**:
- Skip phases to "save time"
- Mark story complete without all 6 phases
- Create code that duplicates protected-core
- Claim files exist that don't
- Fabricate evidence

---

**This is the new standard. Every story follows this workflow. No exceptions.**