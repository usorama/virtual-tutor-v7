# 🚀 Git Strategy Quick Reference

## Daily Workflow (Copy-Paste Commands)

### Morning Start
```bash
git checkout main
git pull origin main
npm run checkpoint:watch  # Keep running in background
```

### Risky AI Work
```bash
npm run branch:exp  # Creates exp/feature-name
# ... do work ...
# If successful:
git checkout main && git merge exp/feature-name
git branch -d exp/feature-name

# If failed:
git checkout main
git branch -D exp/feature-name  # Force delete without merge
```

### End of Day
```bash
npm run checkpoint  # Force a checkpoint
npm run branch:cleanup  # Delete old exp branches
git push origin main
```

## Phase Completion
```bash
npm run phase:complete  # Interactive wizard
# Follow prompts, then go to GitHub to protect branch
```

## Emergency Recovery
```bash
# Black hole detected:
bash .claude/automation/scripts/recover-from-black-hole.sh

# Quick rollback:
git reset --hard HEAD~1  # Go back 1 commit
npm test  # Verify stability
```

## Status Checks
```bash
npm run branch:list      # See special branches
npm run phase:status     # See completed phases
npm run checkpoint:status  # See if checkpoint needed
npm run learning:stats   # See ML training data
```

## Branch Lifetime Rules
- `main`: Permanent trunk
- `stable/*`: Permanent, protected
- `exp/*`: 4 hours max
- `recovery/*`: Until merged or abandoned

## Commit Message Format
```
feat: Add new feature
fix: Fix bug
exp: Experimental change
stable: Phase completion
checkpoint: Auto-checkpoint
recovery: Recovery from issue
```

## Protection Reminder
After creating `stable/phase-X`, immediately:
1. Go to GitHub → Settings → Branches
2. Add rule for `stable/*`
3. Enable ALL protection options

---
**Remember**: exp branches = 4 hours max! Delete aggressively.