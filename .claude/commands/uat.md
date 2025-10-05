# UAT Monitoring - PingLearn Project

**Project**: PingLearn
**Location**: /Users/umasankrudhya/Projects/pinglearn

## 📋 Project-Specific Context

### Key Documents (Relative to Project Root)
1. **UAT Monitoring Plan**: `pinglearn-app/docs/UAT-MONITORING-PLAN.md`
2. **Issue Tracker**: `~/.claude/docs/issue-tracker.md` (global)
3. **Restart Guide**: `pinglearn-app/docs/UAT-RESTART-GUIDE.md`

### Project Configuration
- **Frontend Port**: 3006
- **Frontend Path**: `pinglearn-app/`
- **Python Agent Path**: `livekit-agent/`
- **MCP Config**: `.mcp.json` (project root)

### Log File Locations
- Frontend: `/tmp/pinglearn-nextjs.log`
- Python Agent: `/tmp/pinglearn-livekit.log`

### Evidence Storage
- Screenshots: `pinglearn-app/docs/uat-evidence/screenshots/`
- Logs: `pinglearn-app/docs/uat-evidence/logs/`

---

## 🎯 Your Mission

Monitor the user's manual UAT testing session of PingLearn app, identify issues in real-time, and document them in the issue tracker with evidence.

## 🏗️ Multi-Agent Architecture

You are the **Main Orchestrator** coordinating:
- Browser Monitor Agent (Chrome DevTools MCP or Playwright MCP)
- Frontend Log Analyzer Agent
- Python Log Analyzer Agent
- Issue Correlation Agent
- Documentation Agent

## 🔄 Workflow

For each user action:
1. **User announces**: "I'm [doing action]"
2. **User performs** action in browser
3. **User triggers**: "Check now"
4. **You execute**:
   - Spawn monitoring agents in parallel
   - Collect browser console, network, terminal logs
   - Correlate with known issues
   - Update issue tracker with evidence
   - Report summary to user

## 🎯 Priority Issues (5 Active P0/P1)

### P0 Critical (Blocking Core Functionality)
1. **Issue #007**: Metadata pipeline - Grade/Subject not reaching Python agent
2. **Issue #008**: Show-Then-Tell inverted - Text appears AFTER audio (backwards)
3. **Issue #010**: Textbook content inaccessible - Agent says "don't have access to NCERT"

### P1 High Priority
4. **Issue #009**: Message container boxes - White rectangles obstructing view
5. **Issue #011**: Curriculum panel - Displays wrong grade/subject data

## 🔍 Detection Patterns

### Issue #007 (Metadata Flow)
**Monitor:**
- Console: `curriculum:selected` event
- Network: WebSocket handshake payload
- Python logs: "Participant metadata:" messages

**Expected Flow:**
```
User selects Grade 12, English
  → Frontend fires curriculum:selected event
  → WebSocket handshake includes metadata
  → Python logs: "Participant metadata: {grade: 12, subject: 'English'}"
```

### Issue #008 (Show-Then-Tell Timing)
**Monitor:**
- Browser: Transcript display timestamps
- Browser: Audio playback start time
- Performance timeline

**Expected:** Text → 400ms delay → Audio
**Actual Bug:** Audio → Text (inverted!)

### Issue #010 (Textbook Access)
**Monitor:**
- Python logs: RAG pipeline queries
- Agent responses: Check for "don't have access to NCERT" disclaimers

**Expected:** Agent references NCERT textbook content
**Actual Bug:** Agent says it doesn't have access

### Issue #009 (Visual Containers)
**Monitor:** Screenshot visual inspection
**Expected:** Clean message bubbles
**Actual Bug:** Large white/light rectangles around messages

### Issue #011 (Panel Data)
**Monitor:** Screenshot of curriculum panel
**Expected:** Panel shows selected grade/subject
**Actual Bug:** Panel shows stale/incorrect data (e.g., "Grade 10 Math" when user selected "Grade 12 English")

## ⚙️ Setup Verification

**Check immediately:**

1. **MCP Server Status**:
   ```bash
   /mcp
   ```
   Look for: `chrome-devtools` (preferred) or `playwright` (fallback)

2. **Log Files Exist**:
   ```bash
   ls -lh /tmp/pinglearn-*.log
   ```
   Should show: nextjs.log and livekit.log

3. **Chrome Remote Debugging**:
   ```bash
   lsof -i :9222
   ```
   Should show: Google Chrome process

## 📝 Evidence Standards

For each issue document:
1. **Log excerpt** (10-20 lines with context)
2. **Timestamp** (HH:MM:SS)
3. **User action** that triggered it
4. **Expected vs Actual** behavior
5. **Screenshot** (for visual bugs)

## 🚀 Quick Start

**First time setup:**
1. Read full plan: `cat pinglearn-app/docs/UAT-MONITORING-PLAN.md`
2. Check issue tracker: `cat ~/.claude/docs/issue-tracker.md`
3. Verify setup (MCP, logs, Chrome)

**Resume after restart:**
Just run `/uat` - all context loads automatically

**Begin monitoring:**
Wait for user to announce action, perform it, then say "Check now"

---

**START BY**: Verifying setup status and reading the issue tracker.
