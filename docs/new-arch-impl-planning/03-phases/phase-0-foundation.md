# Phase 0: Foundation & Emergency Fixes
**Duration**: Day 1 (8 hours)
**Branch**: `phase-0-foundation`
**Priority**: CRITICAL - BLOCKING ALL OTHER WORK

## Objective
Establish the Protected Core architecture foundation and fix critical issues blocking development. This phase MUST be completed before any other work can proceed.

## Pre-Phase Checklist
- [ ] Current branch committed and pushed
- [ ] Working from clean main branch
- [ ] All environment variables verified
- [ ] Node modules fresh installed

## Tasks Breakdown

### Task 0.1: Create Protection Infrastructure
**Duration**: 30 minutes
**Owner**: Human + AI

#### Subtasks:
1. **Create protected-core directory structure**
   ```bash
   mkdir -p src/protected-core/{voice-engine,transcription,websocket,contracts}
   mkdir -p src/protected-core/voice-engine/{gemini,livekit,audio}
   mkdir -p src/protected-core/transcription/{text,math,display}
   mkdir -p src/protected-core/websocket/{manager,retry,health}
   ```

2. **Create .ai-protected file**
   ```
   src/protected-core/**
   CLAUDE.md
   .ai-protected
   feature-flags.json
   src/shared/types/core.types.ts
   ```

3. **Initialize CLAUDE.md at root**
   - Copy template from planning docs
   - Add project-specific rules
   - Set protected boundaries

4. **Git commit checkpoint**
   ```bash
   git add -A
   git commit -m "feat: Initialize Protected Core structure"
   ```

### Task 0.2: Fix TypeScript Errors
**Duration**: 1 hour
**Owner**: AI with human verification

#### Subtasks:
1. **Run TypeScript check**
   ```bash
   cd pinglearn-app && npm run typecheck
   ```

2. **Document all errors**
   - List files with errors
   - Categorize error types
   - Priority order for fixes

3. **Fix critical type errors**
   - No 'any' types allowed
   - All imports must resolve
   - All functions must have return types

4. **Verify fix**
   ```bash
   npm run typecheck # Must show 0 errors
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "fix: Resolve all TypeScript errors"
   ```

### Task 0.3: Install Critical Dependencies
**Duration**: 30 minutes
**Owner**: Human

#### Subtasks:
1. **Install math rendering**
   ```bash
   npm install katex @types/katex
   npm install react-katex
   ```

2. **Install Gemini SDK** (Research first)
   ```bash
   # Research current package name
   npm install @google/generative-ai
   ```

3. **Install monitoring tools**
   ```bash
   npm install @sentry/nextjs
   ```

4. **Update package.json scripts**
   ```json
   "test": "jest",
   "test:watch": "jest --watch",
   "test:coverage": "jest --coverage"
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "chore: Add critical dependencies"
   ```

### Task 0.4: Move Existing Code to Protected Core
**Duration**: 1.5 hours
**Owner**: Human + AI

#### Subtasks:
1. **Move LiveKit audio manager**
   - From: `src/lib/livekit/audio-manager.ts`
   - To: `src/protected-core/voice-engine/livekit/audio-manager.ts`
   - Update all imports

2. **Create WebSocket singleton wrapper**
   ```typescript
   // src/protected-core/websocket/manager/singleton.ts
   export class WebSocketManager {
     private static instance: WebSocketManager;
     private connection: WebSocket | null = null;

     private constructor() {}

     static getInstance(): WebSocketManager {
       if (!WebSocketManager.instance) {
         WebSocketManager.instance = new WebSocketManager();
       }
       return WebSocketManager.instance;
     }
   }
   ```

3. **Create core type definitions**
   ```typescript
   // src/protected-core/contracts/types.ts
   export interface CoreTypes {
     // Define all core types here
   }
   ```

4. **Update imports in existing code**
   - Find all imports of moved files
   - Update to use protected-core paths

5. **Git commit checkpoint**
   ```bash
   git commit -am "refactor: Move core services to protected directory"
   ```

### Task 0.5: Create Service Contracts
**Duration**: 1 hour
**Owner**: AI with human review

#### Subtasks:
1. **Define Voice Service Contract**
   - Create interface in contracts/voice.contract.ts
   - Define all public methods
   - Add JSDoc documentation

2. **Define Transcription Contract**
   - Create interface in contracts/transcription.contract.ts
   - Include math rendering methods
   - Add display buffer methods

3. **Define WebSocket Contract**
   - Create interface in contracts/websocket.contract.ts
   - Singleton guarantee methods
   - Health check methods

4. **Create contract index**
   ```typescript
   // src/protected-core/contracts/index.ts
   export * from './voice.contract';
   export * from './transcription.contract';
   export * from './websocket.contract';
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Define service contracts for Protected Core"
   ```

### Task 0.6: Implement Feature Flags System
**Duration**: 1 hour
**Owner**: AI

#### Subtasks:
1. **Create feature flags configuration**
   ```json
   // feature-flags.json
   {
     "enableGeminiLive": false,
     "enableMathTranscription": false,
     "enableNewDashboard": false,
     "enableAIGeneratedFeatures": false
   }
   ```

2. **Create feature flag service**
   ```typescript
   // src/shared/services/feature-flags.ts
   export class FeatureFlagService {
     static isEnabled(flag: string): boolean {
       // Implementation
     }
   }
   ```

3. **Add feature flag hooks**
   ```typescript
   // src/shared/hooks/useFeatureFlag.ts
   export function useFeatureFlag(flag: string): boolean {
     // Implementation
   }
   ```

4. **Create flag management UI** (Basic)
   - Simple toggle interface
   - Development only
   - Hot reload support

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Implement feature flags system"
   ```

### Task 0.7: Setup Basic Testing
**Duration**: 1 hour
**Owner**: Human + AI

#### Subtasks:
1. **Install Jest and React Testing Library**
   ```bash
   npm install -D jest @testing-library/react @testing-library/jest-dom
   npm install -D @types/jest jest-environment-jsdom
   ```

2. **Configure Jest**
   ```javascript
   // jest.config.js
   module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     // ... rest of config
   };
   ```

3. **Create critical tests for protected core**
   - WebSocket singleton test
   - Contract compliance tests
   - Type safety tests

4. **Run tests**
   ```bash
   npm test
   ```

5. **Git commit checkpoint**
   ```bash
   git commit -am "test: Add basic testing infrastructure"
   ```

### Task 0.8: Create Monitoring Infrastructure
**Duration**: 45 minutes
**Owner**: AI

#### Subtasks:
1. **Setup error boundary**
   ```typescript
   // src/app/error.tsx
   'use client';
   export default function Error({ error, reset }) {
     // Implementation
   }
   ```

2. **Create health check endpoint**
   ```typescript
   // src/app/api/health/route.ts
   export async function GET() {
     // Return health status
   }
   ```

3. **Add performance monitoring**
   - Core service latency tracking
   - WebSocket connection monitoring
   - Memory usage tracking

4. **Create alert system**
   - Console warnings for dev
   - Prepare for Sentry in production

5. **Git commit checkpoint**
   ```bash
   git commit -am "feat: Add monitoring infrastructure"
   ```

### Task 0.9: Documentation & Handoff
**Duration**: 45 minutes
**Owner**: Human

#### Subtasks:
1. **Update README**
   - New architecture explanation
   - Protected Core boundaries
   - Development guidelines

2. **Create ARCHITECTURE.md**
   - Detailed architecture docs
   - Contract specifications
   - Communication patterns

3. **Document breaking changes**
   - List all moved files
   - Import changes needed
   - Migration guide

4. **Create Phase 0 completion report**
   - What was completed
   - What issues remain
   - Ready for Phase 1 checklist

5. **Git commit checkpoint**
   ```bash
   git commit -am "docs: Complete Phase 0 documentation"
   ```

### Task 0.10: Merge to Main
**Duration**: 30 minutes
**Owner**: Human

#### Subtasks:
1. **Run all checks**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

2. **Create pull request**
   ```bash
   gh pr create --title "Phase 0: Foundation & Emergency Fixes" \
                --body "Implements Protected Core foundation"
   ```

3. **Merge after review**
   ```bash
   git checkout main
   git merge phase-0-foundation
   git push origin main
   ```

4. **Tag release**
   ```bash
   git tag -a v0.1.0-foundation -m "Phase 0: Foundation complete"
   git push origin v0.1.0-foundation
   ```

5. **Verify deployment** (if applicable)

## Definition of Done (DoD)

### Must Complete
- [x] Protected Core directory structure created
- [x] All TypeScript errors fixed (0 errors)
- [x] Critical dependencies installed
- [x] Existing code moved to protected directories
- [x] Service contracts defined
- [x] Feature flags system working
- [x] Basic tests passing
- [x] CLAUDE.md file created and populated
- [x] Monitoring infrastructure in place

### Should Complete
- [x] Performance baseline established
- [x] Error boundaries implemented
- [x] Health checks working
- [x] Documentation updated

### Could Complete (Bonus)
- [ ] Sentry integration configured
- [ ] Advanced monitoring dashboard
- [ ] Automated rollback system

## Success Criteria

### Technical Criteria
1. **TypeScript**: `npm run typecheck` shows 0 errors
2. **Tests**: All tests pass with >80% coverage of protected core
3. **Build**: `npm run build` completes successfully
4. **Contracts**: All services implement defined contracts
5. **Protection**: AI cannot modify protected-core files

### Functional Criteria
1. Existing features still work
2. Feature flags toggle features on/off
3. WebSocket maintains single connection
4. No console errors in development

### Performance Criteria
1. Page load time < 3 seconds
2. Build time < 30 seconds
3. Test suite runs < 60 seconds

## Risk Mitigation

### High Risk Items
1. **Moving files breaks imports**
   - Mitigation: Update all imports systematically
   - Verification: TypeScript will catch missing imports

2. **WebSocket singleton pattern fails**
   - Mitigation: Comprehensive testing
   - Fallback: Keep original implementation available

3. **Feature flags cause runtime errors**
   - Mitigation: Default all flags to false
   - Testing: Test both on and off states

## Post-Phase Checklist

- [ ] All tasks completed and marked in checklist
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Merged to main
- [ ] Team notified of changes
- [ ] Ready for Phase 1

## Notes for Next Phase

1. Phase 1 will implement Gemini Live integration
2. WebSocket singleton will be critical for Gemini connection
3. Feature flags will control Gemini features initially
4. Monitor for any regression from Phase 0 changes

---

**Phase 0 Completion Timestamp**: [To be filled]
**Total Time Taken**: [To be filled]
**Blockers Encountered**: [To be filled]
**Lessons Learned**: [To be filled]