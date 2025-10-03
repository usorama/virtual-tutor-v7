# TYPE-SAFETY-001 Execution Checklist

**Story**: Systematic Elimination of All 'Any' Types
**Baseline**: 166 'any' types → Target: 0 'any' types
**Duration**: 6-8 days (phased approach)
**Branch**: phase-3-stabilization-uat

---

## 📋 Pre-Execution Setup

### Environment Verification
- [ ] Read baseline report: `.type-safety-initiative/BASELINE-REPORT.md`
- [ ] Verify current state:
  ```bash
  npm run typecheck  # Must show: 0 errors
  npm test          # Must show: All tests passed
  grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l
  # Must show: 166
  ```
- [ ] Create initial checkpoint:
  ```bash
  git commit -am "checkpoint: Before Phase 3 'any' type elimination (baseline: 166)"
  git push origin phase-3-stabilization-uat
  ```
- [ ] Set up progress tracking:
  ```bash
  touch .type-safety-initiative/DAILY-PROGRESS.md
  touch .type-safety-initiative/WEEKLY-SUMMARY.md
  touch .type-safety-initiative/ATTEMPTS.md
  touch .type-safety-initiative/BLOCKED-FILES.md
  ```

### Tools Verification
- [ ] Verify tools installed:
  ```bash
  npx type-coverage --version  # Should show version
  npx oxlint --version        # Should show version
  npm list zod                # Should show installed
  npm list type-fest          # Should show installed
  ```

---

## 🚀 Phase 1: Type Libraries & Database (Est. 2 days)

**Goal**: Eliminate 31 'any' types from foundational type libraries
**Impact**: Improved type inference across entire codebase

### File 1: src/lib/types/utility-types.ts (13 'any' → 0)

- [ ] **Pre-conversion checkpoint**:
  ```bash
  git commit -am "checkpoint: Before utility-types.ts (13 'any')"
  ```

- [ ] **Analyze 'any' usage**:
  ```bash
  grep -n ": any" src/lib/types/utility-types.ts
  # Document patterns found
  ```

- [ ] **Apply Strategy**: Generic constraints + conditional types
  - Replace 'any' with proper generic types
  - Use TypeScript utility types (Partial, Pick, Omit, etc.)
  - Add generic constraints where needed

- [ ] **Validate**:
  ```bash
  npm run typecheck  # Must: 0 errors
  npm run lint       # Must: pass
  npm test          # Must: 100% passing
  git diff src/protected-core/  # Must: no changes
  ```

- [ ] **Commit if validation passes**:
  ```bash
  git commit -am "fix(types): Eliminate 'any' in utility-types.ts (13 → 0)

  - Strategy: Generic constraints + conditional types
  - 'any' eliminated: 13
  - Validation: ✓ typecheck ✓ lint ✓ tests
  - Remaining 'any': 153"
  ```

- [ ] **OR Rollback if validation fails**:
  ```bash
  git reset --hard HEAD~1
  # Try alternative strategy
  # Document attempt in .type-safety-initiative/ATTEMPTS.md
  ```

### File 2: src/lib/types/inference.ts (10 'any' → 0)

- [ ] **Pre-conversion checkpoint**:
  ```bash
  git commit -am "checkpoint: Before inference.ts (10 'any')"
  ```

- [ ] **Analyze 'any' usage**:
  ```bash
  grep -n ": any" src/lib/types/inference.ts
  ```

- [ ] **Apply Strategy**: Proper generic types + type guards
  - Use infer keyword for type inference
  - Add type guard functions
  - Use conditional types for complex inference

- [ ] **Validate**:
  ```bash
  npm run typecheck  # Must: 0 errors
  npm run lint       # Must: pass
  npm test          # Must: 100% passing
  ```

- [ ] **Commit if passes** OR **Rollback if fails**

### File 3: src/lib/supabase/typed-client.ts (8 'any' → 0)

- [ ] **Pre-conversion checkpoint**:
  ```bash
  git commit -am "checkpoint: Before typed-client.ts (8 'any')"
  ```

- [ ] **Analyze 'any' usage**:
  ```bash
  grep -n ": any" src/lib/supabase/typed-client.ts
  ```

- [ ] **Apply Strategy**: Supabase generated types + Zod schemas
  - Import Database types from database.types.ts
  - Use Table Row/Insert/Update types
  - Add Zod schemas for runtime validation

- [ ] **Validate**:
  ```bash
  npm run typecheck  # Must: 0 errors
  npm run lint       # Must: pass
  npm test          # Must: 100% passing
  ```

- [ ] **Commit if passes** OR **Rollback if fails**

### Phase 1 Completion

- [ ] **Verify phase goals met**:
  ```bash
  # Should show 135 (166 - 31)
  grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l
  ```

- [ ] **Generate phase report**:
  ```bash
  npx type-coverage --detail > .type-safety-initiative/phase-1-coverage.txt
  ```

- [ ] **Update progress**:
  ```bash
  cat >> .type-safety-initiative/DAILY-PROGRESS.md << EOF

  ### Phase 1 Complete ($(date +%Y-%m-%d))
  - 'any' eliminated: 31
  - Remaining: 135
  - Files processed: 3
  - Strategy: Generic constraints, Supabase types
  EOF
  ```

- [ ] **Push changes**:
  ```bash
  git push origin phase-3-stabilization-uat
  ```

---

## 🧪 Phase 2: Test Utilities (Est. 3 days)

**Goal**: Eliminate 43 'any' types from test infrastructure
**Impact**: Better test type safety and IntelliSense

### File 4: src/tests/utils/integration-helpers.ts (19 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Generic mock types + testing library types
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### File 5: src/tests/utils/error-handling-utilities.test.ts (14 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Mock types from testing libraries
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### File 6: src/tests/utils/enhanced-integration-helpers.ts (10 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Generic helpers + typed mocks
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### Phase 2 Completion

- [ ] **Verify phase goals met**:
  ```bash
  # Should show 92 (135 - 43)
  grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l
  ```

- [ ] **Generate phase report**:
  ```bash
  npx type-coverage --detail > .type-safety-initiative/phase-2-coverage.txt
  ```

- [ ] **Update progress** and **Push changes**

---

## 🧩 Phase 3: Component Tests (Est. 2 days)

**Goal**: Eliminate ~60 'any' types from component test mocks
**Impact**: More reliable component tests

### File 7: src/tests/components/ContentManagementDashboard.test.tsx (18 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Component mock types
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### File 8: src/tests/typescript/advanced-patterns.test.ts (7 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Test-specific types
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### File 9: src/tests/mocks/protected-core.ts (5 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Mock service types
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### File 10: src/tests/performance/load-testing.test.ts (4 'any' → 0)

- [ ] **Pre-conversion checkpoint**
- [ ] **Analyze 'any' usage**
- [ ] **Apply Strategy**: Performance test types
- [ ] **Validate**: typecheck + lint + tests
- [ ] **Commit if passes** OR **Rollback if fails**

### Files 11-16: Remaining component tests (~26 'any' → 0)

- [ ] For each file:
  - [ ] Pre-conversion checkpoint
  - [ ] Analyze 'any' usage
  - [ ] Apply appropriate strategy
  - [ ] Validate
  - [ ] Commit OR Rollback

### Phase 3 Completion

- [ ] **Verify phase goals met**:
  ```bash
  # Should show ~32 (92 - 60)
  grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l
  ```

- [ ] **Generate phase report**:
  ```bash
  npx type-coverage --detail > .type-safety-initiative/phase-3-coverage.txt
  ```

- [ ] **Update progress** and **Push changes**

---

## 🎯 Phase 4: Remaining Files (Est. 1 day)

**Goal**: Eliminate final ~32 'any' types
**Impact**: 100% type safety coverage

### Production Code Files (3 files, 8 'any' → 0)

- [ ] For each production file:
  - [ ] Pre-conversion checkpoint
  - [ ] Analyze 'any' usage
  - [ ] Apply proper business logic types
  - [ ] Validate
  - [ ] Commit OR Rollback

### Test Helper Files (8 files, 12 'any' → 0)

- [ ] For each helper file:
  - [ ] Pre-conversion checkpoint
  - [ ] Analyze 'any' usage
  - [ ] Apply generic test utilities
  - [ ] Validate
  - [ ] Commit OR Rollback

### Type Test Files (5 files, 6 'any' → 0)

- [ ] For each type test file:
  - [ ] Pre-conversion checkpoint
  - [ ] Analyze 'any' usage
  - [ ] Apply test-specific types
  - [ ] Validate
  - [ ] Commit OR Rollback

### Miscellaneous Files (10 files, 6 'any' → 0)

- [ ] For each misc file:
  - [ ] Pre-conversion checkpoint
  - [ ] Analyze 'any' usage
  - [ ] Apply file-specific strategy
  - [ ] Validate
  - [ ] Commit OR Rollback

### Phase 4 Completion

- [ ] **Verify final goal met**:
  ```bash
  # MUST show: 0
  grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l
  ```

- [ ] **Generate final report**:
  ```bash
  npx type-coverage --detail > .type-safety-initiative/phase-4-coverage-FINAL.txt
  ```

- [ ] **Update progress** and **Push changes**

---

## ✅ Final Validation & Evidence Collection

### Final Validation Suite

- [ ] **Verify zero 'any' types**:
  ```bash
  # MUST return: 0
  grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l
  ```

- [ ] **Verify type coverage ≥99%**:
  ```bash
  npx type-coverage
  # Must show: ≥99%
  ```

- [ ] **Verify TypeScript compilation**:
  ```bash
  npm run typecheck
  # Must show: "0 errors"
  ```

- [ ] **Verify linting**:
  ```bash
  npm run lint
  # Must pass with 0 errors
  ```

- [ ] **Verify all tests passing**:
  ```bash
  npm test
  # Must show: "All tests passed"
  ```

- [ ] **Verify protected core integrity**:
  ```bash
  grep -r ": any" src/protected-core --include="*.ts" --include="*.tsx"
  # Must show: No output (still clean)
  ```

- [ ] **Verify build success**:
  ```bash
  npm run build
  # Must complete successfully
  ```

### Evidence Document Creation

- [ ] **Create evidence file**:
  ```bash
  touch .type-safety-initiative/TYPE-SAFETY-001-EVIDENCE.md
  ```

- [ ] **Document baseline metrics**:
  - Before: 166 'any', 97.25% coverage
  - After: 0 'any', [FINAL]% coverage

- [ ] **Document phase-by-phase completion**:
  - Phase 1: 31 'any' eliminated
  - Phase 2: 43 'any' eliminated
  - Phase 3: 60 'any' eliminated
  - Phase 4: 32 'any' eliminated

- [ ] **Document strategies used**:
  - List all type inference strategies
  - Success rates per strategy
  - Challenges encountered

- [ ] **Include validation results**:
  - TypeScript output
  - Lint results
  - Test results
  - Type coverage report

- [ ] **Document blocked files** (if any):
  - List files that couldn't be converted
  - Reasons for blocking
  - Alternative approaches tried

- [ ] **Include git log**:
  ```bash
  git log --oneline --grep="fix(types)" > .type-safety-initiative/commits.txt
  ```

- [ ] **Impact assessment**:
  - Developer experience improvements
  - Code quality metrics
  - Before/after comparison

### Final Updates

- [ ] **Update baseline report**:
  - Mark initiative as complete
  - Update final metrics
  - Add completion date

- [ ] **Update CLAUDE.md** (if needed):
  - Note type safety achievement
  - Update project status

- [ ] **Create completion commit**:
  ```bash
  git commit -am "feat(types): Complete 'any' type elimination initiative

  - Baseline: 166 'any' types
  - Final: 0 'any' types
  - Type coverage: 97.25% → [FINAL]%
  - Duration: [X] days
  - All validations passed
  - Evidence: .type-safety-initiative/TYPE-SAFETY-001-EVIDENCE.md"
  ```

- [ ] **Final push**:
  ```bash
  git push origin phase-3-stabilization-uat
  ```

---

## 🚨 Troubleshooting & Rollback Procedures

### If Validation Fails

**Immediate Actions**:
1. [ ] Rollback: `git reset --hard HEAD~1`
2. [ ] Verify rollback: `npm run typecheck && npm test`
3. [ ] Document attempt in `.type-safety-initiative/ATTEMPTS.md`
4. [ ] Analyze failure reason
5. [ ] Try alternative strategy

### If File Blocked After 3 Attempts

1. [ ] Document in `.type-safety-initiative/BLOCKED-FILES.md`:
   ```markdown
   ## [filename] (Blocked)
   - Attempts: 3
   - Strategies tried: [list]
   - Blocking issue: [description]
   - 'any' count: [count]
   - Date: [date]
   ```

2. [ ] Add to skip list: `echo "[filename]" >> .type-safety-initiative/SKIP-LIST.txt`
3. [ ] Continue with next file

### If Phase Needs Rollback

1. [ ] Find last phase checkpoint: `git log --oneline | grep "Phase"`
2. [ ] Rollback: `git reset --hard [commit-hash]`
3. [ ] Analyze pattern issue
4. [ ] Adjust strategy
5. [ ] Restart phase

---

## 📊 Progress Tracking

### Daily Check (End of Each Day)

- [ ] Count remaining 'any':
  ```bash
  CURRENT=$(grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir="protected-core" | wc -l)
  echo "Remaining: $CURRENT"
  ```

- [ ] Update daily log:
  ```bash
  cat >> .type-safety-initiative/DAILY-PROGRESS.md << EOF

  ### $(date +%Y-%m-%d)
  - Remaining 'any': [count]
  - Eliminated today: [count]
  - Files processed: [count]
  - Phase: [current]
  EOF
  ```

### Weekly Check (End of Each Week)

- [ ] Generate coverage report:
  ```bash
  npx type-coverage --detail > .type-safety-initiative/weekly-$(date +%Y-%m-%d)-coverage.txt
  ```

- [ ] Update weekly summary:
  ```bash
  cat >> .type-safety-initiative/WEEKLY-SUMMARY.md << EOF

  ## Week of $(date +%Y-%m-%d)
  - 'any' eliminated: [count]
  - Type coverage: [%]
  - Challenges: [list]
  EOF
  ```

---

## 🎉 Story Completion Criteria

### All Must Be True

- [x] 'any' count = 0 (verified)
- [x] Type coverage ≥99% (verified)
- [x] TypeScript errors = 0 (verified)
- [x] All tests passing (verified)
- [x] Protected core integrity maintained (verified)
- [x] Build successful (verified)
- [x] Evidence document created (complete)
- [x] Baseline report updated (complete)
- [x] All changes committed and pushed (complete)

### Story Status Update

- [ ] Mark TYPE-SAFETY-001 as COMPLETE
- [ ] Update progress tracking: `echo "TYPE-SAFETY-001: ✅ Complete ($(date +%Y-%m-%d))" >> .research-plan-manifests/STORY-TRACKER.txt`

---

**Checklist Last Updated**: October 3, 2025
**Story Status**: Ready for Execution
**Next Action**: Begin Phase 1 when user approves
