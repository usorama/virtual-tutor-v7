"""
Gemini Live Configuration for Audio-to-Audio AI Tutoring
Handles the audio model configuration and content context management
"""

import os
import logging
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

@dataclass
class GeminiConfig:
    """Configuration for Gemini Live audio model"""
    model_name: str = "models/gemini-2.0-flash-exp"
    api_key: str = ""
    temperature: float = 0.7
    max_output_tokens: int = 2048
    audio_config: Dict[str, Any] = None
    
    def __post_init__(self):
        """Initialize audio configuration"""
        if self.audio_config is None:
            self.audio_config = {
                "voice": "educational",  # Voice style preference
                "speech_rate": 1.0,      # Normal speed
                "pitch": 0,               # Normal pitch
                "volume_gain_db": 0,      # Normal volume
                "response_mode": "conversational",  # Natural conversation
                "enable_interruptions": True,       # Allow student interruptions
                "vad_sensitivity": 0.5,            # Voice Activity Detection sensitivity
            }

class ContentContextManager:
    """Manages NCERT content context for the AI tutor"""
    
    def __init__(self):
        self.content_cache: Dict[str, List[Dict]] = {}
        self.current_context: List[Dict] = []
        self.max_context_chunks = 10
        
    def load_chapter_context(self, chapter_id: str, chunks: List[Dict]) -> str:
        """
        Load and format chapter content for AI context
        
        Args:
            chapter_id: The chapter identifier
            chunks: List of content chunks from database
            
        Returns:
            Formatted context string for the AI
        """
        # Cache the chunks
        self.content_cache[chapter_id] = chunks
        self.current_context = chunks[:self.max_context_chunks]
        
        # Format context for AI
        context_parts = []
        for chunk in self.current_context:
            context_parts.append(f"""
            Section: {chunk.get('title', 'Content')}
            Content: {chunk.get('content', '')}
            Topics: {', '.join(chunk.get('topics', []))}
            """)
        
        return "\n---\n".join(context_parts)
    
    def get_relevant_chunks(self, query: str, chapter_id: Optional[str] = None) -> List[Dict]:
        """
        Get relevant content chunks based on student query
        
        Args:
            query: Student's question or topic
            chapter_id: Optional specific chapter to search within
            
        Returns:
            List of relevant content chunks
        """
        search_pool = []
        
        if chapter_id and chapter_id in self.content_cache:
            search_pool = self.content_cache[chapter_id]
        else:
            # Search across all cached content
            for chunks in self.content_cache.values():
                search_pool.extend(chunks)
        
        # Simple keyword matching (can be enhanced with embeddings later)
        relevant = []
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        for chunk in search_pool:
            content_lower = chunk.get('content', '').lower()
            title_lower = chunk.get('title', '').lower()
            topics = [t.lower() for t in chunk.get('topics', [])]
            
            # Calculate relevance score
            score = 0
            for word in query_words:
                if word in content_lower:
                    score += 1
                if word in title_lower:
                    score += 2
                if any(word in topic for topic in topics):
                    score += 3
            
            if score > 0:
                relevant.append((score, chunk))
        
        # Sort by relevance and return top chunks
        relevant.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in relevant[:self.max_context_chunks]]
    
    def format_example_problems(self, chapter_id: str) -> str:
        """
        Format example problems from the chapter for AI reference
        
        Args:
            chapter_id: The chapter identifier
            
        Returns:
            Formatted examples string
        """
        if chapter_id not in self.content_cache:
            return ""
        
        examples = []
        for chunk in self.content_cache[chapter_id]:
            # Look for example patterns in content
            content = chunk.get('content', '')
            if any(keyword in content.lower() for keyword in ['example', 'solution', 'solve', 'problem']):
                examples.append(content[:500])  # Limit length
        
        if examples:
            return "Here are some relevant examples:\n\n" + "\n\n".join(examples[:3])
        return ""

class AudioResponseManager:
    """Manages audio response characteristics and flow"""
    
    def __init__(self):
        self.response_patterns = {
            "greeting": {
                "phrases": [
                    "Hello! I'm your NCERT Mathematics tutor. What would you like to learn today?",
                    "Hi there! Ready to explore mathematics together?",
                    "Welcome! I'm here to help you master Class 10 Mathematics."
                ],
                "tone": "friendly",
                "energy": "high"
            },
            "encouragement": {
                "phrases": [
                    "Great question! Let me explain...",
                    "You're thinking in the right direction!",
                    "Excellent! You're getting the hang of this.",
                    "That's a very good observation!"
                ],
                "tone": "supportive",
                "energy": "medium"
            },
            "clarification": {
                "phrases": [
                    "Let me break this down step by step...",
                    "Think of it this way...",
                    "Here's another way to understand this...",
                    "Let's approach this differently..."
                ],
                "tone": "patient",
                "energy": "calm"
            },
            "check_understanding": {
                "phrases": [
                    "Does that make sense so far?",
                    "Would you like me to explain this differently?",
                    "Can you try solving a similar problem?",
                    "What do you think happens next?"
                ],
                "tone": "engaging",
                "energy": "medium"
            }
        }
    
    def get_response_style(self, context: str) -> Dict[str, Any]:
        """
        Determine appropriate response style based on context
        
        Args:
            context: The conversation context or student input
            
        Returns:
            Response style configuration
        """
        # Analyze context to determine appropriate style
        context_lower = context.lower()
        
        if any(word in context_lower for word in ['hello', 'hi', 'start', 'begin']):
            return self.response_patterns["greeting"]
        elif any(word in context_lower for word in ['confused', "don't understand", 'difficult', 'hard']):
            return self.response_patterns["clarification"]
        elif any(word in context_lower for word in ['correct', 'right', 'yes', 'got it']):
            return self.response_patterns["encouragement"]
        else:
            return self.response_patterns["check_understanding"]
    
    def format_audio_response(self, text: str, style: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format response with audio characteristics
        
        Args:
            text: The response text
            style: Response style configuration
            
        Returns:
            Formatted audio response configuration
        """
        return {
            "text": text,
            "tone": style.get("tone", "neutral"),
            "energy": style.get("energy", "medium"),
            "pause_points": self._identify_pause_points(text),
            "emphasis_words": self._identify_emphasis_words(text)
        }
    
    def _identify_pause_points(self, text: str) -> List[int]:
        """Identify where to add natural pauses in speech"""
        pause_points = []
        # Add pauses after punctuation
        for i, char in enumerate(text):
            if char in ['.', '?', '!', ':']:
                pause_points.append(i)
        return pause_points
    
    def _identify_emphasis_words(self, text: str) -> List[str]:
        """Identify words that should be emphasized"""
        # Math terms and important concepts
        emphasis_keywords = [
            'important', 'remember', 'key', 'formula', 'theorem',
            'equation', 'solution', 'answer', 'result', 'proof'
        ]
        
        words = text.lower().split()
        emphasis = []
        for word in words:
            if any(keyword in word for keyword in emphasis_keywords):
                emphasis.append(word)
        
        return emphasis

# Create global instances
gemini_config = GeminiConfig(api_key=os.getenv("GOOGLE_API_KEY", "AIzaSyBcUGgObt--HCjBlXygu8iYMuI6PnPbeIY"))
content_manager = ContentContextManager()
audio_manager = AudioResponseManager()

def get_enhanced_system_prompt(student_grade: int, current_chapter: Optional[str] = None) -> str:
    """
    Generate an enhanced system prompt with context
    
    Args:
        student_grade: Student's grade level
        current_chapter: Current chapter being studied
        
    Returns:
        Enhanced system prompt for the AI tutor
    """
    base_prompt = f"""
    You are an expert NCERT Mathematics tutor for a Grade {student_grade} student.
    
    Teaching Guidelines:
    1. Use the Socratic method - ask guiding questions to help students discover answers
    2. Break complex problems into smaller, manageable steps
    3. Reference specific NCERT textbook examples when explaining concepts
    4. Use Indian context and examples (rupees, cricket, local references)
    5. Encourage students when they make progress, no matter how small
    6. Be patient with mistakes and use them as learning opportunities
    7. Check understanding frequently with simple questions
    8. Adapt your pace based on student responses
    
    Voice Interaction Guidelines:
    - Speak naturally and conversationally
    - Use appropriate pauses for emphasis and comprehension
    - Keep responses concise (under 30 seconds when possible)
    - Allow students to interrupt if they have questions
    - Use encouraging tone and positive reinforcement
    """
    
    if current_chapter:
        base_prompt += f"\n\nCurrent Focus: {current_chapter}"
        base_prompt += f"\n{content_manager.format_example_problems(current_chapter)}"
    
    return base_prompt

def log_interaction_quality(session_id: str, interaction: Dict[str, Any]):
    """
    Log interaction quality metrics for analysis
    
    Args:
        session_id: The learning session ID
        interaction: Interaction data including timing, content, etc.
    """
    try:
        metrics = {
            "session_id": session_id,
            "response_time": interaction.get("response_time", 0),
            "interaction_length": interaction.get("length", 0),
            "interruptions": interaction.get("interruptions", 0),
            "clarity_score": interaction.get("clarity", 0),
            "relevance_score": interaction.get("relevance", 0)
        }
        
        logger.info(f"Interaction metrics: {json.dumps(metrics)}")
        
        # TODO: Store in database for analysis
    except Exception as e:
        logger.error(f"Error logging interaction quality: {e}")