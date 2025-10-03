# E2E Verification Checklist
**Purpose**: Ensure complete, production-ready implementations with zero incomplete fixes
**Version**: 1.0
**Last Updated**: 2025-10-03
**Status**: MANDATORY FOR ALL CODE CHANGES

---

## 🎯 Philosophy: Never Ship Incomplete Fixes Again

This checklist was created after PC-015 revealed a critical gap in our verification process:
- ✅ We implemented metadata passing
- ✅ We verified database → frontend flow
- ✅ We verified frontend → API flow
- ❌ We **MISSED** the critical parsing logic that actually used the metadata

**Result**: AI greeted students with wrong grade/subject despite "working" metadata flow.

**Solution**: This comprehensive checklist that validates EVERY integration point in the complete user journey.

---

## 📋 Table of Contents

1. [Pre-Implementation Phase](#pre-implementation-phase)
2. [Implementation Phase](#implementation-phase)
3. [Post-Implementation Phase](#post-implementation-phase)
4. [Complete User Journey Tests](#complete-user-journey-tests)
5. [Data Flow Verification](#data-flow-verification)
6. [Integration Point Testing](#integration-point-testing)
7. [Visual Regression Testing](#visual-regression-testing)
8. [Performance Testing](#performance-testing)
9. [Automated Test Suite](#automated-test-suite)
10. [Manual UAT Checklist](#manual-uat-checklist)
11. [Sign-Off Criteria](#sign-off-criteria)

---

## 🔍 Pre-Implementation Phase

**COMPLETE BEFORE WRITING ANY CODE**

### 1.1 Requirements Analysis
- [ ] Read and understand the complete user story
- [ ] Identify ALL affected components in the user journey
- [ ] Map out the complete data flow (database → UI → API → backend → AI)
- [ ] Identify ALL integration points that will be touched
- [ ] Document expected behavior at each step

### 1.2 Codebase Research
- [ ] Search for existing similar implementations
- [ ] Identify ALL files that will need changes
- [ ] Check for duplicate functionality
- [ ] Review related test files
- [ ] Check protected-core contracts (NEVER modify these)

### 1.3 Impact Analysis
- [ ] List all components that consume the changed data
- [ ] Identify all parsers/transformers in the data pipeline
- [ ] Document all API contracts that might change
- [ ] List all database tables/columns affected
- [ ] Identify all third-party integrations affected

### 1.4 Test Strategy Planning
- [ ] Define unit tests needed
- [ ] Define integration tests needed
- [ ] Define E2E tests needed
- [ ] Identify manual testing scenarios
- [ ] Plan performance benchmarks

**✅ CHECKPOINT**: Get approval on test strategy before implementation

---

## 💻 Implementation Phase

**CONTINUOUS VERIFICATION DURING CODING**

### 2.1 TypeScript Quality Gates
```bash
# Run after EVERY file change
pnpm run typecheck  # MUST show: 0 errors
```

**Enforcement Rules**:
- [ ] Never commit with TypeScript errors
- [ ] Never use `any` type (use `unknown` + type guards)
- [ ] Reuse existing types from shared packages
- [ ] Update type definitions when adding new fields

### 2.2 Code Quality Gates
```bash
# Run before committing
pnpm run lint       # MUST pass
pnpm run test:unit  # MUST pass
```

- [ ] No linting errors
- [ ] All existing tests still passing
- [ ] New tests written for new code
- [ ] Code follows established patterns

### 2.3 Integration Point Verification

For EACH integration point you modify:

#### Frontend Component → API Call
- [ ] Verify data structure sent matches API contract
- [ ] Add console.log to verify data before sending
- [ ] Verify error handling for failed requests
- [ ] Test with real data (not mocks)

#### API Route → Database
- [ ] Verify SQL queries return expected structure
- [ ] Add console.log to verify query results
- [ ] Test with actual database data
- [ ] Verify error handling

#### Database → Frontend
- [ ] Verify data transformation logic
- [ ] Add console.log to verify data after loading
- [ ] Test null/undefined cases
- [ ] Verify type guards work correctly

#### Frontend → Python Agent (via LiveKit)
- [ ] Verify metadata format matches Python expectations
- [ ] Add logging in Python agent to verify receipt
- [ ] Test with real LiveKit connection
- [ ] Verify fallback values work

**🚨 CRITICAL**: Never assume data "passes through" correctly. VERIFY at each step!

### 2.4 Commit Strategy
```bash
# After each logical unit of work
git add .
git commit -m "feat(component): specific change description"

# Create safety checkpoints
git commit -m "checkpoint: Before [risky-change]"
```

- [ ] Commit after each integration point
- [ ] Commit before making risky changes
- [ ] Write descriptive commit messages
- [ ] Push regularly to avoid data loss

---

## ✅ Post-Implementation Phase

**MANDATORY BEFORE CLAIMING "DONE"**

### 3.1 TypeScript Verification
```bash
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app
pnpm run typecheck
```

**Expected Output**:
```
✓ TypeScript compilation completed successfully
✓ 0 errors found
```

**If ANY errors**:
- ❌ STOP - Fix immediately
- ❌ DO NOT proceed to next step
- ❌ DO NOT claim task is complete

### 3.2 Linting Verification
```bash
pnpm run lint
```

**Expected Output**:
```
✓ No linting errors found
```

### 3.3 Unit Test Verification
```bash
pnpm run test:unit
```

**Expected Output**:
```
Test Files  X passed (X)
     Tests  X passed (X)
  Duration  < 30s
```

- [ ] All tests passing
- [ ] New tests added for new code
- [ ] Coverage > 80% for new code

### 3.4 Integration Test Verification
```bash
pnpm run test:integration
```

**Expected Output**:
```
✓ All integration tests passed
✓ Database operations verified
✓ API contracts verified
```

### 3.5 Protected Core Tests
```bash
pnpm run test:protected-core
```

**Expected Output**:
```
✓ No protected-core violations
✓ All service contracts maintained
```

### 3.6 E2E Test Verification
```bash
pnpm run test:e2e
```

**Expected Output**:
```
✓ Complete user journeys verified
✓ All integration points tested
```

---

## 🚶‍♂️ Complete User Journey Tests

**Test EVERY step of the user flow**

### Journey 1: New User Onboarding → First Session

#### Step 1: User Registration
- [ ] User can create account
- [ ] Email verification works (if applicable)
- [ ] User redirected to wizard

#### Step 2: Wizard Completion
- [ ] User can select grade
- [ ] User can select subjects
- [ ] User can select topics
- [ ] Selections save to database
- [ ] Verify database has correct data:
  ```sql
  SELECT grade, preferred_subjects, selected_topics
  FROM profiles
  WHERE id = 'test-user-id';
  ```

#### Step 3: Dashboard Navigation
- [ ] User sees dashboard after wizard
- [ ] Dashboard displays selected preferences
- [ ] "Start Session" button visible
- [ ] User can navigate to classroom

#### Step 4: Classroom Load
- [ ] Classroom page loads successfully
- [ ] Correct topic displayed (e.g., "Grade 12 Physics")
- [ ] Verify console logs show correct topic:
  ```
  [DEBUG-METADATA] Setting currentTopic to: Grade 12 Physics
  ```

#### Step 5: Voice Session Start
- [ ] "Start Session" button works
- [ ] Microphone permissions requested
- [ ] LiveKit connection established
- [ ] Verify token request includes metadata:
  ```json
  {
    "studentId": "user-id",
    "topic": "Grade 12 Physics",
    "metadata": {
      "grade": "Grade 12",
      "subject": "Physics",
      "topic": "Grade 12 Physics"
    }
  }
  ```

#### Step 6: Python Agent Greeting
- [ ] AI voice starts within 5 seconds
- [ ] AI greeting mentions correct grade
- [ ] AI greeting mentions correct subject
- [ ] Example: "Hello! I'm your AI Physics teacher for Grade 12..."
- [ ] Verify Python agent logs:
  ```
  [PC-015] Using dynamic prompt: Grade 12 Physics - Grade 12 Physics
  ```

#### Step 7: Transcript Display
- [ ] AI speech appears in transcript
- [ ] Math equations render with KaTeX
- [ ] Show-then-tell timing correct (visual 400ms before audio)
- [ ] No duplicate transcripts

#### Step 8: Student Interaction
- [ ] Student can speak and be heard
- [ ] Student speech transcribed
- [ ] AI responds appropriately
- [ ] Responses use correct grade-level language

#### Step 9: Session End
- [ ] User can end session
- [ ] Session saved to database
- [ ] Transcript saved correctly
- [ ] User returned to dashboard/classroom

**✅ CHECKPOINT**: All 9 steps must work end-to-end

---

### Journey 2: Returning User → Different Subject

#### Step 1: Login
- [ ] User can log in
- [ ] Redirected to dashboard

#### Step 2: Change Preferences
- [ ] User can access wizard/settings
- [ ] User can change subject (e.g., Math → Chemistry)
- [ ] Changes save to database

#### Step 3: Start New Session
- [ ] Classroom loads new topic
- [ ] Topic format correct (e.g., "Grade 12 Chemistry")
- [ ] AI greets with new subject
- [ ] Example: "I'm your AI Chemistry teacher..."

**✅ CHECKPOINT**: Preference changes reflected in AI behavior

---

### Journey 3: Edge Cases & Error Scenarios

#### Edge Case 1: User with No Preferences
- [ ] System uses fallback values
- [ ] Defaults to "Grade 10 General Studies"
- [ ] AI greeting still works
- [ ] User prompted to complete wizard

#### Edge Case 2: Network Interruption
- [ ] Session recovers from brief disconnects
- [ ] No data loss during recovery
- [ ] UI shows connection status
- [ ] Graceful degradation

#### Edge Case 3: Invalid Metadata
- [ ] System handles missing grade
- [ ] System handles missing subject
- [ ] Fallback values used
- [ ] No crashes or errors

#### Edge Case 4: Special Characters in Topic
- [ ] Topic: "Grade 10 Science (NCERT)"
- [ ] Parsing still works
- [ ] Metadata extracted correctly

**✅ CHECKPOINT**: All edge cases handled gracefully

---

## 📊 Data Flow Verification

**Trace data through EVERY transformation**

### Data Flow 1: Wizard Selection → Database

**Starting Point**: User selects in wizard
```typescript
// User selections
grade: "12"
preferred_subjects: ["Physics"]
selected_topics: ["Mechanics"]
```

**Transformation 1**: Wizard → Supabase
```typescript
// src/app/wizard/page.tsx
const { error } = await supabase
  .from('profiles')
  .update({
    grade: formData.grade,
    preferred_subjects: formData.subjects,
    selected_topics: formData.topics
  })
```

**Verification**:
- [ ] Open Supabase dashboard
- [ ] Navigate to `profiles` table
- [ ] Find test user row
- [ ] Verify columns match:
  ```
  grade: "12"
  preferred_subjects: ["Physics"]
  selected_topics: ["Mechanics"]
  ```

**Test**:
```typescript
test('Wizard saves selections to database', async () => {
  // Submit wizard form
  await submitWizard({ grade: '12', subjects: ['Physics'] });

  // Verify database
  const profile = await getProfile(testUserId);
  expect(profile.grade).toBe('12');
  expect(profile.preferred_subjects).toContain('Physics');
});
```

---

### Data Flow 2: Database → Classroom Display

**Starting Point**: Database has user preferences

**Transformation 2**: Database → Classroom Page
```typescript
// src/app/classroom/page.tsx (Line 159-175)
const { data: profile } = await supabase
  .from('profiles')
  .select('grade, preferred_subjects, selected_topics')
  .eq('id', user.id)
  .single();

// Format as topic string
const topic = `Grade ${profile.grade} ${profile.preferred_subjects[0]}`;
setCurrentTopic(topic); // "Grade 12 Physics"
```

**Verification**:
- [ ] Add console.log before topic formation
- [ ] Verify profile data loaded correctly
- [ ] Verify topic string formatted correctly
- [ ] Check browser console shows:
  ```
  [DEBUG-METADATA] Profile loaded: { grade: "12", preferred_subjects: ["Physics"], ... }
  [DEBUG-METADATA] Setting currentTopic to: Grade 12 Physics
  ```

**Test**:
```typescript
test('Classroom loads and formats topic correctly', async () => {
  // Setup: User with Grade 12 Physics
  await setupUserProfile({ grade: '12', subjects: ['Physics'] });

  // Load classroom
  render(<ClassroomPage />);
  await waitForElementToBeRemoved(() => screen.getByText(/loading/i));

  // Verify topic displayed
  expect(screen.getByText(/Grade 12 Physics/i)).toBeInTheDocument();
});
```

---

### Data Flow 3: Classroom → VoiceSessionManager

**Starting Point**: Classroom has topic = "Grade 12 Physics"

**Transformation 3**: Topic → Session Creation
```typescript
// src/app/classroom/page.tsx (Line 229-235)
const voiceSessionId = await createSession({
  studentId: userId,
  topic: currentTopic, // "Grade 12 Physics"
  voiceEnabled: true,
  mathTranscriptionEnabled: true,
  recordingEnabled: true
});
```

**Verification**:
- [ ] Add console.log in VoiceSessionManager.createSession()
- [ ] Verify topic received correctly
- [ ] Check console shows:
  ```
  [VoiceSessionManager] Creating session with topic: Grade 12 Physics
  ```

**Test**:
```typescript
test('Session created with correct topic', async () => {
  const sessionManager = new VoiceSessionManager();

  const sessionId = await sessionManager.createSession({
    topic: 'Grade 12 Physics',
    studentId: 'test-user'
  });

  const session = sessionManager.getSession(sessionId);
  expect(session.topic).toBe('Grade 12 Physics');
});
```

---

### Data Flow 4: VoiceSessionManager Parsing → Metadata

**Starting Point**: VoiceSessionManager has topic = "Grade 12 Physics"

**Transformation 4**: Topic → Metadata Extraction
```typescript
// src/features/voice/VoiceSessionManager.ts (Line 520-573)
private extractGrade(topic: string): string {
  const gradeMatch = topic.match(/Grade\s+(\d+)/i);
  return gradeMatch ? `Grade ${gradeMatch[1]}` : 'Grade 10';
}

private extractSubject(topic: string): string {
  const subjectMatch = topic.match(/Grade\s+\d+\s+(.+)/i);
  return subjectMatch && subjectMatch[1]
    ? subjectMatch[1].trim()
    : 'General Studies';
}

const metadata = {
  topic: this.currentConfig.topic,
  grade: this.extractGrade(this.currentConfig.topic),
  subject: this.extractSubject(this.currentConfig.topic)
};
```

**Verification**:
- [ ] Add console.log after metadata creation
- [ ] Verify parsing logic works correctly
- [ ] Check console shows:
  ```
  [VoiceSessionManager] Metadata extracted: { topic: "Grade 12 Physics", grade: "Grade 12", subject: "Physics" }
  ```

**Test** (CRITICAL - This test caught PC-015 bug):
```typescript
describe('Metadata extraction', () => {
  test('extracts grade from topic', () => {
    const manager = new VoiceSessionManager();
    expect(manager.extractGrade('Grade 12 Physics')).toBe('Grade 12');
    expect(manager.extractGrade('Grade 10 Math')).toBe('Grade 10');
  });

  test('extracts subject from topic', () => {
    const manager = new VoiceSessionManager();
    expect(manager.extractSubject('Grade 12 Physics')).toBe('Physics');
    expect(manager.extractSubject('Grade 10 Mathematics')).toBe('Mathematics');
  });

  test('handles all NCERT subjects', () => {
    const subjects = [
      'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'Hindi', 'English Language', 'Social Studies'
    ];

    subjects.forEach(subject => {
      const topic = `Grade 10 ${subject}`;
      expect(manager.extractSubject(topic)).toBe(subject);
    });
  });
});
```

---

### Data Flow 5: Metadata → LiveKit Token

**Starting Point**: VoiceSessionManager has metadata object

**Transformation 5**: Metadata → Token Request
```typescript
// src/features/voice/VoiceSessionManager.ts (Line 240-257)
await fetch('/api/v2/livekit/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantId: this.currentConfig.studentId,
    sessionId: this.currentSession.sessionId,
    roomName: this.currentSession.livekitRoomName,
    participantName: this.currentConfig.studentId,
    metadata: sessionMetadata // { topic, grade, subject }
  })
});
```

**Verification**:
- [ ] Add console.log in token route
- [ ] Verify metadata received correctly
- [ ] Check server logs show:
  ```
  [Token Route] Received metadata: { topic: "Grade 12 Physics", grade: "Grade 12", subject: "Physics" }
  ```

**Test**:
```typescript
test('Token endpoint receives metadata', async () => {
  const response = await fetch('/api/v2/livekit/token', {
    method: 'POST',
    body: JSON.stringify({
      participantId: 'test-user',
      metadata: {
        topic: 'Grade 12 Physics',
        grade: 'Grade 12',
        subject: 'Physics'
      }
    })
  });

  expect(response.ok).toBe(true);
  const data = await response.json();
  expect(data.token).toBeDefined();
});
```

---

### Data Flow 6: Token Route → LiveKit Room

**Starting Point**: Token route has metadata

**Transformation 6**: Metadata → LiveKit Token
```typescript
// src/app/api/v2/livekit/token/route.ts (Line 14-36)
const { participantId, metadata } = await request.json();

const at = new AccessToken(apiKey, apiSecret, {
  identity: participantId,
  metadata: metadata ? JSON.stringify(metadata) : undefined
});
```

**Verification**:
- [ ] Verify AccessToken created with metadata
- [ ] Check LiveKit dashboard shows room with metadata
- [ ] Verify metadata accessible to Python agent

**Test**:
```typescript
test('AccessToken includes metadata', async () => {
  const metadata = {
    topic: 'Grade 12 Physics',
    grade: 'Grade 12',
    subject: 'Physics'
  };

  const token = new AccessToken(apiKey, apiSecret, {
    identity: 'test-user',
    metadata: JSON.stringify(metadata)
  });

  // Verify token has metadata
  expect(token.metadata).toContain('Grade 12');
  expect(token.metadata).toContain('Physics');
});
```

---

### Data Flow 7: LiveKit → Python Agent

**Starting Point**: LiveKit room has metadata

**Transformation 7**: Room Metadata → Python Agent
```python
# livekit-agent/agent.py (Line 438-459)
async def entrypoint(ctx: JobContext):
    session_metadata = {}
    if ctx.room.metadata:
        try:
            session_metadata = json.loads(ctx.room.metadata)
            logger.info(f"[METADATA] Loaded: {session_metadata}")
        except json.JSONDecodeError:
            logger.warning(f"[METADATA] Failed to parse")

    topic = session_metadata.get('topic', 'General Learning')
    subject = session_metadata.get('subject', 'General Studies')
    grade = session_metadata.get('grade', 'Grade 10')
```

**Verification**:
- [ ] Add logging in Python agent
- [ ] Start session and check Python logs
- [ ] Verify logs show:
  ```
  [METADATA] Loaded: {'topic': 'Grade 12 Physics', 'grade': 'Grade 12', 'subject': 'Physics'}
  [PC-015] Using dynamic prompt: Grade 12 Physics - Grade 12 Physics
  ```

**Test**:
```python
def test_metadata_parsing():
    metadata_json = '{"topic": "Grade 12 Physics", "grade": "Grade 12", "subject": "Physics"}'
    metadata = json.loads(metadata_json)

    assert metadata['grade'] == 'Grade 12'
    assert metadata['subject'] == 'Physics'
    assert metadata['topic'] == 'Grade 12 Physics'
```

---

### Data Flow 8: Python Agent → AI Prompt

**Starting Point**: Python agent has grade, subject, topic

**Transformation 8**: Metadata → System Prompt
```python
# livekit-agent/agent.py (Line 603-612)
def create_tutor_prompt(grade: str, subject: str, topic: str) -> str:
    return f"""You are a friendly and patient NCERT tutor for {grade} students in India,
    specializing in {subject}.

    Current session focus: {topic} from {grade} {subject}"""

dynamic_prompt = create_tutor_prompt(grade, subject, topic)
```

**Verification**:
- [ ] Add logging before prompt generation
- [ ] Verify prompt uses correct values
- [ ] Check Python logs show:
  ```
  [Prompt] Generated for: Grade 12, Physics, Grade 12 Physics
  [Prompt] Content: You are a friendly and patient NCERT tutor for Grade 12 students...
  ```

**Test**:
```python
def test_prompt_generation():
    prompt = create_tutor_prompt('Grade 12', 'Physics', 'Grade 12 Physics')

    assert 'Grade 12 students' in prompt
    assert 'specializing in Physics' in prompt
    assert 'Grade 12 Physics' in prompt
    assert 'Grade 10' not in prompt  # Should NOT have fallback values
```

---

### Data Flow 9: AI Prompt → Greeting Speech

**Starting Point**: AI has dynamic prompt with correct grade/subject

**Transformation 9**: Prompt → Greeting
```python
# livekit-agent/agent.py (Line 603-612)
greeting_instructions = f"""Greet the student warmly and welcome them to today's {subject} session.
Introduce yourself as their AI {subject} teacher for {grade}.
Mention that you're ready to help them with {topic}."""

await session.generate_reply(instructions=greeting_instructions)
```

**Verification**:
- [ ] Start voice session
- [ ] Listen to AI greeting
- [ ] Verify greeting says correct grade
- [ ] Verify greeting says correct subject
- [ ] Example expected: "Hello! I'm your AI Physics teacher for Grade 12..."
- [ ] Example WRONG: "Hello! I'm your AI Mathematics teacher for Grade 10..."

**Manual Test**:
1. Login as test user
2. Complete wizard: Grade 12 + Physics
3. Go to classroom
4. Start session
5. Listen carefully to greeting
6. ✅ Should mention "Grade 12" and "Physics"
7. ❌ Should NOT mention "Grade 10" or "Mathematics"

---

## 🔗 Integration Point Testing

**Test EVERY boundary between systems**

### Integration Point 1: Frontend ↔ Database

**Components**:
- Frontend: Wizard, Dashboard, Classroom
- Database: Supabase profiles table

**Test Scenarios**:

1. **Write Operation**:
```typescript
test('Wizard saves to database', async () => {
  await updateProfile({ grade: '12', subjects: ['Physics'] });
  const saved = await getProfile(userId);
  expect(saved.grade).toBe('12');
});
```

2. **Read Operation**:
```typescript
test('Classroom loads from database', async () => {
  await setupProfile({ grade: '12', subjects: ['Physics'] });
  const profile = await loadProfileInClassroom(userId);
  expect(profile.grade).toBe('12');
});
```

3. **Error Handling**:
```typescript
test('Handles missing profile', async () => {
  const profile = await loadProfile('non-existent-user');
  expect(profile).toBeNull();
  // Should not crash, should show error
});
```

**Verification Checklist**:
- [ ] Data saves correctly
- [ ] Data loads correctly
- [ ] Handles missing data gracefully
- [ ] Handles database errors gracefully
- [ ] Type safety maintained

---

### Integration Point 2: Frontend ↔ API Routes

**Components**:
- Frontend: Components making API calls
- Backend: Next.js API routes

**Test Scenarios**:

1. **Token Request**:
```typescript
test('Token endpoint accepts correct payload', async () => {
  const response = await fetch('/api/v2/livekit/token', {
    method: 'POST',
    body: JSON.stringify({
      participantId: 'test-user',
      metadata: { grade: 'Grade 12', subject: 'Physics' }
    })
  });

  expect(response.ok).toBe(true);
  const data = await response.json();
  expect(data.token).toBeDefined();
});
```

2. **Error Cases**:
```typescript
test('Token endpoint rejects invalid payload', async () => {
  const response = await fetch('/api/v2/livekit/token', {
    method: 'POST',
    body: JSON.stringify({ invalid: 'data' })
  });

  expect(response.ok).toBe(false);
  expect(response.status).toBe(400);
});
```

**Verification Checklist**:
- [ ] Request format matches API contract
- [ ] Response format matches expected structure
- [ ] Error responses handled correctly
- [ ] Type safety between frontend and API

---

### Integration Point 3: API Routes ↔ LiveKit

**Components**:
- Backend: Token route
- External: LiveKit service

**Test Scenarios**:

1. **Token Creation**:
```typescript
test('Creates valid LiveKit token', async () => {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: 'test-user',
    metadata: JSON.stringify({ grade: 'Grade 12' })
  });

  const jwt = await token.toJwt();
  expect(jwt).toBeDefined();
  expect(typeof jwt).toBe('string');
});
```

2. **Metadata Passing**:
```typescript
test('Token includes metadata', async () => {
  const metadata = { grade: 'Grade 12', subject: 'Physics' };
  const token = new AccessToken(apiKey, apiSecret, {
    identity: 'test-user',
    metadata: JSON.stringify(metadata)
  });

  // Verify metadata encoded in token
  expect(token.metadata).toContain('Grade 12');
});
```

**Verification Checklist**:
- [ ] Token creation succeeds
- [ ] Metadata included in token
- [ ] Token accepted by LiveKit
- [ ] Room created with metadata

---

### Integration Point 4: LiveKit ↔ Python Agent

**Components**:
- External: LiveKit service
- Backend: Python agent

**Test Scenarios**:

1. **Metadata Reception** (Python):
```python
def test_agent_receives_metadata():
    # Mock LiveKit room with metadata
    room_metadata = json.dumps({
        'topic': 'Grade 12 Physics',
        'grade': 'Grade 12',
        'subject': 'Physics'
    })

    # Parse as agent would
    metadata = json.loads(room_metadata)

    assert metadata['grade'] == 'Grade 12'
    assert metadata['subject'] == 'Physics'
```

2. **Fallback Values** (Python):
```python
def test_agent_handles_missing_metadata():
    room_metadata = None

    metadata = json.loads(room_metadata) if room_metadata else {}

    grade = metadata.get('grade', 'Grade 10')
    subject = metadata.get('subject', 'General Studies')

    assert grade == 'Grade 10'  # fallback
    assert subject == 'General Studies'  # fallback
```

**Verification Checklist**:
- [ ] Python agent receives room metadata
- [ ] Metadata parsed correctly
- [ ] Fallback values work
- [ ] No crashes on missing metadata

---

### Integration Point 5: Python Agent ↔ AI Model

**Components**:
- Backend: Python agent
- External: Gemini AI model

**Test Scenarios**:

1. **Prompt Generation**:
```python
def test_dynamic_prompt_creation():
    grade = 'Grade 12'
    subject = 'Physics'
    topic = 'Grade 12 Physics'

    prompt = create_tutor_prompt(grade, subject, topic)

    assert 'Grade 12' in prompt
    assert 'Physics' in prompt
    assert 'Grade 10' not in prompt  # No hardcoded fallback
```

2. **Greeting Instructions**:
```python
def test_greeting_uses_metadata():
    grade = 'Grade 12'
    subject = 'Physics'
    topic = 'Mechanics'

    instructions = f"Introduce yourself as AI {subject} teacher for {grade}"

    assert 'Physics teacher' in instructions
    assert 'Grade 12' in instructions
```

**Verification Checklist**:
- [ ] Prompt uses metadata values
- [ ] No hardcoded values in prompt
- [ ] Greeting mentions correct grade/subject
- [ ] AI responds appropriately

---

## 🎨 Visual Regression Testing

**Ensure UI displays correctly across all states**

### 7.1 Screenshot Baseline

Create baseline screenshots for each major state:

```typescript
import { mcp__playwright__browser_take_screenshot } from 'mcp-tools';

test('Visual regression - Classroom initial state', async () => {
  await page.goto('/classroom');
  await mcp__playwright__browser_take_screenshot({
    filename: 'classroom-initial.png',
    fullPage: true
  });
});

test('Visual regression - Active session', async () => {
  await startSession();
  await mcp__playwright__browser_take_screenshot({
    filename: 'classroom-active-session.png',
    fullPage: true
  });
});
```

### 7.2 Visual Test Scenarios

- [ ] Classroom initial load (no session)
- [ ] Classroom with active session
- [ ] Transcript panel with content
- [ ] Math equations rendering
- [ ] Session controls (play/pause/stop)
- [ ] Error states
- [ ] Loading states
- [ ] Mobile responsive views

### 7.3 Critical UI Elements

**TopicSelector Component**:
- [ ] Displays current topic correctly
- [ ] Topic format: "Grade X Subject"
- [ ] No duplicate keys error
- [ ] Dropdown works correctly

**TeachingBoard Component**:
- [ ] Transcripts display in order
- [ ] Math renders with KaTeX
- [ ] Show-then-tell visual timing correct
- [ ] No visual glitches on rapid updates

**SessionControls**:
- [ ] Start button visible when idle
- [ ] Pause/Resume button visible when active
- [ ] Stop button visible when active
- [ ] States update correctly

### 7.4 Screenshot Comparison

```typescript
test('No visual regression in classroom', async () => {
  const current = await takeScreenshot('classroom');
  const baseline = loadBaseline('classroom');

  const diff = compareImages(current, baseline);
  expect(diff.percentageDifference).toBeLessThan(1); // < 1% change
});
```

---

## ⚡ Performance Testing

**Verify show-then-tell timing and system responsiveness**

### 8.1 Show-Then-Tell Timing Verification

**Requirement**: Visual content appears 400ms before audio

```typescript
test('Visual appears 400ms before audio', async () => {
  const events: Array<{ type: string; timestamp: number }> = [];

  // Subscribe to visual updates
  displayBuffer.subscribe(() => {
    events.push({ type: 'visual', timestamp: performance.now() });
  });

  // Send show-then-tell transcript
  liveKitEventBus.emit('livekit:transcript', {
    segments: [{ type: 'math', content: 'E = mc^2' }],
    showThenTell: true
  });

  // Simulate audio arrival 400ms later
  await delay(400);
  events.push({ type: 'audio', timestamp: performance.now() });

  // Verify timing
  const visualEvent = events.find(e => e.type === 'visual');
  const audioEvent = events.find(e => e.type === 'audio');
  const timeDiff = audioEvent.timestamp - visualEvent.timestamp;

  expect(timeDiff).toBeGreaterThan(350); // Allow variance
  expect(timeDiff).toBeLessThan(450);
});
```

### 8.2 Performance Benchmarks

**Loading Performance**:
```typescript
test('Classroom loads within 2 seconds', async () => {
  const start = performance.now();
  await page.goto('/classroom');
  await page.waitForSelector('[data-testid="classroom-ready"]');
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(2000); // 2 seconds
});
```

**Transcription Latency**:
```typescript
test('Transcription appears within 300ms', async () => {
  const start = performance.now();

  liveKitEventBus.emit('livekit:transcript', {
    segments: [{ type: 'text', content: 'Hello' }]
  });

  await waitFor(() => {
    return screen.queryByText('Hello') !== null;
  });

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(300);
});
```

### 8.3 Load Testing

**Rapid Transcript Handling**:
```typescript
test('Handles 20 transcripts per second', async () => {
  const start = performance.now();

  for (let i = 0; i < 20; i++) {
    liveKitEventBus.emit('livekit:transcript', {
      segments: [{ type: 'text', content: `Message ${i}` }]
    });
    await delay(50); // 20 per second
  }

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(1500); // < 1.5 seconds total

  const items = displayBuffer.getItems();
  expect(items.length).toBe(20);
});
```

**Performance Checklist**:
- [ ] Classroom loads < 2 seconds
- [ ] Transcription latency < 300ms
- [ ] Show-then-tell timing: 400ms ± 50ms
- [ ] No frame drops during rapid updates
- [ ] Memory usage stable during long sessions

---

## 🤖 Automated Test Suite

**Comprehensive automated tests for regression prevention**

### 9.1 Test File Structure

```
src/tests/
├── unit/                    # Unit tests
│   ├── VoiceSessionManager.test.ts
│   ├── metadata-parsing.test.ts
│   └── display-buffer.test.ts
├── integration/             # Integration tests
│   ├── voice-session-lifecycle.test.ts
│   ├── database-operations.test.ts
│   └── api-endpoints.test.ts
├── e2e/                     # End-to-end tests
│   ├── complete-user-journey.test.ts
│   ├── metadata-flow.test.ts
│   └── session.e2e.test.ts
└── performance/             # Performance tests
    ├── show-then-tell-timing.test.ts
    └── transcript-latency.test.ts
```

### 9.2 Critical Test Coverage

**PC-015 Metadata Flow Tests** (MANDATORY):
```typescript
// src/tests/pc-015-metadata-flow.test.ts

describe('PC-015: Complete Metadata Flow', () => {
  test('Wizard → Database → Classroom → Agent → AI', async () => {
    // 1. User completes wizard
    await submitWizard({ grade: '12', subjects: ['Physics'] });

    // 2. Verify database
    const profile = await getProfile(testUserId);
    expect(profile.grade).toBe('12');
    expect(profile.preferred_subjects).toContain('Physics');

    // 3. Load classroom
    const classroom = await loadClassroom(testUserId);
    expect(classroom.topic).toBe('Grade 12 Physics');

    // 4. Create session
    const session = await createVoiceSession({
      topic: classroom.topic,
      studentId: testUserId
    });

    // 5. Verify metadata extraction
    expect(session.metadata.grade).toBe('Grade 12');
    expect(session.metadata.subject).toBe('Physics');

    // 6. Verify token request
    const tokenRequest = await captureTokenRequest();
    expect(tokenRequest.metadata.grade).toBe('Grade 12');
    expect(tokenRequest.metadata.subject).toBe('Physics');

    // 7. Verify Python agent prompt (via logs)
    const pythonLogs = await getPythonAgentLogs();
    expect(pythonLogs).toContain('Grade 12 students');
    expect(pythonLogs).toContain('specializing in Physics');
    expect(pythonLogs).not.toContain('Grade 10'); // No hardcoded fallback
  });
});
```

### 9.3 Regression Prevention Tests

**Never Allow These Bugs Again**:

1. **Hardcoded Grade/Subject**:
```typescript
test('No hardcoded grades in metadata extraction', () => {
  const topics = [
    'Grade 9 Math',
    'Grade 10 Science',
    'Grade 11 Chemistry',
    'Grade 12 Physics'
  ];

  topics.forEach(topic => {
    const metadata = extractMetadata(topic);
    expect(metadata.grade).not.toBe('Grade 10'); // Should match topic
    expect(metadata.grade).toContain(topic.match(/Grade \d+/)[0]);
  });
});
```

2. **Missing Metadata Parsing**:
```typescript
test('All NCERT subjects parsed correctly', () => {
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Hindi', 'English Language', 'Social Studies'
  ];

  subjects.forEach(subject => {
    const topic = `Grade 10 ${subject}`;
    const metadata = extractMetadata(topic);
    expect(metadata.subject).toBe(subject);
  });
});
```

3. **Incomplete Data Flow**:
```typescript
test('Metadata flows through all integration points', async () => {
  const metadata = { grade: 'Grade 12', subject: 'Physics' };

  // Trace through entire flow
  const session = await createSession(metadata);
  const tokenRequest = await session.getTokenRequest();
  const livekitRoom = await tokenRequest.createRoom();
  const pythonAgent = await livekitRoom.getAgent();

  // Verify at every step
  expect(session.metadata).toEqual(metadata);
  expect(tokenRequest.metadata).toEqual(metadata);
  expect(livekitRoom.metadata).toContain('Grade 12');
  expect(pythonAgent.prompt).toContain('Grade 12 Physics');
});
```

### 9.4 Test Execution

**Run all tests before claiming "done"**:
```bash
# Unit tests (fast, always run)
pnpm run test:unit

# Integration tests (moderate, run before commits)
pnpm run test:integration

# E2E tests (slow, run before PRs)
pnpm run test:e2e

# Performance tests (optional, run periodically)
pnpm run test:performance

# All tests
pnpm run test:all
```

**Coverage Requirements**:
- Unit tests: > 90% coverage
- Integration tests: All critical paths
- E2E tests: Complete user journeys
- Performance tests: All timing requirements

---

## 👨‍💻 Manual UAT Checklist

**Manual verification steps to perform before sign-off**

### 10.1 Test Environment Setup

**Prerequisites**:
- [ ] Frontend running on port 3006
- [ ] Python agent running (LiveKit service)
- [ ] Supabase database accessible
- [ ] Test user created with known credentials

**Test Data**:
```
Test User Credentials:
Email: test@example.com
Password: TestPassword123!

Test Scenarios:
- Grade 9 Mathematics
- Grade 10 Science
- Grade 11 Chemistry
- Grade 12 Physics
```

### 10.2 Step-by-Step UAT

#### UAT Scenario 1: New User - Grade 12 Physics

**Step 1: Registration**
- [ ] Navigate to `/signup`
- [ ] Create new account
- [ ] Verify email (if applicable)
- [ ] Redirected to wizard

**Step 2: Wizard Completion**
- [ ] Select Grade: 12
- [ ] Select Subject: Physics
- [ ] Select Topic: Mechanics
- [ ] Click "Save Preferences"
- [ ] Verify success message
- [ ] Redirected to dashboard

**Step 3: Database Verification**
- [ ] Open Supabase dashboard
- [ ] Find user in `profiles` table
- [ ] Verify columns:
  ```
  grade: "12"
  preferred_subjects: ["Physics"]
  selected_topics: ["Mechanics"]
  ```

**Step 4: Classroom Navigation**
- [ ] Click "Start Learning" or navigate to `/classroom`
- [ ] Page loads without errors
- [ ] Topic displayed: "Grade 12 Physics"
- [ ] Console shows:
  ```
  [DEBUG-METADATA] Setting currentTopic to: Grade 12 Physics
  ```

**Step 5: Voice Session Start**
- [ ] Click "Start Session" button
- [ ] Microphone permission requested
- [ ] Grant microphone access
- [ ] Session connecting (loading spinner)
- [ ] Session connected (green indicator)
- [ ] Console shows:
  ```
  [VoiceSessionManager] Metadata extracted: { grade: "Grade 12", subject: "Physics", ... }
  ```

**Step 6: AI Greeting Verification** (CRITICAL)
- [ ] AI speaks within 5 seconds
- [ ] Listen carefully to greeting
- [ ] **MUST say**: "Grade 12" or "twelfth grade"
- [ ] **MUST say**: "Physics" or "Physics teacher"
- [ ] **MUST NOT say**: "Grade 10" or "Mathematics"
- [ ] Example correct: "Hello! I'm your AI Physics teacher for Grade 12..."
- [ ] Example WRONG: "I'm your AI Mathematics teacher for Grade 10..."

**Step 7: Python Agent Logs Verification**
- [ ] Check Python agent terminal/logs
- [ ] Verify log shows:
  ```
  [METADATA] Loaded session context: {'topic': 'Grade 12 Physics', 'grade': 'Grade 12', 'subject': 'Physics'}
  [PC-015] Using dynamic prompt: Grade 12 Physics - Grade 12 Physics
  ```
- [ ] **MUST NOT** show hardcoded "Grade 10" in logs

**Step 8: Interaction Testing**
- [ ] Ask AI a Physics question (e.g., "What is Newton's first law?")
- [ ] AI responds appropriately
- [ ] Response uses Grade 12 level language
- [ ] If math equation, verify KaTeX rendering

**Step 9: Transcript Verification**
- [ ] AI speech appears in transcript panel
- [ ] Student speech appears in transcript panel
- [ ] Math equations render correctly
- [ ] Show-then-tell timing correct (visual before audio)
- [ ] No duplicate transcripts

**Step 10: Session End**
- [ ] Click "End Session" button
- [ ] Session ends gracefully
- [ ] Redirected to dashboard or summary
- [ ] Database updated with session record

**✅ UAT Scenario 1 Result**: [ ] PASS / [ ] FAIL

---

#### UAT Scenario 2: Returning User - Change Subject

**Step 1: Login**
- [ ] Login with existing account
- [ ] Redirected to dashboard

**Step 2: View Current Settings**
- [ ] Navigate to wizard/settings
- [ ] Current settings displayed correctly
- [ ] Grade: 12, Subject: Physics (from previous)

**Step 3: Change Subject**
- [ ] Select new subject: Chemistry
- [ ] Save changes
- [ ] Verify database updated:
  ```
  preferred_subjects: ["Chemistry"]
  ```

**Step 4: Start New Session**
- [ ] Navigate to classroom
- [ ] Topic shows: "Grade 12 Chemistry"
- [ ] Start voice session
- [ ] AI greeting mentions "Chemistry" (not "Physics")
- [ ] Example: "I'm your AI Chemistry teacher for Grade 12..."

**✅ UAT Scenario 2 Result**: [ ] PASS / [ ] FAIL

---

#### UAT Scenario 3: Edge Case - User with No Preferences

**Step 1: Create User Without Wizard**
- [ ] Create account
- [ ] Skip wizard (or manually set preferences to null in DB)

**Step 2: Navigate to Classroom**
- [ ] Go to `/classroom`
- [ ] Should not crash
- [ ] Topic shows fallback: "General Learning" or similar

**Step 3: Start Session**
- [ ] Start voice session
- [ ] AI uses fallback values
- [ ] Example: "I'm your AI tutor for Grade 10 General Studies..."
- [ ] Session works without errors

**✅ UAT Scenario 3 Result**: [ ] PASS / [ ] FAIL

---

#### UAT Scenario 4: Edge Case - Special Characters

**Step 1: Setup**
- [ ] User preferences: Grade 10, Subject: "Science (NCERT)"

**Step 2: Verify Parsing**
- [ ] Classroom topic: "Grade 10 Science (NCERT)"
- [ ] Start session
- [ ] Metadata parsing handles parentheses
- [ ] AI greeting mentions "Science"
- [ ] No parsing errors

**✅ UAT Scenario 4 Result**: [ ] PASS / [ ] FAIL

---

### 10.3 UAT Evidence Collection

**For each scenario, collect**:

1. **Screenshots**:
   - [ ] Wizard with selections
   - [ ] Database record
   - [ ] Classroom showing topic
   - [ ] Active session with transcript

2. **Console Logs**:
   - [ ] Frontend console (metadata flow)
   - [ ] Network tab (token request)
   - [ ] Python agent logs (prompt generation)

3. **Screen Recording**:
   - [ ] Video of complete user flow
   - [ ] Audio of AI greeting
   - [ ] Timestamp when greeting mentions grade/subject

4. **Test Results**:
   - [ ] UAT checklist completed
   - [ ] Pass/Fail for each scenario
   - [ ] Any issues found

---

## ✅ Sign-Off Criteria

**ALL criteria must be met before claiming task is complete**

### 11.1 Code Quality
- [ ] TypeScript: 0 errors (`pnpm run typecheck`)
- [ ] Linting: 0 errors (`pnpm run lint`)
- [ ] No use of `any` type
- [ ] Types reused from shared packages
- [ ] Code follows established patterns

### 11.2 Test Coverage
- [ ] Unit tests: >90% coverage for new code
- [ ] Integration tests: All integration points covered
- [ ] E2E tests: Complete user journeys tested
- [ ] All tests passing (`pnpm run test:all`)

### 11.3 Data Flow Verification
- [ ] Traced data through ALL transformations
- [ ] Verified at EVERY integration point
- [ ] Added logging at critical steps
- [ ] Tested with real data (not mocks)

### 11.4 Manual UAT
- [ ] All UAT scenarios passed
- [ ] Edge cases tested
- [ ] Screenshots/recordings captured
- [ ] Evidence documented

### 11.5 Performance
- [ ] Show-then-tell timing: 400ms ± 50ms
- [ ] Transcription latency: <300ms
- [ ] Classroom loads: <2 seconds
- [ ] No performance regressions

### 11.6 Documentation
- [ ] Code comments added where needed
- [ ] README updated (if applicable)
- [ ] Change record created
- [ ] Evidence files saved

### 11.7 Deployment Readiness
- [ ] Protected core not modified
- [ ] Feature flags used (if applicable)
- [ ] Database migrations (if applicable)
- [ ] Environment variables documented

### 11.8 Final Verification
- [ ] Complete user journey works end-to-end
- [ ] AI greeting uses correct grade/subject
- [ ] No hardcoded values
- [ ] No regressions in existing features

---

## 🚨 Critical Reminders

### When to Use This Checklist

**ALWAYS use for**:
- User-facing features
- Data flow changes
- Integration with external services
- Performance-critical code
- Security-related changes

**This checklist is MANDATORY for**:
- PC-series stories (Protected Core related)
- Features involving AI/voice
- Database schema changes
- API contract changes

### Common Pitfalls to Avoid

1. **Assuming Data "Passes Through"**
   - ❌ Wrong: "I passed metadata to the API, so it must work"
   - ✅ Right: "I verified metadata at API route, token creation, LiveKit room, and Python agent"

2. **Testing with Mocks Instead of Real Data**
   - ❌ Wrong: Mock data shows it works
   - ✅ Right: Real database data + real API calls + real AI response

3. **Not Verifying Final Output**
   - ❌ Wrong: "Code looks correct"
   - ✅ Right: "I listened to AI greeting and it said the right grade/subject"

4. **Incomplete Integration Point Testing**
   - ❌ Wrong: "I tested the frontend change"
   - ✅ Right: "I tested frontend → API → LiveKit → Python → AI → output"

5. **Skipping Edge Cases**
   - ❌ Wrong: "Works for Grade 12 Physics"
   - ✅ Right: "Works for all grades 9-12, all subjects, and missing data"

---

## 📚 Appendix

### A. Quick Reference Commands

```bash
# TypeScript verification
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app
pnpm run typecheck

# Run all tests
pnpm run test:all

# Start frontend (port 3006)
pnpm run dev

# Start Python agent
cd /Users/umasankrudhya/Projects/pinglearn/livekit-agent
source venv/bin/activate
python agent.py

# View Python logs
tail -f /path/to/python/logs

# Check database
# Open Supabase dashboard → profiles table
```

### B. Test Data Examples

```typescript
// Grade 9 test user
{
  grade: "9",
  preferred_subjects: ["Mathematics"],
  selected_topics: ["Algebra"]
}

// Grade 10 test user
{
  grade: "10",
  preferred_subjects: ["Science"],
  selected_topics: ["Physics"]
}

// Grade 11 test user
{
  grade: "11",
  preferred_subjects: ["Chemistry"],
  selected_topics: ["Organic Chemistry"]
}

// Grade 12 test user
{
  grade: "12",
  preferred_subjects: ["Physics"],
  selected_topics: ["Mechanics"]
}
```

### C. Expected Log Outputs

**Frontend Console**:
```
[DEBUG-METADATA] Profile loaded: { grade: "12", preferred_subjects: ["Physics"], ... }
[DEBUG-METADATA] Setting currentTopic to: Grade 12 Physics
[VoiceSessionManager] Creating session with topic: Grade 12 Physics
[VoiceSessionManager] Metadata extracted: { topic: "Grade 12 Physics", grade: "Grade 12", subject: "Physics" }
```

**Python Agent Logs**:
```
[METADATA] Loaded session context: {'topic': 'Grade 12 Physics', 'grade': 'Grade 12', 'subject': 'Physics'}
[PC-015] Using dynamic prompt: Grade 12 Physics - Grade 12 Physics
[Prompt] Generated for: Grade 12, Physics, Grade 12 Physics
```

### D. Evidence File Template

Save evidence in: `/Users/umasankrudhya/Projects/pinglearn/pinglearn-app/docs/evidence/[STORY-ID]-EVIDENCE.md`

```markdown
# [STORY-ID] UAT Evidence

## Test Date
2025-10-03

## Test Environment
- Frontend: localhost:3006
- Python Agent: Running
- Database: Supabase production

## UAT Scenarios

### Scenario 1: Grade 12 Physics
**Result**: PASS

**Screenshots**:
- ![Wizard](./screenshots/wizard-grade12-physics.png)
- ![Database](./screenshots/database-record.png)
- ![Classroom](./screenshots/classroom-topic.png)
- ![Active Session](./screenshots/active-session.png)

**Console Logs**:
```
[DEBUG-METADATA] Setting currentTopic to: Grade 12 Physics
[VoiceSessionManager] Metadata extracted: { grade: "Grade 12", subject: "Physics" }
```

**Python Logs**:
```
[METADATA] Loaded: {'grade': 'Grade 12', 'subject': 'Physics'}
[PC-015] Using dynamic prompt: Grade 12 Physics
```

**AI Greeting** (transcribed):
"Hello! I'm your AI Physics teacher for Grade 12. I'm excited to help you learn Physics today. What would you like to work on?"

**Verification**:
- ✅ Mentions "Grade 12"
- ✅ Mentions "Physics"
- ✅ Does NOT mention "Grade 10" or "Mathematics"

## Sign-Off
- [x] All tests passed
- [x] Evidence collected
- [x] Ready for production
```

---

## 🎯 Summary

**This checklist prevents incomplete fixes by ensuring**:

1. ✅ **Complete Data Flow Verification** - Trace data through EVERY transformation
2. ✅ **Integration Point Testing** - Test EVERY boundary between systems
3. ✅ **Real Data Testing** - Use actual database/API/AI (not mocks)
4. ✅ **Final Output Verification** - Verify what user actually sees/hears
5. ✅ **Automated Regression Tests** - Prevent bugs from returning
6. ✅ **Manual UAT** - Human verification of complete journey
7. ✅ **Evidence Collection** - Document proof it works

**Use this checklist for EVERY change. No exceptions.**

**Never claim "done" until ALL checkboxes are checked.**

---

**Version**: 1.0
**Created**: 2025-10-03
**Last Updated**: 2025-10-03
**Status**: ACTIVE - MANDATORY FOR ALL AGENTS
