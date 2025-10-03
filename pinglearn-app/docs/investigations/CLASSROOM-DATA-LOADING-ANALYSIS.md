# Classroom Component Data Loading Investigation Report

**Investigation Date**: 2025-10-03
**Component**: `src/app/classroom/page.tsx`
**Objective**: Identify all data fetching operations and determine what's dynamic vs hardcoded

---

## Executive Summary

The classroom component **DOES fetch user preferences** from the database, specifically:
- User profile (grade, preferred_subjects, selected_topics)
- Authentication state

However, several UI elements in child components display **HARDCODED curriculum data** that should be dynamic based on user preferences.

---

## Complete Data Flow Analysis

### 1. Authentication & User Profile Loading

**Location**: `src/app/classroom/page.tsx` (Lines 85-175)

**Data Fetched**:
```typescript
useEffect(() => {
  checkAuth();
}, []);

async function checkAuth() {
  // Step 1: Fetch authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    router.push('/login?redirect=/classroom');
    return;
  }

  setUserId(user.id);

  // Step 2: Fetch user profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('grade, preferred_subjects, selected_topics')
    .eq('id', user.id)
    .single();

  // Step 3: Set currentTopic from profile
  if (profile?.preferred_subjects && profile.preferred_subjects.length > 0) {
    const topic = `Grade ${profile.grade} ${profile.preferred_subjects[0]}`;
    setCurrentTopic(topic);
  } else {
    // FALLBACK: Uses hardcoded default
    setCurrentTopic('General Mathematics');
  }
}
```

**Database Schema** (from `001_initial_schema.sql`):
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Evidence**:
- Lines 158-174 show database query execution
- Debug logs at lines 165-174 confirm data loading
- Topic is dynamically constructed from `profile.grade` + `profile.preferred_subjects[0]`

---

### 2. Session Management Data

**Source**: Custom hooks (NO database calls within hooks)

**Hook**: `useVoiceSession` (`src/hooks/useVoiceSession.ts`)
- **Purpose**: Manages voice session state via VoiceSessionManager singleton
- **Data**: Session object, metrics, controls, status
- **Source**: In-memory state management (NOT database)
- **Props Received**: None - uses singleton pattern

**Hook**: `useSessionState` (`src/hooks/useSessionState.ts`)
- **Purpose**: Tracks real-time session state changes
- **Data**: Connection status, uptime, quality metrics
- **Source**: Derived from VoiceSessionManager events (NOT database)
- **Props Received**: None - subscribes to manager events

**Hook**: `useSessionMetrics` (`src/hooks/useSessionMetrics.ts`)
- **Purpose**: Provides live session metrics
- **Data**: Duration, engagement, math equations count, quality score
- **Source**: Calculated from session events (NOT database)
- **Props Received**: None - computed metrics

---

### 3. Component Props Data Flow

**Data Passed to Child Components**:

```typescript
// From page.tsx to LiveKitRoom (Lines 557-574)
<LiveKitRoom
  roomName={roomName}              // From VoiceSessionManager
  participantId={userId}            // From auth.getUser()
  participantName={`Student-${userId.slice(0, 8)}`}
  metadata={{
    topic: currentTopic,            // From database profile
    grade: extractGrade(currentTopic),
    subject: extractSubject(currentTopic)
  }}
/>

// From page.tsx to TabsContainer (Lines 496-510)
<TabsContainer
  sessionId={sessionId}             // From useSessionState hook
  voiceSessionId={session?.id}      // From useVoiceSession hook
  topic={currentTopic}              // From database profile
  sessionState={sessionState}       // From useSessionState hook
  liveMetrics={liveMetrics}         // From useSessionMetrics hook
  qualityScore={qualityScore}       // From useSessionMetrics hook
  engagementTrend={engagementTrend} // From useSessionMetrics hook
  audioControls={audioControls}     // Local state
  onVolumeChange={setTeacherVolume}
  onMuteToggle={toggleTeacherMute}
  duration={duration}               // Calculated from session.startedAt
  isPaused={isPaused}               // From sessionControlState
/>

// From page.tsx to TeachingBoardSimple (Lines 492-495)
<TeachingBoardSimple
  sessionId={sessionId}             // From useSessionState hook
  topic={currentTopic}              // From database profile
/>
```

---

### 4. Hardcoded Data Identified

**CRITICAL FINDING**: `SessionInfoPanel` component contains hardcoded curriculum data

**Location**: `src/components/classroom/SessionInfoPanel.tsx`

**Hardcoded Elements**:

1. **Progress Bar** (Line 152):
```typescript
<Progress value={45} className="h-1.5" />  // HARDCODED: 45%
```

2. **Curriculum Breadcrumb** (Lines 251-257):
```typescript
<div className="flex items-center text-xs text-muted-foreground flex-wrap">
  <span>Grade 10</span>               // HARDCODED: Should be from profile.grade
  <ChevronRight className="w-3 h-3 mx-1" />
  <span>Mathematics</span>            // HARDCODED: Should be from profile.preferred_subjects
  <ChevronRight className="w-3 h-3 mx-1" />
  <span className="text-foreground">Algebra</span>  // HARDCODED: Should be from selected topic
</div>
```

3. **Navigation Buttons** (Lines 260-275):
```typescript
<Button variant="outline" size="sm">← Previous</Button>
<Button variant="outline" size="sm">Next →</Button>
// HARDCODED: No actual navigation logic, should load from curriculum_data
```

4. **Smart Notes Preview** (Lines 289-291):
```typescript
<p className="text-xs text-muted-foreground leading-relaxed">
  AI-generated notes will be ready at the end of this session
</p>
// HARDCODED: Generic message, doesn't check actual note generation status
```

---

### 5. Missing Database Integrations

**Components That SHOULD Fetch Data But DON'T**:

1. **SessionInfoPanel** - Should fetch:
   - Current curriculum position from `curriculum_data` table
   - Textbook chapter information from `textbooks` and `chapters` tables
   - Actual progress percentage from `learning_sessions` table
   - Selected topic details from `profiles.selected_topics`

2. **TabsContainer** - Currently relies solely on props:
   - Should fetch curriculum navigation data
   - Should load textbook hierarchy for topic browsing

---

## Database Schema Available But Unused

**Available Tables** (from migrations):

```sql
-- From 002_profiles_and_curriculum.sql
curriculum_data (
  id UUID,
  grade INTEGER (9-12),
  subject TEXT,
  topics TEXT[],  -- Array of topic names
  created_at TIMESTAMPTZ
)

-- From 001_initial_schema.sql
textbooks (
  id UUID,
  title TEXT,
  grade INTEGER,
  subject TEXT,
  total_pages INTEGER,
  status TEXT
)

chapters (
  id UUID,
  textbook_id UUID,
  chapter_number INTEGER,
  title TEXT,
  topics TEXT[],
  start_page INTEGER,
  end_page INTEGER
)

-- Pre-loaded curriculum data for Grades 9-12 CBSE
-- Example: Grade 10 Mathematics topics:
-- ['Real Numbers', 'Polynomials', 'Quadratic Equations', ...]
```

**These tables contain rich curriculum data but are NOT used in the classroom component!**

---

## Data Source Summary

| Data Element | Source | Type | Evidence |
|-------------|--------|------|----------|
| **User ID** | `supabase.auth.getUser()` | Dynamic DB | Line 149 |
| **User Profile** | `supabase.from('profiles')` | Dynamic DB | Line 159-163 |
| **Grade** | Profile query | Dynamic DB | Line 161 |
| **Preferred Subjects** | Profile query | Dynamic DB | Line 161 |
| **Selected Topics** | Profile query | Dynamic DB | Line 161 |
| **Current Topic** | Derived from profile | Dynamic | Line 169-171 |
| **Session State** | `useSessionState` hook | In-Memory | Singleton events |
| **Voice Session** | `useVoiceSession` hook | In-Memory | Singleton events |
| **Live Metrics** | `useSessionMetrics` hook | Computed | Derived metrics |
| **Audio Controls** | `useState` | Local State | Line 69-74 |
| **Progress %** | **HARDCODED** | Static | Line 152 ⚠️ |
| **Curriculum Breadcrumb** | **HARDCODED** | Static | Lines 251-257 ⚠️ |
| **Navigation Buttons** | **HARDCODED** | Static | Lines 260-275 ⚠️ |

---

## Critical Issues Identified

### Issue 1: Curriculum Data Not Integrated

**Problem**: SessionInfoPanel displays hardcoded "Grade 10 > Mathematics > Algebra" instead of user's actual curriculum position.

**Should Use**:
- `profile.grade` → "Grade {grade}"
- `profile.preferred_subjects[0]` → Subject name
- `profile.selected_topics` → Current topic within subject

**Available Data** (Not Used):
```typescript
// From checkAuth() function
profile.grade                  // e.g., 10
profile.preferred_subjects     // e.g., ['Mathematics']
profile.selected_topics        // e.g., [{topic: 'Quadratic Equations', ...}]
```

### Issue 2: Progress Calculation Missing

**Problem**: Progress bar shows hardcoded 45%.

**Should Calculate**:
```typescript
// Potential calculation (NOT IMPLEMENTED):
const totalTopics = curricula_data.topics.length;
const completedTopics = learning_sessions.completed_topics.length;
const progressPercent = (completedTopics / totalTopics) * 100;
```

### Issue 3: No Textbook Integration

**Problem**: No reference to actual textbook content despite rich database schema.

**Available But Unused**:
- `textbooks` table with NCERT Grade 10 Mathematics
- `chapters` table with chapter hierarchy
- `content_chunks` table with actual lesson content

---

## Recommendations

### Immediate Fixes Needed

1. **Pass User Profile to SessionInfoPanel**:
```typescript
// In page.tsx
const [userProfile, setUserProfile] = useState(null);

// In checkAuth()
setUserProfile(profile);

// Pass to TabsContainer
<TabsContainer
  userProfile={userProfile}  // NEW PROP
  // ... existing props
/>
```

2. **Create Curriculum Navigation Hook**:
```typescript
// hooks/useCurriculum.ts (NEW FILE)
export function useCurriculum(grade: number, subject: string) {
  const [topics, setTopics] = useState([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  useEffect(() => {
    // Fetch from curriculum_data table
    fetchCurriculumTopics(grade, subject);
  }, [grade, subject]);

  return { topics, currentTopicIndex, progress, navigation };
}
```

3. **Update SessionInfoPanel Props**:
```typescript
interface SessionInfoPanelProps {
  // ... existing props
  userProfile: {
    grade: number;
    preferred_subjects: string[];
    selected_topics: any[];
  };
  curriculumProgress?: number;
  currentChapter?: string;
}
```

---

## Conclusion

**ANSWER TO INVESTIGATION QUESTION**:

✅ **YES**, the classroom component DOES fetch user preferences from the database.

⚠️ **HOWEVER**, the fetched data is only partially used:
- **Used**: `currentTopic` prop is derived from database profile
- **Not Used**: Grade, subjects, and selected topics for UI breadcrumbs
- **Not Integrated**: Rich curriculum data from `curriculum_data` table
- **Hardcoded**: Progress %, curriculum navigation, topic hierarchy

**The component loads the right data but doesn't fully utilize it in child components.**

---

## Next Steps

1. **Immediate**: Replace hardcoded breadcrumb with actual user profile data
2. **Short-term**: Implement curriculum navigation using `curriculum_data` table
3. **Long-term**: Build complete textbook integration with chapter/topic tracking

**Estimated Effort**:
- Fix breadcrumb: 1 hour
- Add curriculum hook: 3-4 hours
- Full textbook integration: 2-3 days

---

**Investigation Complete** ✅
