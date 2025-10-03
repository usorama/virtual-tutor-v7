# PingLearn Backend Data Flow - Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React Frontend)                             │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      classroom/page.tsx                               │  │
│  │                                                                        │  │
│  │  [1] checkAuth() ──────────────┐                                     │  │
│  │       │                         │                                     │  │
│  │       │ Query #1: getUser()     │  Query #2: profiles SELECT       │  │
│  │       │                         │                                     │  │
│  │       ▼                         ▼                                     │  │
│  │  ┌─────────────────────────────────────────────┐                    │  │
│  │  │       SUPABASE (PostgreSQL)                 │                    │  │
│  │  │  ┌──────────────┬──────────────────────┐   │                    │  │
│  │  │  │ auth.users   │ public.profiles      │   │                    │  │
│  │  │  └──────────────┴──────────────────────┘   │                    │  │
│  │  └─────────────────────────────────────────────┘                    │  │
│  │       │                                                               │  │
│  │       │ ⚠️ BOTTLENECK #1: Sequential queries instead of JOIN        │  │
│  │       │                                                               │  │
│  │  [2] startVoiceSession() ─────────────────────────────┐             │  │
│  │       │                                                 │             │  │
│  │       ▼                                                 │             │  │
│  │  VoiceSessionManager.createSession()                  │             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│       │                                                   │                 │
│       │                                                   │                 │
└───────┼───────────────────────────────────────────────────┼─────────────────┘
        │                                                   │
        │                                                   │
        ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (Supabase PostgreSQL)                     │
│                                                                              │
│  [3] INSERT INTO learning_sessions ───────────────────────────┐            │
│       (student_id, room_name, chapter_focus)                  │            │
│       │                                                        │            │
│       │ ✅ Returns: { id: uuid, ... }                        │            │
│       │                                                        │            │
│       ▼                                                        │            │
│  [4] INSERT INTO voice_sessions ──────────────────────────────┤            │
│       (session_id: ^^, livekit_room_name, status)            │            │
│       │                                                        │            │
│       │ ⚠️ BOTTLENECK #2: No transaction wrapper             │            │
│       │    Risk: Orphaned learning_sessions if #4 fails      │            │
│       │                                                        │            │
│       ▼                                                        │            │
│  ┌──────────────────────────────────────────────────────┐   │            │
│  │  Tables:                                              │   │            │
│  │  • learning_sessions (id, student_id, room_name)     │   │            │
│  │  • voice_sessions (id, session_id FK, room_name)     │   │            │
│  │  • transcripts (UNUSED - no real-time inserts! 🔴)   │   │            │
│  └──────────────────────────────────────────────────────┘   │            │
│       │                                                        │            │
└───────┼────────────────────────────────────────────────────────┼────────────┘
        │                                                        │
        │                                                        │
        ▼                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROTECTED CORE LAYER                                  │
│                                                                              │
│  [5] SessionOrchestrator.startSession()                                     │
│       │                                                                      │
│       ├──> WebSocketManager.connect() ────────────> WebSocket Connection   │
│       │                                                                      │
│       ├──> LiveKitVoiceService.initialize() ──────> LiveKit Cloud          │
│       │     (room: "session_voice_xxxxx")                                  │
│       │                                                                      │
│       └──> DisplayBuffer (IN-MEMORY SINGLETON) ────┐                       │
│            private items: DisplayItem[] = []         │                       │
│            max 1000 items                            │                       │
│            ⚠️ BOTTLENECK #3: No database backup     │                       │
│            🔴 RISK: Browser crash = data loss       │                       │
│                                                       │                       │
│  [6] EventBus.on('livekit:transcript', listener)     │                       │
│       setupLiveKitDataChannelListener()             │                       │
│                                                       │                       │
└───────────────────────────────────────────────────────┼───────────────────────┘
                                                       │
                                                       │
        ┌──────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME TRANSCRIPT FLOW (Critical Path)               │
│                                                                              │
│  [LiveKit Python Agent] ──> Gemini Live API ──> Sends transcript JSON      │
│       │                                                                      │
│       │ Data Channel Message:                                               │
│       │ { segments: [{ type: 'text', content: '...' }], speaker: 'teacher' }│
│       │                                                                      │
│       ▼                                                                      │
│  [LiveKitRoom.tsx] Receives data channel message                           │
│       │                                                                      │
│       │ handleDataReceived(data)                                            │
│       │                                                                      │
│       ▼                                                                      │
│  EventBus.emit('livekit:transcript', transcriptData) ──────────┐           │
│                                                                  │           │
│                                                                  │           │
│  SessionOrchestrator Listener ◄───────────────────────────────┘           │
│       │                                                                      │
│       │ For each segment:                                                   │
│       │                                                                      │
│       ▼                                                                      │
│  DisplayBuffer.addItem({                                                    │
│    type: segment.type,                                                      │
│    content: segment.content,                                                │
│    speaker: 'teacher'                                                       │
│  })                                                                          │
│       │                                                                      │
│       │ 1. Deduplication check (1-second window)                           │
│       │ 2. Add to items[] array                                             │
│       │ 3. notifySubscribers()                                              │
│       │                                                                      │
│       │ ⚠️ NOTE: NO database insert here!                                  │
│       │ 🔴 /api/transcription route exists but UNUSED                      │
│       │                                                                      │
│       ▼                                                                      │
│  Subscriber Callbacks Triggered                                             │
│       │                                                                      │
└───────┼─────────────────────────────────────────────────────────────────────┘
        │
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UI UPDATE LAYER                                       │
│                                                                              │
│  [7] TeachingBoardSimple.tsx                                                │
│       │                                                                      │
│       │ useEffect(() => {                                                   │
│       │   const buffer = getDisplayBuffer();                                │
│       │   const unsubscribe = buffer.subscribe((items) => {                │
│       │     processBufferItems(items);  // Transform & display             │
│       │   });                                                                │
│       │ }, []);                                                              │
│       │                                                                      │
│       ▼                                                                      │
│  processBufferItems(items: DisplayItem[])                                  │
│       │                                                                      │
│       ├──> Filter: Only teacher/AI content                                 │
│       ├──> Transform: DisplayItem → TeachingContent                        │
│       ├──> Aggregate: Combine text chunks into paragraphs                  │
│       │                                                                      │
│       ▼                                                                      │
│  setContent(teachingContent) ──> React Re-render                           │
│       │                                                                      │
│       └──> Student sees transcript on screen ✅                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT (Inefficient Polling)                  │
│                                                                              │
│  [8] classroom/page.tsx useEffect                                           │
│       │                                                                      │
│       │ setInterval(() => {  // ⚠️ BOTTLENECK #4                          │
│       │   const state = SessionOrchestrator.getSessionState();             │
│       │   if (state.status !== uiState) {                                  │
│       │     setSessionControlState(state.status);                          │
│       │   }                                                                  │
│       │ }, 500);  // Polls EVERY 500ms                                      │
│       │                                                                      │
│       │ ⚠️ INEFFICIENT: 120 checks/minute per user                        │
│       │ 📊 10 users = 1,200 ops/min                                        │
│       │ 📊 100 users = 12,000 ops/min                                      │
│       │                                                                      │
│       │ ✅ ALTERNATIVE: Use EventBus (already available!)                  │
│       │    SessionOrchestrator.on('stateChanged', handler)                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      SESSION END FLOW                                        │
│                                                                              │
│  [9] handleEndSession()                                                     │
│       │                                                                      │
│       ├──> SessionOrchestrator.endSession()                                │
│       │    ├──> Stop LiveKit connection                                    │
│       │    ├──> Disconnect WebSocket                                       │
│       │    ├──> Remove EventBus listeners                                  │
│       │    └──> DisplayBuffer stays in memory (no save!)                  │
│       │                                                                      │
│       └──> UPDATE learning_sessions                                        │
│            SET duration = X, engagement_score = Y                          │
│            WHERE id = sessionId                                             │
│                                                                              │
│       ⚠️ BOTTLENECK #5: Transcripts lost if session ends abnormally       │
│       🔴 No backup, no recovery, no history                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNUSED API ROUTE (Should Be Integrated!)                  │
│                                                                              │
│  POST /api/transcription ──────────────────────┐                           │
│  {                                              │                           │
│    sessionId: string,                          │                           │
│    speaker: string,                            │  ⚠️ NEVER CALLED         │
│    text: string,                               │  🔴 Database inserts      │
│    hasMath: boolean                            │     never happen          │
│  }                                              │                           │
│       │                                         │                           │
│       ├──> DisplayBuffer.addItem()  ─────────┤                           │
│       │                                         │                           │
│       └──> INSERT INTO transcripts  ◄─────────┘                           │
│            (session_id, speaker, content)     SHOULD BE HERE!              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONNECTION MANAGEMENT (No Pooling)                        │
│                                                                              │
│  ⚠️ BOTTLENECK #6: Every component creates new Supabase client             │
│                                                                              │
│  classroom/page.tsx:                                                        │
│    const supabase = createClient();  // NEW instance                       │
│                                                                              │
│  VoiceSessionManager.ts:                                                    │
│    private supabase = createClient();  // NEW instance                     │
│                                                                              │
│  /api/transcription/route.ts:                                               │
│    const supabase = await createClient();  // NEW instance                 │
│                                                                              │
│  Result: No connection pooling, potential connection exhaustion            │
│  Impact: 10 users = 20+ connections, 100 users = 200+ connections          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## LEGEND

- ✅ Working correctly
- ⚠️ Performance bottleneck (degraded performance)
- 🔴 Critical issue (data loss risk)
- ──> Data flow direction
- FK: Foreign key relationship

---

## KEY FINDINGS SUMMARY

1. **BOTTLENECK #1**: Sequential auth + profile queries (2x latency)
2. **BOTTLENECK #2**: No transaction wrapper for session inserts (integrity risk)
3. **BOTTLENECK #3**: No real-time transcript persistence (DATA LOSS RISK 🔴)
4. **BOTTLENECK #4**: 500ms polling loop (1,200 ops/min per 10 users)
5. **BOTTLENECK #5**: No transcript backup on crash (DATA LOSS RISK 🔴)
6. **BOTTLENECK #6**: No connection pooling (connection exhaustion risk)

---

## CRITICAL PATH ANALYSIS

**Transcript Flow Latency**:
```
LiveKit Agent → Data Channel → EventBus → DisplayBuffer → React Render
   ~50ms           ~10ms         ~5ms        ~10ms         ~16ms (60fps)
                                                           
Total: ~91ms (FAST ✅)
```

**BUT**: No database persistence = data loss risk 🔴

**Session Creation Latency**:
```
learning_sessions INSERT → voice_sessions INSERT → SessionOrchestrator
      ~150ms (DB)              ~150ms (DB)            ~50ms (setup)

Total: ~350ms (ACCEPTABLE, but could be 200ms with transaction)
```

---

**Agent 3A - Backend Architect**  
**Ready for Agent 3B consensus voting**
