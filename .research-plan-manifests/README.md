# Research-Plan-Implement Enforcement System

**Created**: 2025-09-30
**Purpose**: Prevent duplicate infrastructure creation through enforced workflow
**Status**: ✅ ACTIVE AND OPERATIONAL

---

## 🎯 Three-Phase Workflow

This system enforces a mandatory three-phase workflow for all infrastructure code:

```
1. RESEARCH → 2. PLAN → 3. IMPLEMENT
   (Blocked until complete)  (Blocked until complete)  (Validated in real-time)
```

---

## 🔬 Phase 1: RESEARCH (MANDATORY FIRST)

**When**: Before any planning or coding
**Where**: `.research-plan-manifests/research/[STORY-ID]-RESEARCH.md`
**Template**: `templates/RESEARCH-TEMPLATE.md`

**Required Research Activities**:

### 1. Local Codebase Research
```bash
# MUST search protected-core
find pinglearn-app/src/protected-core -name "*.ts" | xargs grep -l "<pattern>"

# MUST check for existing patterns
grep -r "<functionality>" pinglearn-app/src/
```

**Questions to Answer**:
- Does similar functionality already exist?
- Can protected-core be extended instead of creating new?
- What integration points exist?

### 2. Context7 Package Research
```bash
# MUST get latest official docs
mcp__context7__resolve-library-id --libraryName "<package>"
mcp__context7__get-library-docs --context7CompatibleLibraryID "<id>"
```

**Questions to Answer**:
- What's the current best practice (2025)?
- Any breaking changes from 2024?
- Recommended patterns from official docs?

### 3. Web Research (2025 Standards)
```bash
# MUST verify against industry standards
WebSearch: "<technical query> 2025 best practices"
```

**Questions to Answer**:
- Is this approach validated by industry?
- Any known issues or anti-patterns?
- Security/performance considerations?

**Completion Criteria**:
- [ ] All three research types completed
- [ ] Findings documented with evidence
- [ ] Integration vs new code decision made
- [ ] Signature added: `[RESEARCH-COMPLETE-{story-id}]`

---

## 📋 Phase 2: PLAN (After Research Complete)

**When**: After research phase is complete
**Where**: `.research-plan-manifests/plans/[STORY-ID]-PLAN.md`
**Template**: `templates/PLAN-TEMPLATE.md`

**Required Planning Activities**:

### 1. Architecture Decisions
- File structure (based on research findings)
- Integration with protected-core
- Technology stack choices

### 2. Implementation Roadmap
- Step-by-step breakdown
- Dependencies between steps
- Verification for each step

### 3. Testing Strategy
- Unit tests (what to test)
- Integration tests (integration points)
- E2E tests (user workflows)

### 4. Security Patterns
- Security considerations from research
- Validation points
- Input sanitization

### 5. Success Criteria
- Functional requirements
- Quality gates (TypeScript: 0 errors, coverage: >80%)
- Integration verification

**Completion Criteria**:
- [ ] All sections completed
- [ ] Based on research findings
- [ ] Clear implementation steps
- [ ] Signature added: `[PLAN-APPROVED-{story-id}]`

---

## 💻 Phase 3: IMPLEMENT (After Plan Approved)

**When**: Only after both Research and Plan are complete
**How**: Normal coding, but with validation

**Two-Layer Enforcement**:

### Layer 1: User-Prompt-Submit Hook
**Runs**: BEFORE Claude can use tools
**Blocks if**: Research or Plan manifest missing/incomplete
**Hook**: `~/.claude/hooks/research-plan-enforcer.py`

### Layer 2: PostToolUse Validator
**Runs**: AFTER Write/Edit/MultiEdit executes
**Validates**:
- Code matches plan
- No protected-core duplication
- Follows researched patterns

**Action on Violation**: DELETES file + blocks execution
**Hook**: `~/.claude/hooks/post-write-plan-validator.py`

---

## 🚫 What Gets Blocked

### Blocked at Prompt Level:
```
User: "Implement ERR-006 error recovery system"
Claude: 🚫 BLOCKED - Research manifest for ERR-006 not found
```

### Blocked at Write Level:
```
Claude: <creates circuit-breaker.ts>
System: 🚫 BLOCKED - Duplicates protected-core/websocket/retry/
Action: File deleted
```

---

## ✅ How to Use This System

### Starting a New Story (e.g., ARCH-002)

**Step 1: Create Research Manifest**
```bash
cp .research-plan-manifests/templates/RESEARCH-TEMPLATE.md \
   .research-plan-manifests/research/ARCH-002-RESEARCH.md
```

**Step 2: Complete Research**
- Search protected-core for existing patterns
- Use context7 for latest package docs
- Web search for 2025 best practices
- Document all findings with evidence
- Add signature: `[RESEARCH-COMPLETE-ARCH-002]`

**Step 3: Create Plan Manifest**
```bash
cp .research-plan-manifests/templates/PLAN-TEMPLATE.md \
   .research-plan-manifests/plans/ARCH-002-PLAN.md
```

**Step 4: Complete Plan**
- Base decisions on research findings
- Define step-by-step implementation
- Specify testing strategy
- Add approval: `[PLAN-APPROVED-ARCH-002]`

**Step 5: Implement**
```
User: "Implement ARCH-002 following the plan"
Claude: ✅ Both manifests complete, proceeding with implementation...
```

---

## 📊 Enforcement Status

**Active Hooks**:
- ✅ UserPromptSubmit: `research-plan-enforcer.py`
- ✅ PostToolUse: `post-write-plan-validator.py`

**Verification**:
```bash
# Check hooks are registered
cat ~/.claude/settings.json | jq '.hooks'

# Should show:
# - UserPromptSubmit with research-plan-enforcer
# - PostToolUse with post-write-plan-validator
```

---

## 🎓 Why This Exists

**Previous Failure** (Sept 29, 2025):
- 12,790 lines of code written
- 7,038 lines (55%) were duplicate infrastructure
- ARCH-001: Created event-bus, boundaries, service-contracts
  - Protected-core already had contracts/ directory
- ERR-005: Created resilience system (circuit breaker, retry logic)
  - Protected-core already had websocket/retry/exponential-backoff.ts
- Root cause: **Skipped research phase**

**This System Prevents**:
- Creating duplicate infrastructure
- Bypassing protected-core patterns
- Building parallel systems
- Implementing without understanding existing code

---

## 📚 Templates Available

```
.research-plan-manifests/templates/
├── RESEARCH-TEMPLATE.md    # Comprehensive research checklist
└── PLAN-TEMPLATE.md         # PRP-style implementation plan
```

---

## 🔧 Troubleshooting

### "Hook blocking my implementation"
**Solution**: Complete the missing manifest(s). The hook tells you exactly what's needed.

### "I updated the manifest but still blocked"
**Solution**: Add completion signature:
- Research: `[RESEARCH-COMPLETE-{story-id}]`
- Plan: `[PLAN-APPROVED-{story-id}]`

### "File got deleted after I wrote it"
**Solution**: PostToolUse validator found violations. Check:
1. Does code duplicate protected-core?
2. Does code match the plan?
3. Is plan manifest complete?

### "Need to bypass for testing"
**Not recommended**, but if absolutely necessary:
```bash
# Disable hooks temporarily
mv ~/.claude/hooks/research-plan-enforcer.py ~/.claude/hooks/research-plan-enforcer.py.disabled

# Re-enable after testing
mv ~/.claude/hooks/research-plan-enforcer.py.disabled ~/.claude/hooks/research-plan-enforcer.py
```

---

## 📈 Success Metrics

**Prevention Rate**: Files blocked before duplication
**Validation Rate**: Files deleted due to violations
**Compliance Rate**: Stories following full workflow

---

**System Status**: ✅ OPERATIONAL
**Last Updated**: 2025-09-30
**Maintained By**: Claude Code Workflow Automation