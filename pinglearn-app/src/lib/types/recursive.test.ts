/**
 * Tests for Generic Recursive Type Utilities
 *
 * Covers:
 * - Tree node and tree creation
 * - Type guards
 * - Traversal functions (DFS, BFS)
 * - Query functions (find, search)
 * - Mutation functions (insert, remove, update)
 * - Depth limiting
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import type { TreeNode, Tree, FlatNode } from './recursive';
import {
  MAX_DEPTH,
  createTreeNode,
  createTree,
  isTreeNode,
  isTree,
  hasChildren,
  isLeafNode,
  isValidDepth,
  hasValidDepth,
  traverseDFS,
  traverseBFS,
  mapTree,
  filterTree,
  findInTree,
  reduceTree,
  flattenTree,
  findById,
  findByPath,
  getAncestors,
  getDescendants,
  getSiblings,
  insertNode,
  removeNode,
  moveNode,
  updateNode,
  countNodes,
  getMaxDepth,
} from './recursive';

// =============================================================================
// TEST DATA
// =============================================================================

interface TestData {
  name: string;
  value: number;
}

function createTestNode(id: string, name: string, value: number, children: TreeNode<TestData>[] = []): TreeNode<TestData> {
  return createTreeNode(
    id,
    { name, value },
    children,
    { depth: 0, index: 0 }
  );
}

// =============================================================================
// CORE TYPE CONSTRUCTION TESTS
// =============================================================================

describe('Core Type Construction', () => {
  it('should create a valid tree node', () => {
    const node = createTestNode('root', 'Root Node', 1);

    expect(node.id).toBe('root');
    expect(node.data.name).toBe('Root Node');
    expect(node.data.value).toBe(1);
    expect(node.children).toHaveLength(0);
    expect(node.metadata.depth).toBe(0);
    expect(node.metadata.hasChildren).toBe(false);
  });

  it('should create a tree node with children', () => {
    const child1 = createTestNode('child1', 'Child 1', 2);
    const child2 = createTestNode('child2', 'Child 2', 3);
    const parent = createTestNode('parent', 'Parent', 1, [child1, child2]);

    expect(parent.children).toHaveLength(2);
    expect(parent.metadata.hasChildren).toBe(true);
    expect(parent.metadata.childCount).toBe(2);
  });

  it('should create a complete tree', () => {
    const root = createTestNode('root', 'Root', 1);
    const tree = createTree(root);

    expect(tree.root).toBe(root);
    expect(tree.metadata.totalNodes).toBe(1);
    expect(tree.metadata.maxDepth).toBe(0);
    expect(tree.metadata.version).toBe('1.0.0');
  });

  it('should count nodes correctly', () => {
    const child1 = createTestNode('c1', 'C1', 2);
    const child2 = createTestNode('c2', 'C2', 3);
    const root = createTestNode('root', 'Root', 1, [child1, child2]);

    expect(countNodes(root)).toBe(3);
  });

  it('should calculate max depth correctly', () => {
    const grandchild = createTreeNode('gc', { name: 'GC', value: 4 }, [], { depth: 2, index: 0 });
    const child = createTreeNode('c', { name: 'C', value: 3 }, [grandchild], { depth: 1, index: 0 });
    const root = createTreeNode('root', { name: 'Root', value: 2 }, [child], { depth: 0, index: 0 });

    expect(getMaxDepth(root)).toBe(2);
  });
});

// =============================================================================
// TYPE GUARD TESTS
// =============================================================================

describe('Type Guards', () => {
  it('should validate tree nodes', () => {
    const node = createTestNode('test', 'Test', 1);
    expect(isTreeNode<TestData>(node)).toBe(true);
  });

  it('should reject invalid tree nodes', () => {
    expect(isTreeNode(null)).toBe(false);
    expect(isTreeNode(undefined)).toBe(false);
    expect(isTreeNode({})).toBe(false);
    expect(isTreeNode({ id: 'test' })).toBe(false);
  });

  it('should validate complete trees', () => {
    const root = createTestNode('root', 'Root', 1);
    const tree = createTree(root);
    expect(isTree<TestData>(tree)).toBe(true);
  });

  it('should detect nodes with children', () => {
    const child = createTestNode('child', 'Child', 2);
    const parent = createTestNode('parent', 'Parent', 1, [child]);

    expect(hasChildren(parent)).toBe(true);
    expect(hasChildren(child)).toBe(false);
  });

  it('should detect leaf nodes', () => {
    const leaf = createTestNode('leaf', 'Leaf', 1);
    const child = createTestNode('child', 'Child', 2);
    const parent = createTestNode('parent', 'Parent', 3, [child]);

    expect(isLeafNode(leaf)).toBe(true);
    expect(isLeafNode(parent)).toBe(false);
  });

  it('should validate depth limits', () => {
    expect(isValidDepth(0)).toBe(true);
    expect(isValidDepth(3)).toBe(true);
    expect(isValidDepth(MAX_DEPTH)).toBe(true);
    expect(isValidDepth(MAX_DEPTH + 1)).toBe(false);
    expect(isValidDepth(-1)).toBe(false);
  });

  it('should check node depth validity', () => {
    const validNode = createTreeNode('valid', { name: 'Valid', value: 1 }, [], { depth: 3, index: 0 });
    const invalidNode = createTreeNode('invalid', { name: 'Invalid', value: 1 }, [], { depth: MAX_DEPTH + 1, index: 0 });

    expect(hasValidDepth(validNode)).toBe(true);
    expect(hasValidDepth(invalidNode)).toBe(false);
  });
});

// =============================================================================
// TRAVERSAL TESTS
// =============================================================================

describe('Traversal Functions', () => {
  const buildTestTree = (): TreeNode<TestData> => {
    const leaf1 = createTreeNode('leaf1', { name: 'Leaf 1', value: 4 }, [], { depth: 2, index: 0 });
    const leaf2 = createTreeNode('leaf2', { name: 'Leaf 2', value: 5 }, [], { depth: 2, index: 1 });
    const child1 = createTreeNode('child1', { name: 'Child 1', value: 2 }, [leaf1], { depth: 1, index: 0 });
    const child2 = createTreeNode('child2', { name: 'Child 2', value: 3 }, [leaf2], { depth: 1, index: 1 });
    return createTreeNode('root', { name: 'Root', value: 1 }, [child1, child2], { depth: 0, index: 0 });
  };

  it('should traverse tree in DFS pre-order', () => {
    const root = buildTestTree();
    const visited: string[] = [];

    traverseDFS(root, (node) => {
      visited.push(node.id);
    }, 'pre-order');

    expect(visited).toEqual(['root', 'child1', 'leaf1', 'child2', 'leaf2']);
  });

  it('should traverse tree in DFS post-order', () => {
    const root = buildTestTree();
    const visited: string[] = [];

    traverseDFS(root, (node) => {
      visited.push(node.id);
    }, 'post-order');

    expect(visited).toEqual(['leaf1', 'child1', 'leaf2', 'child2', 'root']);
  });

  it('should traverse tree in BFS', () => {
    const root = buildTestTree();
    const visited: string[] = [];

    traverseBFS(root, (node) => {
      visited.push(node.id);
    });

    expect(visited).toEqual(['root', 'child1', 'child2', 'leaf1', 'leaf2']);
  });

  it('should map tree data', () => {
    const root = createTestNode('root', 'Root', 5);
    const mapped = mapTree(root, (node) => node.data.value * 2);

    expect(mapped.data).toBe(10);
    expect(mapped.id).toBe('root');
  });

  it('should filter tree nodes', () => {
    const root = buildTestTree();
    // buildTestTree: root(1) -> child1(2)->leaf1(4), child2(3)->leaf2(5)
    // Filter for value > 2: child1 doesn't match but has leaf1(4) which does
    // child2(3) matches, leaf2(5) matches
    const filtered = filterTree(root, (node) => node.data.value > 2);

    expect(filtered).not.toBeNull();
    // Both children are kept because they or their descendants match
    expect(filtered!.children).toHaveLength(2);
  });

  it('should find node in tree', () => {
    const root = buildTestTree();
    const found = findInTree(root, (node) => node.id === 'leaf2');

    expect(found).not.toBeNull();
    expect(found!.id).toBe('leaf2');
  });

  it('should reduce tree to value', () => {
    const root = buildTestTree();
    const sum = reduceTree(root, (acc, node) => acc + node.data.value, 0);

    expect(sum).toBe(15); // 1 + 2 + 3 + 4 + 5
  });

  it('should flatten tree', () => {
    const root = buildTestTree();
    const flat = flattenTree(root);

    expect(flat).toHaveLength(5);
    expect(flat[0].id).toBe('root');
    expect(flat[0].parentId).toBeNull();
    expect(flat[1].parentId).toBe('root');
  });
});

// =============================================================================
// QUERY FUNCTION TESTS
// =============================================================================

describe('Query Functions', () => {
  const buildTestTree = (): TreeNode<TestData> => {
    const leaf1 = createTreeNode('leaf1', { name: 'Leaf 1', value: 4 }, [], { depth: 2, index: 0 });
    const child1 = createTreeNode('child1', { name: 'Child 1', value: 2 }, [leaf1], { depth: 1, index: 0 });
    const child2 = createTreeNode('child2', { name: 'Child 2', value: 3 }, [], { depth: 1, index: 1 });
    return createTreeNode('root', { name: 'Root', value: 1 }, [child1, child2], { depth: 0, index: 0 });
  };

  it('should find node by ID', () => {
    const root = buildTestTree();
    const found = findById(root, 'child1');

    expect(found).not.toBeNull();
    expect(found!.id).toBe('child1');
  });

  it('should return null for non-existent ID', () => {
    const root = buildTestTree();
    const found = findById(root, 'nonexistent');

    expect(found).toBeNull();
  });

  it('should find node by path', () => {
    const root = buildTestTree();
    const found = findByPath(root, ['root', 'child1', 'leaf1']);

    expect(found).not.toBeNull();
    expect(found!.id).toBe('leaf1');
  });

  it('should return null for invalid path', () => {
    const root = buildTestTree();
    const found = findByPath(root, ['root', 'invalid']);

    expect(found).toBeNull();
  });

  it('should get ancestors', () => {
    const root = buildTestTree();
    const ancestors = getAncestors(root, 'leaf1');

    expect(ancestors).toHaveLength(2); // root and child1
    expect(ancestors[0].id).toBe('root');
    expect(ancestors[1].id).toBe('child1');
  });

  it('should get descendants', () => {
    const root = buildTestTree();
    const descendants = getDescendants(root);

    expect(descendants).toHaveLength(3); // child1, child2, leaf1
  });

  it('should get siblings', () => {
    const root = buildTestTree();
    const siblings = getSiblings(root, 'child1');

    expect(siblings).toHaveLength(1);
    expect(siblings[0].id).toBe('child2');
  });
});

// =============================================================================
// MUTATION FUNCTION TESTS
// =============================================================================

describe('Mutation Functions', () => {
  it('should insert node immutably', () => {
    const child = createTestNode('child', 'Child', 2);
    const root = createTestNode('root', 'Root', 1);
    const newNode = createTestNode('new', 'New', 3);

    const updated = insertNode(root, 'root', newNode);

    expect(updated).not.toBeNull();
    expect(updated!.children).toHaveLength(1);
    expect(updated!.children[0].id).toBe('new');
    expect(root.children).toHaveLength(0); // Original unchanged
  });

  it('should remove node immutably', () => {
    const child1 = createTestNode('child1', 'Child 1', 2);
    const child2 = createTestNode('child2', 'Child 2', 3);
    const root = createTestNode('root', 'Root', 1, [child1, child2]);

    const updated = removeNode(root, 'child1');

    expect(updated).not.toBeNull();
    expect(updated!.children).toHaveLength(1);
    expect(updated!.children[0].id).toBe('child2');
    expect(root.children).toHaveLength(2); // Original unchanged
  });

  it('should update node data immutably', () => {
    const root = createTestNode('root', 'Root', 1);

    const updated = updateNode(root, 'root', (data) => ({
      ...data,
      value: 100,
    }));

    expect(updated).not.toBeNull();
    expect(updated!.data.value).toBe(100);
    expect(root.data.value).toBe(1); // Original unchanged
  });

  it('should move node between parents', () => {
    const leaf = createTreeNode('leaf', { name: 'Leaf', value: 4 }, [], { depth: 2, index: 0 });
    const child1 = createTreeNode('child1', { name: 'Child 1', value: 2 }, [leaf], { depth: 1, index: 0 });
    const child2 = createTreeNode('child2', { name: 'Child 2', value: 3 }, [], { depth: 1, index: 1 });
    const root = createTreeNode('root', { name: 'Root', value: 1 }, [child1, child2], { depth: 0, index: 0 });

    const updated = moveNode(root, 'leaf', 'child2');

    expect(updated).not.toBeNull();
    const newChild1 = findById(updated!, 'child1');
    const newChild2 = findById(updated!, 'child2');

    expect(newChild1!.children).toHaveLength(0);
    expect(newChild2!.children).toHaveLength(1);
    expect(newChild2!.children[0].id).toBe('leaf');
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty tree', () => {
    const root = createTestNode('root', 'Root', 1);

    expect(countNodes(root)).toBe(1);
    expect(getMaxDepth(root)).toBe(0);
    expect(flattenTree(root)).toHaveLength(1);
  });

  it('should handle single-node tree', () => {
    const root = createTestNode('root', 'Root', 1);
    const tree = createTree(root);

    expect(tree.metadata.totalNodes).toBe(1);
    expect(tree.metadata.maxDepth).toBe(0);
  });

  it('should throw error when exceeding max depth', () => {
    // Create a deep tree at MAX_DEPTH
    const deepNode = createTreeNode('deep', { name: 'Deep', value: 2 }, [], { depth: MAX_DEPTH, index: 0 });
    const newNode = createTreeNode('new', { name: 'New', value: 3 }, [], { depth: 0, index: 0 });

    expect(() => {
      insertNode(deepNode, 'deep', newNode);
    }).toThrow();
  });

  it('should handle operations on non-existent nodes gracefully', () => {
    const root = createTestNode('root', 'Root', 1);

    expect(findById(root, 'nonexistent')).toBeNull();
    expect(getSiblings(root, 'nonexistent')).toEqual([]);
    expect(removeNode(root, 'nonexistent')).not.toBeNull();
  });
});