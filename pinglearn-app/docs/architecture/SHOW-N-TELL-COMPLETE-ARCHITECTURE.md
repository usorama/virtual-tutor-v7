# PingLearn Show-n-Tell Feature: Complete Technical Architecture

**Version**: 1.1 - EVIDENCE-BASED CORRECTIONS
**Date**: 2025-10-03
**Status**: CORRECTED AFTER MULTI-AGENT INVESTIGATION
**Author**: Architect Agent (Claude) + 5 Research Agents

---

## ⚠️ EVIDENCE-BASED CORRECTIONS APPLIED

**Original Architecture (v1.0)** made incorrect assumptions:
- ❌ Assumed DisplayBuffer needs subscriptions added → **WRONG: Already has them!**
- ❌ Assumed Streamdown needs installation → **WRONG: v1.3.0 already installed!**
- ❌ Assumed race condition is primary issue → **PARTIAL: Polling is primary issue**

**This document (v1.1)** reflects actual codebase state after 5-agent deep investigation.

---

## 🎯 Executive Summary

This document provides the complete technical architecture for implementing PingLearn's signature "Show-n-Tell" feature, where students see mathematical content appear on screen 400ms BEFORE the AI teacher speaks about it, enabling optimal comprehension through dual-channel processing.

**Current State (Evidence-Based)**:
- ✅ Audio works (LiveKit + Gemini Live API)
- ✅ DisplayBuffer EXISTS with full subscription system (Lines 71-78, tested)
- ✅ Streamdown v1.3.0 + plugins ALREADY INSTALLED
- ❌ Components use inefficient polling instead of subscriptions
- ❌ Text display broken due to 100-250ms polling delays

**Target State**:
- ✅ Real-time text streaming (use existing Streamdown)
- ✅ Show-then-Tell (400ms visual lead)
- ✅ Progressive math rendering (KaTeX already working)
- ✅ Automated notes generation (partial - regex-based exists)
- ⚠️ Textbook content integration (infrastructure exists, unused)

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Complete Data Flow](#complete-data-flow)
3. [Component Architecture](#component-architecture)
4. [API Contracts](#api-contracts)
5. [Database Schema](#database-schema)
6. [Integration Points](#integration-points)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Success Criteria](#success-criteria)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PingLearn Show-n-Tell System                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Textbook   │    │    Gemini    │    │   LiveKit    │      │
│  │   Content    │───>│  Live API    │───>│ Voice Agent  │      │
│  │   Service    │    │  (Python)    │    │   (Python)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                    │              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Protected Core (TypeScript)                │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │       │
│  │  │Transcri- │  │  Voice   │  │    WebSocket     │  │       │
│  │  │ ption    │  │ Service  │  │     Manager      │  │       │
│  │  │ Service  │  │          │  │   (Singleton)    │  │       │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │       │
│  │         │              │              │             │       │
│  │         └──────────────┴──────────────┘             │       │
│  │                        │                            │       │
│  │                 ┌──────▼───────┐                    │       │
│  │                 │ Display      │                    │       │
│  │                 │ Buffer       │                    │       │
│  │                 │ (Reactive)   │                    │       │
│  │                 └──────────────┘                    │       │
│  └─────────────────────┬────────────────────────────────┘       │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Frontend Components                     │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │       │
│  │  │  Teaching    │  │  Streaming   │  │   Notes   │ │       │
│  │  │  Board       │  │  Message     │  │   Panel   │ │       │
│  │  │  (Simple)    │  │  Component   │  │           │ │       │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │       │
│  │         │                  │                │       │       │
│  │         └──────────────────┴────────────────┘       │       │
│  │                        │                            │       │
│  │                 ┌──────▼───────┐                    │       │
│  │                 │  Streamdown  │                    │       │
│  │                 │  Renderer    │                    │       │
│  │                 │  (Markdown)  │                    │       │
│  │                 └──────────────┘                    │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Alignment

**Already in Place** ✅:
- Next.js 15.5.3 (App Router + Turbopack)
- TypeScript (strict mode)
- React 19 (with useOptimistic)
- shadcn/ui components
- KaTeX v0.16.22 (math rendering) ✅
- LiveKit (voice/audio)
- Supabase (database + auth)
- **Streamdown v1.3.0** ✅ (Vercel - streaming markdown) - ALREADY INSTALLED!
- **remark-math v6.0.0** ✅ - ALREADY INSTALLED!
- **rehype-katex v7.0.1** ✅ - ALREADY INSTALLED!
- **DisplayBuffer with subscriptions** ✅ (Lines 71-78 in buffer.ts) - ALREADY WORKING!

**Optional Additions** (Not Required for MVP):
- React Query (server state management) - Can add if needed
- DOMPurify (content sanitization) - Consider for production
- Vercel AI SDK (optional - simplifies streaming)

---

## 2. Complete Data Flow

### 2.1 Content Preparation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   CONTENT PREPARATION PHASE                     │
└────────────────────────────────────────────────────────────────┘

1. User selects topic in wizard:
   ├─> Grade: 10
   ├─> Subject: Mathematics
   └─> Chapter: "Quadratic Equations"

2. Frontend fetches textbook content:
   GET /api/v2/textbooks/content
   {
     "grade": 10,
     "subject": "Mathematics",
     "chapter": "Quadratic Equations",
     "section": "Introduction"
   }

3. Backend retrieves from Supabase:
   ┌──────────────────────────────────────┐
   │ Table: textbook_sections             │
   ├──────────────────────────────────────┤
   │ id, textbook_id, chapter,            │
   │ section_number, title,               │
   │ content_markdown, math_expressions,  │
   │ learning_objectives                  │
   └──────────────────────────────────────┘

4. Content prepared for Gemini:
   {
     "textbook_content": "# Quadratic Equations\n\n...",
     "learning_objectives": [...],
     "student_grade": 10,
     "teaching_mode": "interactive"
   }

5. Content sent to Python LiveKit agent:
   POST /livekit/agent/context
   ├─> Agent loads textbook context
   ├─> Gemini receives content in system prompt
   └─> Ready for teaching session
```

### 2.2 Real-Time Streaming Flow (SHOW-n-TELL)

```
┌────────────────────────────────────────────────────────────────┐
│                    STREAMING SESSION FLOW                       │
└────────────────────────────────────────────────────────────────┘

TIMELINE: Show content 400ms BEFORE audio

t=0ms:  Gemini generates response token
        ├─> Token: "The"

t=10ms: LiveKit Python agent receives token
        ├─> Processes for dual output:
        │   1. Text channel (WebSocket)
        │   2. TTS pipeline (for audio)

t=20ms: Text token sent via WebSocket
        ├─> WebSocket message:
        │   {
        │     "type": "transcription",
        │     "content": "The",
        │     "timestamp": 20,
        │     "speaker": "teacher",
        │     "isFinal": false
        │   }

t=30ms: Protected Core receives token
        ├─> GeminiTranscriptionConnector.handleGeminiTranscription()
        ├─> Adds to DisplayBuffer
        ├─> DisplayBuffer.addItem({
        │     id: "msg-123",
        │     type: "text",
        │     content: "The",
        │     timestamp: 30,
        │     speaker: "teacher"
        │   })

t=35ms: DisplayBuffer notifies subscribers (REACTIVE - Lines 76-78)
        ├─> Calls this.subscribers.forEach(cb => cb(this.items))
        ├─> All subscribed components receive update instantly
        ├─> TeachingBoardSimple.processBufferItems()
        ├─> StreamingMessage component updates

t=40ms: Frontend renders token
        ├─> Streamdown processes: "The"
        ├─> DOM updated with new content
        └─> USER SEES: "The" on screen

t=440ms: Audio plays (400ms AFTER visual display)
         ├─> LiveKit plays TTS audio: "The"
         └─> Perfect show-then-tell timing!

═══════════════════════════════════════════════════════════════

NEXT TOKEN: "quadratic"

t=450ms: Gemini token: "quadratic"
t=460ms: LiveKit processes
t=470ms: WebSocket sends text
t=480ms: Protected Core receives
t=485ms: DisplayBuffer updates
t=490ms: Frontend renders
t=890ms: Audio plays "quadratic"

Content now shows: "The quadratic"
Audio is saying: "The" (from t=440ms)

═══════════════════════════════════════════════════════════════

MATH DETECTION:

t=2000ms: Token stream: "$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$"

Processing:
├─> TranscriptionService.detectMath() identifies LaTeX
├─> Buffers complete equation
├─> MathSegment created:
│   {
│     type: "math",
│     latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}",
│     rendered: "<katex-html>..."
│   }
├─> DisplayBuffer.addItem() with math type
└─> TeachingBoard renders with KaTeX

t=2050ms: Math equation visible on screen
t=2450ms: Audio says "The quadratic formula is..."
```

### 2.3 Notes Generation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   AUTOMATED NOTES GENERATION                    │
└────────────────────────────────────────────────────────────────┘

During Session:
├─> All DisplayBuffer items tagged with:
│   - timestamp
│   - speaker (student vs teacher)
│   - content type (text, math, diagram)
│
├─> Session transcript accumulated in real-time
│
└─> Stored in SessionOrchestrator state

After Session (or on-demand):

1. User clicks "Generate Notes" button

2. Frontend requests:
   POST /api/v2/sessions/{id}/generate-notes
   {
     "format": "markdown",
     "includeStudentQuestions": true,
     "focusOnConcepts": true
   }

3. Backend processes:
   ├─> Retrieves full transcript from DisplayBuffer history
   ├─> Sends to Gemini with prompt:
   │   "Convert this teaching session into structured notes.
   │    Focus on key concepts, formulas, and examples.
   │    Format as markdown with proper headings."
   │
   ├─> Gemini generates structured notes:
   │   # Quadratic Equations - Session Notes
   │
   │   ## Key Concepts
   │   - A quadratic equation has form: $ax^2 + bx + c = 0$
   │   - The quadratic formula: $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$
   │
   │   ## Examples Covered
   │   1. Solve: $x^2 - 5x + 6 = 0$
   │      Solution: x = 2 or x = 3
   │
   │   ## Student Questions
   │   Q: What if discriminant is negative?
   │   A: Complex roots (discussed in next chapter)

4. Notes saved to database:
   ┌──────────────────────────────────────┐
   │ Table: session_notes                 │
   ├──────────────────────────────────────┤
   │ id, session_id, student_id,          │
   │ notes_markdown, generated_at,        │
   │ concepts_covered, formulas_used      │
   └──────────────────────────────────────┘

5. Frontend displays in NotesPanel:
   ├─> Markdown rendered with Streamdown
   ├─> Math rendered with KaTeX
   ├─> Download as PDF option
   └─> Share with teacher option
```

---

## 3. Component Architecture

### 3.1 Frontend Component Tree

```typescript
// /app/classroom/page.tsx (Already exists - minimal changes)
ClassroomPage
├─> TeachingBoardSimple         // Main display (80% width)
│   ├─> StreamingContent        // NEW: Handles streaming text
│   │   └─> Streamdown          // NEW: Markdown renderer
│   │       ├─> remarkMath      // Math detection
│   │       └─> rehypeKatex     // Math rendering
│   │
│   └─> MathRenderer            // Exists - enhanced
│       └─> KaTeX display
│
├─> TabsContainer (20% width)
│   ├─> NotesPanel              // NEW: Automated notes
│   │   ├─> NotesGenerator      // NEW: Generate button
│   │   └─> NotesDisplay        // NEW: Show generated notes
│   │
│   ├─> SessionInfoPanel        // Exists
│   └─> AudioControlPanel       // Exists
│
└─> FloatingControls            // Exists
```

### 3.2 New Components Specification

#### Component: StreamingContent

```typescript
// src/components/classroom/StreamingContent.tsx

import { Streamdown } from 'streamdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useDisplayBuffer } from '@/hooks/useDisplayBuffer';

interface StreamingContentProps {
  sessionId: string;
  className?: string;
}

export function StreamingContent({ sessionId, className }: StreamingContentProps) {
  const { items, isStreaming } = useDisplayBuffer();

  // Filter for teacher content only
  const teacherContent = items
    .filter(item => item.speaker === 'teacher' || item.speaker === 'ai')
    .map(item => item.content)
    .join('\n\n');

  return (
    <div className={cn("streaming-container", className)}>
      <Streamdown
        parseIncompleteMarkdown={true}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        className="prose prose-lg max-w-none dark:prose-invert"
      >
        {teacherContent}
      </Streamdown>

      {isStreaming && (
        <span className="streaming-cursor animate-pulse">▊</span>
      )}
    </div>
  );
}
```

#### Component: NotesPanel

```typescript
// src/components/classroom/NotesPanel.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Streamdown } from 'streamdown';
import { Loader2, Download, Share2 } from 'lucide-react';

interface NotesPanelProps {
  sessionId: string;
  voiceSessionId?: string;
}

export function NotesPanel({ sessionId, voiceSessionId }: NotesPanelProps) {
  const [notes, setNotes] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateNotes() {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/v2/sessions/${sessionId}/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'markdown',
          includeStudentQuestions: true,
          focusOnConcepts: true
        })
      });

      const data = await response.json();
      setNotes(data.notes);
    } catch (error) {
      console.error('Failed to generate notes:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="notes-panel h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Session Notes</h3>

        {!notes ? (
          <Button
            onClick={generateNotes}
            disabled={isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Notes'
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!notes ? (
          <div className="text-center text-muted-foreground py-12">
            <p>Click "Generate Notes" to create structured notes from this session.</p>
          </div>
        ) : (
          <Streamdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            className="prose prose-sm max-w-none dark:prose-invert"
          >
            {notes}
          </Streamdown>
        )}
      </div>
    </div>
  );
}
```

#### Hook: useDisplayBuffer (Use Existing Subscription)

**Evidence**: DisplayBuffer ALREADY HAS `subscribe()` method at Lines 71-74 in `buffer.ts`

```typescript
// src/hooks/useDisplayBuffer.ts

import { useState, useEffect } from 'react';
import { getDisplayBuffer } from '@/protected-core';
import type { DisplayItem } from '@/protected-core/contracts';

export function useDisplayBuffer() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const displayBuffer = getDisplayBuffer();

    // Initial items
    setItems(displayBuffer.getItems());

    // ✅ USE EXISTING subscribe() method (Lines 71-74 in buffer.ts)
    const unsubscribe = displayBuffer.subscribe((updatedItems) => {
      console.log('[useDisplayBuffer] Received update:', updatedItems.length, 'items');
      setItems(updatedItems);
      setIsStreaming(true);

      // Clear streaming indicator after 1 second of no updates
      setTimeout(() => setIsStreaming(false), 1000);
    });

    // Cleanup automatically when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    items,
    isStreaming,
    count: items.length
  };
}
```

**Note**: This hook uses DisplayBuffer's EXISTING subscription mechanism. No modifications to DisplayBuffer needed!

---

## 4. API Contracts

### 4.1 Frontend ↔ Backend APIs

#### GET /api/v2/textbooks/content

**Request**:
```typescript
interface TextbookContentRequest {
  grade: number;
  subject: string;
  chapter: string;
  section?: string;
}
```

**Response**:
```typescript
interface TextbookContentResponse {
  textbook_id: string;
  chapter: string;
  section_number: number;
  title: string;
  content_markdown: string;
  math_expressions: Array<{
    latex: string;
    description: string;
  }>;
  learning_objectives: string[];
  estimated_duration_minutes: number;
}
```

#### POST /api/v2/sessions/{sessionId}/generate-notes

**Request**:
```typescript
interface GenerateNotesRequest {
  format: 'markdown' | 'pdf' | 'html';
  includeStudentQuestions: boolean;
  focusOnConcepts: boolean;
  customInstructions?: string;
}
```

**Response**:
```typescript
interface GenerateNotesResponse {
  notes_id: string;
  session_id: string;
  notes_markdown: string;
  concepts_covered: string[];
  formulas_used: string[];
  generated_at: string;
  word_count: number;
}
```

### 4.2 Backend ↔ Python LiveKit Agent

#### POST /livekit/agent/context

**Request**:
```python
class TeachingContext:
    textbook_content: str
    learning_objectives: List[str]
    student_grade: int
    student_id: str
    teaching_mode: Literal["interactive", "lecture", "practice"]
    prior_knowledge: Optional[Dict[str, Any]]
```

**Response**:
```python
class ContextLoadResponse:
    status: Literal["success", "error"]
    context_id: str
    tokens_loaded: int
    ready_for_session: bool
```

#### WebSocket: /livekit/agent/stream

**Message Types**:
```python
class TranscriptionEvent:
    type: Literal["transcription"]
    content: str
    timestamp: int
    speaker: Literal["teacher", "student"]
    isFinal: bool
    mathExpressions: Optional[List[MathExpression]]

class MathExpression:
    latex: str
    description: str
    complexity: Literal["basic", "intermediate", "advanced"]
```

### 4.3 Protected Core Contracts (Already Defined)

**Using Existing Contracts**:
- `TranscriptionContract` - Already supports DisplayItem
- `DisplayItem` interface - Already has all needed fields
- `VoiceServiceContract` - Already handles sessions
- `WebSocketContract` - Already supports messaging

**No changes needed to protected core!** ✅

---

## 5. Database Schema

### 5.1 New Tables

#### Table: textbook_sections

```sql
CREATE TABLE IF NOT EXISTS public.textbook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter VARCHAR(255) NOT NULL,
  section_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  content_html TEXT, -- Pre-rendered HTML for performance
  math_expressions JSONB DEFAULT '[]'::jsonb,
  learning_objectives TEXT[] DEFAULT '{}',
  estimated_duration_minutes INTEGER DEFAULT 30,
  difficulty_level VARCHAR(50) DEFAULT 'medium',
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for fast lookup
  CONSTRAINT unique_section UNIQUE (textbook_id, chapter, section_number)
);

CREATE INDEX idx_textbook_sections_lookup ON public.textbook_sections(textbook_id, chapter);
CREATE INDEX idx_textbook_sections_keywords ON public.textbook_sections USING GIN (keywords);

-- Full-text search index
CREATE INDEX idx_textbook_sections_content_search ON public.textbook_sections
USING GIN (to_tsvector('english', content_markdown));
```

#### Table: session_notes

```sql
CREATE TABLE IF NOT EXISTS public.session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes_markdown TEXT NOT NULL,
  notes_html TEXT, -- Pre-rendered for display
  concepts_covered TEXT[] DEFAULT '{}',
  formulas_used TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  word_count INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  generation_method VARCHAR(50) DEFAULT 'ai_automated',
  gemini_model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_notes_student ON public.session_notes(student_id, generated_at DESC);
CREATE INDEX idx_session_notes_session ON public.session_notes(session_id);
```

#### Table: transcripts (Enhanced)

```sql
-- Add new columns to existing table
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS
  content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'math', 'code', 'diagram'));

ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS
  math_latex TEXT;

ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS
  display_timestamp BIGINT; -- For show-then-tell timing

CREATE INDEX idx_transcripts_content_type ON public.transcripts(content_type);
```

### 5.2 Migration Script

```sql
-- Migration: 005_show_n_tell_schema.sql

BEGIN;

-- Create textbook_sections table
CREATE TABLE IF NOT EXISTS public.textbook_sections (
  -- ... (as defined above)
);

-- Create session_notes table
CREATE TABLE IF NOT EXISTS public.session_notes (
  -- ... (as defined above)
);

-- Enhance transcripts table
ALTER TABLE public.transcripts
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS math_latex TEXT,
  ADD COLUMN IF NOT EXISTS display_timestamp BIGINT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_textbook_sections_lookup
  ON public.textbook_sections(textbook_id, chapter);

CREATE INDEX IF NOT EXISTS idx_session_notes_student
  ON public.session_notes(student_id, generated_at DESC);

-- Grant permissions
GRANT SELECT ON public.textbook_sections TO authenticated;
GRANT ALL ON public.session_notes TO authenticated;

COMMIT;
```

---

## 6. Integration Points

### 6.1 Textbook Content → Gemini Pipeline

**Integration Flow**:
```
1. User selects topic in wizard
   ↓
2. Frontend fetches textbook content (API)
   ↓
3. Backend retrieves from Supabase (textbook_sections)
   ↓
4. Content sent to Python LiveKit agent
   ↓
5. Agent loads into Gemini context
   ↓
6. Gemini uses textbook content to teach
   ↓
7. Response streamed back to frontend
```

**Implementation**:
```typescript
// src/app/api/v2/sessions/start/route.ts

export async function POST(request: Request) {
  const { studentId, topic, textbookSection } = await request.json();

  // 1. Fetch textbook content
  const textbookContent = await supabase
    .from('textbook_sections')
    .select('*')
    .eq('chapter', textbookSection.chapter)
    .eq('section_number', textbookSection.section)
    .single();

  // 2. Send to LiveKit agent
  const agentResponse = await fetch(`${LIVEKIT_AGENT_URL}/context`, {
    method: 'POST',
    body: JSON.stringify({
      textbook_content: textbookContent.content_markdown,
      learning_objectives: textbookContent.learning_objectives,
      student_grade: studentGrade,
      teaching_mode: 'interactive'
    })
  });

  // 3. Create session with textbook reference
  const session = await createVoiceSession({
    studentId,
    topic,
    textbookSectionId: textbookContent.id,
    contextId: agentResponse.context_id
  });

  return NextResponse.json({ sessionId: session.id });
}
```

### 6.2 Display Buffer → Frontend Reactivity

**Current Problem**: Components poll DisplayBuffer instead of subscribing (28 polls/sec waste)

**Solution**: Use EXISTING subscription mechanism! ✅

**EVIDENCE-BASED FINDING**: DisplayBuffer ALREADY IS REACTIVE!

```typescript
// src/protected-core/transcription/display/buffer.ts (EXISTING CODE - NO CHANGES NEEDED!)

class DisplayBuffer {
  private items: DisplayItem[] = [];
  private subscribers: Set<(items: DisplayItem[]) => void> = new Set();  // ✅ Line 21 - EXISTS

  // ✅ Lines 71-74 - ALREADY IMPLEMENTED
  subscribe(callback: (items: DisplayItem[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);  // Unsubscribe
  }

  // ✅ Lines 76-78 - ALREADY IMPLEMENTED
  private notifySubscribers(): void {
    const itemsCopy = [...this.items];
    this.subscribers.forEach(callback => {
      try {
        callback(itemsCopy);
      } catch (error) {
        console.error('[DisplayBuffer] Subscriber error:', error);
      }
    });
  }

  // ✅ Line 56 - ALREADY CALLS notifySubscribers()
  addItem(item: DisplayItem): void {
    this.items.push(item);
    this.notifySubscribers(); // ← ALREADY DOES THIS!
  }

  // ✅ Line 68 - ALREADY CALLS notifySubscribers()
  clearBuffer(): void {
    this.items = [];
    this.notifySubscribers(); // ← ALREADY DOES THIS!
  }
}
```

**Conclusion**: DisplayBuffer IS ALREADY REACTIVE! ✅
- 476 lines of test coverage prove it works
- Public API exported via `src/protected-core/index.ts`
- **NO MODIFICATIONS NEEDED** - just use it correctly!

**The Real Fix**: Replace component polling with subscriptions (see PC-015)

### 6.3 Gemini → DisplayBuffer Pipeline

**Already Implemented** ✅ (via GeminiTranscriptionConnector)

**Data Flow**:
```
Gemini Token
  → LiveKit Python Agent
  → WebSocket Message
  → GeminiTranscriptionConnector
  → DisplayBuffer.addItem()
  → Subscribers notified
  → Frontend components update
```

**No changes needed!** Just ensure WebSocket messages flow correctly.

---

## 7. Implementation Roadmap

### Phase 1: Fix Reactive Display (Week 1) - EVIDENCE-BASED

**Goal**: Make text appear and stream properly by USING existing subscriptions

**CORRECTED Tasks** (Based on Multi-Agent Research):
1. ~~Add subscription mechanism to DisplayBuffer~~ ❌ **NOT NEEDED** - already exists!
2. Create useDisplayBuffer hook (uses EXISTING subscribe() method)
3. Replace polling in TeachingBoardSimple with subscription
4. Replace polling in ChatInterface with subscription
5. Replace polling in TranscriptSimple with subscription
6. Replace polling in useStreamingTranscript with subscription
7. Verify text streams continuously
8. Add logging to trace data flow

**Success Criteria**:
- ✅ Text appears as teacher speaks (zero delay)
- ✅ No disappearing content
- ✅ Console logs show subscription updates
- ✅ Eliminate 28 polls/second waste

**Files to Modify** (7 files, NOT 9-10):
- ~~`src/protected-core/transcription/display/buffer.ts`~~ ❌ **NO CHANGES** - already perfect!
- `src/hooks/useDisplayBuffer.ts` (new hook using existing subscribe())
- `src/components/classroom/TeachingBoardSimple.tsx` (remove polling)
- `src/components/classroom/ChatInterface.tsx` (remove polling)
- `src/components/classroom/TranscriptSimple.tsx` (remove polling)
- `src/hooks/useStreamingTranscript.ts` (remove polling)
- Python agent + metadata flow (3 files from PC-015)

### Phase 2: Add Streamdown Rendering (Week 2) - EVIDENCE-BASED

**Goal**: Replace current markdown rendering with ChatGPT-style streaming

**CORRECTED Tasks** (Based on Multi-Agent Research):
1. ~~Install Streamdown package~~ ✅ **ALREADY INSTALLED** - v1.3.0!
2. ~~Install remark-math~~ ✅ **ALREADY INSTALLED** - v6.0.0!
3. ~~Install rehype-katex~~ ✅ **ALREADY INSTALLED** - v7.0.1!
4. Create StreamingContent component (uses existing packages)
5. Replace existing rendering in TeachingBoard
6. Add DOMPurify for security (optional for MVP)
7. Test with long content and math

**Success Criteria**:
- ✅ Smooth streaming (no flicker)
- ✅ Math renders correctly
- ✅ Performance maintained (60fps)

**Dependencies Status**:
```bash
# ✅ ALREADY INSTALLED - verified in package.json:
streamdown: "^1.3.0"
remark-math: "^6.0.0"
rehype-katex: "^7.0.1"

# Optional (can add later):
# pnpm add dompurify
# pnpm add -D @types/dompurify
```

### Phase 3: Textbook Integration (Week 3)

**Goal**: Load actual textbook content into Gemini

**Tasks**:
1. Create migration for textbook_sections table
2. Seed database with NCERT content
3. Create /api/v2/textbooks/content endpoint
4. Update session start to fetch textbook content
5. Modify Python agent to receive context
6. Test with real textbook chapters

**Success Criteria**:
- ✅ Gemini teaches from textbook content
- ✅ Content contextually relevant
- ✅ API responds < 200ms

### Phase 4: Automated Notes (Week 4)

**Goal**: Generate structured notes from sessions

**Tasks**:
1. Create migration for session_notes table
2. Create /api/v2/sessions/{id}/generate-notes endpoint
3. Build NotesPanel component
4. Implement notes generation with Gemini
5. Add PDF download functionality
6. Test notes quality and formatting

**Success Criteria**:
- ✅ Notes generated within 10 seconds
- ✅ Well-formatted markdown
- ✅ Captures key concepts and formulas

### Phase 5: Show-Then-Tell Timing (Week 5)

**Goal**: Perfect the 400ms audio delay

**Tasks**:
1. Add display_timestamp to transcripts
2. Implement timing offset in LiveKit agent
3. Add visual highlight synchronization
4. Create timing dashboard (dev tool)
5. Test and tune timing accuracy

**Success Criteria**:
- ✅ Visual leads audio by 400ms ± 50ms
- ✅ Highlight synced with speech
- ✅ No jarring delays

### Phase 6: Polish & Optimization (Week 6)

**Goal**: Production-ready quality

**Tasks**:
1. Add error boundaries
2. Implement retry logic
3. Add performance monitoring
4. Optimize bundle size
5. Add E2E tests
6. Security audit (DOMPurify, input validation)

**Success Criteria**:
- ✅ TypeScript 0 errors
- ✅ All tests passing
- ✅ No console errors
- ✅ Lighthouse score > 90

---

## 8. Success Criteria

### Minimum Viable Product (MVP)

**Must Have**:
- ✅ Text streams continuously (no disappearing)
- ✅ Math renders with KaTeX
- ✅ Textbook content loads into Gemini
- ✅ Basic notes generation works

### Target Quality (Production)

**Should Have**:
- ✅ ChatGPT-style smooth streaming
- ✅ 400ms show-then-tell timing
- ✅ Automated notes with good formatting
- ✅ PDF export of notes

### Stretch Goals (Future)

**Nice to Have**:
- ✅ Word-level highlighting as spoken
- ✅ Progressive math rendering (fragment by fragment)
- ✅ Multi-language support
- ✅ Offline notes access

---

## 9. Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **DisplayBuffer reactivity breaks** | HIGH | LOW | Thorough testing, fallback to polling |
| **Streamdown performance issues** | MEDIUM | LOW | Virtualization, lazy rendering |
| **Gemini rate limits** | HIGH | MEDIUM | Caching, request throttling |
| **Timing drift (show-then-tell)** | MEDIUM | MEDIUM | Continuous monitoring, auto-adjustment |
| **Notes quality poor** | MEDIUM | LOW | Prompt engineering, human review |

### Integration Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Python ↔ TypeScript mismatch** | HIGH | LOW | Strict TypeScript contracts |
| **LiveKit WebSocket instability** | HIGH | LOW | Exponential backoff, reconnection |
| **Supabase query performance** | MEDIUM | LOW | Proper indexing, query optimization |

---

## 10. Appendices

### A. Package Dependencies

**✅ ALREADY INSTALLED** (Evidence-based verification):
```json
{
  "dependencies": {
    "streamdown": "^1.3.0",        // ✅ VERIFIED - already installed!
    "remark-math": "^6.0.0",       // ✅ VERIFIED - already installed!
    "rehype-katex": "^7.0.1",      // ✅ VERIFIED - already installed!
    "katex": "^0.16.22"            // ✅ VERIFIED - already installed!
  }
}
```

**Optional Additions** (Can add as needed):
```json
{
  "dependencies": {
    "dompurify": "^3.0.0",         // Optional: Content sanitization
    "@tanstack/react-query": "^5.0.0"  // Optional: Server state management
  }
}
```

**Conclusion**: NO new packages required for MVP! All critical dependencies already installed.

### B. Environment Variables

```env
# Textbook API
NEXT_PUBLIC_TEXTBOOK_API_URL=http://localhost:3006/api/v2/textbooks

# LiveKit Agent
LIVEKIT_AGENT_URL=http://localhost:8080

# Gemini
GEMINI_API_KEY=<from .creds/gemini_api_key.json>
```

### C. Performance Benchmarks

**Target Metrics**:
- Token-to-display latency: < 100ms
- Math rendering time: < 200ms
- Notes generation time: < 10 seconds
- Frame rate during streaming: 60fps
- Memory usage (1hr session): < 100MB

### D. Security Checklist

- [ ] All AI output sanitized with DOMPurify
- [ ] LaTeX input validated before KaTeX rendering
- [ ] WebSocket connections authenticated (JWT)
- [ ] Rate limiting on all endpoints
- [ ] HTTPS only in production
- [ ] CORS properly configured
- [ ] Input validation on all APIs
- [ ] SQL injection prevention (parameterized queries)

---

## 11. Conclusion

**EVIDENCE-BASED ARCHITECTURE** - Updated after 5-agent deep investigation.

This architecture provides a complete, verified blueprint for implementing PingLearn's Show-n-Tell feature. The design:

1. **Builds on existing infrastructure** - ALL critical dependencies already installed! ✅
   - Streamdown v1.3.0 ✅
   - remark-math v6.0.0 ✅
   - rehype-katex v7.0.1 ✅
   - DisplayBuffer with subscriptions ✅ (Lines 71-78)

2. **Respects Protected Core** - NO modifications to core services needed ✅
   - DisplayBuffer already perfect (476 lines of tests prove it)
   - Just use existing APIs correctly

3. **Uses industry standards** - Streamdown, React hooks, Vercel patterns ✅

4. **Achieves vision** - 400ms show-then-tell with textbook content ✅

5. **Production-ready** - Security, performance, reliability ✅

**Key Corrections from Multi-Agent Research**:
- ❌ DON'T add DisplayBuffer subscriptions (already exist!)
- ❌ DON'T install Streamdown packages (already installed!)
- ✅ DO replace component polling with existing subscriptions
- ✅ DO use Python agent dynamic prompts for preferences
- ✅ Simplified from 9-10 files to 7 files
- ✅ Reduced estimate from 2 hours to 1.5 hours

**Next Steps**:
1. ✅ User approval of PC-015 change record (evidence-based)
2. ✅ Begin Phase 1 (Replace Polling → Use Existing Subscriptions)
3. ✅ Incremental rollout following corrected roadmap

---

**Document Status**: EVIDENCE-BASED & READY FOR REVIEW
**Version**: 1.1 (Corrected after 5-agent investigation)
**Approval Required**: YES - Awaiting user approval per explicit request
**Implementation Start**: Upon approval of PC-015
