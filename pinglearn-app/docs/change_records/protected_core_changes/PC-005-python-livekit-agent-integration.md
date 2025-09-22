# Protected Core Change Record PC-005

## Change Metadata
- **Change ID**: PC-005
- **Date**: 2025-09-22
- **Time**: 09:00 PST
- **Approval Status**: APPROVED ✅
- **Approval Timestamp**: 2025-09-22 10:45 PST
- **Approved By**: Stakeholder
- **Severity**: CRITICAL
- **Type**: Service Integration - Python LiveKit Agent
- **Affected Component**: Voice Session Architecture - Agent Bridge Implementation

## Change Summary
Integrate the existing Python LiveKit Agent service with the Protected Core architecture to enable complete audio-to-audio voice sessions through Gemini Live API, establishing the critical bridge between browser WebRTC and AI voice processing.

## Problem Statement
The current Protected Core architecture has a fundamental limitation that prevents voice sessions from functioning:

### Root Cause Analysis
**Critical Gap**: Protected Core provides browser-side orchestration but CANNOT bridge LiveKit and Gemini:

1. **Current Architecture Limitation**:
   - Protected Core LiveKitVoiceService: Connects browser to LiveKit (WebRTC)
   - Protected Core GeminiVoiceService: Attempts direct browser-to-Gemini connection
   - **Problem**: These are separate, unconnected streams with no server-side bridge

2. **Why Python Agent is MANDATORY**:
   - LiveKit requires server-side agents to process audio streams
   - Gemini Live API requires persistent backend WebSocket connection
   - Audio streams need server-side bridging between LiveKit and Gemini
   - Transcription processing requires backend coordination

3. **Existing Agent Issues Found**:
   ```python
   # Line 252 in agent.py - CRITICAL BUG
   assistant = VoiceAssistant(...)  # VoiceAssistant not imported!
   ```
   - Missing import statement for VoiceAssistant class
   - No webhook integration to send transcriptions to frontend
   - Environment variables not fully configured

### Evidence from Research (September 22, 2025)
Based on latest LiveKit documentation and API research:
- VoiceAssistant must be imported from `livekit.agents.voice_assistant`
- LiveKit Agents SDK v1.2.11 is current and properly installed
- Transcription forwarding uses `lk.transcription` text stream topic
- Frontend integration requires webhook endpoints for transcription data

## Proposed Solution: Complete Agent Integration

### Architecture Overview
```
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js + Protected Core)      │
│  - Session orchestration                         │
│  - LiveKit client connection                     │
│  - Transcription display                         │
└─────────────┬──────────────┬────────────────────┘
              │              │
         WebRTC Audio    HTTP/WebSocket
              │         (Transcriptions)
              ▼              ▼
┌─────────────────────────────────────────────────┐
│              LiveKit Cloud                       │
│         (Room management & routing)              │
└─────────────┬────────────────────────────────────┘
              │
         Room Events
              │
              ▼
┌─────────────────────────────────────────────────┐
│         Python LiveKit Agent Service             │
│  - Joins LiveKit rooms as participant            │
│  - Bridges audio to/from Gemini                  │
│  - Processes transcriptions                      │
│  - Sends updates to frontend                     │
└─────────────┬────────────────────────────────────┘
              │
         WebSocket
              │
              ▼
┌─────────────────────────────────────────────────┐
│          Google Gemini Live API                  │
│     (Audio-to-audio AI processing)               │
└─────────────────────────────────────────────────┘
```

### Implementation Strategy

#### Phase 1: Fix Python Agent (10 minutes)

##### Step 1.1: Add Missing Import
**File**: `livekit-agent/agent.py`
**Line**: 15 (after existing imports)

```diff
 from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
 from livekit.agents import voice
+from livekit.agents.voice_assistant import VoiceAssistant
 from livekit.plugins import gemini
```

##### Step 1.2: Add Webhook Integration Functions
**File**: `livekit-agent/agent.py`
**Location**: After class VirtualTutorAgent (line 216)

```python
async def send_transcription_to_frontend(
    text: str,
    session_id: str,
    speaker: str = "tutor",
    has_math: bool = False
):
    """Send transcription data to Next.js frontend via webhook"""
    import aiohttp

    webhook_url = os.getenv("FRONTEND_WEBHOOK_URL", "http://localhost:3006/api/transcription")

    payload = {
        "sessionId": session_id,
        "speaker": speaker,
        "text": text,
        "hasMath": has_math,
        "timestamp": datetime.now().isoformat()
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'}
            ) as response:
                if response.status != 200:
                    logger.error(f"Failed to send transcription: {response.status}")
                else:
                    logger.info(f"Transcription sent for session {session_id}")
    except Exception as e:
        logger.error(f"Error sending transcription: {e}")

async def send_session_metrics(
    session_id: str,
    metrics: Dict[str, Any]
):
    """Send session metrics to frontend"""
    webhook_url = os.getenv("METRICS_WEBHOOK_URL", "http://localhost:3006/api/session/metrics")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json={"sessionId": session_id, "metrics": metrics},
                headers={'Content-Type': 'application/json'}
            ) as response:
                logger.info(f"Metrics sent: {response.status}")
    except Exception as e:
        logger.error(f"Error sending metrics: {e}")
```

##### Step 1.3: Update Event Handlers
**File**: `livekit-agent/agent.py`
**Lines**: 279-290 (modify existing handlers)

```diff
 @assistant.on("user_speech_committed")
 async def on_user_speech(text: str):
     """Handle when user speech is recognized"""
     logger.info(f"User said: {text}")
     await tutor.log_session_event("student_question", text)
+    # Send to frontend for display
+    await send_transcription_to_frontend(
+        text=text,
+        session_id=tutor.session_id or ctx.room.name,
+        speaker="student"
+    )

 @assistant.on("agent_speech_committed")
 async def on_agent_speech(text: str):
     """Handle when agent speaks"""
     logger.info(f"Agent said: {text}")
     await tutor.log_session_event("tutor_response", text)
+    # Detect math content
+    has_math = "$" in text or any(term in text.lower() for term in ['equation', 'formula'])
+    # Send to frontend for display
+    await send_transcription_to_frontend(
+        text=text,
+        session_id=tutor.session_id or ctx.room.name,
+        speaker="tutor",
+        has_math=has_math
+    )
```

##### Step 1.4: Update Environment Configuration
**File**: `livekit-agent/.env`
**Add these lines**:

```bash
# Frontend Integration
FRONTEND_WEBHOOK_URL=http://localhost:3006/api/transcription
METRICS_WEBHOOK_URL=http://localhost:3006/api/session/metrics

# Session Configuration
MAX_SESSION_DURATION=3600  # 1 hour in seconds
ENABLE_RECORDING=false
```

#### Phase 2: Create Next.js API Endpoints (30 minutes)

##### Step 2.1: Create Transcription Webhook Endpoint
**File**: `pinglearn-app/app/api/transcription/route.ts`
**Create new file**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDisplayBuffer } from '@/protected-core';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, speaker, text, hasMath, timestamp } = data;

    // Validate required fields
    if (!sessionId || !text || !speaker) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get display buffer instance
    const displayBuffer = getDisplayBuffer();

    // Process and add to display buffer
    if (hasMath) {
      // Process math content
      const { TranscriptionService } = await import('@/protected-core');
      const processed = TranscriptionService.processTranscription(text);
      displayBuffer.addItem({
        type: 'math',
        content: processed.text,
        latex: processed.latex,
        speaker,
        timestamp
      });
    } else {
      // Add regular text
      displayBuffer.addItem({
        type: 'text',
        content: text,
        speaker,
        timestamp
      });
    }

    // Store in database
    const supabase = createClient();
    const { error } = await supabase
      .from('transcripts')
      .insert({
        session_id: sessionId,
        speaker,
        content: text,
        has_math: hasMath,
        timestamp
      });

    if (error) {
      console.error('Database error:', error);
    }

    // Broadcast to connected clients via WebSocket/SSE
    // This would trigger UI updates in real-time
    // Implementation depends on your WebSocket setup

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transcription webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

##### Step 2.2: Create Session Metrics Endpoint
**File**: `pinglearn-app/app/api/session/metrics/route.ts`
**Create new file**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, metrics } = data;

    if (!sessionId || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store metrics in database
    const supabase = createClient();
    const { error } = await supabase
      .from('session_analytics')
      .upsert({
        session_id: sessionId,
        engagement_score: metrics.engagementScore || 0,
        comprehension_score: metrics.comprehensionScore || 0,
        messages_exchanged: metrics.messagesExchanged || 0,
        math_equations_processed: metrics.mathEquationsProcessed || 0,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Metrics storage error:', error);
      return NextResponse.json(
        { error: 'Failed to store metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Metrics webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

##### Step 2.3: Create LiveKit Token Generator
**File**: `pinglearn-app/app/api/livekit/token/route.ts`
**Create new file**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const { participantId, roomName, participantName } = await request.json();

    if (!participantId || !roomName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantName || participantId,
    });

    // Grant room permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT token
    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
```

##### Step 2.4: Create LiveKit Webhook Handler
**File**: `pinglearn-app/app/api/livekit/webhook/route.ts`
**Create new file**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';

const webhookReceiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authorization = request.headers.get('Authorization');

    if (!authorization) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const event = await webhookReceiver.receive(body, authorization);

    // Handle different event types
    switch (event.event) {
      case 'room_started':
        console.log('Room started:', event.room?.name);
        // Python agent will auto-join via its own webhook listener
        break;

      case 'room_finished':
        console.log('Room finished:', event.room?.name);
        // Clean up session data if needed
        break;

      case 'participant_connected':
        console.log('Participant connected:', event.participant?.identity);
        break;

      case 'participant_disconnected':
        console.log('Participant disconnected:', event.participant?.identity);
        break;

      default:
        console.log('Unhandled event type:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

#### Phase 3: Update Protected Core Integration (15 minutes)

##### Step 3.1: NO MODIFICATIONS TO PROTECTED CORE
**Important**: Protected Core does NOT need modifications. It already has:
- SessionOrchestrator for session management
- LiveKitVoiceService for browser WebRTC
- TranscriptionService for processing
- Display buffer for UI updates

##### Step 3.2: Update VoiceSessionManager Integration
**File**: `pinglearn-app/src/features/voice/VoiceSessionManager.ts`
**Lines**: 130-145 (update startSession method)

```diff
 async startSession(config: VoiceSessionConfig): Promise<void> {
   try {
     // ... existing code ...

+    // Notify Python agent about new session via webhook
+    await fetch('/api/session/start', {
+      method: 'POST',
+      headers: { 'Content-Type': 'application/json' },
+      body: JSON.stringify({
+        sessionId: this.currentSession.sessionId,
+        roomName: livekitRoomName,
+        studentId: config.studentId,
+        topic: config.topic
+      })
+    });

     // ... rest of existing code ...
   }
 }
```

#### Phase 4: Testing & Verification (20 minutes)

##### Step 4.1: Start Services
```bash
# Terminal 1: Next.js Frontend
cd pinglearn-app
npm run dev

# Terminal 2: Python Agent
cd livekit-agent
source venv/bin/activate
python agent.py dev

# Terminal 3: Monitor logs
tail -f livekit-agent/*.log
```

##### Step 4.2: Test Voice Flow
1. Open browser to http://localhost:3006
2. Navigate to classroom page
3. Click "Start Session"
4. Verify:
   - LiveKit connection established
   - Python agent joins room
   - Audio flows both directions
   - Transcriptions appear in UI
   - Math equations render correctly

##### Step 4.3: Verify Data Flow
```sql
-- Check transcriptions are being stored
SELECT * FROM transcripts
WHERE session_id = '[current-session-id]'
ORDER BY created_at DESC;

-- Check session analytics
SELECT * FROM session_analytics
WHERE session_id = '[current-session-id]';
```

### Rollback Plan
If integration fails:
1. Stop Python agent process
2. Revert to mock mode in Protected Core
3. Document specific failure points
4. No changes to Protected Core needed for rollback

### Risk Mitigation
1. **Agent Crash**: Implement supervisor process for auto-restart
2. **Network Issues**: Exponential backoff already in Protected Core
3. **Transcription Lag**: Buffer in Python agent, batch send to frontend
4. **Memory Leak**: Monitor Python process memory, restart if >1GB

## Success Criteria
1. ✅ Python agent starts without import errors
2. ✅ Agent successfully joins LiveKit rooms
3. ✅ Bidirectional audio flow works
4. ✅ Transcriptions appear in frontend UI
5. ✅ Math equations render correctly
6. ✅ Session data stored in Supabase
7. ✅ No modifications to Protected Core required

## Dependencies
- Python 3.12+ installed
- LiveKit Agents SDK 1.2.11
- Next.js API routes created
- Environment variables configured
- Supabase tables exist

## Verification Checklist

### Pre-Implementation
- [x] Python agent exists in repository
- [x] Virtual environment configured
- [x] Dependencies installed
- [x] API keys available

### Implementation
- [x] VoiceAssistant import added (fixed to use voice.Agent)
- [x] Webhook functions implemented
- [x] Environment variables updated
- [x] API endpoints created
- [x] Token generation working
- [x] Webhook handlers ready

### Post-Implementation
- [x] Agent starts without errors (verified imports work)
- [x] TypeScript compilation successful (0 errors)
- [x] All API endpoints created successfully
- [x] VoiceSessionManager integration complete
- [ ] Connects to LiveKit successfully (requires runtime test)
- [ ] Connects to Gemini Live API (requires runtime test)
- [ ] Transcriptions flow to frontend (requires runtime test)
- [ ] UI displays transcriptions (requires runtime test)
- [ ] Math rendering works (requires runtime test)
- [ ] Database records created (requires runtime test)

## Monitoring & Logging
- Python agent logs to `livekit-agent/logs/`
- Next.js logs in console
- LiveKit dashboard for room monitoring
- Supabase dashboard for data verification

## Documentation Updates Required
- [ ] Update architecture diagrams
- [ ] Document API endpoints
- [ ] Add agent deployment guide
- [ ] Create troubleshooting guide

## Timeline
- **Phase 1**: 10 minutes (Fix Python agent)
- **Phase 2**: 30 minutes (Create API endpoints)
- **Phase 3**: 15 minutes (Integration updates)
- **Phase 4**: 20 minutes (Testing)
- **Total**: ~75 minutes

## Notes
- This change does NOT modify Protected Core
- Python agent runs as separate service
- Communication via HTTP webhooks and WebSocket
- Maintains Protected Core boundaries
- Enables complete voice flow functionality

## Approval
**Status**: APPROVED ✅
**Approved Date**: 2025-09-22 10:45 PST
**Approved By**: Stakeholder
**Reason**: Critical integration required for voice functionality

## Implementation Status
**Status**: IMPLEMENTED ✅
**Implementation Date**: 2025-09-22 11:30 PST
**Implemented By**: Claude
**Verification**: Static checks passed, runtime testing pending

---

**End of Change Record PC-005**