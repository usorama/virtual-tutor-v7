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