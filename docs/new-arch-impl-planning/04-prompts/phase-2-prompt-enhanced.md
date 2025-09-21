# Phase 2 Implementation Prompt - ENHANCED VERSION
**For use with AI assistants to execute Phase 2 - WITH PROPER SAFEGUARDS**

## 🔴 CRITICAL: INITIAL SETUP COMMANDS (RUN THESE FIRST)

```bash
# 1. Verify your working directory
pwd  # Should be in /Users/[username]/Projects/pinglearn

# 2. Check current branch
git branch --show-current  # Should be phase-2-gemini-integration
# If not, create it:
# git checkout main && git checkout -b phase-2-gemini-integration

# 3. READ these files IN ORDER using Read tool:
- Read /Users/[username]/Projects/pinglearn/CLAUDE.md  # Re-read project rules
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/MASTER-PLAN.md  # Check Day 4-5 objectives
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/phase-0-completion-report.md  # Phase 0 results
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/phase-1-completion-report.md  # Phase 1 results (if exists)
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-2-gemini-integration.md  # Today's detailed plan
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/.ai-protected  # Files you CANNOT modify

# 4. Check existing protected core services (READ-ONLY!):
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/src/protected-core/contracts/voice.contract.ts
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/src/protected-core/contracts/transcription.contract.ts
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/src/protected-core/websocket/manager/singleton-manager.ts
```

## Context Setup

You are implementing Phase 2 of the PingLearn architecture pivot. This is the most critical phase where we integrate Google Gemini Live API for real-time AI teacher functionality and complete the voice processing pipeline with dual-channel transcription and math rendering.

## 🛡️ PHASE 2 CRITICAL PROTECTION RULES

### ⛔ PROTECTED CORE STATUS
```
Phase 0: Created protected core structure ✅
Phase 1: Added services IN protected core ✅
Phase 2 (NOW): Protected core is COMPLETELY READ-ONLY 🔒
```

### WHERE YOU CAN AND CANNOT WORK
```bash
# ❌ CANNOT modify or create files in:
src/protected-core/    # COMPLETELY OFF LIMITS!

# ✅ CAN create new files in:
src/features/          # New feature implementations
src/app/               # Page updates
src/components/        # UI components
src/hooks/             # Custom hooks
```

### Protection Check (Run every 10 minutes):
```bash
# Verify you're not breaking rules
git status | grep protected-core  # Should be EMPTY
pwd  # Confirm you're in right directory
cat .ai-protected  # Re-read protection list
```

## 📋 MANDATORY: Use TodoWrite Tool

Before starting ANY work:
```
TodoWrite with Day 4 and Day 5 tasks:
1. Setup Gemini Live API connection
2. Implement transcription pipeline
3. Add math detection and rendering
4. Create React components
5. Integrate voice flow
6. Test end-to-end
7. Performance optimization
```

## Prerequisites Check

```bash
cd pinglearn-app

# Verify Phase 1 completed successfully
ls src/protected-core/  # Should see all directories
npm run typecheck  # Should be 0 errors

# Check feature flags exist
cat feature-flags.json | grep enableGeminiLive

cd ..
```

## Your Mission

Execute Phase 2 according to the detailed plan in `/docs/new-arch-impl-planning/03-phases/phase-2-gemini-integration.md`

## Day 4 Implementation - Gemini Integration

### CHECKPOINT Before Starting:
```bash
git add -A && git commit -m "checkpoint: Starting Phase 2 - Gemini Integration"
```

### Task 2.1: Gemini Live API Setup

#### ⚠️ CRITICAL: File Locations
```bash
# ❌ WRONG - Don't create here:
src/protected-core/voice-engine/gemini/  # NO!

# ✅ CORRECT - Create here instead:
src/features/gemini/  # YES!
```

First, ensure you have the Gemini API key:
```bash
# Add to .env.local
GOOGLE_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.0-flash-live
GEMINI_REGION=asia-south1
```

Now implement the Gemini service IN FEATURES:

```typescript
// 📍 CREATE IN: src/features/gemini/gemini-service.ts
// NOT IN protected-core!

import { WebSocketManager } from '@/protected-core';  // Import from public API
import { VoiceServiceContract } from '@/protected-core';  // Use contracts only

export class GeminiLiveService implements Partial<VoiceServiceContract> {
  private wsManager: WebSocketManager;
  private apiKey: string;
  private model = 'gemini-2.0-flash-live';

  constructor() {
    // Use singleton from protected core
    this.wsManager = WebSocketManager.getInstance();
    this.apiKey = process.env.GOOGLE_API_KEY!;
  }

  // Implementation continues...
}
```

### Task 2.2: Transcription Pipeline

#### Create Math Detection Service:

```typescript
// 📍 CREATE IN: src/features/transcription/math-detector.ts
// Uses protected core contracts but doesn't modify them

import { MathSegment, TranscriptionContract } from '@/protected-core';

export class MathDetectionService {
  detectMathInText(text: string): MathSegment[] {
    // Implementation
  }
}
```

### Task 2.3: React Components

```typescript
// 📍 CREATE IN: src/components/voice/TranscriptionDisplay.tsx
// New UI component

import { DisplayItem } from '@/protected-core';  // Import types only

export function TranscriptionDisplay({ items }: { items: DisplayItem[] }) {
  // Component implementation
}
```

## 🚨 DANGER ZONES - STOP AND CHECK

### Before EVERY file creation:
1. Check the path - is it in `protected-core`? STOP!
2. Run `pwd` - verify you're in right directory
3. Run `git status` - check what you're about to commit
4. If unsure, re-read `.ai-protected`

### If you see TypeScript errors in protected-core:
- DO NOT edit protected-core files to fix them
- Fix by adjusting YOUR code in features/app
- If impossible to fix, STOP and document the issue

## Day 5 Implementation - Voice Flow Integration

### CHECKPOINT Before Day 5:
```bash
git add -A && git commit -m "checkpoint: Day 4 complete, starting Day 5"
```

### Task 2.4: Complete Voice Flow

Continue implementing in FEATURES directory only.

## Common Mistakes to Avoid

1. ❌ Creating files in `src/protected-core/voice-engine/gemini/`
   ✅ Create in `src/features/gemini/` instead

2. ❌ Modifying WebSocket singleton
   ✅ Use `WebSocketManager.getInstance()` from protected core

3. ❌ Importing from implementation files
   ✅ Import from `@/protected-core` contracts only

4. ❌ Forgetting feature flags
   ✅ Check `enableGeminiLive` flag before using features

5. ❌ Skipping checkpoint commits
   ✅ Commit after EVERY major task

## Verification Steps

### After Each Task:
```bash
cd pinglearn-app
npm run typecheck  # Must stay at 0 errors
git status | grep protected-core  # Must be empty
git add -A && git commit -m "checkpoint: [task description]"
cd ..
```

### End of Day 4:
```bash
ls src/features/gemini/  # Should have Gemini services
ls src/protected-core/voice-engine/gemini/  # Should NOT exist or be unchanged
```

### End of Day 5:
```bash
npm run dev  # Start application
# Test voice flow in /classroom
# Verify math rendering works
```

## Final Phase 2 Verification

```bash
cd pinglearn-app

# Verify no protected core modifications
git diff phase-1-core-services -- src/protected-core/  # Should be minimal/none

# Check features created
ls -la src/features/  # Should see gemini, transcription folders

# Verify feature flags
cat feature-flags.json | grep enableGeminiLive

# Test the application
npm run build  # Should succeed
npm run typecheck  # 0 errors

cd ..
```

## Success Criteria

✅ Phase 2 is complete when:
1. Gemini Live API connected (in features, not protected-core)
2. Transcription pipeline working
3. Math equations rendering with KaTeX
4. Voice flow functional end-to-end
5. NO modifications to protected-core
6. All feature flagged
7. < 300ms transcription latency

## Handoff Report

Create report at: `/docs/new-arch-impl-planning/phase-2-completion-report.md`

Include:
- Files created (should be in features/app only)
- Files modified (should NOT include protected-core)
- Performance metrics
- Known issues
- Test results

---

**REMEMBER**: Protected Core is sacred. You're building AROUND it, not IN it.