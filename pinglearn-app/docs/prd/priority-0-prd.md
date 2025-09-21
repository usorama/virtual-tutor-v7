# Priority 0 - Product Requirements Document
**Virtual Tutor v7 MVP**

## 1. Executive Summary

### Product Vision
Create a voice-enabled AI tutoring platform that provides personalized, one-on-one educational support to students through natural voice conversations, leveraging textbook content for accurate, curriculum-aligned teaching.

### MVP Scope (Priority 0)
The MVP delivers four core features in sequence:
1. **Authentication** - Secure user access
2. **Class Selection Wizard** - Personalized learning path setup
3. **AI Classroom** - Voice-based tutoring sessions
4. **Progress Tracking** - Learning analytics dashboard

**Note**: Authentication and Progress Tracking are intentionally included in Priority 0 (deviating from the v7 template) per product owner requirements to enable proper user context and session persistence from the start.

### Success Metrics
- User registration to first session: < 5 minutes
- Voice session quality rating: > 4.5/5
- Session completion rate: > 80%
- Weekly active users growth: > 20%
- System uptime: > 99.9%

## 2. User Personas

### Primary: Student (Ages 10-18)
- **Technical Skills**: Basic computer/tablet usage
- **Goals**: Understand difficult concepts, get homework help, prepare for tests
- **Pain Points**: Traditional tutoring is expensive, textbooks are hard to understand alone
- **Device Usage**: Primarily tablets and laptops, some smartphones

### Secondary: Parent/Guardian
- **Technical Skills**: Moderate
- **Goals**: Monitor child's progress, ensure safe learning environment
- **Pain Points**: Cannot always help with homework, concerned about screen time
- **Needs**: Simple progress reports, session summaries

### Tertiary: System Administrator
- **Technical Skills**: Advanced
- **Goals**: Maintain platform, upload textbooks, monitor system health
- **Responsibilities**: Textbook processing, user management, system monitoring

## 3. Feature Specifications

### 3.1 Authentication System

**User Story**: As a user, I want to securely create an account and log in so I can access personalized tutoring sessions.

**Acceptance Criteria**:
- User can register with email and password
- Email verification required before first login
- Password must meet security requirements (8+ chars, 1 uppercase, 1 number)
- User can reset forgotten password via email
- Session persists for 7 days with "Remember Me" option
- Automatic logout after 30 minutes of inactivity

**Technical Requirements**:
- Supabase Auth integration
- JWT token management
- Secure password hashing (bcrypt)
- Rate limiting on auth endpoints
- CSRF protection
- Session storage in secure cookies

**UI Requirements**:
- Clean login/register forms
- Real-time validation feedback
- Password strength indicator
- Loading states during authentication
- Clear error messages
- Social login buttons (future-ready design)

### 3.2 Class Selection Wizard

**User Story**: As a student, I want to select my grade, subject, and topic so the AI teacher can personalize my learning experience.

**Acceptance Criteria**:
- Step 1: Select grade level (1-12)
- Step 2: Select subject based on available textbooks for grade
- Step 3: Select specific chapter/topic from subject
- Step 4: Confirm selections with summary
- Can navigate back to any previous step
- Selections saved to user profile
- Can start new selection from dashboard

**Technical Requirements**:
- Multi-step form with state management
- Dynamic subject/topic loading based on available textbooks
- Client-side validation before step progression
- Server-side validation of complete selection
- Database persistence of user preferences
- Session state recovery on browser refresh

**UI Requirements**:
- Visual progress indicator (steps 1-4)
- Large, touch-friendly selection buttons
- Smooth transitions between steps
- Mobile-responsive layout
- Accessible keyboard navigation
- Clear back/next/confirm buttons

### 3.3 AI Classroom (LiveKit Voice Integration)

**User Story**: As a student, I want to have natural voice conversations with an AI teacher who explains concepts from my textbook clearly.

**Acceptance Criteria**:
- One-click session start from dashboard
- AI teacher introduces itself and topic
- Student speaks questions naturally
- AI responds with relevant textbook explanations
- Can interrupt AI mid-response
- Can ask for clarification or examples
- Can pause/resume session
- Can end session at any time
- Session transcript saved automatically

**Technical Requirements**:
- LiveKit WebRTC room creation
- Real-time speech-to-text (LiveKit or Gemini)
- Gemini 2.0 Flash for AI responses
- Text-to-speech for AI voice
- Context injection from selected textbook
- Audio echo cancellation
- Automatic gain control
- Network quality adaptation
- Fallback to text chat if voice fails

**UI Requirements**:
- Prominent "Start Session" button
- Visual speaking indicators (waveforms)
- Mute/unmute toggle
- Volume controls
- Connection quality indicator
- Session timer display
- "End Session" confirmation
- Emergency text input fallback

**Voice Interaction Flow**:
1. Student joins room → "Hello! I'm your AI tutor. Today we're learning about [topic]. What would you like to know?"
2. Student asks question → AI processes with textbook context
3. AI responds → Clear, grade-appropriate explanation
4. Continuous conversation until session ends

### 3.4 Progress Tracking Dashboard

**User Story**: As a student, I want to see my learning progress so I can understand what I've learned and what to focus on next.

**Acceptance Criteria**:
- Dashboard shows total sessions completed
- Time spent learning per subject
- Topics covered with mastery indicators
- Recent session history with summaries
- Streak counter for daily usage
- Performance trends over time
- Export progress report as PDF

**Technical Requirements**:
- Real-time analytics processing
- Session data aggregation
- Database queries optimized for dashboard
- Chart/graph rendering (Chart.js or similar)
- PDF generation for reports
- Data caching for performance

**UI Requirements**:
- Clean, motivating dashboard design
- Visual progress charts
- Color-coded performance indicators
- Mobile-responsive layout
- Quick stats cards
- Session history list
- Download report button

## 4. Data Models

```typescript
// User Account
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  profile: UserProfile;
}

interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  grade: number;
  preferredSubjects: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Learning Session
interface LearningSession {
  id: string;
  userId: string;
  grade: number;
  subject: string;
  topic: string;
  textbookId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // seconds
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

// Voice Session
interface VoiceSession {
  id: string;
  sessionId: string; // FK to LearningSession
  roomName: string; // LiveKit room
  startedAt: Date;
  endedAt?: Date;
  transcripts: Transcript[];
  audioQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface Transcript {
  id: string;
  voiceSessionId: string;
  speaker: 'student' | 'tutor';
  text: string;
  timestamp: Date;
  confidence: number;
}

// Textbook
interface Textbook {
  id: string;
  fileName: string;
  title: string;
  grade: number;
  subject: string;
  chapters: Chapter[];
  totalPages: number;
  uploadedAt: Date;
  processedAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'failed';
}

interface Chapter {
  id: string;
  textbookId: string;
  number: number;
  title: string;
  topics: string[];
  startPage: number;
  endPage: number;
  content: ChapterContent[];
}

interface ChapterContent {
  id: string;
  chapterId: string;
  contentType: 'text' | 'example' | 'exercise' | 'summary';
  content: string;
  pageNumber: number;
  embeddings?: number[]; // Vector embeddings for search
}

// Progress Tracking
interface UserProgress {
  id: string;
  userId: string;
  subject: string;
  topicsCovered: TopicProgress[];
  totalSessions: number;
  totalMinutes: number;
  lastSessionAt: Date;
  streakDays: number;
}

interface TopicProgress {
  topic: string;
  sessionsCount: number;
  totalMinutes: number;
  lastStudiedAt: Date;
  mastery: 'beginner' | 'intermediate' | 'advanced';
  questionsAsked: number;
}
```

## 5. API Specifications

```yaml
# Authentication APIs
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email/:token

# User Profile APIs
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/preferences
PUT    /api/user/preferences

# Wizard APIs
GET    /api/wizard/grades
GET    /api/wizard/subjects/:grade
GET    /api/wizard/topics/:grade/:subject
POST   /api/wizard/complete

# Session APIs  
POST   /api/session/start
GET    /api/session/:id
PUT    /api/session/:id/pause
PUT    /api/session/:id/resume
PUT    /api/session/:id/end
GET    /api/session/history

# Classroom APIs
POST   /api/classroom/token
POST   /api/classroom/join
POST   /api/classroom/leave
GET    /api/classroom/status/:sessionId
POST   /api/classroom/transcript

# Textbook APIs
POST   /api/textbooks/upload
GET    /api/textbooks
GET    /api/textbooks/:id
POST   /api/textbooks/:id/process
GET    /api/textbooks/:id/chapters
POST   /api/textbooks/search

# Progress APIs
GET    /api/progress/dashboard
GET    /api/progress/subjects
GET    /api/progress/topics/:subject
GET    /api/progress/sessions
GET    /api/progress/export
```

## 6. Infrastructure Requirements

### Database
- **PostgreSQL** via Supabase
- Row-level security for user data
- Indexes on frequently queried fields
- Backup strategy: Daily automated backups

### File Storage
- **Supabase Storage** for PDFs
- Max file size: 100MB per textbook
- Supported formats: PDF only
- Storage organization: /textbooks/{grade}/{subject}/

### Real-time Communication
- **LiveKit Cloud** or self-hosted LiveKit server
- WebRTC for voice communication
- Estimated bandwidth: 64kbps per session
- Max concurrent sessions: 100 (initial)

### AI Services
- **Google Gemini 2.0 Flash** for tutoring AI
- Context window: 1M tokens
- Response streaming enabled
- Rate limiting: 60 requests/minute

### Caching
- **Redis** for session state (via Supabase)
- Cache textbook chunks for fast retrieval
- Cache user preferences
- TTL: 24 hours for textbook content

## 7. Success Metrics

### User Engagement
- Daily Active Users (DAU): 100+ within first month
- Session frequency: 3+ sessions per week per user
- Average session duration: 15-30 minutes
- User retention (30-day): > 60%

### Technical Performance
- Page load time: < 2 seconds
- Voice session start: < 3 seconds
- AI response latency: < 2 seconds
- Speech recognition accuracy: > 95%
- System uptime: > 99.9%

### Learning Outcomes
- Questions answered per session: 5-10
- Topic completion rate: > 70%
- User satisfaction score: > 4.5/5
- Parent approval rating: > 90%

## 8. Constraints and Assumptions

### Constraints
- One-on-one tutoring only (no group sessions)
- English language only for MVP
- PDF textbooks only (no EPUB, DOCX)
- Modern browsers only (Chrome 100+, Firefox 100+, Safari 15+)
- Stable internet connection required (minimum 1 Mbps)
- No offline mode

### Assumptions
- Students have access to microphone-enabled devices
- Parents provide consent for voice recording
- Textbooks are legally obtained
- Users have basic computer literacy
- 16kHz audio sampling rate is sufficient

## 9. Out of Scope (Deferred to Priority 1)

- Social features (study groups, peer chat)
- Video communication
- Screen sharing/whiteboard
- Homework assignments
- Quiz/test creation
- Parent portal with detailed analytics
- Multi-language support
- Offline mode
- Mobile native apps
- Payment processing
- School/institutional accounts

## 10. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LiveKit connection failures | High | Medium | Implement automatic reconnection, fallback to text chat |
| AI hallucinations | High | Low | Strict context limiting, confidence thresholds |
| Large PDF processing delays | Medium | Medium | Background processing, progress indicators, chunking |
| Poor audio quality | Medium | Medium | Pre-session audio test, quality indicators |
| User data breach | Critical | Low | Encryption, RLS, regular security audits |
| Scalability issues | High | Medium | Auto-scaling infrastructure, load testing |
| Content copyright concerns | High | Low | Terms of service, admin approval process |

## 11. Technical Decisions

### Resolved Decisions
- **AI Model**: Google Gemini 2.0 Flash (best price/performance for education)
- **Voice Platform**: LiveKit (proven WebRTC solution)
- **Database**: Supabase (includes auth, storage, real-time)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components

### Pending Decisions
1. **Text-to-Speech Voice**: Google TTS vs ElevenLabs vs LiveKit TTS
2. **PDF Processing**: Client-side (PDF.js) vs Server-side processing
3. **Session Recording**: Store audio files vs transcript only
4. **Analytics Platform**: Build custom vs integrate existing

## 12. Development Phases

### Phase 1: Foundation (Week 1)
- Project setup and configuration
- Database schema implementation
- Authentication system
- Basic UI components

### Phase 2: Core Features (Week 2)
- Class selection wizard
- Textbook processing system
- LiveKit integration
- AI context management

### Phase 3: Polish & Testing (Week 3)
- Progress tracking dashboard
- Error handling
- Performance optimization
- User testing

## 13. Compliance and Security

### Data Privacy
- COPPA compliance for users under 13 (deferred to Priority 1)
- FERPA compliance for educational records (deferred to Priority 1)
- GDPR-ready architecture
- Clear privacy policy and terms of service

### Security Measures
- HTTPS everywhere
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting on all endpoints
- Regular security audits

## 14. Questions Answered

1. **AI Model**: Gemini 2.0 Flash for optimal education-focused responses
2. **Max PDF Size**: 100MB to balance storage and processing
3. **Concurrent Sessions**: 100 initially, auto-scale as needed
4. **AI Personality**: Friendly, encouraging teacher named "Tutor"
5. **Session Timeout**: 30 minutes of inactivity

---

**Document Status**: Complete and Ready for Review
**Last Updated**: January 19, 2025
**Author**: Virtual Tutor Technical Team