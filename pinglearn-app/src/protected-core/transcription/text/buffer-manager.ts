/**
 * Buffer Manager for Transcription Service
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Manages circular buffer with search and cleanup capabilities
 */

import { DisplayItem, ProcessedText } from '../../contracts/transcription.contract';

interface BufferConfig {
  maxSize: number;
  cleanupInterval: number; // milliseconds
  maxAge: number; // milliseconds
}

export class BufferManager {
  private displayBuffer: DisplayItem[] = [];
  private processedTextBuffer: ProcessedText[] = [];
  private config: BufferConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<BufferConfig>) {
    this.config = {
      maxSize: 1000,
      cleanupInterval: 60000, // 1 minute
      maxAge: 300000, // 5 minutes
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Add item to display buffer
   */
  addItem(item: DisplayItem): void {
    this.displayBuffer.push(item);
    this.maintainBufferSize();
  }

  /**
   * Add processed text to buffer
   */
  addProcessedText(processedText: ProcessedText): void {
    this.processedTextBuffer.push(processedText);
    this.maintainBufferSize();
  }

  /**
   * Get current display buffer
   */
  getBuffer(): DisplayItem[] {
    return [...this.displayBuffer];
  }

  /**
   * Get processed text buffer
   */
  getProcessedTextBuffer(): ProcessedText[] {
    return [...this.processedTextBuffer];
  }

  /**
   * Clear all buffers
   */
  clearBuffer(): void {
    this.displayBuffer = [];
    this.processedTextBuffer = [];
  }

  /**
   * Get buffer size
   */
  getSize(): number {
    return this.displayBuffer.length;
  }

  /**
   * Search buffer for text
   */
  search(query: string): DisplayItem[] {
    const normalizedQuery = query.toLowerCase().trim();

    return this.displayBuffer.filter(item => {
      const content = item.content.toLowerCase();
      return content.includes(normalizedQuery) ||
             (item.metadata?.tags &&
              item.metadata.tags.some((tag: string) =>
                tag.toLowerCase().includes(normalizedQuery)
              ));
    });
  }

  /**
   * Search by type
   */
  searchByType(type: DisplayItem['type']): DisplayItem[] {
    return this.displayBuffer.filter(item => item.type === type);
  }

  /**
   * Search by speaker
   */
  searchBySpeaker(speaker: 'student' | 'teacher'): DisplayItem[] {
    return this.displayBuffer.filter(item => item.speaker === speaker);
  }

  /**
   * Search by time range
   */
  searchByTimeRange(startTime: number, endTime: number): DisplayItem[] {
    return this.displayBuffer.filter(item =>
      item.timestamp >= startTime && item.timestamp <= endTime
    );
  }

  /**
   * Get recent items
   */
  getRecent(count: number = 10): DisplayItem[] {
    return this.displayBuffer
      .slice(-count)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get items by page
   */
  getPage(page: number, pageSize: number = 20): DisplayItem[] {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return this.displayBuffer.slice(startIndex, endIndex);
  }

  /**
   * Export buffer to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      displayBuffer: this.displayBuffer,
      processedTextBuffer: this.processedTextBuffer,
      exportedAt: Date.now(),
      bufferSize: this.displayBuffer.length,
    }, null, 2);
  }

  /**
   * Import buffer from JSON
   */
  importFromJSON(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.displayBuffer && Array.isArray(data.displayBuffer)) {
        this.displayBuffer = data.displayBuffer;
      }

      if (data.processedTextBuffer && Array.isArray(data.processedTextBuffer)) {
        this.processedTextBuffer = data.processedTextBuffer;
      }

      return true;
    } catch (error) {
      console.error('Failed to import buffer:', error);
      return false;
    }
  }

  /**
   * Get buffer statistics
   */
  getStatistics(): {
    totalItems: number;
    typeDistribution: Record<string, number>;
    speakerDistribution: Record<string, number>;
    oldestItem: number;
    newestItem: number;
    averageItemAge: number;
  } {
    const now = Date.now();
    const typeDistribution: Record<string, number> = {};
    const speakerDistribution: Record<string, number> = {};
    let totalAge = 0;
    let oldestTimestamp = now;
    let newestTimestamp = 0;

    for (const item of this.displayBuffer) {
      // Type distribution
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;

      // Speaker distribution
      if (item.speaker) {
        speakerDistribution[item.speaker] = (speakerDistribution[item.speaker] || 0) + 1;
      }

      // Age calculations
      totalAge += now - item.timestamp;
      oldestTimestamp = Math.min(oldestTimestamp, item.timestamp);
      newestTimestamp = Math.max(newestTimestamp, item.timestamp);
    }

    return {
      totalItems: this.displayBuffer.length,
      typeDistribution,
      speakerDistribution,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp,
      averageItemAge: this.displayBuffer.length > 0 ? totalAge / this.displayBuffer.length : 0,
    };
  }

  /**
   * Maintain buffer size (circular buffer behavior)
   */
  private maintainBufferSize(): void {
    // Remove oldest items if buffer exceeds max size
    while (this.displayBuffer.length > this.config.maxSize) {
      this.displayBuffer.shift();
    }

    while (this.processedTextBuffer.length > this.config.maxSize) {
      this.processedTextBuffer.shift();
    }
  }

  /**
   * Clean up old items based on age
   */
  private cleanupOldItems(): void {
    const now = Date.now();
    const maxAge = this.config.maxAge;

    this.displayBuffer = this.displayBuffer.filter(item =>
      now - item.timestamp <= maxAge
    );

    this.processedTextBuffer = this.processedTextBuffer.filter(item =>
      now - item.timestamp <= maxAge
    );
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupOldItems();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Update buffer configuration
   */
  updateConfig(newConfig: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer with new interval
    this.startCleanupTimer();

    // Apply new max size immediately
    this.maintainBufferSize();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clearBuffer();
  }
}