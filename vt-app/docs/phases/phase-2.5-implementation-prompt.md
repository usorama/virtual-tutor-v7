# Phase 2.5 Implementation: NCERT Content Processing & Curriculum Alignment

## PROJECT CONTEXT & STATUS

**Project:** Virtual Tutor v7 - AI-powered educational platform  
**Location:** `/Users/umasankrudhya/Projects/vt-new-2/vt-app`  
**Current State:** Phase 2 COMPLETE - Authentication, wizard, and PDF pipeline built  
**Live URL:** http://localhost:3002  
**Test Account:** test@example.com / TestPassword123!

### CRITICAL PROBLEM TO SOLVE
**Dashboard shows "0 Textbooks Available for study" but we have 17 NCERT Class X Mathematics PDFs ready for processing**

The built PDF processing pipeline has never been used on actual content. Students cannot learn because no processed textbooks exist in the database, even though we have the source materials and processing capability.

---

## TECHNICAL ENVIRONMENT

**Stack:**
- Next.js 15 with Turbopack and TypeScript
- Supabase (authentication + database) - fully configured
- shadcn/ui components
- PDF.js processing pipeline (built, unused)

**Database Schema (Ready):**
```sql
-- Core tables for content processing
textbooks (id, file_name, title, grade, subject, status, ...)
chapters (id, textbook_id, chapter_number, title, topics, ...)
content_chunks (id, chapter_id, content, content_type, page_number, ...)
curriculum_data (id, grade, subject, topics, ...)
```

**Environment Variables (Configured):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://thhqeoiubohpxxempfpi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE
```

---

## IMPLEMENTATION OBJECTIVES

### PRIMARY GOAL
Process 17 NCERT Class X Mathematics PDFs and align the application to show only available content.

### SPECIFIC OUTCOMES REQUIRED
1. **Content Processing:** All 17 PDFs processed into database
2. **Curriculum Alignment:** Wizard shows only Grade 10 Mathematics  
3. **UI Updates:** Dashboard reflects actual textbook count
4. **Data Integrity:** Complete content accessibility for AI tutor context

---

## SOURCE MATERIALS

**PDF Location:** `/Users/umasankrudhya/Projects/vt-new-2/text-books/Class X Mathematics/`

**Files to Process (17 total):**
```
000-prelims-and-contents.pdf          001-real-numbers.pdf
002-polynomials.pdf                   003-pair-of-linear-equations-in-two-variables.pdf
004-quadratic-equations.pdf           005-arithmetic-progressions.pdf
006-triangles.pdf                     007-coordinate-geometry.pdf
008-introduction-to-trigonometry.pdf  009-some-applications-of-trigonometry.pdf
010-circles.pdf                       011-areas-related-to-circles.pdf
012-surface-areas-and-volumes.pdf     013-statistics.pdf
014-probability.pdf                   015-appendix-1-proofs-in-mathematics.pdf
016-appendix-2-mathematical-modelling.pdf  017-answers.pdf
```

---

## EXISTING CODEBASE ASSETS

### PDF Processing Pipeline (Built, Ready to Use)

**Core Processor:**
```typescript
// File: src/lib/textbook/processor.ts
// Functions: identifyChapters(), chunkContent(), processTextbook()
// Status: Built and tested, needs execution on actual PDFs
```

**Server Actions:**
```typescript
// File: src/lib/textbook/actions.ts  
// Functions: uploadTextbook(), processUploadedTextbook()
// Status: Ready for batch processing implementation
```

**UI Components:**
```typescript
// File: src/app/textbooks/page.tsx
// File: src/components/textbook/UploadForm.tsx
// Status: Built, needs to reflect processed content
```

### Wizard System (Needs Alignment)

**Curriculum Data Management:**
```typescript
// File: src/lib/wizard/actions.ts
// Function: getCurriculumData() - needs filtering
// Current: Shows all CBSE grades/subjects
// Required: Show only Grade 10 Mathematics
```

**Wizard Components:**
```typescript
// File: src/components/wizard/GradeSelector.tsx - restrict to Grade 10
// File: src/components/wizard/SubjectSelector.tsx - restrict to Mathematics  
// File: src/components/wizard/TopicSelector.tsx - align with processed content
```

### Database Integration (Configured)

**Supabase Client:**
```typescript
// File: src/lib/supabase/client.ts - configured and working
// File: src/lib/supabase/server.ts - server-side operations ready
```

---

## IMPLEMENTATION SEQUENCE

### Step 1: Batch PDF Processing (2-3 hours)

**Create Processing Script:**
```typescript
// File: scripts/process-ncert-textbooks.ts
// Objective: Process all 17 PDFs using existing pipeline
// Method: Loop through each PDF, extract text, identify chapters, chunk content
// Output: Populate textbooks, chapters, content_chunks tables
```

**Processing Requirements:**
- Use existing `processTextbook()` function from `src/lib/textbook/processor.ts`
- Extract chapters with 95%+ accuracy  
- Create content chunks of 500-1000 tokens for AI context
- Map content to CBSE curriculum topics
- Handle all 17 files systematically

### Step 2: Curriculum Data Alignment (1 hour)

**Database Updates:**
```sql
-- Remove all grades except 10
DELETE FROM curriculum_data WHERE grade != 10;

-- Remove all subjects except Mathematics for Grade 10  
DELETE FROM curriculum_data WHERE grade = 10 AND subject != 'Mathematics';

-- Update topics to match processed content
UPDATE curriculum_data SET topics = ARRAY['Real Numbers', 'Polynomials', ...] 
WHERE grade = 10 AND subject = 'Mathematics';
```

**Wizard Logic Updates:**
- Modify `getCurriculumData()` to filter available content only
- Update grade selector to show only Grade 10
- Update subject selector to show only Mathematics
- Align topic selector with processed chapters

### Step 3: UI Updates & Verification (1 hour)

**Dashboard Updates:**
- Verify textbook count displays correctly (17 instead of 0)
- Update textbook grid to show processed content
- Add chapter navigation and content preview

**End-to-End Testing:**
- Test flow: Login → Wizard (restricted options) → Dashboard (actual content)
- Verify database queries return processed content
- Check content accessibility for future AI integration

---

## TECHNICAL IMPLEMENTATION DETAILS

### Processing Script Template

```typescript
#!/usr/bin/env tsx
import { processTextbook } from '@/lib/textbook/processor'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const textbooksPath = '/Users/umasankrudhya/Projects/vt-new-2/text-books/Class X Mathematics'
const pdfFiles = [
  '001-real-numbers.pdf',
  '002-polynomials.pdf',
  // ... all 17 files
]

async function processAllNCERT() {
  for (const filename of pdfFiles) {
    const filePath = path.join(textbooksPath, filename)
    console.log(`Processing: ${filename}`)
    
    // Use existing processing pipeline
    await processTextbook({
      filePath,
      title: extractTitleFromFilename(filename),
      grade: 10,
      subject: 'Mathematics'
    })
    
    console.log(`✅ Completed: ${filename}`)
  }
}
```

### Database Validation Queries

```sql
-- Verify processing results
SELECT COUNT(*) FROM textbooks WHERE grade = 10 AND subject = 'Mathematics';
SELECT COUNT(*) FROM chapters WHERE textbook_id IN (SELECT id FROM textbooks WHERE grade = 10);
SELECT COUNT(*) FROM content_chunks WHERE chapter_id IN (SELECT id FROM chapters ...);

-- Check curriculum alignment  
SELECT grade, subject, array_length(topics, 1) as topic_count FROM curriculum_data;
```

### Wizard Component Updates

```typescript
// Update getCurriculumData() in src/lib/wizard/actions.ts
export async function getCurriculumData() {
  const { data } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', 10)  // Only Grade 10
    .eq('subject', 'Mathematics')  // Only Mathematics
    
  return data
}
```

---

## SUCCESS CRITERIA & VERIFICATION

### Functional Verification
- [ ] Dashboard shows "17 Textbooks Available for study" (not 0)
- [ ] Wizard grade selector shows only "Grade 10"
- [ ] Wizard subject selector shows only "Mathematics"  
- [ ] Wizard topics match processed chapter content
- [ ] Textbook page displays all 17 processed chapters

### Data Verification
```bash
# Run these queries to verify success
npx tsx -e "
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Check textbooks
const { data: textbooks } = await supabase.from('textbooks').select('*').eq('grade', 10)
console.log('Textbooks processed:', textbooks?.length)

// Check chapters  
const { data: chapters } = await supabase.from('chapters').select('*')
console.log('Chapters extracted:', chapters?.length)

// Check content chunks
const { data: chunks } = await supabase.from('content_chunks').select('*')  
console.log('Content chunks created:', chunks?.length)
"
```

### User Experience Verification
- Complete flow: http://localhost:3002/login → Wizard → Dashboard works
- Wizard only shows available options (no false promises)
- Dashboard accurately reflects processed content
- Students can now theoretically learn from real content

---

## ERROR HANDLING & FALLBACKS

### Common Issues & Solutions

**PDF Processing Errors:**
- Check file permissions and paths
- Verify PDF.js can read each file
- Handle corrupted or protected PDFs gracefully

**Database Connection Issues:**  
- Verify Supabase credentials in `.env.local`
- Check table permissions and RLS policies
- Test connection before bulk operations

**Content Quality Issues:**
- Manually verify chapter extraction accuracy
- Check content chunk sizes (500-1000 tokens optimal)
- Validate topic mapping against CBSE curriculum

### Rollback Strategy
- Backup database before bulk operations
- Keep processed content in staging before final commit
- Have manual cleanup scripts ready if needed

---

## COMPLETION DELIVERABLES

### Code Artifacts
1. **Processing Script:** `scripts/process-ncert-textbooks.ts` 
2. **Updated Actions:** Modified `src/lib/wizard/actions.ts`
3. **UI Updates:** Updated dashboard and wizard components
4. **Verification Script:** Database validation queries

### Documentation
1. **Processing Report:** What was processed, any issues encountered
2. **Content Mapping:** Chapters to topics alignment documentation  
3. **Testing Results:** Verification of all success criteria
4. **Next Steps:** Handoff notes for Phase 3 development

### Database State
- 17 textbooks in `textbooks` table (Grade 10 Mathematics)
- 100+ chapters in `chapters` table (from 17 PDFs)
- 1000+ content chunks in `content_chunks` table (AI-ready)
- Aligned `curriculum_data` (Grade 10 Mathematics only)

---

## PHASE 3 ENABLEMENT

Upon completion, Phase 2.5 enables:
- **AI Tutor Context:** Real textbook content for meaningful conversations
- **Accurate Learning:** Students learn from actual NCERT curriculum  
- **Progress Tracking:** Based on real chapters and topics
- **Scalable Foundation:** Framework for adding more content

**Critical Success Indicator:** Student can complete wizard, see textbooks on dashboard, and access chapter content - ready for AI-powered learning in Phase 3.

---

**IMPLEMENTATION TIME ESTIMATE:** 4-6 hours  
**PRIORITY:** CRITICAL - Blocks all subsequent development  
**COMPLEXITY:** Medium - leverages existing pipeline, requires systematic execution