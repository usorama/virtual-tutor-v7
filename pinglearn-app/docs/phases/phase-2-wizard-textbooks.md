# Phase 2: Class Wizard & Textbook Processing

**Duration**: 3 days  
**Dependencies**: Phase 0 & 1 Complete  
**Goal**: Implement class selection wizard and PDF textbook processing system

## Part A: Class Selection Wizard (3 SP)

### 2.1 Wizard Container & Navigation (1 SP)
- 2.1.1: Create wizard page container (0.1 SP)
- 2.1.2: Setup wizard layout with steps (0.1 SP)
- 2.1.3: Implement step routing logic (0.1 SP)
- 2.1.4: Create step indicator component (0.1 SP)
- 2.1.5: Add navigation buttons (0.1 SP)
- 2.1.6: Implement back/next logic (0.1 SP)
- 2.1.7: Add step validation (0.1 SP)
- 2.1.8: Setup wizard state management (0.1 SP)
- 2.1.9: Add progress persistence (0.1 SP)
- 2.1.10: Test navigation flow (0.1 SP)

### 2.2 Grade & Subject Selection (1 SP)
- 2.2.1: Create GradeSelector component (0.1 SP)
- 2.2.2: Design grade selection UI (0.1 SP)
- 2.2.3: Create SubjectSelector component (0.1 SP)
- 2.2.4: Load subjects based on grade (0.1 SP)
- 2.2.5: Add subject icons/images (0.1 SP)
- 2.2.6: Implement selection validation (0.1 SP)
- 2.2.7: Add selection animations (0.1 SP)
- 2.2.8: Handle edge cases (0.1 SP)
- 2.2.9: Add accessibility features (0.1 SP)
- 2.2.10: Test selection states (0.1 SP)

### 2.3 Topic Selection & Completion (1 SP)
- 2.3.1: Create TopicSelector component (0.1 SP)
- 2.3.2: Load topics from textbook data (0.1 SP)
- 2.3.3: Design topic card UI (0.1 SP)
- 2.3.4: Create WizardSummary component (0.1 SP)
- 2.3.5: Show selection confirmation (0.1 SP)
- 2.3.6: Implement wizard completion API (0.1 SP)
- 2.3.7: Save selections to database (0.1 SP)
- 2.3.8: Navigate to classroom on complete (0.1 SP)
- 2.3.9: Handle completion errors (0.1 SP)
- 2.3.10: Test full wizard flow (0.1 SP)

## Part B: Textbook Processing (4 SP)

### 2.4 PDF Processing Setup (1 SP)
- 2.4.1: Install PDF.js library (0.1 SP)
- 2.4.2: Setup PDF parser module (0.1 SP)
- 2.4.3: Create file upload handler (0.1 SP)
- 2.4.4: Implement PDF validation (0.1 SP)
- 2.4.5: Setup processing queue (0.1 SP)
- 2.4.6: Add progress tracking (0.1 SP)
- 2.4.7: Handle large files (0.1 SP)
- 2.4.8: Add error recovery (0.1 SP)
- 2.4.9: Setup logging (0.1 SP)
- 2.4.10: Test PDF loading (0.1 SP)

### 2.5 Content Extraction (1 SP)
- 2.5.1: Extract text from PDFs (0.1 SP)
- 2.5.2: Identify chapter boundaries (0.1 SP)
- 2.5.3: Extract table of contents (0.1 SP)
- 2.5.4: Parse section headers (0.1 SP)
- 2.5.5: Extract metadata (0.1 SP)
- 2.5.6: Handle different PDF formats (0.1 SP)
- 2.5.7: Clean extracted text (0.1 SP)
- 2.5.8: Preserve formatting hints (0.1 SP)
- 2.5.9: Extract page numbers (0.1 SP)
- 2.5.10: Validate extraction quality (0.1 SP)

### 2.6 Content Chunking & Storage (1 SP)
- 2.6.1: Implement chunking algorithm (0.1 SP)
- 2.6.2: Create optimal chunk sizes (0.1 SP)
- 2.6.3: Maintain context overlap (0.1 SP)
- 2.6.4: Store chunks in database (0.1 SP)
- 2.6.5: Create chunk metadata (0.1 SP)
- 2.6.6: Build chapter hierarchy (0.1 SP)
- 2.6.7: Index for searching (0.1 SP)
- 2.6.8: Add chunk relationships (0.1 SP)
- 2.6.9: Optimize storage format (0.1 SP)
- 2.6.10: Test retrieval speed (0.1 SP)

### 2.7 Textbook API & Management (1 SP)
- 2.7.1: Create process textbook endpoint (0.1 SP)
- 2.7.2: Create list textbooks endpoint (0.1 SP)
- 2.7.3: Create get textbook endpoint (0.1 SP)
- 2.7.4: Create search endpoint (0.1 SP)
- 2.7.5: Implement admin UI (0.1 SP)
- 2.7.6: Add processing status (0.1 SP)
- 2.7.7: Show processing errors (0.1 SP)
- 2.7.8: Add retry mechanism (0.1 SP)
- 2.7.9: Create textbook catalog (0.1 SP)
- 2.7.10: Test all endpoints (0.1 SP)

## Success Criteria
- [ ] Wizard guides through grade → subject → topic
- [ ] Selections persist across sessions
- [ ] PDF textbooks process successfully
- [ ] Content is properly chunked and indexed
- [ ] Search returns relevant results
- [ ] Processing handles large PDFs (100+ pages)
- [ ] Admin can monitor processing status
- [ ] Errors are logged and recoverable

## Files to Create
- `/src/app/wizard/page.tsx`
- `/src/app/wizard/layout.tsx`
- `/src/app/wizard/[step]/page.tsx`
- `/src/components/wizard/StepIndicator.tsx`
- `/src/components/wizard/GradeSelector.tsx`
- `/src/components/wizard/SubjectSelector.tsx`
- `/src/components/wizard/TopicSelector.tsx`
- `/src/components/wizard/WizardNavigation.tsx`
- `/src/components/wizard/WizardSummary.tsx`
- `/src/app/api/wizard/grades/route.ts`
- `/src/app/api/wizard/subjects/route.ts`
- `/src/app/api/wizard/topics/route.ts`
- `/src/app/api/wizard/complete/route.ts`
- `/src/lib/pdf/parser.ts`
- `/src/lib/pdf/chunker.ts`
- `/src/lib/pdf/indexer.ts`
- `/src/app/api/textbooks/process/route.ts`
- `/src/app/api/textbooks/list/route.ts`
- `/src/app/api/textbooks/[id]/route.ts`
- `/src/app/api/textbooks/search/route.ts`
- `/src/hooks/useWizard.ts`
- `/src/stores/wizardStore.ts`
- `/src/types/wizard.ts`
- `/src/types/textbook.ts`
- `/scripts/process-textbooks.ts`

## Key Implementation Notes
- Keep wizard steps simple and clear
- Show progress visually at all times
- Validate each step before proceeding
- Process PDFs in background jobs
- Use reasonable chunk sizes (500-1000 tokens)
- Maintain context overlap between chunks
- Index content for fast retrieval
- Handle PDF processing failures gracefully