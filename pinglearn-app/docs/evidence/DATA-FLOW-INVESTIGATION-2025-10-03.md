# Data Flow Investigation - deethya@gmail.com
**Date**: 2025-10-03
**Issue**: Grade 12 English user seeing Grade 10 Math data; Agent receiving wrong metadata

## 🔍 INVESTIGATION SUMMARY

### User Report
- User: deethya@gmail.com (UUID: 533d886a-e533-45ed-aaca-4d8087e9b0d7)
- Selected: Grade 12, English Language textbook
- **Problem 1**: Curriculum panel shows "Grade 10 Mathematics > Algebra" ❌
- **Problem 2**: AI agent introduces as "Grade 10 General Studies" ❌
- **Problem 3**: No transcripts appearing in UI ❌

---

## 📊 DATABASE VERIFICATION

### ✅ Profile Data (CORRECT)
```json
{
  "id": "533d886a-e533-45ed-aaca-4d8087e9b0d7",
  "email": "deethya@gmail.com",
  "grade": 12,
  "preferred_subjects": ["English Language"],
  "selected_topics": {
    "English Language": ["Comprehension", "Writing Skills"]
  }
}
```

### ✅ Learning Sessions (CORRECT)
```
Session ID: 3767a8a6-8884-44b5-83ea-d46e212612ab
Room: session_voice_temp_1759488871619_533d886a-e533-45ed-aaca-4d8087e9b0d7
Chapter Focus: "Grade 12 English Language" ← CORRECT!
Created: 2025-10-03T10:54:31
```

### ✅ Voice Sessions (CORRECT)
```
Voice Session ID: ccdf9207-e864-447d-8762-8716e070b961
LiveKit Room: session_voice_temp_1759488871619_533d886a-e533-45ed-aaca-4d8087e9b0d7
Status: ended
```

### ✅ Textbooks (CORRECT)
```
Textbook ID: 8ce1a516-bfc4-4e04-9725-9dd78c1540f7
Title: "Objective General English"
Grade: 12
Subject: "English Language"
Status: ready
```

**CONCLUSION**: Database has 100% CORRECT data! ✅

---

## 🐛 ROOT CAUSE IDENTIFIED

### Critical Bug in `classroom/page.tsx`

**Line 75**:
```typescript
const [currentTopic, setCurrentTopic] = useState<string>('General Mathematics');
```

**Problem**:
1. `currentTopic` is **HARDCODED** to "General Mathematics"
2. `setCurrentTopic` is **NEVER CALLED** - the state is never updated
3. This hardcoded value flows to metadata extraction (lines 538-554)

**Metadata Extraction Logic** (lines 540-554):
```typescript
const extractGrade = (topic: string): string => {
  const match = topic.match(/Grade\s+(\d+)/i);
  return match ? `Grade ${match[1]}` : 'Grade 10';  // ← FALLBACK
};

const extractSubject = (topic: string): string => {
  const match = topic.match(/Grade\s+\d+\s+(.+)/i);
  return match ? match[1].trim() : 'General Studies';  // ← FALLBACK
};

const metadata = {
  topic: currentTopic,  // ← "General Mathematics"
  grade: extractGrade(currentTopic),  // ← Falls back to "Grade 10"
  subject: extractSubject(currentTopic)  // ← Falls back to "General Studies"
};
```

**Result**: Agent receives metadata: `{topic: "General Mathematics", grade: "Grade 10", subject: "General Studies"}`

This is why Python agent logs show:
```
WARNING: [PC-015] No participant metadata found, using fallback values
INFO: [PC-015] Using dynamic prompt: Grade 10 General Studies - General Learning
```

---

## 🔄 COMPLETE DATA FLOW ANALYSIS

### What SHOULD Happen:
1. ✅ User selects Grade 12, English Language → Stored in profile
2. ✅ Session created with chapter_focus: "Grade 12 English Language"
3. ❌ **BROKEN**: Classroom page loads session but doesn't update `currentTopic`
4. ❌ **BROKEN**: Hardcoded "General Mathematics" sent as metadata
5. ❌ **BROKEN**: Regex fails to match, uses fallback "Grade 10 General Studies"
6. ❌ **BROKEN**: Agent receives wrong metadata

### What ACTUALLY Happens:
```
Database ✅
  ↓
  [Grade 12 English Language stored correctly]
  ↓
Frontend Classroom Page ❌
  ↓
  [currentTopic hardcoded to "General Mathematics"]
  ↓
Metadata Extraction ❌
  ↓
  [Regex fails → Falls back to "Grade 10 General Studies"]
  ↓
LiveKit Token API ❌
  ↓
  [Sends wrong metadata to agent]
  ↓
Python Agent ❌
  ↓
  [Receives fallback values]
```

---

## 💡 THE FIX

### Required Changes:

1. **Load actual session data in classroom/page.tsx**:
   ```typescript
   // Replace hardcoded value with actual session data
   useEffect(() => {
     if (session?.id) {
       loadSessionTopic(session.id);
     }
   }, [session]);

   async function loadSessionTopic(sessionId: string) {
     const { data } = await supabase
       .from('learning_sessions')
       .select('chapter_focus')
       .eq('id', sessionId)
       .single();

     if (data?.chapter_focus) {
       setCurrentTopic(data.chapter_focus);  // "Grade 12 English Language"
     }
   }
   ```

2. **Alternative: Better approach - use profile data directly**:
   ```typescript
   useEffect(() => {
     if (userId) {
       loadUserPreferences(userId);
     }
   }, [userId]);

   async function loadUserPreferences(userId: string) {
     const { data } = await supabase
       .from('profiles')
       .select('grade, preferred_subjects')
       .eq('id', userId)
       .single();

     if (data) {
       const topic = `Grade ${data.grade} ${data.preferred_subjects[0]}`;
       setCurrentTopic(topic);  // "Grade 12 English Language"
     }
   }
   ```

3. **Fix Curriculum panel** (separate issue):
   - Investigate where Curriculum gets "Grade 10 Mathematics > Algebra"
   - Likely another hardcoded value or using wrong data source

---

## 📋 VERIFICATION CHECKLIST

After implementing fix:
- [ ] currentTopic updates to "Grade 12 English Language"
- [ ] Console shows: `LiveKit voice connected with metadata: {topic: "Grade 12 English Language", grade: "Grade 12", subject: "English Language"}`
- [ ] Python agent logs show: `[PC-015] Using dynamic prompt: Grade 12 English Language`
- [ ] Curriculum panel shows correct Grade 12 English data
- [ ] Agent introduces as "Grade 12 English Language teacher"
- [ ] Transcripts appear in UI

---

## 🎯 IMPACT

**Severity**: P0 - Critical
- Every user affected (hardcoded value applies to all)
- Agent uses wrong prompts for ALL sessions
- Metadata never flows correctly to agent
- Transcripts may not appear (separate issue with data channel)

**Files Affected**:
1. `/src/app/classroom/page.tsx` - Line 75 (critical fix)
2. Curriculum panel component (needs investigation)
3. VoiceSessionManager (room naming fixed in commit eb7a2f3)
4. Python agent metadata reading (needs participant metadata fix)

---

## 📝 RELATED ISSUES

1. ✅ **Room Naming** (Fixed in eb7a2f3): Changed from `voice-*` to `session_voice_*` for agent dispatch
2. ❌ **currentTopic Hardcoded**: This investigation - critical bug found
3. ❌ **Participant Metadata Empty**: Agent can't read participant.metadata (to be investigated)
4. ❌ **No Transcripts in UI**: Agent sends chunks but UI doesn't display (separate issue)

---

## 🔗 NEXT STEPS

1. **IMMEDIATE**: Fix currentTopic loading in classroom/page.tsx
2. **URGENT**: Investigate participant metadata flow (/api/v2/livekit/token)
3. **URGENT**: Fix Curriculum panel data source
4. **HIGH**: Debug transcript display in UI (DisplayBuffer/event bus)
5. **MEDIUM**: Add validation to prevent hardcoded values in production

---

**Investigation Completed**: 2025-10-03 11:15 AM
**Status**: Root cause identified, fix design complete, awaiting implementation
