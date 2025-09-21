# Phase 3 Deployment Prompt - PingLearn Architecture Pivot
**For use with AI assistants to execute Phase 3 - Essential Testing & Deployment**

## 🚨 CRITICAL: THIS IS THE PINGLEARN PROJECT (NOT VIRTUAL TUTOR)

This prompt is for the **PingLearn real-time transcription and math rendering** project using the Protected Core Architecture to prevent the failures of attempts 1-7.

## Initial Setup Commands

```bash
# 1. Verify your working directory
pwd  # Should be in /Users/[username]/Projects/pinglearn

# 2. Check current branch status
git branch --show-current  # Should be phase-3-deployment or create it
# If not, create it:
# git checkout main && git checkout -b phase-3-deployment

# 3. READ these files IN ORDER using Read tool:
- Read /Users/[username]/Projects/pinglearn/CLAUDE.md  # Project rules
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/MASTER-PLAN.md  # Day 6 objectives
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-3-stabilization.md  # Today's detailed plan
- Read /Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/phase-1-completion-report.md  # What's already built
- Read /Users/[username]/Projects/pinglearn/.ai-protected  # Files you CANNOT modify
```

## Context Setup

You are implementing Phase 3 of the PingLearn architecture pivot. This is the final phase focused on essential testing and deploying the working real-time voice transcription with math rendering app to production.

## 🎯 PRIMARY OBJECTIVE

Deploy a working PingLearn app to production with:
- Real-time AI teacher voice (Gemini Live API)
- Live transcription with math equation rendering (KaTeX)
- Simplified display (no tldraw, no whiteboard)
- Basic monitoring to know when things break

## Related Documentation Structure

### Phase Plans (Implementation Details):
```
/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/
├── phase-0-foundation.md         # Foundation (completed)
├── phase-1-core-services.md      # Core services (completed)
├── phase-2-gemini-integration.md # Gemini integration (should be complete)
├── phase-2.5-app-cleanup.md      # App cleanup (should be complete)
└── phase-3-stabilization.md      # TODAY'S PLAN ← Read this!
```

### Prompts (AI Instructions):
```
/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/04-prompts/
├── phase-0-prompt.md
├── phase-1-prompt.md
├── phase-2-prompt-enhanced.md
├── phase-2.5-cleanup-prompt.md
└── phase-3-deployment-prompt.md  # THIS FILE
```

### Architecture Documentation:
```
/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/02-architecture/
└── protected-core-architecture.md  # The protected core design
```

### Completion Reports:
```
/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/
├── phase-0-completion-report.md
├── phase-1-completion-report.md
└── MASTER-PLAN.md                # Overall 6-day plan
```

## Task 3.1: Comprehensive Pre-Deployment Testing (1.5 hours)

### CRITICAL TESTING PLAN (EXPANDED):

Reference: `/Users/[username]/Projects/pinglearn/CLAUDE.md` Testing Strategy section

**Database Context**: PingLearn uses Supabase PostgreSQL with comprehensive schema including:
- Pre-loaded NCERT Class X Mathematics curriculum (Real Numbers, Polynomials, Quadratic Equations, etc.)
- Schema files: `/Users/[username]/Projects/pinglearn/pinglearn-app/docs/database/schema.md`
- Tables: profiles, learning_sessions, voice_sessions, transcripts, curriculum_data, textbooks
- Use Supabase MCP tools: `mcp__supabase__*` for database operations

**Mandatory E2E Testing**: MUST use Playwright MCP (`mcp__playwright__*`) for end-to-end testing before deployment.

```bash
# Navigate to app directory
cd pinglearn-app

# Step 1: Protected Core Integrity Testing
echo "=== PROTECTED CORE INTEGRITY TESTING ==="
npm run test:protected-core  # Verify no violations
git status | grep protected-core  # Must be empty
find src/protected-core -name "*.ts" -exec grep -l "any\|TODO\|FIXME" {} \;  # Should be empty

# Step 1.5: Database Integration Testing
echo "=== DATABASE INTEGRATION TESTING ==="
# Use Supabase MCP to verify:
# - Database connectivity
# - Class X mathematics curriculum data exists
# - Learning session tables are properly structured
# - Voice session integration works

# Step 2: Regression Testing Suite
echo "=== REGRESSION TESTING ==="
npm run test:regression  # All previous features work
npm run typecheck       # 0 errors required
npm run lint           # Must pass

# Step 3: Integration Testing
echo "=== INTEGRATION TESTING ==="
npm run test:integration  # Service interactions
npm test               # Unit tests

# Step 4: End-to-End Critical Path Testing (MANDATORY PLAYWRIGHT MCP)
echo "=== E2E CRITICAL PATH TESTING ==="
npm run build          # Production build
npm run start &        # Start production server
PROD_PID=$!

# Wait for server to start
sleep 10

# MANDATORY: Use Playwright MCP for E2E testing
echo "=== PLAYWRIGHT MCP E2E TESTING ==="
# Use mcp__playwright__browser_navigate to navigate to app
# Use mcp__playwright__browser_take_screenshot for visual verification
# Use mcp__playwright__browser_click for user interactions
# Use mcp__playwright__browser_type for form inputs
# Use mcp__playwright__browser_snapshot for accessibility testing

# Critical user journey testing with Playwright MCP
cat > e2e-test-plan.md << 'EOF'
# Phase 3 End-to-End Testing Plan (PLAYWRIGHT MCP REQUIRED)

## Critical User Journey (TEST WITH PLAYWRIGHT MCP):
1. [ ] Landing page loads (/) - use mcp__playwright__browser_navigate
2. [ ] Sign up flow works (/auth) - use mcp__playwright__browser_click + mcp__playwright__browser_type
3. [ ] Login flow works (/auth) - test credentials: test@example.com / TestPassword123!
4. [ ] Dashboard accessible after login - verify with mcp__playwright__browser_snapshot
5. [ ] Classroom page loads (/classroom) - take screenshot with mcp__playwright__browser_take_screenshot
6. [ ] Voice session initialization - test database integration with Supabase MCP
7. [ ] Microphone permission handling - use mcp__playwright__browser_handle_dialog
8. [ ] AI teacher voice connection (verify protected core services work)
9. [ ] Real-time transcription display
10. [ ] Math equation rendering (KaTeX) - verify Class X math topics
11. [ ] Session termination - verify data saved to learning_sessions table
12. [ ] Data persistence verification - use mcp__supabase__query_table

## Technical Verification (PLAYWRIGHT MCP):
- [ ] No JavaScript errors in console - use mcp__playwright__browser_console_messages
- [ ] All API calls succeed - use mcp__playwright__browser_network_requests
- [ ] WebSocket connections stable (protected core)
- [ ] Memory usage reasonable (<100MB)
- [ ] Page load times <3 seconds
- [ ] Responsive design works - test multiple viewport sizes

## Database Integration (SUPABASE MCP):
- [ ] Can query curriculum_data for Class X Mathematics
- [ ] Learning sessions are properly recorded
- [ ] Voice sessions link to LiveKit rooms
- [ ] Transcripts are saved with proper RLS
EOF

# Step 5: Performance & Load Testing
echo "=== PERFORMANCE TESTING ==="
# Lighthouse audit
npx lighthouse http://localhost:3000 --output=json --output-path=lighthouse-report.json
# Check scores: Performance >90, Accessibility >90

# Bundle size analysis
npx next build --analyze
# Verify main bundle <500KB

# Memory leak detection
node --expose-gc scripts/memory-test.js  # If exists

# Kill production server
kill $PROD_PID

# Step 6: Security Testing
echo "=== SECURITY TESTING ==="
# Check for exposed secrets
grep -r "AIzaSy" src/ || echo "✓ No API keys in source"
grep -r "sk_" src/ || echo "✓ No secret keys in source"
grep -r "password" src/ || echo "✓ No hardcoded passwords"

# Dependency vulnerability scan
npm audit --audit-level=moderate

# Step 7: Cross-Platform Testing
echo "=== CROSS-PLATFORM TESTING ==="
# Test on different browsers (if possible)
# - Chrome/Chromium
# - Firefox
# - Safari (if on macOS)

# Test responsive design
# - Desktop (1920x1080)
# - Tablet (768x1024)
# - Mobile (375x667)
```

### COMPREHENSIVE TEST DOCUMENTATION:

```bash
# Create comprehensive test report
cat > phase-3-test-report.md << 'EOF'
# Phase 3 Deployment Testing Report

## Executive Summary
- Test Date: [Date]
- Test Duration: [Duration]
- Overall Status: [PASS/FAIL]
- Critical Issues: [Count]

## Test Results Summary

### Protected Core Integrity: [PASS/FAIL]
- No modifications to protected files: [ ]
- All contracts respected: [ ]
- Singleton patterns maintained: [ ]

### Regression Testing: [PASS/FAIL]
- All previous features work: [ ]
- No breaking changes: [ ]
- TypeScript: 0 errors: [ ]

### Integration Testing: [PASS/FAIL]
- Voice services connected: [ ]
- Transcription pipeline works: [ ]
- Math rendering functional: [ ]

### End-to-End Testing: [PASS/FAIL]
- Complete user journey works: [ ]
- No console errors: [ ]
- Data persistence verified: [ ]

### Performance Testing: [PASS/FAIL]
- Lighthouse score >90: [ ]
- Bundle size <500KB: [ ]
- Load time <3s: [ ]

### Security Testing: [PASS/FAIL]
- No exposed secrets: [ ]
- Dependencies secure: [ ]
- Authentication working: [ ]

## Detailed Test Execution

### Critical Path Results:
[Detailed results for each test step]

### Performance Metrics:
- Bundle size: [size]
- Lighthouse scores: [scores]
- Memory usage: [usage]

### Issues Found:
[List all issues with severity and resolution status]

## Production Readiness Assessment

### Ready for Deployment: [YES/NO]
### Blockers (if any):
[List any blocking issues]

### Recommendations:
[Any recommendations for deployment]
EOF

# Execute tests and fill in results
echo "Executing comprehensive test suite..."

# Record all test outputs
npm run typecheck 2>&1 | tee -a test-execution-log.txt
npm test 2>&1 | tee -a test-execution-log.txt
npm run build 2>&1 | tee -a test-execution-log.txt

# Update test report with actual results
# (Manual step - update the template with real results)

git add phase-3-test-report.md test-execution-log.txt e2e-test-plan.md
git commit -m "test: Complete Phase 3 comprehensive testing documentation"
```

### DEPLOYMENT READINESS CRITERIA:

Must achieve ALL of these before proceeding to Task 3.2:

```bash
# Checklist for deployment readiness
cat > deployment-readiness.md << 'EOF'
# Deployment Readiness Checklist

## CRITICAL (Must Pass):
- [ ] TypeScript: 0 errors
- [ ] All tests passing
- [ ] Production build succeeds
- [ ] No console errors in critical flows
- [ ] Voice session works end-to-end
- [ ] Math rendering functional
- [ ] Authentication working
- [ ] Protected core integrity maintained

## IMPORTANT (Should Pass):
- [ ] Performance scores >80
- [ ] Bundle size reasonable
- [ ] No security vulnerabilities
- [ ] Cross-browser compatibility
- [ ] Responsive design working

## NICE TO HAVE:
- [ ] Perfect accessibility scores
- [ ] Optimal performance scores
- [ ] Comprehensive test coverage
EOF

# Only proceed if ALL critical items pass
echo "Review deployment-readiness.md before proceeding to Task 3.2"
```

## Task 3.2: Vercel Deployment (1.5 hours)

### Environment Setup:

Reference: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-3-stabilization.md` lines 61-109

```bash
# Step 1: Install Vercel CLI
npm i -g vercel

# Step 2: Link project
vercel link

# Step 3: Set environment variables
vercel env add GOOGLE_API_KEY
vercel env add LIVEKIT_URL
vercel env add LIVEKIT_API_KEY
vercel env add LIVEKIT_API_SECRET
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Step 4: Deploy to preview first
vercel --prod=false

# Step 5: Test preview deployment
# Test all critical flows in preview environment
```

## Task 3.3: Basic Monitoring (1 hour)

### Simple Error Tracking:

Reference: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-3-stabilization.md` lines 111-165

```bash
# Step 1: Install Sentry
npm install @sentry/nextjs

# Step 2: Configure basic monitoring
# Create sentry.client.config.ts
# Create sentry.server.config.ts
# Create app/api/health/route.ts

# Step 3: Set up basic health checks
# Implement database connectivity check
# Implement LiveKit connectivity check
# Implement Gemini API connectivity check
```

## Task 3.4: Production Deployment (30 minutes)

### Final Launch:

Reference: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-3-stabilization.md` lines 167-216

```bash
# Step 1: Final verification
npm run typecheck  # Must be 0 errors
npm run build     # Must succeed
npm run lint      # Should pass

# Step 2: Deploy to production
vercel --prod

# Step 3: Post-deployment testing
# Test production URL
# Verify all features work
# Check monitoring is active

# Step 4: Document completion
git tag -a v1.0.0-mvp -m "First working MVP deployed"
git push origin --tags
```

## Success Criteria

Reference the exact criteria in: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/phase-3-stabilization.md` lines 218-233

### Must Complete:
- [ ] Critical tests pass
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Basic monitoring active
- [ ] Production URL working
- [ ] Voice flow functional

## 🚫 DO NOT CONFUSE WITH OTHER PROJECTS

This prompt is specifically for **PingLearn** - the real-time transcription project with:
- Google Gemini Live API for voice
- KaTeX for math rendering
- LiveKit for WebRTC
- Protected Core Architecture

**NOT** for:
- Virtual Tutor app (different project in pinglearn-app/docs/phases/)
- NCERT content processing
- Audio-to-audio classroom
- Educational content chunking

## File References

All file paths in this prompt reference the **PingLearn Architecture Pivot** documentation at:
- Plans: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/03-phases/`
- Architecture: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/02-architecture/`
- Reports: `/Users/[username]/Projects/pinglearn/docs/new-arch-impl-planning/`
- Code: `/Users/[username]/Projects/pinglearn/pinglearn-app/`

## Emergency Rollback

If deployment fails:
```bash
# Immediate rollback
git reset --hard HEAD~1

# Or disable features
echo '{}' > /Users/[username]/Projects/pinglearn/pinglearn-app/feature-flags.json
```

## Completion Checklist

- [ ] Read all referenced documentation
- [ ] Completed all 4 tasks in sequence
- [ ] All tests pass
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Git tags created

---

**Remember**: This is attempt #8 after 7 failures. The Protected Core Architecture is designed to prevent breaking changes. Focus on deploying what works, not perfect infrastructure.