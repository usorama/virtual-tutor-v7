# Research Manifest: [STORY-ID]

**Story**: [Story Title]
**Created**: [Date/Time]
**Researcher**: [Agent/Human Name]
**Status**: 🔬 Research Phase

---

## ✅ MANDATORY RESEARCH PHASES

### Phase 1: Local Codebase Research

**Protected-Core Analysis** (CRITICAL - Check First):
```bash
# Commands executed:
find pinglearn-app/src/protected-core -name "*.ts" | xargs grep -l "<pattern>"

# Results:
[Paste actual results - what files/patterns exist]
```

**Findings**:
- [ ] Similar functionality exists: [Yes/No]
- [ ] Location if exists: [File paths]
- [ ] Can be extended: [Yes/No - Explain]
- [ ] Reason for new code: [If creating new, justify why]

**Existing Patterns Found**:
```typescript
// Paste actual code snippets from protected-core
// Show what already exists
```

---

### Phase 2: Context7 Package Research

**Packages Researched**:
```bash
# Commands executed:
mcp__context7__resolve-library-id --libraryName "<package>"
mcp__context7__get-library-docs --context7CompatibleLibraryID "<id>"
```

**Key Findings from Official Docs** (2025):
1. **Package**: [Name & Version]
   - Current best practice: [From docs]
   - Recommended patterns: [From docs]
   - Breaking changes from 2024: [Any deprecations]

2. **Package**: [Name & Version]
   - Current best practice: [From docs]
   - Recommended patterns: [From docs]

**Code Examples from Docs**:
```typescript
// Paste actual examples from context7
// Show current recommended patterns
```

---

### Phase 3: Web Research (2025 Best Practices)

**Searches Conducted**:
```bash
# Query 1:
WebSearch: "[specific technical query] 2025 best practices"

# Results:
[Top 3 sources with URLs and key takeaways]
```

**Industry Standards (2025)**:
- [ ] Pattern/approach validated: [Yes/No]
- [ ] Known issues identified: [List any]
- [ ] Security considerations: [From research]
- [ ] Performance implications: [From research]

**Comparison with Existing Approach**:
| Aspect | Current (Our Code) | Industry Standard (2025) | Gap? |
|--------|-------------------|--------------------------|------|
| [Aspect 1] | [Our way] | [Standard way] | [Yes/No] |
| [Aspect 2] | [Our way] | [Standard way] | [Yes/No] |

---

## 📋 RESEARCH CONCLUSIONS

### What Exists Already
```
[Summary of what we found in protected-core and existing codebase]
```

### What's Missing
```
[What functionality is genuinely not present]
```

### Integration vs New Code Decision
- [ ] **EXTEND EXISTING**: Can integrate with protected-core
  - Files to modify: [List]
  - Integration points: [Describe]

- [ ] **CREATE NEW**: Justification for new code
  - Why protected-core can't be extended: [Explain]
  - Why existing patterns insufficient: [Explain]
  - Approval required: [ ] Yes

### Risk Assessment
- **Duplication Risk**: [Low/Medium/High] - [Why]
- **Protected-Core Violation Risk**: [Low/Medium/High] - [Why]
- **Complexity Risk**: [Low/Medium/High] - [Why]

---

## ✅ VERIFICATION CHECKLIST

Before proceeding to PLAN phase:
- [ ] Searched protected-core thoroughly
- [ ] Found all existing similar patterns
- [ ] Researched latest docs via context7
- [ ] Validated against 2025 web standards
- [ ] Documented WHY new code is needed
- [ ] Identified all integration points
- [ ] Risk assessment completed

---

## 🚫 BLOCKER STATUS

**Can Proceed to Planning?**: [ ] YES  [ ] NO

**If NO, what's blocking**:
```
[Describe what needs resolution]
```

**If YES, ready for**: `plans/[STORY-ID]-PLAN.md`

---

## 📝 Evidence Trail

**Protected-Core Files Examined**:
```
[List all files checked with grep/find results]
```

**Context7 Queries Log**:
```
[All context7 queries with results summary]
```

**Web Research Sources**:
```
1. [URL] - [Key Finding]
2. [URL] - [Key Finding]
3. [URL] - [Key Finding]
```

---

**Research Completed**: [Date/Time]
**Approved By**: [Name]
**Signature**: `[RESEARCH-COMPLETE-{story-id}]`