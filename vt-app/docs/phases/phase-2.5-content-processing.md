# Phase 2.5: Content Processing & Curriculum Alignment

**Duration**: 1 day  
**Dependencies**: Phase 2 Complete  
**Goal**: Process existing NCERT textbooks and align wizard with available content
**Priority**: CRITICAL - Blocks Phase 3 development

---

## Problem Statement

**Current State:**
- Dashboard shows "0 Textbooks Available for study"
- 17 NCERT Class X Mathematics PDFs exist in `/text-books/Class X Mathematics/`
- PDF processing pipeline built but never used on actual content
- Wizard shows all CBSE grades/subjects but only Class X Mathematics available
- Students cannot learn because no processed content exists in database

**Goal State:**
- Dashboard shows 17 processed textbooks
- Wizard only offers Grade 10 Mathematics (available content)
- Textbook content accessible for AI tutor context
- Complete data flow: Wizard → Available Content → AI Learning

---

## Implementation Plan

### 2.5.1 Content Processing Pipeline (3 SP)

#### 2.5.1.1: Process NCERT Class X Mathematics PDFs (1.5 SP)
- Use existing PDF processing pipeline in `src/lib/textbook/processor.ts`
- Process all 17 PDFs in `/text-books/Class X Mathematics/`
- Extract text, identify chapters, chunk content
- Populate `textbooks`, `chapters`, `content_chunks` tables
- Verify processing quality and content structure

#### 2.5.1.2: Database Content Verification (0.5 SP)
- Query processed textbooks and verify data integrity
- Check chapter extraction accuracy
- Validate content chunk quality for AI context
- Test database queries for textbook retrieval
- Ensure all 17 chapters are properly indexed

#### 2.5.1.3: Content Metadata Enhancement (0.5 SP)
- Add proper titles and descriptions for each chapter
- Map content to CBSE curriculum topics
- Set appropriate difficulty levels and prerequisites
- Tag content for AI tutor context relevance
- Optimize content chunks for conversational AI

### 2.5.2 Curriculum Alignment (2 SP)

#### 2.5.2.1: Update Curriculum Data (1 SP)
- Modify `curriculum_data` table to reflect available content only
- Remove grades/subjects without processed textbooks
- Keep only Grade 10 Mathematics with actual chapter topics
- Update topic mapping to match processed content
- Ensure wizard data consistency

#### 2.5.2.2: Wizard Content Filtering (1 SP)
- Update wizard logic to show only available content
- Modify grade selection to show only Grade 10
- Update subject selection to show only Mathematics
- Filter topics based on processed textbook chapters
- Test complete wizard flow with new restrictions

### 2.5.3 UI Updates & Testing (1 SP)

#### 2.5.3.1: Dashboard Content Display (0.5 SP)
- Update dashboard to show processed textbook count
- Display available chapters and topics
- Show textbook processing status
- Add links to textbook content
- Verify "0 Textbooks" issue is resolved

#### 2.5.3.2: End-to-End Testing (0.5 SP)
- Test complete flow: Login → Wizard → Dashboard → Textbooks
- Verify wizard only shows available options
- Test textbook content accessibility
- Validate database queries and content retrieval
- Ensure UI reflects actual content availability

---

## Technical Specifications

### Existing Assets to Leverage

**PDF Processing Pipeline:**
- `src/lib/textbook/processor.ts` - Text extraction and chunking
- `src/lib/textbook/actions.ts` - Server actions for upload/processing
- `src/app/textbooks/` - UI components for textbook management

**Database Schema (Ready):**
```sql
textbooks: id, file_name, title, grade, subject, status
chapters: id, textbook_id, chapter_number, title, topics
content_chunks: id, chapter_id, content, content_type, page_number
curriculum_data: id, grade, subject, topics
```

**Content Location:**
- Source PDFs: `/text-books/Class X Mathematics/` (17 files)
- Processing pipeline: Already built, needs execution
- Target database: Supabase tables (configured)

### Processing Requirements

**PDF Files to Process:**
1. `000-prelims-and-contents.pdf`
2. `001-real-numbers.pdf`
3. `002-polynomials.pdf`
4. `003-pair-of-linear-equations-in-two-variables.pdf`
5. `004-quadratic-equations.pdf`
6. `005-arithmetic-progressions.pdf`
7. `006-triangles.pdf`
8. `007-coordinate-geometry.pdf`
9. `008-introduction-to-trigonometry.pdf`
10. `009-some-applications-of-trigonometry.pdf`
11. `010-circles.pdf`
12. `011-areas-related-to-circles.pdf`
13. `012-surface-areas-and-volumes.pdf`
14. `013-statistics.pdf`
15. `014-probability.pdf`
16. `015-appendix-1-proofs-in-mathematics.pdf`
17. `016-appendix-2-mathematical-modelling.pdf`
18. `017-answers.pdf`

**Content Quality Standards:**
- Chapter identification accuracy > 95%
- Content chunk size: 500-1000 tokens for AI context
- Topic mapping aligned with CBSE curriculum
- Searchable and contextually relevant for AI tutor

### Database Updates Required

**Curriculum Data Update:**
```sql
-- Remove all grades except 10
DELETE FROM curriculum_data WHERE grade != 10;

-- Remove all subjects except Mathematics for Grade 10
DELETE FROM curriculum_data WHERE grade = 10 AND subject != 'Mathematics';

-- Update Grade 10 Mathematics topics to match processed content
UPDATE curriculum_data 
SET topics = ARRAY[
  'Real Numbers', 'Polynomials', 'Pair of Linear Equations', 
  'Quadratic Equations', 'Arithmetic Progressions', 'Triangles',
  'Coordinate Geometry', 'Introduction to Trigonometry', 
  'Applications of Trigonometry', 'Circles', 'Areas Related to Circles',
  'Surface Areas and Volumes', 'Statistics', 'Probability'
]
WHERE grade = 10 AND subject = 'Mathematics';
```

**Content Processing Validation:**
- Verify each PDF produces textbook record
- Check chapter extraction creates proper hierarchy
- Validate content chunks are contextually meaningful
- Ensure topic mapping is accurate

---

## Success Criteria

### Functional Requirements
- [ ] Dashboard shows 17 textbooks (not 0)
- [ ] Wizard offers only Grade 10 Mathematics
- [ ] All 17 NCERT chapters processed and accessible
- [ ] Content chunks optimized for AI context (500-1000 tokens)
- [ ] Topic mapping aligned with processed content

### Data Quality Requirements
- [ ] 100% of PDFs successfully processed
- [ ] Chapter extraction accuracy > 95%
- [ ] Content chunks semantically meaningful
- [ ] Database queries return expected results
- [ ] No broken references or missing data

### User Experience Requirements
- [ ] Complete flow: Login → Wizard → Dashboard → Textbooks works
- [ ] Wizard shows only available options (no false promises)
- [ ] Dashboard accurately reflects content availability
- [ ] Textbook selection shows processed chapters
- [ ] UI is consistent and intuitive

### Technical Requirements
- [ ] All database tables properly populated
- [ ] Content searchable and retrievable for AI context
- [ ] Processing pipeline reusable for future content
- [ ] No performance issues with content queries
- [ ] Data integrity maintained across all operations

---

## Implementation Notes

### Execution Strategy
1. **Use Existing Pipeline:** Leverage built PDF processing system
2. **Batch Processing:** Process all 17 PDFs systematically
3. **Quality Validation:** Check each processed file for accuracy
4. **Database Updates:** Update curriculum data to match reality
5. **UI Verification:** Test all user-facing components

### Risk Mitigation
- **PDF Processing Errors:** Have fallback content extraction methods
- **Database Issues:** Backup before bulk operations
- **Content Quality:** Manual spot-checks for accuracy
- **UI Consistency:** Test all flows after database changes

### Future Considerations
- **Content Expansion:** Framework for adding more textbooks
- **Multi-Subject Support:** Easy addition of other subjects
- **Content Updates:** Process for updating existing content
- **Quality Assurance:** Automated content validation

---

## Phase Dependencies

**Blocks:**
- Phase 3: AI Classroom (cannot function without processed content)
- Phase 4: Advanced Features (requires content foundation)

**Enables:**
- AI tutor context from real textbook content
- Meaningful student learning experiences
- Accurate progress tracking based on actual curriculum
- Foundation for all subsequent development

**Estimated Effort:** 6-8 hours total
**Critical Path:** Must complete before Phase 3 begins
**Success Metric:** Students can learn from real processed NCERT content