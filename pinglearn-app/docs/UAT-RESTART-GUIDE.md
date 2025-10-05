# UAT Monitoring - Quick Restart Guide

**Created**: 2025-10-05
**Purpose**: Resume UAT monitoring session after Claude Code restart

---

## 🔄 How to Restart Claude Code

### Method 1: From Current Session
```bash
# Simply type in current Claude Code session:
exit

# Or press: Ctrl+D
```

### Method 2: From Terminal (if Claude Code is stuck)
```bash
# Kill the process
pkill -9 claude

# Or find and kill:
ps aux | grep claude
kill -9 <PID>
```

---

## 🚀 How to Resume UAT Monitoring

### Step 1: Restart Claude Code in PingLearn Directory
```bash
cd ~/Projects/pinglearn
claude
```

**Why this directory?** Project-scoped `.mcp.json` loads automatically from here.

---

### Step 2: Resume Session (Choose ONE method)

#### **Option A: Use Slash Command** (Recommended)
```bash
/uat-monitor
```

This loads:
- Complete UAT monitoring context
- Issue tracker status
- Workflow procedures
- All 5 priority issues to monitor

#### **Option B: Use Text Replacement Switch**
```bash
--uat
```

Then follow the prompt to run `/uat-monitor`.

#### **Option C: Manual Context Load**
```bash
Read /Users/umasankrudhya/Projects/pinglearn/pinglearn-app/docs/UAT-MONITORING-PLAN.md
Read /Users/umasankrudhya/.claude/docs/issue-tracker.md
Now let's begin UAT monitoring
```

---

## ✅ Verification Checklist

After restarting, verify:

### 1. MCP Servers Loaded
```bash
/mcp
```

**Expected:** Should see `chrome-devtools` in the list (or fallback to `playwright`)

### 2. Servers Running
```bash
# Check if log files exist
ls -lh /tmp/pinglearn-*.log

# Expected:
# /tmp/pinglearn-nextjs.log
# /tmp/pinglearn-livekit.log
```

If missing, start servers:
```bash
# Terminal 1
cd ~/Projects/pinglearn/pinglearn-app
npm run dev 2>&1 | tee /tmp/pinglearn-nextjs.log

# Terminal 2
cd ~/Projects/pinglearn/livekit-agent
source venv/bin/activate
python agent.py 2>&1 | tee /tmp/pinglearn-livekit.log
```

### 3. Chrome Remote Debugging Active
```bash
# Check if Chrome is running with debug port
lsof -i :9222

# Expected: Should show Google Chrome process
```

If not running:
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug-profile
# Navigate to: http://localhost:3006
```

---

## 📊 Quick Status Check

Ask Claude (after loading `/uat-monitor`):
```
Verify UAT monitoring setup status
```

Claude will check:
- ✅ MCP server availability
- ✅ Log files accessible
- ✅ Chrome debugging port
- ✅ Issue tracker readable

---

## 🎯 Begin Monitoring

Once verified, start testing:
```
User: "I'm selecting Grade 12, English from curriculum dropdown"
[perform action]
User: "Check now"
```

Claude will:
1. Spawn monitoring agents in parallel
2. Collect browser console, network, logs
3. Correlate with known issues
4. Update issue tracker with evidence

---

## 🔧 Troubleshooting

### "Chrome DevTools MCP not available"
**Fallback**: Claude will use Playwright MCP instead
- Less powerful but functional
- Monitoring still works

### "Log files not found"
**Fix**: Restart servers with `tee` command (see Step 2 above)

### "/uat-monitor command not found"
**Fix**: Command is at `~/.claude/commands/uat-monitor.md`
```bash
# Verify it exists:
ls -lh ~/.claude/commands/uat-monitor.md
```

### "Text replacement --uat not working"
**Check**: Hook is configured in `~/.claude/settings.json`
```bash
# Verify:
grep "text-replacement-processor" ~/.claude/settings.json
```

---

## 📝 Important Files

**Configuration:**
- MCP Config: `/Users/umasankrudhya/Projects/pinglearn/.mcp.json`
- Text Replacements: `~/.claude/text-replacements.md`
- Slash Command: `~/.claude/commands/uat-monitor.md`

**Documentation:**
- Full Plan: `pinglearn-app/docs/UAT-MONITORING-PLAN.md`
- Issue Tracker: `~/.claude/docs/issue-tracker.md`
- This Guide: `pinglearn-app/docs/UAT-RESTART-GUIDE.md`

**Evidence Storage:**
- Screenshots: `pinglearn-app/docs/uat-evidence/screenshots/`
- Logs: `pinglearn-app/docs/uat-evidence/logs/`

---

## ⚡ Super Quick Resume (TL;DR)

```bash
# 1. Restart
exit  # in current Claude session
cd ~/Projects/pinglearn
claude

# 2. Load context
/uat-monitor

# 3. Verify
# Claude checks setup automatically

# 4. Start testing
"I'm [doing action]"
[perform action]
"Check now"
```

---

**That's it!** You're back in UAT monitoring mode. 🚀
