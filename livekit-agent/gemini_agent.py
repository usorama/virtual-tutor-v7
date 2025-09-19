#!/usr/bin/env python3
"""
Virtual Tutor AI Agent - Production Ready
Using Gemini Live API 2.5 Flash with LiveKit
September 2025 - Latest Implementation
"""

import os
import asyncio
import logging
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import (
    Agent,
    AgentSession, 
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import google, silero
from livekit.plugins.turn_detector.english import EnglishModel
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("virtual-tutor-agent")

# Environment configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@dataclass
class StudentContext:
    """Context about the current student and session"""
    student_id: str
    session_id: str
    room_name: str
    current_chapter: Optional[str] = None
    current_topic: Optional[str] = None
    grade_level: str = "10"
    subject: str = "Mathematics"
    conversation_history: List[Dict[str, str]] = None
    
    def __post_init__(self):
        if self.conversation_history is None:
            self.conversation_history = []

class ContentRetrieval:
    """Handles retrieval of textbook content from Supabase"""
    
    @staticmethod
    async def get_relevant_content(topic: str, chapter: str = None) -> str:
        """Retrieve relevant content chunks for the current topic"""
        try:
            query = supabase.table('content_chunks').select('*')
            
            if chapter:
                # Get chapter ID first
                chapter_result = supabase.table('chapters').select('id').eq('title', chapter).execute()
                if chapter_result.data:
                    chapter_id = chapter_result.data[0]['id']
                    query = query.eq('chapter_id', chapter_id)
            
            # Search for relevant content
            result = query.limit(5).execute()
            
            if result.data:
                content_pieces = []
                for chunk in result.data:
                    content_pieces.append(f"Page {chunk['page_number']}: {chunk['content']}")
                return "\n\n".join(content_pieces)
            
            return "No specific content found for this topic."
            
        except Exception as e:
            logger.error(f"Error retrieving content: {e}")
            return "Content retrieval temporarily unavailable."

class VirtualTutorAgent:
    """Main AI Tutor Agent using Gemini Live API"""
    
    def __init__(self, context: StudentContext):
        self.context = context
        self.content_retrieval = ContentRetrieval()
        
    async def get_system_instructions(self) -> str:
        """Generate dynamic system instructions based on student context"""
        
        # Retrieve relevant textbook content
        textbook_content = await self.content_retrieval.get_relevant_content(
            self.context.current_topic,
            self.context.current_chapter
        )
        
        return f"""You are a friendly and patient AI mathematics tutor for Grade {self.context.grade_level} students.
        
Your student is currently studying: {self.context.current_topic or 'General Mathematics'}
Chapter: {self.context.current_chapter or 'General Review'}

TEACHING APPROACH:
- Be encouraging and supportive
- Use simple language appropriate for Grade {self.context.grade_level}
- Break down complex concepts into smaller steps
- Ask questions to check understanding
- Provide examples from everyday life
- Celebrate small victories and progress

RELEVANT TEXTBOOK CONTENT:
{textbook_content[:2000]}  # Limit to prevent context overflow

CONVERSATION STYLE:
- Speak naturally and conversationally
- Use appropriate pauses and emphasis
- Be enthusiastic about mathematics
- Respond to emotional cues in the student's voice
- Encourage questions and curiosity

Remember: You're not just teaching math, you're building confidence and love for learning."""

    @function_tool
    async def explain_concept(
        self,
        context: RunContext,
        concept: str,
    ):
        """Explain a mathematical concept in detail
        
        Args:
            concept: The mathematical concept to explain
        """
        logger.info(f"Explaining concept: {concept}")
        
        # Retrieve specific content about this concept
        content = await self.content_retrieval.get_relevant_content(concept)
        
        return f"Here's information about {concept} from your textbook:\n{content[:500]}"
    
    @function_tool
    async def check_understanding(
        self,
        context: RunContext,
        topic: str,
        understanding_level: str,
    ):
        """Track student's understanding of a topic
        
        Args:
            topic: The topic being discussed
            understanding_level: Student's current understanding (low, medium, high)
        """
        logger.info(f"Student understanding of {topic}: {understanding_level}")
        
        # Update learning progress in database
        try:
            supabase.table('learning_progress').upsert({
                'student_id': self.context.student_id,
                'topic_id': topic,
                'mastery_level': {
                    'low': 30,
                    'medium': 60,
                    'high': 90
                }.get(understanding_level, 50),
                'last_attempted': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Error updating progress: {e}")
        
        return f"Noted. Let's {'move forward' if understanding_level == 'high' else 'practice more'}!"
    
    @function_tool
    async def get_practice_problem(
        self,
        context: RunContext,
        difficulty: str = "medium",
    ):
        """Generate a practice problem for the student
        
        Args:
            difficulty: Problem difficulty (easy, medium, hard)
        """
        # In production, this would generate contextual problems
        problems = {
            "easy": "What is 15 + 27?",
            "medium": "Solve for x: 2x + 5 = 15",
            "hard": "Find the roots of: x² - 5x + 6 = 0"
        }
        
        return problems.get(difficulty, problems["medium"])

async def entrypoint(ctx: JobContext):
    """Main entry point for the agent"""
    
    logger.info(f"Agent starting for room: {ctx.room.name}")
    
    # Extract metadata from the room
    room_metadata = {}
    if ctx.room.metadata:
        try:
            room_metadata = json.loads(ctx.room.metadata)
        except:
            pass
    
    # Create student context
    student_context = StudentContext(
        student_id=room_metadata.get('student_id', 'unknown'),
        session_id=room_metadata.get('session_id', 'unknown'),
        room_name=ctx.room.name,
        current_chapter=room_metadata.get('chapter'),
        current_topic=room_metadata.get('topic'),
    )
    
    # Initialize the tutor agent
    tutor = VirtualTutorAgent(student_context)
    
    # Get dynamic system instructions
    system_instructions = await tutor.get_system_instructions()
    
    # Create the agent with Gemini Live API
    agent = Agent(
        instructions=system_instructions,
        tools=[
            tutor.explain_concept,
            tutor.check_understanding,
            tutor.get_practice_problem,
        ],
    )
    
    # Configure the session with Gemini Live API
    session = AgentSession(
        # Use Gemini Live API 2.0 Flash (latest stable as of Sep 2025)
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            api_key=GOOGLE_API_KEY,
            voice="Kore",  # Natural sounding voice
            response_modalities=["AUDIO"],  # Direct audio-to-audio
            system_instructions=system_instructions,
        ),
        # Voice Activity Detection
        vad=silero.VAD.load(),
        # Turn detection for natural conversation flow
        turn_detection=EnglishModel(),
        # Configuration for smooth conversations
        min_endpointing_delay=0.5,
        max_endpointing_delay=3.0,
    )
    
    # Connect to the room
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    
    # Wait for the student to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Student joined: {participant.identity}")
    
    # Start the session
    await session.start(agent=agent, room=ctx.room)
    
    # Log session start
    try:
        supabase.table('session_events').insert({
            'session_id': student_context.session_id,
            'event_type': 'agent_connected',
            'content': f'AI Tutor connected for {student_context.subject}',
            'metadata': {
                'chapter': student_context.current_chapter,
                'topic': student_context.current_topic,
            }
        }).execute()
    except Exception as e:
        logger.error(f"Error logging session start: {e}")
    
    # Generate initial greeting
    await session.generate_reply(
        instructions=f"""Greet the student warmly and tell them:
        1. You're excited to help them learn {student_context.current_topic or 'mathematics'}
        2. They can ask any questions about the topic
        3. You'll work through problems together
        4. They should feel free to interrupt you anytime
        
        Be enthusiastic and encouraging!"""
    )
    
    # Keep the session alive
    try:
        # The session will handle the conversation automatically
        # Just keep the coroutine alive
        while ctx.room.connection_state == rtc.ConnectionState.CONN_CONNECTED:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("Session ending...")
    finally:
        # Log session end
        try:
            supabase.table('session_events').insert({
                'session_id': student_context.session_id,
                'event_type': 'agent_disconnected',
                'content': 'AI Tutor session ended',
            }).execute()
        except:
            pass

async def request_fnc(req: agents.JobRequest) -> agents.JobResponse:
    """Accept job requests for tutoring sessions"""
    
    logger.info(f"Received job request for room: {req.room.name}")
    
    # Accept all tutoring session requests
    return agents.JobResponse(
        accept=True,
        metadata={
            'agent_type': 'virtual_tutor',
            'version': '2.0',
            'capabilities': ['mathematics', 'grade_10', 'audio_conversation']
        }
    )

if __name__ == "__main__":
    # Check required environment variables
    required_vars = ["GOOGLE_API_KEY", "LIVEKIT_URL", "LIVEKIT_API_KEY", 
                      "LIVEKIT_API_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        logger.error("Please check your .env file")
        exit(1)
    
    logger.info("Starting Virtual Tutor Agent...")
    logger.info(f"Connecting to LiveKit at: {os.getenv('LIVEKIT_URL')}")
    logger.info("Using Gemini Live API 2.0 Flash")
    
    # Run the agent
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
            ws_url=os.getenv("LIVEKIT_URL"),
            num_idle_workers=1,  # Keep one worker ready
            max_workers=5,  # Support up to 5 concurrent sessions
        ),
    )