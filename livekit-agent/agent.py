#!/usr/bin/env python3
"""
Virtual Tutor LiveKit Agent with Gemini Live Integration
Handles audio-to-audio conversations between students and AI tutor
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import json

from livekit import agents
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import gemini
from dotenv import load_dotenv
from supabase import create_client, Client

# Import enhanced Gemini configuration
from gemini_config import (
    gemini_config,
    content_manager,
    audio_manager,
    get_enhanced_system_prompt,
    log_interaction_quality
)

# Load environment variables
load_dotenv("../.env.local")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    logger.warning("Supabase credentials not found, running without database")

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

class VirtualTutorAgent:
    """Main agent class for Virtual Tutor AI classroom"""
    
    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.room = ctx.room
        self.student_id: Optional[str] = None
        self.session_id: Optional[str] = None
        self.current_chapter: Optional[str] = None
        self.content_chunks: list = []
        
    async def load_student_context(self) -> Dict[str, Any]:
        """Load student profile and preferences from Supabase"""
        if not supabase:
            return {}
            
        try:
            # Get participant identity (should be student ID)
            participants = self.room.remote_participants
            if participants:
                self.student_id = list(participants.values())[0].identity
                
                # Fetch student profile
                response = supabase.table('profiles').select('*').eq('id', self.student_id).single().execute()
                if response.data:
                    logger.info(f"Loaded profile for student: {self.student_id}")
                    return response.data
        except Exception as e:
            logger.error(f"Error loading student context: {e}")
        
        return {}
    
    async def load_content_chunks(self, chapter_id: Optional[str] = None) -> list:
        """Load relevant NCERT content chunks from database"""
        if not supabase:
            return []
            
        try:
            query = supabase.table('content_chunks').select('*')
            
            if chapter_id:
                query = query.eq('chapter_id', chapter_id)
            else:
                # Load general chunks for the textbook
                query = query.limit(10)
            
            response = query.execute()
            if response.data:
                logger.info(f"Loaded {len(response.data)} content chunks")
                return response.data
        except Exception as e:
            logger.error(f"Error loading content chunks: {e}")
        
        return []
    
    async def create_session_record(self) -> Optional[str]:
        """Create a new learning session in the database"""
        if not supabase or not self.student_id:
            return None
            
        try:
            session_data = {
                'student_id': self.student_id,
                'room_name': self.room.name,
                'started_at': datetime.now().isoformat(),
                'chapter_focus': self.current_chapter
            }
            
            response = supabase.table('learning_sessions').insert(session_data).execute()
            if response.data:
                self.session_id = response.data[0]['id']
                logger.info(f"Created session: {self.session_id}")
                return self.session_id
        except Exception as e:
            logger.error(f"Error creating session: {e}")
        
        return None
    
    async def log_session_event(self, event_type: str, content: str, metadata: Optional[Dict] = None):
        """Log events during the learning session"""
        if not supabase or not self.session_id:
            return
            
        try:
            event_data = {
                'session_id': self.session_id,
                'event_type': event_type,
                'content': content,
                'metadata': metadata or {}
            }
            
            supabase.table('session_events').insert(event_data).execute()
        except Exception as e:
            logger.error(f"Error logging session event: {e}")
    
    async def end_session(self):
        """End the learning session and update records"""
        if not supabase or not self.session_id:
            return
            
        try:
            # Calculate duration
            response = supabase.table('learning_sessions').select('started_at').eq('id', self.session_id).single().execute()
            if response.data:
                started = datetime.fromisoformat(response.data['started_at'].replace('T', ' ').replace('Z', ''))
                duration = int((datetime.now() - started).total_seconds() / 60)
                
                # Update session record
                update_data = {
                    'ended_at': datetime.now().isoformat(),
                    'duration_minutes': duration
                }
                
                supabase.table('learning_sessions').update(update_data).eq('id', self.session_id).execute()
                
                # Update student's total session time
                if self.student_id:
                    profile_response = supabase.table('profiles').select('total_session_minutes').eq('id', self.student_id).single().execute()
                    if profile_response.data:
                        current_total = profile_response.data.get('total_session_minutes', 0) or 0
                        supabase.table('profiles').update({
                            'total_session_minutes': current_total + duration,
                            'last_session_at': datetime.now().isoformat()
                        }).eq('id', self.student_id).execute()
                
                logger.info(f"Session ended: {self.session_id}, Duration: {duration} minutes")
        except Exception as e:
            logger.error(f"Error ending session: {e}")

async def entrypoint(ctx: JobContext):
    """Main entry point for the LiveKit agent"""
    
    logger.info(f"Agent started for room: {ctx.room.name}")
    
    # Initialize the Virtual Tutor agent
    tutor = VirtualTutorAgent(ctx)
    
    # Load student context
    student_context = await tutor.load_student_context()
    
    # Load relevant content chunks
    content_chunks = await tutor.load_content_chunks()
    
    # Create session record
    await tutor.create_session_record()
    
    # Build context-aware system prompt using enhanced configuration
    student_grade = student_context.get('grade', 10) if student_context else 10
    current_chapter = student_context.get('current_chapter') if student_context else None
    
    # Load content into context manager if available
    if content_chunks and current_chapter:
        content_manager.load_chapter_context(current_chapter, content_chunks)
    
    # Get enhanced prompt with all context
    enhanced_prompt = get_enhanced_system_prompt(student_grade, current_chapter)
    
    # Initialize Gemini LLM with audio capabilities
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=enhanced_prompt
    )
    
    # Create the voice assistant with Gemini
    assistant = VoiceAssistant(
        vad=agents.vad.silero.VAD.load(),  # Voice Activity Detection
        stt=None,  # Not needed for audio-to-audio
        llm=gemini.LLM(
            api_key=GOOGLE_API_KEY,
            model="models/gemini-2.0-flash-exp",  # Using the audio-capable model
        ),
        tts=None,  # Not needed for audio-to-audio
        chat_ctx=initial_ctx,
    )
    
    # Configure interruption handling for natural conversation
    assistant.allow_interruptions = True
    assistant.interrupt_speech_duration = 0.5  # Allow quick interruptions
    
    # Start the assistant
    assistant.start(ctx.room)
    
    # Log session start
    await tutor.log_session_event("session_started", "AI Tutor connected and ready")
    
    # Set up event handlers
    @ctx.room.on("participant_disconnected")
    async def on_participant_disconnected(participant):
        logger.info(f"Participant disconnected: {participant.identity}")
        await tutor.end_session()
    
    @assistant.on("user_speech_committed")
    async def on_user_speech(text: str):
        """Handle when user speech is recognized"""
        logger.info(f"User said: {text}")
        await tutor.log_session_event("student_question", text)
    
    @assistant.on("agent_speech_committed")
    async def on_agent_speech(text: str):
        """Handle when agent speaks"""
        logger.info(f"Agent said: {text}")
        await tutor.log_session_event("tutor_response", text)
    
    # Wait for the session to end
    await assistant.wait_for_completion()
    
    # Clean up
    await tutor.end_session()
    logger.info("Agent session completed")

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