# Protected Core Architecture Design
**Version**: 1.0
**Date**: 2025-09-21
**Status**: APPROVED FOR IMPLEMENTATION

## Executive Summary

The Protected Core Architecture is designed to enable AI-assisted development while preventing the breaking changes that caused 7 previous failures. This architecture creates clear boundaries between stable core services and modifiable features.

## Architecture Principles

### 1. Separation of Concerns
- **Protected Core**: Never modified by AI agents
- **Feature Layer**: Freely modifiable by AI agents
- **Contract Layer**: Stable APIs between layers

### 2. Single Responsibility
- Each service has ONE primary function
- No service knows about others' internals
- Communication only through defined contracts

### 3. Fail-Safe Defaults
- Feature flags default to OFF
- Broken features don't affect core
- Automatic rollback on critical errors

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│                 (Next.js App Router)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              FEATURE LAYER                        │  │
│  │          (AI Agents Can Modify)                   │  │
│  │                                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │  │
│  │  │ Dashboard  │  │   Wizard   │  │ Analytics │ │  │
│  │  └────────────┘  └────────────┘  └───────────┘ │  │
│  │                                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │  │
│  │  │ Textbooks  │  │   Admin    │  │  Reports  │ │  │
│  │  └────────────┘  └────────────┘  └───────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                           │                              │
│                    Contract Layer                        │
│                           │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │            PROTECTED CORE SERVICES                │  │
│  │           (AI Agents CANNOT Modify)               │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐│  │
│  │  │         Voice Processing Service            ││  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ ││  │
│  │  │  │  Gemini  │  │ LiveKit  │  │  Audio   │ ││  │
│  │  │  │   Live   │  │  Agent   │  │ Pipeline │ ││  │
│  │  │  └──────────┘  └──────────┘  └──────────┘ ││  │
│  │  └─────────────────────────────────────────────┘│  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐│  │
│  │  │        Transcription Service                ││  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ ││  │
│  │  │  │   Text   │  │   Math   │  │  Display │ ││  │
│  │  │  │ Process  │  │  KaTeX   │  │  Buffer  │ ││  │
│  │  │  └──────────┘  └──────────┘  └──────────┘ ││  │
│  │  └─────────────────────────────────────────────┘│  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐│  │
│  │  │         WebSocket Manager                   ││  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ ││  │
│  │  │  │Singleton │  │  Retry   │  │  Health  │ ││  │
│  │  │  │  Guard   │  │  Logic   │  │  Check   │ ││  │
│  │  │  └──────────┘  └──────────┘  └──────────┘ ││  │
│  │  └─────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────┘  │
│                           │                              │
│                    Infrastructure                        │
│                           │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase  │  LiveKit Cloud  │  Gemini API      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
pinglearn-app/
├── src/
│   ├── protected-core/           # 🔒 AI CANNOT MODIFY
│   │   ├── voice-engine/
│   │   │   ├── gemini-service.ts
│   │   │   ├── livekit-service.ts
│   │   │   └── audio-pipeline.ts
│   │   ├── transcription/
│   │   │   ├── text-processor.ts
│   │   │   ├── math-renderer.ts
│   │   │   └── display-buffer.ts
│   │   ├── websocket/
│   │   │   ├── singleton-manager.ts
│   │   │   ├── retry-handler.ts
│   │   │   └── health-monitor.ts
│   │   ├── contracts/            # API Definitions
│   │   │   ├── voice.contract.ts
│   │   │   ├── transcription.contract.ts
│   │   │   └── websocket.contract.ts
│   │   └── index.ts              # Public API exports
│   │
│   ├── features/                 # ✅ AI CAN MODIFY
│   │   ├── dashboard/
│   │   ├── wizard/
│   │   ├── textbooks/
│   │   ├── analytics/
│   │   └── [new-features]/
│   │
│   ├── shared/                   # ⚠️ AI CAREFUL MODIFY
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   │
│   └── app/                      # Next.js App Router
│       ├── (protected)/          # Auth-required routes
│       └── (public)/             # Public routes
│
├── tests/
│   ├── protected-core/           # Core service tests
│   ├── features/                 # Feature tests
│   └── e2e/                      # End-to-end tests
│
├── CLAUDE.md                     # 🚨 AI INSTRUCTIONS
├── .ai-protected                 # Protected file list
└── feature-flags.json            # Feature toggles
```

## Contract Definitions

### Voice Service Contract
```typescript
// protected-core/contracts/voice.contract.ts
export interface VoiceServiceContract {
  // Initialization
  initialize(config: VoiceConfig): Promise<void>;

  // Session Management
  startSession(studentId: string, topic: string): Promise<SessionId>;
  endSession(sessionId: SessionId): Promise<void>;

  // Audio Control
  sendAudio(audioData: ArrayBuffer): Promise<void>;
  receiveAudio(): AsyncGenerator<ArrayBuffer>;

  // State
  getConnectionState(): ConnectionState;
  getQualityMetrics(): QualityMetrics;
}
```

### Transcription Service Contract
```typescript
// protected-core/contracts/transcription.contract.ts
export interface TranscriptionContract {
  // Text Processing
  processTranscription(text: string): ProcessedText;

  // Math Rendering
  renderMath(latex: string): RenderedMath;
  detectMath(text: string): MathSegment[];

  // Display
  getDisplayBuffer(): DisplayItem[];
  clearBuffer(): void;

  // Synchronization
  syncWithAudio(timestamp: number): void;
}
```

### WebSocket Manager Contract
```typescript
// protected-core/contracts/websocket.contract.ts
export interface WebSocketContract {
  // Connection
  connect(url: string, protocols?: string[]): Promise<void>;
  disconnect(): Promise<void>;

  // Messaging
  send(data: any): Promise<void>;
  onMessage(handler: MessageHandler): void;

  // Health
  isConnected(): boolean;
  getLatency(): number;

  // Singleton Guarantee
  getInstance(): WebSocketManager;
}
```

## Protection Mechanisms

### 1. File Protection
```javascript
// .ai-protected
src/protected-core/**
src/shared/types/core.types.ts
CLAUDE.md
.ai-protected
feature-flags.json
```

### 2. Type Protection
```typescript
// No 'any' types allowed in protected core
// All types must be explicitly defined
// Types are read-only exports

export type VoiceConfig = Readonly<{
  apiKey: string;
  model: 'gemini-2.0-flash-live';
  region: 'asia-south1';
}>;
```

### 3. Runtime Protection
```typescript
// Singleton enforcement
class WebSocketManager {
  private static instance: WebSocketManager;

  private constructor() {
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
}
```

### 4. Feature Flag Protection
```typescript
// All new features must use flags
export function useFeature(name: string): boolean {
  const flags = loadFeatureFlags();
  return flags[name] ?? false; // Default to false
}
```

## Communication Patterns

### Feature → Core (Allowed)
```typescript
// features/dashboard/voice-widget.tsx
import { VoiceService } from '@protected-core';

const voiceService = VoiceService.getInstance();
await voiceService.startSession(userId, topic);
```

### Core → Feature (Not Allowed)
```typescript
// ❌ WRONG: Core should not import from features
// import { Dashboard } from '@features/dashboard';

// ✅ CORRECT: Use events or callbacks
eventBus.emit('transcription:update', data);
```

### Feature → Feature (Through Events)
```typescript
// features use event bus, not direct imports
eventBus.on('wizard:complete', (data) => {
  // Handle in dashboard
});
```

## Implementation Phases

### Phase 0: Foundation (Day 1)
1. Create protected-core directory
2. Move existing LiveKit code to protected
3. Set up contracts
4. Create CLAUDE.md

### Phase 1: Core Services (Days 2-3)
1. Implement WebSocket singleton
2. Create voice service wrapper
3. Build transcription pipeline
4. Add math renderer

### Phase 2: Integration (Days 4-5)
1. Connect Gemini Live API
2. Wire up transcription display
3. Test voice flow end-to-end
4. Add monitoring

### Phase 3: Protection (Day 6)
1. Add comprehensive tests
2. Implement feature flags
3. Create rollback system
4. Final protection audit

## Monitoring & Observability

### Core Metrics
```typescript
interface CoreMetrics {
  websocket: {
    connections: number;      // Must be 1
    reconnects: number;
    latency: number;
  };
  voice: {
    sessionsActive: number;
    audioQuality: string;
    processingTime: number;
  };
  transcription: {
    charactersProcessed: number;
    mathEquationsRendered: number;
    displayLatency: number;
  };
}
```

### Health Checks
```typescript
// Automatic health monitoring
setInterval(() => {
  const health = {
    websocket: wsManager.isHealthy(),
    voice: voiceService.isHealthy(),
    transcription: transcriptionService.isHealthy()
  };

  if (!health.websocket || !health.voice) {
    triggerAlert('Core service unhealthy');
    initiateRollback();
  }
}, 5000);
```

## Rollback Strategy

### Checkpoint System
```bash
# Before any modification
git checkout -b feature/ai-modification-{timestamp}
git commit -am "Checkpoint before AI modification"

# After testing
if [ $TESTS_PASS ]; then
  git merge main
else
  git reset --hard HEAD~1
fi
```

### Feature Flag Rollback
```typescript
// Instant rollback without deployment
function emergencyRollback() {
  const flags = loadFeatureFlags();
  Object.keys(flags).forEach(key => {
    if (key.startsWith('ai_')) {
      flags[key] = false;
    }
  });
  saveFeatureFlags(flags);
}
```

## Success Metrics

### Technical Metrics
- Zero core service modifications by AI after protection
- < 200ms voice latency maintained
- 100% math equation rendering accuracy
- Single WebSocket connection maintained

### Development Metrics
- 90% of AI modifications successful in feature layer
- 0 production incidents from AI code
- 10+ features added without core changes
- < 5 minute rollback time

## Conclusion

This Protected Core Architecture provides the stability needed for AI-assisted development while maintaining the flexibility to rapidly add features. The clear boundaries, contracts, and protection mechanisms ensure that critical voice and transcription services remain stable regardless of AI modifications.

The architecture has been designed based on lessons from 7 failed attempts and incorporates best practices for AI collaboration discovered through extensive testing.

**Next Step**: Begin Phase 0 implementation immediately.