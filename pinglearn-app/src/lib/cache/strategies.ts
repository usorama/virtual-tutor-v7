/**
 * ARCH-006: Cache Eviction Strategies
 * LRU, TTL, and SWR (Stale-While-Revalidate) implementations
 */

import type { CacheStrategy, CacheEntry, CacheConfig, ListNode } from './types';
import { isExpired } from './utils';

/**
 * Doubly Linked List (for O(1) LRU operations)
 */
class DoublyLinkedList<T> {
  head: ListNode<T> | null = null;
  tail: ListNode<T> | null = null;
  size = 0;

  /**
   * Add node to front (most recently used)
   */
  addFront(value: T): ListNode<T> {
    const node: ListNode<T> = {
      value,
      prev: null,
      next: this.head,
    };

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }

    this.size++;
    return node;
  }

  /**
   * Move existing node to front
   */
  moveToFront(node: ListNode<T>): void {
    if (node === this.head) return; // Already at front

    // Remove from current position
    if (node.prev) {
      node.prev.next = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    }

    if (node === this.tail) {
      this.tail = node.prev;
    }

    // Move to front
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove and return tail (least recently used)
   */
  removeTail(): T | null {
    if (!this.tail) return null;

    const value = this.tail.value;

    if (this.tail.prev) {
      this.tail.prev.next = null;
    }

    this.tail = this.tail.prev;

    if (!this.tail) {
      this.head = null;
    }

    this.size--;
    return value;
  }

  /**
   * Remove specific node
   */
  remove(node: ListNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    this.size--;
  }

  /**
   * Clear all nodes
   */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }
}

/**
 * LRU (Least Recently Used) Strategy
 * Evicts least recently accessed entries when cache is full
 * Also respects TTL expiration
 */
export class LRUStrategy implements CacheStrategy {
  readonly name = 'lru';

  private lruList: DoublyLinkedList<string>;
  private nodeMap: Map<string, ListNode<string>>;

  constructor() {
    this.lruList = new DoublyLinkedList<string>();
    this.nodeMap = new Map();
  }

  shouldEvict(entry: CacheEntry, _config: CacheConfig): boolean {
    // Check TTL expiration
    return isExpired(entry);
  }

  onAccess(entry: CacheEntry): void {
    // Move to front of LRU list (most recently used)
    const node = this.nodeMap.get(entry.metadata.key);
    if (node) {
      this.lruList.moveToFront(node);
    }

    // Update access metadata
    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;
  }

  onSet(entry: CacheEntry): void {
    // Add to front of LRU list
    const existingNode = this.nodeMap.get(entry.metadata.key);

    if (existingNode) {
      // Update existing entry's position
      this.lruList.moveToFront(existingNode);
    } else {
      // Add new entry
      const node = this.lruList.addFront(entry.metadata.key);
      this.nodeMap.set(entry.metadata.key, node);
    }
  }

  selectEvictionCandidate(
    entries: Map<string, CacheEntry>,
    _config: CacheConfig
  ): string | null {
    // First, check for expired entries
    for (const [key, entry] of entries) {
      if (isExpired(entry)) {
        return key;
      }
    }

    // Return least recently used (tail of list)
    return this.lruList.tail?.value ?? null;
  }

  /**
   * Remove key from LRU tracking (called when entry is deleted)
   */
  removeKey(key: string): void {
    const node = this.nodeMap.get(key);
    if (node) {
      this.lruList.remove(node);
      this.nodeMap.delete(key);
    }
  }

  /**
   * Clear all LRU tracking
   */
  clear(): void {
    this.lruList.clear();
    this.nodeMap.clear();
  }
}

/**
 * TTL (Time-To-Live) Strategy
 * Evicts expired entries and oldest entries when cache is full
 */
export class TTLStrategy implements CacheStrategy {
  readonly name = 'ttl';

  shouldEvict(entry: CacheEntry, _config: CacheConfig): boolean {
    return isExpired(entry);
  }

  onAccess(entry: CacheEntry): void {
    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;
  }

  onSet(_entry: CacheEntry): void {
    // TTL is set during entry creation, nothing to do here
  }

  selectEvictionCandidate(
    entries: Map<string, CacheEntry>,
    _config: CacheConfig
  ): string | null {
    // First, find expired entries
    for (const [key, entry] of entries) {
      if (isExpired(entry)) {
        return key;
      }
    }

    // If no expired entries, find entry closest to expiration
    let candidate: string | null = null;
    let minExpiry = Infinity;

    for (const [key, entry] of entries) {
      if (entry.metadata.expiresAt !== null && entry.metadata.expiresAt < minExpiry) {
        minExpiry = entry.metadata.expiresAt;
        candidate = key;
      }
    }

    // If all entries have no expiration, evict oldest by creation time
    if (candidate === null) {
      let minCreated = Infinity;
      for (const [key, entry] of entries) {
        if (entry.metadata.createdAt < minCreated) {
          minCreated = entry.metadata.createdAt;
          candidate = key;
        }
      }
    }

    return candidate;
  }
}

/**
 * SWR (Stale-While-Revalidate) Strategy
 * Serves stale entries while triggering background refresh
 *
 * Note: Background refresh is application responsibility.
 * This strategy just marks entries as stale and serves them anyway.
 */
export class SWRStrategy implements CacheStrategy {
  readonly name = 'swr';

  private lruList: DoublyLinkedList<string>;
  private nodeMap: Map<string, ListNode<string>>;

  constructor() {
    this.lruList = new DoublyLinkedList<string>();
    this.nodeMap = new Map();
  }

  shouldEvict(entry: CacheEntry, _config: CacheConfig): boolean {
    // Never auto-evict in SWR mode
    // Always serve stale entries
    // Eviction only happens when cache is full (via selectEvictionCandidate)
    return false;
  }

  onAccess(entry: CacheEntry): void {
    // Move to front of LRU list
    const node = this.nodeMap.get(entry.metadata.key);
    if (node) {
      this.lruList.moveToFront(node);
    }

    // Update access metadata
    entry.metadata.accessedAt = Date.now();
    entry.metadata.accessCount++;

    // Note: Application should check isExpired(entry) after getting
    // the value and trigger background refresh if needed
  }

  onSet(entry: CacheEntry): void {
    // Add to front of LRU list
    const existingNode = this.nodeMap.get(entry.metadata.key);

    if (existingNode) {
      this.lruList.moveToFront(existingNode);
    } else {
      const node = this.lruList.addFront(entry.metadata.key);
      this.nodeMap.set(entry.metadata.key, node);
    }
  }

  selectEvictionCandidate(
    entries: Map<string, CacheEntry>,
    _config: CacheConfig
  ): string | null {
    // Use LRU for eviction (prefer expired entries first)
    // First, check for very old stale entries (expired > 1 hour ago)
    const veryStaleThreshold = Date.now() - 3600000; // 1 hour

    for (const [key, entry] of entries) {
      if (
        entry.metadata.expiresAt !== null &&
        entry.metadata.expiresAt < veryStaleThreshold
      ) {
        return key;
      }
    }

    // Otherwise, use LRU (least recently used)
    return this.lruList.tail?.value ?? null;
  }

  /**
   * Remove key from tracking (called when entry is deleted)
   */
  removeKey(key: string): void {
    const node = this.nodeMap.get(key);
    if (node) {
      this.lruList.remove(node);
      this.nodeMap.delete(key);
    }
  }

  /**
   * Clear all tracking
   */
  clear(): void {
    this.lruList.clear();
    this.nodeMap.clear();
  }
}

/**
 * Get default strategy by name
 */
export function createStrategy(name: 'lru' | 'ttl' | 'swr'): CacheStrategy {
  switch (name) {
    case 'lru':
      return new LRUStrategy();
    case 'ttl':
      return new TTLStrategy();
    case 'swr':
      return new SWRStrategy();
    default:
      throw new Error(`Unknown strategy: ${name}`);
  }
}