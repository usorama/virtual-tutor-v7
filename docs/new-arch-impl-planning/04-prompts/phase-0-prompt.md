# Phase 0 Implementation Prompt
**For use with AI assistants to execute Phase 0**

## 🔴 CRITICAL: INITIAL SETUP COMMANDS (RUN THESE FIRST)

```bash
# 1. Verify your working directory
pwd  # Should be in /Users/[username]/Projects/pinglearn

# 2. Check current branch
git branch --show-current  # Should show phase-0-foundation

# 3. READ these files IN ORDER using Read tool:
- Read /Users/[username]/Projects/pinglearn/CLAUDE.md  # Project rules
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/MASTER-PLAN.md  # Overall 6-day plan
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/01-analysis/failure-analysis.md  # Understand what NOT to do
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-0-foundation.md  # Today's detailed plan
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/.ai-protected  # Files you CANNOT modify (if exists)
```

## Context Setup

You are implementing Phase 0 of the PingLearn architecture pivot. This is a critical foundation phase that establishes the Protected Core architecture to prevent AI agents from breaking core services.

## Background (MUST READ FROM FILES ABOVE)
- This project has failed 7 times due to AI agents breaking core functionality
- We are implementing a "Protected Core" pattern with clear boundaries
- You must follow the plan exactly as specified in the files above

## Your Mission

Execute Phase 0: Foundation & Emergency Fixes according to the plan you just read from `/docs/new-arch-impl-planning/03-phases/phase-0-foundation.md`

## Critical Rules

### 🛡️ PROTECTION VERIFICATION (Run every 10 minutes)
```bash
# Check if you're about to modify protected files
git status  # Review all changes
cat .ai-protected  # Re-read protected list
```

1. **NEVER modify these files once created**:
   - Anything in `src/protected-core/` (AFTER Phase 0 creation)
   - `CLAUDE.md` (root project file)
   - `.ai-protected`
   - `feature-flags.json`

**EXCEPTION for Phase 0**: You WILL create initial files in `src/protected-core/` during Phase 0. After Phase 0, these become protected.

2. **ALWAYS commit after each task** with message format:
   - `feat:` for new features
   - `fix:` for fixes
   - `chore:` for maintenance
   - `docs:` for documentation

3. **Run verification after EVERY change**:
   ```bash
   npm run typecheck  # Must show 0 errors
   npm run lint       # Should pass
   npm test          # Must pass
   ```

## 📋 Use TodoWrite Tool

Before starting, create a todo list:
```
TodoWrite with tasks:
1. Create protection infrastructure
2. Fix TypeScript errors
3. Install dependencies
4. Move existing code
5. Create service contracts
6. Implement feature flags
7. Verify Phase 0 complete
```

Mark each task as in_progress when starting, completed when done.

## Execution Steps

### Step 1: Create Protection Infrastructure

**FIRST**: Verify you're in the right place:
```bash
pwd  # Confirm you're in project root
cd pinglearn-app  # Navigate to app directory
pwd  # Should show .../pinglearn/pinglearn-app
```

Create the directory structure EXACTLY as specified:
```bash
mkdir -p src/protected-core/{voice-engine,transcription,websocket,contracts}
mkdir -p src/protected-core/voice-engine/{gemini,livekit,audio}
mkdir -p src/protected-core/transcription/{text,math,display}
mkdir -p src/protected-core/websocket/{manager,retry,health}
```

Create `.ai-protected` file at project root with:
```
src/protected-core/**
CLAUDE.md
.ai-protected
feature-flags.json
src/shared/types/core.types.ts
```

### Step 2: Fix TypeScript Errors

**CHECKPOINT**: Before proceeding:
```bash
git add -A && git commit -m "checkpoint: Protection infrastructure created"
```

1. Run `npm run typecheck` and document ALL errors
2. Fix each error without using `any` type
3. Ensure all imports resolve correctly
4. Verify with `npm run typecheck` showing 0 errors

### Step 3: Install Dependencies

```bash
npm install katex @types/katex react-katex
npm install @google/generative-ai
npm install @sentry/nextjs
```

### Step 4: Move Existing Code

Move `src/lib/livekit/audio-manager.ts` to `src/protected-core/voice-engine/livekit/audio-manager.ts`

Create WebSocket singleton in `src/protected-core/websocket/manager/singleton.ts`:
```typescript
export class WebSocketManager {
  private static instance: WebSocketManager;
  private connection: WebSocket | null = null;

  private constructor() {
    if (WebSocketManager.instance) {
      throw new Error('WebSocketManager: Use getInstance() instead of new');
    }
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  async connect(url: string): Promise<void> {
    if (this.connection?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }
    this.connection = new WebSocket(url);
    // Add connection logic
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }
}
```

### Step 5: Create Service Contracts

Create `src/protected-core/contracts/voice.contract.ts`:
```typescript
export interface VoiceServiceContract {
  initialize(config: VoiceConfig): Promise<void>;
  startSession(studentId: string, topic: string): Promise<string>;
  endSession(sessionId: string): Promise<void>;
  sendAudio(audioData: ArrayBuffer): Promise<void>;
  getConnectionState(): 'connected' | 'disconnected' | 'connecting';
}
```

Create `src/protected-core/contracts/transcription.contract.ts`:
```typescript
export interface TranscriptionContract {
  processTranscription(text: string): ProcessedText;
  renderMath(latex: string): string;
  detectMath(text: string): MathSegment[];
  getDisplayBuffer(): DisplayItem[];
  clearBuffer(): void;
}
```

### Step 6: Implement Feature Flags

Create `feature-flags.json` at project root:
```json
{
  "enableGeminiLive": false,
  "enableMathTranscription": false,
  "enableNewDashboard": false,
  "enableAIGeneratedFeatures": false
}
```

Create `src/shared/services/feature-flags.ts`:
```typescript
import flags from '../../../feature-flags.json';

export class FeatureFlagService {
  static isEnabled(flag: string): boolean {
    return flags[flag] ?? false;
  }

  static getAllFlags(): Record<string, boolean> {
    return { ...flags };
  }
}
```

### Step 7: Verify Everything

Run this verification checklist:
```bash
# TypeScript must pass
npm run typecheck

# Lint should pass
npm run lint

# Build must work
npm run build

# Check protected directories exist
ls -la src/protected-core/

# Verify feature flags
cat feature-flags.json
```

## Verification After EVERY Step

```bash
# After each major change:
npm run typecheck  # Watch error count decrease
git status  # Ensure no protected files modified
git add -A && git commit -m "checkpoint: [description]"
```

## Success Criteria

You have successfully completed Phase 0 when:
1. ✅ `npm run typecheck` shows **0 errors**
2. ✅ Protected Core directory structure exists
3. ✅ All dependencies installed
4. ✅ WebSocket singleton implemented
5. ✅ Service contracts defined
6. ✅ Feature flags working
7. ✅ All existing features still work

## Common Issues & Solutions

### Issue: TypeScript errors persist
**Solution**: Do NOT use `any`. Find the correct type or create a proper interface.

### Issue: Import paths broken after moving files
**Solution**: Update ALL imports systematically. Use VS Code's "Update imports on file move" feature.

### Issue: WebSocket singleton not enforcing single instance
**Solution**: Throw error in constructor if instance exists. Only use getInstance().

## Final Checklist

Before marking Phase 0 complete:
- [ ] All TypeScript errors fixed (0 errors)
- [ ] Protected Core structure created
- [ ] Dependencies installed
- [ ] Existing code moved and working
- [ ] Service contracts defined
- [ ] Feature flags implemented
- [ ] All commits made with proper messages
- [ ] No `any` types used
- [ ] Tests passing

## Final Verification

```bash
# Run ALL of these before declaring complete:
npm run typecheck  # MUST show 0 errors
npm run lint  # Document any warnings
npm run build  # Should attempt to build
ls -la src/protected-core/  # Verify structure exists
cat feature-flags.json  # Verify all flags false
cat .ai-protected  # Verify protection list exists
```

## Handoff Notes

After completing Phase 0, create a report at `/docs/new-arch-impl-planning/phase-0-completion-report.md`:
```markdown
# Phase 0 Completion Report

## Completed Tasks
- [List all completed tasks]

## Issues Encountered
- [Any problems and how they were resolved]

## Ready for Phase 1
- [ ] All success criteria met
- [ ] No blocking issues
- [ ] Code review completed
```

---

Remember: The Protected Core is sacred. Once created, it must NEVER be modified by AI agents. This is the foundation of system stability.