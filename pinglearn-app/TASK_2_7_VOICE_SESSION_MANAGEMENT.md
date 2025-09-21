# Task 2.7: Voice Session Management Implementation

## Research Phase Completed ✅

### Manifest Research ✅
- No manifest system for this project
- Using Protected Core Architecture instead
- Protected Core APIs identified in src/protected-core/

### Context Research ✅
- SessionOrchestrator exists and manages voice sessions
- VoiceService API available through protected core
- Current database has learning_sessions but missing voice_sessions/transcripts tables

### Web Search & Codebase Analysis ✅
- Current migrations only support learning_sessions
- Need to create voice_sessions and transcripts tables
- Protected Core provides VoiceService, SessionOrchestrator APIs
- Must NOT modify protected-core directory

## Implementation Plan

### Task Breakdown:
1. **Create VoiceSessionManager service** - src/features/voice/VoiceSessionManager.ts
2. **Create database migration** - for voice_sessions and transcripts tables
3. **Create React hooks** - src/hooks/useVoiceSession.ts, useSessionState.ts, useSessionMetrics.ts
4. **Implement session recovery** - error handling and reconnection
5. **Add session controls** - start/stop/pause/resume/mute/volume

### Database Schema Needed:
```sql
-- voice_sessions table
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  livekit_room_name TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('idle', 'connecting', 'active', 'paused', 'ended', 'error')),
  audio_quality TEXT CHECK (audio_quality IN ('poor', 'fair', 'good', 'excellent')),
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- transcripts table
CREATE TABLE public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  speaker TEXT CHECK (speaker IN ('student', 'tutor')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence DECIMAL(3,2),
  math_content BOOLEAN DEFAULT FALSE
);

-- session_analytics table
CREATE TABLE public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  comprehension_score INTEGER CHECK (comprehension_score >= 0 AND comprehension_score <= 100),
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Protected Core APIs to Use:
- SessionOrchestrator.getInstance()
- VoiceService from protected-core
- TranscriptionService for transcript processing
- WebSocketManager (through SessionOrchestrator only)

### Success Criteria:
- TypeScript: 0 errors
- Session lifecycle works (create, start, pause, resume, end)
- Error recovery with exponential backoff
- Supabase integration functional
- Metrics tracking operational
- All tests pass

## Status: READY TO IMPLEMENT