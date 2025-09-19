#!/usr/bin/env python3
"""
Simple LiveKit agent for testing voice connections
This will echo back what you say to verify the connection works
"""

import asyncio
import logging
import os
from typing import Annotated
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli, tokenize, tts
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("voice-assistant")
logger.setLevel(logging.INFO)


class SimpleAssistant:
    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.assistant = None
        
    async def start(self):
        """Initialize and start the voice assistant"""
        logger.info(f"Starting assistant for room: {self.ctx.room.name}")
        
        # For now, just log that we're connected
        # In production, this would initialize Gemini/OpenAI
        initial_message = (
            "Hello! I'm your AI mathematics tutor. "
            "I'm here to help you learn and understand mathematics. "
            "What would you like to work on today?"
        )
        
        # Simple echo response for testing
        await self._speak(initial_message)
        
        # Listen for audio
        @self.ctx.room.on("track_published")
        async def on_track_published(participant: rtc.Participant, publication: rtc.TrackPublication):
            if publication.kind == rtc.TrackKind.KIND_AUDIO:
                logger.info(f"Audio track published by {participant.identity}")
                
        @self.ctx.room.on("track_subscribed")
        async def on_track_subscribed(
            track: rtc.Track, 
            publication: rtc.TrackPublication,
            participant: rtc.Participant
        ):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                logger.info(f"Subscribed to audio from {participant.identity}")
                # Here we would process the audio through Gemini
                
    async def _speak(self, text: str):
        """Send text response (would be TTS in production)"""
        logger.info(f"Speaking: {text}")
        # In production, this would use TTS to generate audio
        # For now, we'll just send a data message
        try:
            await self.ctx.room.local_participant.publish_data(
                text.encode('utf-8'),
                reliable=True
            )
        except Exception as e:
            logger.error(f"Error publishing data: {e}")


async def entrypoint(ctx: JobContext):
    """Main entry point for the agent"""
    logger.info(f"Agent started for room: {ctx.room.name}")
    
    # Wait for the first participant to join
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")
    
    # Create and start the assistant
    assistant = SimpleAssistant(ctx)
    await assistant.start()
    
    # Keep the agent running
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Agent shutting down")


async def request_fnc(req: agents.JobRequest) -> agents.JobResponse:
    """Accept all job requests"""
    logger.info(f"Received job request for room: {req.room.name}")
    return agents.JobResponse(accept=True)


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    
    # Check for required environment variables
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    if not all([livekit_url, api_key, api_secret]):
        logger.error("Missing required LiveKit environment variables!")
        logger.error("Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET")
        exit(1)
    
    logger.info(f"Connecting to LiveKit at: {livekit_url}")
    
    # Start the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
            api_key=api_key,
            api_secret=api_secret,
            ws_url=livekit_url,
        ),
    )