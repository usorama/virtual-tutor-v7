#!/usr/bin/env python3
"""
Virtual Tutor LiveKit Agent with Gemini Live Integration
Handles audio-to-audio conversations between students and AI tutor
"""

import os
import logging
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from livekit import agents, rtc
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
    AutoSubscribe
)
# Removed DataPacket_pb2 import - not needed
from livekit.plugins import google, silero
from livekit.plugins.turn_detector.english import EnglishModel
from dotenv import load_dotenv
import json
import re
from typing import List

# Load environment variables
load_dotenv()  # Load local .env first
load_dotenv("../.env.local", override=False)  # Load parent .env.local if not already set

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini API configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBcUGgObt--HCjBlXygu8iYMuI6PnPbeIY")

# System prompt for the AI Tutor
TUTOR_SYSTEM_PROMPT = """
You are a friendly and patient NCERT mathematics tutor for Class 10 students in India.

Your teaching approach:
- Use simple, clear explanations suitable for 10th grade students
- Reference specific NCERT Class X Mathematics textbook examples
- Encourage and motivate students when they make progress
- Ask clarifying questions to check understanding
- Break down complex problems into smaller steps
- Use real-world examples that Indian students can relate to
- Be patient with mistakes and use them as learning opportunities

Important guidelines:
- Stay focused on Class 10 Mathematics topics only
- Keep responses concise and age-appropriate
- If asked about non-educational topics, politely redirect to learning
- Speak naturally and conversationally, as if tutoring in person
- Use encouraging phrases like "Great question!" or "You're on the right track!"

You have access to the complete NCERT Class X Mathematics textbook content including:
- Real Numbers
- Polynomials
- Pair of Linear Equations in Two Variables
- Quadratic Equations
- Arithmetic Progressions
- Triangles
- Coordinate Geometry
- Introduction to Trigonometry
- Applications of Trigonometry
- Circles
- Areas Related to Circles
- Surface Areas and Volumes
- Statistics
- Probability

Remember to make learning enjoyable and build the student's confidence!
"""

# PC-013: Word-level timing estimation
class TimingEstimator:
    """Estimates word-level timing for text segments"""

    def __init__(self, words_per_minute: int = 150):
        self.wpm = words_per_minute
        self.ms_per_word = 60000 / words_per_minute

    def estimate_word_timings(self, text: str, audio_duration: float = None) -> List[Dict]:
        """Generate word timing estimates"""
        words = text.split()

        # Adjust timing based on actual audio if available
        if audio_duration:
            self.ms_per_word = (audio_duration * 1000) / len(words) if words else 200

        timings = []
        current_time = 0

        for word in words:
            # Math content gets extra time
            duration = self.ms_per_word * 1.5 if self._is_math(word) else self.ms_per_word

            timings.append({
                "word": word,
                "startTime": int(current_time),
                "endTime": int(current_time + duration),
                "confidence": 0.8 if audio_duration else 0.6,
                "isMath": self._is_math(word)
            })
            current_time += duration

        return timings

    def _is_math(self, word: str) -> bool:
        """Check if word contains mathematical symbols"""
        return bool(re.search(r'[\d\+\-\*\/\=\^\(\)]', word))

    def parse_math_fragments(self, latex: str) -> Dict:
        """Parse LaTeX into progressive fragments for reveal"""
        # Simple fragment parsing for basic equations
        fragments = []
        timings = []
        current_time = 0

        # Split on operators while keeping them
        parts = re.split(r'(\s*[\+\-\*\/\=]\s*)', latex)
        parts = [p for p in parts if p.strip()]  # Remove empty parts

        for part in parts:
            fragments.append(part)
            timings.append(int(current_time))
            # Operators get less time, terms get more
            duration = 200 if re.match(r'^[\+\-\*\/\=]$', part.strip()) else 400
            current_time += duration

        return {
            "fragments": fragments,
            "timings": timings,
            "fullLatex": latex
        }

# Create global timing estimator instance
timing_estimator = TimingEstimator()

# Transcription publishing functionality
async def publish_transcript(room: rtc.Room, speaker: str, text: str):
    """Publish transcript data to all participants via data channel"""
    try:
        # Detect math patterns in text
        math_segments = detect_math_patterns(text)

        # PC-013: Generate word timing estimates
        word_timings = None
        math_fragments = None

        # Only generate timing for AI teacher messages
        if speaker == "teacher" or speaker == "ai":
            # Generate word timings for all text
            full_text = " ".join([seg.get("text", "") for seg in math_segments])
            word_timings = timing_estimator.estimate_word_timings(full_text)

            # Check for math content and generate fragments
            for seg in math_segments:
                if seg.get("type") == "math" and seg.get("latex"):
                    math_fragments = timing_estimator.parse_math_fragments(seg.get("latex"))
                    break  # Use first math equation for now

        # Create data packet with PC-013 timing fields
        data = {
            "type": "transcript",
            "speaker": speaker,
            "segments": math_segments,
            "timestamp": datetime.now().isoformat(),
            # PC-013: Optional timing fields
            "wordTimings": word_timings,
            "mathFragments": math_fragments
        }

        # Publish to all participants
        packet = json.dumps(data).encode('utf-8')
        await room.local_participant.publish_data(
            packet,
            reliable=True
        )
        logger.info(f"Published transcript from {speaker}: {text[:50]}...")
    except Exception as e:
        logger.error(f"Error publishing transcript: {e}")

def process_mixed_content(text: str):
    """Enhanced processing for mixed text and math content"""
    if not text or not text.strip():
        return [{"type": "text", "content": text}]

    segments = []

    # Enhanced regex to find LaTeX math ($ ... $ or $$ ... $$) and LaTeX commands
    latex_pattern = r'\$\$?(.*?)\$\$?'
    last_end = 0

    for match in re.finditer(latex_pattern, text):
        # Add text before math
        if match.start() > last_end:
            text_before = text[last_end:match.start()].strip()
            if text_before:
                # Check if the text contains mathematical language
                math_segments = detect_math_patterns(text_before)
                segments.extend(math_segments)

        # Add LaTeX math segment with high confidence
        latex_content = match.group(1)
        segments.append({
            "type": "math",
            "content": f"${latex_content}$",
            "latex": latex_content,
            "confidence": 0.98,  # Very high confidence for LaTeX
            "source": "latex_delimited"
        })
        last_end = match.end()

    # Process remaining text
    if last_end < len(text):
        remaining_text = text[last_end:].strip()
        if remaining_text:
            math_segments = detect_math_patterns(remaining_text)
            segments.extend(math_segments)

    # If no segments were created, treat as regular text
    if not segments:
        segments = detect_math_patterns(text)

    # Filter out empty segments
    segments = [seg for seg in segments if seg.get("content", "").strip()]

    return segments if segments else [{"type": "text", "content": text}]

async def publish_segment(room: rtc.Room, speaker: str, segment: dict):
    """Publish a single segment with proper type"""
    data = {
        "type": "transcript",
        "speaker": speaker,
        "segments": [segment],
        "timestamp": datetime.now().isoformat()
    }

    packet = json.dumps(data).encode('utf-8')
    await room.local_participant.publish_data(packet, reliable=True)

    # Extra logging for math
    if segment.get("type") == "math":
        logger.info(f"[FC-001][MATH] Published equation: {segment.get('latex')}")

async def stream_teacher_response_progressively(room: rtc.Room, full_response: str):
    """INNOVATIVE: Stream teacher response in real-time chunks for show-and-tell experience"""
    try:
        # Progressive chunking strategy for natural speech simulation
        words = full_response.split()
        chunk_size = 3  # Start with 3-word chunks for natural flow
        chunk_delay = 0.08  # 80ms delay between chunks (natural speaking pace)

        current_chunk = ""
        chunks_sent = 0

        logger.info(f"[REALTIME] Starting progressive stream: {len(words)} words")

        for i, word in enumerate(words):
            current_chunk += (" " if current_chunk else "") + word

            # Adaptive chunk sizing based on content
            should_send_chunk = False

            # Send chunk if we've reached the chunk size
            if len(current_chunk.split()) >= chunk_size:
                should_send_chunk = True

            # Send chunk at natural breaks (punctuation)
            elif word.endswith(('.', '!', '?', ',', ';', ':')):
                should_send_chunk = True
                chunk_delay = 0.15  # Longer pause after punctuation

            # Send chunk if we detect math content
            elif any(indicator in word.lower() for indicator in ['equation', 'formula', 'equals', 'x²', 'sqrt']):
                should_send_chunk = True

            # Always send the last chunk
            elif i == len(words) - 1:
                should_send_chunk = True

            if should_send_chunk and current_chunk.strip():
                # Process chunk for math detection
                segments = process_mixed_content(current_chunk.strip())

                for segment in segments:
                    # Add streaming metadata
                    segment['streaming'] = True
                    segment['chunk_index'] = chunks_sent
                    segment['total_estimated'] = len(words) // chunk_size

                    await publish_segment(room, "teacher", segment)
                    chunks_sent += 1

                logger.info(f"[REALTIME] Streamed chunk {chunks_sent}: {current_chunk[:50]}...")

                # Natural delay to simulate speaking pace
                await asyncio.sleep(chunk_delay)

                # Reset for next chunk
                current_chunk = ""
                chunk_delay = 0.08  # Reset to normal pace

        logger.info(f"[REALTIME] Progressive streaming complete: {chunks_sent} chunks sent")

        # Send completion marker
        completion_data = {
            "type": "transcript_complete",
            "speaker": "teacher",
            "total_chunks": chunks_sent,
            "timestamp": datetime.now().isoformat()
        }
        packet = json.dumps(completion_data).encode('utf-8')
        await room.local_participant.publish_data(packet, reliable=True)

    except Exception as e:
        logger.error(f"[REALTIME] Progressive streaming error: {e}")

def detect_math_patterns(text: str):
    """Enhanced math detection with LaTeX pattern recognition"""
    segments = []

    # Enhanced math patterns including LaTeX and natural language
    math_indicators = [
        r'x\^2|x squared|x²',
        r'\\frac\{[^}]+\}\{[^}]+\}',  # LaTeX fractions
        r'\\sqrt\{[^}]+\}',  # LaTeX square roots
        r'\d+x\s*[+-]\s*\d+',
        r'equals?\s+\d+|=\s*\d+',
        r'square root|sqrt',
        r'fraction|over|divided by',
        r'quadratic|polynomial',
        r'equation|formula',
        r'\$[^$]+\$',  # LaTeX math delimiters
        r'\\[a-zA-Z]+\{',  # LaTeX commands
        r'\b[a-z]\s*=\s*[^\s]+',  # Variable assignments
        r'\([^)]*[+\-*/=][^)]*\)',  # Math in parentheses
    ]

    # Check if text contains math
    has_math = any(re.search(pattern, text, re.IGNORECASE) for pattern in math_indicators)

    if has_math:
        # Enhanced LaTeX conversion with confidence scoring
        latex_content = convert_to_latex(text)
        confidence = calculate_math_confidence(text)

        segments.append({
            "type": "math",
            "content": text,
            "latex": latex_content,
            "confidence": confidence,
            "enhanced": True
        })
    else:
        segments.append({
            "type": "text",
            "content": text
        })

    return segments

def calculate_math_confidence(text: str) -> float:
    """Calculate confidence score for math detection"""
    math_indicators = [
        (r'\\frac|\\sqrt|\\sum', 0.95),  # LaTeX commands = very high confidence
        (r'x\^2|x²|squared', 0.9),        # Clear math expressions
        (r'equation|formula', 0.8),        # Math keywords
        (r'=\s*\d+', 0.85),               # Equals with numbers
        (r'\$[^$]+\$', 0.95),             # LaTeX delimiters
    ]

    max_confidence = 0.5  # Base confidence

    for pattern, confidence in math_indicators:
        if re.search(pattern, text, re.IGNORECASE):
            max_confidence = max(max_confidence, confidence)

    return max_confidence

def convert_to_latex(text: str) -> str:
    """Enhanced conversion of spoken math to LaTeX notation"""
    latex = text

    # Enhanced conversions with more comprehensive patterns
    replacements = [
        # Powers and exponents
        (r'x squared', 'x^2'),
        (r'x cubed', 'x^3'),
        (r'(\w+) squared', r'\1^2'),
        (r'(\w+) cubed', r'\1^3'),
        (r'(\w+) to the power of (\d+)', r'\1^{\2}'),

        # Algebraic expressions
        (r'(\d+)x\s*\+\s*(\d+)', r'\1x + \2'),
        (r'(\d+)x\s*-\s*(\d+)', r'\1x - \2'),
        (r'(\d+)x\s*equals?\s*(\d+)', r'\1x = \2'),

        # Equations and equality
        (r'equals?\s*(\d+)', r'= \1'),
        (r'is equal to\s*(\d+)', r'= \1'),

        # Roots and radicals
        (r'square root of ([^\s,]+)', r'\\sqrt{\1}'),
        (r'sqrt\s*\(([^)]+)\)', r'\\sqrt{\1}'),

        # Fractions
        (r'(\d+) over (\d+)', r'\\frac{\1}{\2}'),
        (r'([^\s]+) over ([^\s]+)', r'\\frac{\1}{\2}'),
        (r'fraction ([^\s]+) over ([^\s]+)', r'\\frac{\1}{\2}'),

        # Common functions
        (r'sine of ([^\s,]+)', r'\\sin(\1)'),
        (r'cosine of ([^\s,]+)', r'\\cos(\1)'),
        (r'tangent of ([^\s,]+)', r'\\tan(\1)'),

        # Greek letters (common in math)
        (r'\balpha\b', r'\\alpha'),
        (r'\bbeta\b', r'\\beta'),
        (r'\bgamma\b', r'\\gamma'),
        (r'\bdelta\b', r'\\delta'),
        (r'\btheta\b', r'\\theta'),
        (r'\bpi\b', r'\\pi'),

        # Cleanup and formatting
        (r'\s+', ' '),  # Normalize whitespace
    ]

    for pattern, replacement in replacements:
        latex = re.sub(pattern, replacement, latex, flags=re.IGNORECASE)

    return latex.strip()

async def entrypoint(ctx: JobContext):
    """Main entry point for the LiveKit agent"""

    logger.info(f"Agent started for room: {ctx.room.name}")

    # Create agent with system instructions
    agent = Agent(
        instructions=TUTOR_SYSTEM_PROMPT,
    )

    # Configure the session with Gemini Live API (using dual-stream processing)
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            voice="Kore",  # Female English voice
            temperature=0.8,
            instructions=TUTOR_SYSTEM_PROMPT,
            # Note: Real-time output transcription will use dual-stream processing
        ),
        # Voice Activity Detection
        vad=silero.VAD.load(),
        # Turn detection for natural conversation
        turn_detection=EnglishModel(),
        # Smooth conversation settings for real-time experience
        min_endpointing_delay=0.3,  # Reduced for faster response
        max_endpointing_delay=2.0,  # Reduced for faster response
    )

    # CRITICAL: Enable audio subscription for proper track handling
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for participant to ensure connection
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    # Start the session - this publishes audio tracks
    await session.start(agent=agent, room=ctx.room)

    # CRITICAL: Real-time output transcription events (December 2024 Gemini 2.0 feature)
    @session.on("output_audio_transcribed")
    def on_output_transcribed(event):
        """Capture AI teacher's speech in real-time AS IT SPEAKS"""
        logger.info(f"[REALTIME] AI speaking: {event.transcript[:100]}...")

        async def _publish_realtime():
            # Process for math segments immediately
            segments = process_mixed_content(event.transcript)
            for segment in segments:
                await publish_segment(ctx.room, "teacher", segment)

        asyncio.create_task(_publish_realtime())

    @session.on("output_audio_transcription_delta")
    def on_output_delta(event):
        """Capture partial transcription updates for ultra-responsive experience"""
        if hasattr(event, 'delta') and event.delta:
            logger.info(f"[DELTA] AI partial: {event.delta[:50]}...")

            async def _publish_delta():
                # Publish incremental updates for show-and-tell
                data = {
                    "type": "transcript_delta",
                    "speaker": "teacher",
                    "delta": event.delta,
                    "timestamp": datetime.now().isoformat()
                }
                packet = json.dumps(data).encode('utf-8')
                await ctx.room.local_participant.publish_data(packet, reliable=True)

            asyncio.create_task(_publish_delta())

    # DUAL-STREAM PROCESSING ARCHITECTURE
    # Track ongoing streaming for real-time experience
    streaming_state = {
        "active_response": None,
        "chunks_sent": 0,
        "last_chunk_time": 0
    }

    # Hook into session events to capture transcripts
    @session.on("user_input_transcribed")
    def on_user_transcribed(event):
        """Capture user's transcribed speech"""
        logger.info(f"[FC-001] User said: {event.transcript[:100]}...")

        async def _publish():
            await publish_transcript(ctx.room, "student", event.transcript)

        asyncio.create_task(_publish())

    @session.on("conversation_item_added")
    def on_conversation_item(event):
        """Enhanced conversation processing with real-time streaming"""
        try:
            # Determine speaker based on role
            role = getattr(event.item, 'role', None)
            text_content = getattr(event.item, 'text_content', None) or getattr(event.item, 'content', '')

            if not text_content:
                return

            # Map role to speaker
            speaker = "teacher" if role == "assistant" else "student" if role == "user" else "unknown"

            logger.info(f"[FC-001] Conversation item from {speaker}: {text_content[:100]}...")

            async def _process_and_publish():
                if speaker == "teacher":
                    # INNOVATIVE: Progressive streaming for show-and-tell experience
                    await stream_teacher_response_progressively(ctx.room, text_content)
                else:
                    await publish_transcript(ctx.room, speaker, text_content)

            asyncio.create_task(_process_and_publish())
        except Exception as e:
            logger.error(f"[FC-001] Error handling conversation item: {e}")

    # INNOVATIVE: Audio output stream monitoring for real-time capture
    async def monitor_audio_output():
        """Monitor audio output for real-time transcript generation"""
        try:
            # Get the session's audio output stream
            if hasattr(session, '_llm') and hasattr(session._llm, '_session'):
                gemini_session = session._llm._session
                if hasattr(gemini_session, '_ws'):
                    logger.info("[REALTIME] Setting up audio output monitoring")
                    # This will be enhanced to intercept WebSocket messages
                    # For now, we rely on the progressive streaming approach
        except Exception as e:
            logger.error(f"[REALTIME] Audio monitoring setup error: {e}")

    # Start audio output monitoring
    asyncio.create_task(monitor_audio_output())

    # Send proactive greeting after session starts
    await asyncio.sleep(1.5)  # Brief pause to ensure connection is stable

    # Generate proactive greeting using the session
    greeting_instructions = """Greet the student warmly and welcome them to today's mathematics session.
    Introduce yourself as their AI mathematics teacher.
    Ask them what specific topic from their Class 10 Mathematics curriculum they'd like to explore today.
    Be encouraging and enthusiastic about learning together."""

    await session.generate_reply(instructions=greeting_instructions)

    logger.info("Sent proactive greeting to student")

    # NOTE: Removed duplicate greeting publish - the actual speech will be captured by event handlers

    # Keep the session alive
    try:
        # The session handles the conversation automatically
        while ctx.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Agent session cancelled")
    finally:
        logger.info("Agent session ended")

if __name__ == "__main__":
    # Run the agent
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY", "APIz7rWgBkZqPDq"),
            api_secret=os.getenv("LIVEKIT_API_SECRET", "kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA"),
            ws_url=os.getenv("LIVEKIT_URL", "wss://ai-tutor-prototype-ny9l58vd.livekit.cloud"),
        )
    )