# Phase 2.5 App Cleanup Prompt - PARALLEL EXECUTION
**For use with AI assistants to execute Phase 2.5 - Can run in parallel with Phase 2**

## 🚨 CRITICAL: THIS CAN RUN IN PARALLEL WITH PHASE 2

This cleanup phase can and should run simultaneously with Phase 2 Gemini integration to save time.

## Initial Setup Commands

```bash
# 1. Verify your working directory
pwd  # Should be in /Users/[username]/Projects/pinglearn

# 2. Create and checkout cleanup branch
git checkout main
git pull origin main
git checkout -b phase-2.5-app-cleanup

# 3. READ these files first:
- Read /Users/[username]/Projects/pinglearn/CLAUDE.md  # Project rules
- Read /Users/[username]/Projects/pinglearn/.ai-protected  # DO NOT DELETE protected files
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-2.5-app-cleanup.md  # Detailed plan
```

## Context

You are performing a deep cleanup of the PingLearn application, removing all dead code from 7 failed attempts and preparing for production deployment. This runs in parallel with Phase 2 to accelerate delivery.

## 🎯 PRIMARY OBJECTIVE

Remove ALL unused code, dependencies, and complexity that accumulated over 7 failed attempts, while preserving the working voice flow system.

## Task 2.5.1: Remove Tldraw & Collaborative Features (30 min)

### IMMEDIATE ACTIONS:

```bash
# Step 1: Remove tldraw from dependencies
cd pinglearn-app
npm uninstall @tldraw/tldraw @tldraw/assets @tldraw/editor

# Step 2: Delete tldraw-related directories
rm -rf src/components/whiteboard
rm -rf src/components/canvas
rm -rf src/features/collaborative-drawing
rm -rf src/features/collaboration

# Step 3: Clean up classroom page
# Edit src/app/classroom/page.tsx
# Remove ALL tldraw imports and canvas components

# Step 4: Commit
git add -A
git commit -m "cleanup: Remove tldraw and collaborative features"
```

## Task 2.5.2: Deep Clean Dead Features (1 hour)

### SEARCH AND DESTROY:

```bash
# Find and remove abandoned features
find src -type d -name "*quiz*" -exec rm -rf {} +
find src -type d -name "*abandoned*" -exec rm -rf {} +
find src -type d -name "*legacy*" -exec rm -rf {} +
find src -type d -name "*old*" -exec rm -rf {} +
find src -type d -name "*backup*" -exec rm -rf {} +
find src -type d -name "*deprecated*" -exec rm -rf {} +

# Remove unused authentication attempts
# Check if these exist before deleting:
rm -rf src/features/auth-old
rm -rf src/features/authentication-v1
rm -rf src/features/login-previous

# Remove failed voice implementations
rm -rf src/features/voice-old
rm -rf src/features/voice-v1
rm -rf src/features/audio-previous

# Commit after verification
git status  # Review what will be deleted
git add -A
git commit -m "cleanup: Remove dead features from failed attempts"
```

## Task 2.5.3: Clean Routes & Pages (30 min)

### KEEP ONLY ESSENTIAL ROUTES:

```typescript
// Keep these routes ONLY:
// app/page.tsx              - Landing page
// app/auth/page.tsx         - Login/Signup
// app/classroom/page.tsx    - Main voice application
// app/settings/page.tsx     - Basic settings

// DELETE everything else:
// app/dashboard/*           - Unless actively used
// app/admin/*               - Unless needed
// app/profile/*             - Unless essential
// app/test/*               - Remove all test pages
// app/demo/*               - Remove demo pages
```

```bash
# Remove unused routes
cd pinglearn-app/src/app
ls -la  # See what's there

# Delete unused route folders
rm -rf dashboard  # If not needed
rm -rf admin      # If not needed
rm -rf test       # Definitely remove
rm -rf demo       # Definitely remove

git commit -am "cleanup: Remove unused routes and pages"
```

## Task 2.5.4: Dependencies Audit (45 min)

### AGGRESSIVE DEPENDENCY CLEANUP:

```bash
# Step 1: Analyze what's actually used
npx depcheck --json > unused-deps.json
cat unused-deps.json

# Step 2: Remove obvious unused packages
npm uninstall axios  # If using fetch
npm uninstall lodash # If not used
npm uninstall moment # If using date-fns
npm uninstall styled-components # If using Tailwind

# Step 3: Remove type packages for removed libraries
npm uninstall @types/lodash @types/moment

# Step 4: Clean and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Step 5: Verify build still works
npm run build

git commit -am "cleanup: Remove unused dependencies"
```

## Task 2.5.5: Simplify File Structure (45 min)

### FLATTEN AND SIMPLIFY:

```bash
# Current complex structure → Simple structure
# Remove unnecessary nesting

# Consolidate utilities
mkdir -p src/lib/utils
# Move all scattered utils to one place
find src -name "*.util.ts" -o -name "*.utils.ts" -o -name "*.helper.ts" | xargs -I {} mv {} src/lib/utils/

# Consolidate types
mkdir -p src/types
# Move all type files to one place
find src -name "*.types.ts" -o -name "*.d.ts" | grep -v node_modules | grep -v protected-core | xargs -I {} mv {} src/types/

# Remove empty directories
find src -type d -empty -delete

git commit -am "cleanup: Simplify directory structure"
```

## Task 2.5.6: State Management Cleanup (30 min)

### REMOVE OVER-ENGINEERING:

```typescript
// If using Redux/Zustand for simple state, remove it
// Replace with React Context for:
// - User authentication
// - Voice session state
// - Transcription buffer

// Delete if exists:
// src/store/*
// src/redux/*
// src/state/*

// Keep only:
// src/contexts/AuthContext.tsx
// src/contexts/VoiceContext.tsx
// src/contexts/TranscriptionContext.tsx
```

## Task 2.5.7: Comprehensive Testing (45 min)

### COMPREHENSIVE TESTING PLAN (NEW REQUIREMENT):

Reference: `/Users/[username]/Projects/pinglearn/CLAUDE.md` Testing Strategy section

**Database Context**: PingLearn uses Supabase PostgreSQL with pre-loaded NCERT curriculum data for Grades 9-12.
**Schema Files**: Check `/Users/[username]/Projects/pinglearn/pinglearn-app/docs/database/schema.md` for table structure.
**Supabase MCP**: Use `mcp__supabase__*` tools for database operations.

```bash
# Step 1: Basic Quality Checks
npm run typecheck  # Must be 0 errors
npm run lint      # Must pass
npm run build     # Must succeed

# Step 2: Unit Testing (if tests exist)
npm test          # All must pass
npm run test:coverage  # Check coverage

# Step 3: Protected Core Violation Testing
npm run test:protected-core  # Verify no protected files modified
# Manual check:
git status | grep protected-core  # Should be empty

# Step 4: Database Integration Testing
# Use Supabase MCP to verify database connectivity
echo "Testing database connection..."
# Query curriculum data to ensure Class X maths topics are available
# Verify learning_sessions table structure
# Test voice_sessions integration with LiveKit

# Step 4: Regression Testing
# Create regression test file
cat > test-results.md << 'EOF'
# Phase 2.5 Cleanup - Regression Testing

## Pre-Cleanup State
- Voice flow: Working
- Math rendering: Working
- Authentication: Working

## Post-Cleanup Tests
### Critical User Flows:
- [ ] User can sign up/login
- [ ] User can access /classroom
- [ ] Voice session starts
- [ ] Transcription appears
- [ ] Math equations render
- [ ] Session ends gracefully

### Technical Verification:
- [ ] TypeScript: 0 errors
- [ ] Build: Success
- [ ] Bundle size: <500KB
- [ ] No console errors
- [ ] Protected core: Untouched

### Dependencies Check:
- [ ] All imports resolve
- [ ] No missing modules
- [ ] Clean npm install
EOF

# Step 5: Manual Testing
npm run dev
# Test each item in test-results.md
# Update checkboxes as you verify

# Step 6: Bundle Analysis
npx next build --analyze
# Verify main bundle < 500KB
# Document any large dependencies

# Step 7: Protected Core Compliance
echo "Checking protected core compliance..."
find src/protected-core -name "*.ts" -o -name "*.tsx" | wargs ls -la
# Verify no files were modified (check timestamps)

# Step 8: Quality Code Review
# Check that cleanup maintained code quality:
# - No broken imports
# - No unused variables
# - No type errors
# - Clear file organization

# Step 9: Integration Testing
# Test that remaining features work together:
# - Auth + Voice session
# - Voice + Transcription + Math
# - Session + Database save

# Step 10: Performance Verification
echo "Testing performance impact..."
# Before/after bundle size
# Before/after build time
# Before/after memory usage
```

### TESTING DOCUMENTATION (REQUIRED):

```bash
# Document all test results
echo "## Test Execution Results" >> test-results.md
echo "Date: $(date)" >> test-results.md
echo "Phase: 2.5 Cleanup" >> test-results.md
echo "" >> test-results.md

# Record test outcomes
npm test 2>&1 | tee -a test-results.md
npm run typecheck 2>&1 | tee -a test-results.md

# Note any issues found
echo "## Issues Found:" >> test-results.md
echo "- [List any problems discovered]" >> test-results.md

# Note cleanup impact
echo "## Cleanup Impact:" >> test-results.md
echo "- Files removed: [count]" >> test-results.md
echo "- Dependencies removed: [count]" >> test-results.md
echo "- Bundle size reduction: [percentage]" >> test-results.md

git add test-results.md
git commit -m "test: Document Phase 2.5 comprehensive testing results"
```

### FAILURE RESPONSE PROTOCOL:

If any test fails:

```bash
# Step 1: Document the failure
echo "FAILURE: [Description]" >> test-results.md
echo "Error: [Error message]" >> test-results.md

# Step 2: Assess severity
# - Critical: Breaks voice flow → STOP, fix immediately
# - Major: Breaks authentication → STOP, fix immediately
# - Minor: UI issue → Document, continue

# Step 3: Rollback if critical
git log --oneline -5  # Find last good commit
git reset --hard [commit-hash]  # Rollback to working state

# Step 4: Fix incrementally
# Make minimal changes to fix the issue
# Re-run tests after each fix

# Step 5: Re-test everything
# Run full test suite again
```

## 🚫 DO NOT DELETE

**CRITICAL - Preserve these:**
- `src/protected-core/**` - NEVER DELETE ANYTHING HERE
- `src/components/transcription/` - Keep for Phase 2
- Voice-related features currently working
- Authentication that works
- Database connections
- Environment configurations

## 📊 Success Metrics

After cleanup, you should achieve:
- **File count**: Reduced by >40%
- **Dependencies**: <50 packages (from 100+)
- **Bundle size**: <500KB
- **Build time**: <30 seconds
- **TypeScript errors**: 0
- **Directories removed**: >20

## Git Strategy

```bash
# Regular commits during cleanup
git add -A && git commit -m "cleanup: [specific description]"

# Push to remote for safety
git push origin phase-2.5-app-cleanup

# After completion, create PR
gh pr create --title "Phase 2.5: App cleanup and optimization" \
  --body "Removes dead code from 7 failed attempts, optimizes bundle size"
```

## Common Issues & Solutions

### Issue: "Cannot find module" after deletion
**Solution**: Update imports or remove the importing file if also unused

### Issue: TypeScript errors after cleanup
**Solution**: May need to update type exports/imports

### Issue: Build fails after dependency removal
**Solution**: Check if removed a needed peer dependency

### Issue: Protected core import errors
**Solution**: DO NOT delete anything from protected-core

## Parallel Execution Note

This cleanup can run simultaneously with Phase 2 because:
- We're removing UNUSED code
- Phase 2 works on NEW features
- Different git branches prevent conflicts
- Both merge to main independently

## Final Checklist

Before marking complete:
- [ ] Tldraw completely removed
- [ ] No console errors in browser
- [ ] Build succeeds
- [ ] Bundle size <500KB
- [ ] TypeScript: 0 errors
- [ ] Voice flow still works
- [ ] Can still login/logout
- [ ] All tests pass (if any exist)

---

**Remember**: Be aggressive with deletion. If you're unsure if something is used, check for imports. If nothing imports it, delete it. The 7 failed attempts left a lot of dead code - remove it all!