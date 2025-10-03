# User Segmentation Strategy Research Report
**Date**: 2025-10-02
**Status**: CRITICAL GAP IDENTIFIED
**Research Type**: Deep Analysis - User Type Collection & Authorization

---

## Executive Summary

**CRITICAL FINDING**: PingLearn currently **DOES NOT collect explicit user type** (Student/Teacher/Doctor) during signup or onboarding. The system relies on **implicit inference** from grade selection, which creates significant authorization and UX gaps.

**Key Discoveries**:
1. ✅ **UserRole type exists** in codebase (`student | teacher | admin | moderator | guest`) but is **NOT USED**
2. ❌ **No user_type/role field** in profiles database schema
3. ❌ **No explicit user type selection** in signup flow
4. ⚠️ **Implicit type inference** from grade selection (Grade 99 concept for doctors)
5. ⚠️ **Dentist user creation** uses workaround scripts, not proper signup flow

---

## 1. Current Implementation Analysis

### 1.1 Signup Flow (NO User Type Collection)

**File**: `src/components/auth/RegisterForm.tsx`

```typescript
// Current registration only collects:
- email
- password
- confirmPassword

// NO collection of:
- user_type
- role
- intended_use_case
```

**Finding**: The signup form is **generic** and makes no distinction between student, teacher, or professional users.

### 1.2 Database Schema Analysis

**File**: `supabase/migrations/001_initial_schema.sql`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12), -- ❌ Only supports grades 1-12
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critical Gaps**:
- ❌ **No `user_type` or `role` column**
- ❌ **Grade constraint** `CHECK (grade >= 1 AND grade <= 12)` prevents Grade 99 for doctors
- ❌ **No professional user fields** (specialization, license_number, institution)
- ⚠️ **Later migration** removes grade constraint for NABH (Grade 99), but this is a workaround

**File**: `supabase/migrations/003_add_learning_purpose.sql`

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS learning_purpose TEXT
CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep'))
DEFAULT 'new_class';
```

**Finding**: Added `learning_purpose` but still NO explicit user type/role field.

### 1.3 Wizard Implementation (Implicit Inference)

**File**: `src/types/wizard.ts`

```typescript
export interface WizardState {
  currentStep: number
  grade: number | null              // ⚠️ Grade selection used to infer type
  purpose: LearningPurpose | null
  subjects: string[]
  topics: Record<string, string[]>
  isComplete: boolean
}

export const SUPPORTED_GRADES = [9, 10, 11, 12] as const
```

**How User Type is Currently "Inferred"**:
- **Students**: Select grades 9-12 → Assumed student
- **Teachers**: ??? (No clear path)
- **Doctors/Dentists**: Grade 99 via special script → Professional user

**Problem**: This is **implicit, fragile, and undocumented**.

### 1.4 Doctor/Dentist Workaround

**File**: `src/app/signup-dentist/page.tsx`

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'dentist@dental.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Dr. Dental Professional',
      role: 'dentist'  // ⚠️ Stored in user_metadata, not profiles table
    }
  }
})

// Later sets grade: 0 and specialized preferences
preferences: {
  grade: 0,  // ⚠️ Not grade 99, but 0 to bypass constraint
  subject: 'Healthcare Administration',
  // ...professional settings
}
```

**Findings**:
1. ✅ Uses `user_metadata` for role storage (Supabase best practice)
2. ❌ **NOT part of normal signup flow** - requires special page
3. ❌ Grade set to `0` instead of 99 due to schema constraint
4. ⚠️ Role stored in auth metadata but not synchronized to profiles table

### 1.5 Type System (EXISTS but UNUSED)

**File**: `src/types/auth.ts`

```typescript
/**
 * User roles with specific constraints
 */
export type UserRole = 'student' | 'teacher' | 'admin' | 'moderator' | 'guest';

export interface UserProfile extends User {
  readonly id: string;
  readonly role: UserRole;  // ✅ Type exists but never used
  readonly permissions: readonly PermissionLevel[];
  // ...
}
```

**Critical Finding**: Well-defined `UserRole` type exists in codebase but is **NEVER populated or utilized**.

---

## 2. Gap Analysis

### 2.1 Signup Flow Gaps

| What We Need | Current Status | Impact |
|--------------|----------------|--------|
| User type selection | ❌ Missing | Cannot distinguish user types at signup |
| Role-specific onboarding | ❌ Missing | Generic wizard for all users |
| Professional verification | ❌ Missing | No credential validation for doctors/teachers |
| Terms acceptance (role-specific) | ❌ Missing | Same terms for students and professionals |

### 2.2 Database Schema Gaps

| Field Needed | Current Status | Recommendation |
|--------------|----------------|----------------|
| `user_type` / `role` | ❌ Missing | Add to profiles table |
| `professional_data` | ❌ Missing | JSONB field for credentials, licenses |
| `institution` | ❌ Missing | For teachers and doctors |
| `verified_professional` | ❌ Missing | Boolean flag for credential verification |
| Grade constraint | ⚠️ Workaround | Remove constraint, use enum or separate table |

### 2.3 Authorization Gaps

| Requirement | Current Status | Risk Level |
|-------------|----------------|------------|
| Role-based content filtering | ❌ Missing | HIGH - All users see same content |
| Permission system | ❌ Missing | HIGH - No access control |
| Professional-only features | ❌ Missing | MEDIUM - Cannot restrict NABH manual |
| Teacher dashboard | ❌ Missing | HIGH - No teacher functionality |
| Student progress tracking | ⚠️ Partial | MEDIUM - Generic for all users |

### 2.4 User Experience Gaps

| User Type | Current Experience | Desired Experience | Gap Severity |
|-----------|-------------------|-------------------|--------------|
| **Student** | Generic wizard → Grade 9-12 selection | Same, but with student-focused messaging | LOW |
| **Teacher** | ??? No clear path | Teacher signup → School/institution → Subject specialization | CRITICAL |
| **Doctor/Dentist** | Must use special script/page | Professional signup → Credentials → NABH access | CRITICAL |
| **Parent** | ??? Not supported | Not in scope currently | N/A |

---

## 3. How Users Are Currently Distinguished (IMPLICIT)

### Current Logic (Undocumented, Fragile):

```
IF user.grade IN [9, 10, 11, 12]:
  → Assumed Student
  → Access CBSE curriculum
  → Wizard shows subjects/topics

ELSE IF user.grade == 0 OR user.textbook.title LIKE '%NABH%':
  → Assumed Doctor/Professional
  → Access NABH manual
  → Professional preferences

ELSE:
  → ??? Undefined behavior
```

**Problems**:
1. **No explicit state** - relies on indirect inference
2. **Brittle** - breaks if grade is null or textbook changes
3. **Cannot support teachers** - no way to represent them
4. **No authorization** - anyone can access NABH if they know the URL

---

## 4. Best Practices Research (2025 Standards)

### 4.1 Supabase Authentication Best Practices

From Context7 documentation and research:

**✅ Recommended Approach**:
```typescript
// 1. Store role in user_metadata during signup
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      user_type: 'student',  // or 'teacher', 'doctor'
      full_name: 'John Doe',
      institution: 'ABC School'  // if teacher/doctor
    }
  }
})

// 2. Sync to profiles table using trigger
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_type, full_name, institution)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_type',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'institution'
  );
  return new;
end;
$$ language plpgsql security definer;
```

### 4.2 Role-Based Access Control (RBAC)

From web research (2025 best practices):

**Key Principles**:
1. **Explicit Role Assignment** - Users choose their role during signup
2. **Least Privilege** - Grant minimum necessary access per role
3. **Separation of Concerns** - Student, Teacher, Professional data in different tables/views
4. **Row-Level Security** - Postgres RLS policies based on user role

**Example RLS Policy**:
```sql
-- Students can only see their own data
create policy "Students see own data"
on profiles for select
to authenticated
using (
  auth.uid() = id AND
  (raw_user_meta_data ->> 'user_type') = 'student'
);

-- Teachers can see their students' data
create policy "Teachers see student data"
on profiles for select
to authenticated
using (
  (raw_user_meta_data ->> 'user_type') = 'teacher' AND
  institution = (select institution from profiles where id = auth.uid())
);
```

### 4.3 Multi-Tenant Segmentation

From educational platform research:

**Recommended Structure**:
```
User Hierarchy:
├── Student (individual learner)
│   ├── Grade (9-12)
│   ├── Subjects
│   └── Learning Purpose
├── Teacher (educator)
│   ├── Institution
│   ├── Subjects taught
│   └── Student groups/classes
└── Professional (doctor/dentist)
    ├── Specialization
    ├── Credentials
    └── Professional textbooks
```

---

## 5. Recommendations

### Priority 1: CRITICAL (Blocking Issues)

#### 5.1 Add Explicit User Type Collection

**Action**: Modify signup flow to collect user type FIRST

```typescript
// New signup step
<UserTypeSelection>
  <Option value="student">
    I'm a Student (Grade 9-12)
  </Option>
  <Option value="teacher">
    I'm a Teacher/Educator
  </Option>
  <Option value="professional">
    I'm a Healthcare Professional (Doctor/Dentist)
  </Option>
</UserTypeSelection>
```

**After selection, show appropriate wizard**:
- Student → Current grade selection wizard
- Teacher → School/institution + subjects taught
- Professional → Specialization + credentials

#### 5.2 Update Database Schema

**Migration**: `004_add_user_segmentation.sql`

```sql
-- Add user_type to profiles
ALTER TABLE public.profiles
ADD COLUMN user_type TEXT NOT NULL DEFAULT 'student'
CHECK (user_type IN ('student', 'teacher', 'professional', 'admin'));

-- Remove restrictive grade constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_grade_check;

-- Add flexible grade column (nullable for non-students)
ALTER TABLE public.profiles
ALTER COLUMN grade DROP NOT NULL;

-- Add professional data
ALTER TABLE public.profiles
ADD COLUMN professional_data JSONB DEFAULT NULL;

-- Add institution
ALTER TABLE public.profiles
ADD COLUMN institution TEXT DEFAULT NULL;

-- Add verification status
ALTER TABLE public.profiles
ADD COLUMN is_verified_professional BOOLEAN DEFAULT false;

-- Index for filtering
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.user_type IS
'Explicit user type: student (grade 9-12), teacher (educator), professional (doctor/dentist), admin';

COMMENT ON COLUMN public.profiles.professional_data IS
'JSONB field for professional credentials: {license_number, specialization, certifications}';
```

#### 5.3 Sync Auth Metadata to Profiles

**Trigger Update**: Ensure `user_type` from signup is synced

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    institution,
    professional_data
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'student'),
    new.raw_user_meta_data ->> 'institution',
    CASE
      WHEN new.raw_user_meta_data ->> 'user_type' = 'professional'
      THEN (new.raw_user_meta_data -> 'professional_data')::jsonb
      ELSE NULL
    END
  );
  RETURN new;
END;
$$;
```

### Priority 2: HIGH (Authorization)

#### 5.4 Implement Row-Level Security Policies

```sql
-- Students can only see their own data
CREATE POLICY "Students access own data"
ON public.profiles FOR ALL
TO authenticated
USING (user_type = 'student' AND id = auth.uid());

-- Teachers can see students in their institution
CREATE POLICY "Teachers access institution students"
ON public.profiles FOR SELECT
TO authenticated
USING (
  user_type = 'teacher' AND
  institution = (SELECT institution FROM profiles WHERE id = auth.uid())
);

-- Content access based on user type
CREATE POLICY "Students access CBSE content"
ON public.textbooks FOR SELECT
TO authenticated
USING (
  (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'student' AND
  grade IN (9, 10, 11, 12) AND
  subject IN ('Mathematics', 'Science', 'English', 'Social Science')
);

CREATE POLICY "Professionals access NABH content"
ON public.textbooks FOR SELECT
TO authenticated
USING (
  (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'professional' AND
  title LIKE '%NABH%'
);
```

#### 5.5 Implement Permission System

**File**: `src/lib/auth/permissions.ts`

```typescript
export const USER_PERMISSIONS = {
  student: {
    textbooks: ['cbse_grade_9_12'],
    features: ['classroom', 'progress_tracking', 'voice_sessions'],
    dashboard: 'student'
  },
  teacher: {
    textbooks: ['cbse_grade_9_12', 'teaching_resources'],
    features: ['classroom', 'student_management', 'progress_reports'],
    dashboard: 'teacher'
  },
  professional: {
    textbooks: ['nabh', 'professional_education'],
    features: ['classroom', 'cme_credits', 'professional_development'],
    dashboard: 'professional'
  }
} as const;

export function canAccessTextbook(
  userType: UserRole,
  textbookId: string
): boolean {
  // Implementation
}

export function canAccessFeature(
  userType: UserRole,
  feature: string
): boolean {
  // Implementation
}
```

### Priority 3: MEDIUM (User Experience)

#### 5.6 Role-Specific Wizards

**Student Wizard** (Current):
1. Select Grade (9-12)
2. Select Subjects
3. Select Topics
4. Learning Purpose

**Teacher Wizard** (New):
1. School/Institution
2. Subjects Taught
3. Grade Levels
4. Class Setup

**Professional Wizard** (New):
1. Specialization (Dentist, Surgeon, etc.)
2. License/Credentials
3. Institution/Practice
4. Professional Development Goals

#### 5.7 Role-Specific Dashboards

```
/dashboard/student   → Progress, upcoming classes, performance
/dashboard/teacher   → Class management, student progress, resources
/dashboard/professional → CME credits, NABH modules, certifications
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add user type selection to signup flow
- [ ] Update database schema with migration
- [ ] Update auth trigger to sync user_type
- [ ] Add basic RLS policies
- [ ] Test with all three user types

### Phase 2: Authorization (Week 2)
- [ ] Implement permission system
- [ ] Add role-based content filtering
- [ ] Restrict NABH access to professionals
- [ ] Add teacher-specific features
- [ ] Implement proper student isolation

### Phase 3: UX Enhancement (Week 3)
- [ ] Create role-specific wizards
- [ ] Build role-specific dashboards
- [ ] Add professional credential verification
- [ ] Implement teacher class management
- [ ] Add student progress visualization per role

### Phase 4: Testing & Refinement (Week 4)
- [ ] E2E tests for each user type
- [ ] Authorization testing
- [ ] Migration testing (existing users)
- [ ] Performance testing
- [ ] Security audit

---

## 7. Migration Strategy for Existing Users

**Challenge**: Existing users have no `user_type` set.

**Solution**: Default inference with manual verification

```sql
-- Default inference based on current data
UPDATE public.profiles
SET user_type = CASE
  WHEN grade BETWEEN 9 AND 12 THEN 'student'
  WHEN grade = 0 AND institution LIKE '%dental%' THEN 'professional'
  ELSE 'student'  -- Safe default
END
WHERE user_type IS NULL;

-- Flag for manual review
ALTER TABLE public.profiles
ADD COLUMN user_type_inferred BOOLEAN DEFAULT FALSE;

UPDATE public.profiles
SET user_type_inferred = TRUE
WHERE user_type IS NOT NULL;
```

---

## 8. Security Considerations

### Current Vulnerabilities:
1. ❌ **No authorization checks** - Any authenticated user can access NABH content
2. ❌ **No role validation** - user_metadata can be manipulated
3. ❌ **No credential verification** - Professional users not validated

### Recommended Security:
1. ✅ **Row-Level Security** - Postgres RLS enforces access
2. ✅ **User type immutability** - Prevent self-service role changes
3. ✅ **Professional verification** - Manual or automated credential check
4. ✅ **Audit logging** - Track role changes and access attempts

---

## 9. Testing Requirements

### Unit Tests:
- [ ] User type selection validation
- [ ] Permission checks for each role
- [ ] RLS policy enforcement

### Integration Tests:
- [ ] Signup flow for each user type
- [ ] Wizard flow per role
- [ ] Content access per role
- [ ] Dashboard access per role

### E2E Tests:
- [ ] Complete student onboarding
- [ ] Complete teacher onboarding
- [ ] Complete professional onboarding
- [ ] Cross-role access attempts (should fail)

---

## 10. Success Metrics

### After Implementation:
- ✅ **100% user type collection** - Every new signup has explicit type
- ✅ **Zero implicit inference** - No reliance on grade/textbook heuristics
- ✅ **Proper authorization** - Students cannot access NABH, professionals cannot access Grade 9-12
- ✅ **Role-specific UX** - Each user type sees appropriate dashboard/features
- ✅ **Professional verification** - Doctors/dentists have verified credentials

---

## 11. Conclusion

**Current State**: PingLearn has a **functional but incomplete** user segmentation strategy. The system works for students (Grade 9-12) but lacks proper infrastructure for teachers and professionals.

**Critical Issues**:
1. **No explicit user type collection** at signup
2. **Implicit inference** from grade selection is fragile
3. **No authorization system** - content access is unrestricted
4. **Professional users** require workaround scripts
5. **Teachers** have no clear onboarding path

**Recommendation**: Implement **explicit user type collection** as the first step in signup, followed by role-specific wizards and proper authorization. This is a **blocking issue** for supporting multiple user types properly.

**Estimated Effort**: 3-4 weeks for full implementation
**Risk Level**: MEDIUM (requires schema changes and auth flow updates)
**Impact**: HIGH (enables proper multi-user platform)

---

## 12. References

1. Supabase Auth Documentation - User Metadata & Triggers
2. RBAC Best Practices 2025 - Web Research
3. Educational Platform Segmentation - Industry Standards
4. PingLearn Codebase Analysis - Existing Types & Schema

**Research Completed**: 2025-10-02
**Next Steps**: Review with product team, prioritize implementation
