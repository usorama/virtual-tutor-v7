#!/usr/bin/env python3
"""
Enhanced Virtual Tutor LiveKit Agent with Advanced Learning Patterns
Implements Socratic method, personalized teaching, and adaptive responses
"""

import os
import logging
import json
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

from livekit import agents
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import gemini
from dotenv import load_dotenv
from supabase import create_client, Client

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

# Gemini API configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBcUGgObt--HCjBlXygu8iYMuI6PnPbeIY")


class TeachingStyle(Enum):
    SOCRATIC = "socratic"  # Ask guiding questions
    DIRECT = "direct"      # Direct explanation
    EXAMPLE = "example"    # Teach through examples
    PRACTICE = "practice"  # Learn by doing


class ConversationState(Enum):
    GREETING = "greeting"
    TOPIC_SELECTION = "topic_selection"
    TEACHING = "teaching"
    PRACTICE = "practice"
    ASSESSMENT = "assessment"
    ENCOURAGEMENT = "encouragement"
    SUMMARY = "summary"


class LearningPattern:
    """Defines different learning interaction patterns"""
    
    @staticmethod
    def socratic_dialogue():
        return [
            "Let me ask you a question to check your understanding...",
            "What do you think would happen if...",
            "Can you explain why you think that?",
            "How would you approach this problem?",
            "What pattern do you notice here?"
        ]
    
    @staticmethod
    def concept_introduction():
        return [
            "Let's explore a new concept together.",
            "First, let me explain the basic idea...",
            "Think of it this way...",
            "Here's an easier way to remember this..."
        ]
    
    @staticmethod
    def problem_solving():
        return [
            "Let's break this problem into smaller steps.",
            "Step 1: Identify what we know...",
            "Step 2: Figure out what we need to find...",
            "Step 3: Choose the right formula or method...",
            "Step 4: Solve and check our answer..."
        ]
    
    @staticmethod
    def mistake_correction():
        return [
            "That's a common mistake, let me show you why...",
            "You're on the right track, but let's reconsider this part...",
            "Good thinking! Just one small correction...",
            "Let's review this step together..."
        ]
    
    @staticmethod
    def encouragement_phrases():
        return {
            'success': [
                "Excellent work! You've got it!",
                "That's absolutely correct! Well done!",
                "You're making great progress!",
                "I'm impressed with your understanding!"
            ],
            'partial': [
                "You're on the right path!",
                "Good thinking, let's refine it a bit.",
                "Almost there! Just one more step.",
                "You've got the main idea!"
            ],
            'struggle': [
                "Don't worry, this is challenging for many students.",
                "Let's try a different approach.",
                "Every mistake is a learning opportunity.",
                "You're building understanding, keep going!"
            ]
        }


class EnhancedTutorAgent:
    """Enhanced AI Tutor with advanced teaching capabilities"""
    
    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.room = ctx.room
        self.student_id: Optional[str] = None
        self.session_id: Optional[str] = None
        self.student_profile: Dict[str, Any] = {}
        self.current_state = ConversationState.GREETING
        self.current_topic: Optional[str] = None
        self.content_chunks: List[Dict] = []
        self.teaching_style = TeachingStyle.SOCRATIC
        self.conversation_history: List[Dict] = []
        self.error_count = 0
        self.success_count = 0
        self.session_start_time = datetime.now()
        
    async def initialize(self):
        """Initialize the tutor with student context"""
        await self.load_student_profile()
        await self.load_relevant_content()
        await self.create_session_record()
        
    async def load_student_profile(self) -> Dict[str, Any]:
        """Load comprehensive student profile including preferences"""
        if not supabase:
            return {}
            
        try:
            participants = self.room.remote_participants
            if participants:
                self.student_id = list(participants.values())[0].identity
                
                # Fetch detailed profile
                response = supabase.table('profiles').select('*').eq('id', self.student_id).single().execute()
                if response.data:
                    self.student_profile = response.data
                    
                    # Determine teaching style based on profile
                    learning_style = response.data.get('preferred_explanation_style', 'verbal')
                    if learning_style == 'practical':
                        self.teaching_style = TeachingStyle.EXAMPLE
                    elif learning_style == 'visual':
                        self.teaching_style = TeachingStyle.PRACTICE
                    else:
                        self.teaching_style = TeachingStyle.SOCRATIC
                    
                    logger.info(f"Loaded profile - Grade: {response.data.get('grade')}, Style: {self.teaching_style}")
                    return response.data
        except Exception as e:
            logger.error(f"Error loading student profile: {e}")
        
        return {}
    
    async def load_relevant_content(self, topic: Optional[str] = None):
        """Load content chunks relevant to current topic or chapter"""
        if not supabase:
            return []
            
        try:
            # Start with current chapter or topic from profile
            chapter_id = self.student_profile.get('current_chapter')
            
            query = supabase.table('content_chunks').select('*')
            
            if topic:
                # Search for specific topic
                query = query.ilike('content', f'%{topic}%')
            elif chapter_id:
                # Load chapter content
                query = query.eq('chapter_id', chapter_id)
            
            # Limit to manageable amount
            response = query.limit(20).execute()
            
            if response.data:
                self.content_chunks = response.data
                logger.info(f"Loaded {len(response.data)} content chunks")
                return response.data
        except Exception as e:
            logger.error(f"Error loading content: {e}")
        
        return []
    
    async def create_session_record(self) -> Optional[str]:
        """Create learning session with metadata"""
        if not supabase or not self.student_id:
            return None
            
        try:
            session_data = {
                'student_id': self.student_id,
                'room_name': self.room.name,
                'started_at': datetime.now().isoformat(),
                'chapter_focus': self.student_profile.get('current_chapter'),
                'metadata': {
                    'teaching_style': self.teaching_style.value,
                    'grade': self.student_profile.get('grade', 10),
                    'subject': 'Mathematics'
                }
            }
            
            response = supabase.table('learning_sessions').insert(session_data).execute()
            if response.data:
                self.session_id = response.data[0]['id']
                logger.info(f"Created session: {self.session_id}")
                return self.session_id
        except Exception as e:
            logger.error(f"Error creating session: {e}")
        
        return None
    
    async def get_personalized_greeting(self) -> str:
        """Generate personalized greeting based on time and progress"""
        hour = datetime.now().hour
        name = self.student_profile.get('full_name', 'Student').split()[0]
        
        time_greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
        
        # Check last session
        last_session = self.student_profile.get('last_session_at')
        if last_session:
            return f"{time_greeting}, {name}! Welcome back! Ready to continue our mathematics journey?"
        else:
            return f"{time_greeting}, {name}! I'm excited to help you learn mathematics today. What would you like to explore?"
    
    def generate_system_prompt(self) -> str:
        """Generate dynamic system prompt based on student profile and context"""
        grade = self.student_profile.get('grade', 10)
        pace = self.student_profile.get('learning_pace', 'medium')
        weak_areas = self.student_profile.get('weak_areas', [])
        
        prompt = f"""
        You are an expert NCERT Mathematics tutor for a Grade {grade} student named {self.student_profile.get('full_name', 'Student')}.
        
        Student Profile:
        - Learning Pace: {pace}
        - Teaching Style Preference: {self.teaching_style.value}
        - Weak Areas: {', '.join(weak_areas) if weak_areas else 'None identified yet'}
        
        Teaching Guidelines:
        1. {"Use the Socratic method - ask guiding questions" if self.teaching_style == TeachingStyle.SOCRATIC else ""}
        2. {"Provide plenty of examples and real-world applications" if self.teaching_style == TeachingStyle.EXAMPLE else ""}
        3. {"Focus on hands-on practice problems" if self.teaching_style == TeachingStyle.PRACTICE else ""}
        4. {"Give clear, direct explanations" if self.teaching_style == TeachingStyle.DIRECT else ""}
        
        Conversation Rules:
        - Keep responses concise (under 30 seconds when spoken)
        - Use simple language appropriate for Grade {grade}
        - Reference NCERT textbook examples when possible
        - Be encouraging and patient
        - Check understanding frequently
        - Allow interruptions and questions
        - Speak naturally and conversationally
        
        Current Context:
        - Session State: {self.current_state.value}
        - Current Topic: {self.current_topic or 'Not selected yet'}
        - Success Rate: {self.success_count}/{self.success_count + self.error_count} correct responses
        
        Available Content:
        {self._format_content_context()}
        
        Remember: Your goal is to help the student understand concepts deeply, not just memorize formulas.
        """
        
        return prompt
    
    def _format_content_context(self) -> str:
        """Format content chunks for AI context"""
        if not self.content_chunks:
            return "No specific content loaded yet."
        
        context_parts = []
        for i, chunk in enumerate(self.content_chunks[:5]):  # Limit to top 5 chunks
            context_parts.append(f"Content {i+1}: {chunk.get('content', '')[:300]}...")
        
        return "\n".join(context_parts)
    
    async def process_student_input(self, text: str) -> str:
        """Process student input and generate appropriate response"""
        # Add to conversation history
        self.conversation_history.append({
            'role': 'student',
            'content': text,
            'timestamp': datetime.now().isoformat()
        })
        
        # Detect intent and update state
        intent = self._detect_intent(text)
        await self._update_conversation_state(intent, text)
        
        # Generate response based on state and teaching style
        response = await self._generate_teaching_response(text, intent)
        
        # Add response to history
        self.conversation_history.append({
            'role': 'tutor',
            'content': response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Log interaction
        await self._log_interaction(text, response, intent)
        
        return response
    
    def _detect_intent(self, text: str) -> str:
        """Detect the intent of student's message"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['hello', 'hi', 'start', 'begin']):
            return 'greeting'
        elif any(word in text_lower for word in ['help', 'explain', 'understand', "don't get"]):
            return 'help_request'
        elif any(word in text_lower for word in ['correct', 'right', 'yes']):
            return 'confirmation'
        elif any(word in text_lower for word in ['wrong', 'no', 'incorrect']):
            return 'disagreement'
        elif any(word in text_lower for word in ['example', 'show', 'demonstrate']):
            return 'example_request'
        elif any(word in text_lower for word in ['practice', 'problem', 'solve']):
            return 'practice_request'
        elif any(word in text_lower for word in ['confused', 'lost', 'difficult']):
            return 'confusion'
        elif '?' in text:
            return 'question'
        else:
            return 'statement'
    
    async def _update_conversation_state(self, intent: str, text: str):
        """Update conversation state based on intent"""
        if intent == 'greeting':
            self.current_state = ConversationState.GREETING
        elif intent in ['help_request', 'confusion']:
            self.current_state = ConversationState.TEACHING
            self.error_count += 1
        elif intent in ['example_request', 'practice_request']:
            self.current_state = ConversationState.PRACTICE
        elif intent == 'confirmation':
            self.success_count += 1
            if self.current_state == ConversationState.PRACTICE:
                self.current_state = ConversationState.ASSESSMENT
        
        # Check if we should encourage
        if self.error_count > 2:
            self.current_state = ConversationState.ENCOURAGEMENT
            self.error_count = 0  # Reset
        
        # Check for session duration
        session_duration = (datetime.now() - self.session_start_time).seconds / 60
        if session_duration > 25:
            self.current_state = ConversationState.SUMMARY
    
    async def _generate_teaching_response(self, student_input: str, intent: str) -> str:
        """Generate appropriate teaching response"""
        if self.current_state == ConversationState.GREETING:
            return await self.get_personalized_greeting()
        
        elif self.current_state == ConversationState.TEACHING:
            if self.teaching_style == TeachingStyle.SOCRATIC:
                prompts = LearningPattern.socratic_dialogue()
                return prompts[self.success_count % len(prompts)]
            else:
                prompts = LearningPattern.concept_introduction()
                return prompts[min(self.success_count, len(prompts)-1)]
        
        elif self.current_state == ConversationState.PRACTICE:
            prompts = LearningPattern.problem_solving()
            step = min(self.success_count, len(prompts)-1)
            return prompts[step]
        
        elif self.current_state == ConversationState.ENCOURAGEMENT:
            if self.success_count > self.error_count:
                phrases = LearningPattern.encouragement_phrases()['success']
            elif self.success_count > 0:
                phrases = LearningPattern.encouragement_phrases()['partial']
            else:
                phrases = LearningPattern.encouragement_phrases()['struggle']
            
            import random
            return random.choice(phrases)
        
        elif self.current_state == ConversationState.SUMMARY:
            return f"""Great session today! We covered {self.current_topic or 'various topics'}. 
                      You got {self.success_count} concepts right. 
                      Remember to practice what we learned. See you next time!"""
        
        # Default response
        return "Let me help you understand this better. Can you tell me what specific part is challenging?"
    
    async def _log_interaction(self, student_input: str, tutor_response: str, intent: str):
        """Log interaction to database"""
        if not supabase or not self.session_id:
            return
        
        try:
            event_data = {
                'session_id': self.session_id,
                'event_type': intent,
                'content': json.dumps({
                    'student': student_input,
                    'tutor': tutor_response,
                    'state': self.current_state.value,
                    'success_count': self.success_count,
                    'error_count': self.error_count
                }),
                'timestamp': datetime.now().isoformat()
            }
            
            supabase.table('session_events').insert(event_data).execute()
        except Exception as e:
            logger.error(f"Error logging interaction: {e}")
    
    async def end_session(self):
        """End session with summary and progress update"""
        if not supabase or not self.session_id:
            return
        
        try:
            session_duration = int((datetime.now() - self.session_start_time).seconds / 60)
            
            # Generate session summary
            summary = f"Covered topics with {self.success_count} successful responses. "
            summary += f"Teaching style: {self.teaching_style.value}. "
            summary += f"Areas of focus: {self.current_topic or 'General mathematics'}."
            
            # Update session record
            update_data = {
                'ended_at': datetime.now().isoformat(),
                'duration_minutes': session_duration,
                'session_summary': summary,
                'quality_score': min(100, (self.success_count / max(1, self.success_count + self.error_count)) * 100)
            }
            
            supabase.table('learning_sessions').update(update_data).eq('id', self.session_id).execute()
            
            # Update student profile
            if self.student_id:
                profile_response = supabase.table('profiles').select('total_session_minutes').eq('id', self.student_id).single().execute()
                if profile_response.data:
                    current_total = profile_response.data.get('total_session_minutes', 0) or 0
                    supabase.table('profiles').update({
                        'total_session_minutes': current_total + session_duration,
                        'last_session_at': datetime.now().isoformat()
                    }).eq('id', self.student_id).execute()
            
            logger.info(f"Session ended - Duration: {session_duration}min, Success rate: {self.success_count}/{self.success_count + self.error_count}")
        except Exception as e:
            logger.error(f"Error ending session: {e}")


async def entrypoint(ctx: JobContext):
    """Enhanced entry point with full teaching capabilities"""
    logger.info(f"Enhanced Agent started for room: {ctx.room.name}")
    
    # Initialize enhanced tutor
    tutor = EnhancedTutorAgent(ctx)
    await tutor.initialize()
    
    # Get personalized system prompt
    system_prompt = tutor.generate_system_prompt()
    
    # Initialize chat context
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=system_prompt
    )
    
    # Create voice assistant
    assistant = VoiceAssistant(
        vad=agents.vad.silero.VAD.load(),
        stt=None,  # Using audio-to-audio
        llm=gemini.LLM(
            api_key=GOOGLE_API_KEY,
            model="models/gemini-2.0-flash-exp",
        ),
        tts=None,  # Using audio-to-audio
        chat_ctx=initial_ctx,
    )
    
    # Configure for natural conversation
    assistant.allow_interruptions = True
    assistant.interrupt_speech_duration = 0.3  # Quick interruption response
    
    # Start assistant
    assistant.start(ctx.room)
    
    # Event handlers
    @assistant.on("user_speech_committed")
    async def on_user_speech(text: str):
        """Handle user speech with teaching logic"""
        response = await tutor.process_student_input(text)
        logger.info(f"Student: {text}")
        logger.info(f"Tutor: {response}")
    
    @ctx.room.on("participant_disconnected")
    async def on_disconnect(participant):
        await tutor.end_session()
    
    # Wait for completion
    await assistant.wait_for_completion()
    await tutor.end_session()
    
    logger.info("Enhanced tutoring session completed")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY", "APIz7rWgBkZqPDq"),
            api_secret=os.getenv("LIVEKIT_API_SECRET", "kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA"),
            ws_url=os.getenv("LIVEKIT_URL", "wss://ai-tutor-prototype-ny9l58vd.livekit.cloud"),
        )
    )