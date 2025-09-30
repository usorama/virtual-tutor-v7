/**
 * Generic Recursive Type Definitions
 *
 * This module provides generic recursive type patterns for tree data structures,
 * including type-safe traversal, query, and mutation operations with depth limiting.
 *
 * Key Features:
 * - Generic TreeNode<T> and Tree<T> types
 * - Depth limiting (max 5 levels) to prevent infinite recursion
 * - Type-safe traversal (DFS, BFS)
 * - Functional utilities (map, filter, find, reduce)
 * - Immutable operations (all mutations return new trees)
 *
 * Builds on:
 * - TS-010: Type guard patterns
 * - TS-011: Branded type patterns
 * - TS-013: Discriminated union patterns
 *
 * @module recursive
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum tree depth to prevent infinite recursion
 * Curriculum structure: Textbook → Chapter → Lesson → Topic → Subtopic (5 levels)
 */
export const MAX_DEPTH = 5;

/**
 * Depth counter for type-level recursion limiting
 */
export type DepthCounter = [never, 0, 1, 2, 3, 4, 5];

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Metadata for tree nodes
 */
export interface TreeNodeMetadata {
  readonly depth: number;
  readonly index: number;
  readonly hasChildren: boolean;
  readonly childCount: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly [key: string]: unknown;
}

/**
 * Generic tree node with recursive children structure
 *
 * @typeParam T - The data type stored in the node
 *
 * @example
 * ```typescript
 * interface FileData {
 *   name: string;
 *   type: 'file' | 'folder';
 * }
 *
 * const folder: TreeNode<FileData> = {
 *   id: 'root',
 *   data: { name: 'src', type: 'folder' },
 *   children: [
 *     {
 *       id: 'file1',
 *       data: { name: 'index.ts', type: 'file' },
 *       children: [],
 *       metadata: { depth: 1, index: 0, hasChildren: false, childCount: 0 }
 *     }
 *   ],
 *   metadata: { depth: 0, index: 0, hasChildren: true, childCount: 1 }
 * };
 * ```
 */
export interface TreeNode<T> {
  readonly id: string;
  readonly data: T;
  readonly children: readonly TreeNode<T>[];
  readonly metadata: TreeNodeMetadata;
}

/**
 * Metadata for complete tree structure
 */
export interface TreeMetadata {
  readonly totalNodes: number;
  readonly maxDepth: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: string;
  readonly [key: string]: unknown;
}

/**
 * Complete tree structure with root node and metadata
 *
 * @typeParam T - The data type stored in tree nodes
 *
 * @example
 * ```typescript
 * const fileTree: Tree<FileData> = {
 *   root: folderNode,
 *   metadata: {
 *     totalNodes: 10,
 *     maxDepth: 3,
 *     createdAt: '2025-09-30T10:00:00Z',
 *     updatedAt: '2025-09-30T10:00:00Z',
 *     version: '1.0.0'
 *   }
 * };
 * ```
 */
export interface Tree<T> {
  readonly root: TreeNode<T>;
  readonly metadata: TreeMetadata;
}

/**
 * Depth-limited tree type that enforces maximum depth at type level
 *
 * @typeParam T - The data type stored in tree nodes
 * @typeParam D - The current depth level
 */
export type DepthLimitedTree<T, D extends number = 0> = D extends typeof MAX_DEPTH
  ? never
  : TreeNode<T>;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Flattened tree node with path and depth information
 *
 * @typeParam T - The data type stored in the node
 */
export interface FlatNode<T> {
  readonly id: string;
  readonly data: T;
  readonly path: readonly string[];
  readonly depth: number;
  readonly parentId: string | null;
  readonly hasChildren: boolean;
  readonly childCount: number;
}

/**
 * Tree path as array of node IDs from root to target
 */
export type TreePath = readonly string[];

/**
 * Predicate function for filtering tree nodes
 *
 * @typeParam T - The data type stored in tree nodes
 */
export type NodePredicate<T> = (node: TreeNode<T>, path: TreePath) => boolean;

/**
 * Transformer function for mapping tree nodes
 *
 * @typeParam T - The input data type
 * @typeParam U - The output data type
 */
export type NodeTransformer<T, U> = (node: TreeNode<T>, path: TreePath) => U;

/**
 * Reducer function for tree reduction
 *
 * @typeParam T - The data type stored in tree nodes
 * @typeParam U - The accumulator type
 */
export type NodeReducer<T, U> = (accumulator: U, node: TreeNode<T>, path: TreePath) => U;

/**
 * Traversal order for tree operations
 */
export type TraversalOrder = 'pre-order' | 'post-order' | 'breadth-first';

/**
 * Visit function called during traversal
 *
 * @typeParam T - The data type stored in tree nodes
 */
export type VisitFunction<T> = (node: TreeNode<T>, path: TreePath, depth: number) => void;

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a valid TreeNode
 *
 * @typeParam T - The expected data type
 * @param value - The value to check
 * @returns True if value is a TreeNode<T>
 *
 * @example
 * ```typescript
 * if (isTreeNode<FileData>(maybeNode)) {
 *   console.log(maybeNode.data.name); // Type-safe access
 * }
 * ```
 */
export function isTreeNode<T>(value: unknown): value is TreeNode<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const node = value as Record<string, unknown>;

  return (
    'id' in node &&
    typeof node.id === 'string' &&
    'data' in node &&
    node.data !== null &&
    'children' in node &&
    Array.isArray(node.children) &&
    'metadata' in node &&
    typeof node.metadata === 'object' &&
    node.metadata !== null &&
    'depth' in (node.metadata as Record<string, unknown>) &&
    typeof (node.metadata as Record<string, unknown>).depth === 'number'
  );
}

/**
 * Type guard to check if a value is a valid Tree
 *
 * @typeParam T - The expected data type
 * @param value - The value to check
 * @returns True if value is a Tree<T>
 *
 * @example
 * ```typescript
 * if (isTree<FileData>(maybeTree)) {
 *   console.log(maybeTree.root.data.name); // Type-safe access
 * }
 * ```
 */
export function isTree<T>(value: unknown): value is Tree<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const tree = value as Record<string, unknown>;

  return (
    'root' in tree &&
    isTreeNode<T>(tree.root) &&
    'metadata' in tree &&
    typeof tree.metadata === 'object' &&
    tree.metadata !== null
  );
}

/**
 * Type guard to check if a node has children
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The node to check
 * @returns True if node has children
 *
 * @example
 * ```typescript
 * if (hasChildren(node)) {
 *   node.children.forEach(child => console.log(child.id));
 * }
 * ```
 */
export function hasChildren<T>(node: TreeNode<T>): node is TreeNode<T> & { children: readonly [TreeNode<T>, ...TreeNode<T>[]] } {
  return node.children.length > 0;
}

/**
 * Type guard to check if a node is a leaf (no children)
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The node to check
 * @returns True if node is a leaf
 *
 * @example
 * ```typescript
 * if (isLeafNode(node)) {
 *   console.log('Leaf:', node.data);
 * }
 * ```
 */
export function isLeafNode<T>(node: TreeNode<T>): boolean {
  return node.children.length === 0;
}

/**
 * Validates that a node's depth does not exceed maximum
 *
 * @param depth - The depth to validate
 * @returns True if depth is within limits
 */
export function isValidDepth(depth: number): boolean {
  return depth >= 0 && depth <= MAX_DEPTH;
}

/**
 * Type guard to check if a node is within depth limits
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The node to check
 * @returns True if node depth is valid
 */
export function hasValidDepth<T>(node: TreeNode<T>): boolean {
  return isValidDepth(node.metadata.depth);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates tree node metadata
 *
 * @param depth - The depth level
 * @param index - The index among siblings
 * @param childCount - The number of children
 * @param additional - Additional metadata fields
 * @returns TreeNodeMetadata object
 */
export function createNodeMetadata(
  depth: number,
  index: number,
  childCount: number,
  additional?: Record<string, unknown>
): TreeNodeMetadata {
  return {
    depth,
    index,
    hasChildren: childCount > 0,
    childCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additional,
  };
}

/**
 * Creates tree metadata
 *
 * @param totalNodes - Total number of nodes
 * @param maxDepth - Maximum depth in tree
 * @param additional - Additional metadata fields
 * @returns TreeMetadata object
 */
export function createTreeMetadata(
  totalNodes: number,
  maxDepth: number,
  additional?: Record<string, unknown>
): TreeMetadata {
  const now = new Date().toISOString();
  return {
    totalNodes,
    maxDepth,
    createdAt: now,
    updatedAt: now,
    version: '1.0.0',
    ...additional,
  };
}

/**
 * Creates a new tree node
 *
 * @typeParam T - The data type for the node
 * @param id - Unique identifier for the node
 * @param data - The data to store
 * @param children - Child nodes
 * @param metadata - Node metadata (auto-generated if not provided)
 * @returns A new TreeNode
 */
export function createTreeNode<T>(
  id: string,
  data: T,
  children: readonly TreeNode<T>[] = [],
  metadata?: Partial<TreeNodeMetadata>
): TreeNode<T> {
  const depth = metadata?.depth ?? 0;
  const index = metadata?.index ?? 0;

  return {
    id,
    data,
    children,
    metadata: {
      ...createNodeMetadata(depth, index, children.length),
      ...metadata,
    },
  };
}

/**
 * Creates a new tree
 *
 * @typeParam T - The data type for tree nodes
 * @param root - The root node
 * @param metadata - Tree metadata (auto-generated if not provided)
 * @returns A new Tree
 */
export function createTree<T>(
  root: TreeNode<T>,
  metadata?: Partial<TreeMetadata>
): Tree<T> {
  const totalNodes = countNodes(root);
  const maxDepth = getMaxDepth(root);

  return {
    root,
    metadata: {
      ...createTreeMetadata(totalNodes, maxDepth),
      ...metadata,
    },
  };
}

/**
 * Counts total nodes in a tree
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node
 * @returns Total number of nodes
 */
export function countNodes<T>(node: TreeNode<T>): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

/**
 * Gets maximum depth in a tree
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node
 * @returns Maximum depth
 */
export function getMaxDepth<T>(node: TreeNode<T>): number {
  if (node.children.length === 0) {
    return node.metadata.depth;
  }
  return Math.max(...node.children.map(child => getMaxDepth(child)));
}

// =============================================================================
// TRAVERSAL FUNCTIONS
// =============================================================================

/**
 * Traverses tree in depth-first order (pre-order, in-order, or post-order)
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node to start traversal
 * @param visit - Function called for each node
 * @param order - Traversal order ('pre-order' or 'post-order')
 * @param path - Current path (used internally for recursion)
 *
 * @example
 * ```typescript
 * traverseDFS(root, (node, path, depth) => {
 *   console.log(`Visiting: ${node.id} at depth ${depth}`);
 * }, 'pre-order');
 * ```
 */
export function traverseDFS<T>(
  node: TreeNode<T>,
  visit: VisitFunction<T>,
  order: 'pre-order' | 'post-order' = 'pre-order',
  path: TreePath = []
): void {
  const currentPath = [...path, node.id];

  // Depth limit check
  if (node.metadata.depth > MAX_DEPTH) {
    throw new Error(`Maximum depth ${MAX_DEPTH} exceeded at node ${node.id}`);
  }

  // Pre-order: visit before children
  if (order === 'pre-order') {
    visit(node, currentPath, node.metadata.depth);
  }

  // Recurse into children
  for (const child of node.children) {
    traverseDFS(child, visit, order, currentPath);
  }

  // Post-order: visit after children
  if (order === 'post-order') {
    visit(node, currentPath, node.metadata.depth);
  }
}

/**
 * Traverses tree in breadth-first order (level by level)
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node to start traversal
 * @param visit - Function called for each node
 *
 * @example
 * ```typescript
 * traverseBFS(root, (node, path, depth) => {
 *   console.log(`Level ${depth}: ${node.id}`);
 * });
 * ```
 */
export function traverseBFS<T>(
  root: TreeNode<T>,
  visit: VisitFunction<T>
): void {
  interface QueueItem {
    node: TreeNode<T>;
    path: TreePath;
  }

  const queue: QueueItem[] = [{ node: root, path: [root.id] }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const { node, path } = current;

    // Depth limit check
    if (node.metadata.depth > MAX_DEPTH) {
      throw new Error(`Maximum depth ${MAX_DEPTH} exceeded at node ${node.id}`);
    }

    visit(node, path, node.metadata.depth);

    // Enqueue children
    for (const child of node.children) {
      queue.push({
        node: child,
        path: [...path, child.id],
      });
    }
  }
}

/**
 * Maps a tree to a new tree with transformed data
 *
 * @typeParam T - The input data type
 * @typeParam U - The output data type
 * @param node - The root node to transform
 * @param transform - Transformation function
 * @param path - Current path (used internally)
 * @returns New tree with transformed data
 *
 * @example
 * ```typescript
 * const stringTree = mapTree(numberTree, (node) => node.data.toString());
 * ```
 */
export function mapTree<T, U>(
  node: TreeNode<T>,
  transform: NodeTransformer<T, U>,
  path: TreePath = []
): TreeNode<U> {
  const currentPath = [...path, node.id];

  return {
    id: node.id,
    data: transform(node, currentPath),
    children: node.children.map(child => mapTree(child, transform, currentPath)),
    metadata: node.metadata,
  };
}

/**
 * Filters tree nodes based on a predicate
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node to filter
 * @param predicate - Predicate function
 * @param path - Current path (used internally)
 * @returns New tree with filtered nodes, or null if root doesn't match
 *
 * @example
 * ```typescript
 * const filtered = filterTree(root, (node) => node.data.type === 'folder');
 * ```
 */
export function filterTree<T>(
  node: TreeNode<T>,
  predicate: NodePredicate<T>,
  path: TreePath = []
): TreeNode<T> | null {
  const currentPath = [...path, node.id];

  // Filter children recursively
  const filteredChildren = node.children
    .map(child => filterTree(child, predicate, currentPath))
    .filter((child): child is TreeNode<T> => child !== null);

  // If node doesn't match predicate and has no matching children, exclude it
  if (!predicate(node, currentPath) && filteredChildren.length === 0) {
    return null;
  }

  // Return node with filtered children
  return {
    ...node,
    children: filteredChildren,
    metadata: {
      ...node.metadata,
      hasChildren: filteredChildren.length > 0,
      childCount: filteredChildren.length,
    },
  };
}

/**
 * Finds first node matching predicate
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node to search
 * @param predicate - Predicate function
 * @param path - Current path (used internally)
 * @returns Matching node or null
 *
 * @example
 * ```typescript
 * const found = findInTree(root, (node) => node.id === 'target-id');
 * ```
 */
export function findInTree<T>(
  node: TreeNode<T>,
  predicate: NodePredicate<T>,
  path: TreePath = []
): TreeNode<T> | null {
  const currentPath = [...path, node.id];

  if (predicate(node, currentPath)) {
    return node;
  }

  for (const child of node.children) {
    const found = findInTree(child, predicate, currentPath);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Reduces tree to a single value
 *
 * @typeParam T - The data type stored in tree nodes
 * @typeParam U - The accumulator type
 * @param node - The root node to reduce
 * @param reducer - Reducer function
 * @param initialValue - Initial accumulator value
 * @param path - Current path (used internally)
 * @returns Final accumulated value
 *
 * @example
 * ```typescript
 * const totalSize = reduceTree(
 *   root,
 *   (sum, node) => sum + node.data.size,
 *   0
 * );
 * ```
 */
export function reduceTree<T, U>(
  node: TreeNode<T>,
  reducer: NodeReducer<T, U>,
  initialValue: U,
  path: TreePath = []
): U {
  const currentPath = [...path, node.id];

  // Reduce current node
  let accumulator = reducer(initialValue, node, currentPath);

  // Reduce children
  for (const child of node.children) {
    accumulator = reduceTree(child, reducer, accumulator, currentPath);
  }

  return accumulator;
}

/**
 * Flattens tree into array of flat nodes
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node to flatten
 * @param parentId - Parent node ID (null for root)
 * @param path - Current path (used internally)
 * @returns Array of flattened nodes
 *
 * @example
 * ```typescript
 * const flatNodes = flattenTree(root);
 * flatNodes.forEach(node => {
 *   console.log(`${node.id} at depth ${node.depth}`);
 * });
 * ```
 */
export function flattenTree<T>(
  node: TreeNode<T>,
  parentId: string | null = null,
  path: TreePath = []
): FlatNode<T>[] {
  const currentPath = [...path, node.id];

  const flatNode: FlatNode<T> = {
    id: node.id,
    data: node.data,
    path: currentPath,
    depth: node.metadata.depth,
    parentId,
    hasChildren: node.children.length > 0,
    childCount: node.children.length,
  };

  const childFlats = node.children.flatMap(child =>
    flattenTree(child, node.id, currentPath)
  );

  return [flatNode, ...childFlats];
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Finds node by ID
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node to search
 * @param id - The ID to find
 * @returns Matching node or null
 *
 * @example
 * ```typescript
 * const targetNode = findById(root, 'chapter-2');
 * ```
 */
export function findById<T>(node: TreeNode<T>, id: string): TreeNode<T> | null {
  return findInTree(node, n => n.id === id);
}

/**
 * Finds node by path
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The root node to search
 * @param targetPath - Path of node IDs
 * @returns Matching node or null
 *
 * @example
 * ```typescript
 * const node = findByPath(root, ['textbook-1', 'chapter-2', 'lesson-3']);
 * ```
 */
export function findByPath<T>(
  node: TreeNode<T>,
  targetPath: TreePath
): TreeNode<T> | null {
  if (targetPath.length === 0) {
    return null;
  }

  if (node.id !== targetPath[0]) {
    return null;
  }

  if (targetPath.length === 1) {
    return node;
  }

  for (const child of node.children) {
    const found = findByPath(child, targetPath.slice(1));
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * Gets all ancestors of a node
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node to search from
 * @param targetId - The target node ID
 * @param path - Current path (used internally)
 * @returns Array of ancestor nodes (from root to parent)
 *
 * @example
 * ```typescript
 * const ancestors = getAncestors(root, 'topic-5');
 * // Returns [textbook, chapter, lesson]
 * ```
 */
export function getAncestors<T>(
  root: TreeNode<T>,
  targetId: string,
  path: TreeNode<T>[] = []
): TreeNode<T>[] {
  if (root.id === targetId) {
    return path;
  }

  for (const child of root.children) {
    const found = getAncestors(child, targetId, [...path, root]);
    if (found.length > 0 || child.id === targetId) {
      return found.length > 0 ? found : [...path, root];
    }
  }

  return [];
}

/**
 * Gets all descendants of a node
 *
 * @typeParam T - The data type stored in tree nodes
 * @param node - The node to get descendants from
 * @returns Array of all descendant nodes
 *
 * @example
 * ```typescript
 * const descendants = getDescendants(chapterNode);
 * // Returns all lessons and topics within the chapter
 * ```
 */
export function getDescendants<T>(node: TreeNode<T>): TreeNode<T>[] {
  const descendants: TreeNode<T>[] = [];

  for (const child of node.children) {
    descendants.push(child);
    descendants.push(...getDescendants(child));
  }

  return descendants;
}

/**
 * Gets siblings of a node
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node to search from
 * @param targetId - The target node ID
 * @returns Array of sibling nodes (excluding target)
 *
 * @example
 * ```typescript
 * const siblings = getSiblings(root, 'chapter-2');
 * // Returns other chapters in the same textbook
 * ```
 */
export function getSiblings<T>(
  root: TreeNode<T>,
  targetId: string
): TreeNode<T>[] {
  const parent = findParent(root, targetId);
  if (!parent) {
    return [];
  }

  return parent.children.filter(child => child.id !== targetId);
}

/**
 * Finds parent of a node (helper function)
 */
function findParent<T>(node: TreeNode<T>, targetId: string): TreeNode<T> | null {
  for (const child of node.children) {
    if (child.id === targetId) {
      return node;
    }

    const found = findParent(child, targetId);
    if (found) {
      return found;
    }
  }

  return null;
}

// =============================================================================
// MUTATION FUNCTIONS (Immutable - Return New Trees)
// =============================================================================

/**
 * Inserts a new node as child of parent node
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node
 * @param parentId - The parent node ID
 * @param newNode - The new node to insert
 * @returns New tree with inserted node, or null if parent not found
 *
 * @example
 * ```typescript
 * const newTree = insertNode(root, 'chapter-1', newLessonNode);
 * ```
 */
export function insertNode<T>(
  root: TreeNode<T>,
  parentId: string,
  newNode: TreeNode<T>
): TreeNode<T> | null {
  if (root.id === parentId) {
    // Check depth limit for new node
    if (root.metadata.depth + 1 > MAX_DEPTH) {
      throw new Error(`Cannot insert node: would exceed maximum depth ${MAX_DEPTH}`);
    }

    return {
      ...root,
      children: [...root.children, newNode],
      metadata: {
        ...root.metadata,
        hasChildren: true,
        childCount: root.children.length + 1,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const updatedChildren = root.children
    .map(child => insertNode(child, parentId, newNode))
    .map((child, index) => child ?? root.children[index]);

  return {
    ...root,
    children: updatedChildren,
  };
}

/**
 * Removes a node from the tree
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node
 * @param targetId - The node ID to remove
 * @returns New tree without the node, or null if root should be removed
 *
 * @example
 * ```typescript
 * const newTree = removeNode(root, 'lesson-3');
 * ```
 */
export function removeNode<T>(
  root: TreeNode<T>,
  targetId: string
): TreeNode<T> | null {
  if (root.id === targetId) {
    return null;
  }

  const filteredChildren = root.children
    .map(child => removeNode(child, targetId))
    .filter((child): child is TreeNode<T> => child !== null);

  return {
    ...root,
    children: filteredChildren,
    metadata: {
      ...root.metadata,
      hasChildren: filteredChildren.length > 0,
      childCount: filteredChildren.length,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Moves a node to a new parent
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node
 * @param nodeId - The node ID to move
 * @param newParentId - The new parent node ID
 * @returns New tree with moved node, or null if operation failed
 *
 * @example
 * ```typescript
 * const newTree = moveNode(root, 'lesson-3', 'chapter-2');
 * ```
 */
export function moveNode<T>(
  root: TreeNode<T>,
  nodeId: string,
  newParentId: string
): TreeNode<T> | null {
  // Find the node to move
  const nodeToMove = findById(root, nodeId);
  if (!nodeToMove) {
    return null;
  }

  // Remove node from current location
  const withoutNode = removeNode(root, nodeId);
  if (!withoutNode) {
    return null;
  }

  // Insert node at new location
  return insertNode(withoutNode, newParentId, nodeToMove);
}

/**
 * Updates a node's data
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node
 * @param targetId - The node ID to update
 * @param updater - Function to update node data
 * @returns New tree with updated node, or null if node not found
 *
 * @example
 * ```typescript
 * const newTree = updateNode(root, 'lesson-3', (data) => ({
 *   ...data,
 *   title: 'Updated Lesson Title'
 * }));
 * ```
 */
export function updateNode<T>(
  root: TreeNode<T>,
  targetId: string,
  updater: (data: T) => T
): TreeNode<T> | null {
  if (root.id === targetId) {
    return {
      ...root,
      data: updater(root.data),
      metadata: {
        ...root.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const updatedChildren = root.children
    .map(child => updateNode(child, targetId, updater))
    .map((child, index) => child ?? root.children[index]);

  return {
    ...root,
    children: updatedChildren,
  };
}

/**
 * Updates node metadata
 *
 * @typeParam T - The data type stored in tree nodes
 * @param root - The root node
 * @param targetId - The node ID to update
 * @param metadataUpdater - Function to update metadata
 * @returns New tree with updated metadata
 *
 * @example
 * ```typescript
 * const newTree = updateNodeMetadata(root, 'lesson-3', (meta) => ({
 *   ...meta,
 *   starred: true
 * }));
 * ```
 */
export function updateNodeMetadata<T>(
  root: TreeNode<T>,
  targetId: string,
  metadataUpdater: (metadata: TreeNodeMetadata) => TreeNodeMetadata
): TreeNode<T> | null {
  if (root.id === targetId) {
    return {
      ...root,
      metadata: {
        ...metadataUpdater(root.metadata),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const updatedChildren = root.children
    .map(child => updateNodeMetadata(child, targetId, metadataUpdater))
    .map((child, index) => child ?? root.children[index]);

  return {
    ...root,
    children: updatedChildren,
  };
}