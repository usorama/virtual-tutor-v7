# Phase 2.5: App Cleanup & Deployment Prep
**Duration**: Half of Day 6 (4 hours)
**Branch**: `phase-2.5-app-cleanup`
**Prerequisites**: Phase 2 completed with simplified display

## Objective
Remove all legacy code from 7 failed attempts, clean dependencies, simplify the application structure, and prepare for deployment.

## Critical Context
After Phase 2, we have a working voice flow with simplified display. Now we need to remove ALL the dead weight that prevents clean deployment.

## Tasks (4 hours total)

### Task 2.5.1: Deep Clean Codebase
**Duration**: 1.5 hours
**Owner**: AI
**CRITICAL**: Must identify and remove ALL unused code

#### Subtasks:
1. **Remove dead features from failed attempts**
   ```bash
   # Identify and delete:
   - Unused collaborative features
   - Old authentication attempts
   - Abandoned quiz systems
   - Previous voice implementations
   - Deprecated API endpoints
   ```

2. **Clean up unused components**
   ```bash
   # Audit and remove:
   - src/components/legacy/
   - src/features/abandoned/
   - Unused UI components
   - Old state management code
   ```

3. **Remove unused routes and pages**
   ```typescript
   // Keep only:
   - / (landing)
   - /auth (login/signup)
   - /classroom (main app)
   - /settings (basic settings)
   // Remove everything else
   ```

4. **Git commit checkpoint**
   ```bash
   git commit -am "cleanup: Remove dead code from previous attempts"
   ```

### Task 2.5.2: Dependencies Audit & Cleanup
**Duration**: 1 hour
**Owner**: Human + AI

#### Subtasks:
1. **Audit package.json**
   ```bash
   # Run dependency check
   npx depcheck

   # Remove unused packages
   npm uninstall [unused-packages]

   # Update remaining packages
   npm update
   ```

2. **Clean node_modules**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Remove unused type definitions**
   ```bash
   # Clean @types packages
   # Remove unused type files
   # Consolidate type definitions
   ```

4. **Git commit checkpoint**
   ```bash
   git commit -am "cleanup: Audit and clean dependencies"
   ```

### Task 2.5.3: Simplify Application Structure
**Duration**: 1 hour
**Owner**: AI

#### Subtasks:
1. **Flatten directory structure**
   ```
   src/
   ├── app/              # Next.js app router (keep minimal)
   ├── components/       # Only active components
   │   └── transcription/  # Core display components
   ├── protected-core/   # DO NOT TOUCH
   ├── hooks/           # Only essential hooks
   ├── lib/            # Utilities (keep minimal)
   └── styles/         # Global styles
   ```

2. **Consolidate configuration**
   ```typescript
   // Single config file:
   // src/config/app.config.ts
   export const config = {
     api: { /* API settings */ },
     voice: { /* Voice settings */ },
     ui: { /* UI settings */ }
   };
   ```

3. **Simplify state management**
   ```typescript
   // Remove Redux/Zustand if overengineered
   // Use React Context for simple state
   // Keep only:
   - AuthContext
   - VoiceContext
   - TranscriptionContext
   ```

4. **Git commit checkpoint**
   ```bash
   git commit -am "refactor: Simplify application structure"
   ```

### Task 2.5.4: Production Build Verification
**Duration**: 30 minutes
**Owner**: Human

#### Subtasks:
1. **Environment configuration**
   ```bash
   # Create .env.production
   NEXT_PUBLIC_APP_URL=
   GOOGLE_API_KEY=
   LIVEKIT_API_KEY=
   LIVEKIT_API_SECRET=
   LIVEKIT_URL=
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   ```

2. **Build and test**
   ```bash
   # Production build
   npm run build

   # Check bundle size
   npx next build --analyze

   # Start production server
   npm run start
   ```

3. **Performance check**
   - Lighthouse score > 90
   - Bundle size < 500KB
   - First paint < 2s
   - No console errors

4. **Git commit checkpoint**
   ```bash
   git commit -am "chore: Production build verification"
   ```

## Definition of Done

### Must Complete
- [ ] All dead code removed
- [ ] Dependencies cleaned
- [ ] Structure simplified
- [ ] Production build working
- [ ] Bundle size optimized
- [ ] No console errors

### Success Metrics
- **Code reduction**: > 40% fewer files
- **Dependencies**: < 50 packages (from 100+)
- **Bundle size**: < 500KB
- **Build time**: < 30 seconds

## Deliverables
1. Clean, minimal codebase
2. Optimized dependencies
3. Production-ready build
4. Deployment checklist

---

**Next**: Phase 3 - Essential Testing & Deployment