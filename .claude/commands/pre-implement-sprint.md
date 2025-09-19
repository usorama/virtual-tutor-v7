# Pre-Implement Sprint: $ARGUMENTS

## 🎯 Objective
Generate complete pre-implementation artifacts for Sprint $ARGUMENTS to prevent TypeScript errors and ensure smooth implementation.

## 📋 Execution Workflow

### Phase 1: Analysis (What's Needed)
1. Read sprint kickoff document: `.claude/automation/prompts/sprint-$ARGUMENTS-kickoff.md`
2. Identify all features to be implemented
3. List required entities, services, components, and APIs
4. Check existing codebase for related types

### Phase 2: Contract Generation (Define Everything)
1. **Create Sprint Contracts with Context Carryover**
   - File: `.claude/automation/prompts/contracts/sprint-$ARGUMENTS-contracts.ts`
   - Include: Domain types, API contracts, Component props, Service interfaces
   - **CRITICAL: Import from ALL previous sprint contracts**:
     ```typescript
     // Sprint 5 example - imports from all previous sprints
     import { Sprint1Contracts } from './sprint-1-contracts';
     import { Sprint2Contracts } from './sprint-2-contracts';
     import { Sprint3Contracts } from './sprint-3-contracts';
     import { Sprint4Contracts } from './sprint-4-contracts';
     ```
   - Import from existing manifests to avoid duplication
   - Re-export types that future sprints will need
   - Must compile with 0 TypeScript errors

2. **Update Type Manifests**
   - Location: `docs/manifests/virtual-tutor/`
   - Add new domain entities to `domain-types/entities.d.ts`
   - Add API contracts to `api-contracts/`
   - Add component props to `client-types/components.d.ts`
   - Add service interfaces to `server-types/services.d.ts`

### Phase 3: Registry Creation (Map Everything)
1. **Function Registry**
   - Update: `docs/manifests/virtual-tutor/function-registry.d.ts`
   - Map every new function to its exact file path
   - Include complete function signatures

2. **File Purpose Map**
   - Update: `docs/manifests/virtual-tutor/file-purpose-map.json`
   - Document purpose, exports, dependencies for new files
   - Include performance targets and error codes

3. **AI Search Index**
   - Update: `docs/manifests/virtual-tutor/ai-search-index.json`
   - Add search entries for new tasks (byTask)
   - Add concept mappings (byConcept)
   - Add error mappings (byError)
   - Add integration points (byIntegrationPoint)

4. **Integration Registry**
   - Update: `docs/manifests/virtual-tutor/integration-registry.json`
   - Map data flow between systems
   - Document critical integrations (e.g., LiveKit→Gemini audio bridge)
   - Include monitoring points

### Phase 4: Additional Artifacts
Create if not exists:
- Error catalog with solutions
- Performance contracts with targets
- Dependency graph
- Migration guides
- Test contracts
- Validation schemas (Zod)

### Phase 5: Validation (Everything Works)
1. **Dependency Chain Validation**
   ```bash
   # First verify ALL previous sprint contracts compile
   for i in $(seq 1 $((ARGUMENTS-1))); do
     npx tsc --noEmit --skipLibCheck .claude/automation/prompts/contracts/sprint-$i-contracts.ts
   done
   ```
   ALL previous sprints MUST show: 0 errors

2. **Current Sprint Contract Compilation**
   ```bash
   # Verify current sprint contracts compile with dependencies
   npx tsc --noEmit --skipLibCheck .claude/automation/prompts/contracts/sprint-$ARGUMENTS-contracts.ts
   ```
   MUST show: 0 errors

3. **Cross-Reference Check**
   - All types in contracts exist in manifests
   - All functions in registry have valid paths
   - All integrations have both endpoints defined

4. **Search Index Validation**
   - Every major task has search entry
   - All errors have solutions
   - Integration points are bidirectional

### Phase 6: Documentation Integration
1. **Update Sprint Kickoff**
   - Add section: "## Pre-Implementation Contracts"
   - Reference contract file location
   - List key types and their purposes

2. **Update MANIFEST-INDEX.md**
   - Add navigation for new types
   - Update statistics (type count, etc.)

3. **Create Implementation Guide**
   - File: `.claude/contexts/SPRINT_$ARGUMENTS_IMPLEMENTATION.md`
   - How to import and use contracts
   - Critical integration points
   - Common patterns to follow

### Phase 7: Commit & Report
1. **Git Commit**
   ```bash
   git add -A
   git commit -m "📋 Pre-implementation contracts for Sprint $ARGUMENTS

   - Created complete type contracts (X types)
   - Updated manifests with new definitions
   - Generated function registry mappings
   - Created AI search indices
   - Validated 0 TypeScript errors
   - Ready for implementation"
   ```

2. **Generate Summary Report**
   ```markdown
   ## Sprint $ARGUMENTS Pre-Implementation Complete ✅
   
   ### Artifacts Created:
   - Contract file: sprint-$ARGUMENTS-contracts.ts
   - Types defined: [count]
   - Functions mapped: [count]
   - Files documented: [count]
   - Integrations mapped: [count]
   
   ### Validation Status:
   - TypeScript: 0 errors ✅
   - Imports resolved: ✅
   - Search index updated: ✅
   
   ### Ready to Implement:
   - [ ] Voice Classroom features
   - [ ] LiveKit integration
   - [ ] Gemini Live connection
   - [ ] Whiteboard synchronization
   ```

## 🚨 Critical Requirements
1. **NEVER** create duplicate types - check manifests first
2. **ALWAYS** validate contracts compile before proceeding
3. **ENSURE** 16kHz PCM audio format for Gemini compatibility
4. **MAINTAIN** clean architecture boundaries
5. **INCLUDE** error handling for all services

## 🎯 Success Criteria
- Zero TypeScript errors in contracts
- All types defined before implementation
- Functions mapped to file locations
- Search index helps AI agents find everything
- Integration points clearly documented
- Sprint kickoff updated with contract references
- **Previous sprint dependencies properly imported**
- **Contract dependency chain validated**

## 📊 Expected Outcome
After running this command, Sprint $ARGUMENTS implementation should proceed with:
- 0 TypeScript errors (vs 100+ without pre-planning)
- Clear implementation path
- All types importable from contracts
- AI agents can find any needed artifact
- No confusion about integrations

Remember: This command PREVENTS the cascade of errors experienced with the Practice Module by defining EVERYTHING upfront.