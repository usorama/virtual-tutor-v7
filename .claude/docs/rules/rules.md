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