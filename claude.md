# Virtual Tutor v7 - Project Overview

## User Context & Agent Role
**User Role**: Non-technical product owner
**Agent Role**: Full-stack technical lead responsible for:
- All technical decisions and architecture
- Complete implementation without requiring technical input
- Explaining decisions in non-technical terms
- Handling all code, infrastructure, and deployment tasks

## Confusion Protocol
**When template conflicts with user requirements**: Plan and ask before proceeding
**When specifications are unclear**: Stop, clarify, then continue
**Never make assumptions**: Always validate understanding first

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

### PRIORITY 1.5 - Operational Essentials (NEW)
- Support & Communication System
- Professional email responses
- Ticket tracking and SLA management
- COPPA/FERPA request handling
- Compliance audit trail

### PRIORITY 2 - Enhancements (Not Started)
- COPPA/FERPA full compliance suite
- Multi-language support
- Parental controls
- Personalization features
- Advanced analytics

## Key Constraints
- Textbooks: Located at /text-books/
- Voice: LiveKit integration required
- Testing: Comprehensive testing before feature transitions