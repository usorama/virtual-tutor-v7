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

## 🎯 Current Implementation Status

### Phase 0: Foundation (PLANNING COMPLETE)
- Protected Core structure planned
- TypeScript fixes identified
- Dependencies listed

### Phase 1: Core Services (NOT STARTED)
- WebSocket singleton pending
- LiveKit integration pending
- Transcription service pending

### Phase 2: Gemini Integration (NOT STARTED)
- Gemini Live API pending
- Math rendering pending
- Voice flow pending

### Phase 3: Stabilization (NOT STARTED)
- Testing pending
- Monitoring pending
- Documentation pending

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

## ⚠️ Final Warning

This is attempt #8 after 7 failures. The Protected Core Architecture is our last line of defense against breaking changes.

**Respect the boundaries. Follow the rules. Maintain stability.**

If you're unsure about something, ASK before implementing. Better safe than sorry.

---

**Remember**: You're building an educational platform that will help thousands of students learn. Quality and stability are paramount.

**Your code affects real students' learning experience. Take it seriously.**