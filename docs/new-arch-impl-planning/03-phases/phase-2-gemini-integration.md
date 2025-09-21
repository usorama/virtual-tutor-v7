# Phase 2: Gemini Live Integration & Voice Flow
**Duration**: Days 4-5 (16 hours)
**Branch**: `phase-2-gemini-integration`
**Prerequisites**: Phase 1 completed and merged

## Objective
Integrate Google Gemini Live API for real-time AI teacher functionality, complete the voice processing pipeline, and implement the dual-channel transcription display with math rendering.

## Pre-Phase Checklist
- [ ] Phase 1 merged to main
- [ ] Core services stable and tested
- [ ] Gemini API key obtained
- [ ] LiveKit Cloud account ready
- [ ] WebSocket singleton verified working

## Day 4 Tasks (8 hours)

### Task 2.1: Gemini Live API Setup
**Duration**: 2 hours
**Owner**: Human + AI
**Feature Flag**: `enableGeminiLive`

#### Subtasks:
1. **Configure Gemini credentials**
   ```typescript
   // .env.local
   GOOGLE_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.0-flash-live
   GEMINI_REGION=asia-south1
   ```

2. **Implement Gemini service**
   ```typescript
   // src/protected-core/voice-engine/gemini/gemini-service.ts
   - WebSocket connection to Gemini Live
   - Authentication handling
   - Stream management
   - Error recovery
   ```

3. **Create Gemini config**
   ```typescript
   // src/protected-core/voice-engine/gemini/config.ts
   interface GeminiConfig {
     model: 'gemini-2.0-flash-live';
     responseModalities: ['TEXT', 'AUDIO'];
     inputAudioTranscription: {};
     outputAudioTranscription: {};
     temperature: 0.7;
     topP: 0.9;
   }
   ```

4. **Test Gemini connection**
   - Basic connection test
   - Auth verification
   - Simple prompt test
   - Latency measurement

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Integrate Gemini Live API service"
   ```

### Task 2.2: Audio Stream Integration
**Duration**: 2 hours
**Owner**: AI
**Feature Flag**: `enableAudioStreaming`

#### Subtasks:
1. **Create audio stream manager**
   ```typescript
   // src/protected-core/voice-engine/audio/stream-manager.ts
   - Bidirectional audio streaming
   - Buffer management
   - Stream synchronization
   - Quality monitoring
   ```

2. **Implement audio encoder/decoder**
   ```typescript
   // src/protected-core/voice-engine/audio/codec.ts
   - PCM to Opus encoding
   - Opus to PCM decoding
   - Sample rate conversion
   - Bit rate optimization
   ```

3. **Build stream multiplexer**
   ```typescript
   // src/protected-core/voice-engine/audio/multiplexer.ts
   - Combine LiveKit + Gemini streams
   - Stream priority management
   - Bandwidth allocation
   - Fallback handling
   ```

4. **Add stream monitoring**
   - Packet loss detection
   - Jitter buffer stats
   - Bandwidth usage
   - Quality metrics

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Implement audio stream integration"
   ```

### Task 2.3: Transcription Pipeline
**Duration**: 2 hours
**Owner**: Human + AI
**Feature Flag**: `enableTranscriptionPipeline`

#### Subtasks:
1. **Connect Gemini transcription**
   ```typescript
   // src/protected-core/transcription/gemini-connector.ts
   - Receive transcription events
   - Parse transcription data
   - Extract timestamps
   - Handle speaker tags
   ```

2. **Implement dual-channel processor**
   ```typescript
   // src/protected-core/transcription/dual-channel.ts
   - Parallel audio + text processing
   - Synchronization logic
   - Buffering strategy
   - Latency compensation
   ```

3. **Create transcription aggregator**
   ```typescript
   // src/protected-core/transcription/aggregator.ts
   - Combine partial transcripts
   - Handle corrections
   - Manage final transcripts
   - Update display buffer
   ```

4. **Add transcription events**
   - New transcription event
   - Correction event
   - Final transcription event
   - Math detection event

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Implement transcription pipeline"
   ```

### Task 2.4: Math Detection & Processing
**Duration**: 1.5 hours
**Owner**: AI
**Feature Flag**: `enableMathProcessing`

#### Subtasks:
1. **Enhance math detector**
   ```typescript
   // src/protected-core/transcription/math/advanced-detector.ts
   - Spoken math patterns
   - LaTeX extraction
   - Inline vs display math
   - Context awareness
   ```

2. **Implement speech-to-LaTeX**
   ```typescript
   // src/protected-core/transcription/math/speech-to-latex.ts
   const patterns = {
     "x squared": "x^2",
     "square root of": "\\sqrt{}",
     "fraction": "\\frac{}{}",
     "integral": "\\int",
     "summation": "\\sum"
   };
   ```

3. **Create math context manager**
   ```typescript
   // src/protected-core/transcription/math/context.ts
   - Track math mode state
   - Previous equations memory
   - Variable tracking
   - Unit awareness
   ```

4. **Add math validation**
   - Syntax validation
   - Bracket matching
   - Variable consistency
   - Unit checking

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Implement advanced math processing"
   ```

### Task 2.5: Day 4 Integration Testing
**Duration**: 30 minutes
**Owner**: Human

#### Subtasks:
1. **Test Gemini connection**
   - Connection stability
   - Reconnection handling
   - Auth refresh
   - Error scenarios

2. **Test audio streaming**
   - Bidirectional flow
   - Latency measurement
   - Quality assessment
   - Buffer behavior

3. **Test transcription flow**
   - Text accuracy
   - Math detection
   - Synchronization
   - Display updates

4. **Create Day 4 report**

5. **Git commit checkpoint**
   ```bash
   git commit -am "test: Day 4 integration testing"
   ```

## Day 5 Tasks (8 hours)

### Task 2.6: Remove Tldraw & Simplify Display
**Duration**: 2 hours
**Owner**: Human + AI
**Feature Flag**: `enableSimplifiedDisplay`
**CRITICAL**: Must complete before building new components

#### Subtasks:
1. **Remove tldraw dependencies completely**
   ```bash
   # Remove from package.json
   npm uninstall @tldraw/tldraw @tldraw/assets

   # Remove all tldraw imports and components
   # Delete: src/components/whiteboard/
   # Delete: src/features/collaborative-drawing/
   # Clean up: src/app/classroom/page.tsx
   ```

2. **Clean up collaborative features**
   ```typescript
   // Remove from codebase:
   - Canvas/drawing tools
   - Collaborative cursors
   - Shape synchronization
   - Whiteboard state management
   ```

3. **Simplify state management**
   ```typescript
   // Keep only:
   - Voice session state
   - Transcription buffer
   - User authentication
   // Remove:
   - Canvas state
   - Drawing state
   - Collaboration state
   ```

4. **Git commit checkpoint**
   ```bash
   git commit -am "refactor: Remove tldraw and collaborative features"
   ```

### Task 2.6b: Build Focused TranscriptionDisplay
**Duration**: 2 hours
**Owner**: AI
**Feature Flag**: `enableTranscriptionDisplay`
**Based on**: docs/kb.md/ux-flow.md specifications

#### Subtasks:
1. **Create simplified TranscriptionDisplay component**
   ```tsx
   // src/components/transcription/TranscriptionDisplay.tsx
   // Exactly as specified in ux-flow.md:
   - Live AI teacher audio indicator
   - Real-time text with math rendering
   - Synchronized highlighting
   - No drawing tools, just display
   ```

2. **Implement MathRenderer component**
   ```tsx
   // src/components/transcription/MathRenderer.tsx
   - KaTeX integration
   - Inline/block rendering
   - Error boundaries
   - Visual highlighting during speech
   ```

3. **Build minimal AudioIndicator**
   ```tsx
   // src/components/transcription/AudioIndicator.tsx
   - Simple "AI Teacher Speaking" indicator
   - Volume visualization
   - No complex controls
   ```

4. **Create focused layout**
   ```tsx
   // src/app/classroom/page.tsx
   // Clean, focused layout:
   - Header: Session info
   - Main: TranscriptionDisplay only
   - Footer: Basic controls (pause/resume)
   - No sidebar, no tools, no canvas
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Implement focused transcription display from ux-flow"
   ```

### Task 2.7: Voice Session Management
**Duration**: 2 hours
**Owner**: AI
**Feature Flag**: `enableVoiceSession`

#### Subtasks:
1. **Create session orchestrator**
   ```typescript
   // src/protected-core/session/orchestrator.ts
   - Session lifecycle management
   - Service coordination
   - State management
   - Resource cleanup
   ```

2. **Implement session state machine**
   ```typescript
   // src/protected-core/session/state-machine.ts
   States: IDLE -> CONNECTING -> ACTIVE -> ENDING -> IDLE
   - State transitions
   - Guard conditions
   - Side effects
   - Error states
   ```

3. **Build session persistence**
   ```typescript
   // src/protected-core/session/persistence.ts
   - Save session data
   - Resume capability
   - Session history
   - Analytics events
   ```

4. **Add session monitoring**
   - Duration tracking
   - Interaction count
   - Error tracking
   - Quality metrics

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Implement voice session management"
   ```

### Task 2.8: End-to-End Voice Flow
**Duration**: 2 hours
**Owner**: Human
**Feature Flag**: `enableFullVoiceFlow`

#### Subtasks:
1. **Wire up classroom page**
   ```tsx
   // src/app/classroom/page.tsx
   - Initialize voice session
   - Connect UI components
   - Handle user interactions
   - Display transcriptions
   ```

2. **Implement voice hooks**
   ```typescript
   // src/hooks/useVoiceSession.ts
   - Session state hook
   - Audio controls hook
   - Transcription hook
   - Error handling hook
   ```

3. **Create voice context**
   ```tsx
   // src/contexts/VoiceContext.tsx
   - Global voice state
   - Service instances
   - Event subscriptions
   - Provider component
   ```

4. **Add voice middleware**
   - Permission checks
   - Device detection
   - Browser compatibility
   - Fallback handling

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Complete end-to-end voice flow"
   ```

### Task 2.9: Performance Optimization
**Duration**: 1.5 hours
**Owner**: AI
**Feature Flag**: `enableOptimizations`

#### Subtasks:
1. **Optimize rendering performance**
   ```typescript
   // Optimizations:
   - React.memo for components
   - useMemo for expensive computations
   - Virtual scrolling for transcripts
   - RequestAnimationFrame for updates
   ```

2. **Implement caching strategies**
   ```typescript
   // Caching layers:
   - Rendered math equations
   - Audio buffers
   - Transcription segments
   - API responses
   ```

3. **Add lazy loading**
   - Component lazy loading
   - Audio chunk loading
   - Transcription pagination
   - Asset optimization

4. **Optimize WebSocket usage**
   - Message batching
   - Binary protocols
   - Compression
   - Keep-alive tuning

5. **Git commit checkpoint**
   ```bash
   git commit -am "perf: Optimize voice flow performance"
   ```

### Task 2.10: Testing & Documentation
**Duration**: 30 minutes
**Owner**: Human

#### Subtasks:
1. **End-to-end tests**
   ```typescript
   // tests/e2e/voice-flow.spec.ts
   - Complete voice session test
   - Transcription accuracy test
   - Math rendering test
   - Error recovery test
   ```

2. **Performance benchmarks**
   - Latency measurements
   - Memory profiling
   - CPU usage tracking
   - Network analysis

3. **Update documentation**
   - API changes
   - New components
   - Usage examples
   - Troubleshooting guide

4. **Phase 2 completion report**

5. **Merge to main**
   ```bash
   gh pr create --title "Phase 2: Gemini Integration & Voice Flow"
   git checkout main
   git merge phase-2-gemini-integration
   git tag -a v0.3.0-voice -m "Phase 2: Voice flow complete"
   ```

## Definition of Done (DoD)

### Must Complete
- [x] Gemini Live API connected and working
- [x] Audio streaming bidirectional
- [x] Transcription displayed in real-time
- [x] Math equations rendering correctly
- [x] Voice session management working
- [x] End-to-end flow tested
- [x] < 300ms transcription latency
- [x] Zero console errors

### Should Complete
- [x] Performance optimizations applied
- [x] Caching strategies implemented
- [x] Error recovery working
- [x] Session persistence functional

### Could Complete (Bonus)
- [ ] Voice commands implementation
- [ ] Multi-language support
- [ ] Advanced math animations

## Success Criteria

### Technical Criteria
1. **Latency**: < 300ms for transcription display
2. **Accuracy**: > 95% transcription accuracy
3. **Math**: 100% correct LaTeX rendering
4. **Stability**: No WebSocket disconnections
5. **Performance**: < 5% CPU usage idle

### Functional Criteria
1. User can start voice session
2. AI teacher responds naturally
3. Math equations display beautifully
4. Transcription scrolls smoothly
5. Audio quality is clear

### User Experience Criteria
1. Intuitive controls
2. Clear visual feedback
3. Smooth interactions
4. Error messages helpful
5. Responsive design

## Risk Mitigation

### High Risk Items
1. **Gemini API instability**
   - Mitigation: Retry logic with backoff
   - Fallback: Queue and replay

2. **Math rendering errors**
   - Mitigation: Try-catch with fallback
   - Fallback: Display raw LaTeX

3. **Audio sync issues**
   - Mitigation: Buffer management
   - Fallback: Resync on error

## Dependencies for Phase 3

1. Gemini integration must be stable
2. Transcription must be accurate
3. Math rendering must be reliable
4. Performance must be acceptable

## Post-Phase Checklist

- [ ] Voice flow working end-to-end
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Feature flags tested
- [ ] Merged to main
- [ ] Demo video recorded

---

**Phase 2 Completion Timestamp**: [To be filled]
**Total Time Taken**: [To be filled]
**Blockers Encountered**: [To be filled]
**Lessons Learned**: [To be filled]