# FC-00-AC Integration Modification (Required for FS-00-AD Compatibility)

**Document Type**: CRITICAL MODIFICATION to FC-00-AC.md
**Created**: 2025-10-03
**Status**: 🔴 **MANDATORY** - Agents MUST follow this, not original FC-00-AC.md schema
**Reason**: Prevent data duplication between book_series and curriculum_data tables

---

## 🚨 PROBLEM WITH ORIGINAL FC-00-AC SPECIFICATION

**Original FC-00-AC.md schema (lines 60-69)**:
```sql
CREATE TABLE public.book_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  curriculum_standard TEXT, -- ❌ DUPLICATES curriculum_data.board
  grade INTEGER NOT NULL,   -- ❌ DUPLICATES curriculum_data.grade_level
  subject TEXT NOT NULL,    -- ❌ DUPLICATES curriculum_data.subject_name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (series_name, publisher, grade, subject)
);
```

**Problems**:
1. ❌ `curriculum_standard` duplicates `curriculum_data.board`
2. ❌ `grade` duplicates `curriculum_data.grade_level`
3. ❌ `subject` duplicates `curriculum_data.subject_name`
4. ❌ Creates data inconsistency (same curriculum info in 2 tables)
5. ❌ Breaks single source of truth principle

---

## ✅ CORRECTED SCHEMA (AGENTS MUST USE THIS)

**Modified book_series table**:
```sql
CREATE TABLE public.book_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_name TEXT NOT NULL,
  publisher TEXT NOT NULL,

  -- ✅ INTEGRATION: Reference curriculum_data (single source of truth)
  curriculum_id UUID NOT NULL REFERENCES curriculum_data(id) ON DELETE RESTRICT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- ✅ Updated unique constraint (no duplicate fields)
  UNIQUE (series_name, publisher, curriculum_id)
);

-- ✅ Index for fast curriculum lookups
CREATE INDEX idx_book_series_curriculum
  ON book_series(curriculum_id);
```

**What Changed**:
1. ✅ **REMOVED**: `curriculum_standard TEXT`
2. ✅ **REMOVED**: `grade INTEGER NOT NULL`
3. ✅ **REMOVED**: `subject TEXT NOT NULL`
4. ✅ **ADDED**: `curriculum_id UUID NOT NULL REFERENCES curriculum_data(id)`
5. ✅ **UPDATED**: Unique constraint to use `curriculum_id` instead of grade/subject
6. ✅ **ADDED**: Index for curriculum_id lookups

---

## 📊 DATA RELATIONSHIPS AFTER MODIFICATION

```
curriculum_data (FS-00-AD - Single Source of Truth)
├── grade_level: "Class 10"
├── subject_name: "Mathematics"
├── board: "CBSE"
├── curriculum_type: "academic"
└── target_audience: "students"
     ↓ (referenced by)
book_series (FC-00-AC - Modified)
├── curriculum_id → curriculum_data.id  ✅
├── series_name: "NCERT Mathematics Series"
└── publisher: "NCERT"
     ↓ (contains)
books (FC-00-AC - No changes needed)
├── series_id → book_series.id
├── volume_number: 1
└── volume_title: "Class 10 Mathematics"
     ↓ (contains)
book_chapters (FC-00-AC - No changes needed)
├── book_id → books.id
├── chapter_number: 1
└── title: "Real Numbers"
```

---

## 🔧 MIGRATION STRATEGY

**Phase 1: Create book_series with curriculum_id**
```sql
BEGIN;

-- Create modified book_series table
CREATE TABLE public.book_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_name TEXT NOT NULL,
  publisher TEXT NOT NULL,
  curriculum_id UUID NOT NULL REFERENCES curriculum_data(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (series_name, publisher, curriculum_id)
);

CREATE INDEX idx_book_series_curriculum ON book_series(curriculum_id);

COMMIT;
```

**Phase 2: Populate from existing textbooks**
```sql
-- For each unique textbook curriculum, create a book_series
INSERT INTO book_series (series_name, publisher, curriculum_id)
SELECT DISTINCT
  'Legacy Series - ' || c.subject_name,
  'Unknown Publisher',
  t.curriculum_id
FROM textbooks t
JOIN curriculum_data c ON t.curriculum_id = c.id
ON CONFLICT DO NOTHING;
```

**Phase 3: Create books and chapters** (handled by Agent B1-B6)

---

## 💻 TYPESCRIPT INTERFACE CHANGES

**Modified BookSeries interface**:
```typescript
interface BookSeries {
  id: string;
  seriesName: string;
  publisher: string;

  // ✅ INTEGRATION: Reference to curriculum_data
  curriculumId: string;  // Foreign key to curriculum_data.id

  createdAt: string;

  // ✅ Computed properties (fetch from curriculum_data when needed)
  curriculum?: CurriculumData;  // Joined data from curriculum_data table
}

// Usage example:
async function getBookSeriesWithCurriculum(seriesId: string) {
  const { data } = await supabase
    .from('book_series')
    .select(`
      *,
      curriculum:curriculum_data(*)
    `)
    .eq('id', seriesId)
    .single();

  // data.curriculum contains: grade_level, subject_name, board, curriculum_type
  return data;
}
```

---

## ✅ BENEFITS OF THIS INTEGRATION

1. **Single Source of Truth**: Curriculum metadata lives ONLY in curriculum_data
2. **Data Consistency**: No risk of book_series and curriculum_data having different values
3. **Easier Updates**: Update curriculum once, affects all related book_series
4. **Better Queries**: Join book_series → curriculum_data for complete info
5. **Referential Integrity**: Foreign key prevents orphaned book_series

---

## 🎯 AGENT INSTRUCTIONS

**ALL FC-00-AC agents (B1-B6) MUST**:
1. ✅ Use THIS modified schema, NOT the original FC-00-AC.md schema
2. ✅ Reference curriculum_data.id via curriculum_id foreign key
3. ✅ Remove all references to curriculum_standard, grade, subject fields in book_series
4. ✅ Update unique constraints to use curriculum_id
5. ✅ Create proper TypeScript interfaces with curriculumId property
6. ✅ Document this integration in all evidence files

**VERIFICATION**:
```sql
-- Agents MUST verify this query works:
SELECT
  bs.series_name,
  bs.publisher,
  c.grade_level,
  c.subject_name,
  c.board,
  c.curriculum_type
FROM book_series bs
JOIN curriculum_data c ON bs.curriculum_id = c.id;
```

---

## 📋 ACCEPTANCE CRITERIA

- [x] book_series table has curriculum_id foreign key
- [x] book_series table does NOT have curriculum_standard, grade, subject fields
- [x] Unique constraint uses (series_name, publisher, curriculum_id)
- [x] Index created on curriculum_id for performance
- [x] All TypeScript interfaces use curriculumId property
- [x] JOIN queries work correctly between book_series and curriculum_data

---

**Document Status**: 🔴 **MANDATORY FOR ALL FC-00-AC AGENTS**
**Priority**: CRITICAL - Prevents data duplication and ensures FS-00-AD/FC-00-AC integration
**Agent Compliance**: ALL FC-00-AC agents MUST follow this, NOT original FC-00-AC.md schema
