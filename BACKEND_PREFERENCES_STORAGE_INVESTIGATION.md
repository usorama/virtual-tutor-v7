# Backend User Preferences Storage Investigation Report

**Investigation Date**: October 3, 2025
**Objective**: Analyze the backend API and database operations that STORE user preferences (grade, subject, textbook)
**Status**: COMPLETE - CRITICAL FINDING: NO TEXTBOOK SELECTION STORAGE

---

## EXECUTIVE SUMMARY

### KEY FINDINGS

1. **MISSING FEATURE**: The wizard does NOT store textbook selection - only grade, subjects, and topics
2. **Working Features**: Grade, learning purpose, subjects, and topics are properly stored
3. **Database Schema**: `profiles` table has comprehensive columns but missing textbook-related fields
4. **API Endpoint**: Single server action handles all preference storage via `saveWizardSelections()`

### CRITICAL GAP IDENTIFIED

**The textbook selection step shown in the UI is NOT being saved to the database.**

---

## API ENDPOINTS FOR PREFERENCE STORAGE

### PRIMARY ENDPOINT: Server Action (Not REST API)

**File**: `/src/lib/wizard/actions.ts`
**Function**: `saveWizardSelections()`
**Method**: Server-side action (Next.js Server Actions)

#### Complete Implementation:

```typescript
export async function saveWizardSelections(selections: WizardState): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const userResponse = await getUser()

    if (!userResponse.success || !userResponse.data?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const user = userResponse.data.user

    const supabase = await createClient()

    // Update or insert profile with selections
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        grade: selections.grade,                    // ✅ SAVED
        learning_purpose: selections.purpose,       // ✅ SAVED
        preferred_subjects: selections.subjects,    // ✅ SAVED
        selected_topics: selections.topics,         // ✅ SAVED
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error saving wizard selections:', profileError)
      return { success: false, error: profileError.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in saveWizardSelections:', error)
    return { success: false, error: 'Failed to save selections' }
  }
}
```

#### What Gets Saved:
- ✅ `grade` (integer)
- ✅ `learning_purpose` (text: 'new_class', 'revision', 'exam_prep')
- ✅ `preferred_subjects` (text array)
- ✅ `selected_topics` (JSONB object with subject → topics mapping)
- ❌ `textbook_id` - **NOT SAVED**
- ❌ `textbook_title` - **NOT SAVED**

---

## DATABASE SCHEMA ANALYSIS

### PROFILES TABLE - Current Schema

**Source**: `/supabase/migrations/001_initial_schema.sql` + subsequent migrations

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,

  -- WIZARD SELECTIONS (SAVED)
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  learning_purpose TEXT CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep')),

  -- LEARNING PREFERENCES (SAVED VIA OTHER FLOWS)
  learning_pace TEXT DEFAULT 'medium' CHECK (learning_pace IN ('slow', 'medium', 'fast')),
  preferred_explanation_style TEXT DEFAULT 'verbal' CHECK (preferred_explanation_style IN ('visual', 'verbal', 'practical')),
  topics_mastered TEXT[] DEFAULT '{}',
  weak_areas TEXT[] DEFAULT '{}',
  current_chapter TEXT,

  -- SESSION TRACKING
  total_session_minutes INTEGER DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  preferred_voice_settings JSONB,

  -- NOTES TRACKING
  notes_generated BOOLEAN DEFAULT FALSE,
  notes_word_count INTEGER DEFAULT 0,
  notes_concept_count INTEGER DEFAULT 0,

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### MISSING COLUMNS for Textbook Storage

The following columns DO NOT EXIST in the profiles table:

- `selected_textbook_id` (UUID reference to textbooks table)
- `preferred_textbook_id` (UUID reference to textbooks table)
- `selected_textbook_title` (TEXT)

### EVIDENCE: Admin Routes Show What Could Be Stored

**File**: `/src/app/api/admin/fix-profiles-table/route.ts`

This admin route shows how textbook preferences COULD be stored:

```typescript
// Example from admin route - NOT used in wizard
await supabase
  .from('profiles')
  .upsert({
    // ... other fields ...
    preferences: {
      grade: 0,
      subject: 'Healthcare Administration',
      learning_style: 'professional',
      preferred_textbook_id: textbook.id,      // ⚠️ Stored in JSONB preferences
      preferred_textbook: textbook.title,       // ⚠️ Stored in JSONB preferences
      session_duration: 30,
      focus_areas: [...]
    },
    updated_at: new Date().toISOString()
  })
```

**Note**: This uses a JSONB `preferences` column that exists but is NOT used by the wizard.

---

## WIZARD STATE TYPE DEFINITION

**File**: `/src/types/wizard.ts`

```typescript
export interface WizardState {
  currentStep: number
  grade: number | null                          // ✅ Saved to DB
  purpose: LearningPurpose | null               // ✅ Saved to DB
  subjects: string[]                            // ✅ Saved to DB
  topics: Record<string, string[]>              // ✅ Saved to DB
  isComplete: boolean
}

export interface CurriculumData {
  id: string                                    // This is the textbook ID
  grade: number
  subject: string
  topics: string[]
  created_at?: string
}
```

**CRITICAL OBSERVATION**:
- The wizard state does NOT include a `textbook_id` or `selected_textbook` field
- When a subject is selected, the corresponding `CurriculumData.id` (textbook ID) is available but NOT stored

---

## DATA FLOW ANALYSIS

### Current Flow (What Works):

1. **User selects grade** → `updateGrade(grade)` → Stored in WizardContext
2. **User selects subjects** → `updateSubjects(subjects)` → Stored in WizardContext
3. **User selects topics** → `updateTopics(subject, topics)` → Stored in WizardContext
4. **User selects purpose** → `updatePurpose(purpose)` → Stored in WizardContext
5. **User clicks "Finish"** → `saveWizardSelections(state)` → **UPSERT to profiles table**

### Database Operation (UPSERT):

```typescript
await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    email: user.email!,
    grade: selections.grade,                    // ✅ Column exists
    learning_purpose: selections.purpose,       // ✅ Column exists
    preferred_subjects: selections.subjects,    // ✅ Column exists
    selected_topics: selections.topics,         // ✅ Column exists (JSONB)
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id'  // Update if user already exists
  })
```

### What's Missing:

```typescript
// SHOULD BE ADDED (but currently missing):
selected_textbook_id: textbookId,  // ❌ Field doesn't exist in WizardState
selected_textbook_title: textbookTitle,  // ❌ Field doesn't exist in WizardState

// OR using the existing JSONB preferences column:
preferences: {
  ...existingPreferences,
  preferred_textbook_id: textbookId,
  preferred_textbook_title: textbookTitle,
}
```

---

## EXAMPLE REQUEST/RESPONSE

### Successful Save Operation

**Trigger**: User completes wizard and clicks "Finish Setup"
**Function Call**: `await saveWizardSelections(state)`

**Input Payload** (WizardState):
```json
{
  "currentStep": 4,
  "grade": 10,
  "purpose": "new_class",
  "subjects": ["Mathematics", "Science"],
  "topics": {
    "Mathematics": ["Real Numbers", "Polynomials", "Quadratic Equations"],
    "Science": ["Chemical Reactions", "Acids Bases and Salts"]
  },
  "isComplete": true
}
```

**Database Operation**:
```sql
INSERT INTO profiles (id, email, grade, learning_purpose, preferred_subjects, selected_topics, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'student@example.com',
  10,
  'new_class',
  ARRAY['Mathematics', 'Science'],
  '{"Mathematics": ["Real Numbers", "Polynomials", "Quadratic Equations"], "Science": ["Chemical Reactions", "Acids Bases and Salts"]}',
  '2025-10-03T10:30:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  grade = EXCLUDED.grade,
  learning_purpose = EXCLUDED.learning_purpose,
  preferred_subjects = EXCLUDED.preferred_subjects,
  selected_topics = EXCLUDED.selected_topics,
  updated_at = EXCLUDED.updated_at;
```

**Response** (Success):
```json
{
  "success": true,
  "error": null
}
```

**Response** (Failure):
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

---

## VALIDATION & SANITIZATION

### Input Validation

**Location**: `saveWizardSelections()` function

1. **Authentication Check**:
   ```typescript
   if (!userResponse.success || !userResponse.data?.user) {
     return { success: false, error: 'User not authenticated' }
   }
   ```

2. **Type Safety**: TypeScript enforces WizardState interface
   ```typescript
   grade: number | null  // Must be number or null
   purpose: LearningPurpose | null  // Must be 'new_class' | 'revision' | 'exam_prep' | null
   subjects: string[]  // Must be array of strings
   topics: Record<string, string[]>  // Must be object with string keys and string array values
   ```

3. **Database Constraints**:
   ```sql
   grade INTEGER CHECK (grade >= 1 AND grade <= 12)
   learning_purpose TEXT CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep'))
   ```

### Data Sanitization

**NO EXPLICIT SANITIZATION** - Relies on:
- TypeScript type checking
- Supabase parameterized queries (prevents SQL injection)
- Database CHECK constraints

**SECURITY NOTE**: The data comes from controlled UI selections (dropdowns, checkboxes) rather than free-form text input, reducing injection risks.

---

## RELATED API ENDPOINTS

### Read Operations (GET)

**Function**: `getUserProfile()`
**File**: `/src/lib/wizard/actions.ts`

```typescript
export async function getUserProfile(): Promise<{
  data: {
    grade: number | null
    learning_purpose: string | null
    preferred_subjects: string[] | null
    selected_topics: Record<string, string[]> | null
  } | null
  error: string | null
}>
```

**Database Query**:
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('grade, learning_purpose, preferred_subjects, selected_topics')
  .eq('id', user.id)
  .single()
```

### Utility Functions

1. **`getCurriculumData(grade: number)`** - Fetches available subjects and topics for a grade
2. **`checkWizardCompletion()`** - Checks if user has completed wizard setup
3. **`completeWizard()`** - Redirects to dashboard after successful save

---

## BUGS & ISSUES IDENTIFIED

### 🔴 CRITICAL BUG #1: Missing Textbook Storage

**Severity**: HIGH
**Impact**: User's textbook selection is lost after wizard completion

**Problem**:
- User selects a subject (e.g., "Mathematics")
- System internally knows the textbook ID (from `CurriculumData.id`)
- Textbook ID is NEVER saved to the database
- Only the subject name is saved in `preferred_subjects` array

**Evidence**:
```typescript
// getCurriculumData returns this data:
const curriculumData: CurriculumData[] = textbooks?.map((textbook: any) => ({
  id: textbook.id,        // ⚠️ TEXTBOOK ID AVAILABLE HERE
  grade: textbook.grade,
  subject: textbook.subject,
  topics: textbook.chapters?.flatMap((chapter: any) => chapter.topics || []) || []
}))

// But saveWizardSelections only stores:
preferred_subjects: selections.subjects,  // ❌ Just ["Mathematics"], not the textbook ID
```

**User Impact**:
- System cannot determine WHICH Mathematics textbook the user selected
- If multiple Mathematics textbooks exist for Grade 10, the selection is ambiguous
- AI tutor cannot load the correct textbook content

**Recommended Fix**:
1. Add `selectedTextbooks: Record<string, string>` to WizardState (subject → textbook_id mapping)
2. Add `selected_textbooks` JSONB column to profiles table
3. Update `saveWizardSelections()` to save this mapping

---

### 🟡 ISSUE #2: Incomplete Type Definitions

**File**: `/src/types/database.ts`

**Problem**: The `profiles` table Row type is incomplete compared to actual schema:

```typescript
// CURRENT (Incomplete):
profiles: {
  Row: {
    id: string;
    email: string;
    full_name: string | null;
    voice_preferences: VoicePreferences | null;
    learning_style: LearningStyle | null;
    avatar_url: string | null;
    timezone: string | null;
    date_of_birth: string | null;
    created_at: string;
    updated_at: string;
  };
  // ...
}
```

**Missing Fields**:
- `grade`
- `preferred_subjects`
- `selected_topics`
- `learning_purpose`
- `learning_pace`
- `preferred_explanation_style`
- `topics_mastered`
- `weak_areas`
- `current_chapter`
- `total_session_minutes`
- `last_session_at`
- `preferred_voice_settings`
- `notes_generated`
- `notes_word_count`
- `notes_concept_count`

**Impact**: Type safety violations when accessing these fields

---

### 🟢 ISSUE #3: Data Model Mismatch

**Problem**: The wizard stores topics as a nested object, but the database schema shows it as an array:

**Migration**:
```sql
selected_topics JSONB DEFAULT '[]'::jsonb
```

**Actual Data Structure**:
```json
{
  "Mathematics": ["Real Numbers", "Polynomials"],
  "Science": ["Chemical Reactions"]
}
```

**Impact**: Minor - JSONB can store both, but the default `'[]'::jsonb` is misleading

---

## TEXTBOOK HIERARCHY & RELATIONSHIPS

### How Textbooks Relate to Subjects

**Query Flow**:
```typescript
// 1. Fetch textbooks for selected grade
const { data: textbooks } = await supabase
  .from('textbooks')
  .select(`
    id,           // ⚠️ This is the textbook UUID
    title,
    grade,
    subject,      // e.g., "Mathematics"
    chapters:chapters(
      id,
      title,
      topics
    )
  `)
  .eq('grade', grade)
  .eq('status', 'ready')
  .order('subject')

// 2. Transform into CurriculumData
const curriculumData: CurriculumData[] = textbooks?.map(textbook => ({
  id: textbook.id,        // Textbook UUID (e.g., "a1b2c3...")
  grade: textbook.grade,
  subject: textbook.subject,
  topics: textbook.chapters?.flatMap(chapter => chapter.topics || []) || []
}))
```

### Example Database State

**textbooks table**:
```sql
id                                   | title                  | grade | subject      | status
-------------------------------------|------------------------|-------|--------------|-------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | NCERT Mathematics X    | 10    | Mathematics  | ready
b2c3d4e5-f6g7-8901-bcde-fg2345678901 | NCERT Science X        | 10    | Science      | ready
```

**profiles table** (after wizard):
```sql
id          | email              | grade | preferred_subjects           | selected_topics
------------|-------------------|-------|------------------------------|------------------
user-uuid-1 | student@email.com | 10    | ['Mathematics', 'Science']   | {"Mathematics": [...], "Science": [...]}
```

**MISSING LINK**: No way to know that "Mathematics" refers to textbook `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## PERFORMANCE CONSIDERATIONS

### Database Operations

1. **UPSERT Performance**:
   - Uses `ON CONFLICT (id)` for efficient update-or-insert
   - Primary key lookup is O(log n) with B-tree index
   - Single database round-trip

2. **JSONB Storage**:
   - `selected_topics` stored as JSONB allows flexible structure
   - GIN index support for fast JSON queries (if needed)
   - Minimal overhead compared to relational structure

3. **Array Storage**:
   - `preferred_subjects` as TEXT[] is efficient for small arrays
   - PostgreSQL has native array support with indexing

### Potential Bottlenecks

- **None identified** - The save operation is simple and efficient
- **Future concern**: If textbook mapping is added, ensure proper indexing

---

## SECURITY ANALYSIS

### Row Level Security (RLS)

**Policy**: Users can only view/update their own profile

```sql
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);
```

### Authentication Flow

1. **Server Action Execution**: Requires authenticated session
2. **User Validation**: `getUser()` checks Supabase auth state
3. **Authorization**: User can only update their own profile (RLS enforced)

### Potential Vulnerabilities

**NONE CRITICAL** - The implementation follows security best practices:
- ✅ Server-side validation
- ✅ RLS policies
- ✅ Parameterized queries (SQL injection protection)
- ✅ Type-safe operations

---

## COMPARISON: What Frontend Sends vs What Backend Stores

### Frontend Context (WizardContext.tsx)

**Managed State**:
```typescript
{
  currentStep: 4,
  grade: 10,
  purpose: 'new_class',
  subjects: ['Mathematics'],
  topics: {
    'Mathematics': ['Real Numbers', 'Polynomials']
  },
  isComplete: true
}
```

### Backend Storage (profiles table)

**Actual Columns Populated**:
```sql
UPDATE profiles SET
  grade = 10,                                           -- ✅ Direct mapping
  learning_purpose = 'new_class',                       -- ✅ Direct mapping
  preferred_subjects = ARRAY['Mathematics'],            -- ✅ Array conversion
  selected_topics = '{"Mathematics": [...]}'::jsonb,    -- ✅ JSON conversion
  updated_at = '2025-10-03T10:30:00Z'                  -- ✅ Auto-generated
WHERE id = 'user-uuid';
```

**Missing Mappings**:
```sql
-- ❌ NOT STORED:
selected_textbook_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
selected_textbook_title = 'NCERT Mathematics X'
```

---

## RECOMMENDATIONS

### 1. Add Textbook Storage (CRITICAL)

**Add to WizardState**:
```typescript
export interface WizardState {
  currentStep: number
  grade: number | null
  purpose: LearningPurpose | null
  subjects: string[]
  topics: Record<string, string[]>
  textbooks: Record<string, string>  // ⭐ NEW: subject → textbook_id mapping
  isComplete: boolean
}
```

**Database Migration**:
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_textbooks JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.selected_textbooks IS
'Mapping of subject to selected textbook ID: {"Mathematics": "uuid", "Science": "uuid"}';
```

**Update saveWizardSelections**:
```typescript
await supabase
  .from('profiles')
  .upsert({
    // ... existing fields ...
    selected_textbooks: selections.textbooks,  // ⭐ NEW
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'id'
  })
```

### 2. Fix Type Definitions

Update `/src/types/database.ts` to include all profile columns:

```typescript
profiles: {
  Row: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    grade: number | null;                              // ⭐ ADD
    preferred_subjects: string[] | null;               // ⭐ ADD
    selected_topics: Record<string, string[]> | null;  // ⭐ ADD
    learning_purpose: string | null;                   // ⭐ ADD
    // ... add all other columns ...
  };
  // ...
}
```

### 3. Add API Endpoint for Preference Updates

Create `/src/app/api/preferences/route.ts` for standalone preference updates:

```typescript
export async function PATCH(request: NextRequest) {
  // Allow users to update preferences without redoing entire wizard
  const { grade, subjects, topics, textbooks } = await request.json()
  // Validate and update profile
}
```

### 4. Add Validation Layer

Create `/src/lib/wizard/validation.ts`:

```typescript
export function validateWizardSelections(state: WizardState): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!state.grade || state.grade < 9 || state.grade > 12) {
    errors.push('Invalid grade selection')
  }

  if (!state.subjects || state.subjects.length === 0) {
    errors.push('At least one subject must be selected')
  }

  // Validate all subjects have corresponding textbook IDs
  for (const subject of state.subjects) {
    if (!state.textbooks[subject]) {
      errors.push(`Missing textbook selection for ${subject}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

---

## CONCLUSION

### Summary of Findings

1. **Storage Mechanism**: User preferences are saved via a Next.js Server Action (`saveWizardSelections`)
2. **Database Table**: `profiles` table in Supabase PostgreSQL
3. **Saved Fields**: grade, learning_purpose, preferred_subjects, selected_topics
4. **CRITICAL GAP**: Textbook selection is NOT saved despite being collected in the wizard
5. **Type Safety**: Type definitions are incomplete, leading to potential runtime errors

### Critical Action Items

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| 🔴 HIGH | Add textbook storage to wizard | User experience broken | Medium |
| 🟡 MEDIUM | Fix type definitions | Developer experience | Low |
| 🟢 LOW | Add validation layer | Data integrity | Low |
| 🟢 LOW | Create PATCH endpoint | User convenience | Medium |

### Next Steps

1. **Immediate**: Add `selected_textbooks` column and update wizard to save textbook IDs
2. **Short-term**: Fix TypeScript definitions to match actual schema
3. **Long-term**: Create comprehensive preference management API

---

**Investigation Completed**: October 3, 2025
**Investigator**: Claude (Backend Architecture Specialist)
**Status**: READY FOR IMPLEMENTATION
