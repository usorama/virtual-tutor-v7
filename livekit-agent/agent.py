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
from livekit.rtc import DataPacket_pb2
from livekit.plugins import google, silero
from livekit.plugins.turn_detector.english import EnglishModel
from dotenv import load_dotenv
import json
import re

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

# Transcription publishing functionality
async def publish_transcript(room: rtc.Room, speaker: str, text: str):
    """Publish transcript data to all participants via data channel"""
    try:
        # Detect math patterns in text
        math_segments = detect_math_patterns(text)

        # Create data packet
        data = {
            "type": "transcript",
            "speaker": speaker,
            "segments": math_segments,
            "timestamp": datetime.now().isoformat()
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

def detect_math_patterns(text: str):
    """Detect and mark mathematical expressions in text"""
    segments = []

    # Common math patterns to detect
    math_indicators = [
        r'x\^2|x squared',
        r'\d+x\s*[+-]\s*\d+',
        r'equals?\s+\d+|=\s*\d+',
        r'square root',
        r'fraction|over|divided by',
        r'quadratic',
        r'equation'
    ]

    # Check if text contains math
    has_math = any(re.search(pattern, text, re.IGNORECASE) for pattern in math_indicators)

    if has_math:
        # For now, mark the entire text as potentially containing math
        segments.append({
            "type": "math",
            "content": text,
            "latex": convert_to_latex(text)
        })
    else:
        segments.append({
            "type": "text",
            "content": text
        })

    return segments

def convert_to_latex(text: str) -> str:
    """Convert spoken math to LaTeX notation"""
    latex = text

    # Basic conversions
    replacements = [
        (r'x squared', 'x^2'),
        (r'x cubed', 'x^3'),
        (r'(\d+)x\s*\+\s*(\d+)', r'\1x + \2'),
        (r'(\d+)x\s*-\s*(\d+)', r'\1x - \2'),
        (r'equals\s*(\d+)', r'= \1'),
        (r'square root of (\d+)', r'\\sqrt{\1}'),
        (r'(\d+) over (\d+)', r'\\frac{\1}{\2}'),
    ]

    for pattern, replacement in replacements:
        latex = re.sub(pattern, replacement, latex, flags=re.IGNORECASE)

    return latex

async def entrypoint(ctx: JobContext):
    """Main entry point for the LiveKit agent"""

    logger.info(f"Agent started for room: {ctx.room.name}")

    # Create agent with system instructions
    agent = Agent(
        instructions=TUTOR_SYSTEM_PROMPT,
    )

    # Configure the session with Gemini Live API (audio-to-audio)
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            voice="Kore",  # Female English voice
            temperature=0.8,
            instructions=TUTOR_SYSTEM_PROMPT
        ),
        # Voice Activity Detection
        vad=silero.VAD.load(),
        # Turn detection for natural conversation
        turn_detection=EnglishModel(),
        # Smooth conversation settings
        min_endpointing_delay=0.5,
        max_endpointing_delay=3.0,
    )

    # CRITICAL: Enable audio subscription for proper track handling
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for participant to ensure connection
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant connected: {participant.identity}")

    # Start the session - this publishes audio tracks
    await session.start(agent=agent, room=ctx.room)

    # Send proactive greeting after session starts
    await asyncio.sleep(1.5)  # Brief pause to ensure connection is stable

    # Generate proactive greeting using the session
    greeting_instructions = """Greet the student warmly and welcome them to today's mathematics session.
    Introduce yourself as their AI mathematics teacher.
    Ask them what specific topic from their Class 10 Mathematics curriculum they'd like to explore today.
    Be encouraging and enthusiastic about learning together."""

    await session.generate_reply(instructions=greeting_instructions)

    logger.info("Sent proactive greeting to student")

    # Publish the greeting transcript
    greeting_text = "Hello! Welcome to today's mathematics session. I'm your AI mathematics teacher. What specific topic from your Class 10 Mathematics curriculum would you like to explore today?"
    await publish_transcript(ctx.room, "teacher", greeting_text)

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