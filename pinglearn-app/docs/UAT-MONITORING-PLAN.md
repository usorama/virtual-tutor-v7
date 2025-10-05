# PingLearn UAT Monitoring Plan
**Created**: 2025-10-05
**Status**: ACTIVE - Option A (Chrome DevTools MCP)
**Purpose**: Comprehensive monitoring of manual UAT session to identify and document issues

---

## 🎯 Objectives

1. **Monitor browser state** during user testing (console, network, performance)
2. **Monitor terminal outputs** from Next.js frontend and Python LiveKit agent
3. **Correlate user actions** with system events and errors
4. **Document issues** with evidence in `.claude/docs/issue-tracker.md`
5. **Identify root causes** for existing P0 critical issues (#007, #008, #010)

---

## 🏗️ Architecture Overview

### Multi-Agent Monitoring System

```
┌─────────────────────────────────────────────────────────┐
│  Main Orchestrator (Claude)                             │
│  - Receives user action announcements                   │
│  - Triggers monitoring snapshots                        │
│  - Coordinates specialist agents                        │
│  - Aggregates findings                                  │
│  - Updates issue-tracker.md                             │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴────────┬─────────────┬──────────────┐
     │                │             │              │
     ▼                ▼             ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Browser  │   │ Frontend │   │ Python   │   │  Issue   │
│ Monitor  │   │   Log    │   │   Log    │   │ Analyzer │
│  Agent   │   │ Analyzer │   │ Analyzer │   │  Agent   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## 🔧 Setup Instructions

### Phase 1: MCP Server Configuration ✅

**Status**: COMPLETED

Chrome DevTools MCP has been configured in project `.mcp.json`:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Note**: Project-scoped MCP server. Will be available when Claude Code runs in this directory.

---

### Phase 2: Server Startup with Logging

**User Actions Required:**

#### Terminal 1 - Next.js Frontend (Port 3006)
```bash
cd ~/Projects/pinglearn/pinglearn-app
npm run dev 2>&1 | tee /tmp/pinglearn-nextjs.log
```

This command:
- Starts Next.js on port 3006
- Logs all output to both terminal AND `/tmp/pinglearn-nextjs.log`
- Allows Claude to read logs via `tail -n 100 /tmp/pinglearn-nextjs.log`

#### Terminal 2 - Python LiveKit Agent
```bash
cd ~/Projects/pinglearn/livekit-agent
source venv/bin/activate
python agent.py 2>&1 | tee /tmp/pinglearn-livekit.log
```

This command:
- Activates Python virtual environment
- Starts LiveKit agent
- Logs all output to both terminal AND `/tmp/pinglearn-livekit.log`
- Allows Claude to monitor metadata reception, RAG queries, voice events

---

### Phase 3: Chrome DevTools Remote Debugging

**User Actions Required:**

#### Option A: Launch New Chrome Instance (Recommended)
```bash
# Close existing Chrome instances first
killall "Google Chrome"

# Launch Chrome with remote debugging
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug-profile
```

Then navigate to: `http://localhost:3006`

#### Option B: Use Existing Chrome
If you want to keep your existing Chrome session:
```bash
# Launch a separate Chrome instance for debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug-profile \
  http://localhost:3006
```

**Why Remote Debugging?**
- Allows Chrome DevTools MCP to connect to YOUR actual browser
- Real-time monitoring of the exact session you're testing
- Microsecond-precision event correlation
- Full access to DevTools Protocol features

---

## 📊 Monitoring Workflow

### Step 1: User Announces Action
```
User: "I'm selecting Grade 12, English from curriculum dropdown"
```

### Step 2: User Performs Action
User performs the action in the Chrome browser window.

### Step 3: User Triggers Monitoring
```
User: "Check now"
```

### Step 4: Claude Executes Monitoring Sequence

**Parallel Agent Execution:**

1. **Browser Monitor Agent** (Chrome DevTools MCP)
   - Navigate to `localhost:3006`
   - List console messages (last 50)
   - List network requests (last 20)
   - Take screenshot for visual evidence
   - Capture performance metrics

2. **Frontend Log Analyzer Agent**
   - Read last 100 lines: `/tmp/pinglearn-nextjs.log`
   - Parse for errors, warnings, compilation issues
   - Extract React component logs
   - Identify event bus messages

3. **Python Log Analyzer Agent**
   - Read last 100 lines: `/tmp/pinglearn-livekit.log`
   - Parse for metadata reception logs
   - Check RAG pipeline queries
   - Monitor voice session events
   - Track WebSocket messages

### Step 5: Issue Correlation
**Issue Analyzer Agent** receives:
- Browser console errors/warnings
- Network request failures
- Frontend log excerpts
- Python agent log excerpts
- User action description

**Cross-references against:**
- Issue #007: Metadata pipeline (look for curriculum:selected events)
- Issue #008: Show-Then-Tell timing (check transcript vs audio timestamps)
- Issue #009: White container boxes (visual inspection via screenshot)
- Issue #010: Textbook access (check for "don't have access to NCERT" messages)
- Issue #011: Curriculum panel data (verify displayed grade/subject)

### Step 6: Documentation Update
**Documentation Agent** updates `.claude/docs/issue-tracker.md`:
- Adds new evidence to existing issues
- Creates new issue entries if novel problems found
- Includes log snippets, console errors, screenshots
- Tags with timestamp and user action

---

## 🎯 Issue Detection Priorities

### P0 Critical Issues (Blocking Core Functionality)

#### Issue #007: Metadata Pipeline Broken
**What to Monitor:**
- Frontend: Look for `curriculum:selected` event in console
- Frontend: Check if metadata is attached to WebSocket handshake
- Python: Look for "Participant metadata:" log messages
- Network: Inspect WebSocket connection payload

**Expected Flow:**
```
User selects Grade 12, English
  → Frontend fires curriculum:selected event
  → Event bus broadcasts to session manager
  → Session init includes metadata in WebSocket handshake
  → Python agent logs: "Participant metadata: {grade: 12, subject: 'English'}"
```

**Evidence to Collect:**
- Console logs showing event firing (or not)
- Network tab showing WebSocket handshake payload
- Python logs showing metadata reception (or absence)

---

#### Issue #008: Show-Then-Tell Inverted
**What to Monitor:**
- Browser: Transcript display timestamps
- Browser: Audio track attachment timestamps
- Console: Look for timing logs if implemented
- Performance: Audio streaming latency

**Expected Behavior:**
```
Transcript text appears
  → Wait 400ms
  → Audio starts playing that text
```

**Actual Behavior (BUG):**
```
Audio starts playing
  → Transcript text appears (inverted!)
```

**Evidence to Collect:**
- Console timestamps for transcript display events
- Performance timeline showing audio track attachment
- Screenshot showing text before/after audio plays

---

#### Issue #010: Textbook Content Inaccessible
**What to Monitor:**
- Python logs: RAG pipeline query execution
- Python logs: Look for "don't have access to NCERT" messages
- Python logs: Database query results (embeddings fetch)
- Agent responses: Check if textbook content is referenced

**Expected Flow:**
```
User asks: "Explain quadratic equations from NCERT Grade 10"
  → Agent receives curriculum context (Grade 10, Math)
  → RAG queries textbook embeddings table
  → Retrieves relevant NCERT content
  → Agent response includes textbook references
```

**Evidence to Collect:**
- Python logs showing RAG queries (or absence)
- Agent messages mentioning textbooks (or disclaimers)
- Database query logs if available

---

### P1 High Priority Issues

#### Issue #009: Message Container Boxes
**What to Monitor:**
- Screenshot visual inspection
- Browser DevTools Elements panel (if needed)
- CSS class names on message containers

**Expected:** Clean message bubbles without background boxes
**Actual:** Large white/light rectangles around messages

**Evidence to Collect:**
- Screenshot showing white container boxes
- DOM structure of message bubble elements

---

#### Issue #011: Curriculum Panel Wrong Data
**What to Monitor:**
- Screenshot of curriculum panel
- Frontend state management logs
- React component re-render logs

**Expected:** Panel shows "Grade 12, English"
**Actual:** Panel shows "Grade 10, Mathematics" (stale data)

**Evidence to Collect:**
- Screenshot showing incorrect data display
- Frontend logs showing state updates (or lack thereof)

---

## 🔍 Evidence Collection Standards

### For Each Issue Found:

**Minimum Evidence Requirements:**
1. **Log Excerpt** (10-20 lines showing context)
2. **Timestamp** of when issue occurred
3. **User Action** that triggered the issue
4. **Expected vs Actual** behavior description
5. **Screenshot** (for visual bugs)

### Evidence Storage:
- Screenshots: `pinglearn-app/docs/uat-evidence/screenshots/[timestamp]-[issue-id].png`
- Log files: `pinglearn-app/docs/uat-evidence/logs/[timestamp]-[issue-id].log`
- Issue tracker: `.claude/docs/issue-tracker.md` (updated in place)

---

## 📝 Issue Tracker Update Format

```markdown
### Issue #XXX: [Issue Title] ⚠️ ACTIVE
**Severity**: P0/P1/P2
**Component**: [Component name]
**Feature**: [Feature area]
**Status**: ⚠️ ACTIVE - [Short status]
**UAT Session**: 2025-10-05 - [User action that triggered]

**Problem**:
- [Description line 1]
- [Description line 2]

**Evidence** (UAT Session 2025-10-05):
```
[Log excerpt showing issue]
```

**User Action**: [What user did to trigger this]
**Timestamp**: [HH:MM:SS]
**Screenshot**: [path/to/screenshot.png]

**Root Cause**:
1. [Analysis based on evidence]
2. [Additional insights]

**Fix Required**:
1. [Specific action needed]
```

---

## 🔄 How to Resume This Session After Restart

**If Claude Code restarts, you can resume instantly:**

### Method 1: Slash Command (Recommended)
```bash
/uat-monitor
```

### Method 2: Text Replacement Switch
```bash
--uat
```

### Method 3: Manual
Read this file and the issue tracker, then proceed.

**Full Restart Guide**: See `docs/UAT-RESTART-GUIDE.md`

---

## 🚀 Execution Checklist

### Pre-UAT Setup
- [X] Configure Chrome DevTools MCP in `.mcp.json`
- [ ] Start Next.js with logging: `npm run dev 2>&1 | tee /tmp/pinglearn-nextjs.log`
- [ ] Start Python agent with logging: `python agent.py 2>&1 | tee /tmp/pinglearn-livekit.log`
- [ ] Launch Chrome with remote debugging: `google-chrome --remote-debugging-port=9222`
- [ ] Navigate to `localhost:3006` in debug Chrome
- [ ] Log in with test credentials (test@example.com / TestPassword123!)
- [ ] Verify all services running (frontend, Python, Chrome DevTools accessible)

### During UAT
- [ ] User announces each action before performing it
- [ ] User performs action in debug Chrome window
- [ ] User says "Check now" to trigger monitoring
- [ ] Claude spawns monitoring agents in parallel
- [ ] Claude aggregates findings
- [ ] Claude updates issue-tracker.md with evidence
- [ ] Repeat for each test scenario

### Post-UAT
- [ ] Review all captured evidence
- [ ] Verify issue-tracker.md is complete and accurate
- [ ] Prioritize issues by severity
- [ ] Create fix plan for P0 critical issues
- [ ] Commit evidence files and updated issue tracker

---

## 🎓 Test Scenarios (Priority Order)

### Scenario 1: Metadata Flow (Issue #007)
```
Action: Select "Grade 12, English" from curriculum dropdown
Expected: Python agent receives metadata
Monitor: Console events, WebSocket payload, Python logs
```

### Scenario 2: Show-Then-Tell Timing (Issue #008)
```
Action: Ask AI teacher a question, observe response
Expected: Text appears 400ms before audio speaks it
Monitor: Transcript timestamps, audio timing, console logs
```

### Scenario 3: Textbook Access (Issue #010)
```
Action: Ask: "Explain quadratic equations from NCERT Grade 10"
Expected: Agent references textbook content
Monitor: Python RAG logs, agent response content
```

### Scenario 4: Visual Bugs (Issue #009)
```
Action: Observe message display during conversation
Expected: Clean message bubbles
Monitor: Screenshot visual inspection
```

### Scenario 5: Curriculum Panel Display (Issue #011)
```
Action: Select different grade/subject, observe panel
Expected: Panel updates to show correct selection
Monitor: Screenshot, frontend state logs
```

---

## 🔄 Monitoring Agent Prompts

### Browser Monitor Agent Prompt
```
You are the Browser Monitor Agent. Using Chrome DevTools MCP:

1. Navigate to http://localhost:3006
2. Capture console messages (last 50) - look for errors, warnings, events
3. Capture network requests (last 20) - focus on WebSocket connections
4. Take screenshot for visual evidence
5. Capture performance metrics if available

Return structured data:
- Console errors/warnings with timestamps
- Network failures or suspicious requests
- Visual observations from screenshot
- Performance issues detected

Focus on: curriculum events, metadata flow, timing issues
```

### Log Analyzer Agent Prompt Template
```
You are the [Frontend/Python] Log Analyzer Agent.

1. Read last 100 lines from /tmp/pinglearn-[nextjs/livekit].log
2. Parse for errors, warnings, important events
3. Look for patterns matching known issues:
   - "curriculum:selected" events
   - "Participant metadata" logs
   - RAG pipeline queries
   - "don't have access to NCERT" messages
4. Extract relevant log excerpts (10-20 lines with context)

Return:
- Errors found with severity
- Important events detected
- Log excerpts (with line numbers if possible)
- Patterns matching known issues
```

### Issue Correlation Agent Prompt
```
You are the Issue Correlation Agent.

Inputs received:
- Browser console data
- Network request data
- Frontend log excerpt
- Python log excerpt
- User action description

Your task:
1. Cross-reference data against known issues in issue-tracker.md
2. Identify which existing issues are triggered
3. Detect new issues not yet documented
4. Analyze root causes based on evidence
5. Assign severity (P0/P1/P2)

Return:
- List of triggered existing issues (with IDs)
- List of new issues detected
- Root cause analysis for each
- Evidence summary for documentation
```

---

## 📊 Success Criteria

This UAT monitoring session is successful if we:

1. **Capture evidence** for all 5 P0/P1 active issues
2. **Identify root causes** for Issues #007, #008, #010 (critical blockers)
3. **Document new issues** if any are discovered
4. **Create actionable fix plans** based on evidence
5. **Maintain complete audit trail** of all findings

---

## 🚨 Contingency Plans

### If Chrome DevTools MCP Doesn't Work:
**Fallback**: Use Playwright MCP
- Less powerful but functional
- Separate browser instance (not user's active session)
- Periodic snapshots instead of real-time
- Still captures console, network, screenshots

### If Log Files Can't Be Created:
**Fallback**: User manually copies relevant terminal output
- Less automated but workable
- User pastes terminal snippets when issues occur
- Claude analyzes provided snippets

### If Remote Debugging Port Conflicts:
**Alternative Ports**: Try 9223, 9224, etc.
```bash
google-chrome --remote-debugging-port=9223 --user-data-dir=/tmp/chrome-debug-profile2
```

---

## 📞 Support & Troubleshooting

### Common Issues:

**"Chrome won't launch with remote debugging"**
- Solution: Kill all Chrome processes first: `killall "Google Chrome"`
- Then retry launch command

**"Cannot tail log files - permission denied"**
- Solution: Use `sudo` or redirect to home directory: `~/pinglearn-nextjs.log`

**"MCP server not responding"**
- Solution: Check `/mcp` command status
- Restart Claude Code if needed
- Verify server in `.mcp.json` is valid

---

**Version**: 1.0
**Last Updated**: 2025-10-05
**Next Review**: After UAT session completion
