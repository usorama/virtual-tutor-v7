# Step 2: Priority 0 PRD Creation

## Prerequisite
- Step 1 (Setup) must be complete
- Tech stack must be validated

## Objective
Create a comprehensive Product Requirements Document for Priority 0 features only.

## Task
Create `/vt-app/docs/prd/priority-0-prd.md` with the following sections:

### 1. Executive Summary
- Product vision
- MVP scope (Priority 0 only)
- Success metrics

### 2. User Personas
Define primary users:
- Student (age range, technical skill level)
- System administrator
- Content manager (for textbooks)

### 3. Feature Specifications

#### 3.1 Class Selection Wizard
**User Story**: As a student, I want to select my grade, subject, and topic so the AI teacher can personalize my learning.

**Acceptance Criteria**:
- Student can select grade (1-12)
- Student can select subject based on grade
- Student can select specific topic/chapter
- Selections are validated before proceeding
- Student can go back and change selections
- Final selections are saved to start session

**Technical Requirements**:
- Multi-step form with progress indicator
- Client-side validation
- Server-side validation
- Session state management
- Database persistence

**UI Requirements**:
- Mobile-responsive design
- Clear navigation (back/next)
- Visual progress indicator
- Loading states
- Error states

#### 3.2 AI Classroom (LiveKit Integration)
**User Story**: As a student, I want to have voice conversations with an AI teacher who can explain concepts from my textbook.

**Acceptance Criteria**:
- Student can start voice session
- AI teacher introduces itself
- Student can ask questions verbally
- AI responds with relevant textbook content
- Student can interrupt AI
- Session can be paused/resumed
- Session automatically saves progress

**Technical Requirements**:
- LiveKit WebRTC integration
- Speech-to-text processing
- Text-to-speech generation
- AI model integration (specify which)
- Context management from textbooks
- Real-time audio streaming
- Error recovery mechanisms

**UI Requirements**:
- Speaking indicator for both parties
- Mute/unmute controls
- End session button
- Connection status indicator
- Fallback UI for connection issues

#### 3.3 Textbook Processing System
**User Story**: As a system admin, I want to process PDF textbooks so they can be used by the AI teacher.

**Acceptance Criteria**:
- System reads PDFs from `/text-books/` directory
- PDFs are parsed and indexed
- Content is chunked appropriately
- Metadata is extracted (subject, grade, chapters)
- Content is searchable by AI
- Processing errors are logged

**Technical Requirements**:
- PDF parsing library
- Text extraction
- Content chunking strategy (define size)
- Vector embedding generation
- Database storage schema
- Indexing for fast retrieval
- Background job processing

### 4. Data Models

```typescript
// Student Session
interface StudentSession {
  id: string;
  studentId: string;
  grade: number;
  subject: string;
  topic: string;
  startedAt: Date;
  lastActiveAt: Date;
  status: 'active' | 'paused' | 'completed';
}

// Textbook
interface Textbook {
  id: string;
  fileName: string;
  grade: number;
  subject: string;
  chapters: Chapter[];
  processedAt: Date;
  status: 'processing' | 'ready' | 'failed';
}

// Voice Session
interface VoiceSession {
  id: string;
  sessionId: string;
  livekitRoomName: string;
  startedAt: Date;
  endedAt?: Date;
  transcripts: Transcript[];
}
```

### 5. API Specifications

```yaml
# Wizard APIs
POST /api/wizard/start
POST /api/wizard/grade
POST /api/wizard/subject  
POST /api/wizard/topic
POST /api/wizard/complete

# Classroom APIs
POST /api/classroom/start
POST /api/classroom/join
POST /api/classroom/leave
GET /api/classroom/status/:sessionId

# Textbook APIs
POST /api/textbooks/process
GET /api/textbooks/list
GET /api/textbooks/:id/content
POST /api/textbooks/search
```

### 6. Infrastructure Requirements
- Database: [Specify based on tech stack]
- File storage: Local filesystem for PDFs
- WebRTC: LiveKit server requirements
- AI Model: [Specify model and hosting]
- Caching: [Specify strategy]

### 7. Success Metrics
- Wizard completion rate > 90%
- Voice session establishment < 3 seconds
- AI response time < 2 seconds
- Textbook processing < 30 seconds per 100 pages
- System uptime > 99%

### 8. Constraints and Assumptions
- One-on-one mode only (1 teacher : 1 student)
- PDF textbooks only (no other formats)
- English language only for MVP
- Internet connection required
- Modern browser required (Chrome, Firefox, Safari latest 2 versions)

### 9. Out of Scope (Priority 0)
- User authentication
- Multiple students per session
- Video communication
- Homework assignments
- Progress tracking
- Parent access

### 10. Risks and Mitigations
| Risk | Impact | Mitigation |
|------|---------|------------|
| LiveKit connection failures | High | Implement reconnection logic and offline fallback |
| Large PDF processing time | Medium | Background processing with progress indicators |
| AI hallucination | High | Strict context limiting to textbook content |
| Poor audio quality | Medium | Audio quality checks before session start |

## Deliverable
- Complete PRD document created at specified location
- All sections filled with specific details
- No placeholders or TODOs
- Ready for review and approval

## Questions to Answer
Before finalizing the PRD, clarify:
1. Which AI model should power the teacher? (GPT-4, Claude, etc.)
2. Maximum PDF size to support?
3. How many concurrent voice sessions to support?
4. Should AI teacher have a personality/name?
5. Session timeout duration?

## Confirmation Required
After creating the PRD:
1. Confirm all sections are complete
2. List any assumptions made
3. Highlight any technical decisions needed

Then ask: "PRD complete. Should I proceed to Step 3: Comprehensive Planning?"