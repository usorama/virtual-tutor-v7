# Phase 2 Research Findings

## Research Completed ✅

### Context7 Findings
- **react-use-wizard**: Lightweight, hook-based wizard library with async step handling
- **PDF.js**: Mozilla library for PDF rendering and text extraction
- Both libraries integrate well with Next.js 15

### Web Search Insights
- **Multi-Step Forms in 2025**: Use Server Actions + React Context + React Hook Form
- **Best Practices**: Progressive enhancement, Server-side validation with Zod
- **PDF Processing**: Use pdf.js-extract for text extraction, implement chunking strategies
- **Text Chunking**: 500-1000 token chunks with overlap for AI context

### Codebase Analysis
- **Server Actions Pattern**: Already using 'use server' for auth actions
- **Component Pattern**: Client components with useState for forms
- **Database Schema**: Comprehensive schema already defined with profiles, textbooks, chapters, content_chunks
- **Type Safety**: Strong TypeScript patterns established

## Architecture Decisions

### Part A: Class Selection Wizard

#### State Management
- Use React Context for wizard state (global across steps)
- Persist selections to localStorage for recovery
- Store final selections in profiles table

#### Component Structure
```
/app/wizard/
  layout.tsx        - Protected route wrapper
  page.tsx         - Wizard container with context
  [step]/page.tsx  - Dynamic step routing
/components/wizard/
  WizardProvider.tsx - React Context provider
  StepIndicator.tsx  - Progress visualization
  GradeSelector.tsx  - Grade 9-12 selection
  SubjectSelector.tsx - Subject cards
  TopicSelector.tsx  - Chapter/topic selection
```

#### Data Flow
1. User authenticated → Check if profile.grade exists
2. If not → Redirect to wizard
3. Complete wizard → Save to profiles table
4. Redirect to dashboard

### Part B: Textbook Processing

#### PDF Processing Architecture
```
Client → Upload PDF → Server Action → Queue Processing → Store in DB
                                    ↓
                            PDF.js Extract Text
                                    ↓
                            Chunk by Chapters
                                    ↓
                            Store in content_chunks
```

#### Libraries to Use
- **pdf.js-dist**: For PDF rendering and text extraction
- **pdf.js-extract**: For structured text extraction with positions
- **Server Actions**: For secure file upload handling

#### Chunking Strategy
1. Extract full text with page positions
2. Identify chapter boundaries (regex patterns)
3. Split into semantic chunks (500-1000 tokens)
4. Maintain 10% overlap between chunks
5. Store with metadata (page, chapter, type)

## Integration Points

### With Authentication (Phase 1)
- Wizard only accessible to authenticated users
- User profile linked to auth.users
- Middleware protection for wizard routes

### With Database Schema
- Profiles table: Store grade, preferred_subjects
- Textbooks table: Store uploaded PDFs
- Chapters table: Store extracted structure
- Content_chunks table: Store chunked text with embeddings

## Risk Mitigation

### Performance
- Process PDFs in background (queue system)
- Show progress indicators
- Cache processed textbooks

### User Experience
- Save wizard progress in localStorage
- Allow back navigation
- Clear validation messages
- Mobile-responsive design

### Security
- Validate file types (PDF only)
- Max file size limit (50MB)
- Sanitize extracted text
- RLS policies on all tables

## Implementation Order

1. **Database Setup**
   - Create profiles table extension
   - Run migrations
   - Setup RLS policies

2. **Wizard Components**
   - WizardProvider with Context
   - Step components
   - Navigation logic
   - Form validation

3. **Server Actions**
   - saveWizardSelections
   - getGrades, getSubjects, getTopics

4. **PDF Processing**
   - File upload handler
   - Text extraction service
   - Chunking algorithm
   - Database storage

5. **Integration Testing**
   - Full wizard flow
   - PDF processing
   - Auth integration
   - Error scenarios