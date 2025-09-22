# Question: 
There’s a confusion. A working model had livekit local server using python however, in this architecture there doesn’t seem to be a separate service that connects to and manages livekit.  Could you clarify please ?

# Answer:
You're absolutely right to point out this confusion! I apologize for not being clear about the LiveKit server component. Let me clarify the **complete architecture** showing exactly how the Python LiveKit Agent service fits in and manages everything.

# Complete Architecture with LiveKit Python Service

## The Actual Working Architecture

You're correct - there MUST be a separate Python service (LiveKit Agent) that manages the connection between LiveKit and Gemini Live API. Here's the real architecture:

```
┌──────────────────────────────────────────────┐
│            Student Browser (React)           │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ Audio/Video  │  │ Transcription     │  │
│  │ Component    │  │ Display (KaTeX)   │  │
│  └──────┬───────┘  └────────▲───────────┘  │
└─────────┼───────────────────┼───────────────┘
          │                   │
     WebRTC Audio        WebSocket/REST
          │                   │
          ▼                   │
┌──────────────────────────────────────────────┐
│          LiveKit Server (Cloud/Local)        │
│         Manages WebRTC connections           │
└──────────┬──────────────────┬────────────────┘
           │                  │
      Room Events        Audio Stream
           │                  │
           ▼                  ▼
┌──────────────────────────────────────────────┐
│     Python LiveKit Agent Service (KEY!)      │
│         (This is what you have working)      │
│                                              │
│  - Connects to LiveKit Server                │
│  - Integrates with Gemini Live API           │
│  - Processes transcriptions                  │
│  - Handles math detection                    │
│  - Sends formatted text back to frontend    │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│          Google Gemini Live API              │
└──────────────────────────────────────────────┘
```

## The Python LiveKit Agent Service (The Missing Piece)

This is the crucial service that manages everything:

### Complete Python Service Implementation

```python
# agent-service/agent.py
import asyncio
import logging
import os
from typing import Optional
from dataclasses import dataclass

from livekit import agents, rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
)
from livekit.plugins import google
import aiohttp
from dotenv import load_dotenv

load_dotenv()

# Data structure for transcription
@dataclass
class TranscriptionData:
    text: str
    has_math: bool
    latex: Optional[str] = None
    timestamp: float = 0

class TeachingAgent:
    """
    This is the core service that:
    1. Connects to LiveKit Server
    2. Manages Gemini Live API connection
    3. Processes and sends transcriptions to frontend
    """
    
    def __init__(self):
        self.gemini_model = "gemini-2.0-flash"
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        self.frontend_webhook = os.environ.get("FRONTEND_WEBHOOK_URL", "http://localhost:3000/api/transcription")
        
        # Initialize Gemini Live
        self.gemini = google.GeminiLiveModel(
            api_key=self.api_key,
            model=self.gemini_model
        )
        
        # Math pattern detection
        self.math_patterns = {
            'fraction': r'(\w+) over (\w+)',
            'squared': r'(\w+) squared',
            'sqrt': r'square root of (\w+)',
            'equation': r'(\w+) equals (\w+)'
        }
        
    async def entrypoint(self, ctx: JobContext):
        """
        Main entry point for the LiveKit Agent
        This gets called when a new room is created
        """
        logging.info(f"Agent started for room: {ctx.room.name}")
        
        # Connect to the LiveKit room
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        
        # Get participant (student) info
        participant = await self.wait_for_participant(ctx)
        
        # Start the Gemini session
        await self.start_gemini_session(ctx, participant)
        
    async def wait_for_participant(self, ctx: JobContext):
        """Wait for student to join the room"""
        logging.info("Waiting for student to join...")
        
        # Wait for first participant
        participant = None
        for p in ctx.room.participants.values():
            if not p.is_agent:
                participant = p
                break
                
        if not participant:
            # Wait for participant joined event
            future = asyncio.Future()
            
            def on_participant_connected(p):
                if not p.is_agent:
                    future.set_result(p)
            
            ctx.room.on("participant_connected", on_participant_connected)
            participant = await future
            
        logging.info(f"Student joined: {participant.identity}")
        return participant
    
    async def start_gemini_session(self, ctx: JobContext, participant):
        """
        Start the Gemini Live API session and handle audio/transcription
        """
        logging.info("Starting Gemini Live session...")
        
        # Create audio source and track for AI voice
        source = rtc.AudioSource(
            sample_rate=24000,
            num_channels=1
        )
        track = rtc.LocalAudioTrack.create_audio_track(
            "teacher_voice", source
        )
        
        # Publish AI teacher's audio to room
        publication = await ctx.room.local_participant.publish_track(
            track,
            rtc.TrackPublishOptions(
                source=rtc.TrackSource.SOURCE_MICROPHONE
            )
        )
        
        # Start Gemini Live session with configuration
        session_config = {
            "response_modalities": ["AUDIO", "TEXT"],
            "instructions": """You are an AI math teacher. 
                            When explaining math, always say the equation clearly 
                            and also provide the LaTeX formatted version.
                            For example: 'x squared' should be noted as $x^2$""",
            "input_audio_format": "PCM_16",
            "output_audio_format": "PCM_16",
            "sample_rate": 24000
        }
        
        # Connect to Gemini Live
        async with self.gemini.connect(**session_config) as session:
            # Handle incoming student audio
            async def process_student_audio():
                audio_stream = rtc.AudioStream(
                    track=participant.audio_tracks[0],
                    sample_rate=24000,
                    num_channels=1
                )
                
                async for audio_frame in audio_stream:
                    # Send student audio to Gemini
                    await session.send_audio(audio_frame.data)
            
            # Handle Gemini responses
            async def process_gemini_responses():
                async for response in session:
                    if response.audio:
                        # Send AI audio to student
                        await source.capture_frame(response.audio)
                    
                    if response.text:
                        # Process and send transcription
                        await self.process_transcription(
                            response.text,
                            ctx.room.name,
                            participant.identity
                        )
            
            # Run both tasks concurrently
            await asyncio.gather(
                process_student_audio(),
                process_gemini_responses()
            )
    
    async def process_transcription(self, text: str, room_name: str, student_id: str):
        """
        Process transcription and send to frontend with math formatting
        """
        logging.info(f"Processing transcription: {text[:50]}...")
        
        # Detect math content
        has_math = "$" in text or any(
            pattern in text.lower() 
            for pattern in ['equation', 'formula', 'calculate', 'solve']
        )
        
        # Convert spoken math to LaTeX if needed
        latex_content = None
        if has_math:
            latex_content = self.convert_to_latex(text)
        
        # Create transcription data
        data = TranscriptionData(
            text=text,
            has_math=has_math,
            latex=latex_content,
            timestamp=asyncio.get_event_loop().time()
        )
        
        # Send to frontend via webhook
        await self.send_to_frontend({
            "room": room_name,
            "student_id": student_id,
            "transcription": {
                "text": data.text,
                "has_math": data.has_math,
                "latex": data.latex,
                "timestamp": data.timestamp
            }
        })
    
    def convert_to_latex(self, text: str) -> str:
        """Convert spoken math to LaTeX notation"""
        latex = text
        
        # Simple conversions
        replacements = {
            'x squared': 'x^2',
            'x cubed': 'x^3',
            'square root of': '\\sqrt',
            ' over ': '\\frac',
            'pi': '\\pi',
            'theta': '\\theta',
            'integral': '\\int',
            'sum': '\\sum',
            'infinity': '\\infty'
        }
        
        for spoken, latex_symbol in replacements.items():
            latex = latex.replace(spoken, latex_symbol)
        
        # Extract LaTeX between $ symbols if already marked
        import re
        math_regex = r'\$([^$]+)\$'
        matches = re.findall(math_regex, text)
        
        if matches:
            return matches[0]  # Return first math expression
        
        return latex
    
    async def send_to_frontend(self, data: dict):
        """Send transcription data to frontend webhook"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.frontend_webhook,
                    json=data,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status != 200:
                        logging.error(f"Failed to send to frontend: {response.status}")
                    else:
                        logging.info("Transcription sent to frontend")
        except Exception as e:
            logging.error(f"Error sending to frontend: {e}")

def main():
    """Main function to start the agent"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Create worker options
    options = WorkerOptions(
        entrypoint_fnc=TeachingAgent().entrypoint,
        job_type=JobType.ROOM,
    )
    
    # Run the agent
    cli.run_app(options)

if __name__ == "__main__":
    main()
```

### Environment Configuration

```bash
# agent-service/.env
GOOGLE_API_KEY=your_gemini_api_key_here
LIVEKIT_URL=ws://localhost:7880  # Or wss://your-cloud.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
FRONTEND_WEBHOOK_URL=http://localhost:3000/api/transcription
LOG_LEVEL=info
```

### Requirements File

```python
# agent-service/requirements.txt
livekit-agents==0.8.0
livekit-plugins-google==0.1.3
python-dotenv==1.0.0
aiohttp==3.9.0
```

## How to Run the Complete System

### 1. Start LiveKit Server (if running locally)

```bash
# Option A: Run LiveKit locally with Docker
docker run -d \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 443:443 \
  -p 50000-60000:50000-60000/udp \
  -e LIVEKIT_KEYS="your_api_key: your_api_secret" \
  livekit/livekit-server \
  --dev \
  --bind 0.0.0.0

# Option B: Use LiveKit Cloud (easier)
# Just get your URL and keys from https://cloud.livekit.io
```

### 2. Start the Python Agent Service

```bash
cd agent-service
pip install -r requirements.txt
python agent.py dev  # For development
# OR
python agent.py start  # For production
```

### 3. Start your Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

## Frontend Integration with the Python Service

### Next.js API Route to Receive Transcriptions

```javascript
// app/api/transcription/route.js
import { pusherServer } from '@/lib/pusher';

export async function POST(request) {
  const data = await request.json();
  
  // Receive transcription from Python agent
  const { room, student_id, transcription } = data;
  
  // Broadcast to student's browser via WebSocket/Pusher
  await pusherServer.trigger(
    `room-${room}`,
    'transcription-update',
    transcription
  );
  
  // Store in database if needed
  await saveTranscription({
    roomId: room,
    studentId: student_id,
    ...transcription
  });
  
  return Response.json({ success: true });
}
```

### React Component Connecting to LiveKit

```javascript
// components/VoiceClassroom.jsx
import { LiveKitRoom, useParticipant } from '@livekit/components-react';
import { Room } from 'livekit-client';
import { useEffect, useState } from 'react';
import { TranscriptionDisplay } from './TranscriptionDisplay';

export function VoiceClassroom({ token, serverUrl }) {
  const [room] = useState(() => new Room());
  const [transcriptions, setTranscriptions] = useState([]);
  
  useEffect(() => {
    // Listen for transcription updates via Pusher/WebSocket
    const channel = pusher.subscribe(`room-${roomName}`);
    
    channel.bind('transcription-update', (data) => {
      setTranscriptions(prev => [...prev, data]);
    });
    
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`room-${roomName}`);
    };
  }, [roomName]);
  
  return (
    <LiveKitRoom
      room={room}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={false}
    >
      <div className="classroom-container">
        <div className="audio-section">
          <AudioParticipant />
        </div>
        
        <div className="transcription-section">
          <TranscriptionDisplay 
            transcriptions={transcriptions}
            showMath={true}
          />
        </div>
      </div>
    </LiveKitRoom>
  );
}
```

## The Complete Data Flow

1. **Student joins room** → LiveKit Server notifies Python Agent
2. **Python Agent starts Gemini session** → Creates bidirectional audio stream
3. **Student speaks** → Audio goes through LiveKit → Python Agent → Gemini
4. **Gemini responds** → Audio + Text back to Python Agent
5. **Python Agent processes** → Sends audio to LiveKit, transcription to Frontend
6. **Frontend displays** → Real-time transcription with KaTeX math

This architecture ensures proper separation of concerns and is exactly what you need for your working model with the Python LiveKit server!