# Protected Core Change Decision Framework
**Version**: 1.0
**Created**: 2025-09-21
**Status**: ACTIVE - Mandatory Decision Process for Protected Core Changes

## 🎯 DECISION QUESTION

When considering any modification to `src/protected-core/`, the central question is:

> **"What is the best, most quality efficient long-term solution that also is a permanent fix?"**

## 📋 DECISION CRITERIA & PROCESS

### Evaluation Order (Must Follow This Sequence):

#### 1. **Working Workaround Assessment** (PREFERRED if conditions met)
**Choose this if ALL of the following are true:**
- ✅ Workaround will never break
- ✅ Easy to maintain and remember
- ✅ Minimal code changes required
- ✅ No complex ongoing maintenance burden

#### 2. **Protected Core Change Assessment** (APPROVED PROCESS if workaround fails criteria)
**Choose this if ANY of the following are true:**
- ❌ Maintaining workaround is complex/difficult
- ❌ Remembering workaround creates maintenance burden
- ❌ A lot of code changes needed for workaround to work
- ✅ Core change is simple, efficient, surgical (single focused change)
- ✅ Core change touches nothing other than the specific issue

## 🛡️ PROTECTED CORE CHANGE PROCESS (MANDATORY)

When protected core change is determined necessary:

### Step 1: Create Change Record (REQUIRED)
**Location**: `/docs/change_records/protected_core_changes/PC-XXX-[description].md`

**Required Contents**:
- Change metadata (ID, date, severity, type)
- Problem statement with clear justification
- Exact changes proposed (line-by-line diffs)
- Risk assessment and mitigation
- Verification requirements
- **Approval Status**: PENDING (initially)

### Step 2: Request Approval (BLOCKING)
- Submit change record with **Approval Status: PENDING**
- Request explicit stakeholder review
- **CANNOT PROCEED** without explicit "I approve" statement
- Document approval with system timestamp

### Step 3: Pre-Execution Update (REQUIRED)
- Update change record **Approval Status: APPROVED**
- Add **Approval Timestamp**: [system timestamp]
- Add **Approved By**: Project Stakeholder
- Confirm ready for execution

### Step 4: Execute EXACTLY as Written (STRICT BOUNDARIES)
- Implement ONLY changes specified in approved change record
- **NO DEVIATIONS** allowed - even single character changes require new approval
- **NO SCOPE CREEP** - additional "improvements" require separate change records
- **NO ASSUMPTIONS** - if unclear, stop and seek clarification

### Step 5: Post-Execution Documentation (MANDATORY)
- Update change record with implementation results
- Document verification outcomes
- Record any issues or deviations
- Commit all changes with proper change record reference

## ⚠️ STRICT BOUNDARIES & RULES

### Forbidden Actions:
1. **NEVER** modify protected-core without approved change record
2. **NEVER** exceed scope of approved change record
3. **NEVER** make "quick fixes" or "small improvements" without approval
4. **NEVER** assume stakeholder approval - require explicit confirmation
5. **NEVER** proceed with pending approval status

### Required Actions:
1. **ALWAYS** create change record before requesting approval
2. **ALWAYS** wait for explicit approval before execution
3. **ALWAYS** execute exactly as specified in change record
4. **ALWAYS** document results in same change record
5. **ALWAYS** update approval status and timestamps

## 📁 CHANGE RECORD TEMPLATE STRUCTURE

```markdown
# Protected Core Change Record PC-XXX

## Change Metadata
- **Change ID**: PC-XXX
- **Date**: [creation date]
- **Approval Status**: PENDING
- **Severity**: [CRITICAL|HIGH|MEDIUM|LOW]
- **Type**: [Architecture|Bug Fix|Enhancement]
- **Affected Component**: [specific component]

## Problem Statement
[Clear description of why change is needed]

## Proposed Changes
[Exact line-by-line changes with before/after diffs]

## Risk Assessment
[Risk level and mitigation strategies]

## Verification Requirements
[How to verify change works correctly]

## Approval Record
**Approval Status**: PENDING
**Stakeholder Response**: [awaiting approval]
**System Timestamp**: [when approved]

## Implementation Results
[Post-execution documentation]
```

## 🔍 DECISION EXAMPLES

### Example 1: Simple Workaround (PREFERRED)
**Scenario**: Database type mismatch
**Workaround**: Adapter pattern in feature code
**Assessment**: ✅ Easy to maintain, minimal code, won't break
**Decision**: Use workaround, no protected-core change needed

### Example 2: Complex Workaround (CORE CHANGE JUSTIFIED)
**Scenario**: Session ID format incompatibility
**Workaround**: 47 lines of dual-system tracking
**Assessment**: ❌ Complex maintenance, ❌ Hard to remember, ❌ Lots of code
**Core Change**: Single line UUID generation
**Assessment**: ✅ Simple, ✅ Efficient, ✅ Surgical change
**Decision**: Create change record, request approval, execute core change

## 📚 KNOWLEDGE BASE INTEGRATION

This framework is referenced in:
- **CLAUDE.md**: Primary protection rules
- **Protected Core Documentation**: `src/protected-core/claude.md`
- **Change Record Templates**: `docs/change_records/protected_core_changes/`

## 🚨 EMERGENCY PROCEDURES

If protected-core modification is needed urgently:
1. **NO SHORTCUTS** - still create change record
2. **EXPEDITED APPROVAL** - clearly mark as urgent in request
3. **IMMEDIATE DOCUMENTATION** - document decisions and rationale
4. **POST-REVIEW** - ensure proper change record completion

## ✅ SUCCESS CRITERIA

A successful protected-core change process includes:
- ✅ Proper decision framework followed
- ✅ Approved change record created
- ✅ Exact implementation per approved scope
- ✅ Complete documentation of results
- ✅ No scope creep or unauthorized changes

---

**Remember**: Protected core exists because 7 previous attempts failed. Respect the process, follow the framework, maintain stability.

**This framework ensures quality, maintainability, and stakeholder control while enabling necessary improvements when justified.**