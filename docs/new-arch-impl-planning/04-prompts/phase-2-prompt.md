# Phase 2 Implementation Prompt
**For use with AI assistants to execute Phase 2**

## Context Setup Prompt

You are implementing Phase 2 of the PingLearn architecture pivot. This is the most critical phase where we integrate Google Gemini Live API for real-time AI teacher functionality and complete the voice processing pipeline with dual-channel transcription and math rendering.

## Prerequisites Check

Before starting, verify Phase 1 completion:
```bash
# Verify protected core services
ls src/protected-core/voice-engine/
ls src/protected-core/transcription/

# Check tests are passing
npm test -- --coverage

# Verify WebSocket singleton
npm test -- websocket.test

# Ensure no TypeScript errors
npm run typecheck
```

## Your Mission

Execute Phase 2: Gemini Live Integration & Voice Flow according to `/docs/new-arch-impl-planning/03-phases/phase-2-gemini-integration.md`

**CRITICAL**: This phase makes the AI teacher come alive. The transcription with math must work perfectly.

## Day 4 Implementation - Gemini Integration

### Task 2.1: Gemini Live API Setup

First, ensure you have the Gemini API key:
```bash
# Add to .env.local
GOOGLE_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.0-flash-live
GEMINI_REGION=asia-south1
```

Now implement the REAL Gemini service:

```typescript
// src/protected-core/voice-engine/gemini/gemini-service.ts
import { WebSocketManager } from '../../websocket/manager/singleton-manager';

export class GeminiLiveService {
  private wsManager: WebSocketManager;
  private apiKey: string;
  private model = 'gemini-2.0-flash-live';
  private sessionConfig: any;

  constructor() {
    this.wsManager = WebSocketManager.getInstance();
    this.apiKey = process.env.GOOGLE_API_KEY!;

    this.sessionConfig = {
      model: this.model,
      generation_config: {
        response_modalities: ['TEXT', 'AUDIO'],
        temperature: 0.7,
        top_p: 0.9,
      },
      system_instruction: {
        parts: [{
          text: `You are an expert AI teacher specializing in mathematics and science.
          You explain concepts clearly, use examples, and help students learn step by step.
          When discussing mathematical concepts, always provide the LaTeX notation enclosed in $ symbols.
          For example: "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"`
        }]
      },
    };
  }

  async connect(): Promise<void> {
    const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

    await this.wsManager.connect(wsUrl);

    // Send initial configuration
    this.wsManager.send({
      setup: this.sessionConfig
    });

    // Handle messages
    this.wsManager.on('message', this.handleGeminiMessage.bind(this));
  }

  private handleGeminiMessage(data: string): void {
    const message = JSON.parse(data);

    if (message.transcription) {
      this.processTranscription(message.transcription);
    }

    if (message.audio) {
      this.processAudio(message.audio);
    }

    if (message.error) {
      console.error('Gemini error:', message.error);
      this.handleError(message.error);
    }
  }

  private processTranscription(transcription: any): void {
    // Extract text and detect math
    const text = transcription.text || '';
    const hasMath = text.includes('$');

    // Emit transcription event
    this.emit('transcription', {
      text,
      hasMath,
      timestamp: Date.now(),
      isFinal: transcription.isFinal || false,
    });
  }

  private processAudio(audioData: string): void {
    // Convert base64 audio to ArrayBuffer
    const buffer = this.base64ToArrayBuffer(audioData);

    // Emit audio event for playback
    this.emit('audio', buffer);
  }

  async sendAudio(audioBuffer: ArrayBuffer): void {
    // Convert to base64 for WebSocket transmission
    const base64Audio = this.arrayBufferToBase64(audioBuffer);

    this.wsManager.send({
      audio: {
        data: base64Audio,
        mimeType: 'audio/pcm',
        sampleRate: 16000,
      }
    });
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Event emitter functionality
  private listeners: Map<string, Function[]> = new Map();

  emit(event: string, data: any): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }
}
```

### Task 2.2: Dual-Channel Processing

Implement the critical dual-channel processor that handles audio and text simultaneously:

```typescript
// src/protected-core/transcription/dual-channel-processor.ts
export class DualChannelProcessor {
  private audioChannel: AudioChannel;
  private textChannel: TextChannel;
  private synchronizer: ChannelSynchronizer;

  constructor() {
    this.audioChannel = new AudioChannel();
    this.textChannel = new TextChannel();
    this.synchronizer = new ChannelSynchronizer();
  }

  async processGeminiOutput(data: GeminiOutput): Promise<void> {
    // Process both channels in parallel
    const [audioResult, textResult] = await Promise.all([
      this.audioChannel.process(data.audio),
      this.textChannel.process(data.text)
    ]);

    // Synchronize the outputs
    const synchronized = this.synchronizer.sync(audioResult, textResult);

    // Emit synchronized result
    this.emit('synchronized', synchronized);
  }
}

class AudioChannel {
  async process(audioData: ArrayBuffer): Promise<AudioResult> {
    // Play audio immediately (no delay)
    await this.playAudio(audioData);

    return {
      timestamp: Date.now(),
      duration: this.calculateDuration(audioData),
      played: true
    };
  }

  private async playAudio(buffer: ArrayBuffer): Promise<void> {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  }
}

class TextChannel {
  private mathRenderer: MathRenderer;

  constructor() {
    this.mathRenderer = new MathRenderer();
  }

  async process(text: string): Promise<TextResult> {
    // Detect math segments
    const mathSegments = this.mathRenderer.detectMath(text);

    // Process each segment
    const processed = await this.processSegments(text, mathSegments);

    return {
      original: text,
      processed,
      timestamp: Date.now()
    };
  }

  private async processSegments(text: string, mathSegments: MathSegment[]): Promise<ProcessedSegment[]> {
    const result: ProcessedSegment[] = [];
    let lastIndex = 0;

    for (const segment of mathSegments) {
      // Add text before math
      if (segment.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: text.substring(lastIndex, segment.startIndex)
        });
      }

      // Render and add math
      const rendered = this.mathRenderer.renderMath(segment.content);
      result.push({
        type: 'math',
        content: segment.content,
        rendered,
      });

      lastIndex = segment.endIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return result;
  }
}
```

### Task 2.3: React Components for Display

Create the beautiful transcription display:

```tsx
// src/components/transcription/LiveTranscription.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MathRenderer } from './MathRenderer';

export function LiveTranscription() {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to transcription events
    const geminiService = GeminiLiveService.getInstance();

    geminiService.on('transcription', (data: any) => {
      handleNewTranscription(data);
    });

    return () => {
      // Cleanup
    };
  }, []);

  const handleNewTranscription = (data: TranscriptionData) => {
    const newItem: TranscriptItem = {
      id: Date.now(),
      text: data.text,
      hasMath: data.hasMath,
      timestamp: data.timestamp,
      isFinal: data.isFinal,
    };

    setTranscript(prev => [...prev, newItem]);

    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  return (
    <div className="transcription-container">
      <div className="transcription-header">
        {isLive && (
          <span className="live-indicator">
            <span className="pulse"></span>
            LIVE
          </span>
        )}
        <h3>AI Teacher Transcription</h3>
      </div>

      <div className="transcript-content" ref={containerRef}>
        {transcript.map(item => (
          <TranscriptLine key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function TranscriptLine({ item }: { item: TranscriptItem }) {
  if (!item.hasMath) {
    return (
      <div className="transcript-line">
        <span className="timestamp">
          {new Date(item.timestamp).toLocaleTimeString()}
        </span>
        <span className="text">{item.text}</span>
      </div>
    );
  }

  // Parse and render math
  return (
    <div className="transcript-line with-math">
      <span className="timestamp">
        {new Date(item.timestamp).toLocaleTimeString()}
      </span>
      <MathRenderer text={item.text} />
    </div>
  );
}
```

```tsx
// src/components/transcription/MathRenderer.tsx
import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function MathRenderer({ text }: { text: string }) {
  const renderContent = () => {
    // Split text by math delimiters
    const parts = text.split(/(\$[^$]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        // Render math
        const latex = part.slice(1, -1);

        try {
          const html = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
          });

          return (
            <span
              key={index}
              className="math-inline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (error) {
          console.error('Math render error:', error);
          return <span key={index} className="math-error">{part}</span>;
        }
      }

      // Regular text
      return <span key={index}>{part}</span>;
    });
  };

  return <div className="math-content">{renderContent()}</div>;
}
```

### Critical CSS Styling

```css
/* src/styles/transcription.css */
.transcription-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: 500px;
  display: flex;
  flex-direction: column;
}

.transcription-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-weight: 600;
  font-size: 12px;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.transcript-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.transcript-line {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.timestamp {
  color: #6b7280;
  font-size: 12px;
  font-family: monospace;
  flex-shrink: 0;
}

.math-inline {
  display: inline-block;
  margin: 0 4px;
  font-size: 1.1em;
}

.math-content {
  line-height: 1.8;
}
```

## Day 5 Implementation - Complete Integration

### Task 2.4: Voice Session Orchestrator

```typescript
// src/protected-core/session/voice-session-orchestrator.ts
export class VoiceSessionOrchestrator {
  private geminiService: GeminiLiveService;
  private livekitService: LiveKitVoiceService;
  private transcriptionProcessor: DualChannelProcessor;
  private sessionState: SessionState = 'idle';

  async startSession(studentId: string, topic: string): Promise<string> {
    try {
      // Start all services
      const [geminiSession, livekitSession] = await Promise.all([
        this.geminiService.connect(),
        this.livekitService.startSession(studentId, topic)
      ]);

      // Wire up event handlers
      this.setupEventHandlers();

      this.sessionState = 'active';
      return `session_${Date.now()}`;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Gemini → Transcription
    this.geminiService.on('transcription', (data) => {
      this.transcriptionProcessor.processGeminiOutput(data);
    });

    // LiveKit → Gemini
    this.livekitService.on('audio', (audioData) => {
      this.geminiService.sendAudio(audioData);
    });

    // Error handling
    this.geminiService.on('error', this.handleError.bind(this));
    this.livekitService.on('error', this.handleError.bind(this));
  }

  private handleError(error: any): void {
    console.error('Session error:', error);
    // Implement recovery logic
  }
}
```

### Integration in Classroom Page

```tsx
// src/app/classroom/page.tsx
'use client';

import { LiveTranscription } from '@/components/transcription/LiveTranscription';
import { VoiceSessionOrchestrator } from '@/protected-core/session/voice-session-orchestrator';

export default function ClassroomPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const orchestrator = useRef<VoiceSessionOrchestrator>();

  const startLearningSession = async () => {
    orchestrator.current = new VoiceSessionOrchestrator();

    try {
      const sessionId = await orchestrator.current.startSession(
        userId,
        selectedTopic
      );

      setSessionActive(true);
      console.log('Session started:', sessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  return (
    <div className="classroom-container">
      <div className="classroom-header">
        <h1>AI Classroom</h1>
        <button
          onClick={startLearningSession}
          disabled={sessionActive}
          className="start-button"
        >
          {sessionActive ? 'Session Active' : 'Start Learning'}
        </button>
      </div>

      <div className="classroom-content">
        <div className="video-section">
          {/* LiveKit video/audio components */}
        </div>

        <div className="transcription-section">
          <LiveTranscription />
        </div>
      </div>
    </div>
  );
}
```

## Critical Testing Requirements

### End-to-End Voice Flow Test

```typescript
// tests/e2e/voice-flow.test.ts
describe('Complete Voice Flow', () => {
  it('should display math equations in real-time', async () => {
    // Start session
    await page.click('[data-testid="start-session"]');

    // Wait for connection
    await page.waitForSelector('.live-indicator');

    // Simulate Gemini sending math
    await mockGeminiMessage({
      transcription: {
        text: 'The formula is $E = mc^2$',
        isFinal: true
      }
    });

    // Verify math renders
    const mathElement = await page.waitForSelector('.katex');
    expect(mathElement).toBeTruthy();

    // Verify LaTeX rendered correctly
    const mathContent = await mathElement.textContent();
    expect(mathContent).toContain('E');
    expect(mathContent).toContain('=');
    expect(mathContent).toContain('mc');
  });
});
```

## Performance Requirements

The system MUST meet these metrics:
- **Transcription latency**: < 300ms
- **Math rendering**: < 50ms
- **Audio playback**: No perceptible delay
- **Memory usage**: < 100MB for session

## Common Issues & Solutions

### Issue: Gemini WebSocket disconnects
```typescript
// Solution: Implement automatic reconnection
wsManager.on('disconnected', async () => {
  await delay(1000);
  await wsManager.connect(lastUrl);
});
```

### Issue: Math not rendering
```typescript
// Solution: Fallback to text display
try {
  return katex.renderToString(latex);
} catch (error) {
  return `[Math: ${latex}]`;
}
```

### Issue: Audio/text sync issues
```typescript
// Solution: Use timestamp alignment
const alignTimestamps = (audio, text) => {
  const offset = audio.timestamp - text.timestamp;
  if (Math.abs(offset) > 100) {
    // Resync
  }
};
```

## Phase 2 Completion Checklist

Before marking complete:
- [ ] Gemini Live API connected successfully
- [ ] Transcription displays in real-time
- [ ] Math equations render beautifully
- [ ] Audio plays without delay
- [ ] Dual-channel processing working
- [ ] < 300ms latency achieved
- [ ] All tests passing
- [ ] No console errors
- [ ] Feature flags control features
- [ ] Documentation updated

## Handoff Report

```markdown
# Phase 2 Completion Report

## Gemini Integration
- API connected: ✅
- WebSocket stable: ✅
- Transcription working: ✅
- Audio streaming: ✅

## Math Rendering
- KaTeX integrated: ✅
- Inline math: ✅
- Display math: ✅
- Error handling: ✅

## Performance Metrics
- Transcription latency: ___ms
- Math rendering: ___ms
- Audio delay: ___ms
- Memory usage: ___MB

## Known Issues
[List any remaining issues]

## Demo Video
[Link to recording showing voice flow]
```

This is the MOST CRITICAL phase. The AI teacher must work perfectly!