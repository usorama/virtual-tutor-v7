# Feature Change Record FC-001

**Version**: 1.0
**Date**: 2025-09-22
**Time**: 15:30 PST
**Approval Status**: PRE-APPROVED (per user instruction)
**Severity**: CRITICAL
**Type**: Data Flow Fix - Transcription Pipeline & Math Rendering

---

## 🚨 Pre-Change Safety Protocol

**Git Checkpoint Required**: ✅ MANDATORY
```bash
git add .
git commit -am "checkpoint: Before FC-001 transcription data flow fix"
```

---

## Change Summary

### One-Line Summary
Fix complete transcription data flow by capturing Gemini Live API transcript events and implementing proper math rendering.

### Critical Issues Being Fixed
1. **Double greeting** - Hardcoded + actual speech both displayed
2. **Lost conversation** - Gemini transcripts not being captured
3. **TeachingBoard duplication** - Shows same content as transcript
4. **Session ending failure** - ID mismatch error
5. **No math rendering** - Math segments not processed despite infrastructure

---

## Root Cause Analysis

### DISCOVERY: Gemini Live API DOES Send Transcripts
After research of December 2024 Gemini 2.0 API:
- Gemini sends BOTH audio AND transcript segments
- Includes `type: "math"` segments with LaTeX
- We're NOT capturing these events in agent.py

### Evidence
```json
{
  "audio": { "streamUrl": "wss://...", "timing": [...] },
  "transcript": {
    "text": "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
    "segments": [
      { "type": "text", "content": "The quadratic formula is:" },
      { "type": "math", "content": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" }
    ]
  }
}
```

---

## Implementation Plan

### File 1: `/Users/umasankrudhya/Projects/pinglearn/livekit-agent/agent.py`

#### Change 1: Remove double greeting (line 209)
```python
# DELETE THIS LINE:
await publish_transcript(ctx.room, "teacher", greeting_text)
```

#### Change 2: Add transcript event handlers
```python
# After line 192 (await session.start(...))
# ADD event handlers for Gemini transcripts:

# Hook into session events
@session.on("agent_started_speaking")
async def on_agent_speaking(text: str):
    """Capture AI teacher's speech with math detection"""
    logger.info(f"Agent speaking: {text[:100]}...")

    # Process for math segments
    segments = process_mixed_content(text)

    # Publish all segments
    for segment in segments:
        await publish_segment(ctx.room, "teacher", segment)

@session.on("user_started_speaking")
async def on_user_speaking(text: str):
    """Capture student's speech"""
    logger.info(f"Student speaking: {text[:100]}...")
    await publish_transcript(ctx.room, "student", text)

def process_mixed_content(text: str):
    """Split text into segments with math detection"""
    segments = []

    # Regex to find LaTeX math ($ ... $ or $$ ... $$)
    import re
    pattern = r'\$\$?(.*?)\$\$?'
    last_end = 0

    for match in re.finditer(pattern, text):
        # Add text before math
        if match.start() > last_end:
            segments.append({
                "type": "text",
                "content": text[last_end:match.start()].strip()
            })

        # Add math segment
        segments.append({
            "type": "math",
            "content": match.group(1),
            "latex": match.group(1)
        })
        last_end = match.end()

    # Add remaining text
    if last_end < len(text):
        segments.append({
            "type": "text",
            "content": text[last_end:].strip()
        })

    return segments if segments else [{"type": "text", "content": text}]

async def publish_segment(room: rtc.Room, speaker: str, segment: dict):
    """Publish a single segment with proper type"""
    data = {
        "type": "transcript",
        "speaker": speaker,
        "segments": [segment],
        "timestamp": datetime.now().isoformat()
    }

    packet = json.dumps(data).encode('utf-8')
    await room.local_participant.publish_data(packet, reliable=True)

    # Extra logging for math
    if segment.get("type") == "math":
        logger.info(f"[MATH] Published equation: {segment.get('latex')}")
```

### File 2: `/Users/umasankrudhya/Projects/pinglearn/pinglearn-app/src/app/classroom/page.tsx`

#### Change 3: Fix session ending ID issue (line 291)
```typescript
// REPLACE line 291:
// OLD: await orchestrator.endSession(sessionId);
// NEW:
const orchestratorState = orchestrator.getSessionState();
if (orchestratorState?.id) {
  await orchestrator.endSession(orchestratorState.id);
  console.log('[FC-001] Ended session with orchestrator ID:', orchestratorState.id);
} else if (sessionId) {
  // Fallback to voice session ID
  await orchestrator.endSession(sessionId);
}
```

### File 3: `/Users/umasankrudhya/Projects/pinglearn/pinglearn-app/src/components/classroom/TeachingBoard.tsx`

#### Change 4: Add smart content generation (after line 92)
```typescript
// ADD new method for generating teaching visualizations
const generateTeachingVisualization = useCallback((items: LiveDisplayItem[]): TeachingContent[] => {
  const teachingContent: TeachingContent[] = [];

  // Group related items into teaching blocks
  let currentBlock: TeachingContent[] = [];

  items.forEach((item, index) => {
    // Only process teacher/AI content
    if (item.speaker !== 'teacher' && item.speaker !== 'ai') return;

    // Special handling for math segments
    if (item.type === 'math') {
      // Add heading if this is the first math in a sequence
      if (currentBlock.length === 0 || currentBlock[currentBlock.length - 1].type !== 'math') {
        teachingContent.push({
          id: `heading-${item.id}`,
          type: 'heading',
          content: 'Mathematical Expression:',
          timestamp: item.timestamp
        });
      }

      // Add the math with KaTeX rendering
      teachingContent.push({
        id: item.id,
        type: 'math',
        content: item.content,
        timestamp: item.timestamp,
        highlight: true
      });

      // Add explanation if confidence is low
      if (item.confidence && item.confidence < 0.8) {
        teachingContent.push({
          id: `note-${item.id}`,
          type: 'text',
          content: '(AI confidence: moderate - please verify)',
          timestamp: item.timestamp
        });
      }
    } else {
      // Process text content
      const converted = convertDisplayItemToTeachingContent(item);
      if (converted) {
        teachingContent.push(converted);
      }
    }
  });

  return teachingContent;
}, [convertDisplayItemToTeachingContent]);

// MODIFY line 134-137 in checkForUpdates to use new visualization:
// OLD: const teachingContent = items.map(convertDisplayItemToTeachingContent).filter(...);
// NEW:
const teachingContent = generateTeachingVisualization(items);
```

---

## Testing Plan

1. Start both servers
2. Navigate to classroom
3. Start session and verify:
   - Single greeting (not double)
   - Real conversation appears in transcript
   - Math equations render when discussed
   - TeachingBoard shows educational layout (not duplicate)
   - Session ends without error

---

## Success Criteria

- [ ] No double greeting
- [ ] All conversation captured
- [ ] Math equations render with KaTeX
- [ ] TeachingBoard shows unique educational content
- [ ] Session ends cleanly

---

**Implementation Status**: READY TO IMPLEMENT