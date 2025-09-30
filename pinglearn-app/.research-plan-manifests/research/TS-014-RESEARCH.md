# TS-014 Research Manifest: Recursive Type Definitions

**Story ID**: TS-014
**Priority**: P1
**Estimated Effort**: 4 hours
**Agent**: story_ts014_001
**Date**: 2025-09-30

---

## Phase 1: RESEARCH COMPLETE

### 1. Context7 Research: N/A
TypeScript recursive types are well-established patterns. No external package documentation needed.

### 2. Web Search Results (2025 Current)

#### Key Findings from Web Research:

**Best Practices (2025)**:
1. **Use Responsibly**: Recursive types are powerful but should be used sparingly
   - Can increase type-checking time significantly
   - With enough complexity, can cause compile-time errors
   - TypeScript has recursion depth limits

2. **TypeScript 3.7+ Syntax** (Current Standard):
   ```typescript
   type Json =
     | string
     | number
     | boolean
     | null
     | { [property: string]: Json }
     | Json[];
   ```
   This cleaner syntax is preferred over older interface-based approaches.

3. **Break Down Complex Types**:
   - Split complex recursive types into smaller, manageable parts
   - Use conditional types and utility types for flexibility
   - Avoid hitting recursion depth limits

4. **Common Use Cases**:
   - **JSON Types**: Infinitely recursive data format
   - **Deep Partial Types**: Make all properties optional at any depth
   - **Tree Structures**: Hierarchical data (filesystem, DOM, curriculum)
   - **Linked Lists**: Sequential data structures

5. **Implementation Patterns**:
   ```typescript
   // Generic Node class
   class Node<T> {
     data: T;
     children: Node<T>[];
   }

   // Recursive interface
   interface TreeNode<T> {
     value: T;
     children?: TreeNode<T>[];
   }
   ```

#### Tree Data Structures (Specific Findings):

1. **N-ary Trees**: Most common for hierarchical data
   - Each node can have multiple children
   - Perfect for curriculum structure (textbook → chapter → lesson → topic)

2. **Type Safety Benefits**:
   - Encode domain rules directly into type system
   - Replace verbose runtime checks
   - Make certain bugs impossible to write
   - Provide autocompletion and self-documentation

3. **Real-World Applications**:
   - DOM representation (React Virtual DOM)
   - Organizational structures
   - File systems
   - Database indexing (B-Trees, AVL trees)
   - **Educational content hierarchy** (our use case)

### 3. Codebase Analysis

#### Existing Hierarchical Structures:

**Database Schema** (`src/types/database.ts`):
- `book_series` → `books` → `book_chapters` (hierarchical structure exists)
- `textbooks` → `chapters` (flat structure for backward compatibility)
- `curriculum_data`: Contains topics array but not deeply hierarchical

**Current Recursive Types** (`src/types/advanced.ts` lines 578-618):
```typescript
export type NestedContent = {
  id: string;
  title: string;
  type: 'textbook' | 'chapter' | 'lesson' | 'topic' | 'question';
  content?: string;
  metadata?: Record<string, unknown>;
  children?: NestedContent[];  // ← Recursive
  parent?: NestedContent;      // ← Circular reference
};

export type FlattenContent<T extends NestedContent> = T & {
  path: string[];
  depth: number;
  hasChildren: boolean;
  childCount: number;
  ancestorIds: string[];
  descendantIds: string[];
};

export interface TreeOperations<T extends NestedContent> {
  flatten(root: T): FlattenContent<T>[];
  findById(root: T, id: string): T | null;
  findByPath(root: T, path: string[]): T | null;
  getAncestors(root: T, id: string): T[];
  getDescendants(root: T, id: string): T[];
  insertNode(root: T, parentId: string, newNode: T): T;
  removeNode(root: T, id: string): T;
  moveNode(root: T, nodeId: string, newParentId: string): T;
}
```

**Status**: These types exist but are in `advanced.ts` with other patterns. No implementations exist.

#### Existing Type Infrastructure:

From `src/lib/types/`:
- ✅ **TS-010**: Type guards (`type-guards.ts`) - Can be used for tree node validation
- ✅ **TS-011**: Branded types (`branded.ts`, `id-types.ts`) - Can be used for node IDs
- ✅ **TS-013**: Discriminated unions (`discriminated.ts`, `union-types.ts`) - Can be used for node types

### 4. Domain Requirements

**PingLearn Curriculum Hierarchy**:
```
Textbook (NCERT Mathematics Grade 10)
├── Chapter 1: Real Numbers
│   ├── Lesson 1.1: Introduction to Real Numbers
│   │   ├── Topic 1.1.1: Rational Numbers
│   │   ├── Topic 1.1.2: Irrational Numbers
│   │   └── Topic 1.1.3: Properties
│   ├── Lesson 1.2: Euclid's Division Lemma
│   └── Lesson 1.3: Fundamental Theorem of Arithmetic
├── Chapter 2: Polynomials
│   └── ...
└── Chapter 3: Linear Equations
    └── ...
```

**Depth Levels**:
1. Textbook (root)
2. Chapter
3. Lesson
4. Topic
5. Subtopic (optional)

**Maximum Depth**: 5 levels (to prevent infinite recursion)

### 5. Integration Points

**Will Integrate With**:
- ✅ Database types (`src/types/database.ts`) - Curriculum structure
- ✅ Type guards (`src/lib/types/type-guards.ts`) - Node validation
- ✅ Branded types (`src/lib/types/id-types.ts`) - Type-safe IDs
- ✅ Discriminated unions (`src/lib/types/discriminated.ts`) - Node type discrimination

**Will NOT Modify**:
- ❌ Protected core (`src/protected-core/*`)
- ❌ Existing database schema
- ❌ Existing type files (will create new dedicated files)

---

## Research Conclusions

### What We'll Build:

1. **Generic Recursive Types** (`src/lib/types/recursive.ts`):
   - `TreeNode<T>` - Generic tree node with type parameter
   - `Tree<T>` - Complete tree structure with root
   - Type-safe traversal utilities (map, filter, find, reduce)
   - Depth limiting (max 5 levels for curriculum)
   - Flattening and reconstruction utilities

2. **Domain Tree Types** (`src/lib/types/tree-types.ts`):
   - `CurriculumNode` - Discriminated union for curriculum hierarchy
   - `TextbookNode`, `ChapterNode`, `LessonNode`, `TopicNode`, `SubtopicNode`
   - Type-safe curriculum tree with proper branded IDs
   - Curriculum-specific traversal and query functions
   - Integration with existing database types

### Patterns to Follow:

1. **Unique Symbol Branding** (from TS-011):
   ```typescript
   const TREE_NODE_BRAND: unique symbol = Symbol('TreeNode');
   ```

2. **Discriminated Unions** (from TS-013):
   ```typescript
   type CurriculumNode =
     | TextbookNode
     | ChapterNode
     | LessonNode
     | TopicNode
     | SubtopicNode;
   ```

3. **Type Guards** (from TS-010):
   ```typescript
   export function isTreeNode<T>(value: unknown): value is TreeNode<T> { ... }
   ```

4. **Depth Limiting**:
   ```typescript
   const MAX_DEPTH = 5;
   type DepthCounter = [never, 0, 1, 2, 3, 4, 5];
   ```

### Files to Create:

1. `src/lib/types/recursive.ts` (~350 lines)
   - Generic recursive type patterns
   - Tree node and tree types
   - Traversal utilities
   - Depth limiting
   - Type guards

2. `src/lib/types/tree-types.ts` (~300 lines)
   - Domain-specific curriculum types
   - Curriculum node discriminated union
   - Type-safe curriculum operations
   - Integration with database types

3. `src/lib/types/recursive.test.ts` (~400 lines)
   - Generic pattern tests
   - Depth limiting tests
   - Traversal utility tests

4. `src/lib/types/tree-types.test.ts` (~400 lines)
   - Domain type tests
   - Curriculum hierarchy tests
   - Integration tests

### Risks and Mitigations:

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Recursion depth errors | Medium | High | Implement strict depth limiting (max 5) |
| Type-checking performance | Low | Medium | Use conditional types, avoid deep nesting |
| Circular reference issues | Medium | High | Avoid parent references, use ID references instead |
| Integration complexity | Low | Low | Build on existing TS-010, TS-011, TS-013 |

---

## [RESEARCH-COMPLETE-TS-014]

**Research Duration**: 45 minutes
**Findings**: Comprehensive understanding of recursive types, existing codebase patterns, and domain requirements
**Ready for Phase 2**: ✅ YES

**Next Step**: Create implementation plan (Phase 2)