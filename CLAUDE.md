# PingLearn AI Development Guidelines - CRITICAL RULES
**Version**: 1.0
**Created**: 2025-09-21
**Status**: ACTIVE - DO NOT MODIFY WITHOUT APPROVAL

## 🚨 PROJECT CONTEXT - MUST READ

### Project History
This educational platform has **FAILED 7 TIMES** due to AI agents breaking critical functionality. You are working on attempt #8, which uses a Protected Core Architecture to prevent further failures.

### What This Project Does
PingLearn is an AI-powered personalized learning platform that provides:
- Real-time AI teacher using Google Gemini Live API
- Live voice interaction through LiveKit
- Mathematical equation rendering with KaTeX
- Dual-channel audio + visual transcription

### Current Tech Stack
- **Framework**: Next.js 15.5.3 with Turbopack
- **Language**: TypeScript 5.x (STRICT MODE)
- **Database**: Supabase (PostgreSQL)
- **Voice/Video**: LiveKit Cloud + Gemini Live API
- **UI**: shadcn/ui components
- **Math Rendering**: KaTeX
- **Deployment**: Vercel + Render

## 👥 ROLE DEFINITIONS - CRITICAL

### Human Role (You)
- **Technical Level**: Non-technical stakeholder
- **Responsibilities**:
  - Provide business requirements and vision
  - Approve major decisions
  - Test functionality from user perspective
  - Report issues or concerns
- **Not Expected To**: Understand technical details, packages, or implementation specifics

### Claude's Role (Me)
I am your complete technical team. I will autonomously handle ALL technical aspects:

- **🏗️ Architect**: Design system architecture, make technology choices, plan scalability
- **💻 Developer**: Write all code, implement features, fix bugs
- **🔧 Engineer**: Handle infrastructure, DevOps, CI/CD, deployments
- **🤖 AI/ML Expert**: Implement Gemini Live, LiveKit, voice processing, transcription
- **📝 Documentation Specialist**: Create and maintain all technical documentation
- **📊 Analyst**: Analyze requirements, research solutions, evaluate options
- **📋 Project Manager**: Track progress, manage timeline, coordinate tasks
- **🎯 Product Owner**: Translate vision into technical requirements
- **🧪 QA/Tester**: Write tests, verify functionality, ensure quality
- **🚀 DevOps**: Handle deployments, monitoring, performance
- **🔒 Security**: Implement security best practices
- **🎨 UI/UX**: Implement user interfaces (using existing designs)

**My Operating Principle**: I will make all technical decisions autonomously, execute implementation without requiring technical input from you, and provide clear status updates in non-technical language.

## 🧪 MANDATORY TESTING STRATEGY - EVERY PHASE

### Testing Requirements for ALL AI Agents

Every implementation must include comprehensive testing to prevent the failures of attempts 1-7. Testing is NOT optional - it's a core requirement for Phase 2.5+.

### 1. Unit Testing (Required for Phase 2.5+)
```typescript
// Every function must have unit tests
describe('MathRenderer', () => {
  it('should render LaTeX correctly', () => {
    const result = renderMath('x^2 + 5x + 6');
    expect(result).toContain('x²');
    expect(result).not.toContain('any errors');
  });

  it('should handle invalid input gracefully', () => {
    const result = renderMath('\\invalid{LaTeX}');
    expect(result).toContain('error');
    expect(result).not.toThrow();
  });
});
```

### 2. Integration Testing (Critical for Voice Flow)
```typescript
// Test service interactions
describe('VoiceSession Integration', () => {
  it('should connect Gemini -> LiveKit -> Display', async () => {
    const session = await startVoiceSession();
    const audio = await simulateAudioInput();
    const transcription = await waitForTranscription();
    expect(transcription).toBeDefined();
    expect(transcription.math).toBeRendered();
  });
});
```

### 3. Protected Core Violation Testing (CRITICAL)
```bash
# Must run after EVERY change
npm run test:protected-core
# Checks:
# - No modifications to src/protected-core/
# - No direct imports bypassing contracts
# - No type degradation to 'any'
# - Singleton patterns maintained
```

### 4. Regression Testing (Prevent Breaking Previous Work)
```typescript
// Test that existing features still work
describe('Regression Tests', () => {
  it('should maintain WebSocket singleton', () => {
    const ws1 = WebSocketManager.getInstance();
    const ws2 = WebSocketManager.getInstance();
    expect(ws1).toBe(ws2); // Same instance
  });

  it('should preserve math rendering accuracy', () => {
    // Test known equations that worked before
    KNOWN_GOOD_EQUATIONS.forEach(equation => {
      expect(renderMath(equation.latex)).toBe(equation.expected);
    });
  });
});
```

### 5. Plan-to-Implementation Compliance Testing
```typescript
// Verify implementation matches phase plan
describe('Phase Compliance', () => {
  it('should implement all required tasks', () => {
    const phasePlan = readPhasePlan('phase-2');
    const implementation = analyzeImplementation();

    phasePlan.tasks.forEach(task => {
      expect(implementation).toInclude(task.deliverable);
    });
  });
});
```

### 6. Quality & Explainable Code Requirements
```typescript
// Every file must pass quality checks
describe('Code Quality', () => {
  it('should have TypeScript strict mode', () => {
    expect(tsConfig.strict).toBe(true);
    expect(tsErrors.length).toBe(0);
  });

  it('should have clear function documentation', () => {
    const functions = extractFunctions(codebase);
    functions.forEach(fn => {
      expect(fn.documentation).toBeDefined();
      expect(fn.documentation).toInclude('purpose');
      expect(fn.documentation).toInclude('parameters');
      expect(fn.documentation).toInclude('returns');
    });
  });

  it('should follow naming conventions', () => {
    expect(variableNames).toMatchConvention();
    expect(functionNames).toBeDescriptive();
    expect(componentNames).toBePascalCase();
  });
});
```

### Testing Workflow - MANDATORY

#### Before EVERY commit:
```bash
# 1. Type checking (must be 0 errors)
npm run typecheck

# 2. Unit tests (must pass)
npm test

# 3. Integration tests (if implemented)
npm run test:integration

# 4. Protected core validation
npm run test:protected-core

# 5. Quality checks
npm run lint
npm run test:quality
```

#### After EVERY task:
```bash
# Document test results
echo "Task [X.Y] Test Results:" >> test-results.md
npm test 2>&1 | tee -a test-results.md
git add test-results.md
git commit -m "test: Document Task [X.Y] test results"
```

#### Before EVERY phase completion:
```bash
# Comprehensive test suite
npm run test:all
npm run test:regression
npm run test:e2e
npm run build  # Must succeed
```

### Test Coverage Requirements

- **Unit Tests**: >80% coverage for new code
- **Integration Tests**: All service interactions
- **E2E Tests**: Complete user flows
- **Protected Core**: 100% violation detection
- **Regression**: All previous features

### Test Documentation

Every test file must include:
```typescript
/**
 * Test Suite: [Component/Service Name]
 * Purpose: [What this tests and why]
 * Coverage: [What scenarios are covered]
 * Dependencies: [What services/components this relies on]
 * Last Updated: [Date]
 */
```

## 🔴 CRITICAL: Protected Core Architecture

### NEVER MODIFY These Directories
```
src/protected-core/          # ⛔ PROTECTED - DO NOT MODIFY
├── voice-engine/            # Voice processing services
├── transcription/           # Text and math processing
├── websocket/               # WebSocket management
├── contracts/               # Service contracts
└── session/                 # Session orchestration

CLAUDE.md                    # ⛔ THIS FILE - DO NOT MODIFY
.ai-protected                # ⛔ Protection list - DO NOT MODIFY
feature-flags.json           # ⛔ Feature toggles - DO NOT MODIFY
```

### You CAN Modify These Directories
```
src/features/                # ✅ Add new features here
src/app/                     # ✅ Modify pages and routes
src/components/              # ✅ Add UI components (except protected ones)
src/hooks/                   # ✅ Add custom hooks
src/styles/                  # ✅ Modify styles
tests/features/              # ✅ Add feature tests
```

## 📋 MANDATORY Development Workflow

### Before ANY Code Changes

1. **Check Current State**
   ```bash
   npm run typecheck  # MUST show 0 errors
   npm run lint       # SHOULD pass
   npm test          # MUST pass
   ```

2. **Create Git Checkpoint**
   ```bash
   git checkout -b feature/[description]-[timestamp]
   git commit -am "checkpoint: Before [task description]"
   ```

3. **Check Feature Flags**
   - All new features MUST use feature flags
   - Default all flags to `false`
   - Test both on and off states

### During Development

1. **Follow Service Contracts**
   - Use ONLY the defined APIs in `src/protected-core/contracts/`
   - Never bypass service boundaries
   - Never access WebSocket directly

2. **Type Safety Rules**
   - **NEVER use `any` type**
   - Define proper interfaces for all data
   - Use `unknown` if type is truly unknown, then narrow it

3. **Import Rules**
   - Features can import from protected-core
   - Protected-core CANNOT import from features
   - Use the provided service contracts

### After Code Changes

1. **Run All Checks**
   ```bash
   npm run typecheck  # MUST show 0 errors
   npm run lint       # Fix any issues
   npm test          # All must pass
   npm run build     # Must succeed
   ```

2. **Commit with Proper Message**
   ```bash
   git commit -am "feat: [description]"  # New feature
   git commit -am "fix: [description]"   # Bug fix
   git commit -am "chore: [description]" # Maintenance
   git commit -am "docs: [description]"  # Documentation
   ```

## 🛠️ Available Protected Core APIs

### Voice Service
```typescript
import { VoiceService } from '@/protected-core';

// Initialize service
await VoiceService.initialize(config);

// Start session
const sessionId = await VoiceService.startSession(studentId, topic);

// End session
await VoiceService.endSession(sessionId);
```

### Transcription Service
```typescript
import { TranscriptionService } from '@/protected-core';

// Process transcription
const processed = TranscriptionService.processTranscription(text);

// Render math
const rendered = TranscriptionService.renderMath(latex);

// Get display buffer
const buffer = TranscriptionService.getDisplayBuffer();
```

### WebSocket Manager (DO NOT USE DIRECTLY)
```typescript
// ❌ WRONG - Never do this
import { WebSocketManager } from '@/protected-core/websocket';

// ✅ CORRECT - Use through services
import { VoiceService } from '@/protected-core';
```

## 🚫 FORBIDDEN Actions

1. **NEVER modify files in `src/protected-core/`**
2. **NEVER create duplicate WebSocket connections**
3. **NEVER bypass service contracts**
4. **NEVER use `any` type**
5. **NEVER modify this file (CLAUDE.md)**
6. **NEVER change feature flags in code (use feature-flags.json)**
7. **NEVER import protected internals**
8. **NEVER skip tests**

## ✅ REQUIRED Actions

1. **ALWAYS use feature flags for new features**
2. **ALWAYS follow TypeScript strict mode**
3. **ALWAYS use service contracts**
4. **ALWAYS commit after each task**
5. **ALWAYS run tests before committing**
6. **ALWAYS handle errors gracefully**
7. **ALWAYS maintain 0 TypeScript errors**

## 📍 PROJECT NAVIGATION GUIDE

### Planning Documents Location
```
/docs/new-arch-impl-planning/
├── MASTER-PLAN.md           # 🎯 START HERE - 6-day implementation roadmap
├── 01-analysis/             # Why we failed 7 times
├── 02-architecture/         # Protected Core design
├── 03-phases/               # Detailed phase plans
│   ├── phase-0-foundation.md      # Day 1: Emergency fixes
│   ├── phase-1-core-services.md   # Days 2-3: Core services
│   ├── phase-2-gemini-integration.md # Days 4-5: Voice flow
│   └── phase-3-stabilization.md   # Day 6: Hardening
└── 04-prompts/              # AI implementation prompts
```

### How to Use the Master Plan
1. **ALWAYS start by reading**: `/docs/new-arch-impl-planning/MASTER-PLAN.md`
2. **Check current phase**: See "Current Implementation Status" below
3. **Read phase-specific docs**: In `/docs/new-arch-impl-planning/03-phases/`
4. **Use AI prompts**: Copy from `/docs/new-arch-impl-planning/04-prompts/`
5. **Update status**: After completing each task in Master Plan

## 🔀 GIT WORKFLOW - MANDATORY

### Starting a New Phase
```bash
# 1. Ensure main branch is clean
git checkout main
git pull origin main

# 2. Create phase branch from main
git checkout -b phase-[number]-[name]
# Example: git checkout -b phase-0-foundation

# 3. Create initial checkpoint
git commit -am "checkpoint: Starting Phase [number] - [name]"
```

### During Implementation
```bash
# After EACH task completion
git add .
git commit -m "[type]: Task [number] - [description]"
# Example: git commit -m "feat: Task 1.1 - WebSocket singleton implementation"

# Push regularly to prevent loss
git push origin [branch-name]
```

### Completing a Phase
```bash
# 1. Run all verifications
npm run typecheck  # MUST be 0 errors
npm run lint       # MUST pass
npm test           # MUST pass
npm run build      # MUST succeed

# 2. Create PR
gh pr create --title "Phase [number]: [name]" \
  --body "Completes Phase [number] as per MASTER-PLAN.md"

# 3. After PR approval, merge to main
git checkout main
git merge phase-[number]-[name]
git push origin main

# 4. Tag the phase completion
git tag -a phase-[number]-complete -m "Phase [number] completed"
git push origin --tags
```

### Emergency Rollback
```bash
# If something breaks critically
git reset --hard HEAD~1  # Undo last commit
# OR
git checkout main        # Abandon current branch
```

## 🎯 Current Implementation Status

### Status Overview
- **Current Date**: 2025-09-21
- **Target Completion**: 2025-09-26
- **Active Branch**: architecture-pivot-planning (planning complete)
- **Next Phase**: Phase 0 - Foundation (Day 1)

### Phase 0: Foundation (PLANNING COMPLETE - READY TO START)
- ✅ Protected Core structure planned
- ✅ TypeScript fixes identified
- ✅ Dependencies listed
- 🔄 **Next**: Create `phase-0-foundation` branch and start implementation

### Phase 1: Core Services (NOT STARTED)
- ⏳ WebSocket singleton pending
- ⏳ LiveKit integration pending
- ⏳ Transcription service pending
- 📅 **Scheduled**: Days 2-3

### Phase 2: Gemini Integration (NOT STARTED)
- ⏳ Gemini Live API pending
- ⏳ Math rendering pending
- ⏳ Voice flow pending
- 📅 **Scheduled**: Days 4-5

### Phase 3: Stabilization (NOT STARTED)
- ⏳ Testing pending
- ⏳ Monitoring pending
- ⏳ Documentation pending
- 📅 **Scheduled**: Day 6

### How to Update Status
After completing each task:
1. Update this section with ✅ for completed items
2. Commit with message: `docs: Update CLAUDE.md status for Task [number]`
3. Keep MASTER-PLAN.md in sync

## 🔄 Rollback Procedures

If you break something:

1. **Immediate Rollback**
   ```bash
   git reset --hard HEAD~1
   ```

2. **Feature Flag Disable**
   ```json
   // In feature-flags.json, set flag to false
   {
     "yourFeature": false
   }
   ```

3. **Report the Issue**
   - Document what broke
   - Save error messages
   - Note the attempted change

## 📊 Performance Requirements

Your code MUST meet these metrics:
- **TypeScript Errors**: 0 (ZERO tolerance)
- **Test Coverage**: > 80% for new code
- **Build Time**: < 30 seconds
- **Transcription Latency**: < 300ms
- **Math Render Time**: < 50ms
- **Memory Usage**: < 100MB per session

## 🐛 Known Issues & Workarounds

### Issue: LiveKit connection drops
**Workaround**: Automatic reconnection implemented in protected core

### Issue: Math equations not rendering
**Workaround**: Fallback to plain text display

### Issue: Gemini API rate limits
**Workaround**: Implement exponential backoff

## 📞 Getting Help

If you need clarification:
1. Check `/docs/new-arch-impl-planning/` for detailed plans
2. Review phase-specific documentation
3. Look at existing implementations in protected-core
4. Check test files for usage examples

## 📝 MASTER PLAN MAINTENANCE

### When to Update Master Plan
- **After each task completion**: Mark as ✅ in relevant phase doc
- **When blockers found**: Document in risk section
- **After phase completion**: Update status and metrics
- **When timeline changes**: Adjust dates and notify

### Master Plan Quick Reference
The Master Plan (`/docs/new-arch-impl-planning/MASTER-PLAN.md`) contains:
- **Timeline**: 6-day implementation schedule
- **Success Metrics**: What must be achieved
- **Risk Mitigation**: How to handle problems
- **Command Center**: Quick commands for common tasks
- **Verification Checkpoints**: What to run after each task

### Keeping Documents in Sync
When you complete a task:
1. Update task status in phase doc (`/docs/new-arch-impl-planning/03-phases/phase-X-*.md`)
2. Update CLAUDE.md implementation status
3. Update MASTER-PLAN.md progress
4. Commit with clear message
5. Push to remote branch

## 🧪 Testing Credentials

For testing and integration verification:
- **Email**: test@example.com
- **Password**: TestPassword123!

Use these credentials to access the classroom page and verify functionality during development and testing.

## 🗂️ Database Context & Schema

### Supabase PostgreSQL Database
PingLearn uses Supabase with a comprehensive schema designed for educational content and voice interactions.

**Database Files Location**:
- Schema Documentation: `/Users/[username]/Projects/pinglearn/pinglearn-app/docs/database/schema.md`
- Initial Migration: `/Users/[username]/Projects/pinglearn/pinglearn-app/supabase/migrations/001_initial_schema.sql`
- Curriculum Data: `/Users/[username]/Projects/pinglearn/pinglearn-app/supabase/migrations/002_profiles_and_curriculum.sql`

### Key Database Tables

#### Core User & Session Tables:
- **profiles**: User profile data (grade, subjects, preferences)
- **learning_sessions**: Main learning session tracking
- **voice_sessions**: LiveKit voice session data with room names
- **transcripts**: All voice conversation transcripts (student/tutor)
- **session_analytics**: Engagement and comprehension metrics

#### Educational Content Tables:
- **textbooks**: NCERT textbook metadata (Grades 9-12 pre-loaded)
- **chapters**: Chapter organization within textbooks
- **content_chunks**: Chunked content with embeddings for semantic search
- **curriculum_data**: CBSE curriculum topics for Grades 9-12

#### Progress Tracking:
- **user_progress**: Overall subject progress and streaks
- **topic_progress**: Individual topic mastery tracking

### Pre-Loaded Educational Content

**NCERT Mathematics Class X (Grade 10) Topics**:
- Real Numbers, Polynomials, Quadratic Equations
- Triangles, Coordinate Geometry, Trigonometry
- Circles, Areas, Surface Areas and Volumes
- Statistics, Probability

**Other Subjects Available**:
- Science, English, Social Science for Grades 9-12
- All CBSE curriculum topics pre-loaded in `curriculum_data` table

### Supabase MCP Usage

**Available Operations via MCP**:
```typescript
// Query curriculum topics for a grade
mcp__supabase__query_table(
  table: 'curriculum_data',
  filter: { grade: 10, subject: 'Mathematics' }
)

// Get user's learning sessions
mcp__supabase__query_table(
  table: 'learning_sessions',
  filter: { user_id: userId }
)

// Insert new voice session
mcp__supabase__insert_row(
  table: 'voice_sessions',
  data: { session_id, livekit_room_name, started_at }
)

// Search textbook content
mcp__supabase__query_table(
  table: 'content_chunks',
  filter: { chapter_id: chapterId }
)
```

### Row Level Security (RLS)
All user data is protected with RLS policies:
- Users can only access their own sessions and progress
- Textbooks and curriculum data are publicly readable
- Transcripts are linked to user sessions for privacy

### Performance Optimizations
- Vector embeddings for semantic content search
- Indexes on user queries, session timestamps
- Full-text search on textbook titles and content

## 🚨 PRIMARY DEFENSE: PROTECTED CORE NEVER MODIFY

### ⛔ CRITICAL: NEVER MODIFY THESE FILES
```
src/protected-core/*                     # ENTIRE PROTECTED CORE
├── voice-engine/                        # Voice processing services
├── transcription/                       # Text and math processing
├── websocket/manager/singleton-manager.ts # CRITICAL: WebSocket singleton
├── session/                            # Session orchestration
└── contracts/                          # Service contracts
```

### 🔌 USE THESE APIS (DON'T RECREATE)
```typescript
// Session Management
import { SessionOrchestrator } from '@/protected-core';
const orchestrator = SessionOrchestrator.getInstance();

// Voice Processing
import { VoiceService } from '@/protected-core';
await VoiceService.startSession(studentId, topic);

// Transcription & Math
import { TranscriptionService, getDisplayBuffer } from '@/protected-core';
const processed = TranscriptionService.processTranscription(text);
const mathHtml = TranscriptionService.renderMath(latex);

// WebSocket (USE SINGLETON ONLY)
import { WebSocketManager } from '@/protected-core';
const wsManager = WebSocketManager.getInstance();
```

### 🚫 FORBIDDEN ACTIONS - WILL CAUSE FAILURE #8
1. **NEVER** modify `src/protected-core/` files
2. **NEVER** create new WebSocket connections
3. **NEVER** bypass service contracts
4. **NEVER** use `any` type in TypeScript
5. **NEVER** skip mandatory tests

**See `src/protected-core/claude.md` for complete protection details.**

## ⚠️ Final Warning

This is attempt #8 after 7 failures. The Protected Core Architecture is our last line of defense against breaking changes.

**Respect the boundaries. Follow the rules. Maintain stability.**

If you're unsure about something, ASK before implementing. Better safe than sorry.

---

**Remember**: You're building an educational platform that will help thousands of students learn. Quality and stability are paramount.

**Your code affects real students' learning experience. Take it seriously.**