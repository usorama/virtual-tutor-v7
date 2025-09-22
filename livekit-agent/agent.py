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
from livekit.plugins import google, silero
from livekit.plugins.turn_detector.english import EnglishModel
from dotenv import load_dotenv

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

# Transcription webhook functionality will be handled by VoiceAssistant's built-in transcription
# The VoiceAssistant automatically manages transcription publishing to the room

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
            voice="Puck",
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