---
allowed-tools: Bash
argument-hint: [verbose]
description: Comprehensive PingLearn project verification - checks constitutional integrity, violations, duplications, and progress
---

## 🔍 PingLearn Constitutional Verification

Execute comprehensive project verification for attempt #8:

!`bash ~/.claude/scripts/pinglearn-verify.sh $ARGUMENTS`

## Analysis Requested

After running the verification script, analyze the results and provide:

1. **Constitutional Violations Summary**
   - TypeScript errors (must be 0)
   - Protected core violations
   - 'any' type usage violations
   - WebSocket duplication issues

2. **Progress vs Plan Analysis**
   - Compare actual vs planned timeline
   - Identify deviations from MASTER-PLAN.md
   - Check phase completion status

3. **Silent Failures Detection**
   - Unhandled promise rejections
   - Missing error boundaries
   - Uncaught exceptions
   - Test failures being ignored

4. **Evidence-Based Assessment**
   - Provide file paths and line numbers
   - Show actual vs expected states
   - Quantify technical debt

5. **Risk Assessment**
   - Critical issues requiring immediate attention
   - Medium priority improvements
   - Long-term technical debt

Generate a clear, actionable report with specific recommendations.