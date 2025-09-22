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

from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, function_tool, RunContext
from livekit.plugins import google
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

@function_tool
async def send_transcription_to_frontend(
    context: RunContext,
    text: str,
    speaker: str = "tutor",
    has_math: bool = False
):
    """Send transcription data to Next.js frontend via webhook"""
    import aiohttp

    webhook_url = os.getenv("FRONTEND_WEBHOOK_URL", "http://localhost:3006/api/transcription")
    session_id = context.room.name  # Use room name as session ID

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

    return {"status": "sent", "session_id": session_id}

async def entrypoint(ctx: JobContext):
    """Main entry point for the LiveKit agent"""

    await ctx.connect()

    logger.info(f"Agent started for room: {ctx.room.name}")

    # Create agent with instructions and tools
    agent = Agent(
        instructions=TUTOR_SYSTEM_PROMPT,
        tools=[send_transcription_to_frontend],
    )

    # Create session with Gemini Live API (audio-to-audio, 2025 solution)
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            voice="Puck",
            temperature=0.8,
            instructions=TUTOR_SYSTEM_PROMPT
        )
    )

    # Set up room event handlers for session cleanup
    def on_participant_disconnected(participant):
        logger.info(f"Participant disconnected: {participant.identity}")
        # Note: Cleanup logic would go here if needed

    ctx.room.on("participant_disconnected", on_participant_disconnected)

    # Start the session
    await session.start(agent=agent, room=ctx.room)

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the student warmly as their AI mathematics tutor. Ask them what math topic they'd like to work on today. Keep it friendly and encouraging."
    )

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