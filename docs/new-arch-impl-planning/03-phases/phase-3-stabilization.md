# Phase 3: Essential Testing & Deployment
**Duration**: Half of Day 6 (4 hours)
**Branch**: `phase-3-deployment`
**Prerequisites**: Phase 2.5 cleanup completed

## Objective
Focus on ESSENTIAL testing, basic monitoring, and getting the app deployed to production. Skip perfectionism - focus on working deployment.

## Pre-Phase Checklist
- [ ] Phase 2.5 app cleanup completed
- [ ] Voice flow working with simplified display
- [ ] Tldraw removed completely
- [ ] Dependencies cleaned
- [ ] Production build succeeds

## Tasks (4 hours total)

### Task 3.1: Critical Path Testing Only
**Duration**: 1 hour
**Owner**: Human + AI
**Focus**: Test ONLY what could break in production

#### Subtasks:
1. **Essential smoke tests**
   ```bash
   # Test critical user flows only:
   - Can user sign up/login?
   - Can voice session start?
   - Does transcription appear?
   - Do math equations render?
   - Can session end gracefully?
   ```

2. **Critical error handling**
   ```typescript
   // tests/critical/error-recovery.test.ts
   - Gemini API down → Show error message
   - LiveKit disconnected → Attempt reconnect
   - No microphone → Clear error message
   ```

3. **Basic load test**
   ```bash
   # Just verify it doesn't crash with:
   - 5 concurrent users
   - 1 hour session duration
   - Normal usage patterns
   ```

4. **Git commit checkpoint**
   ```bash
   git commit -am "test: Add critical path tests"
   ```

### Task 3.2: Deployment Configuration
**Duration**: 1.5 hours
**Owner**: Human + AI
**Target**: Vercel + Supabase + LiveKit Cloud

#### Subtasks:
1. **Vercel deployment setup**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Configure project
   vercel link

   # Set environment variables
   vercel env add GOOGLE_API_KEY
   vercel env add LIVEKIT_URL
   vercel env add LIVEKIT_API_KEY
   vercel env add LIVEKIT_API_SECRET
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Supabase production setup**
   ```sql
   -- Ensure tables exist:
   - users
   - sessions
   - transcriptions

   -- Set up RLS policies
   -- Configure auth providers
   ```

3. **LiveKit Cloud configuration**
   ```yaml
   # Ensure LiveKit project configured:
   - API keys generated
   - Webhook endpoints set
   - Region selected (closest to users)
   ```

4. **Deploy to staging**
   ```bash
   # Deploy to preview
   vercel --prod=false

   # Test all features
   # Fix any issues
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "deploy: Configure Vercel deployment"
   ```

### Task 3.3: Basic Monitoring Setup
**Duration**: 1 hour
**Owner**: AI
**Focus**: Just know when things break

#### Subtasks:
1. **Error tracking with Sentry**
   ```typescript
   // Simple Sentry setup
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     beforeSend(event) {
       // Filter out non-critical errors
       return event;
     }
   });
   ```

2. **Basic health checks**
   ```typescript
   // app/api/health/route.ts
   export async function GET() {
     const checks = {
       database: await checkSupabase(),
       livekit: await checkLiveKit(),
       gemini: await checkGemini()
     };
     return Response.json({ status: 'ok', checks });
   }
   ```

3. **Simple analytics**
   ```typescript
   // Just track:
   - Daily active users
   - Sessions started
   - Errors encountered
   - Average session duration
   ```

4. **Uptime monitoring**
   ```bash
   # Use Vercel's built-in monitoring
   # Or set up UptimeRobot for free
   - Monitor /api/health
   - Alert on downtime
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Add basic monitoring"
   ```

### Task 3.4: Production Deployment
**Duration**: 30 minutes
**Owner**: Human
**FINAL STEP**: Deploy to production

#### Subtasks:
1. **Final checks**
   ```bash
   # Ensure:
   - All tests pass
   - No TypeScript errors
   - Build succeeds
   - Environment variables set
   ```

2. **Deploy to production**
   ```bash
   # Create production deployment
   vercel --prod

   # Verify deployment
   - Check production URL
   - Test critical flows
   - Monitor for errors
   ```

3. **Post-deployment verification**
   ```bash
   # Test in production:
   - Sign up flow
   - Voice session
   - Math rendering
   - Session cleanup
   ```

4. **Document deployment**
   ```markdown
   # Deployment Complete
   - Production URL: [url]
   - Deployment ID: [id]
   - Date: [date]
   - Version: [version]
   ```

5. **Git commit and tag**
   ```bash
   git commit -am "deploy: Production deployment complete"
   git tag -a v1.0.0-mvp -m "First working MVP"
   git push origin --tags
   ```

## Definition of Done

### Pre-UAT Requirements
- [ ] Critical tests pass
- [ ] Core user journey verified
- [ ] Voice flow functional
- [ ] Math rendering working
- [ ] Mobile responsive
- [ ] Cross-browser tested

### UAT Requirements (NEW - MANDATORY)
- [ ] Round 1: Core functionality approved by human
- [ ] Round 2: UI/UX polish approved by human
- [ ] Round 3: Edge cases handled to satisfaction
- [ ] Round 4: Final polish and approval
- [ ] All human-requested changes implemented
- [ ] Performance optimized based on feedback

### Deployment Requirements
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] Comprehensive monitoring active
- [ ] Production URL working
- [ ] Human verification of production deployment

## Success Metrics

### UAT Success Metrics
- **Human Approval**: 100% satisfaction with UI/UX
- **Functionality**: All features working as expected
- **Iterations**: As many as needed to achieve perfection
- **Bug Resolution**: 100% of identified issues fixed

### Technical Success Metrics
- **Deployment time**: < 1 hour (with verification)
- **Critical tests**: 100% pass
- **Production errors**: 0 on launch
- **Voice latency**: < 300ms (optimized during UAT)
- **TypeScript errors**: 0 (maintained)
- **Console errors**: 0 (verified during UAT)

## Next Steps After Launch

### Immediate Post-Launch (Day 1)
1. Human verification of production deployment
2. Monitor initial user interactions
3. Check error tracking for any issues
4. Verify all UAT improvements are live

### Week 1 Post-Launch
1. Monitor error rates
2. Gather user feedback
3. Fix critical bugs only
4. Document issues for future
5. Track usage patterns from UAT insights

### Future Enhancements (Not Now)
- Advanced testing suite
- Performance optimization
- Multi-region deployment
- Advanced monitoring
- A/B testing infrastructure

## Emergency Contacts
- Vercel Status: status.vercel.com
- Supabase Status: status.supabase.com
- LiveKit Support: [support email]
- Gemini API: [Google Cloud console]

---

**Remember**: With UAT integrated, we achieve the perfect balance - thorough testing and refinement BEFORE deployment, ensuring a polished product that meets human expectations while maintaining timeline discipline.