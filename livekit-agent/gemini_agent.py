#!/usr/bin/env python3
"""
Virtual Tutor AI Agent - Fixed Implementation
Using proper Gemini Live API 2025 with LiveKit
September 2025 - Production Ready
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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("virtual-tutor-agent")

# Environment variables validation
LIVEKIT_API_URL = os.getenv("LIVEKIT_API_URL", "wss://ai-tutor-prototype-ny9l58vd.livekit.cloud")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@dataclass
class StudentContext:
    """Student learning context"""
    user_id: str
    session_id: str
    grade: int
    subject: str
    current_chapter: Optional[str] = None
    current_topic: Optional[str] = None
    learning_preferences: Optional[Dict] = None
    progress_data: Optional[Dict] = None

class VirtualTutorAI:
    """AI Tutor with NCERT content access"""
    
    def __init__(self, context: StudentContext):
        self.context = context
        
    @function_tool
    async def explain_concept(self, concept: str, difficulty_level: str = "medium") -> str:
        """
        Explain a mathematical concept using NCERT content
        
        Args:
            concept: The concept to explain (e.g., "quadratic equations")
            difficulty_level: How detailed the explanation should be
        """
        try:
            # Get relevant content from database
            result = supabase.table('content_chunks').select('*').text_search(
                'content', concept, config='english'
            ).limit(3).execute()
            
            if result.data:
                content_context = "\n".join([chunk['content'] for chunk in result.data[:2]])
                return f"Based on NCERT content:\n\n{content_context}"
            else:
                return f"Let me explain {concept} step by step..."
                
        except Exception as e:
            logger.error(f"Error in explain_concept: {e}")
            return f"I'll explain {concept} using fundamental principles..."

    @function_tool
    async def check_understanding(self, student_response: str, topic: str) -> str:
        """
        Check student's understanding and provide feedback
        
        Args:
            student_response: What the student said
            topic: The topic being discussed
        """
        try:
            # Log student interaction for progress tracking
            supabase.table('learning_interactions').insert({
                'user_id': self.context.user_id,
                'session_id': self.context.session_id,
                'topic': topic,
                'student_input': student_response,
                'interaction_type': 'understanding_check',
                'created_at': datetime.now().isoformat()
            }).execute()
            
            # Simple understanding indicators
            understanding_keywords = ['understand', 'got it', 'makes sense', 'clear', 'yes']
            confusion_keywords = ['confused', 'don\'t understand', 'unclear', 'help']
            
            response_lower = student_response.lower()
            
            if any(keyword in response_lower for keyword in understanding_keywords):
                return "Great! It sounds like you're getting it. Let's move on to a practice problem."
            elif any(keyword in response_lower for keyword in confusion_keywords):
                return "No worries! Let me explain it differently. What specific part is unclear?"
            else:
                return "I'd like to make sure you understand. Can you explain it back to me in your own words?"
                
        except Exception as e:
            logger.error(f"Error in check_understanding: {e}")
            return "Let's make sure you understand. Can you tell me what you think about this?"

    @function_tool 
    async def get_practice_problem(self, topic: str, difficulty: str = "easy") -> str:
        """
        Generate a practice problem for the given topic
        
        Args:
            topic: The mathematical topic
            difficulty: Problem difficulty level
        """
        try:
            # Get practice problems from database
            result = supabase.table('content_chunks').select('*').ilike(
                'content', f'%{topic}%problem%'
            ).limit(2).execute()
            
            if result.data:
                problem_content = result.data[0]['content']
                return f"Here's a practice problem:\n\n{problem_content}"
            else:
                # Fallback practice problems by topic
                fallback_problems = {
                    "quadratic equations": "Solve: x² - 5x + 6 = 0",
                    "linear equations": "Solve: 2x + 3 = 11",
                    "polynomials": "Factor: x² + 7x + 12",
                    "trigonometry": "Find sin(60°)",
                }
                
                problem = fallback_problems.get(topic.lower(), f"Let's work on a {topic} problem together.")
                return f"Here's a practice problem: {problem}"
                
        except Exception as e:
            logger.error(f"Error in get_practice_problem: {e}")
            return f"Let's work on a {topic} problem together. I'll guide you through it step by step."

async def get_student_context(room_name: str) -> StudentContext:
    """Extract student context from room metadata or database"""
    try:
        # Parse room name for context (format: user_id_subject_grade)
        parts = room_name.split('_')
        if len(parts) >= 3:
            user_id = parts[0]
            subject = parts[1]
            grade = int(parts[2])
        else:
            # Fallback defaults
            user_id = "test_user"
            subject = "Mathematics"
            grade = 10
            
        # Get user profile from database
        result = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
        
        profile = result.data if result.data else {}
        
        return StudentContext(
            user_id=user_id,
            session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            grade=profile.get('grade', grade),
            subject=profile.get('current_subject', subject),
            current_chapter=profile.get('current_chapter'),
            current_topic=profile.get('current_topic'),
            learning_preferences=profile.get('learning_preferences', {}),
            progress_data=profile.get('progress_data', {})
        )
        
    except Exception as e:
        logger.error(f"Error getting student context: {e}")
        # Return safe defaults
        return StudentContext(
            user_id="anonymous",
            session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            grade=10,
            subject="Mathematics"
        )

async def entrypoint(ctx: JobContext):
    """Main entry point for the Virtual Tutor AI Agent"""
    
    logger.info("Starting Virtual Tutor Agent...")
    logger.info(f"Connecting to LiveKit at: {LIVEKIT_API_URL}")
    logger.info("Using Gemini Live API 2.0 Flash")
    
    # Get student context
    student_context = await get_student_context(ctx.room.name)
    logger.info(f"Student context: Grade {student_context.grade}, Subject: {student_context.subject}")
    
    # Initialize the tutor AI with student context
    tutor = VirtualTutorAI(student_context)
    
    # Create personalized system instructions
    system_instructions = f"""You are an expert AI tutor specializing in {student_context.subject} for Grade {student_context.grade} students. 

Your teaching style:
- Be warm, encouraging, and patient
- Explain concepts clearly using simple language
- Use step-by-step explanations
- Ask questions to check understanding
- Provide relevant examples from NCERT curriculum
- Adapt to the student's pace and learning style

Current focus: {student_context.current_topic or 'General Mathematics'}

Important guidelines:
- Always greet the student first when they join
- Be conversational and natural in your speech
- Encourage questions and active participation
- Use the available tools to explain concepts and provide practice problems
- Track student progress and understanding

Remember: You're having a voice conversation, so speak naturally and conversationally."""

    # Initialize the agent with proper function tools
    agent = Agent(
        instructions=system_instructions,
        tools=[
            tutor.explain_concept,
            tutor.check_understanding,
            tutor.get_practice_problem,
        ],
    )
    
    # Configure the session with proper Gemini Live API
    session = AgentSession(
        # Use Gemini Live API 2.0 Flash (proper parameters)
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            voice="Puck",  # More natural sounding voice
            temperature=0.8,
            instructions=system_instructions,
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
            'user_id': student_context.user_id,
            'content': f'AI Tutor connected for {student_context.subject}',
            'metadata': {
                'chapter': student_context.current_chapter,
                'topic': student_context.current_topic,
            }
        }).execute()
    except Exception as e:
        logger.error(f"Error logging session start: {e}")
    
    # The session will automatically handle:
    # 1. Initial greeting (AI speaks first)
    # 2. Voice conversation management
    # 3. Function tool calls when needed
    # 4. Turn detection and smooth conversation flow
    
    # Keep the session alive
    try:
        # The session handles the conversation automatically
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
                'user_id': student_context.user_id,
                'content': 'AI Tutor session ended',
            }).execute()
        except:
            pass

if __name__ == "__main__":
    # Run the agent
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
            ws_url=LIVEKIT_API_URL,
        )
    )