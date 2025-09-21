/**
 * Display Buffer Implementation
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Manages display items for real-time transcription and content rendering
 */

interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  rendered?: string;
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'ai';
  confidence?: number;
}

export class DisplayBuffer {
  private items: DisplayItem[] = [];
  private maxItems = 1000;
  private subscribers: Set<(items: DisplayItem[]) => void> = new Set();

  addItem(item: Omit<DisplayItem, 'id' | 'timestamp'>): void {
    const newItem: DisplayItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.items.push(newItem);

    if (this.items.length > this.maxItems) {
      this.items.shift();
    }

    this.notifySubscribers();
  }

  getItems(count?: number): DisplayItem[] {
    if (count) {
      return this.items.slice(-count);
    }
    return [...this.items];
  }

  clearBuffer(): void {
    this.items = [];
    this.notifySubscribers();
  }

  subscribe(callback: (items: DisplayItem[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.items));
  }

  getBufferSize(): number {
    return this.items.length;
  }

  getLastItem(): DisplayItem | undefined {
    return this.items[this.items.length - 1];
  }

  removeItem(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  updateItem(id: string, updates: Partial<Omit<DisplayItem, 'id' | 'timestamp'>>): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates };
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  getItemsByType(type: DisplayItem['type']): DisplayItem[] {
    return this.items.filter(item => item.type === type);
  }

  getItemsBySpeaker(speaker: DisplayItem['speaker']): DisplayItem[] {
    return this.items.filter(item => item.speaker === speaker);
  }

  getItemsInTimeRange(startTime: number, endTime: number): DisplayItem[] {
    return this.items.filter(item =>
      item.timestamp >= startTime && item.timestamp <= endTime
    );
  }
}

// Global instance for singleton pattern
let globalDisplayBuffer: DisplayBuffer | null = null;

export function getDisplayBuffer(): DisplayBuffer {
  if (!globalDisplayBuffer) {
    globalDisplayBuffer = new DisplayBuffer();
  }
  return globalDisplayBuffer;
}

export function resetDisplayBuffer(): void {
  globalDisplayBuffer = null;
}

// Export the DisplayItem interface for external use
export type { DisplayItem };