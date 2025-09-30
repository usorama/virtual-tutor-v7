# TS-014 Implementation Plan: Recursive Type Definitions

**Story ID**: TS-014
**Priority**: P1
**Agent**: story_ts014_001
**Created**: 2025-09-30
**Status**: APPROVED

---

## Executive Summary

**Objective**: Implement robust recursive type definitions for hierarchical data structures, specifically curriculum tree navigation.

**Scope**:
- Generic recursive type patterns (TreeNode, Tree)
- Domain-specific curriculum hierarchy types
- Type-safe traversal and query utilities
- Depth limiting to prevent infinite recursion
- 100% test coverage with comprehensive test suites

**Build On**:
- TS-010: Type guards for tree node validation
- TS-011: Branded types for type-safe node IDs
- TS-013: Discriminated unions for node type discrimination

---

## Architecture Design

### 1. Generic Recursive Types Layer (`src/lib/types/recursive.ts`)

**Purpose**: Provide reusable, generic recursive type patterns.

**Type Hierarchy**:
```typescript
// Core generic types
TreeNode<T> {
  id: string
  data: T
  children: TreeNode<T>[]
  metadata: TreeNodeMetadata
}

Tree<T> {
  root: TreeNode<T>
  metadata: TreeMetadata
}

// Utility types
TreePath = string[]
TreeDepth = number
NodePredicate<T> = (node: TreeNode<T>) => boolean
NodeTransformer<T, U> = (node: TreeNode<T>) => U
```

**Key Features**:
- Depth limiting (max 5 levels for curriculum)
- Type-safe traversal (DFS, BFS)
- Functional utilities (map, filter, find, reduce)
- Flattening and reconstruction
- Path-based navigation

**Module Structure** (~350 lines):
```typescript
// 1. Core Types (50 lines)
- TreeNode<T>
- Tree<T>
- TreeNodeMetadata
- TreeMetadata

// 2. Depth Limiting (40 lines)
- MAX_DEPTH constant
- DepthCounter type
- DepthLimitedTree<T, D>

// 3. Utility Types (30 lines)
- FlatNode<T>
- TreePath
- NodePredicate<T>
- NodeTransformer<T, U>
- TraversalOrder

// 4. Type Guards (50 lines)
- isTreeNode<T>
- isTree<T>
- hasChildren<T>
- isLeafNode<T>

// 5. Traversal Functions (80 lines)
- traverseDFS<T>
- traverseBFS<T>
- mapTree<T, U>
- filterTree<T>
- findInTree<T>
- reduceTree<T, U>

// 6. Query Functions (50 lines)
- findById<T>
- findByPath<T>
- getAncestors<T>
- getDescendants<T>
- getSiblings<T>

// 7. Mutation Functions (50 lines)
- insertNode<T>
- removeNode<T>
- moveNode<T>
- updateNode<T>
```

### 2. Domain Tree Types Layer (`src/lib/types/tree-types.ts`)

**Purpose**: Curriculum-specific recursive types building on generic layer.

**Curriculum Hierarchy**:
```typescript
type CurriculumNode =
  | TextbookNode
  | ChapterNode
  | LessonNode
  | TopicNode
  | SubtopicNode;

interface TextbookNode {
  type: 'textbook';
  id: TextbookId;
  data: TextbookData;
  children: ChapterNode[];
}

interface ChapterNode {
  type: 'chapter';
  id: ChapterId;
  data: ChapterData;
  children: LessonNode[];
}

// ... similar for LessonNode, TopicNode, SubtopicNode
```

**Key Features**:
- Discriminated union for type safety
- Branded IDs from TS-011
- Type-safe children (Chapter only has Lessons, etc.)
- Integration with database types
- Curriculum-specific queries

**Module Structure** (~300 lines):
```typescript
// 1. Node Type Definitions (100 lines)
- CurriculumNodeType enum
- TextbookData, ChapterData, etc.
- TextbookNode, ChapterNode, LessonNode, TopicNode, SubtopicNode
- CurriculumNode discriminated union
- CurriculumTree type

// 2. Type Guards (50 lines)
- isTextbookNode
- isChapterNode
- isLessonNode
- isTopicNode
- isSubtopicNode
- isCurriculumNode

// 3. Factory Functions (50 lines)
- createTextbookNode
- createChapterNode
- createLessonNode
- createTopicNode
- createSubtopicNode

// 4. Curriculum-Specific Queries (50 lines)
- findChapterByNumber
- findLessonsByTopic
- getChapterProgress
- getTopicsInLesson
- getCurriculumPath

// 5. Database Integration (50 lines)
- curriculumNodeFromDatabase
- curriculumTreeFromDatabase
- syncCurriculumToDatabase
```

---

## Implementation Roadmap

### Step 1: Generic Recursive Types Foundation (60 min)

**File**: `src/lib/types/recursive.ts`

**Substeps**:
1. Define core types (TreeNode, Tree) with type parameters
2. Implement depth limiting with type-level recursion counter
3. Create utility types (FlatNode, TreePath, predicates)
4. Write comprehensive JSDoc comments

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 1 - Generic recursive type foundations`

---

### Step 2: Type Guards for Tree Structures (30 min)

**File**: `src/lib/types/recursive.ts` (continued)

**Substeps**:
1. Implement `isTreeNode<T>` with proper type narrowing
2. Implement `isTree<T>` for complete tree validation
3. Add helper guards: `hasChildren`, `isLeafNode`
4. Add depth validation guards

**Integration**: Uses TS-010 type guard patterns

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 2 - Tree type guards`

---

### Step 3: Tree Traversal Utilities (45 min)

**File**: `src/lib/types/recursive.ts` (continued)

**Substeps**:
1. Implement DFS traversal (pre-order, in-order, post-order)
2. Implement BFS traversal
3. Create functional utilities (map, filter, find, reduce)
4. Add depth-limiting to all traversal functions

**Edge Cases**:
- Empty trees
- Single-node trees
- Maximum depth trees
- Circular reference prevention

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 3 - Tree traversal utilities`

---

### Step 4: Tree Query and Mutation Functions (30 min)

**File**: `src/lib/types/recursive.ts` (completed)

**Substeps**:
1. Implement query functions (findById, findByPath, etc.)
2. Implement mutation functions (insert, remove, move, update)
3. Ensure immutability (return new trees, don't mutate)
4. Add JSDoc with usage examples

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 4 - Tree query and mutation functions`

---

### Step 5: Domain Curriculum Types (45 min)

**File**: `src/lib/types/tree-types.ts`

**Substeps**:
1. Define curriculum node discriminated union
2. Create node type definitions (TextbookNode, ChapterNode, etc.)
3. Add branded IDs from TS-011
4. Integrate with database types from `src/types/database.ts`

**Integration Points**:
- Import branded IDs: `TextbookId`, `ChapterId`, `LessonId`, `TopicId`
- Import database types: `Textbook`, `BookChapter`, `CurriculumData`
- Use discriminated union pattern from TS-013

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 5 - Domain curriculum types`

---

### Step 6: Curriculum Type Guards and Factories (30 min)

**File**: `src/lib/types/tree-types.ts` (continued)

**Substeps**:
1. Implement type guards for each node type
2. Create validated factory functions
3. Add JSDoc with examples
4. Ensure proper type narrowing

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 6 - Curriculum type guards and factories`

---

### Step 7: Curriculum-Specific Operations (30 min)

**File**: `src/lib/types/tree-types.ts` (completed)

**Substeps**:
1. Implement curriculum queries (findChapterByNumber, etc.)
2. Add progress tracking utilities
3. Create path generation functions
4. Add JSDoc with domain-specific examples

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 7 - Curriculum operations`

---

### Step 8: Update Index and Exports (15 min)

**File**: `src/lib/types/index.ts`

**Substeps**:
1. Add exports for recursive types
2. Add exports for tree types
3. Organize exports by category
4. Add JSDoc for module

**Verification**:
```bash
npm run typecheck  # Must show 0 errors
```

**Git Checkpoint**: `checkpoint: TS-014 Step 8 - Update exports`

---

## Testing Strategy

### Test Suite 1: Generic Recursive Types (`src/lib/types/recursive.test.ts`)

**Coverage Target**: >80%

**Test Categories**:

1. **Core Type Construction** (50 lines)
   - Create valid tree nodes
   - Create complete trees
   - Handle empty trees
   - Handle single-node trees

2. **Type Guards** (60 lines)
   - Validate tree nodes
   - Validate complete trees
   - Detect leaf nodes
   - Validate depth limits

3. **Traversal Functions** (100 lines)
   - DFS traversal (all orders)
   - BFS traversal
   - Map tree transformations
   - Filter tree nodes
   - Find specific nodes
   - Reduce tree to value

4. **Query Functions** (80 lines)
   - Find by ID
   - Find by path
   - Get ancestors
   - Get descendants
   - Get siblings

5. **Mutation Functions** (80 lines)
   - Insert nodes
   - Remove nodes
   - Move nodes
   - Update nodes
   - Maintain immutability

6. **Edge Cases** (30 lines)
   - Maximum depth prevention
   - Empty tree operations
   - Invalid inputs
   - Circular reference prevention

**Total**: ~400 lines

---

### Test Suite 2: Domain Tree Types (`src/lib/types/tree-types.test.ts`)

**Coverage Target**: >80%

**Test Categories**:

1. **Node Type Creation** (80 lines)
   - Create each node type
   - Validate branded IDs
   - Validate data structures
   - Test factory functions

2. **Type Guards** (60 lines)
   - Discriminate node types
   - Type narrowing validation
   - Invalid node detection

3. **Curriculum Hierarchy** (100 lines)
   - Build complete curriculum tree
   - Validate parent-child relationships
   - Test depth constraints
   - Test type safety at each level

4. **Curriculum Queries** (80 lines)
   - Find chapters by number
   - Find lessons by topic
   - Get curriculum paths
   - Get progress information

5. **Database Integration** (80 lines)
   - Convert database types to nodes
   - Build trees from database
   - Sync trees to database
   - Handle missing data

**Total**: ~400 lines

---

## Verification Checklist

### Phase 4: VERIFY (After each step)

- [ ] TypeScript compilation: `npm run typecheck` → 0 errors
- [ ] ESLint: `npm run lint` → Pass
- [ ] No modifications to protected-core
- [ ] No use of `any` type
- [ ] All types properly exported

### Phase 5: TEST (After implementation)

- [ ] All tests pass: `npm test recursive.test.ts` → 100%
- [ ] All tests pass: `npm test tree-types.test.ts` → 100%
- [ ] Coverage >80%: Check coverage report
- [ ] No skipped tests
- [ ] Edge cases covered

### Phase 6: CONFIRM (Final)

- [ ] Evidence document created
- [ ] FILE-REGISTRY.json updated
- [ ] AGENT-COORDINATION.json updated
- [ ] All git checkpoints created
- [ ] Documentation complete

---

## Integration Plan

### With Existing Code:

1. **Type Guards (TS-010)**:
   ```typescript
   import { createTypeGuard } from '@/lib/types/type-guards';
   // Use pattern for tree node guards
   ```

2. **Branded Types (TS-011)**:
   ```typescript
   import { TextbookId, ChapterId, LessonId } from '@/lib/types';
   // Use for type-safe node IDs
   ```

3. **Discriminated Unions (TS-013)**:
   ```typescript
   type CurriculumNode = TextbookNode | ChapterNode | ...
   // Pattern from TS-013
   ```

4. **Database Types**:
   ```typescript
   import { Textbook, BookChapter } from '@/types/database';
   // Integrate with curriculum nodes
   ```

### No Modifications To:

- ❌ `src/protected-core/*` (protected)
- ❌ `src/types/database.ts` (stable)
- ❌ `src/types/advanced.ts` (will add deprecation notes only)

---

## Risk Mitigation

### Risk 1: Recursion Depth Errors
**Mitigation**:
- Strict MAX_DEPTH = 5 constant
- Type-level depth counter
- Runtime depth validation in all functions
- Early termination in traversal

### Risk 2: Type-Checking Performance
**Mitigation**:
- Use conditional types sparingly
- Avoid deep generic nesting
- Keep type constraints simple
- Test with real curriculum data

### Risk 3: Circular Reference Issues
**Mitigation**:
- Never include parent references in nodes
- Use ID references for parent lookup
- Document one-way relationship
- Add circular reference detection in dev mode

### Risk 4: Integration Complexity
**Mitigation**:
- Build on existing TS-010, TS-011, TS-013
- Follow established patterns
- Comprehensive integration tests
- Clear migration path from `advanced.ts`

---

## Success Criteria

✅ **Implementation Complete When**:
1. All 8 implementation steps completed with git checkpoints
2. `npm run typecheck` shows 0 errors
3. `npm run lint` passes
4. All tests pass (100%)
5. Test coverage >80%
6. No `any` types used
7. No protected-core modifications
8. All exports in index.ts
9. Evidence document created
10. FILE-REGISTRY.json and AGENT-COORDINATION.json updated

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Research (Phase 1) | 45 min | 45 min |
| Planning (Phase 2) | 30 min | 1h 15m |
| **Implementation (Phase 3)** | **2h 30m** | **3h 45m** |
| - Step 1: Generic foundations | 60 min | - |
| - Step 2: Type guards | 30 min | - |
| - Step 3: Traversal | 45 min | - |
| - Step 4: Query/mutation | 30 min | - |
| - Step 5: Domain types | 45 min | - |
| - Step 6: Curriculum guards | 30 min | - |
| - Step 7: Curriculum ops | 30 min | - |
| - Step 8: Exports | 15 min | - |
| **Testing (Phase 5)** | **1h** | **4h 45m** |
| - recursive.test.ts | 30 min | - |
| - tree-types.test.ts | 30 min | - |
| **Verification & Confirmation** | **15 min** | **5h** |

**Total**: ~5 hours (within 4-hour estimate with buffer)

---

## [PLAN-APPROVED-TS-014]

**Plan Status**: ✅ APPROVED
**Ready for Implementation**: ✅ YES
**Next Step**: Phase 3 - Implementation (Step 1)

**Auto-Approval Justification**:
- Builds on proven TS-010, TS-011, TS-013 patterns
- No protected-core modifications
- Clear success criteria
- Comprehensive testing strategy
- Risk mitigations in place