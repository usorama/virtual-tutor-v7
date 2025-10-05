# PingLearn - Claude Code Project Configuration

**Created**: 2025-10-05
**Purpose**: Project-specific Claude Code configuration and commands

---

## 📁 Directory Structure

```
.claude/
├── commands/              # Project-specific slash commands
│   └── uat.md            # /uat - UAT monitoring command
├── project-context.json   # Structured project metadata
└── README.md             # This file
```

---

## 🎯 Project-Specific Slash Commands

### `/uat` - UAT Monitoring
**Location**: `.claude/commands/uat.md`
**Scope**: Project-only (only works in PingLearn directory)

**What it does:**
- Loads complete UAT monitoring context
- Project-specific paths and configuration
- All 5 priority issues to monitor
- Monitoring workflow and agent coordination

**Usage:**
```bash
# Basic usage (no arguments needed):
/uat

# With additional context (optional):
/uat Focus on Issue #007 - metadata pipeline
```

**Difference from global `/uat-monitor`:**
- **`/uat`**: Project-specific, knows PingLearn structure
- **`/uat-monitor`**: Global, works anywhere but less specific

---

## 📊 Project Context File

**Location**: `.claude/project-context.json`

**Purpose:** Structured metadata about PingLearn project that can be programmatically read.

**Contains:**
- Project structure (frontend, backend paths)
- Documentation locations
- UAT monitoring configuration
- Active issues metadata
- Test credentials

**How to use:**
```bash
# Claude can read this for context:
cat .claude/project-context.json

# Or programmatically in scripts:
jq '.uatMonitoring.priorities' .claude/project-context.json
```

---

## 🔄 Slash Command Architecture

### Global vs Project-Specific Commands

**Global Commands** (`~/.claude/commands/`):
- Available from ANY directory
- User-level, shared across all projects
- Example: `/uat-monitor`

**Project Commands** (`.claude/commands/`):
- Only available in THIS project directory
- Project-specific context and paths
- Example: `/uat` (PingLearn-specific)

### Priority: Project > Global
If both exist, project-specific commands take priority.

---

## 💡 **Arguments & Additional Context**

### Slash commands CAN take arguments:

```bash
# Basic invocation:
/uat

# With additional context:
/uat Start with Issue #007 first

# With specific instructions:
/uat Only monitor frontend logs today
```

**How it works:**
- Text after command name gets appended to the prompt
- Allows dynamic context without editing command file
- Useful for session-specific focus areas

---

## 📋 Project-Specific Context Arguments

### Recommended Arguments for `/uat`:

**Focus on specific issue:**
```bash
/uat Focus on Issue #007 - metadata pipeline
/uat Check Issue #008 timing problems
```

**Skip certain checks:**
```bash
/uat Skip visual checks, focus on backend
/uat Frontend monitoring only
```

**Evidence collection mode:**
```bash
/uat Collect evidence for all P0 issues
/uat Screenshot mode - capture all visual bugs
```

**Session type:**
```bash
/uat First UAT session - comprehensive check
/uat Quick smoke test
/uat Regression test after fixes
```

---

## 🎯 Example Usage Scenarios

### Scenario 1: First Time UAT
```bash
cd ~/Projects/pinglearn
claude

# Load full context:
/uat First comprehensive UAT session

# Claude will:
# - Read full UAT plan
# - Check issue tracker
# - Verify setup (MCP, logs, Chrome)
# - Begin monitoring workflow
```

### Scenario 2: After Restart (Quick Resume)
```bash
cd ~/Projects/pinglearn
claude

# Quick resume:
/uat

# Claude knows:
# - Project context from .claude/project-context.json
# - Previous session state from issue tracker
# - Setup requirements
```

### Scenario 3: Targeted Testing
```bash
cd ~/Projects/pinglearn
claude

# Focus on one issue:
/uat Only test metadata flow - Issue #007

# Claude will:
# - Load relevant issue details
# - Monitor ONLY metadata-related events
# - Skip other checks
```

### Scenario 4: Evidence Collection
```bash
cd ~/Projects/pinglearn
claude

# Prepare for fix implementation:
/uat Collect complete evidence for all P0 issues before implementing fixes

# Claude will:
# - Systematically test each P0 issue
# - Capture logs, screenshots, timestamps
# - Document in issue tracker
# - Create fix priority order
```

---

## 🔧 How to Create More Project Commands

### Step 1: Create Command File
```bash
# In project .claude/commands/ directory:
touch .claude/commands/my-command.md
```

### Step 2: Write Command Content
```markdown
# My Custom Command

[Command description and instructions]

## Context
- Project-specific paths
- Configuration
- Workflow

## Actions
What you want Claude to do
```

### Step 3: Use It
```bash
/my-command
```

---

## 📚 Related Documentation

**UAT Monitoring:**
- Plan: `pinglearn-app/docs/UAT-MONITORING-PLAN.md`
- Restart Guide: `pinglearn-app/docs/UAT-RESTART-GUIDE.md`
- Issue Tracker: `~/.claude/docs/issue-tracker.md`

**Global Commands:**
- Location: `~/.claude/commands/`
- UAT Monitor (global): `~/.claude/commands/uat-monitor.md`

**Text Replacements:**
- Switches: `~/.claude/text-replacements.md`
- UAT Switch: `--uat`

---

## ⚡ Quick Reference

```
┌──────────────────────────────────────────────────┐
│  PINGLEARN UAT MONITORING - QUICK START         │
├──────────────────────────────────────────────────┤
│  cd ~/Projects/pinglearn                         │
│  claude                                          │
│  /uat                                            │
│                                                  │
│  → Full context loads automatically              │
│  → Project-specific paths known                  │
│  → Ready to monitor UAT session                  │
└──────────────────────────────────────────────────┘
```

---

## 🎓 Advanced: Reading Project Context Programmatically

### From Command Files
```markdown
# In your .claude/commands/custom.md:

Read the project context:
cat .claude/project-context.json

Extract UAT priorities:
jq '.uatMonitoring.priorities' .claude/project-context.json

Use this data to configure your monitoring...
```

### From Claude Directly
```bash
# Claude can:
cat .claude/project-context.json | jq '.documentation'
# → Returns all doc paths

cat .claude/project-context.json | jq '.uatMonitoring.priorities[] | select(.severity=="P0")'
# → Returns only P0 critical issues
```

---

**This makes your UAT workflow:**
- ✅ **Resumable**: `/uat` restores full context
- ✅ **Project-aware**: Knows PingLearn structure
- ✅ **Flexible**: Accepts arguments for dynamic context
- ✅ **Maintainable**: Structured metadata in JSON
- ✅ **Portable**: Works only in PingLearn directory

---

**Version**: 1.0
**Last Updated**: 2025-10-05
