/**
 * Dependency Resolver
 * ARCH-004: Dependency Injection System
 *
 * Builds dependency graph, detects circular dependencies using depth-first
 * search, and performs topological sort for initialization order.
 */

import type { Token } from './types';
import { CircularDependencyError } from './errors';

/**
 * Dependency resolver with circular detection
 *
 * Uses depth-first search to detect circular dependencies and topological
 * sort to determine correct initialization order.
 */
export class DependencyResolver {
  /**
   * Dependency graph: token -> array of dependency tokens
   */
  private dependencyGraph: Map<Token, Token[]> = new Map();

  /**
   * Add dependency relationship
   *
   * @param token - Token being registered
   * @param dependencies - Tokens this dependency depends on
   *
   * @example
   * ```typescript
   * resolver.addDependency('UserService', ['Database', 'Logger']);
   * // UserService depends on Database and Logger
   * ```
   */
  addDependency(token: Token, dependencies: Token[]): void {
    this.dependencyGraph.set(token, dependencies);
  }

  /**
   * Detect circular dependencies starting from a token
   *
   * Uses depth-first search with visiting/visited sets to detect cycles.
   * Throws CircularDependencyError with the full cycle path if detected.
   *
   * @param startToken - Token to start detection from
   * @throws {CircularDependencyError} If circular dependency detected
   *
   * @example
   * ```typescript
   * // A -> B -> C -> A (circular)
   * resolver.detectCircularDependencies('A');
   * // Throws: Circular dependency detected: A -> B -> C -> A
   * ```
   */
  detectCircularDependencies(startToken: Token): void {
    const visited = new Set<Token>();
    const visiting = new Set<Token>();
    const path: Token[] = [];

    const visit = (token: Token): void => {
      // If we're currently visiting this token, we found a cycle
      if (visiting.has(token)) {
        const cycleStart = path.indexOf(token);
        const cycle = [...path.slice(cycleStart), token];
        throw new CircularDependencyError(cycle);
      }

      // If we've already fully visited this token, skip it
      if (visited.has(token)) {
        return;
      }

      // Mark as currently visiting
      visiting.add(token);
      path.push(token);

      // Visit all dependencies
      const dependencies = this.dependencyGraph.get(token) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      // Done visiting this token
      visiting.delete(token);
      path.pop();
      visited.add(token);
    };

    visit(startToken);
  }

  /**
   * Perform topological sort for initialization order
   *
   * Returns tokens in dependency order (dependencies come before dependents).
   * Uses depth-first search to build the sorted order.
   *
   * @returns Tokens in dependency order
   *
   * @example
   * ```typescript
   * // A depends on B, B depends on C
   * // Graph: A -> B -> C
   * const order = resolver.topologicalSort();
   * // Returns: ['C', 'B', 'A']
   * // (C first because B depends on it, A last because it depends on B)
   * ```
   */
  topologicalSort(): Token[] {
    const visited = new Set<Token>();
    const result: Token[] = [];

    const visit = (token: Token): void => {
      if (visited.has(token)) {
        return;
      }

      visited.add(token);

      // Visit dependencies first
      const dependencies = this.dependencyGraph.get(token) || [];
      for (const dep of dependencies) {
        visit(dep);
      }

      // Add token after all dependencies
      result.push(token);
    };

    // Visit all tokens in the graph
    for (const token of this.dependencyGraph.keys()) {
      visit(token);
    }

    return result;
  }

  /**
   * Get dependencies for a token
   *
   * @param token - Token to get dependencies for
   * @returns Array of dependency tokens (empty if no dependencies)
   */
  getDependencies(token: Token): Token[] {
    return this.dependencyGraph.get(token) || [];
  }

  /**
   * Get all tokens in the dependency graph
   *
   * @returns Array of all registered tokens
   */
  getAllTokens(): Token[] {
    return Array.from(this.dependencyGraph.keys());
  }

  /**
   * Check if token has dependencies
   *
   * @param token - Token to check
   * @returns True if token has dependencies
   */
  hasDependencies(token: Token): boolean {
    const deps = this.dependencyGraph.get(token);
    return deps !== undefined && deps.length > 0;
  }

  /**
   * Get number of tokens in graph
   *
   * @returns Number of tokens
   */
  size(): number {
    return this.dependencyGraph.size;
  }

  /**
   * Clear dependency graph
   *
   * Removes all dependency relationships. Use when clearing container.
   */
  clear(): void {
    this.dependencyGraph.clear();
  }

  /**
   * Get dependency graph (for debugging)
   *
   * @returns Readonly copy of dependency graph
   */
  getGraph(): ReadonlyMap<Token, readonly Token[]> {
    return new Map(this.dependencyGraph);
  }
}
