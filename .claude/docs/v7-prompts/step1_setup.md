# Step 1: Project Setup and Cleanup

## Objective
Clean up the existing codebase and establish a structured foundation for Virtual Tutor v7.

## Context
- This is attempt #7 after 6 failures due to lack of structure
- Project path: `/Users/umasankrudhya/Projects/vt-new-2/`
- Existing textbooks: `/Users/umasankrudhya/Projects/vt-new-2/text-books/`

## Tasks

### Task 1: Codebase Cleanup
1. Create `.archive/` directory with timestamp (e.g., `.archive/2025-01-17/`)
2. Move all folders to archive EXCEPT:
   - `.claude/` (but only keep: `agents/`, `docs/`, `commands/`, `hooks/` inside it)
   - `text-books/`
   - `app/` (will be renamed in next step)
3. Rename `app/` folder to `vt-app-legacy/` for reference
4. Create new `vt-app/` folder as clean workspace

### Task 2: Create Rules Documentation
Create `/.claude/docs/rules/rules.md` with:

```markdown
# Development Rules for Virtual Tutor v7

## Core Principles
1. NO ASSUMPTIONS: Always ask for clarification when unclear
2. NO HALLUCINATIONS: Only use documented APIs and patterns
3. NO OVER-ENGINEERING: Build exactly what's specified, nothing more
4. STRICT TYPING: Never use 'any' type in TypeScript

## Development Workflow
1. RESEARCH PHASE (Mandatory)
   - Check local documentation in .claude/docs/
   - Review existing codebase patterns
   - Search web for implementation patterns
   - Document findings before coding

2. PLANNING PHASE (Mandatory)
   - Define Specifications (user-approved)
   - Define Definition of Done (DoD)
   - Define Success Criteria (SC)
   - Get explicit user approval before implementation

3. IMPLEMENTATION PHASE
   - Follow approved specifications exactly
   - Ask questions when blocked
   - No scope expansion without approval

## Testing Requirements
1. Before feature completion:
   - Unit tests (min 80% coverage)
   - Integration tests for APIs
   - End-to-end tests with Playwright
   
2. Before moving to next priority:
   - Full regression test suite
   - Manual user acceptance
   - Documented test results

## Communication Protocol
1. Start each session by reading:
   - /claude.md
   - /.claude/docs/rules/rules.md
   - Current feature specifications
   
2. Before any implementation:
   - Summarize understanding
   - List assumptions to validate
   - Get explicit "proceed" confirmation
```

### Task 3: Create Root Documentation
Create `/claude.md` with:

```markdown
# Virtual Tutor v7 - Project Overview

## CRITICAL: Read These First
1. /.claude/docs/rules/rules.md - Development rules (MANDATORY)
2. /.claude/docs/prv/tech-stack.md - Technology decisions
3. /vt-app/claude.md - Current implementation status

## Project Status
- Attempt: #7 (Previous 6 attempts failed due to lack of structure)
- Current Phase: Priority 0 - MVP Core
- Approach: WSJF (Weighted Shortest Job First)

## Feature Priorities

### PRIORITY 0 - MVP Core (Current Focus)
1. Class Selection Wizard - Student onboarding flow
2. AI Classroom - LiveKit voice integration
3. Textbook Processing - PDF ingestion system
4. Mode: One-on-one tutoring ONLY

### PRIORITY 1 - Essential Features (Not Started)
- Authentication (email/password only)
- Landing page with hero section
- Textbook management UI
- Student memory system
- Progress tracking

### PRIORITY 2 - Enhancements (Not Started)
- COPPA/FERPA compliance
- Multi-language support
- Parental controls
- Personalization features

## Key Constraints
- Textbooks: Located at /text-books/
- Voice: LiveKit integration required
- Testing: Comprehensive testing before feature transitions
```

### Task 4: Create App Documentation
Create `/vt-app/claude.md` with:

```markdown
# Virtual Tutor App - Implementation Guide

## Current Status
Phase: 0 - Setup
Task: Initial scaffolding
Status: Not Started

## Implementation Phases

### Phase 0: Foundation Setup
- [ ] Next.js scaffolding
- [ ] Database schema design
- [ ] API structure setup
- [ ] Component library setup

### Phase 1: Class Selection Wizard
[Detailed in /vt-app/docs/phases/phase-1.md]

### Phase 2: AI Classroom
[Detailed in /vt-app/docs/phases/phase-2.md]

### Phase 3: Textbook Processing
[Detailed in /vt-app/docs/phases/phase-3.md]

## File Structure
See: /vt-app/docs/architecture/file-structure.md

## Task Breakdown
See: /vt-app/docs/tasks/sprint-1.md
```

### Task 5: Tech Stack Validation
1. Read `/.claude/docs/prv/tech-stack.md`
2. List all chosen technologies
3. Confirm each technology supports Priority 0 requirements
4. Flag any potential compatibility issues

## Deliverables Checklist
- [ ] Codebase cleaned and archived
- [ ] `vt-app/` folder created
- [ ] Rules documentation created
- [ ] Root claude.md created
- [ ] App-specific claude.md created
- [ ] Tech stack validated

## DO NOT
- Start any implementation
- Install any packages
- Write any application code
- Create any UI components

## Confirmation Required
After completing all tasks, provide:
1. List of archived folders
2. New folder structure
3. Created documentation files
4. Tech stack validation results

Then ask: "Setup complete. Should I proceed to Step 2: Planning?"