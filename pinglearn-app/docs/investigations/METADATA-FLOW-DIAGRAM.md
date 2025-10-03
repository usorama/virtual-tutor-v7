# Metadata Flow Visualization
**Investigation**: FRONTEND-UI-001
**Date**: 2025-10-03

## Current Metadata Flow (Working for Python Agent)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER PROFILE                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  profiles table (Supabase)                                   │  │
│  │  - grade: 12                                                 │  │
│  │  - preferred_subjects: ["English"]                           │  │
│  │  - selected_topics: ["Literature"]                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Load on page mount
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      classroom/page.tsx                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  const topic = `Grade ${profile.grade} ${profile.preferred  │  │
│  │                  _subjects[0]}`;                             │  │
│  │  setCurrentTopic("Grade 12 English");  ✅ CORRECT            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                      │                           │
                      │                           │
                      ▼                           ▼
        ┌─────────────────────────┐   ┌───────────────────────────┐
        │  Extract Metadata       │   │  Pass to UI Components    │
        │                         │   │                           │
        │  metadata = {           │   │  <TabsContainer           │
        │    topic: "Grade 12...", │   │    topic={currentTopic}  │
        │    grade: "Grade 12",   │   │  />                       │
        │    subject: "English"   │   │                           │
        │  }                      │   │  ✅ TOPIC PASSED          │
        └─────────────────────────┘   └───────────────────────────┘
                      │                           │
                      │                           │
                      ▼                           ▼
        ┌─────────────────────────┐   ┌───────────────────────────┐
        │  LiveKitRoom Component  │   │  SessionInfoPanel         │
        │                         │   │                           │
        │  metadata={metadata}    │   │  Receives:                │
        │  ✅ METADATA PASSED     │   │  topic="Grade 12 English" │
        │                         │   │                           │
        └─────────────────────────┘   │  Displays:                │
                      │                │  ❌ "Grade 10 > Math >    │
                      │                │     Algebra" (HARDCODED)  │
                      ▼                └───────────────────────────┘
        ┌─────────────────────────┐
        │  LiveKit Token API      │             ┌──────────────────┐
        │                         │             │   THE PROBLEM    │
        │  AccessToken({          │             │                  │
        │    metadata: JSON.      │             │  SessionInfoPanel│
        │      stringify(metadata)│             │  ignores the     │
        │  })                     │             │  'topic' prop and│
        │  ✅ SENT TO AGENT       │             │  shows hardcoded │
        └─────────────────────────┘             │  breadcrumb      │
                      │                          └──────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │   Python LiveKit Agent              │
        │                                     │
        │   participant.metadata = {          │
        │     "topic": "Grade 12 English",    │
        │     "grade": "Grade 12",            │
        │     "subject": "English"            │
        │   }                                 │
        │                                     │
        │   ✅ USES ENGLISH TEACHING STYLE    │
        │   ✅ GENERATES ENGLISH CONTENT      │
        └─────────────────────────────────────┘
```

## The Disconnect

### ✅ What Works:
1. Profile data loads correctly: `grade: 12, subjects: ["English"]`
2. currentTopic is set: `"Grade 12 English"`
3. Metadata extracted: `{ grade: "Grade 12", subject: "English" }`
4. LiveKit token includes metadata → **Python agent receives it correctly**
5. Python agent uses dynamic prompts based on metadata

### ❌ What's Broken:
1. SessionInfoPanel receives `topic="Grade 12 English"`
2. **BUT ignores it** and shows hardcoded breadcrumb
3. UI displays: "Grade 10 > Mathematics > Algebra" (wrong!)

## Visual Comparison

### Expected UI (Grade 12 English Session):
```
┌─────────────────────────────────────────────────────────┐
│  Curriculum                                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Grade 12 > English > Literature                  │ │
│  │  ← Previous    Next →                             │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Actual UI (Bug):
```
┌─────────────────────────────────────────────────────────┐
│  Curriculum                                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Grade 10 > Mathematics > Algebra  ❌              │ │
│  │  ← Previous    Next →                             │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Text Display Flow (Should Be Working)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Python LiveKit Agent                                │
│                                                                       │
│  1. Receives metadata: { grade: "Grade 12", subject: "English" }    │
│  2. Generates English teaching content                               │
│  3. Sends transcript via data channel:                               │
│     {                                                                │
│       type: "transcript",                                            │
│       segments: [{ content: "Let's explore Shakespeare..." }],       │
│       speaker: "teacher",                                            │
│       showThenTell: true                                             │
│     }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ WebRTC Data Channel
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LiveKitRoom.tsx                                 │
│                                                                       │
│  handleDataReceived(payload) {                                       │
│    const data = JSON.parse(decoder.decode(payload));                │
│    if (data.type === 'transcript') {                                │
│      liveKitEventBus.emit('livekit:transcript', data);  ✅          │
│    }                                                                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Event Bus
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  SessionOrchestrator.ts                              │
│                                                                       │
│  liveKitEventBus.on('livekit:transcript', (data) => {               │
│    this.addTranscriptionItem({                                       │
│      type: 'text',                                                   │
│      content: "Let's explore Shakespeare...",                        │
│      speaker: 'teacher'                                              │
│    });                                                               │
│  });                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Add to buffer
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DisplayBuffer.ts                                │
│                                                                       │
│  addItem(item) {                                                     │
│    this.items.push(item);                                            │
│    this.notifySubscribers();  // ✅ Reactive update                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Subscribe callback
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  TeachingBoardSimple.tsx                             │
│                                                                       │
│  displayBuffer.subscribe((items) => {                                │
│    processBufferItems(items);  // Aggregate text chunks             │
│    setContent(aggregatedContent);  // ✅ Render to screen           │
│  });                                                                 │
│                                                                       │
│  // Renders on screen:                                               │
│  <p>"Let's explore Shakespeare's use of iambic pentameter..."</p>    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Visual Display
                                   ▼
                          ┌─────────────────┐
                          │  STUDENT SEES:  │
                          │                 │
                          │  Text appears   │
                          │  400ms BEFORE   │
                          │  audio starts   │
                          │                 │
                          │  ✅ Show-Then-  │
                          │     Tell works  │
                          └─────────────────┘
```

## Notes Panel (Working Correctly)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TabsContainer.tsx                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Tabs:                                                        │  │
│  │  ┌────────────┐  ┌────────────┐                              │  │
│  │  │  Session   │  │   Notes    │  ← Click to view             │  │
│  │  └────────────┘  └────────────┘                              │  │
│  │                                                               │  │
│  │  useSmartNotes(sessionId, voiceSessionId)                    │  │
│  │    ↓                                                          │  │
│  │  - keyConcepts: [...]  ✅ Auto-generated                     │  │
│  │  - examples: [...]     ✅ From transcripts                   │  │
│  │  - summary: [...]      ✅ Live updates                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Pass to NotesPanel
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NotesPanel.tsx                                  │
│                                                                       │
│  📚 Smart Learning Notes                        • Live               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                                       │
│  📌 Key Concepts                                                     │
│  • Iambic Pentameter: A rhythmic pattern...                         │
│  • Sonnet Form: 14 lines with specific rhyme...                     │
│                                                                       │
│  🔢 Examples & Practice                                              │
│  Example 1: "Shall I compare thee to a summer's day?"               │
│  • Identify the meter and rhyme scheme                              │
│                                                                       │
│  💡 Quick Summary                                                    │
│  ✓ Understanding Shakespeare's poetic forms                          │
│  ✓ Analyzing meter and rhythm in poetry                             │
│                                                                       │
│  [Copy] [Print] [Export] [Share]  ← Action buttons                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Debug Verification Steps

### 1. Check Profile Loading
```javascript
// Browser Console
const supabase = createClient();
const { data: profile } = await supabase
  .from('profiles')
  .select('grade, preferred_subjects')
  .eq('id', 'user-id')
  .single();

console.log('Profile:', profile);
// Expected: { grade: 12, preferred_subjects: ["English"] }
```

### 2. Check Metadata in LiveKit Token
```javascript
// Browser Console during session
// Check Network tab → API call to /api/v2/livekit/token
// Request body should include:
{
  "participantId": "...",
  "roomName": "...",
  "metadata": {
    "topic": "Grade 12 English",
    "grade": "Grade 12",
    "subject": "English"
  }
}
```

### 3. Check DisplayBuffer
```javascript
// Browser Console during session
import('@/protected-core').then(({ getDisplayBuffer }) => {
  const buffer = getDisplayBuffer();
  console.log('Items:', buffer.getItems());
  console.log('Size:', buffer.getBufferSize());
  console.log('Last item:', buffer.getLastItem());
});
```

### 4. Check LiveKit Events
```javascript
// Browser Console during session
import('@/components/voice/LiveKitRoom').then(({ liveKitEventBus }) => {
  liveKitEventBus.on('livekit:transcript', (data) => {
    console.log('Transcript received:', data);
  });
});
```

## Summary

### Root Cause:
**SessionInfoPanel.tsx lines 250-257** have hardcoded breadcrumb values instead of parsing the `topic` prop that already contains the correct metadata.

### Impact:
- ❌ UI shows wrong curriculum (Grade 10 Math instead of Grade 12 English)
- ✅ Python agent receives correct metadata (works fine)
- ✅ Text display pipeline complete (should be working)
- ✅ Notes panel fully functional

### Fix:
Replace hardcoded breadcrumb with dynamic parsing of `topic` prop.
