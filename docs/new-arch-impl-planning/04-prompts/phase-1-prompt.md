# Phase 1 Implementation Prompt
**For use with AI assistants to execute Phase 1**

## 🔴 CRITICAL: INITIAL SETUP COMMANDS (RUN THESE FIRST)

```bash
# 1. Verify your working directory
pwd  # Should be in /Users/[username]/Projects/pinglearn

# 2. Check current branch
git branch --show-current  # Should be phase-1-core-services
# If not, create it:
# git checkout main && git checkout -b phase-1-core-services

# 3. READ these files IN ORDER using Read tool:
- Read /Users/[username]/Projects/pinglearn/CLAUDE.md  # Re-read project rules
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/MASTER-PLAN.md  # Check Day 2-3 objectives
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/phase-0-completion-report.md  # What was already done
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-1-core-services.md  # Today's detailed plan
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/.ai-protected  # Files you CANNOT modify

# 4. Check existing contracts created in Phase 0:
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/src/protected-core/contracts/voice.contract.ts
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/src/protected-core/contracts/transcription.contract.ts
- Read /Users/[username]/Projects/pinglearn/pinglearn-app/src/protected-core/contracts/websocket.contract.ts
```

## Context Setup

You are implementing Phase 1 of the PingLearn architecture pivot. This phase implements the core protected services that form the stable foundation of the system. These services will be protected from future AI modifications.

## Prerequisites Check

Before starting, verify:
```bash
# Phase 0 must be complete
cd pinglearn-app
ls src/protected-core/  # Should show directory structure
npm run typecheck       # Must show 0 errors
cat feature-flags.json  # Should exist with flags
cd ..
```

## Your Mission

Execute Phase 1: Core Service Implementation according to the plan you just read from `/docs/new-arch-impl-planning/03-phases/phase-1-core-services.md`

This phase spans 2 days with specific tasks for each day.

## Critical Rules

### 🛡️ PROTECTION VERIFICATION (Run every 10 minutes)
```bash
# Check you haven't modified protected files
git status
cat .ai-protected  # Re-read what NOT to modify
pwd  # Verify working directory
```

### ⚠️ IMPORTANT DISTINCTION
- **Phase 0**: You CREATED files in `src/protected-core/`
- **Phase 1**: You CREATE MORE files in `src/protected-core/` subdirectories
- **After Phase 1**: `src/protected-core/` becomes FULLY PROTECTED

1. **Work ONLY in protected-core directory** for core services
2. **Follow contracts EXACTLY** as defined in Phase 0 (you read them above)
3. **Use feature flags** for all new functionality
4. **Test everything** - aim for >90% coverage
5. **Commit after each task** with descriptive messages

### 📋 Use TodoWrite Tool
Create a todo list for Day 2 and Day 3 tasks from the phase plan.

## Day 2 Implementation (Tasks 1.1 - 1.5)

### Task 1.1: WebSocket Singleton Implementation

**FIRST**: Check if singleton already exists from Phase 0:
```bash
ls -la src/protected-core/websocket/manager/
# If singleton.ts exists, READ it first
```

Implement the complete WebSocket singleton manager (or enhance existing):

```typescript
// src/protected-core/websocket/manager/singleton-manager.ts
import { EventEmitter } from 'events';

export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private connection: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;

  private constructor() {
    super();
    if (WebSocketManager.instance) {
      throw new Error('Use getInstance()');
    }
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  async connect(url: string, protocols?: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }

      try {
        this.connection = new WebSocket(url, protocols);

        this.connection.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.connection.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.connection.onclose = () => {
          console.log('WebSocket disconnected');
          this.emit('disconnected');
          this.attemptReconnect(url, protocols);
        };

        this.connection.onmessage = (event) => {
          this.emit('message', event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(url: string, protocols?: string[]): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(url, protocols).catch(console.error);
    }, delay);
  }

  send(data: any): void {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }
    this.connection!.send(JSON.stringify(data));
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }

  getLatency(): number {
    // Implement ping/pong latency measurement
    return 0;
  }
}
```

Create retry handler and health monitor as specified in the plan.

### Task 1.2: LiveKit Service Wrapper

**FIRST**: Check what was moved in Phase 0:
```bash
ls -la src/protected-core/voice-engine/livekit/
# If audio-manager.ts exists, READ it first
```

Enhance the existing LiveKit code:

```typescript
// src/protected-core/voice-engine/livekit/service.ts
import { Room, RoomEvent, Track } from 'livekit-client';
import { VoiceServiceContract } from '../../contracts/voice.contract';

export class LiveKitVoiceService implements VoiceServiceContract {
  private room: Room | null = null;
  private sessionId: string | null = null;

  async initialize(config: VoiceConfig): Promise<void> {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720 },
      },
    });

    // Set up event handlers
    this.room.on(RoomEvent.Connected, () => {
      console.log('Connected to LiveKit room');
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('Disconnected from LiveKit room');
    });
  }

  async startSession(studentId: string, topic: string): Promise<string> {
    if (!this.room) {
      throw new Error('Service not initialized');
    }

    // Generate session ID
    this.sessionId = `session_${Date.now()}_${studentId}`;

    // Connect to room
    const token = await this.getToken(studentId);
    await this.room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

    return this.sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.sessionId = null;
    }
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    // Implement audio sending
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.room) return 'disconnected';

    switch (this.room.state) {
      case 'connected':
        return 'connected';
      case 'connecting':
      case 'reconnecting':
        return 'connecting';
      default:
        return 'disconnected';
    }
  }

  private async getToken(participantId: string): Promise<string> {
    // Implement token generation
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
    const data = await response.json();
    return data.token;
  }
}
```

### Task 1.3: Gemini Service Preparation

Create the Gemini service skeleton:

```typescript
// src/protected-core/voice-engine/gemini/service.ts
import { VoiceServiceContract } from '../../contracts/voice.contract';

interface GeminiConfig {
  model: 'gemini-2.0-flash-live';
  apiKey: string;
  region: string;
  responseModalities: string[];
}

export class GeminiVoiceService implements Partial<VoiceServiceContract> {
  private config: GeminiConfig;
  private websocket: WebSocket | null = null;
  private sessionActive = false;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Prepare for Gemini connection
    // This will be fully implemented in Phase 2
    console.log('Gemini service initialized (mock mode)');
  }

  async connectToGemini(): Promise<void> {
    const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`;

    // This will be implemented in Phase 2
    // For now, create mock connection
    console.log('Would connect to:', wsUrl);
  }

  // Mock implementation for testing
  async startMockSession(): Promise<void> {
    this.sessionActive = true;

    // Simulate transcription events
    setTimeout(() => {
      this.onTranscription?.({
        text: 'Hello, let\'s learn about quadratic equations today.',
        timestamp: Date.now(),
        isFinal: false,
      });
    }, 1000);

    setTimeout(() => {
      this.onTranscription?.({
        text: 'The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
        timestamp: Date.now(),
        isFinal: true,
      });
    }, 3000);
  }

  onTranscription?: (data: any) => void;
}
```

### Task 1.4: Text Processor Implementation

Create the text processing service:

```typescript
// src/protected-core/transcription/text/processor.ts
import { TranscriptionContract } from '../../contracts/transcription.contract';

interface ProcessedText {
  segments: TextSegment[];
  timestamp: number;
  speaker?: string;
}

interface TextSegment {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export class TextProcessor implements Partial<TranscriptionContract> {
  private buffer: ProcessedText[] = [];
  private readonly maxBufferSize = 1000;

  processTranscription(text: string): ProcessedText {
    const processed: ProcessedText = {
      segments: this.segmentText(text),
      timestamp: Date.now(),
    };

    // Add to buffer
    this.buffer.push(processed);

    // Maintain buffer size
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    return processed;
  }

  private segmentText(text: string): TextSegment[] {
    // Simple sentence segmentation
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    return sentences.map((sentence, index) => ({
      text: sentence.trim(),
      start: index * 100, // Mock timing
      end: (index + 1) * 100,
      confidence: 0.95,
    }));
  }

  getBuffer(): ProcessedText[] {
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
  }
}
```

## Day 3 Implementation (Tasks 1.6 - 1.10)

### Task 1.6: Math Rendering Service

Implement KaTeX integration:

```typescript
// src/protected-core/transcription/math/renderer.ts
import katex from 'katex';

export class MathRenderer {
  private cache = new Map<string, string>();

  renderMath(latex: string): string {
    // Check cache first
    if (this.cache.has(latex)) {
      return this.cache.get(latex)!;
    }

    try {
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });

      this.cache.set(latex, rendered);
      return rendered;
    } catch (error) {
      console.error('Math rendering error:', error);
      return `<span class="math-error">${latex}</span>`;
    }
  }

  detectMath(text: string): MathSegment[] {
    const segments: MathSegment[] = [];
    const mathPattern = /\$([^$]+)\$/g;
    let match;

    while ((match = mathPattern.exec(text)) !== null) {
      segments.push({
        type: 'math',
        content: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    return segments;
  }

  convertSpeechToLatex(speech: string): string {
    const conversions = {
      'x squared': 'x^2',
      'x cubed': 'x^3',
      'square root of': '\\sqrt{}',
      'fraction': '\\frac{}{}',
      'integral': '\\int',
      'sum': '\\sum',
      'pi': '\\pi',
      'theta': '\\theta',
      'infinity': '\\infty',
    };

    let latex = speech;
    for (const [spoken, tex] of Object.entries(conversions)) {
      latex = latex.replace(new RegExp(spoken, 'gi'), tex);
    }

    return latex;
  }
}
```

### Testing Requirements

Create comprehensive tests for each service:

```typescript
// tests/protected-core/websocket.test.ts
describe('WebSocketManager', () => {
  it('should enforce singleton pattern', () => {
    const instance1 = WebSocketManager.getInstance();
    const instance2 = WebSocketManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should handle reconnection with exponential backoff', async () => {
    // Test reconnection logic
  });

  it('should emit events correctly', (done) => {
    const manager = WebSocketManager.getInstance();
    manager.on('connected', () => {
      done();
    });
    manager.connect('ws://localhost:8080');
  });
});
```

## Verification Steps

### CHECKPOINT After EVERY Task:
```bash
# Save your work
git add -A && git commit -m "checkpoint: Task [number] - [description]"
```

After each task, run:
```bash
# Navigate to app directory
cd pinglearn-app

# Type checking
npm run typecheck

# Tests
npm test -- --coverage

# Specific service tests
npm test -- websocket
npm test -- livekit
npm test -- transcription
```

## Success Criteria for Phase 1

✅ Complete when:
1. All services implement their contracts
2. Test coverage > 90% for protected-core
3. WebSocket singleton enforced
4. LiveKit service wrapped properly
5. Math rendering working
6. No TypeScript errors
7. All feature flags working

## 🚨 DANGER ZONES - STOP AND CHECK

Before ANY edit to these files, STOP:
- Files in parent directories (../../)
- Anything listed in .ai-protected
- Files outside protected-core (except tests)

If unsure, run:
```bash
git status  # Check what you're about to modify
grep [filename] .ai-protected  # Check if file is protected
```

## Common Pitfalls to Avoid

1. **Don't import from features** - Protected core must be isolated
2. **Don't use any types** - Define proper interfaces
3. **Don't skip tests** - Every service needs comprehensive tests
4. **Don't break contracts** - Follow interfaces exactly
5. **Don't forget feature flags** - All new features need flags

## Final Phase 1 Verification

```bash
# Run ALL of these before declaring Phase 1 complete:
cd pinglearn-app
npm run typecheck  # MUST still show 0 errors
npm test -- --coverage  # Check coverage percentage
ls -la src/protected-core/  # Verify all services created
git log --oneline -10  # Verify checkpoint commits
cd ..
```

## Handoff Report Template

Create report at: `/docs/new-arch-impl-planning/phase-1-completion-report.md`

```markdown
# Phase 1 Completion Report

## Day 2 Completed Tasks
- [ ] WebSocket singleton manager
- [ ] LiveKit service wrapper
- [ ] Gemini service preparation
- [ ] Text processor
- [ ] Day 2 testing

## Day 3 Completed Tasks
- [ ] Math renderer
- [ ] Display buffer
- [ ] Service integration
- [ ] Comprehensive testing
- [ ] Documentation

## Test Coverage
- Protected Core: ___%
- Individual services:
  - WebSocket: ___%
  - LiveKit: ___%
  - Transcription: ___%
  - Math: ___%

## Known Issues
- [List any issues]

## Ready for Phase 2
- [ ] All contracts implemented
- [ ] Tests passing
- [ ] Documentation complete
```

Remember: These are the CORE SERVICES. They must be perfect because they cannot be modified later!