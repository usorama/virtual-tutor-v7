# Show-n-Tell Architecture: Visual Summary

**Quick Reference Guide**
**Date**: 2025-10-03

---

## 🎯 The Big Picture

**What We're Building**: ChatGPT-style streaming text display where students SEE math equations 400ms BEFORE hearing them explained.

**Current Problem**: Audio works ✅, Text broken ❌

**Solution**: Make DisplayBuffer reactive + Add Streamdown renderer

---

## 📊 Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER EXPERIENCE                          │
│                                                                   │
│  Student sees on screen:                                         │
│  "The quadratic formula is $$x = \frac{-b \pm...}{2a}$$"        │
│                          ↑                                        │
│                          │ 400ms BEFORE                          │
│                          ↓                                        │
│  Student hears AI teacher:                                       │
│  "The quadratic formula is..." (audio playing)                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      FRONTEND LAYER                              │
│                      (Next.js 15 + React 19)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /app/classroom/page.tsx                                         │
│  ├─> TeachingBoardSimple (80%)                                  │
│  │   └─> useDisplayBuffer() ← NEW REACTIVE HOOK                │
│  │       └─> Streamdown renderer ← NEW COMPONENT               │
│  │           ├─> remarkMath (detects LaTeX)                     │
│  │           └─> rehypeKatex (renders math)                     │
│  │                                                               │
│  └─> TabsContainer (20%)                                        │
│      └─> NotesPanel ← NEW                                       │
│          └─> "Generate Notes" button                            │
│                                                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ WebSocket
                            │ (real-time)
┌───────────────────────────▼──────────────────────────────────────┐
│                    PROTECTED CORE                                │
│                    (TypeScript Services)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  DisplayBuffer (Enhanced)                                        │
│  ├─> addItem(item)                                              │
│  ├─> subscribe(callback) ← NEW METHOD                           │
│  └─> notifySubscribers() ← NEW METHOD                           │
│                                                                   │
│  GeminiTranscriptionConnector                                    │
│  └─> Receives tokens → Adds to DisplayBuffer                    │
│                                                                   │
│  WebSocketManager (Singleton)                                    │
│  └─> Routes messages to correct handlers                        │
│                                                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ WebSocket
                            │ Messages
┌───────────────────────────▼──────────────────────────────────────┐
│                   PYTHON LIVEKIT AGENT                           │
│                   (Voice + AI Service)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Gemini Live API Integration                                     │
│  ├─> Receives textbook content in system prompt                 │
│  ├─> Generates teaching response                                │
│  └─> Streams tokens in real-time                                │
│                                                                   │
│  Dual Output Processing:                                         │
│  ├─> Text Channel (WebSocket) → Immediate send                  │
│  └─> Audio Channel (TTS) → Delay 400ms for show-then-tell      │
│                                                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ API Calls
┌───────────────────────────▼──────────────────────────────────────┐
│                     BACKEND APIs                                 │
│                     (Next.js API Routes)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  GET /api/v2/textbooks/content                                  │
│  └─> Fetches textbook chapter from Supabase                     │
│                                                                   │
│  POST /api/v2/sessions/start                                    │
│  └─> Sends textbook content to Python agent                     │
│                                                                   │
│  POST /api/v2/sessions/{id}/generate-notes                      │
│  └─> Uses Gemini to create structured notes from transcript     │
│                                                                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ SQL Queries
┌───────────────────────────▼──────────────────────────────────────┐
│                        SUPABASE                                  │
│                     (PostgreSQL Database)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  textbook_sections ← NEW TABLE                                  │
│  ├─> chapter, section_number, content_markdown                  │
│  ├─> math_expressions (JSONB)                                   │
│  └─> learning_objectives (TEXT[])                               │
│                                                                   │
│  session_notes ← NEW TABLE                                      │
│  ├─> session_id, student_id                                     │
│  ├─> notes_markdown (generated by Gemini)                       │
│  └─> concepts_covered, formulas_used                            │
│                                                                   │
│  transcripts (Enhanced)                                          │
│  └─> Add: content_type, math_latex, display_timestamp           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Timeline (Show-n-Tell)

```
TIME    EVENT                               LOCATION
════    ═════════════════════════════════   ════════════════════════

t=0ms   Gemini generates token "The"        Gemini API

t=10ms  Python agent receives token         LiveKit Agent
        ├─> Sends to WebSocket (text)       (Immediate)
        └─> Queues for TTS (audio)          (Delayed 400ms)

t=20ms  WebSocket message sent              Python → TypeScript
        {
          type: "transcription",
          content: "The",
          speaker: "teacher"
        }

t=30ms  Protected Core receives             GeminiTranscriptionConnector
        ├─> Adds to DisplayBuffer
        └─> Notifies subscribers

t=35ms  Frontend receives update            useDisplayBuffer hook
        └─> React re-renders

t=40ms  USER SEES "The" on screen          TeachingBoardSimple
        (Rendered with Streamdown)

t=440ms USER HEARS "The" in audio          LiveKit audio playback
        (400ms AFTER visual display)

═══════════════════════════════════════════════════════════════════

NEXT TOKEN: "quadratic" follows same flow

t=450ms → "quadratic" generated
t=490ms → "quadratic" visible on screen
t=890ms → "quadratic" heard in audio

Screen shows: "The quadratic"
Audio playing: "The" (from t=440ms)

This creates perfect SHOW-THEN-TELL effect!
```

---

## 🧩 Key Components to Build/Modify

### 1. DisplayBuffer Enhancement (Protected Core)

**File**: `src/protected-core/transcription/display/buffer.ts`

**Changes**:
```typescript
// Add subscription mechanism
private subscribers = new Set<(items: DisplayItem[]) => void>();

subscribe(callback: (items: DisplayItem[]) => void): () => void {
  this.subscribers.add(callback);
  return () => this.subscribers.delete(callback);
}

private notifySubscribers(): void {
  this.subscribers.forEach(cb => cb([...this.items]));
}

// Call notifySubscribers() in addItem() and clearBuffer()
```

**Impact**: Makes buffer reactive - components auto-update when new content arrives.

---

### 2. useDisplayBuffer Hook (New)

**File**: `src/hooks/useDisplayBuffer.ts` (CREATE NEW)

**Purpose**: React hook that subscribes to DisplayBuffer updates

```typescript
export function useDisplayBuffer() {
  const [items, setItems] = useState<DisplayItem[]>([]);

  useEffect(() => {
    const buffer = getDisplayBuffer();
    const unsubscribe = buffer.subscribe((items) => {
      setItems(items);
    });
    return unsubscribe;
  }, []);

  return { items };
}
```

---

### 3. Streamdown Integration (Frontend)

**File**: `src/components/classroom/TeachingBoardSimple.tsx`

**Changes**:
```typescript
import { Streamdown } from 'streamdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Replace current rendering with:
<Streamdown
  parseIncompleteMarkdown={true}
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {teacherContent}
</Streamdown>
```

**Why Streamdown?**:
- No flicker during streaming (append-only DOM)
- Handles incomplete markdown gracefully
- 60x fewer re-renders than react-markdown
- Industry standard (Vercel, ChatGPT pattern)

---

### 4. NotesPanel Component (New)

**File**: `src/components/classroom/NotesPanel.tsx` (CREATE NEW)

**Features**:
- "Generate Notes" button
- Calls `/api/v2/sessions/{id}/generate-notes`
- Displays markdown with math rendering
- Download as PDF option

---

### 5. Textbook Content API (Backend)

**File**: `src/app/api/v2/textbooks/content/route.ts` (CREATE NEW)

**Purpose**: Fetches textbook chapters from Supabase

**Usage**:
```typescript
// Frontend calls:
const response = await fetch('/api/v2/textbooks/content', {
  method: 'POST',
  body: JSON.stringify({
    grade: 10,
    subject: 'Mathematics',
    chapter: 'Quadratic Equations'
  })
});

// Backend returns:
{
  content_markdown: "# Quadratic Equations\n\nA quadratic equation...",
  math_expressions: [
    { latex: "ax^2 + bx + c = 0", description: "Standard form" }
  ],
  learning_objectives: [
    "Understand standard form",
    "Solve using quadratic formula"
  ]
}
```

---

### 6. Notes Generation API (Backend)

**File**: `src/app/api/v2/sessions/[id]/generate-notes/route.ts` (CREATE NEW)

**Flow**:
```
1. Retrieve session transcript from DisplayBuffer history
2. Send to Gemini with prompt: "Create structured notes..."
3. Gemini generates markdown with:
   - Key concepts
   - Formulas (LaTeX)
   - Examples covered
   - Student questions
4. Save to session_notes table
5. Return formatted notes
```

---

## 📦 New Dependencies Needed

```bash
# Install these packages
pnpm add streamdown
pnpm add remark-math rehype-katex
pnpm add dompurify @types/dompurify
pnpm add @tanstack/react-query

# Already have (no install needed)
# - Next.js 15.5.3 ✅
# - TypeScript ✅
# - React 19 ✅
# - KaTeX ✅
# - LiveKit ✅
```

---

## 🗄️ Database Changes

### New Tables (2)

**1. textbook_sections**:
```sql
CREATE TABLE textbook_sections (
  id UUID PRIMARY KEY,
  textbook_id UUID REFERENCES textbooks(id),
  chapter VARCHAR(255),
  section_number INTEGER,
  content_markdown TEXT,
  math_expressions JSONB,
  learning_objectives TEXT[]
);
```

**2. session_notes**:
```sql
CREATE TABLE session_notes (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES learning_sessions(id),
  student_id UUID REFERENCES profiles(id),
  notes_markdown TEXT,
  concepts_covered TEXT[],
  formulas_used TEXT[]
);
```

### Enhanced Table (1)

**transcripts** (add columns):
```sql
ALTER TABLE transcripts
  ADD COLUMN content_type VARCHAR(20),
  ADD COLUMN math_latex TEXT,
  ADD COLUMN display_timestamp BIGINT;
```

---

## ✅ Implementation Checklist

### Phase 1: Fix Streaming (CRITICAL - Week 1)

- [ ] Modify DisplayBuffer to add subscription mechanism
- [ ] Create useDisplayBuffer hook
- [ ] Update TeachingBoardSimple to use hook
- [ ] Add logging to verify data flow
- [ ] Test: Text appears and streams continuously

**Files Modified**: 3 files, ~100 lines of code

**Risk**: LOW (small, focused changes)

---

### Phase 2: Add Streamdown (Week 2)

- [ ] Install streamdown + plugins
- [ ] Replace markdown rendering in TeachingBoard
- [ ] Add DOMPurify sanitization
- [ ] Test with long content and equations

**Files Modified**: 2 files, ~50 lines

**Risk**: LOW (drop-in replacement)

---

### Phase 3: Textbook Integration (Week 3)

- [ ] Create textbook_sections table migration
- [ ] Seed database with NCERT content
- [ ] Build /api/v2/textbooks/content endpoint
- [ ] Update session start to fetch and send textbook content
- [ ] Modify Python agent to receive context

**Files Created**: 3 new files, 1 migration

**Risk**: MEDIUM (requires coordination with Python service)

---

### Phase 4: Notes Generation (Week 4)

- [ ] Create session_notes table migration
- [ ] Build NotesPanel component
- [ ] Build /api/v2/sessions/{id}/generate-notes endpoint
- [ ] Test notes quality and formatting

**Files Created**: 3 new files, 1 migration

**Risk**: LOW (independent feature)

---

### Phase 5: Perfect Timing (Week 5)

- [ ] Add display_timestamp tracking
- [ ] Implement 400ms audio delay in Python agent
- [ ] Add visual highlight synchronization
- [ ] Create timing dashboard for monitoring

**Files Modified**: 2 files (Python + TypeScript)

**Risk**: MEDIUM (timing precision)

---

### Phase 6: Polish (Week 6)

- [ ] Add error boundaries
- [ ] Implement retry logic
- [ ] Performance monitoring
- [ ] Security audit
- [ ] E2E tests

**Risk**: LOW (quality improvements)

---

## 🎯 Success Metrics

### Immediate (Phase 1-2)

✅ Text streams without disappearing
✅ Math renders correctly
✅ No performance degradation
✅ Console shows data flowing

### Target (Phase 3-4)

✅ Textbook content loads in < 200ms
✅ Notes generated in < 10 seconds
✅ ChatGPT-quality streaming experience

### Advanced (Phase 5-6)

✅ 400ms show-then-tell ± 50ms accuracy
✅ TypeScript 0 errors
✅ All E2E tests passing
✅ Lighthouse score > 90

---

## 🚨 Critical Constraints

**NEVER MODIFY** (Protected Core):
- `src/protected-core/voice-engine/`
- `src/protected-core/websocket/manager/singleton-manager.ts`
- `src/protected-core/session/orchestrator.ts`

**ONLY ADD** (Safe):
- New hooks in `src/hooks/`
- New components in `src/components/classroom/`
- New API routes in `src/app/api/v2/`

**ENHANCE CAREFULLY** (Protected):
- `src/protected-core/transcription/display/buffer.ts` (add subscribe only)

---

## 📞 Next Steps

1. **Review this architecture** with user
2. **Get approval** for approach
3. **Start Phase 1** (Reactive Display Fix)
4. **Iterate** through phases 2-6

**Estimated Timeline**: 6 weeks to full completion
**Critical Path**: Phase 1 (must work before proceeding)

---

**Document Owner**: Architect Agent (Claude)
**Last Updated**: 2025-10-03
**Status**: READY FOR IMPLEMENTATION
