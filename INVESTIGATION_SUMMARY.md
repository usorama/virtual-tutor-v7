# Backend Preferences Storage Investigation - Executive Summary

**Date**: October 3, 2025
**Investigation Type**: User Preferences Storage Backend Analysis
**Status**: ✅ COMPLETE

---

## 🎯 MISSION OBJECTIVE

Find and analyze all API endpoints and database operations that STORE user preferences (grade, subject, textbook selections from the wizard).

---

## 🔍 KEY DISCOVERIES

### ✅ What's Working

1. **Storage Mechanism**: Server Action in `/src/lib/wizard/actions.ts`
   - Function: `saveWizardSelections()`
   - Method: Supabase UPSERT operation
   - Table: `profiles`

2. **Data Successfully Stored**:
   - ✅ Grade (integer 9-12)
   - ✅ Learning Purpose ('new_class', 'revision', 'exam_prep')
   - ✅ Preferred Subjects (array of subject names)
   - ✅ Selected Topics (JSONB object mapping subjects to topic arrays)

3. **Security**: Properly secured with RLS policies and authentication checks

---

## 🚨 CRITICAL FINDING: MISSING TEXTBOOK STORAGE

### The Problem

**USER SELECTS TEXTBOOK → SELECTION IS LOST**

When a user selects "Mathematics" in the wizard:
- The system knows the specific textbook ID (e.g., "NCERT Mathematics X" with UUID `a1b2c3d4...`)
- Only the subject name "Mathematics" is saved
- **The textbook ID is never stored in the database**

### Why This Matters

1. If multiple Mathematics textbooks exist for Grade 10, we can't determine which one the user selected
2. The AI tutor cannot load the correct textbook content
3. User intent is lost between sessions

### The Evidence

**Current Code** (`saveWizardSelections`):
```typescript
await supabase.from('profiles').upsert({
  grade: selections.grade,              // ✅ Saved
  preferred_subjects: selections.subjects, // ⚠️ Only ["Mathematics"], not the textbook ID
  selected_topics: selections.topics,    // ✅ Saved
  // ❌ MISSING: selected_textbook_id
})
```

**What's Available But Not Used**:
```typescript
// In getCurriculumData(), we have this data:
const curriculumData = textbooks.map(textbook => ({
  id: textbook.id,        // ⚠️ TEXTBOOK UUID AVAILABLE HERE
  subject: textbook.subject,
  topics: [...]
}))
// But this ID is never saved!
```

---

## 📊 COMPLETE DATA FLOW

### Current Implementation

```mermaid
User Wizard → WizardContext → saveWizardSelections() → Supabase profiles table

Saved Fields:
├── grade: 10
├── learning_purpose: 'new_class'
├── preferred_subjects: ['Mathematics', 'Science']
└── selected_topics: {"Mathematics": [...], "Science": [...]}

Missing:
└── ❌ selected_textbooks: {"Mathematics": "textbook-uuid-1", "Science": "textbook-uuid-2"}
```

---

## 💾 DATABASE SCHEMA

### Profiles Table (Simplified)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  learning_purpose TEXT,
  -- ❌ NO COLUMN for selected_textbooks
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🛠️ RECOMMENDED FIX

### 1. Add Database Column

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_textbooks JSONB DEFAULT '{}'::jsonb;
```

### 2. Update WizardState Interface

```typescript
export interface WizardState {
  currentStep: number
  grade: number | null
  purpose: LearningPurpose | null
  subjects: string[]
  topics: Record<string, string[]>
  textbooks: Record<string, string>  // ⭐ NEW: {"Mathematics": "uuid"}
  isComplete: boolean
}
```

### 3. Update saveWizardSelections

```typescript
await supabase.from('profiles').upsert({
  // ... existing fields ...
  selected_textbooks: selections.textbooks,  // ⭐ NEW
})
```

### 4. Capture Textbook ID in Wizard

When user selects a subject, also capture the corresponding textbook ID:

```typescript
// In wizard component:
const handleSubjectSelect = (subject: string) => {
  const textbookForSubject = curriculumData.find(c => c.subject === subject)
  if (textbookForSubject) {
    updateTextbook(subject, textbookForSubject.id)  // ⭐ NEW
  }
}
```

---

## 📋 OTHER FINDINGS

### Type Definition Issues

**File**: `/src/types/database.ts`

The profiles table type definition is incomplete - missing many columns that exist in the actual database:

```typescript
// CURRENT (Incomplete):
profiles: {
  Row: {
    id: string;
    email: string;
    // ❌ Missing: grade, preferred_subjects, selected_topics, etc.
  }
}

// SHOULD INCLUDE all columns from migrations
```

### Validation Gaps

**No explicit validation** before saving - relies on:
- TypeScript type checking
- Database constraints
- UI-level validation

**Recommendation**: Add server-side validation in `saveWizardSelections()`.

---

## 📈 IMPACT ANALYSIS

### User Impact

| Scenario | Current Behavior | Desired Behavior |
|----------|------------------|------------------|
| User selects Math textbook A | Only "Mathematics" saved | Textbook A ID saved |
| User returns to app | System doesn't know which textbook | System loads textbook A |
| Multiple textbooks available | Ambiguous selection | Specific textbook identified |

### Developer Impact

- **Type Safety**: Missing types cause potential runtime errors
- **Data Integrity**: Incomplete preference storage
- **Feature Development**: Cannot implement textbook-specific features

---

## ✅ DELIVERABLES

1. ✅ **Complete Investigation Report**: `BACKEND_PREFERENCES_STORAGE_INVESTIGATION.md`
   - All API endpoints documented
   - Complete database schema analysis
   - Data flow diagrams
   - Security analysis
   - Recommendations with code examples

2. ✅ **This Executive Summary**: Quick reference for stakeholders

3. ✅ **Evidence**: Code snippets, database queries, and actual implementation details

---

## 🎬 NEXT STEPS

### Immediate (Priority 1)

1. Add `selected_textbooks` column to profiles table
2. Update `WizardState` interface to include textbook mapping
3. Modify `saveWizardSelections()` to save textbook IDs
4. Update wizard UI to capture textbook IDs when subjects are selected

### Short-term (Priority 2)

1. Fix TypeScript type definitions for profiles table
2. Add server-side validation
3. Create tests for the new textbook storage

### Long-term (Priority 3)

1. Create dedicated `/api/preferences` endpoint for updates
2. Add preference change history tracking
3. Implement preference sync across devices

---

## 📞 CONTACT FOR QUESTIONS

**Investigation Lead**: Claude (Backend Architecture Specialist)
**Review Status**: Ready for implementation
**Full Report**: See `BACKEND_PREFERENCES_STORAGE_INVESTIGATION.md`

---

**Last Updated**: October 3, 2025
**Document Version**: 1.0
**Classification**: Internal Development Documentation
