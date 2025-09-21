# 3-Week Sprint Plan: Virtual Tutor MVP

## Sprint Overview
- **Duration**: 3 weeks (15 working days)
- **Total Story Points**: 20 SP
- **Features**: Authentication, Wizard, AI Classroom, Progress Tracking
- **Approach**: Framework-first, reusing legacy code where beneficial

---

## WEEK 1: Foundation & Authentication
**Goal**: Setup project, implement authentication, start textbook processing

### Day 1-2: Foundation Setup (Phase 0)
#### Day 1 Morning
□ 0.1: Next.js scaffolding (1 SP)
  □ 0.1.1: Initialize Next.js 15 with TypeScript
  □ 0.1.2: Configure ESLint and Prettier
  □ 0.1.3: Setup folder structure
  □ 0.1.4: Install core dependencies
  □ 0.1.5: Configure TypeScript paths

#### Day 1 Afternoon  
□ 0.2: Supabase setup (1 SP)
  □ 0.2.1: Create Supabase project
  □ 0.2.2: Copy client from legacy
  □ 0.2.3: Configure environment
  □ 0.2.4: Setup database schema
  □ 0.2.5: Test connection

#### Day 2 Morning
□ 0.3: Base UI components (1 SP)
  □ 0.3.1: Setup shadcn/ui
  □ 0.3.2-4: Copy Button, Card, Input from legacy
  □ 0.3.5-8: Add Dialog, Toast, Select, Progress
  □ 0.3.9-10: Create index and test

#### Day 2 Afternoon
□ 0.4: Project configuration (1 SP)
  □ 0.4.1-2: Setup middleware and root layout
  □ 0.4.3-5: Configure CSS, errors, loading
  □ 0.4.6-10: Metadata, CORS, logging, constants

**Day 1-2 Deliverables**:
- Working Next.js dev environment
- Supabase connected
- UI component library ready
- All configuration complete

### Day 3-4: Authentication System (Phase 1)
#### Day 3 Morning
□ 1.1: Auth pages setup (1 SP)
  □ Create login, register, forgot password pages
  □ Setup auth route group
  □ Add loading and error states
  □ Style with Tailwind

#### Day 3 Afternoon
□ 1.2: Auth components (1 SP)
  □ Adapt LoginForm from legacy
  □ Adapt RegisterForm from legacy
  □ Create PasswordResetForm
  □ Add validation and feedback

#### Day 4 Morning
□ 1.3: Auth API routes (1 SP)
  □ Create all auth endpoints
  □ Add rate limiting
  □ Implement error handling
  □ Test with Supabase

#### Day 4 Afternoon
□ 1.4: Session management (1 SP)
  □ Setup auth middleware
  □ Implement token refresh
  □ Create useAuth hook
  □ Test protected routes

**Day 3-4 Deliverables**:
- Complete authentication flow
- User registration and login working
- Sessions persisting properly
- Protected routes functional

### Day 5: Textbook Processing Start
□ 2.4: PDF processing setup (1 SP)
  □ Install PDF.js
  □ Setup parser module
  □ Create processing queue
  □ Test with sample PDFs

□ 2.5: Content extraction (1 SP)
  □ Extract text from PDFs
  □ Identify chapters
  □ Parse metadata
  □ Validate extraction

**Week 1 Review**:
- [ ] Foundation complete
- [ ] Authentication working
- [ ] PDF processing started
- [ ] 10 SP completed

---

## WEEK 2: Wizard & AI Classroom
**Goal**: Build class selection wizard and voice classroom

### Day 6-7: Class Selection Wizard
#### Day 6 Morning
□ 2.1: Wizard container (1 SP)
  □ Create wizard pages
  □ Setup step navigation
  □ Implement state management
  □ Add progress indicator

#### Day 6 Afternoon
□ 2.2: Grade & subject selection (1 SP)
  □ Create selector components
  □ Load dynamic data
  □ Add validation
  □ Test selection flow

#### Day 7 Morning
□ 2.3: Topic selection & completion (1 SP)
  □ Create topic selector
  □ Build summary screen
  □ Save to database
  □ Navigate to classroom

#### Day 7 Afternoon
□ 2.6: Content chunking (1 SP)
  □ Implement chunking algorithm
  □ Store in database
  □ Build search index
  □ Test retrieval

**Day 6-7 Deliverables**:
- Complete wizard flow
- Textbook content indexed
- User can select class path
- Ready for classroom

### Day 8-10: AI Classroom Implementation
#### Day 8 Morning
□ 3.1: LiveKit setup (1 SP)
  □ Install LiveKit SDKs
  □ Setup server connection
  □ Implement token generation
  □ Test room creation

#### Day 8 Afternoon
□ 3.2: Voice controls UI (1 SP)
  □ Create control components
  □ Add mute/unmute
  □ Show connection status
  □ Add session timer

#### Day 9 Morning
□ 3.3: Speech processing (1 SP)
  □ Setup speech-to-text
  □ Configure text-to-speech
  □ Handle transcriptions
  □ Test voice flow

#### Day 9 Afternoon
□ 3.4: AI integration (1 SP)
  □ Setup Gemini client
  □ Create prompts
  □ Inject textbook context
  □ Stream responses

#### Day 10 Morning
□ 3.5: Session management (1 SP)
  □ Start/end sessions
  □ Save transcripts
  □ Handle timeouts
  □ Test full flow

#### Day 10 Afternoon
□ Integration testing
  □ Test wizard → classroom flow
  □ Verify voice interactions
  □ Check AI responses
  □ Fix any issues

**Week 2 Review**:
- [ ] Wizard complete
- [ ] Classroom functional
- [ ] Voice sessions working
- [ ] AI responding with context
- [ ] 9 SP completed (19 total)

---

## WEEK 3: Progress Tracking & Polish
**Goal**: Add progress dashboard, testing, and final polish

### Day 11-12: Progress Tracking
#### Day 11 Morning
□ 3.6: Progress dashboard (1 SP)
  □ Create dashboard page
  □ Design stats cards
  □ Show session history
  □ Add streak counter

#### Day 11 Afternoon
□ 3.7: Progress analytics (1 SP)
  □ Aggregate data
  □ Calculate metrics
  □ Create charts
  □ Generate insights

#### Day 12 Morning
□ 3.8: Progress API & export (1 SP)
  □ Create API endpoints
  □ Implement filtering
  □ Add PDF export
  □ Test all endpoints

#### Day 12 Afternoon
□ Complete integration
  □ Connect all features
  □ Test full user journey
  □ Fix integration issues
  □ Verify data flow

**Day 11-12 Deliverables**:
- Progress dashboard live
- Analytics working
- Export functional
- All features integrated

### Day 13: Testing & Bug Fixes
□ Morning: E2E Testing
  □ Test auth flow
  □ Test wizard flow
  □ Test classroom session
  □ Test progress tracking

□ Afternoon: Bug Fixes
  □ Fix critical bugs
  □ Improve error handling
  □ Optimize performance
  □ Clean up UI issues

### Day 14: Polish & Documentation
□ Morning: UI Polish
  □ Improve animations
  □ Fix responsive issues
  □ Enhance accessibility
  □ Final styling touches

□ Afternoon: Documentation
  □ Update README
  □ Document API endpoints
  □ Create user guide
  □ Prepare deployment docs

### Day 15: Final Testing & Deployment Prep
□ Morning: Final Testing
  □ Full regression test
  □ Performance testing
  □ Security review
  □ Accessibility check

□ Afternoon: Deployment
  □ Build production bundle
  □ Configure deployment
  □ Setup monitoring
  □ Launch readiness check

**Week 3 Review**:
- [ ] Progress tracking complete
- [ ] All features integrated
- [ ] Testing complete
- [ ] Ready for deployment
- [ ] 20 SP completed

---

## Daily Standup Template
```
Yesterday: [What was completed]
Today: [What will be worked on]
Blockers: [Any impediments]
Progress: [X/20 SP completed]
```

## Risk Mitigation
- **LiveKit issues**: Have text chat fallback ready
- **PDF processing slow**: Process in background, show progress
- **AI response delays**: Implement streaming, add loading states
- **Auth problems**: Use Supabase's built-in recovery flows

## Success Metrics
- All 4 features functional
- E2E tests passing
- No critical bugs
- Performance targets met
- User can complete full flow

## Contingency Plan
If running behind:
1. Simplify progress charts (use basic stats only)
2. Defer PDF processing optimizations
3. Use basic AI prompts (enhance later)
4. Focus on core happy path