# Phase 3: AI Classroom & Progress Tracking

**Duration**: 4 days  
**Dependencies**: Phase 0, 1, 2 Complete  
**Goal**: Implement LiveKit voice classroom and progress tracking dashboard

## Part A: AI Classroom (5 SP)

### 3.1 LiveKit Setup & Integration (1 SP)
- 3.1.1: Install LiveKit SDKs (0.1 SP)
- 3.1.2: Setup LiveKit server connection (0.1 SP)
- 3.1.3: Configure room settings (0.1 SP)
- 3.1.4: Implement token generation (0.1 SP)
- 3.1.5: Create room join logic (0.1 SP)
- 3.1.6: Setup audio track management (0.1 SP)
- 3.1.7: Handle connection events (0.1 SP)
- 3.1.8: Implement reconnection logic (0.1 SP)
- 3.1.9: Add connection quality monitoring (0.1 SP)
- 3.1.10: Test LiveKit connection (0.1 SP)

### 3.2 Voice Controls UI (1 SP)
- 3.2.1: Create VoiceControls component (0.1 SP)
- 3.2.2: Add mute/unmute button (0.1 SP)
- 3.2.3: Create volume controls (0.1 SP)
- 3.2.4: Add audio level meter (0.1 SP)
- 3.2.5: Create ConnectionStatus indicator (0.1 SP)
- 3.2.6: Add speaking indicators (0.1 SP)
- 3.2.7: Create session timer (0.1 SP)
- 3.2.8: Add end session button (0.1 SP)
- 3.2.9: Style classroom UI (0.1 SP)
- 3.2.10: Test UI interactions (0.1 SP)

### 3.3 Speech Processing (1 SP)
- 3.3.1: Setup speech-to-text (0.1 SP)
- 3.3.2: Configure recognition settings (0.1 SP)
- 3.3.3: Handle transcription events (0.1 SP)
- 3.3.4: Setup text-to-speech (0.1 SP)
- 3.3.5: Configure voice settings (0.1 SP)
- 3.3.6: Implement audio playback (0.1 SP)
- 3.3.7: Add transcript display (0.1 SP)
- 3.3.8: Handle interruptions (0.1 SP)
- 3.3.9: Add transcript storage (0.1 SP)
- 3.3.10: Test speech processing (0.1 SP)

### 3.4 AI Integration (1 SP)
- 3.4.1: Setup Gemini client (0.1 SP)
- 3.4.2: Create system prompts (0.1 SP)
- 3.4.3: Implement context injection (0.1 SP)
- 3.4.4: Load textbook content (0.1 SP)
- 3.4.5: Handle AI responses (0.1 SP)
- 3.4.6: Implement streaming responses (0.1 SP)
- 3.4.7: Add response filtering (0.1 SP)
- 3.4.8: Handle AI errors (0.1 SP)
- 3.4.9: Add response caching (0.1 SP)
- 3.4.10: Test AI integration (0.1 SP)

### 3.5 Session Management (1 SP)
- 3.5.1: Create session start flow (0.1 SP)
- 3.5.2: Implement session persistence (0.1 SP)
- 3.5.3: Add pause/resume functionality (0.1 SP)
- 3.5.4: Save session transcripts (0.1 SP)
- 3.5.5: Track session duration (0.1 SP)
- 3.5.6: Handle session timeouts (0.1 SP)
- 3.5.7: Create session summary (0.1 SP)
- 3.5.8: Implement session recovery (0.1 SP)
- 3.5.9: Add session analytics (0.1 SP)
- 3.5.10: Test session lifecycle (0.1 SP)

## Part B: Progress Tracking (3 SP)

### 3.6 Progress Dashboard (1 SP)
- 3.6.1: Create dashboard page layout (0.1 SP)
- 3.6.2: Design stats cards (0.1 SP)
- 3.6.3: Add session count display (0.1 SP)
- 3.6.4: Show total learning time (0.1 SP)
- 3.6.5: Create streak counter (0.1 SP)
- 3.6.6: Add recent sessions list (0.1 SP)
- 3.6.7: Show subject breakdown (0.1 SP)
- 3.6.8: Add quick stats (0.1 SP)
- 3.6.9: Make dashboard responsive (0.1 SP)
- 3.6.10: Test dashboard display (0.1 SP)

### 3.7 Progress Analytics (1 SP)
- 3.7.1: Implement data aggregation (0.1 SP)
- 3.7.2: Calculate learning metrics (0.1 SP)
- 3.7.3: Track topic coverage (0.1 SP)
- 3.7.4: Measure session engagement (0.1 SP)
- 3.7.5: Create progress charts (0.1 SP)
- 3.7.6: Add trend analysis (0.1 SP)
- 3.7.7: Calculate mastery levels (0.1 SP)
- 3.7.8: Generate insights (0.1 SP)
- 3.7.9: Cache analytics data (0.1 SP)
- 3.7.10: Test analytics accuracy (0.1 SP)

### 3.8 Progress API & Export (1 SP)
- 3.8.1: Create dashboard API endpoint (0.1 SP)
- 3.8.2: Create subjects API endpoint (0.1 SP)
- 3.8.3: Create sessions API endpoint (0.1 SP)
- 3.8.4: Implement data filtering (0.1 SP)
- 3.8.5: Add date range queries (0.1 SP)
- 3.8.6: Create PDF export (0.1 SP)
- 3.8.7: Format export data (0.1 SP)
- 3.8.8: Add export templates (0.1 SP)
- 3.8.9: Handle large exports (0.1 SP)
- 3.8.10: Test all endpoints (0.1 SP)

## Success Criteria
- [ ] Voice sessions connect reliably
- [ ] Student can speak naturally to AI
- [ ] AI responds with textbook context
- [ ] Sessions save transcripts automatically
- [ ] Progress dashboard shows real data
- [ ] Charts display learning trends
- [ ] Export generates valid PDFs
- [ ] All metrics calculate correctly

## Files to Create
- `/src/app/classroom/[sessionId]/page.tsx`
- `/src/app/classroom/layout.tsx`
- `/src/components/classroom/VoiceControls.tsx`
- `/src/components/classroom/ConnectionStatus.tsx`
- `/src/components/classroom/TranscriptDisplay.tsx`
- `/src/components/classroom/SpeakingIndicator.tsx`
- `/src/components/classroom/SessionTimer.tsx`
- `/src/components/classroom/AudioLevelMeter.tsx`
- `/src/lib/livekit/client.ts`
- `/src/lib/livekit/server.ts`
- `/src/lib/livekit/hooks.ts`
- `/src/lib/ai/gemini.ts`
- `/src/lib/ai/prompts.ts`
- `/src/lib/ai/context.ts`
- `/src/lib/ai/streaming.ts`
- `/src/app/progress/page.tsx`
- `/src/app/progress/[subject]/page.tsx`
- `/src/app/progress/layout.tsx`
- `/src/components/progress/ProgressChart.tsx`
- `/src/components/progress/SessionHistory.tsx`
- `/src/components/progress/TopicMastery.tsx`
- `/src/components/progress/StreakCounter.tsx`
- `/src/components/progress/ExportButton.tsx`
- `/src/app/api/classroom/create/route.ts`
- `/src/app/api/classroom/join/route.ts`
- `/src/app/api/classroom/leave/route.ts`
- `/src/app/api/classroom/status/[sessionId]/route.ts`
- `/src/app/api/progress/dashboard/route.ts`
- `/src/app/api/progress/subjects/route.ts`
- `/src/app/api/progress/sessions/route.ts`
- `/src/app/api/progress/export/route.ts`
- `/src/hooks/useVoiceSession.ts`
- `/src/hooks/useLiveKit.ts`
- `/src/hooks/useProgress.ts`
- `/src/stores/classroomStore.ts`
- `/src/stores/progressStore.ts`

## Key Implementation Notes
- Use LiveKit React components where possible
- Keep AI prompts focused on textbook content
- Stream AI responses for better UX
- Save all transcripts for progress tracking
- Calculate metrics in real-time
- Cache dashboard data for performance
- Use Chart.js for visualizations
- Test with real voice interactions