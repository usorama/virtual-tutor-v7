# PingLearn AI Development Guidelines
**Version**: 2.1 - ENHANCED WITH LEARNING MODE
**Status**: ACTIVE - AI AGENT OPTIMIZED

## User Configuration & Preferences
@pinglearn-app/docs/claude-config/user-preferences.md
@pinglearn-app/docs/claude-config/role-definitions.md

## 🚨 CRITICAL: This is attempt #8 after 7 failures

**PingLearn**: AI-powered learning platform with Gemini Live API, LiveKit voice, KaTeX math rendering.
**Stack**: Next.js 15.5.3, TypeScript (strict), Supabase, shadcn/ui, Vercel.
**Current Branch**: `phase-3-stabilization-uat`
**Target**: 2025-09-26 completion

---

## 🔴 CRITICAL BOUNDARIES - NEVER CROSS

### ⛔ PROTECTED CORE - NEVER MODIFY
```
src/protected-core/*                     # ENTIRE PROTECTED CORE
├── voice-engine/                        # Voice processing services
├── transcription/                       # Text and math processing
├── websocket/manager/singleton-manager.ts # WebSocket singleton
├── session/                            # Session orchestration
└── contracts/                          # Service contracts
```

### 🚫 FORBIDDEN ACTIONS (Will Cause Failure #8)
1. **NEVER** modify `src/protected-core/` files
2. **NEVER** create new WebSocket connections (use singleton)
3. **NEVER** bypass service contracts
4. **NEVER** use `any` type in TypeScript
5. **NEVER** skip mandatory tests
6. **NEVER** commit with TypeScript errors
7. **NEVER** modify this file (CLAUDE.md) without approval

### ✅ REQUIRED ACTIONS
1. **ALWAYS** use feature flags for new features
2. **ALWAYS** run `npm run typecheck` (must show 0 errors)
3. **ALWAYS** use service contracts from `src/protected-core/contracts/`
4. **ALWAYS** commit after each task
5. **ALWAYS** maintain TypeScript strict mode

---

## 🎯 PINGLEARN VISION

PingLearn revolutionizes mathematics learning through AI-powered simultaneous audio-visual instruction, where students see mathematical concepts and equations appear on screen 400ms before the AI teacher speaks about them (SHOW-then-TELL), enabling optimal comprehension through dual-channel processing. Using LiveKit voice agents with Gemini Live API, the platform delivers real-time, conversational math tutoring with beautifully rendered KaTeX equations, synchronized highlighting of spoken content, and smart math detection that distinguishes genuine mathematical expressions from regular text, all presented in a dual-panel classroom interface optimized for young learners' typography needs—eliminating note-taking stress while students focus purely on understanding concepts as their AI teacher guides them through problems step-by-step with perfect audio-visual synchronization.

---

## 👥 ROLES & RESPONSIBILITIES

**See detailed role definitions in imported files above**
**Summary**: Human as product designer learning to code, Claude as teacher & technical team.

---

## 🔄 DEVELOPMENT WORKFLOW

### Before ANY Code Changes
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # SHOULD pass
npm test          # MUST pass
```

### Standard Workflow
1. **Create feature branch**: `git checkout -b feature/[description]`
2. **Make changes** using only approved APIs
3. **Test continuously**: `npm run typecheck` after each file
4. **Commit properly**: `git commit -m "feat: [description]"`
5. **Push regularly**: `git push origin [branch-name]`

### Testing Strategy (Concise)
- **Unit Tests**: >80% coverage for new code
- **Integration Tests**: All protected core service interactions
- **E2E Tests**: Complete user flows (frontend on port 3006)
- **Protected Core Tests**: `npm run test:protected-core` (after every change)

### Git Workflow
```bash
# Starting new work
git checkout -b feature/[name]
git commit -am "checkpoint: Before [task]"

# After each task
git add .
git commit -m "[type]: Task [number] - [description]"

# Emergency rollback
git reset --hard HEAD~1
```

---

## 🛠️ TECHNICAL REFERENCE

### Protected Core APIs (Use These - Don't Recreate)
```typescript
// Session Management
import { SessionOrchestrator } from '@/protected-core';
const orchestrator = SessionOrchestrator.getInstance();

// Voice Processing
import { VoiceService } from '@/protected-core';
await VoiceService.startSession(studentId, topic);

// Transcription & Math
import { TranscriptionService } from '@/protected-core';
const processed = TranscriptionService.processTranscription(text);
const mathHtml = TranscriptionService.renderMath(latex);

// WebSocket (USE SINGLETON ONLY)
import { WebSocketManager } from '@/protected-core';
const wsManager = WebSocketManager.getInstance();
```

### Modifiable Directories
```
src/features/     # ✅ New features
src/app/          # ✅ Pages and routes
src/components/   # ✅ UI components (non-protected)
src/hooks/        # ✅ Custom hooks
src/styles/       # ✅ Styling
tests/features/   # ✅ Feature tests
```

### Database Schema (Supabase)
**Key Tables**: `profiles`, `learning_sessions`, `voice_sessions`, `transcripts`, `textbooks`, `curriculum_data`
**Pre-loaded**: NCERT Mathematics Grade 10, CBSE curriculum topics
**Access**: Use `mcp__supabase__*` MCP server for database operations

### Current Implementation Status
- **Active Branch**: `phase-3-stabilization-uat`
- **Phase 0**: ✅ Foundation complete
- **Phase 1**: ✅ Core services complete
- **Phase 2**: ✅ Gemini integration complete
- **Phase 3**: 🔄 Stabilization & UAT in progress

### Project Navigation
- **Master Plan**: `/docs/new-arch-impl-planning/MASTER-PLAN.md`
- **Phase Docs**: `/docs/new-arch-impl-planning/03-phases/`
- **Change Records**: `/docs/change_records/protected_core_changes/` **If user asks for a change record, never implement without user approval documented inside change record.**

---

## 📋 APPENDIX

### Testing Credentials
- **Email**: test@example.com
- **Password**: TestPassword123!

### Performance Requirements
- **TypeScript Errors**: 0 (zero tolerance)
- **Test Coverage**: >80% for new code
- **Build Time**: <30 seconds
- **Transcription Latency**: <300ms

### Known Issues & Workarounds
- **LiveKit drops**: Auto-reconnection in protected core
- **Math rendering fails**: Fallback to plain text
- **Gemini rate limits**: Exponential backoff

### Emergency Procedures
1. **Immediate rollback**: `git reset --hard HEAD~1`
2. **Feature flag disable**: Set to `false` in `feature-flags.json`
3. **Report issue**: Document error, save messages, note change













---

**This is attempt #8 after 7 failures. Respect boundaries. Follow rules. Maintain stability.**
- always start main pinglearn app on port 3006, and livekit python agent service for the app to work
- Python Livekit service runs in venv and is available at the root folder @livekit-agent/   pinglearn app is available @pinglearn-app/