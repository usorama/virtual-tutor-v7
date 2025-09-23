# FC-003: Real-Time Streaming Display Implementation

**Feature Code**: FC-003
**Title**: Real-Time Streaming Display with Math Rendering
**Date**: 2025-09-23
**Priority**: CRITICAL - ONLY PRIORITY
**Status**: Requirements Analysis Complete
**Target**: Phase 3 Stabilization UAT

## 📋 Executive Summary

Implementation of real-time text streaming synchronized with audio playback, featuring ChatGPT-style progressive rendering and KaTeX mathematical equation display. This is the ONLY PRIORITY for the platform.

## 🎯 Core Objectives

1. **Primary Goal**: Display teaching content in real-time as the AI teacher speaks
2. **Math Rendering**: Proper KaTeX rendering of mathematical equations
3. **Synchronization**: Text appears 400ms before speech (SHOW-then-TELL pattern)
4. **Progressive Display**: Smooth, character-by-character or word-by-word streaming

## 🔍 Current State Analysis

### What's Working
- LiveKit voice connection established
- Python agent sending transcripts via data channels
- Initial messages display correctly in TeachingBoardSimple
- KaTeX math rendering capability exists
- DisplayBuffer service receives initial data

### What's Broken
- **Content stops appearing after initial messages**
- No real-time streaming - content arrives in chunks
- No progressive character/word display
- No audio-text synchronization
- Polling-based updates instead of reactive streaming

### Root Cause
The current implementation uses a polling mechanism (`setInterval`) to check DisplayBuffer every 100ms. When the Python agent sends data via LiveKit data channels, it arrives as complete segments, not as a stream. After initial content, the update mechanism fails to capture new additions.

## 📐 Technical Requirements

### 1. Streaming Architecture

#### Option A: WebSocket Direct Stream (Recommended)
```typescript
// Direct WebSocket connection for real-time updates
interface StreamingService {
  connect(): Promise<void>;
  onToken(callback: (token: string) => void): void;
  onSegmentComplete(callback: (segment: TranscriptSegment) => void): void;
}
```

**Pros:**
- True real-time streaming
- Character-by-character control
- Direct connection to Python agent
- Low latency

**Cons:**
- Requires new WebSocket endpoint
- Bypasses LiveKit data channels
- Additional connection management

#### Option B: Enhanced LiveKit Data Channel
```typescript
// Stream tokens through LiveKit data packets
interface LiveKitStreaming {
  publishToken(token: string): void;
  publishPartialSegment(partial: PartialTranscript): void;
  onTokenReceived(callback: (token: string) => void): void;
}
```

**Pros:**
- Uses existing LiveKit connection
- No additional WebSocket needed
- Unified communication channel

**Cons:**
- LiveKit overhead for simple text
- May have higher latency
- Limited by LiveKit packet size

#### Option C: Server-Sent Events (SSE)
```typescript
// SSE endpoint for unidirectional streaming
interface SSEStreaming {
  stream: EventSource;
  onMessage(callback: (data: StreamData) => void): void;
}
```

**Pros:**
- Simple unidirectional stream
- Built-in reconnection
- HTTP-based (firewall friendly)

**Cons:**
- Unidirectional only
- Requires separate endpoint
- No binary data support

### 2. UI Rendering Strategy

#### Performance-Optimized Buffering (Based on Research)
```typescript
interface StreamingDisplay {
  // Buffer incoming tokens without re-render
  tokenBuffer: React.MutableRefObject<string[]>;

  // Batch updates every 30-50ms
  updateInterval: number; // 30-50ms optimal

  // Render batched tokens
  flushBuffer(): void;
}
```

**Key Principles:**
- Use React refs to buffer tokens without re-renders
- Batch state updates every 30-50ms
- Separate data reception from UI updates
- Avoid re-rendering on every token

### 3. Audio-Text Synchronization

#### Timestamp-Based Highlighting
```typescript
interface SyncedTranscript {
  segments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
    }>;
  }>;
  currentTime: number;
  highlightedRange: [number, number];
}
```

**Synchronization Methods:**
1. **Pre-display (SHOW-then-TELL)**: Text appears 400ms before audio
2. **Real-time highlighting**: Highlight words as they're spoken
3. **Karaoke-style**: Progressive word highlighting

### 4. Math Rendering Integration

#### Progressive Math Detection
```typescript
interface MathStreaming {
  // Detect incomplete math expressions
  detectPartialMath(text: string): boolean;

  // Wait for complete expression
  bufferUntilComplete(partial: string): string;

  // Render when complete
  renderMath(latex: string): string;
}
```

**Challenges:**
- Detecting incomplete LaTeX expressions
- Buffering partial equations
- Smooth transition from text to rendered math

## 🚀 Implementation Plan

### Phase 1: Fix Current Display Issue (Immediate)
**Timeline**: 1-2 hours

1. Debug why content stops appearing after initial messages
2. Implement reactive updates instead of polling
3. Ensure all transcripts flow through to display

```typescript
// Replace polling with reactive updates
useEffect(() => {
  const unsubscribe = displayBuffer.subscribe((items) => {
    setDisplayItems(items);
  });
  return unsubscribe;
}, []);
```

### Phase 2: Basic Streaming (Short-term)
**Timeline**: 4-6 hours

1. Implement WebSocket endpoint for streaming
2. Add token-by-token reception in frontend
3. Buffer and batch rendering updates

```typescript
// Basic streaming implementation
const streamingService = new StreamingService();
streamingService.onToken((token) => {
  tokenBufferRef.current.push(token);
});

// Batch render every 40ms
useInterval(() => {
  if (tokenBufferRef.current.length > 0) {
    const tokens = tokenBufferRef.current.splice(0);
    setContent(prev => prev + tokens.join(''));
  }
}, 40);
```

### Phase 3: Audio Synchronization (Medium-term)
**Timeline**: 8-12 hours

1. Add timestamps to transcript segments
2. Implement highlighting based on audio playback time
3. Add 400ms pre-display for SHOW-then-TELL

```typescript
// Synchronized display with timestamps
const syncedDisplay = useSyncedTranscript(audioPlayer);
syncedDisplay.onTimeUpdate((time) => {
  highlightWordsAtTime(time);
  preloadUpcoming(time + 400); // 400ms lookahead
});
```

### Phase 4: Advanced Features (Long-term)
**Timeline**: 2-3 days

1. Smooth character-by-character animation
2. Math equation progressive rendering
3. Advanced synchronization with word-level precision
4. Performance optimizations

## 🔄 Migration Strategy

### Step 1: Parallel Implementation
- Keep existing DisplayBuffer system
- Add new streaming layer alongside
- Switch between old/new with feature flag

### Step 2: Gradual Rollout
- Test streaming with select topics
- Monitor performance metrics
- Gather user feedback

### Step 3: Full Migration
- Remove old polling mechanism
- Optimize streaming performance
- Document new architecture

## 📊 Success Metrics

### Performance Targets
- **Latency**: <100ms from speech to text display
- **Frame Rate**: Maintain 60fps during streaming
- **CPU Usage**: <10% for text rendering
- **Memory**: <50MB for transcript buffer

### User Experience Targets
- **Readability**: Text appears before speech
- **Smoothness**: No visible stutter or lag
- **Math Rendering**: Equations display correctly
- **Synchronization**: ±50ms accuracy for highlighting

## 🚦 Implementation Options & Tradeoffs

### Option 1: Text-First, Highlight Later (Recommended for MVP)
**Implementation**: Display full text immediately, highlight as audio plays

**Pros:**
- Simpler implementation
- Students can read ahead
- No streaming complexity

**Cons:**
- Less engaging than progressive display
- Requires accurate timestamps

### Option 2: Progressive Line-by-Line
**Implementation**: Display one line at a time, slightly ahead of audio

**Pros:**
- Balanced complexity
- Good user experience
- Easier synchronization

**Cons:**
- Need line-level timestamps
- May feel choppy

### Option 3: Full Character Streaming (Ideal)
**Implementation**: Stream character-by-character with audio sync

**Pros:**
- Most engaging experience
- True real-time feel
- Best synchronization

**Cons:**
- Most complex implementation
- Highest performance requirements
- Requires extensive testing

## 🛠️ Technical Dependencies

### Required Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "katex": "^0.16.9",
    "livekit-client": "^1.15.4",
    "event-source-polyfill": "^1.0.31"
  }
}
```

### New Services Needed
1. Streaming WebSocket endpoint
2. Token buffer management
3. Synchronization service
4. Performance monitoring

## 🚨 Risk Analysis

### High Risk
- Performance degradation with long sessions
- Memory leaks from buffering
- Synchronization drift over time

### Medium Risk
- Math rendering breaking streaming flow
- Network latency affecting sync
- Browser compatibility issues

### Low Risk
- Initial implementation bugs
- UI polish requirements
- Feature flag management

## 📝 Acceptance Criteria

### Minimum Viable Implementation
- [ ] Text displays as teacher speaks
- [ ] Math equations render correctly
- [ ] No content disappears after initial display
- [ ] Smooth performance (60fps)

### Full Implementation
- [ ] Character-by-character streaming
- [ ] Perfect audio-text synchronization
- [ ] 400ms SHOW-then-TELL timing
- [ ] Word-level highlighting
- [ ] Math progressive rendering

## 🔗 Related Documents

- `/docs/change_records/protected_core_changes/PC-013.md` - LiveKit integration
- `/docs/change_records/feature_changes/FC-002-classroom-chat-ui-overhaul.md` - UI changes
- `/src/protected-core/contracts/transcription.contract.ts` - Service contracts

## 📌 Next Steps

1. **Immediate**: Fix content display stopping issue
2. **Today**: Implement basic streaming proof-of-concept
3. **This Week**: Complete Phase 1 & 2 implementation
4. **Next Week**: Audio synchronization and polish

## ✅ Approval & Sign-off

**Technical Review**: Pending
**User Acceptance**: Required before implementation
**Implementation Start**: Upon approval

---

**Note**: This is attempt #8. Previous attempts failed due to modifying protected core. This implementation will use approved APIs only and work within safe zones.