# Phase 2 Implementation Plan

## Overview
Implement Class Selection Wizard and Textbook Processing System following established patterns from Phase 1 Authentication.

## Part A: Class Selection Wizard (Day 1-2)

### Step 1: Database Setup (30 min)
```sql
-- 1. Create migration file: supabase/migrations/002_profiles_extension.sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_topics JSONB DEFAULT '[]';

-- 2. Create grade/subject data
CREATE TABLE IF NOT EXISTS public.curriculum_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  UNIQUE(grade, subject)
);

-- 3. Insert CBSE curriculum data
INSERT INTO public.curriculum_data (grade, subject, topics) VALUES
(9, 'Mathematics', ARRAY['Number Systems', 'Algebra', 'Geometry', 'Statistics']),
(9, 'Science', ARRAY['Matter', 'Motion', 'Force', 'Work and Energy']),
(9, 'English', ARRAY['Literature', 'Grammar', 'Writing Skills']),
(10, 'Mathematics', ARRAY['Real Numbers', 'Polynomials', 'Triangles', 'Trigonometry']),
-- ... more data
```

### Step 2: Create Types (15 min)
```typescript
// src/types/wizard.ts
export interface WizardState {
  currentStep: number
  grade: number | null
  subjects: string[]
  topics: Record<string, string[]>
  isComplete: boolean
}

export interface CurriculumData {
  grade: number
  subject: string
  topics: string[]
}
```

### Step 3: Wizard Context Provider (30 min)
```typescript
// src/contexts/WizardContext.tsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { WizardState } from '@/types/wizard'

const WizardContext = createContext<{
  state: WizardState
  updateGrade: (grade: number) => void
  updateSubjects: (subjects: string[]) => void
  updateTopics: (subject: string, topics: string[]) => void
  nextStep: () => void
  previousStep: () => void
  reset: () => void
}>()

export function WizardProvider({ children }) {
  // Implementation with localStorage persistence
}
```

### Step 4: Server Actions (30 min)
```typescript
// src/lib/wizard/actions.ts
'use server'

export async function getCurriculumData(grade: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', grade)
  return { data, error }
}

export async function saveWizardSelections(selections: WizardState) {
  const supabase = await createClient()
  const user = await getUser()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      grade: selections.grade,
      preferred_subjects: selections.subjects,
      selected_topics: selections.topics,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    
  if (!error) {
    redirect('/dashboard')
  }
  return { error }
}
```

### Step 5: Wizard Layout & Container (45 min)
```typescript
// src/app/wizard/layout.tsx
// src/app/wizard/page.tsx
// Protected route with WizardProvider wrapper
```

### Step 6: Step Components (2 hours)
```typescript
// src/components/wizard/GradeSelector.tsx
// src/components/wizard/SubjectSelector.tsx  
// src/components/wizard/TopicSelector.tsx
// src/components/wizard/WizardSummary.tsx
// src/components/wizard/StepIndicator.tsx
// src/components/wizard/NavigationButtons.tsx
```

### Step 7: Integration & Testing (1 hour)
- Test full wizard flow
- Test persistence across refreshes
- Test validation and error states
- Test mobile responsiveness

## Part B: Textbook Processing (Day 2-3)

### Step 1: Install Dependencies (15 min)
```bash
pnpm add pdfjs-dist pdf-parse
pnpm add -D @types/pdf-parse
```

### Step 2: Configure Next.js for PDF.js (15 min)
```javascript
// next.config.mjs
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  }
}
```

### Step 3: Create Upload Component (45 min)
```typescript
// src/components/textbook/UploadForm.tsx
'use client'
import { useState } from 'react'
import { uploadTextbook } from '@/lib/textbook/actions'

export function UploadForm() {
  // File input with drag & drop
  // Progress indicator
  // Error handling
}
```

### Step 4: Server Actions for Upload (1 hour)
```typescript
// src/lib/textbook/actions.ts
'use server'
import { writeFile } from 'fs/promises'
import { processTextbook } from './processor'

export async function uploadTextbook(formData: FormData) {
  const file = formData.get('file') as File
  
  // Validate file
  if (!file || !file.name.endsWith('.pdf')) {
    return { error: 'Invalid file' }
  }
  
  // Save to temp location
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const path = `/tmp/${file.name}`
  await writeFile(path, buffer)
  
  // Create database entry
  const supabase = await createClient()
  const { data: textbook, error } = await supabase
    .from('textbooks')
    .insert({
      file_name: file.name,
      title: file.name.replace('.pdf', ''),
      status: 'processing',
      file_size_mb: file.size / (1024 * 1024)
    })
    .select()
    .single()
    
  // Queue for processing
  await processTextbook(textbook.id, path)
  
  return { data: textbook, error }
}
```

### Step 5: PDF Processing Service (2 hours)
```typescript
// src/lib/textbook/processor.ts
import * as pdfjsLib from 'pdfjs-dist'
import { extractText, identifyChapters, chunkContent } from './utils'

export async function processTextbook(textbookId: string, filePath: string) {
  try {
    // Load PDF
    const pdf = await pdfjsLib.getDocument(filePath).promise
    const numPages = pdf.numPages
    
    // Extract all text with page positions
    const fullText = await extractText(pdf)
    
    // Identify chapter boundaries
    const chapters = identifyChapters(fullText)
    
    // Process each chapter
    for (const chapter of chapters) {
      // Save chapter to database
      const chapterId = await saveChapter(textbookId, chapter)
      
      // Chunk content
      const chunks = chunkContent(chapter.content)
      
      // Save chunks
      await saveChunks(chapterId, chunks)
    }
    
    // Update textbook status
    await updateTextbookStatus(textbookId, 'ready')
    
  } catch (error) {
    await updateTextbookStatus(textbookId, 'failed', error.message)
  }
}
```

### Step 6: Chunking Algorithm (1 hour)
```typescript
// src/lib/textbook/chunker.ts
export function chunkContent(
  text: string,
  maxTokens: number = 800,
  overlapTokens: number = 100
): ContentChunk[] {
  // Split by paragraphs
  // Group into chunks
  // Maintain overlap
  // Preserve context
}
```

### Step 7: Admin UI for Textbooks (1 hour)
```typescript
// src/app/admin/textbooks/page.tsx
// List uploaded textbooks
// Show processing status
// Allow retry/delete
```

## Testing Checklist

### Wizard Testing
- [ ] Can select grade 9-12
- [ ] Can select multiple subjects
- [ ] Can select topics per subject
- [ ] Selections persist on refresh
- [ ] Saves to database on completion
- [ ] Redirects to dashboard
- [ ] Mobile responsive

### PDF Processing Testing  
- [ ] Can upload PDF file
- [ ] Shows upload progress
- [ ] Validates file type/size
- [ ] Extracts text correctly
- [ ] Identifies chapters
- [ ] Chunks content properly
- [ ] Saves to database
- [ ] Updates status correctly
- [ ] Handles errors gracefully

## Integration Points

### With Auth (Phase 1)
- Wizard requires authentication
- User ID linked to selections
- Protected routes working

### With Database
- Profiles table updated
- Textbooks table populated
- Chapters extracted
- Content chunks stored

### Next Phase (AI Classroom)
- User selections available
- Textbook content ready
- Chunks optimized for AI

## Success Criteria

1. User completes wizard in < 2 minutes
2. PDF processing handles 200+ page documents
3. Text extraction accuracy > 95%
4. Chunking maintains context
5. All TypeScript/ESLint checks pass
6. Fully integrated with auth system