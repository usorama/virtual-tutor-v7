/**
 * FS-00-AB-1: Unit Tests for DisplayBuffer Deduplication
 * Tests the deduplication logic that prevents duplicate transcript entries
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DisplayBuffer, type DisplayItem } from '@/protected-core';

describe('DisplayBuffer Deduplication', () => {
  let buffer: DisplayBuffer;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create a fresh buffer instance
    buffer = new DisplayBuffer();

    // Spy on console to verify deduplication logs
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    buffer.clearBuffer();
  });

  describe('Content Hashing', () => {
    it('should generate consistent hashes for identical content', () => {
      const content = 'This is a test transcript';

      // Add the same content twice with small delay
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      // Try to add duplicate within dedup window
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      // Verify deduplication occurred
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');

      // Verify only one item exists
      const items = buffer.getItems();
      expect(items).toHaveLength(1);
    });

    it('should allow different content even with same type and speaker', () => {
      // Add first item
      buffer.addItem({
        type: 'text',
        content: 'First transcript',
        speaker: 'teacher'
      });

      // Add different content
      buffer.addItem({
        type: 'text',
        content: 'Second transcript',
        speaker: 'teacher'
      });

      // Verify both items were added
      const items = buffer.getItems();
      expect(items).toHaveLength(2);
      expect(consoleSpy).not.toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
    });

    it('should detect duplicates regardless of metadata differences', () => {
      const content = 'Duplicate content test';

      // Add with one set of metadata
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher',
        confidence: 0.95
      });

      // Try to add with different metadata but same content
      buffer.addItem({
        type: 'math', // Different type
        content,
        speaker: 'student', // Different speaker
        confidence: 0.85 // Different confidence
      });

      // Should still detect as duplicate based on content
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
      expect(buffer.getItems()).toHaveLength(1);
    });
  });

  describe('Time Window Deduplication', () => {
    it('should prevent duplicates within the time window (1 second)', () => {
      const content = 'Time window test';

      // Add first item
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      // Try to add duplicate immediately (within window)
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      // Should be rejected
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
      expect(buffer.getItems()).toHaveLength(1);
    });

    it('should allow same content after time window expires', async () => {
      const content = 'Time window expiry test';

      // Add first item
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      // Wait for dedup window to expire (1000ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Add same content again
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      // Should be allowed after window
      expect(buffer.getItems()).toHaveLength(2);
    });

    it('should handle rapid duplicate attempts', () => {
      const content = 'Rapid duplicate test';

      // Try to add the same content 5 times rapidly
      for (let i = 0; i < 5; i++) {
        buffer.addItem({
          type: 'text',
          content,
          speaker: 'teacher'
        });
      }

      // Only first should be added
      expect(buffer.getItems()).toHaveLength(1);

      // Should have 4 deduplication warnings
      const dedupCalls = consoleSpy.mock.calls.filter(
        call => call[0] === '[DisplayBuffer] Duplicate item detected, skipping'
      );
      expect(dedupCalls).toHaveLength(4);
    });
  });

  describe('Recent Items Cleanup', () => {
    it('should clean up old entries from recent items map', async () => {
      // Add multiple different items
      for (let i = 0; i < 5; i++) {
        buffer.addItem({
          type: 'text',
          content: `Item ${i}`,
          speaker: 'teacher'
        });
      }

      // Wait for cleanup window
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Add new item to trigger cleanup
      buffer.addItem({
        type: 'text',
        content: 'Trigger cleanup',
        speaker: 'teacher'
      });

      // Verify all items were added (no false duplicates)
      expect(buffer.getItems()).toHaveLength(6);

      // Try to add first item again (should be allowed after cleanup)
      buffer.addItem({
        type: 'text',
        content: 'Item 0',
        speaker: 'teacher'
      });

      // Should be added as recent items were cleaned
      expect(buffer.getItems()).toHaveLength(7);
    });

    it('should maintain dedup map size efficiently', async () => {
      // Add many items over time
      for (let i = 0; i < 10; i++) {
        buffer.addItem({
          type: 'text',
          content: `Content ${i}`,
          speaker: 'teacher'
        });

        // Small delay between items
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // All items should be added (no false positives)
      expect(buffer.getItems()).toHaveLength(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      // Add item with empty content
      buffer.addItem({
        type: 'text',
        content: '',
        speaker: 'teacher'
      });

      // Should be added (empty is valid)
      expect(buffer.getItems()).toHaveLength(1);

      // Try to add duplicate empty content
      buffer.addItem({
        type: 'text',
        content: '',
        speaker: 'student'
      });

      // Should be deduplicated
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
      expect(buffer.getItems()).toHaveLength(1);
    });

    it('should handle very long content', () => {
      const longContent = 'x'.repeat(10000);

      // Add long content
      buffer.addItem({
        type: 'text',
        content: longContent,
        speaker: 'teacher'
      });

      // Try duplicate
      buffer.addItem({
        type: 'text',
        content: longContent,
        speaker: 'teacher'
      });

      // Should detect duplicate even for long content
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
      expect(buffer.getItems()).toHaveLength(1);
    });

    it('should handle special characters in content', () => {
      const specialContent = '∫(x²+√x)dx = x³/3 + (2/3)x^(3/2) + C';

      // Add content with special characters
      buffer.addItem({
        type: 'math',
        content: specialContent,
        speaker: 'teacher'
      });

      // Try duplicate
      buffer.addItem({
        type: 'math',
        content: specialContent,
        speaker: 'teacher'
      });

      // Should detect duplicate
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
      expect(buffer.getItems()).toHaveLength(1);
    });

    it('should handle unicode and emoji correctly', () => {
      const unicodeContent = '👨‍🏫 Teaching: こんにちは 世界 🌍';

      // Add unicode content
      buffer.addItem({
        type: 'text',
        content: unicodeContent,
        speaker: 'teacher'
      });

      // Try duplicate
      buffer.addItem({
        type: 'text',
        content: unicodeContent,
        speaker: 'teacher'
      });

      // Should detect duplicate
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
      expect(buffer.getItems()).toHaveLength(1);
    });
  });

  describe('Integration with Buffer Operations', () => {
    it('should maintain deduplication during buffer overflow', () => {
      // DisplayBuffer max size is 1000 items
      const maxItems = 1000;

      // Add items up to max
      for (let i = 0; i < maxItems; i++) {
        buffer.addItem({
          type: 'text',
          content: `Item ${i}`,
          speaker: 'teacher'
        });
      }

      expect(buffer.getItems()).toHaveLength(maxItems);

      // Add more items to trigger overflow
      for (let i = 0; i < 20; i++) {
        buffer.addItem({
          type: 'text',
          content: `Overflow ${i}`,
          speaker: 'teacher'
        });
      }

      // Buffer should maintain max size
      expect(buffer.getItems()).toHaveLength(maxItems);

      // Try to add duplicate of recent item
      buffer.addItem({
        type: 'text',
        content: 'Overflow 19',
        speaker: 'teacher'
      });

      // Should be deduplicated
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');
    });

    it('should handle clear operation correctly', () => {
      // Add some items
      buffer.addItem({
        type: 'text',
        content: 'Item 1',
        speaker: 'teacher'
      });

      buffer.addItem({
        type: 'text',
        content: 'Item 2',
        speaker: 'teacher'
      });

      // Clear buffer
      buffer.clearBuffer();

      // Verify buffer is empty
      expect(buffer.getItems()).toHaveLength(0);

      // Add same content again (should be deduplicated since dedup history persists)
      buffer.addItem({
        type: 'text',
        content: 'Item 1',
        speaker: 'teacher'
      });

      // Should be deduplicated (buffer clearing doesn't clear dedup history)
      expect(buffer.getItems()).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith('[DisplayBuffer] Duplicate item detected, skipping');

      // Add different content after clear
      buffer.addItem({
        type: 'text',
        content: 'New Item After Clear',
        speaker: 'teacher'
      });

      // Should be added successfully
      expect(buffer.getItems()).toHaveLength(1);
    });

    it('should work correctly with subscription notifications', () => {
      const callback = vi.fn();
      const unsubscribe = buffer.subscribe(callback);

      // Add unique item
      buffer.addItem({
        type: 'text',
        content: 'Unique item',
        speaker: 'teacher'
      });

      // Callback should be called
      expect(callback).toHaveBeenCalledTimes(1);

      // Try to add duplicate
      buffer.addItem({
        type: 'text',
        content: 'Unique item',
        speaker: 'teacher'
      });

      // Callback should NOT be called for duplicate
      expect(callback).toHaveBeenCalledTimes(1);

      // Cleanup
      unsubscribe();
    });
  });

  describe('Performance', () => {
    it('should handle high volume of unique items efficiently', () => {
      const startTime = performance.now();

      // Add 1000 unique items
      for (let i = 0; i < 1000; i++) {
        buffer.addItem({
          type: 'text',
          content: `Performance test item ${i}`,
          speaker: 'teacher'
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);

      // All items should be added (buffer max is 1000)
      expect(buffer.getItems()).toHaveLength(1000);
    });

    it('should handle deduplication checks efficiently', () => {
      const content = 'Dedup performance test';

      // Add initial item
      buffer.addItem({
        type: 'text',
        content,
        speaker: 'teacher'
      });

      const startTime = performance.now();

      // Try to add duplicate 100 times
      for (let i = 0; i < 100; i++) {
        buffer.addItem({
          type: 'text',
          content,
          speaker: 'teacher'
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Dedup checks should be fast (< 10ms for 100 checks)
      expect(duration).toBeLessThan(10);

      // Only one item should exist
      expect(buffer.getItems()).toHaveLength(1);
    });
  });
});