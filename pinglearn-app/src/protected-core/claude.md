# 🚨 PROTECTED CORE - PRIMARY DEFENSE SYSTEM
**Version**: 1.0
**Created**: 2025-09-21
**Status**: ACTIVE AND CRITICAL - ATTEMPT #8 AFTER 7 FAILURES

## ⛔ CRITICAL: NEVER MODIFY THESE FILES
```
src/protected-core/*                     # ENTIRE PROTECTED CORE
├── voice-engine/                        # Voice processing services
│   ├── gemini/                         # Gemini Live API integration
│   ├── livekit/                        # LiveKit voice services
│   └── audio/                          # Audio processing
├── transcription/                       # Text and math processing
│   ├── display/                        # Display buffer management
│   ├── math/                           # Math detection & rendering
│   └── text/                           # Text processing
├── websocket/                          # WebSocket connection management
│   ├── manager/singleton-manager.ts    # CRITICAL: WebSocket singleton
│   └── retry/                          # Connection retry logic
├── session/                            # Session orchestration
└── contracts/                          # Service contracts
```

## 🔥 WHY THIS EXISTS
**This platform has FAILED 7 TIMES due to AI agents breaking core functionality.**

Previous failures caused by:
- Modifying WebSocket connections
- Breaking singleton patterns
- Changing voice processing logic
- Corrupting math rendering
- Destroying session management

**This is attempt #8. DO NOT BECOME FAILURE #8.**

## 🏗️ Project Architecture - PROTECTED CORE PATTERN

### ✅ SAFE ZONES (You CAN modify):
```
src/app/                     # Next.js pages and routes
src/components/              # UI components (except protected ones)
src/features/                # New feature implementations
src/hooks/                   # Custom React hooks
src/lib/                     # Utility libraries
src/styles/                  # Styling files
```

### ⛔ FORBIDDEN ZONES (NEVER modify):
```
src/protected-core/          # ENTIRE DIRECTORY PROTECTED
```

## 🔌 PROTECTED CORE APIs (USE THESE, DON'T RECREATE)

### Session Management
```typescript
// ✅ CORRECT: Use the singleton
import { SessionOrchestrator } from '@/protected-core';
const orchestrator = SessionOrchestrator.getInstance();

// Start voice session
const sessionId = await orchestrator.startSession(userId, topic);

// End session
await orchestrator.endSession(sessionId);
```

### Voice Processing
```typescript
// ✅ CORRECT: Use voice services
import { VoiceService } from '@/protected-core';

// Initialize voice connection
await VoiceService.initialize(config);

// Start voice session
const sessionId = await VoiceService.startSession(studentId, topic);
```

### Transcription & Math
```typescript
// ✅ CORRECT: Use transcription services
import { TranscriptionService, getDisplayBuffer } from '@/protected-core';

// Process transcription with math
const processed = TranscriptionService.processTranscription(text);

// Render math equations
const mathHtml = TranscriptionService.renderMath(latex);

// Get display buffer
const buffer = getDisplayBuffer();
const items = buffer.getItems();
```

### WebSocket Management
```typescript
// ✅ CORRECT: Use singleton manager
import { WebSocketManager } from '@/protected-core';
const wsManager = WebSocketManager.getInstance();

// ❌ FORBIDDEN: Never create new WebSocket
// const ws = new WebSocket(url); // THIS BREAKS EVERYTHING
```

## 🚫 FORBIDDEN ACTIONS - WILL CAUSE FAILURE #8

1. **NEVER** modify any file in `src/protected-core/`
2. **NEVER** create new WebSocket connections
3. **NEVER** bypass service contracts
4. **NEVER** modify singleton patterns
5. **NEVER** change voice processing logic
6. **NEVER** break math rendering
7. **NEVER** modify session orchestration
8. **NEVER** use `any` type in TypeScript
9. **NEVER** skip tests for core functionality
10. **NEVER** modify this file (claude.md)

## ✅ SAFE DEVELOPMENT PRACTICES

### When Adding Features:
1. **Work in** `src/features/` directory ONLY
2. **Import** from `@/protected-core` using public APIs
3. **Create** feature flags for experimental code
4. **Write** tests for every new function
5. **Use** existing voice service APIs
6. **Follow** TypeScript strict mode
7. **Maintain** 0 TypeScript errors

### Example Safe Feature:
```typescript
// ✅ CORRECT: New feature in safe zone
// File: src/features/my-feature/MyComponent.tsx

import { getDisplayBuffer } from '@/protected-core';

export function MyComponent() {
  const displayBuffer = getDisplayBuffer();
  const items = displayBuffer.getItems();

  // Your feature logic here
  return <div>...</div>;
}
```

## 🧪 TESTING REQUIREMENTS

Every change must pass:
```bash
npm run typecheck    # MUST show 0 errors
npm run lint         # MUST pass
npm test            # MUST pass
npm run build       # MUST succeed
```

## 🚨 EMERGENCY PROCEDURES

If something breaks:
1. **STOP** all modifications immediately
2. **RUN** `git reset --hard HEAD~1` to undo
3. **VERIFY** all tests pass
4. **REPORT** the issue before proceeding
5. **NEVER** fix by modifying protected core

## 📞 SUPPORT

Before modifying ANYTHING:
1. Check this file
2. Read service contracts in `src/protected-core/contracts/`
3. Use existing APIs
4. Create feature flags
5. Write tests

**Remember: 7 attempts have failed. Don't be #8.**

---

**This file is your primary defense against breaking PingLearn's voice AI functionality.**
**Respect it. Follow it. Succeed with it.**