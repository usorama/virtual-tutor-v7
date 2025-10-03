# FS-001: Curriculum Data Auto-Population from Textbooks
**Status**: Approved
**Priority**: P0 - CRITICAL
**Created**: October 3, 2025
**Issue ID**: Root Cause Analysis - Data Sync Gap
**Related**: FINAL-ROOT-CAUSE-ANALYSIS-EVIDENCE-BASED.md

---

## 🎯 PROBLEM STATEMENT

**Current State**:
- Database contains 5 textbooks (ready status)
- Only 1 curriculum_data entry exists (Grade 10 Mathematics)
- **4 textbooks have NO curriculum data** (80% gap)
- Wizard shows all textbooks to users
- When users select textbooks without curriculum → system breaks

**Evidence**:
```
Textbooks in DB: 5
Curriculum Entries: 1
Gap: 4 textbooks (80%)
Coverage: 20%

Missing curriculum_data for:
1. Grade 10 - Health and Physical Education
2. Grade 10 - Science
3. Grade 12 - English Language
4. Grade 99 - Healthcare Administration
```

**Impact**:
- Users select Grade 12 English → No curriculum to teach from
- Teachers (AI) can't structure lessons without curriculum
- Learning flow completely broken for 4 out of 5 textbooks
- Production blocker for any non-Math Grade 10 users

---

## 🎯 SOLUTION OVERVIEW

**Automatic Curriculum Sync System**

Create a robust system that automatically populates `curriculum_data` table from `textbooks` and their `chapters`:

1. **On textbook upload/processing**: Auto-extract topics from chapters
2. **Migration script**: One-time population for existing textbooks
3. **Validation**: Ensure every textbook has curriculum entry
4. **Monitoring**: Alert if sync drifts

---

## 📋 REQUIREMENTS

### Functional Requirements

**FR-1: Auto-Extract Curriculum from Chapters**
- When textbook status changes to "ready"
- Extract all topics from all chapters
- Create curriculum_data entry automatically
- Deduplicate topics across chapters

**FR-2: Migration for Existing Textbooks**
- One-time script to populate missing curriculum
- Process all 4 gap textbooks
- Verify data quality before committing

**FR-3: Validation & Constraints**
- Every textbook MUST have curriculum_data entry
- Database constraint: Cannot mark textbook as "ready" without curriculum
- API validation: Reject textbook without curriculum

**FR-4: Monitoring & Alerts**
- Daily check: textbooks count === curriculum_data count
- Alert if drift detected
- Dashboard showing sync status

### Non-Functional Requirements

**NFR-1: Performance**
- Curriculum extraction: < 5 seconds per textbook
- Migration script: < 2 minutes for all textbooks

**NFR-2: Data Quality**
- Topics properly formatted (Title Case)
- No duplicates within same curriculum
- Minimum 3 topics per textbook

**NFR-3: Idempotency**
- Re-running sync should be safe
- No duplicate curriculum_data entries
- UPSERT on (grade, subject) unique constraint

---

## 🏗️ TECHNICAL DESIGN

### Database Schema

**Current** (Problem):
```sql
-- No foreign key relationship
CREATE TABLE textbooks (...);
CREATE TABLE curriculum_data (...);
-- Result: Data can drift
```

**Proposed** (Solution):
```sql
-- Add unique constraint
ALTER TABLE curriculum_data
ADD CONSTRAINT unique_grade_subject UNIQUE (grade, subject);

-- Add validation
CREATE FUNCTION validate_textbook_has_curriculum()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ready' THEN
    IF NOT EXISTS (
      SELECT 1 FROM curriculum_data
      WHERE grade = NEW.grade AND subject = NEW.subject
    ) THEN
      RAISE EXCEPTION 'Cannot mark textbook as ready without curriculum_data';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_curriculum_exists
BEFORE UPDATE ON textbooks
FOR EACH ROW
EXECUTE FUNCTION validate_textbook_has_curriculum();
```

### Auto-Sync Logic

**File**: `src/lib/textbooks/curriculum-sync.ts`

```typescript
export async function syncCurriculumFromTextbook(textbookId: string) {
  // 1. Get textbook details
  const { data: textbook } = await supabase
    .from('textbooks')
    .select('id, title, grade, subject')
    .eq('id', textbookId)
    .single();

  // 2. Get all chapters and extract topics
  const { data: chapters } = await supabase
    .from('chapters')
    .select('topics')
    .eq('textbook_id', textbookId);

  // 3. Flatten and deduplicate topics
  const allTopics = chapters
    .flatMap(ch => ch.topics || [])
    .filter((topic, idx, arr) => arr.indexOf(topic) === idx); // Dedupe

  // 4. Upsert curriculum_data
  const { error } = await supabase
    .from('curriculum_data')
    .upsert({
      grade: textbook.grade,
      subject: textbook.subject,
      topics: allTopics,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'grade,subject'
    });

  return { success: !error, topicsCount: allTopics.length };
}
```

### Migration Script

**File**: `scripts/migrate-curriculum-data.ts`

```typescript
#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { syncCurriculumFromTextbook } from '../src/lib/textbooks/curriculum-sync';

async function migrateAllTextbooks() {
  // Get all ready textbooks
  const { data: textbooks } = await supabase
    .from('textbooks')
    .select('id, title, grade, subject, status')
    .eq('status', 'ready');

  console.log(`Found ${textbooks.length} textbooks to process\n`);

  for (const tb of textbooks) {
    console.log(`Processing: Grade ${tb.grade} - ${tb.subject}`);

    // Check if curriculum exists
    const { data: existing } = await supabase
      .from('curriculum_data')
      .select('id')
      .eq('grade', tb.grade)
      .eq('subject', tb.subject)
      .single();

    if (existing) {
      console.log(`  ✅ Curriculum already exists, skipping`);
      continue;
    }

    // Sync curriculum
    const result = await syncCurriculumFromTextbook(tb.id);

    if (result.success) {
      console.log(`  ✅ Created curriculum with ${result.topicsCount} topics`);
    } else {
      console.log(`  ❌ Failed to create curriculum`);
    }
  }

  console.log('\nMigration complete!');
}

migrateAllTextbooks();
```

---

## 🔄 IMPLEMENTATION PLAN

### Phase 1: Immediate Fix (2 hours)

**Goal**: Populate missing curriculum for 4 textbooks

**Steps**:
1. Create `syncCurriculumFromTextbook` function
2. Create migration script
3. Run migration for 4 gap textbooks
4. Verify Grade 12 English now works

**Success Criteria**:
- curriculum_data has 5 entries (100% coverage)
- deethya@gmail.com can select Grade 12 English and get curriculum
- No errors in classroom when teaching Grade 12 English

### Phase 2: Automation (4 hours)

**Goal**: Auto-sync on textbook upload

**Steps**:
1. Create database trigger (validate_textbook_has_curriculum)
2. Add post-processing hook in textbook upload pipeline
3. Call syncCurriculumFromTextbook after chapter extraction
4. Add unique constraint to curriculum_data

**Success Criteria**:
- New textbooks automatically get curriculum
- Cannot mark textbook as "ready" without curriculum
- Database enforces data integrity

### Phase 3: Monitoring (2 hours)

**Goal**: Detect and alert on drift

**Steps**:
1. Create daily cron job to check sync status
2. Dashboard showing textbooks vs curriculum count
3. Email alert if gap detected
4. Admin page to manually trigger sync

**Success Criteria**:
- Real-time visibility into sync status
- Automatic alerts on drift
- Manual recovery option

---

## 📊 ACCEPTANCE CRITERIA

### Must Have (P0)

- [ ] All 5 textbooks have curriculum_data entries
- [ ] deethya@gmail.com can select Grade 12 English and get teaching
- [ ] Migration script runs successfully (idempotent)
- [ ] Curriculum extracted from chapters (not manual entry)
- [ ] Unique constraint on (grade, subject) in curriculum_data

### Should Have (P1)

- [ ] Auto-sync on textbook upload
- [ ] Database trigger prevents ready without curriculum
- [ ] Admin dashboard shows sync status
- [ ] Manual sync button for admins

### Could Have (P2)

- [ ] Daily drift detection cron
- [ ] Email alerts on sync failures
- [ ] Curriculum quality validation (min 3 topics)
- [ ] Topic deduplication across books

---

## 🧪 TESTING STRATEGY

### Unit Tests

**Test: syncCurriculumFromTextbook()**
```typescript
test('extracts topics from chapters', async () => {
  const result = await syncCurriculumFromTextbook('textbook-id');
  expect(result.success).toBe(true);
  expect(result.topicsCount).toBeGreaterThan(0);
});

test('deduplicates topics', async () => {
  // Chapters: ["Topic A", "Topic B"], ["Topic A", "Topic C"]
  const result = await syncCurriculumFromTextbook('textbook-id');
  // Should only have: ["Topic A", "Topic B", "Topic C"]
  expect(result.topicsCount).toBe(3);
});

test('handles textbook without chapters', async () => {
  const result = await syncCurriculumFromTextbook('empty-textbook-id');
  expect(result.success).toBe(false);
  expect(result.error).toContain('No chapters found');
});
```

### Integration Tests

**Test: Migration Script**
```bash
# Start with gap
SELECT COUNT(*) FROM curriculum_data; -- 1

# Run migration
npx tsx scripts/migrate-curriculum-data.ts

# Verify coverage
SELECT COUNT(*) FROM curriculum_data; -- 5 (100%)
```

### E2E Tests

**Test: User Flow**
```
1. User logs in as deethya@gmail.com
2. User selects Grade 12 English in wizard
3. User starts classroom session
4. Verify: AI teacher receives Grade 12 English curriculum
5. Verify: Teacher can teach Comprehension topics
```

---

## 📈 METRICS & MONITORING

### Key Metrics

1. **Curriculum Coverage**
   - Formula: `(curriculum_data.count / textbooks.count) * 100`
   - Target: 100%
   - Alert: < 95%

2. **Sync Lag**
   - Time between textbook "ready" and curriculum creation
   - Target: < 5 seconds
   - Alert: > 30 seconds

3. **Topic Quality**
   - Average topics per curriculum
   - Target: > 10 topics
   - Alert: < 3 topics

### Dashboard Query

```sql
SELECT
  COUNT(DISTINCT CONCAT(grade, '-', subject)) as textbooks_count,
  (SELECT COUNT(*) FROM curriculum_data) as curriculum_count,
  ROUND(
    (SELECT COUNT(*) FROM curriculum_data)::numeric /
    COUNT(DISTINCT CONCAT(grade, '-', subject))::numeric * 100,
    2
  ) as coverage_percentage
FROM textbooks
WHERE status = 'ready';
```

---

## 🚨 RISKS & MITIGATIONS

### Risk 1: Poor Quality Topics from Chapters

**Risk**: Chapter topics might be poorly formatted or missing
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Validate topics before inserting (Title Case, min length)
- Manual review dashboard for curriculum quality
- Allow admin override for poor auto-extracted topics

### Risk 2: Performance with Large Textbooks

**Risk**: 1000+ chapter textbook takes too long to process
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Process chapters in batches of 100
- Async job queue for curriculum extraction
- Progress indicator for admins

### Risk 3: Data Drift Over Time

**Risk**: Manual DB changes bypass sync system
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Database triggers enforce constraints
- Daily sync validation cron
- Audit log for manual changes

---

## 📝 ROLLOUT PLAN

### Week 1: Development
- Day 1-2: Build sync function + migration script
- Day 3: Run migration, verify 100% coverage
- Day 4-5: Add automation (triggers, post-processing)

### Week 2: Testing
- Day 1-2: Unit + integration tests
- Day 3: E2E testing with real users
- Day 4-5: Load testing, edge cases

### Week 3: Deployment
- Day 1: Deploy to staging
- Day 2-3: Staging validation
- Day 4: Production deployment
- Day 5: Monitoring, rollback plan ready

### Rollback Plan

If sync breaks production:
1. Disable auto-sync trigger immediately
2. Restore curriculum_data from backup
3. Fall back to manual curriculum entry
4. Investigate root cause offline

---

## 📚 DOCUMENTATION UPDATES

After implementation, update:

1. **README.md**: Add curriculum sync section
2. **Database Schema Docs**: Document constraints
3. **Admin Guide**: Manual sync procedures
4. **API Docs**: curriculum sync endpoints
5. **Troubleshooting Guide**: Common sync issues

---

## ✅ DEFINITION OF DONE

- [ ] All 5 textbooks have curriculum_data (verified by query)
- [ ] Grade 12 English teaches successfully (tested with deethya@gmail.com)
- [ ] Migration script is idempotent (can run multiple times safely)
- [ ] Database triggers enforce curriculum before "ready" status
- [ ] Unit tests pass (>80% coverage for sync function)
- [ ] Integration tests pass (migration script tested)
- [ ] E2E test passes (user selects textbook → gets teaching)
- [ ] Documentation updated
- [ ] Admin dashboard shows sync status
- [ ] Monitoring alerts configured

---

## 🔗 RELATED DOCUMENTS

- `FINAL-ROOT-CAUSE-ANALYSIS-EVIDENCE-BASED.md` - Issue identification
- `scripts/analyze-curriculum-gap.ts` - Gap analysis script
- Database schema: `supabase/migrations/002_profiles_and_curriculum.sql`

---

## 📞 STAKEHOLDERS

**Owner**: Product Team
**Approver**: System Architect
**Implementer**: Backend Team
**Reviewer**: QA Team
**Users Affected**: All students selecting textbooks in wizard

---

**Status**: ✅ APPROVED FOR IMPLEMENTATION
**Next Action**: Begin Phase 1 - Immediate Fix (2 hours)
**Expected Completion**: October 5, 2025
