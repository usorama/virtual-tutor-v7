# Change Record Template for AI-Assisted Development

**Template Version**: 3.0
**Last Updated**: 2025-09-22
**Based On**: Best practices from PC-001 through PC-008 + 2025 AI governance standards
**Compliance**: ISO 42001:2023, EU AI Act, NIST AI Risk Management Framework

---

## 🚨 CRITICAL: Pre-Change Safety Protocol

**MANDATORY BEFORE ANY CHANGES**: Create a git checkpoint commit
```bash
git add .
git commit -m "checkpoint: Before [CHANGE-ID] - [brief description]

CHECKPOINT: Safety rollback point before implementing [CHANGE-ID]
- [Main change description]
- All current changes staged and committed
- Can rollback to this point if implementation fails

🚨 This commit serves as the rollback point for [CHANGE-ID]"
```

**Checkpoint Hash**: [To be filled after commit]
**Rollback Command**: `git reset --hard [checkpoint-hash]`

---

## Section 1: Change Metadata

**MUST contain**: Complete identification and classification information for tracking and compliance.

⚠️ **IMPORTANT**: Use the EXACT structure below. Do NOT simplify or consolidate the metadata into a single list.

### 1.1 Basic Information
- **Change ID**: [PREFIX-XXX] (e.g., PC-009, FEAT-001, FIX-123)
- **Date**: [YYYY-MM-DD]
- **Time**: [HH:MM TimeZone]
- **Severity**: [CRITICAL | HIGH | MEDIUM | LOW]
- **Type**: [Bug Fix | Feature | Architecture | Integration | Security | Performance]
- **Affected Component**: [Specific file/module/service]
- **Related Change Records**: [List of related change IDs]

### 1.2 Approval Status
- **Approval Status**: [PENDING | APPROVED | REJECTED | DEFERRED]
- **Approval Timestamp**: [To be filled on approval]
- **Approved By**: [Stakeholder name/role]
- **Review Comments**: [Any conditions or notes from reviewer]

### 1.3 AI Agent Information (NEW)
**MUST contain**: Complete AI agent context for reproducibility and audit trail.

- **Primary Agent**: [Agent name/type that initiated change]
- **Agent Version/Model**: [e.g., Claude 3.5 Sonnet, GPT-4]
- **Agent Capabilities**: [What the agent can/cannot do]
- **Context Provided**: [Summary of context given to agent]
- **Temperature/Settings**: [Any relevant AI parameters]
- **Prompt Strategy**: [How the agent was instructed]

**⚠️ EXAMPLE OF CORRECT STRUCTURE:**
```markdown
## Section 1: Change Metadata

### 1.1 Basic Information
- **Change ID**: PC-012
- **Date**: 2025-09-23
- **Time**: 10:00 UTC
- **Severity**: CRITICAL
- **Type**: Bug Fix
- **Affected Component**: LiveKit Service
- **Related Change Records**: PC-011, PC-010

### 1.2 Approval Status
- **Approval Status**: PENDING
- **Approval Timestamp**: [To be filled on approval]
- **Approved By**: [To be filled on approval]
- **Review Comments**: [To be filled during review]

### 1.3 AI Agent Information
- **Primary Agent**: Claude 3.5 Sonnet
- **Agent Version/Model**: claude-opus-4-1-20250805
- **Agent Capabilities**: Code analysis, debugging
- **Context Provided**: Full codebase access
- **Temperature/Settings**: Default
- **Prompt Strategy**: Root cause analysis
```

**❌ INCORRECT (DO NOT DO THIS):**
```markdown
## Section 1: Change Metadata

## Change Metadata  <-- DUPLICATED HEADER
- **Change ID**: PC-012
- **Date**: 2025-09-23
- **Severity**: CRITICAL
... all fields in one list ...
```

---

## Section 2: Change Summary

**MUST contain**: Executive summary that any stakeholder can understand.

### 2.1 One-Line Summary
[Single sentence describing what changes and why]

### 2.2 Complete User Journey Impact
[Describe how this change affects the end user's experience from start to finish]

### 2.3 Business Value
[What business problem this solves or opportunity it creates]

---

## Section 3: Problem Statement & Research

**MUST contain**: Comprehensive analysis demonstrating due diligence and understanding.

### 3.1 Problem Definition
#### Root Cause Analysis
[Detailed explanation of the underlying issue]

#### Evidence and Research
- **Research Date**: [YYYY-MM-DD]
- **Research Duration**: [Time spent researching]
- **Sources Consulted**:
  - [ ] Internal documentation
  - [ ] External documentation (list specific docs/versions)
  - [ ] Similar implementations in codebase
  - [ ] Stack Overflow/GitHub issues
  - [ ] AI model documentation
  - [ ] Industry best practices

#### Current State Analysis
- **Files Analyzed**: [List all files examined]
- **Services Verified**: [External services checked]
- **APIs Tested**: [Any API endpoints tested]
- **Performance Baseline**: [Current metrics if relevant]

### 3.2 End-to-End Flow Analysis
#### Current Flow (Before Change)
1. **User Action**: [What user does]
2. **System Response**: [What happens]
3. **Data Flow**: [How data moves]
4. **Result**: [What user experiences]

#### Problem Points in Current Flow
[Identify exactly where/why flow breaks]

#### Proposed Flow (After Change)
[Same structure as current flow, showing improvements]

---

## Section 4: Dependency Analysis

**MUST contain**: Complete mapping of what this change needs and what needs this change.

### 4.1 Upstream Dependencies
| Dependency | Current Status | Location/Version | Verification Method | Risk Level |
|------------|----------------|------------------|-------------------|------------|
| [Component] | [✅/❌/⚠️] | [Path/Version] | [How verified] | [Low/Medium/High] |

### 4.2 Downstream Dependencies
| Dependent Component | Impact Level | Change Required | Implementation Status |
|-------------------|--------------|-----------------|---------------------|
| [Component] | [None/Low/High] | [Description] | [✅/⚠️/❌] |

### 4.3 External Service Dependencies
- **Service Name**: [e.g., Database, API, Cloud Service]
  - **Connection Method**: [How it connects]
  - **Authentication**: [How it authenticates]
  - **Rate Limits**: [Any limitations]
  - **Fallback Strategy**: [What happens if unavailable]

---

## Section 5: Assumption Validation

**MUST contain**: All assumptions explicitly stated and verified.

### 5.1 Technical Assumptions
| Assumption | Validation Method | Result | Evidence |
|------------|------------------|---------|----------|
| [Statement] | [How validated] | [✅/❌] | [Proof] |

### 5.2 Environmental Assumptions
[Development environment, deployment environment, user environment assumptions]

### 5.3 User Behavior Assumptions
[How we expect users to interact with this change]

---

## Section 6: Proposed Solution

**MUST contain**: Complete technical implementation details with before/after comparisons.

### 6.1 Technical Changes
#### File: [path/to/file]
##### Change 1: [Description]
**Before:**
```[language]
[Original code]
```

**After:**
```[language]
[Modified code]
```

**Justification**: [Why this specific change]

### 6.2 New Files (if any)
[List any new files being created and their purpose]

### 6.3 Configuration Changes
[Any environment variables, config files, or settings changes]

---

## Section 7: Security & Compliance Assessment (NEW)

**MUST contain**: Security validation and regulatory compliance checks.

### 7.1 Security Analysis
- [ ] No hardcoded credentials or secrets
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No unauthorized data exposure
- [ ] Proper input validation
- [ ] Secure error handling

### 7.2 AI-Generated Code Validation
- **Code Scanner Used**: [Tool name/version]
- **Vulnerabilities Found**: [Count and severity]
- **Remediation Applied**: [What was fixed]
- **Residual Risk**: [Any accepted risks]

### 7.3 Compliance Requirements
- **GDPR**: [Applicable/Not Applicable] - [Details]
- **HIPAA**: [Applicable/Not Applicable] - [Details]
- **ISO 42001**: [Compliance notes]
- **Other Standards**: [List any other relevant standards]

---

## Section 8: Risk Assessment & Mitigation

**MUST contain**: Comprehensive risk analysis with specific mitigation strategies.

### 8.1 Implementation Risks
| Risk | Probability | Impact | Mitigation Strategy | Contingency Plan |
|------|------------|--------|-------------------|------------------|
| [Risk] | [L/M/H] | [L/M/H] | [Prevention] | [If occurs] |

### 8.2 User Experience Risks
[Risks to user experience and mitigation]

### 8.3 Technical Debt Assessment
- **Debt Introduced**: [What shortcuts taken]
- **Debt Removed**: [What improved]
- **Net Technical Debt**: [+/- and impact]

---

## Section 9: Testing Strategy

**MUST contain**: Comprehensive testing approach including automated tests for AI agents.

### 9.1 Automated Testing
```bash
# Tests that AI agents should run automatically
[List specific test commands]
```

### 9.2 Manual Testing Checklist
- [ ] Functionality works as expected
- [ ] Edge cases handled
- [ ] Error states handled gracefully
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Accessibility maintained

### 9.3 Integration Testing
[How to verify this change works with rest of system]

### 9.4 Rollback Testing
- [ ] Rollback procedure documented
- [ ] Rollback tested in development
- [ ] Data migration reversible (if applicable)

---

## Section 10: Multi-Agent Coordination (NEW)

**MUST contain**: How multiple AI agents should handle this change.

### 10.1 Agent Handoff Protocol
- **Initial Agent**: [Which agent type should start]
- **Handoff Points**: [When to transfer to another agent]
- **Context Preservation**: [What information must be passed]
- **Completion Criteria**: [When handoff is complete]

### 10.2 Agent Capabilities Required
| Task | Required Agent Type | Capabilities Needed |
|------|-------------------|-------------------|
| [Task] | [Agent type] | [Specific capabilities] |

### 10.3 Inter-Agent Communication
[How agents should share information about this change]

---

## Section 11: Observability & Monitoring (NEW)

**MUST contain**: How to monitor this change post-implementation.

### 11.1 Key Metrics
| Metric | Baseline | Target | Alert Threshold |
|--------|----------|--------|-----------------|
| [Metric] | [Current] | [Goal] | [When to alert] |

### 11.2 Logging Requirements
- **New Log Points**: [What new logging added]
- **Log Level**: [DEBUG/INFO/WARN/ERROR]
- **Retention Period**: [How long to keep logs]

### 11.3 Dashboard Updates
[Any monitoring dashboards that need updating]

---

## Section 12: Implementation Plan

**MUST contain**: Step-by-step implementation with time estimates and checkpoints.

### 12.1 Pre-Implementation Checklist
- [ ] Git checkpoint created
- [ ] Dependencies verified
- [ ] Test environment ready
- [ ] Rollback plan confirmed
- [ ] Stakeholders notified

### 12.2 Implementation Phases
#### Phase 1: [Name] (Estimated: X minutes)
1. [Specific action]
2. [Specific action]
3. [Verification step]

#### Phase 2: [Name] (Estimated: X minutes)
[Continue pattern]

### 12.3 Post-Implementation Checklist
- [ ] All changes committed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Monitoring verified
- [ ] Stakeholders notified

---

## Section 13: Audit Trail & Traceability (NEW)

**MUST contain**: Complete decision trail for regulatory compliance.

### 13.1 Decision Log
| Timestamp | Decision | Rationale | Made By | Confidence |
|-----------|----------|-----------|---------|------------|
| [Time] | [What decided] | [Why] | [Human/AI] | [%] |

### 13.2 AI Reasoning Chain
[Document the AI's reasoning process that led to this solution]

### 13.3 Alternative Solutions Considered
| Alternative | Pros | Cons | Why Not Chosen |
|-------------|------|------|----------------|
| [Solution] | [Benefits] | [Drawbacks] | [Reason] |

---

## Section 14: Knowledge Transfer (NEW)

**MUST contain**: Learnings to improve future AI agent performance.

### 14.1 Patterns Discovered
[Reusable patterns that should be added to AI knowledge base]

### 14.2 Anti-Patterns Identified
[What approaches to avoid in future]

### 14.3 Documentation Updates Required
- [ ] README updates
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Runbook updates
- [ ] AI agent instructions

### 14.4 Training Data Recommendations
[What examples from this change should be used to train future AI models]

---

## Section 15: Approval & Implementation Authorization

**MUST contain**: Clear approval workflow and authorization tracking.

### 15.1 Approval Criteria Checklist
- [ ] All dependencies verified
- [ ] Security assessment complete
- [ ] Risk mitigation approved
- [ ] Testing strategy approved
- [ ] Rollback plan verified
- [ ] Compliance requirements met

### 15.2 Authorization
- **Status**: [PENDING | APPROVED | REJECTED]
- **Authorized By**: [Name/Role]
- **Authorization Date**: [Date/Time]
- **Implementation Window**: [When can be implemented]
- **Special Conditions**: [Any conditions on approval]

---

## Section 16: Implementation Results (Post-Implementation)

**MUST contain**: Actual results vs. expected results.

### 16.1 Implementation Summary
- **Start Time**: [Actual start]
- **End Time**: [Actual end]
- **Duration**: [Actual vs. estimated]
- **Implementer**: [Human/AI agent name]

### 16.2 Verification Results
| Verification Item | Expected | Actual | Status |
|------------------|----------|---------|---------|
| [Item] | [Expected result] | [What happened] | [✅/❌] |

### 16.3 Issues Discovered
| Issue | Resolution | Follow-up Required |
|-------|------------|-------------------|
| [Issue] | [How resolved] | [Yes/No - details] |

### 16.4 Rollback Actions (If Any)
- **Rollback Triggered**: [Yes/No]
- **Reason**: [Why rollback was needed]
- **Rollback Time**: [When]
- **Recovery Actions**: [What was done]

---

## Section 17: Post-Implementation Review

**MUST contain**: Lessons learned and continuous improvement.

### 17.1 Success Metrics
[Were the success criteria met?]

### 17.2 Lessons Learned
- **What Went Well**: [Successes]
- **What Could Improve**: [Areas for improvement]
- **Surprises**: [Unexpected discoveries]

### 17.3 Follow-up Actions
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| [Action] | [Who] | [When] | [L/M/H] |

---

## Template Usage Notes

⚠️ **CRITICAL FORMATTING REQUIREMENTS**:
- **NEVER** duplicate section headers (e.g., don't have "## Section 1" and then "## Change Metadata")
- **ALWAYS** use the three-part metadata structure (1.1, 1.2, 1.3)
- **NEVER** simplify metadata into a single bulleted list
- **COPY** the template structure exactly - don't improvise

### When to Use This Template
- Any change to protected/critical code
- Changes requiring stakeholder approval
- Complex multi-step implementations
- Changes with significant user impact
- AI agent collaborative work
- Compliance-critical modifications

### How to Fill Out
1. **COPY this template exactly** - Do NOT modify the structure
2. **Start with Sections 1-3** before any implementation
   - Section 1: Use ALL three subsections (1.1, 1.2, 1.3)
   - Do NOT consolidate metadata into a simple list
   - Do NOT duplicate section headers
3. **Complete Sections 4-11** during planning
4. **Get approval** via Section 15
5. **Fill Section 12** during implementation
6. **Complete Sections 16-17** after implementation

### Required vs. Optional Sections
- **Required for All Changes**: Sections 1-3, 6, 8, 12, 15, 16
- **Required for AI-Assisted**: Sections 1.3, 10, 13, 14
- **Required for Critical Systems**: All sections
- **Optional for Minor Changes**: Sections 7, 11, 17

### Document Retention
- **Minimum Retention**: 2 years
- **Compliance-Related**: 7 years
- **Incident-Related**: Permanent

---

**End of Template**

*This template ensures comprehensive documentation for AI-assisted development, supporting both human review and AI agent collaboration while maintaining regulatory compliance and enabling safe, reproducible changes.*