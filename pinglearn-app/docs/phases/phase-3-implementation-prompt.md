# Phase 3: Audio AI Classroom - Implementation Prompt

## 🎯 Mission Statement
Build a revolutionary audio-to-audio AI tutoring classroom using Gemini Live API 2.5 Flash and LiveKit infrastructure, enabling natural voice conversations between students and an AI tutor with full NCERT Class X Mathematics context.

## 📋 Current Status (Post Phase 2.5)

### ✅ What's Already Complete
1. **Content Foundation Ready**
   - 1 NCERT Class X Mathematics textbook fully processed
   - 14 chapters properly structured in database
   - 147 content chunks ready for AI context
   - 92 topics available for curriculum alignment

2. **User Flow Established**
   - Authentication system operational
   - Wizard flow working with Grade 10 Mathematics only
   - Dashboard showing accurate content counts
   - Student profiles storing preferences

3. **Infrastructure Available**
   - Supabase database with proper schema
   - Next.js 15 with Turbopack configured
   - TypeScript with strict typing
   - Credentials ready in `.creds/`

### 🔑 Available Credentials
```env
# Gemini API (Ready)
GOOGLE_API_KEY=AIzaSyBcUGgObt--HCjBlXygu8iYMuI6PnPbeIY

# LiveKit Infrastructure (Ready)
LIVEKIT_URL=wss://ai-tutor-prototype-ny9l58vd.livekit.cloud
LIVEKIT_API_KEY=APIz7rWgBkZqPDq
LIVEKIT_API_SECRET=kHLVuf6fCfcTdB8ClOT223Fn4npSckCXYyJkse8Op7VA

# Supabase (Already Configured)
NEXT_PUBLIC_SUPABASE_URL=[configured in .env.local]
SUPABASE_SERVICE_ROLE_KEY=[configured in .env.local]
```

## 🚀 Phase 3 Implementation Plan

### Day 1: LiveKit + Gemini Live Infrastructure

#### Morning: LiveKit Agent Setup
1. **Create LiveKit Agent Service**
   ```bash
   # Create Python agent service
   mkdir vt-app/livekit-agent
   cd vt-app/livekit-agent
   
   # Install dependencies
   pip install livekit-agents livekit-plugins-gemini
   ```

2. **Implement Base Agent Structure**
   ```python
   # agent.py
   from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
   from livekit.plugins import gemini
   
   async def entrypoint(ctx: JobContext):
       # Load student context from Supabase
       # Initialize Gemini Live with NCERT content
       # Start audio conversation
   ```

3. **Configure Gemini Live Integration**
   - Model: `gemini-2.0-flash-exp` (with audio capabilities)
   - Voice: Educational/friendly tone
   - Context: NCERT Class X Mathematics chunks

#### Afternoon: Room Management & Audio Flow
1. **Implement Room Creation Logic**
   - One-on-one tutoring rooms only
   - Automatic agent connection
   - Session metadata storage

2. **Setup Audio Streaming Pipeline**
   - Student voice → LiveKit → Agent
   - Agent → Gemini Live → Response
   - Response → LiveKit → Student

3. **Test End-to-End Audio Flow**
   - Verify < 1 second response latency
   - Test interruption handling
   - Validate audio quality

### Day 2: AI Tutor Context & Intelligence

#### Morning: Content Context System
1. **Build Content Retrieval System**
   ```typescript
   // lib/ai/context-manager.ts
   export async function getRelevantContext(
     topic: string,
     chapterId?: string
   ): Promise<ContentChunk[]> {
     // Fetch relevant chunks from database
     // Rank by relevance
     // Return top chunks for AI context
   }
   ```

2. **Implement Dynamic Context Injection**
   - Load student's current chapter/topic
   - Inject relevant content chunks
   - Maintain conversation context

3. **Setup Personalization Layer**
   - Student grade/subject preferences
   - Learning pace adaptation
   - Previous session memory

#### Afternoon: Educational Conversation Design
1. **Design AI Tutor Personality**
   ```python
   TUTOR_SYSTEM_PROMPT = """
   You are a friendly NCERT mathematics tutor for Class 10 students.
   - Use simple, clear explanations
   - Reference specific NCERT examples
   - Encourage and motivate students
   - Ask clarifying questions
   - Check understanding frequently
   """
   ```

2. **Implement Learning Patterns**
   - Concept introduction flow
   - Problem-solving guidance
   - Mistake correction approach
   - Progress reinforcement

3. **Add Safety & Boundaries**
   - Educational content only
   - Age-appropriate responses
   - No off-topic discussions

### Day 3: Frontend Classroom Interface

#### Morning: Classroom Page Development
1. **Create Classroom Component**
   ```typescript
   // app/classroom/page.tsx
   import { LiveKitRoom } from '@livekit/components-react'
   
   export default function ClassroomPage() {
     // Room connection logic
     // Audio controls
     // Session management
   }
   ```

2. **Implement Voice Controls**
   - Mute/unmute toggle
   - Volume controls
   - Device selection
   - Push-to-talk option

3. **Add Visual Indicators**
   - Speaking indicator (who's talking)
   - Audio level visualization
   - Connection quality display
   - AI thinking/processing state

#### Afternoon: Session Management UI
1. **Build Session Creation Flow**
   - "Start Learning" button
   - Topic selection (optional)
   - Loading states
   - Error handling

2. **Implement In-Session Features**
   - Session timer
   - Current topic display
   - Quick action buttons
   - End session control

3. **Add Context Display**
   - Current chapter/topic
   - Related concepts
   - Progress indicators
   - Learning objectives

### Day 4: Integration & Testing

#### Morning: Backend Integration
1. **Create Database Schema**
   ```sql
   -- Sessions table
   CREATE TABLE learning_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     student_id UUID REFERENCES profiles(id),
     room_name TEXT UNIQUE,
     started_at TIMESTAMPTZ DEFAULT NOW(),
     ended_at TIMESTAMPTZ,
     duration_minutes INTEGER,
     topics_discussed TEXT[],
     chapter_focus TEXT,
     session_summary TEXT,
     quality_score INTEGER
   );
   
   -- Session events
   CREATE TABLE session_events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id UUID REFERENCES learning_sessions(id),
     event_type TEXT, -- 'question', 'answer', 'concept_explained'
     timestamp TIMESTAMPTZ DEFAULT NOW(),
     content TEXT,
     metadata JSONB
   );
   ```

2. **Implement Progress Tracking**
   - Update topic mastery scores
   - Track concept understanding
   - Store session insights
   - Calculate engagement metrics

3. **Setup Analytics Pipeline**
   - Session quality metrics
   - Learning effectiveness scores
   - Topic coverage analysis
   - Recommendation generation

#### Afternoon: Testing & Optimization
1. **End-to-End Testing Checklist**
   - [ ] Student can start audio session
   - [ ] AI tutor greets appropriately
   - [ ] Natural conversation flow works
   - [ ] Student can interrupt AI
   - [ ] Context is relevant to NCERT content
   - [ ] Session data saves correctly
   - [ ] Progress updates in dashboard
   - [ ] Audio quality is clear
   - [ ] Latency is acceptable (<1s)
   - [ ] Error recovery works

2. **Performance Optimization**
   - Audio stream optimization
   - Context caching strategy
   - Connection pooling
   - Error boundary implementation

3. **User Experience Polish**
   - Loading states refinement
   - Error message clarity
   - UI responsiveness
   - Accessibility features

## 📊 Success Metrics

### Technical Success
- ✅ Audio latency < 300ms (P95)
- ✅ AI response time < 1 second (P90)
- ✅ Zero audio dropouts in 95% of sessions
- ✅ Session data accuracy 100%
- ✅ Graceful error recovery

### User Experience Success
- ✅ Student completes 10-minute conversation
- ✅ AI references NCERT content accurately
- ✅ Natural conversation flow maintained
- ✅ Student learning progress tracked
- ✅ Dashboard reflects session outcomes

### Educational Success
- ✅ AI explains concepts clearly
- ✅ Student questions answered accurately
- ✅ Learning objectives achieved
- ✅ Progress measurably improved
- ✅ Student engagement maintained

## 🛠️ Technical Stack

### Backend Stack
```python
# Python LiveKit Agent
livekit-agents==0.11.0
livekit-plugins-gemini==0.3.0
python-dotenv==1.0.0
supabase==2.0.0

# Agent deployment
uvicorn (for local testing)
docker (for production)
```

### Frontend Stack
```json
// Package.json additions
{
  "@livekit/components-react": "^2.0.0",
  "livekit-client": "^2.0.0",
  "@livekit/react-native": "^1.0.0" // If mobile support needed
}
```

### Database Schema Changes
```sql
-- Add to existing schema
ALTER TABLE profiles ADD COLUMN 
  total_session_minutes INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  preferred_voice_settings JSONB;

-- Indexes for performance
CREATE INDEX idx_sessions_student_id ON learning_sessions(student_id);
CREATE INDEX idx_sessions_started_at ON learning_sessions(started_at DESC);
```

## 🚨 Critical Implementation Notes

### 1. Gemini Live API Specifics
- **Model**: Use `gemini-2.0-flash-exp` for audio support
- **Context Window**: 1M tokens (plenty for NCERT content)
- **Voice Selection**: Test multiple voices for education suitability
- **Interruption Handling**: Enable VAD for natural conversation

### 2. LiveKit Best Practices
- **Room Names**: Use UUID for uniqueness
- **Participant Identity**: Use student ID
- **Audio Quality**: Configure opus codec at 48kHz
- **Connection Handling**: Implement exponential backoff

### 3. Content Context Strategy
- **Chunk Size**: Keep under 1000 tokens per chunk
- **Relevance Scoring**: Use embeddings for similarity
- **Context Limit**: Maximum 10 chunks per conversation
- **Update Frequency**: Refresh context on topic change

### 4. Session Management
- **Duration Limit**: 30 minutes per session (configurable)
- **Idle Timeout**: 5 minutes of silence ends session
- **Recording**: Optional, with parental consent
- **Summaries**: Auto-generate after each session

## 🔄 Development Workflow

### Setup Commands
```bash
# Install dependencies
cd vt-app
pnpm install @livekit/components-react livekit-client

# Setup Python agent
cd livekit-agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment setup
cp .env.example .env
# Add LiveKit and Gemini credentials
```

### Testing Commands
```bash
# Test agent locally
python agent.py dev

# Test frontend
pnpm dev

# Run integration tests
pnpm test:e2e:classroom
```

### Deployment Preview
```bash
# Build agent Docker image
docker build -t vt-livekit-agent .

# Deploy to staging
vercel --env preview
```

## 📈 Phase 3 Completion Criteria

### Must Have (Day 4 EOD)
- [ ] Audio conversation works end-to-end
- [ ] AI tutor uses NCERT content in responses
- [ ] Sessions save to database
- [ ] Basic classroom UI functional
- [ ] Progress tracking updates

### Should Have
- [ ] Voice quality optimization
- [ ] Session summaries
- [ ] Topic recommendations
- [ ] Engagement analytics

### Nice to Have
- [ ] Multiple voice options
- [ ] Session recording
- [ ] Detailed transcripts
- [ ] Parent dashboard view

## 🎯 Final Deliverable

**Definition of Done**: A student can click "Start Learning", have a natural voice conversation with an AI tutor about NCERT Class X Mathematics topics, with the AI providing contextual explanations from the processed textbook content, and see their progress update in the dashboard after the session ends.

## 🚀 Kickoff Checklist

Before starting Phase 3:
- [x] Phase 2.5 complete with processed content
- [x] All credentials available and verified
- [x] LiveKit Cloud account active
- [x] Gemini API key working
- [x] Database schema planned
- [x] Team aligned on 4-day timeline

---

**Start Date**: [Ready to begin]  
**Target Completion**: Start + 4 days  
**Innovation Level**: 🔥 Cutting-edge (Audio-to-Audio AI)  
**Risk Level**: Medium (New technology, proven components)

---

## 🎬 Let's Build the Future of Education!

This implementation will create one of the world's first audio-to-audio AI tutoring systems with full curriculum integration. The combination of Gemini Live's natural conversation capabilities with NCERT content creates a revolutionary learning experience.

**Ready to start?** Begin with Day 1: LiveKit Agent Setup