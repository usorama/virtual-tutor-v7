# 🧪 PC-010 Transcription Pipeline Manual Test Guide

## ✅ Prerequisites Verified
- ✅ PingLearn app running on http://localhost:3006
- ✅ LiveKit Python agent service running (PID: 42734)

## 🎯 CRITICAL TEST MISSION
**Verify if PC-010 transcription pipeline fix is working and transcriptions are appearing in real-time**

---

## 📋 Step-by-Step Testing Protocol

### Step 1: Initial Setup & Navigation

1. **Open Chrome/Safari and navigate to**: http://localhost:3006
2. **Open Developer Tools**: Right-click → Inspect → Console tab
3. **Take initial screenshot** of homepage
4. **Look for**: "Go to Dashboard" or "Dashboard" button/link
5. **Click**: Go to Dashboard

**Expected**: Should navigate to dashboard page with curriculum cards

### Step 2: Access Classroom

1. **Look for**: "Grade 10 Mathematics" card or "Classroom" link
2. **Click**: Grade 10 Mathematics card or Classroom link
3. **Take screenshot** of classroom page BEFORE starting session
4. **Note what you see**: Teaching board area (left 80%), transcript panel (right 20%)

**Expected**: Classroom interface with "Start Session" button visible

### Step 3: Start Learning Session

1. **Click**: "Start Session" button
2. **Immediately watch console** for these specific messages:
   ```
   [PC-010] Setting up LiveKit transcription listener
   [PC-010] Received transcript data from:
   [PC-010] Processing X segments
   [PC-010] SessionOrchestrator received transcription:
   [PC-010] Math equation received:
   ```
3. **Wait 5-10 seconds** for AI teacher to connect and start speaking
4. **Take screenshot** AFTER session starts

**Expected**: AI teacher should start speaking, console logs should appear

### Step 4: Monitor Real-Time Transcription (CRITICAL)

**Watch these areas simultaneously for 30-60 seconds:**

#### A. Browser Console
- **Look for**: `[PC-010]` prefixed messages
- **Copy ALL PC-010 messages** you see
- **Note any errors** related to transcription/LiveKit

#### B. Teaching Board (Left Side - 80% width)
- **Initial content**: Should show "Session started: Grade 10 Mathematics"
- **Watch for**: New text appearing in real-time
- **Look for**: Mathematical equations rendered with KaTeX
- **Note**: If content is streaming/updating live

#### C. Transcript Tab (Right Side - 20% width)
- **Check**: If "Transcript" tab is active/visible
- **Watch for**: Text appearing in real-time
- **Note**: If it's auto-scrolling
- **Check**: If text matches what AI teacher is saying

### Step 5: Network Analysis

1. **Open Network tab** in Developer Tools
2. **Filter by**: WS (WebSocket)
3. **Look for**: LiveKit WebSocket connection
4. **Check**: If data frames are being transmitted (should see activity)

### Step 6: Content Verification

**After 1-2 minutes of session, check:**

1. **Teaching Board Content**:
   - Is there content beyond "Session started: Grade 10 Mathematics"?
   - Are there mathematical equations visible?
   - Is content appearing in real-time as teacher speaks?

2. **Transcript Panel**:
   - Is transcription text visible?
   - Does it update as teacher speaks?
   - Is it properly formatted?

---

## 🔍 What to Report Back

### CRITICAL FINDINGS (Copy exactly what you see):

1. **Console Logs**:
   ```
   [Copy ALL [PC-010] messages here]
   ```

2. **Teaching Board Content**:
   ```
   [Copy exact text/content you see in Teaching Board]
   ```

3. **Transcript Content**:
   ```
   [Copy exact text you see in Transcript panel]
   ```

4. **Audio Verification**:
   - [ ] Can hear AI teacher speaking
   - [ ] Teacher is discussing mathematics topic
   - [ ] Audio is clear and continuous

5. **Real-Time Updates**:
   - [ ] Text appears as teacher speaks
   - [ ] Mathematical equations render properly
   - [ ] Content updates in real-time
   - [ ] Auto-scrolling works

6. **Errors/Issues**:
   ```
   [Copy any error messages or issues]
   ```

---

## 🎯 SUCCESS CRITERIA

**✅ TRANSCRIPTION WORKING** if you see:
- PC-010 console logs appearing
- Text content updating in Teaching Board
- Transcript panel showing real-time text
- Mathematical equations rendered properly

**⚠️ PARTIAL SUCCESS** if you see:
- PC-010 logs but no visual content
- Audio working but no transcription
- Some content but not real-time

**❌ NOT WORKING** if you see:
- No PC-010 console logs
- No content beyond "Session started"
- Audio but no transcription
- Error messages in console

---

## 🚨 EMERGENCY DEBUGGING

If issues occur:

1. **Refresh page** and try again
2. **Check browser console** for any errors
3. **Verify both services** are still running:
   ```bash
   curl -I http://localhost:3006
   ps aux | grep "agent.py"
   ```

---

## 📸 Screenshots to Take

1. Homepage with dashboard button
2. Dashboard with Grade 10 Math card
3. Classroom BEFORE session start
4. Classroom AFTER session start (showing any content)
5. Browser console with PC-010 logs
6. Teaching Board close-up (if content appears)
7. Transcript panel close-up (if content appears)

---

**This is our moment of truth! Follow this guide step-by-step and report back exactly what you observe. The PC-010 fix should make transcriptions visible in real-time.**