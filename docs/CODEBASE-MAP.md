# PingLearn Codebase Map
**Last Updated**: 2025-09-27
**Status**: VERIFIED WITH EVIDENCE-BASED INVESTIGATION

## 🚨 CRITICAL FINDING
The display system is broken due to communication architecture mismatch between Python agent and frontend.

## Architecture Overview

### Data Flow (ACTUAL vs EXPECTED)

#### ❌ Current BROKEN Flow
```
Python Agent (agent.py)
    ↓ [LiveKit Data Channel - line 181]
LiveKitRoom.tsx
    ↓ [DISABLED transcript handling - line 122-129]
SessionOrchestrator (disconnected)
    ↓ [No data]
DisplayBuffer (empty)
    ↓ [No items]
TeachingBoardSimple.tsx (BLANK SCREEN)
```

#### ✅ Expected WORKING Flow
```
Python Agent
    ↓ [HTTP POST to /api/transcription]
API Endpoint
    ↓ [Webhook processing]
DisplayBuffer
    ↓ [Items added]
TeachingBoardSimple.tsx (Content displays with 400ms delay)
```

## Component Status

### Frontend Components

#### ✅ Working Components
- `/src/components/classroom/TeachingBoardSimple.tsx` - Fully implemented with FC-010 timing (line 240-245)
- `/src/components/classroom/NotesPanel.tsx` - Smart Learning Notes implemented
- `/src/components/voice/VoiceInterface.tsx` - Voice UI working

#### ❌ Broken Components
- `/src/components/voice/LiveKitRoom.tsx` - Data handler DISABLED (line 122-129)
- Communication chain between LiveKit and SessionOrchestrator

### Backend Services

#### Python Agent (`/livekit-agent/agent.py`)
- **Status**: Partially working
- **Issue**: Uses LiveKit data channels instead of HTTP webhooks
- **Missing Functions**:
  - `send_transcription_to_frontend()`
  - `send_session_metrics()`

#### Protected Core (`/src/protected-core/`)
- **SessionOrchestrator**: Not receiving LiveKit events properly
- **WebSocketManager**: Singleton working but not receiving data
- **TranscriptionService**: Ready but not receiving input
- **DisplayBuffer**: Working but empty

## Database Schema
- ✅ All tables created and ready
- ✅ Smart Learning Notes schema exists
- ✅ Voice sessions tracking implemented

## Feature Implementation Status

### FC-010: Show-Then-Tell Timing
- **Status**: ✅ IMPLEMENTED
- **Location**: `/src/components/classroom/TeachingBoardSimple.tsx:240-245`
- **Issue**: Not receiving data to display

### FS-00-AA: Smart Learning Notes
- **Status**: ✅ IMPLEMENTED
- **Location**: `/src/components/classroom/NotesPanel.tsx`
- **Issue**: Not receiving transcription data

## Critical Issues

### 1. PRIMARY: Communication Architecture Mismatch
- **Location**: Between Python agent and frontend
- **Evidence**: Agent uses data channels, frontend expects webhooks
- **Impact**: Complete loss of visual content

### 2. SECONDARY: Event Chain Broken
- **Location**: LiveKitRoom → SessionOrchestrator
- **Evidence**: LiveKitRoom disabled handler, orchestrator not connected
- **Impact**: Data doesn't reach DisplayBuffer

### 3. TERTIARY: Missing Webhook Functions
- **Location**: `/livekit-agent/agent.py`
- **Evidence**: Test file expects functions that don't exist
- **Impact**: No HTTP fallback available

## Directory Structure

```
/pinglearn/
├── livekit-agent/           # Python LiveKit agent
│   ├── agent.py            # Main agent (missing webhook functions)
│   ├── test_webhooks.py    # Tests for non-existent functions
│   └── venv/               # Python virtual environment
│
├── pinglearn-app/           # Next.js frontend
│   ├── src/
│   │   ├── protected-core/  # ⛔ NEVER MODIFY
│   │   │   ├── voice-engine/
│   │   │   ├── transcription/
│   │   │   ├── websocket/
│   │   │   └── session/
│   │   │
│   │   ├── components/
│   │   │   ├── classroom/
│   │   │   │   ├── TeachingBoardSimple.tsx  # ✅ Working, not receiving data
│   │   │   │   ├── NotesPanel.tsx          # ✅ Implemented
│   │   │   │   └── TeachingBoard.tsx       # ⚠️ DEPRECATED
│   │   │   │
│   │   │   └── voice/
│   │   │       └── LiveKitRoom.tsx         # ❌ Handler disabled
│   │   │
│   │   └── app/
│   │       └── api/
│   │           └── transcription/          # Webhook endpoint (unused)
│   │
│   └── docs/                # Documentation
│
└── docs/                    # Project documentation
```

## Immediate Fix Options

### Option 1: Re-enable LiveKitRoom Handler (FASTEST)
```typescript
// File: /src/components/voice/LiveKitRoom.tsx:122
// Remove DISABLED comment and re-enable handler
```

### Option 2: Add Webhook Functions to Python Agent
```python
# File: /livekit-agent/agent.py
# Add send_transcription_to_frontend() function
# Make HTTP POST to /api/transcription
```

### Option 3: Fix SessionOrchestrator Connection
```typescript
// Debug and fix event chain
// Ensure orchestrator subscribes to LiveKit events
```

## Verification Commands

```bash
# Check frontend TypeScript
cd pinglearn-app && npm run typecheck

# Test Python agent
cd livekit-agent && python test_webhooks.py

# Check WebSocket connections
# Browser console: Check for WebSocket errors

# Database verification
# Check lesson_notes table for entries
```

---

**Note**: This map represents the ACTUAL state as discovered through evidence-based investigation, not theoretical or intended state.