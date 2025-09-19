# 🌲 Git Branching Strategy - Virtual Tutor Project

## 📋 Executive Summary

**Strategy Name**: **"Phase-Protected Trunk Development"** (PPTD)

A hybrid approach combining trunk-based development with phase-based protection branches, specifically designed for the Virtual Tutor project's unique challenges:
- History of AI-induced failures (5 previous attempts)
- 6-week POV timeline with 3 distinct phases
- Single developer/small team (2-3 people)
- Need for rapid rollback capabilities

## 🎯 WHY This Strategy?

### The Problem
1. **5 Failed Attempts**: Direct evidence that traditional branching failed to protect against cascading failures
2. **AI-Induced Black Holes**: Code generation can rapidly destabilize the codebase
3. **Linear Development Risk**: Working directly on main = no escape route
4. **Phase Transitions**: Moving between POV phases needs clear boundaries

### The Solution
- **Protected Stable Points**: Immutable phase branches as recovery anchors
- **Rapid Experimentation**: Short-lived feature branches (max 4 hours)
- **Automatic Safety**: Auto-checkpoints every 10 changes/30 minutes
- **Clear Rollback Path**: Always know where to retreat to

## 🏗️ WHAT - The Branch Architecture

```
stable/phase-1 ─────┐ (Protected - Never Force Push)
                    │
stable/phase-2 ─────┼─┐ (Protected - Never Force Push)
                    │ │
stable/phase-3 ─────┼─┼─┐ (Protected - Never Force Push)
                    │ │ │
main ◄──────────────┴─┴─┴──► (Active Development)
 │
 ├── exp/voice-integration (4-hour max lifetime)
 ├── exp/whiteboard-sync (4-hour max lifetime)
 └── exp/assessment-ui (4-hour max lifetime)
```

### Branch Types

#### 1. **Main Branch** (`main`)
- **Purpose**: Primary development trunk
- **Protection**: Basic (require PR reviews if team > 1)
- **Auto-checkpoint**: Every 10 changes or 30 minutes
- **Deployment**: Local development only

#### 2. **Phase Branches** (`stable/phase-X`)
- **Purpose**: Immutable recovery points at phase completion
- **Protection**: FULL (no direct pushes, no force push, admin only)
- **Creation**: End of each successful phase
- **Lifetime**: Permanent (never deleted)

#### 3. **Experiment Branches** (`exp/feature-name`)
- **Purpose**: High-risk AI-assisted development
- **Protection**: None (disposable)
- **Lifetime**: Maximum 4 hours (auto-delete if older)
- **Naming**: `exp/` prefix mandatory

#### 4. **Recovery Branches** (`recovery/YYYYMMDD-HHMMSS`)
- **Purpose**: Emergency escape from black holes
- **Creation**: Automatic via recovery script
- **Based on**: Last stable phase branch
- **Lifetime**: Until merged or abandoned

## 🔄 HOW - The Workflow

### Daily Development Flow

```bash
# 1. Start your day - ensure on main
git checkout main
git pull origin main

# 2. Check current phase
npm run check:phase

# 3. For risky AI work - create experiment branch
git checkout -b exp/voice-integration

# 4. Work with auto-checkpoints running
npm run checkpoint:watch

# 5. If successful after testing
git checkout main
git merge exp/voice-integration
git branch -d exp/voice-integration

# 6. If failed/black hole detected
git checkout main
git branch -D exp/voice-integration  # Nuclear option
npm run recover:stable  # Returns to last phase
```

### Phase Completion Flow

```bash
# 1. Ensure all tests pass
npm run test
npm run validate
npm run quality:comprehensive

# 2. Create phase branch (PROTECTED)
git checkout main
git tag -a "phase-1-complete" -m "Phase 1: Foundation complete"
git checkout -b stable/phase-1
git push origin stable/phase-1

# 3. Protect the branch on GitHub
# Settings → Branches → Add rule
# - Branch name pattern: stable/*
# - Require pull request reviews
# - Dismiss stale reviews
# - Include administrators
# - Do not allow force pushes
```

### Black Hole Recovery Flow

```bash
# Automatic via existing script
bash .claude/automation/scripts/recover-from-black-hole.sh

# Manual recovery
git stash save "black-hole-backup"
git checkout stable/phase-1  # Or latest stable phase
git checkout -b recovery/$(date +%Y%m%d-%H%M%S)
```

## 📐 Rules & Constraints

### Mandatory Rules

1. **NEVER force push to stable/* branches**
2. **NEVER work directly on stable/* branches**
3. **ALWAYS delete exp/* branches after 4 hours**
4. **ALWAYS run tests before phase completion**
5. **ALWAYS tag phase completions**

### Commit Message Standards

```
Type: Description (max 72 chars)

Types:
- feat: New feature
- fix: Bug fix
- checkpoint: Auto-checkpoint (automated)
- exp: Experimental work
- stable: Phase completion
- recovery: Black hole recovery
- refactor: Code restructuring
- test: Test additions/changes
- docs: Documentation

Examples:
feat: Add voice transcription pipeline
fix: Resolve WebRTC audio latency issue
stable: Phase 2 - LiveKit integration complete
exp: Testing Gemini Live websocket connection
recovery: Restore from checkpoint after import cycle
```

## 🚀 Implementation Plan

### Step 1: Initialize Strategy (Day 1)
```bash
# Create and protect first stable point
git tag -a "pre-strategy-baseline" -m "Baseline before branching strategy"
git push origin --tags

# Document current state
npm run checkpoint:status > .claude/docs/baseline-status.txt
git add .claude/docs/baseline-status.txt
git commit -m "docs: Record baseline before branching strategy"
```

### Step 2: Setup Branch Protection (Day 1)
Go to GitHub → Settings → Branches:

1. Add rule for `stable/*`:
   - ✅ Require pull request reviews
   - ✅ Dismiss stale reviews
   - ✅ Include administrators
   - ✅ Restrict who can push
   - ✅ Do not allow force pushes
   - ✅ Do not allow deletions

2. Add rule for `main`:
   - ✅ Require status checks (if CI exists)
   - ❌ Do not require PR reviews (for solo work)

### Step 3: Create Automation Helpers
```bash
# Add to package.json scripts
"branch:exp": "git checkout -b exp/$(read -p 'Feature name: ' name && echo $name)",
"branch:cleanup": "git branch -d $(git branch | grep 'exp/' | grep -v '*')",
"branch:list": "git branch -a | grep -E '(stable|exp|recovery)'",
"phase:complete": "bash .claude/automation/scripts/complete-phase.sh"
```

## 📊 Success Metrics

### Quantitative
- **Recovery Time**: < 5 minutes to stable state
- **Black Hole Frequency**: Decrease by 50% each phase
- **Experiment Success Rate**: > 60% of exp/ branches merged
- **Phase Completion Rate**: 100% (3 of 3 phases)

### Qualitative
- **Developer Confidence**: Willing to experiment without fear
- **Code Stability**: Main branch always buildable
- **Clear History**: Git log tells the story of development

## 🔥 Emergency Procedures

### Scenario 1: Black Hole on Main
```bash
npm run detect:guardian  # Confirm black hole
git stash              # Save work
git reset --hard HEAD~1  # Step back one commit
npm test               # Verify stability
```

### Scenario 2: Corrupted Experiment
```bash
git checkout main
git branch -D exp/broken-feature  # Delete without merge
npm run checkpoint:status  # Verify main is clean
```

### Scenario 3: Phase Regression Needed
```bash
git checkout stable/phase-2  # Return to last good phase
git checkout -b main-recovery
git branch -D main
git branch -m main  # Replace main with stable phase
```

## 🎓 Training & Onboarding

### For Solo Developer
1. Practice creating/deleting exp/ branches daily
2. Run `npm run checkpoint:watch` always
3. Complete phases only when 100% confident
4. Use recovery scripts without hesitation

### For Team Members
1. Never commit directly to stable/*
2. Always work in exp/ for AI-assisted code
3. Communicate before phase completions
4. Review each other's exp/ branches before merge

## 📈 Evolution Path

### Phase 1 Complete (Week 2)
- Create `stable/phase-1`
- Document lessons learned
- Adjust exp/ branch lifetime if needed

### Phase 2 Complete (Week 4)
- Create `stable/phase-2`
- Evaluate strategy effectiveness
- Consider adding `hotfix/` branch type if needed

### POV Complete (Week 6)
- Create `stable/poc-complete`
- Prepare for production branching strategy
- Document full journey for future projects

## 🚨 Anti-Patterns to Avoid

1. **Working directly on stable branches** - They're immutable for a reason
2. **Long-lived experiment branches** - 4 hours max, period
3. **Skipping auto-checkpoints** - They're your safety net
4. **Force pushing to fix mistakes** - Create new commits instead
5. **Deleting stable branches** - They're your escape routes

## 📝 Quick Reference Card

```bash
# Daily Commands
git checkout main                        # Start here
git checkout -b exp/feature             # Experiment
git checkout main && git merge exp/feature  # Success
git branch -D exp/feature               # Cleanup

# Phase Completion
git tag -a "phase-X-complete" -m "..."  # Tag it
git checkout -b stable/phase-X          # Branch it
git push origin stable/phase-X          # Protect it

# Emergency Recovery
bash .claude/automation/scripts/recover-from-black-hole.sh
```

---

**Remember**: This strategy exists because of 5 failed attempts. Use it religiously. Your code's stability depends on it.

**Last Updated**: 2025-09-13  
**Strategy Version**: 1.0  
**Project**: Virtual Tutor POV (Attempt #6)