#!/usr/bin/env python3
"""
Console Test Agent for Local Audio Testing
Uses LiveKit's console mode for direct local audio testing without LiveKit server
Based on LiveKit documentation: python myagent.py console
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Any

from dotenv import load_dotenv
from livekit.agents import Agent, WorkerOptions, cli, function_tool
from livekit.plugins.google.beta import realtime as google_realtime
from livekit.plugins import silero

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("console-test-agent")

# Environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

class ConsoleTutorAI:
    """Simple AI Tutor for console testing"""

    @function_tool
    async def explain_concept(self, concept: str) -> str:
        """Explain a mathematical concept"""
        return f"Let me explain {concept} step by step. This is a test explanation for console mode."

    @function_tool
    async def check_understanding(self, response: str) -> str:
        """Check student understanding"""
        return f"I heard you say: '{response}'. That's a good response! This shows the audio is working."

    @function_tool
    async def get_help(self) -> str:
        """Get help with the console test"""
        return "This is console test mode. Speak into your microphone and I should respond through your speakers."

async def create_console_agent():
    """Create agent for console testing"""
    logger.info("🎯 Creating Console Test Agent...")

    # Initialize tutor
    tutor = ConsoleTutorAI()

    # Simple system instructions for testing
    system_instructions = """You are a test AI assistant for audio verification.

Your goal is to help test audio input and output on macOS.

Instructions:
- Speak clearly and confirm you can hear the user
- Acknowledge what the user says to verify audio input works
- Speak responses clearly to test audio output
- Keep responses short and clear for testing
- Always confirm when audio is working properly

Say things like:
- "I can hear you clearly!"
- "Audio test successful!"
- "Your microphone and speakers are working!"

Remember: This is a test mode to verify audio functionality."""

    # Create the agent
    agent = Agent(
        instructions=system_instructions,
        tools=[
            tutor.explain_concept,
            tutor.check_understanding,
            tutor.get_help,
        ],
    )

    return agent

async def entrypoint_console():
    """Console mode entrypoint for local audio testing"""
    logger.info("🎤 Starting Console Audio Test Mode")
    logger.info("📝 This mode tests audio input/output locally without LiveKit server")
    logger.info("🔊 Speak into your microphone - you should hear responses through speakers")

    try:
        # Create agent
        agent = await create_console_agent()

        # Enhanced RealtimeModel configuration for console testing
        llm = google_realtime.RealtimeModel(
            model="models/gemini-2.0-flash-exp",
            instructions=agent.instructions,
            voice="Aoede",  # Clear voice for testing
            temperature=0.7,
            modalities=["AUDIO"],  # Audio-to-audio mode
            language="en-IN",
            enable_affective_dialog=True,
            input_audio_transcription={"model": "IAMF"},
            output_audio_transcription={"model": "IAMF"},
        )

        # Enhanced VAD for better console interaction
        vad = silero.VAD.load(
            min_speech_duration=0.3,
            min_silence_duration=0.8,
            threshold=0.6,  # Higher threshold for console mode
        )

        logger.info("✅ Audio components initialized successfully")
        logger.info("🎯 Ready for console audio testing!")
        logger.info("💬 Try saying: 'Hello, can you hear me?'")

        return agent

    except Exception as e:
        logger.error(f"❌ Error creating console agent: {e}")
        raise

async def run_console_test():
    """Run the console test"""
    try:
        logger.info("🚀 Initializing Console Audio Test...")

        # Validate environment
        if not GOOGLE_API_KEY:
            logger.error("❌ GOOGLE_API_KEY is required for console testing")
            return False

        # Create agent
        agent = await entrypoint_console()

        logger.info("✅ Console agent ready!")
        logger.info("🎤 Console mode should now be active")
        logger.info("📢 If you can hear this, audio output is working!")

        return True

    except Exception as e:
        logger.error(f"💥 Console test failed: {e}")
        return False

if __name__ == "__main__":
    import sys

    # Check if running in console mode
    if len(sys.argv) > 1 and sys.argv[1] == "console":
        logger.info("🎮 Console mode detected!")

        # Run console test first
        success = asyncio.run(run_console_test())

        if success:
            # Use LiveKit's console mode
            cli.run_app(
                WorkerOptions(
                    entrypoint_fnc=entrypoint_console,
                    # Console mode doesn't need LiveKit credentials
                )
            )
        else:
            logger.error("❌ Console test failed - cannot start console mode")
            sys.exit(1)
    else:
        # Regular mode - show instructions
        print("🎯 Console Audio Test Agent")
        print("=" * 40)
        print("To test audio locally without LiveKit server:")
        print("python console_test_agent.py console")
        print("")
        print("This will test:")
        print("✅ Microphone input")
        print("✅ Speaker output")
        print("✅ Gemini Live API audio processing")
        print("✅ macOS audio compatibility")
        print("")
        print("Once console test works, try the full agent!")