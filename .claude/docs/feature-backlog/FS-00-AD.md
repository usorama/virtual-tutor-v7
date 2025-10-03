# FS-00-AD: Flexible Curriculum Taxonomy System

**Feature Specification ID**: FS-00-AD
**Created**: 2025-10-03
**Status**: 📋 **PENDING APPROVAL**
**Priority**: P0 - CRITICAL (Blocks textbook upload functionality)
**Estimated Effort**: 1.5-2 hours (with 4-agent parallel deployment)
**Risk Level**: 🟡 **MEDIUM** - Database schema change + data migration required
**Related Issues**: P0.1 - Curriculum Gap Fix
**Complements**: FC-00-AC (Multi-Chapter Collection Management)

---

## 🚨 PROBLEM STATEMENT

### Current Critical Issue

PingLearn's curriculum system assumes **all textbooks belong to a single academic curriculum** (Grade 10 Mathematics), creating immediate blockers for diverse content types:

**Actual Content Reality**:
- ✅ Class 10 NCERT Mathematics (academic)
- ✅ Class 12+ English General Textbook (academic, different grade)
- ✅ NABH Healthcare Professional Manual (professional certification)
- 🔜 Classes 5-9 Mathematics (future academic)
- 🔜 Class 11 subjects (future academic)
- 🔜 User-uploaded custom textbooks with metadata

**Current Schema Problem**:
```sql
-- Current: ONE curriculum record for ALL textbooks
SELECT * FROM curriculum_data;
-- Result: Only "Grade 10 - Mathematics - CBSE" exists

-- Problem: Cannot map Class 12 English or NABH manual to this curriculum
```

**Impact**:
1. ❌ **Upload Blocker**: Cannot upload non-Grade-10-Math textbooks
2. ❌ **Data Integrity**: Forced to use wrong curriculum_id or NULL (breaks foreign key)
3. ❌ **Search Failure**: Students searching "Class 12 English" find nothing
4. ❌ **Session Creation**: Cannot start sessions for uploaded textbooks
5. ❌ **Future Scalability**: Cannot add Classes 5-9, 11 without schema changes

### Root Cause

**Inflexible Schema Design**:
- Single curriculum type (academic only)
- No support for professional/general/custom content
- Missing auto-creation logic for new curricula
- No fuzzy matching for curriculum lookup

---

## 🎯 SOLUTION OVERVIEW

Transform PingLearn from **single-curriculum assumption** to **flexible multi-taxonomy system** supporting:

1. **Academic Curricula** (NCERT, CBSE, ICSE) - Classes 5-12
2. **General Education** (Language skills, soft skills) - No grade restriction
3. **Professional Certification** (NABH, industry training) - Target audience based
4. **Custom Curricula** (User-uploaded specialized content) - Flexible metadata

### Core Features

1. **Enhanced Curriculum Schema** - Add `curriculum_type`, `target_audience`, `board` columns
2. **Smart Curriculum Matching Service** - Auto-detect or create curriculum records
3. **Upload Workflow Integration** - Seamless curriculum selection during textbook upload
4. **UI Updates** - Dynamic breadcrumb showing actual curriculum context

---

## 📊 TECHNICAL IMPLEMENTATION

### 1. Database Schema Enhancement

#### **Migration: Add Curriculum Flexibility**

```sql
-- Migration: 001_add_curriculum_flexibility.sql
-- Duration: <1 second (3 new columns + 1 constraint modification)

BEGIN;

-- Step 1: Add new columns to curriculum_data table
ALTER TABLE curriculum_data
  ADD COLUMN curriculum_type TEXT DEFAULT 'academic'
    CHECK (curriculum_type IN ('academic', 'general', 'professional', 'custom')),
  ADD COLUMN target_audience TEXT, -- 'students', 'professionals', 'general', 'custom'
  ADD COLUMN board TEXT DEFAULT 'Generic'; -- 'CBSE', 'NCERT', 'ICSE', 'Generic', 'Industry', etc.

-- Step 2: Update existing data (backward compatibility)
UPDATE curriculum_data
SET
  curriculum_type = 'academic',
  target_audience = 'students',
  board = 'CBSE'
WHERE curriculum_type IS NULL;

-- Step 3: Modify unique constraint to include new fields
-- Drop old constraint
ALTER TABLE curriculum_data
  DROP CONSTRAINT IF EXISTS curriculum_data_grade_subject_unique;

-- Add new comprehensive constraint
ALTER TABLE curriculum_data
  ADD CONSTRAINT curriculum_data_unique_key
  UNIQUE (grade_level, subject_name, board, curriculum_type);

-- Step 4: Create index for fast lookup
CREATE INDEX idx_curriculum_lookup
  ON curriculum_data(curriculum_type, grade_level, subject_name, board);

COMMIT;
```

#### **Enhanced Curriculum Data Structure**

```typescript
// Enhanced curriculum_data table structure
interface CurriculumData {
  id: string; // UUID
  grade_level: string; // 'Class 5', 'Class 10', 'Professional', 'General', 'All Levels'
  subject_name: string; // 'Mathematics', 'English', 'Healthcare Management'
  description: string | null;
  topics: string[]; // JSONB array

  // NEW FIELDS (FS-00-AD)
  curriculum_type: 'academic' | 'general' | 'professional' | 'custom';
  target_audience: string | null; // 'students', 'professionals', 'doctors', 'engineers'
  board: string; // 'CBSE', 'NCERT', 'ICSE', 'Generic', 'NABH', 'Industry'

  created_at: string;
  updated_at: string;
}
```

#### **Sample Data After Migration**

```sql
-- Existing curriculum (updated with new fields)
INSERT INTO curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board)
VALUES ('Class 10', 'Mathematics', 'academic', 'students', 'CBSE');

-- New curriculum for Class 12 English
INSERT INTO curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board)
VALUES ('Class 12', 'English', 'academic', 'students', 'Generic');

-- New curriculum for NABH Healthcare Manual
INSERT INTO curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board)
VALUES ('Professional', 'Healthcare Management', 'professional', 'doctors', 'NABH');

-- Future: Classes 5-9, 11
INSERT INTO curriculum_data (grade_level, subject_name, curriculum_type, target_audience, board)
VALUES
  ('Class 5', 'Mathematics', 'academic', 'students', 'CBSE'),
  ('Class 6', 'Mathematics', 'academic', 'students', 'CBSE'),
  -- ... etc.
  ('Class 11', 'Physics', 'academic', 'students', 'CBSE');
```

---

### 2. Smart Curriculum Matching Service

**Purpose**: Automatically match uploaded textbooks to existing curricula OR create new curriculum records when needed.

#### **Service Architecture**

```typescript
// File: src/lib/curriculum/matcher.ts

interface CurriculumMetadata {
  gradeLevel: string; // 'Class 10', 'Professional', 'General'
  subject: string;
  board?: string; // Optional, defaults to 'Generic'
  curriculumType?: 'academic' | 'general' | 'professional' | 'custom';
  targetAudience?: string; // Optional, inferred if not provided
}

interface CurriculumMatchResult {
  curriculumId: string;
  matched: boolean; // true if found existing, false if created new
  curriculum: CurriculumData;
}

/**
 * Smart curriculum matching with auto-creation
 * Handles fuzzy matching and intelligent defaults
 */
export async function matchOrCreateCurriculum(
  metadata: CurriculumMetadata
): Promise<CurriculumMatchResult> {
  const supabase = await createClient();

  // Normalize inputs
  const normalizedGrade = normalizeGradeLevel(metadata.gradeLevel);
  const normalizedSubject = metadata.subject.trim();
  const board = metadata.board || 'Generic';
  const type = metadata.curriculumType || inferCurriculumType(metadata);
  const audience = metadata.targetAudience || inferTargetAudience(type);

  // 1. Try exact match
  const { data: exact } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade_level', normalizedGrade)
    .eq('subject_name', normalizedSubject)
    .eq('board', board)
    .eq('curriculum_type', type)
    .single();

  if (exact) {
    return {
      curriculumId: exact.id,
      matched: true,
      curriculum: exact
    };
  }

  // 2. Try fuzzy match (board variations)
  const { data: fuzzy } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade_level', normalizedGrade)
    .eq('subject_name', normalizedSubject)
    .eq('curriculum_type', type)
    .limit(1);

  if (fuzzy && fuzzy.length > 0) {
    return {
      curriculumId: fuzzy[0].id,
      matched: true,
      curriculum: fuzzy[0]
    };
  }

  // 3. No match found - create new curriculum
  const { data: created, error } = await supabase
    .from('curriculum_data')
    .insert({
      grade_level: normalizedGrade,
      subject_name: normalizedSubject,
      curriculum_type: type,
      target_audience: audience,
      board: board,
      description: `Auto-created curriculum for ${normalizedGrade} ${normalizedSubject}`,
      topics: [] // Empty topics array
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create curriculum: ${error.message}`);
  }

  return {
    curriculumId: created.id,
    matched: false,
    curriculum: created
  };
}

/**
 * Normalize grade level variations
 * Examples: 'Class X' → 'Class 10', 'Grade 12+' → 'Class 12'
 */
function normalizeGradeLevel(input: string): string {
  // Handle roman numerals
  const romanMap: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12'
  };

  // Try Roman numeral pattern
  const romanMatch = input.match(/Class\s+([IVX]+)/i);
  if (romanMatch && romanMap[romanMatch[1]]) {
    return `Class ${romanMap[romanMatch[1]]}`;
  }

  // Try numeric pattern
  const numMatch = input.match(/(?:Class|Grade)\s*(\d+)/i);
  if (numMatch) {
    return `Class ${numMatch[1]}`;
  }

  // Special cases
  if (/professional/i.test(input)) return 'Professional';
  if (/general/i.test(input)) return 'General';

  // Return as-is if no pattern matches
  return input.trim();
}

/**
 * Infer curriculum type from metadata patterns
 */
function inferCurriculumType(
  metadata: CurriculumMetadata
): 'academic' | 'general' | 'professional' | 'custom' {
  const grade = metadata.gradeLevel.toLowerCase();
  const subject = metadata.subject.toLowerCase();

  // Professional indicators
  if (
    grade.includes('professional') ||
    subject.includes('healthcare') ||
    subject.includes('management') ||
    metadata.board?.includes('NABH')
  ) {
    return 'professional';
  }

  // General education indicators
  if (
    grade.includes('general') ||
    grade.includes('all levels') ||
    subject.includes('life skills') ||
    subject.includes('communication')
  ) {
    return 'general';
  }

  // Academic indicators (default for Class 1-12)
  if (/class\s+\d+/i.test(grade) || /grade\s+\d+/i.test(grade)) {
    return 'academic';
  }

  // Default to custom if uncertain
  return 'custom';
}

/**
 * Infer target audience from curriculum type
 */
function inferTargetAudience(type: string): string {
  switch (type) {
    case 'academic':
      return 'students';
    case 'professional':
      return 'professionals';
    case 'general':
      return 'general';
    default:
      return 'custom';
  }
}
```

---

### 3. Upload Workflow Integration

**Modify Textbook Upload Form** to use smart curriculum matching:

```typescript
// File: src/app/(authenticated)/dashboard/textbooks/upload/actions.ts

import { matchOrCreateCurriculum } from '@/lib/curriculum/matcher';

export async function handleTextbookUpload(formData: FormData) {
  const supabase = await createClient();

  // Extract metadata from form
  const gradeLevel = formData.get('gradeLevel') as string;
  const subject = formData.get('subject') as string;
  const board = formData.get('board') as string | undefined;
  const curriculumType = formData.get('curriculumType') as string | undefined;

  // Smart curriculum matching (auto-create if needed)
  const { curriculumId, matched } = await matchOrCreateCurriculum({
    gradeLevel,
    subject,
    board,
    curriculumType: curriculumType as any
  });

  console.log(
    matched
      ? `✅ Matched existing curriculum: ${curriculumId}`
      : `✨ Created new curriculum: ${curriculumId}`
  );

  // Continue with textbook upload using matched/created curriculum_id
  const { data: textbook, error } = await supabase
    .from('textbooks')
    .insert({
      curriculum_id: curriculumId, // ✅ Now always has valid ID
      title: formData.get('title'),
      file_path: uploadedFilePath,
      // ... other fields
    })
    .select()
    .single();

  return { textbook, error };
}
```

---

### 4. UI Component Updates

#### **SessionInfoPanel - Dynamic Curriculum Breadcrumb**

Update breadcrumb to show actual curriculum context:

```typescript
// File: src/components/classroom/SessionInfoPanel.tsx

import type { UseSessionStateReturn } from '@/hooks/useSessionState';

interface SessionInfoPanelProps {
  sessionState: UseSessionStateReturn; // ✅ Properly typed (no 'any')
}

export function SessionInfoPanel({ sessionState }: SessionInfoPanelProps) {
  const { currentTextbook, currentChapter } = sessionState;

  // Fetch curriculum data for breadcrumb
  const { data: curriculum } = useSWR(
    currentTextbook?.curriculum_id
      ? `/api/curriculum/${currentTextbook.curriculum_id}`
      : null,
    fetcher
  );

  // Build dynamic breadcrumb based on curriculum type
  const breadcrumb = curriculum ? (
    curriculum.curriculum_type === 'academic' ? (
      <span>{curriculum.board} · {curriculum.grade_level} · {curriculum.subject_name}</span>
    ) : curriculum.curriculum_type === 'professional' ? (
      <span>{curriculum.board} · {curriculum.subject_name} ({curriculum.target_audience})</span>
    ) : (
      <span>{curriculum.subject_name}</span>
    )
  ) : (
    <span>Loading curriculum...</span>
  );

  return (
    <div className="session-info-panel">
      <div className="breadcrumb">{breadcrumb}</div>
      {/* ... rest of component */}
    </div>
  );
}
```

#### **Upload Form - Curriculum Type Selection**

```typescript
// File: src/app/(authenticated)/dashboard/textbooks/upload/page.tsx

export default function UploadTextbookPage() {
  return (
    <form>
      {/* Existing fields */}
      <input name="title" placeholder="Textbook Title" />

      {/* NEW: Curriculum type selector */}
      <select name="curriculumType">
        <option value="academic">Academic (Class-based)</option>
        <option value="general">General Education</option>
        <option value="professional">Professional Certification</option>
        <option value="custom">Custom</option>
      </select>

      {/* Dynamic grade level field (shows/hides based on curriculum type) */}
      <input
        name="gradeLevel"
        placeholder="e.g., Class 10, Professional, General"
      />

      {/* Board selector (optional) */}
      <select name="board">
        <option value="Generic">Generic</option>
        <option value="CBSE">CBSE</option>
        <option value="NCERT">NCERT</option>
        <option value="ICSE">ICSE</option>
        <option value="NABH">NABH</option>
        <option value="Industry">Industry Standard</option>
      </select>

      <input name="subject" placeholder="Subject" />
      {/* ... other fields */}
    </form>
  );
}
```

---

## 🔧 IMPLEMENTATION PHASES

### **Phase 1: Database Migration** (15 minutes)

**Agent 1: Database Architect**

**Tasks**:
- [ ] Create migration SQL file
- [ ] Run migration on development database
- [ ] Verify backward compatibility (existing curriculum_id still works)
- [ ] Create sample data for testing (3 curriculum types)
- [ ] Verify foreign key integrity maintained

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
# Manual: Query curriculum_data table and verify new columns exist
```

---

### **Phase 2: Smart Matching Service** (30 minutes)

**Agent 2: Backend Engineer**

**Tasks**:
- [ ] Create `src/lib/curriculum/matcher.ts` service
- [ ] Implement `matchOrCreateCurriculum()` with fuzzy matching
- [ ] Implement `normalizeGradeLevel()` with roman numeral support
- [ ] Implement `inferCurriculumType()` and `inferTargetAudience()`
- [ ] Add comprehensive TypeScript types (NO 'any' types)
- [ ] Write unit tests for matching logic (>80% coverage)

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
npm test -- matcher.test.ts  # MUST pass all tests
```

---

### **Phase 3: Upload Workflow Integration** (30 minutes)

**Agent 3: Frontend Developer**

**Tasks**:
- [ ] Update upload form with curriculum type selector
- [ ] Modify `handleTextbookUpload()` to use matcher service
- [ ] Update SessionInfoPanel breadcrumb logic
- [ ] Add UI feedback for auto-created curricula
- [ ] Implement proper error handling and user notifications

**Verification**:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint  # MUST pass
# Manual: Test upload flow for all 3 curriculum types
```

---

### **Phase 4: E2E Testing & Evidence** (15 minutes)

**Agent 4: Integration Tester**

**Tasks**:
- [ ] Upload Class 10 Math textbook (existing curriculum match)
- [ ] Upload Class 12 English textbook (auto-create new curriculum)
- [ ] Upload NABH Healthcare manual (auto-create professional curriculum)
- [ ] Verify database records created correctly
- [ ] Capture screenshots of breadcrumb display
- [ ] Create evidence document with before/after verification

**Verification**:
```bash
# Query database to verify 3 curriculum records exist
# Verify foreign keys in textbooks table point to correct curriculum_id
# Verify SessionInfoPanel displays correct breadcrumb for each type
```

---

## 📋 ACCEPTANCE CRITERIA

### **Functional Requirements**

#### ✅ **Curriculum Flexibility**
- [x] System supports 4 curriculum types: academic, general, professional, custom
- [x] Each curriculum has optional board, target_audience fields
- [x] Unique constraint includes new fields (no duplicate curricula)
- [x] Existing data migrated successfully with backward compatibility

#### ✅ **Smart Matching Service**
- [x] Auto-matches to existing curriculum when possible (fuzzy matching)
- [x] Auto-creates new curriculum when no match found
- [x] Normalizes grade levels (Class X → Class 10)
- [x] Infers curriculum type from metadata patterns
- [x] Returns curriculum_id for seamless foreign key usage

#### ✅ **Upload Workflow**
- [x] Upload form includes curriculum type selector
- [x] Upload action uses matcher service transparently
- [x] Users see confirmation when new curriculum auto-created
- [x] No more "missing curriculum_id" errors

#### ✅ **UI Display**
- [x] SessionInfoPanel breadcrumb shows curriculum context
- [x] Academic: "CBSE · Class 10 · Mathematics"
- [x] Professional: "NABH · Healthcare Management (doctors)"
- [x] General: "English Communication"

---

### **Technical Requirements**

#### ✅ **Database**
- [x] Migration completes in <1 second
- [x] Existing curriculum_id references remain valid
- [x] New columns have sensible defaults
- [x] Unique constraint prevents duplicate curricula

#### ✅ **Code Quality**
- [x] TypeScript strict mode: 0 errors
- [x] NO 'any' types in new code
- [x] Unit test coverage: >80%
- [x] ESLint: 0 warnings

#### ✅ **Performance**
- [x] Curriculum matching completes in <100ms
- [x] Database queries use index (idx_curriculum_lookup)
- [x] No N+1 query issues

---

## 🚨 RISKS & MITIGATION

### **Medium Risk: Data Migration**

**Risk**: Existing curriculum_id relationships broken
**Probability**: Low
**Impact**: High

**Mitigation**:
1. ✅ Migration uses ALTER TABLE (preserves existing data)
2. ✅ Default values maintain backward compatibility
3. ✅ Test on development database before production
4. ✅ Rollback script available (DROP COLUMN)

### **Low Risk: Performance**

**Risk**: Curriculum lookup slows down upload
**Probability**: Low
**Impact**: Low

**Mitigation**:
1. ✅ Database index on lookup fields
2. ✅ Fuzzy matching limited to 1 query
3. ✅ Auto-creation is fast (<50ms)

---

## 📈 SUCCESS METRICS

### **Immediate (After Implementation)**
- ✅ 3+ curriculum types exist in database
- ✅ All existing textbooks still have valid curriculum_id
- ✅ Upload form accepts all curriculum types
- ✅ TypeScript errors: 0

### **Short-term (First Week)**
- ✅ Class 12 English textbook uploaded successfully
- ✅ NABH manual uploaded successfully
- ✅ SessionInfoPanel shows correct breadcrumb for each type
- ✅ NO database constraint violations

### **Long-term (First Month)**
- ✅ Classes 5-9, 11 textbooks uploaded successfully
- ✅ 10+ unique curriculum records created
- ✅ User-uploaded custom textbooks working seamlessly

---

## 🎯 PARALLEL AGENT DEPLOYMENT PLAN

**Total Time**: 1.5-2 hours (vs 3.5 hours sequential)

**Agents**:
1. **Agent 1 (Database Architect)** - Migration + sample data (15 min)
2. **Agent 2 (Backend Engineer)** - Matcher service + tests (30 min)
3. **Agent 3 (Frontend Developer)** - Upload form + SessionInfoPanel (30 min)
4. **Agent 4 (Integration Tester)** - E2E testing + evidence (15 min)

**Dependencies**:
- Agent 2, 3, 4 start AFTER Agent 1 completes migration
- Agent 2, 3 work in parallel (no dependencies)
- Agent 4 starts AFTER Agents 2 & 3 complete

**Engineered Prompts** (to be provided with `--rules` and `--workflow`):
```
Agent 1: "Implement database migration for FS-00-AD Phase 1. Follow PC-* change record pattern. Verify backward compatibility. --rules --workflow"

Agent 2: "Implement smart curriculum matcher service for FS-00-AD Phase 2. NO 'any' types. >80% test coverage. --rules --workflow"

Agent 3: "Integrate curriculum matcher into upload workflow for FS-00-AD Phase 3. Update SessionInfoPanel breadcrumb. --rules --workflow"

Agent 4: "Execute E2E testing for FS-00-AD Phase 4. Upload 3 textbook types. Capture evidence. Create evidence document. --rules --workflow"
```

---

## 🔍 RELATIONSHIP TO FC-00-AC

**FC-00-AC** (Multi-Chapter Collection Management):
- **Problem**: Individual chapters treated as separate textbooks
- **Solution**: Hierarchical book series → books → chapters structure
- **Focus**: Content organization and structural integrity

**FS-00-AD** (Flexible Curriculum Taxonomy):
- **Problem**: All content assumed to be single academic curriculum
- **Solution**: Support academic, general, professional, custom curricula
- **Focus**: Curriculum diversity and metadata flexibility

**Complementary Nature**:
1. FC-00-AC fixes **content structure** (1 book with 12 chapters)
2. FS-00-AD fixes **curriculum diversity** (academic vs professional vs general)
3. **Together**: Enable comprehensive textbook management system

**Implementation Priority**:
- ✅ **FS-00-AD FIRST** (unblocks immediate uploads)
- ⏳ **FC-00-AC SECOND** (improves long-term organization)

**Together They Make the App "Whole"**:
- With FS-00-AD: Can upload ANY textbook type (academic, professional, general)
- With FC-00-AC: Can organize multi-chapter books properly
- Combined: Comprehensive, flexible, scalable textbook management

---

## 📞 NEXT STEPS

**Immediate Actions**:
1. User approval of FS-00-AD specification
2. Deploy 4-agent parallel implementation team
3. Execute phases 1-4 with continuous verification
4. Create comprehensive evidence document

**Follow-up Actions**:
1. Review FC-00-AC implementation plan
2. Determine implementation sequence (FS-00-AD → FC-00-AC)
3. Schedule combined testing for both features

---

**Document Status**: 📋 **PENDING USER APPROVAL**
**Next Action**: User decision to proceed with 4-agent parallel deployment
**Estimated Time**: 1.5-2 hours total (parallel execution)
**Business Impact**: Unblocks textbook uploads for Class 12, professional content, and future expansion
