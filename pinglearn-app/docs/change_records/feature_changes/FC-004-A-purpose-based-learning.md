# Change Record: Purpose-Based Learning Feature

**Template Version**: 3.0
**Change ID**: FC-004-A
**Related**: Split from original FC-004
**Status**: APPROVED ✅
**Approved**: 2025-09-23 at 15:42 PST
**Implementation**: IN PROGRESS
**Risk Level**: LOW ✅
**Value**: HIGH 🎯

---

## 🚨 Pre-Implementation Safety Check

```bash
# Create checkpoint before starting
git add .
git commit -m "checkpoint: Before FC-004-A - Purpose-Based Learning

CHECKPOINT: Safety point before adding learning purpose feature
- Adding purpose field to user profiles
- Creating purpose selection in wizard
- Zero visual changes, zero breaking changes
- Can rollback to this point if needed"
```

---

## Section 1: Executive Summary

### What We're Building
Adding a **learning purpose preference** to user profiles that allows students to specify their learning intent: New Class, Revision, or Exam Prep. The AI teacher will automatically adapt its teaching style based on this preference.

### Why This is Safe
- **ONE database column** added with safe default
- **ONE new component** in existing wizard flow
- **ZERO changes** to protected core
- **ZERO visual changes** to existing UI
- Python agent **already fetches** profile data

### Success Criteria
✅ Users can select learning purpose in wizard
✅ Purpose saved to database
✅ Python agent receives purpose automatically
✅ Existing users unaffected (default: 'new_class')

---

## Section 2: Technical Scope

### Database Changes

#### File: `/supabase/migrations/003_add_learning_purpose.sql`
```sql
-- Add learning_purpose to profiles with safe default
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS learning_purpose TEXT
CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep'))
DEFAULT 'new_class';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.learning_purpose IS
'Student learning intent: new_class (learning new topics), revision (reviewing known topics), exam_prep (intensive practice)';

-- Ensure all existing users have default
UPDATE public.profiles
SET learning_purpose = 'new_class'
WHERE learning_purpose IS NULL;
```

### Frontend Changes

#### 1. Update Wizard Types
**File**: `/src/types/wizard.ts`

Add to existing types:
```typescript
export type LearningPurpose = 'new_class' | 'revision' | 'exam_prep';

export interface WizardState {
  currentStep: number;
  grade: number | null;
  purpose: LearningPurpose | null; // NEW FIELD
  subjects: string[];
  topics: Record<string, string[]>;
  isComplete: boolean;
}

// Update step count
export const WIZARD_STEPS = {
  GRADE_SELECTION: 0,
  PURPOSE_SELECTION: 1,  // NEW STEP
  SUBJECT_SELECTION: 2,  // Was 1
  TOPIC_SELECTION: 3,    // Was 2
  SUMMARY: 4,            // Was 3
} as const;
```

#### 2. Create Purpose Selector Component
**File**: `/src/components/wizard/PurposeSelector.tsx`

```tsx
'use client';

import { BookOpen, RefreshCw, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LearningPurpose } from '@/types/wizard';

interface PurposeSelectorProps {
  selected: LearningPurpose | null;
  onSelect: (purpose: LearningPurpose) => void;
}

const purposes = [
  {
    id: 'new_class' as const,
    label: 'New Class',
    description: 'Learn new topics at your own pace',
    icon: BookOpen,
    color: 'text-blue-500'
  },
  {
    id: 'revision' as const,
    label: 'Revision',
    description: 'Quick review of topics you know',
    icon: RefreshCw,
    color: 'text-green-500'
  },
  {
    id: 'exam_prep' as const,
    label: 'Exam Prep',
    description: 'Intensive practice with key concepts',
    icon: GraduationCap,
    color: 'text-purple-500'
  }
];

export function PurposeSelector({ selected, onSelect }: PurposeSelectorProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {purposes.map((purpose) => {
        const Icon = purpose.icon;
        const isSelected = selected === purpose.id;

        return (
          <Card
            key={purpose.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(purpose.id)}
          >
            <CardContent className="p-6 text-center">
              <Icon className={cn("h-12 w-12 mx-auto mb-3", purpose.color)} />
              <h3 className="font-semibold text-lg mb-2">{purpose.label}</h3>
              <p className="text-sm text-muted-foreground">
                {purpose.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

#### 3. Update Wizard Context
**File**: `/src/contexts/WizardContext.tsx`

Add to existing context (modify, don't replace):
```typescript
// Add to WizardContextType interface
updatePurpose: (purpose: LearningPurpose) => void;

// Add to WizardProvider component
const updatePurpose = (purpose: LearningPurpose) => {
  setState(prev => ({ ...prev, purpose }));
};

// Add to context value
value={{
  state,
  updateGrade,
  updatePurpose, // NEW
  updateSubjects,
  updateTopics,
  completeWizard
}}
```

#### 4. Update Wizard Page
**File**: `/src/app/wizard/page.tsx`

Modify the existing wizard to include purpose step:
```typescript
// Import new component
import { PurposeSelector } from '@/components/wizard/PurposeSelector';

// Update step rendering logic
{state.currentStep === WIZARD_STEPS.PURPOSE_SELECTION && (
  <div>
    <h2 className="text-2xl font-bold mb-6">
      How would you like to learn today?
    </h2>
    <PurposeSelector
      selected={state.purpose}
      onSelect={updatePurpose}
    />
  </div>
)}

// Update navigation logic to handle new step
const canProceed = () => {
  switch (state.currentStep) {
    case WIZARD_STEPS.GRADE_SELECTION:
      return state.grade !== null;
    case WIZARD_STEPS.PURPOSE_SELECTION:
      return state.purpose !== null;
    case WIZARD_STEPS.SUBJECT_SELECTION:
      return state.subjects.length > 0;
    case WIZARD_STEPS.TOPIC_SELECTION:
      return Object.keys(state.topics).length > 0;
    default:
      return false;
  }
};

// Update save logic in completeWizard
const updates = {
  grade: state.grade,
  preferred_subjects: state.subjects,
  selected_topics: state.topics,
  learning_purpose: state.purpose, // NEW
  profile_completed: true,
  updated_at: new Date().toISOString()
};
```

---

## Section 3: Testing & Verification

### Database Testing
```bash
# Using Supabase MCP
mcp__supabase__execute_sql "SELECT learning_purpose FROM profiles LIMIT 5;"
# Should show: new_class (default) for existing users

mcp__supabase__execute_sql "UPDATE profiles SET learning_purpose = 'revision' WHERE id = '[test-user-id]';"
# Should succeed with valid enum value

mcp__supabase__execute_sql "UPDATE profiles SET learning_purpose = 'invalid' WHERE id = '[test-user-id]';"
# Should fail with CHECK constraint violation
```

### Frontend Testing
```bash
# 1. Start the app
npm run dev

# 2. Test wizard flow
# - Navigate to /wizard
# - Select grade
# - NEW: Select purpose (should see 3 cards)
# - Continue with subjects/topics
# - Complete wizard

# 3. Verify database
mcp__supabase__execute_sql "SELECT learning_purpose FROM profiles WHERE id = '[current-user-id]';"
# Should show selected purpose
```

### Python Agent Verification
```python
# The agent already does this:
result = supabase.table('profiles').select('*').eq('id', user_id).execute()
profile = result.data[0] if result.data else {}

# After this change, profile will contain:
# profile['learning_purpose'] = 'new_class' | 'revision' | 'exam_prep'

# No code changes needed - it automatically flows through!
```

---

## Section 4: Rollback Plan

### If Issues Occur:
```bash
# 1. Git rollback
git reset --hard [checkpoint-hash]

# 2. Database rollback
mcp__supabase__execute_sql "ALTER TABLE profiles DROP COLUMN learning_purpose;"

# 3. Clear wizard state
localStorage.removeItem('vt_wizard_state');
```

---

## Section 5: Implementation Checklist

### Pre-Implementation
- [ ] Create git checkpoint
- [ ] Backup database
- [ ] Review existing wizard flow

### Implementation
- [ ] Run database migration
- [ ] Add TypeScript types
- [ ] Create PurposeSelector component
- [ ] Update WizardContext
- [ ] Modify wizard page
- [ ] Test complete flow

### Verification
- [ ] TypeScript: `npm run typecheck` (0 errors)
- [ ] New users can select purpose
- [ ] Existing users have default
- [ ] Purpose saved to database
- [ ] Python agent receives purpose

### Post-Implementation
- [ ] Commit changes
- [ ] Document in changelog
- [ ] Monitor for issues

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Database migration fails | Low | Low | Rollback migration |
| Wizard breaks | Low | Medium | Test thoroughly |
| Python agent doesn't receive | Very Low | Low | Already uses select(*) |
| Users confused by new step | Low | Low | Clear descriptions |

---

## Why This is Safe

1. **Additive only** - No existing functionality removed
2. **Safe defaults** - Existing users get 'new_class'
3. **No protected core changes** - Zero risk to core services
4. **Automatic flow-through** - Python agent needs no changes
5. **Easy rollback** - Single column drop if needed

---

**APPROVAL STATUS**: Ready for implementation
**ESTIMATED TIME**: 30-45 minutes
**DEPENDENCIES**: None
**BREAKING CHANGES**: None