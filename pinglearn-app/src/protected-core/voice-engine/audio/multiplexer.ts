/**
 * Audio Stream Multiplexer
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Combines and manages multiple audio streams (LiveKit + Gemini)
 */

export interface StreamSource {
  id: string;
  type: 'livekit' | 'gemini' | 'microphone';
  priority: number;
  active: boolean;
}

export interface MultiplexerConfig {
  maxStreams: number;
  mixingStrategy: 'priority' | 'blend' | 'switch';
  fallbackBehavior: 'silence' | 'last-good' | 'error';
}

export class AudioMultiplexer {
  private streams: Map<string, StreamSource> = new Map();
  private audioBuffers: Map<string, ArrayBuffer[]> = new Map();
  private config: MultiplexerConfig;
  private activeStreamId: string | null = null;
  private mixedOutput: ArrayBuffer | null = null;

  constructor(config: MultiplexerConfig = {
    maxStreams: 3,
    mixingStrategy: 'priority',
    fallbackBehavior: 'last-good'
  }) {
    this.config = config;
  }

  /**
   * Register a new audio stream
   */
  registerStream(source: StreamSource): void {
    if (this.streams.size >= this.config.maxStreams) {
      throw new Error(`Maximum streams (${this.config.maxStreams}) reached`);
    }

    this.streams.set(source.id, source);
    this.audioBuffers.set(source.id, []);

    // Update active stream based on priority
    this.updateActiveStream();
  }

  /**
   * Unregister an audio stream
   */
  unregisterStream(streamId: string): void {
    this.streams.delete(streamId);
    this.audioBuffers.delete(streamId);

    if (this.activeStreamId === streamId) {
      this.updateActiveStream();
    }
  }

  /**
   * Add audio data to a stream's buffer
   */
  addAudioData(streamId: string, audioData: ArrayBuffer): void {
    const buffer = this.audioBuffers.get(streamId);
    if (!buffer) {
      console.warn(`Stream ${streamId} not registered`);
      return;
    }

    buffer.push(audioData);

    // Limit buffer size to prevent memory issues
    if (buffer.length > 100) {
      buffer.shift(); // Remove oldest
    }
  }

  /**
   * Get mixed audio output
   */
  getMixedOutput(): ArrayBuffer | null {
    switch (this.config.mixingStrategy) {
      case 'priority':
        return this.getPriorityOutput();
      case 'blend':
        return this.getBlendedOutput();
      case 'switch':
        return this.getSwitchedOutput();
      default:
        return null;
    }
  }

  /**
   * Get output from highest priority active stream
   */
  private getPriorityOutput(): ArrayBuffer | null {
    if (!this.activeStreamId) {
      return this.handleFallback();
    }

    const buffer = this.audioBuffers.get(this.activeStreamId);
    if (!buffer || buffer.length === 0) {
      return this.handleFallback();
    }

    return buffer.shift() || null;
  }

  /**
   * Blend multiple streams together
   */
  private getBlendedOutput(): ArrayBuffer | null {
    const activeBuffers: ArrayBuffer[] = [];

    // Collect audio from all active streams
    this.streams.forEach((source, id) => {
      if (source.active) {
        const buffer = this.audioBuffers.get(id);
        if (buffer && buffer.length > 0) {
          const audioData = buffer.shift();
          if (audioData) {
            activeBuffers.push(audioData);
          }
        }
      }
    });

    if (activeBuffers.length === 0) {
      return this.handleFallback();
    }

    if (activeBuffers.length === 1) {
      return activeBuffers[0];
    }

    // Mix the audio streams
    return this.mixAudioBuffers(activeBuffers);
  }

  /**
   * Switch between streams based on activity
   */
  private getSwitchedOutput(): ArrayBuffer | null {
    // Find stream with most recent data
    let bestStreamId: string | null = null;
    let maxBufferSize = 0;

    this.streams.forEach((source, id) => {
      if (source.active) {
        const buffer = this.audioBuffers.get(id);
        if (buffer && buffer.length > maxBufferSize) {
          maxBufferSize = buffer.length;
          bestStreamId = id;
        }
      }
    });

    if (!bestStreamId) {
      return this.handleFallback();
    }

    const buffer = this.audioBuffers.get(bestStreamId);
    return buffer?.shift() || null;
  }

  /**
   * Mix multiple audio buffers together
   */
  private mixAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    // Find the maximum length
    let maxLength = 0;
    const float32Arrays: Float32Array[] = [];

    for (const buffer of buffers) {
      const array = new Float32Array(buffer);
      float32Arrays.push(array);
      maxLength = Math.max(maxLength, array.length);
    }

    // Create output buffer
    const mixed = new Float32Array(maxLength);

    // Mix samples
    for (let i = 0; i < maxLength; i++) {
      let sum = 0;
      let count = 0;

      for (const array of float32Arrays) {
        if (i < array.length) {
          sum += array[i];
          count++;
        }
      }

      // Average the samples
      mixed[i] = count > 0 ? sum / count : 0;

      // Soft clipping to prevent distortion
      if (mixed[i] > 0.95) {
        mixed[i] = 0.95;
      } else if (mixed[i] < -0.95) {
        mixed[i] = -0.95;
      }
    }

    return mixed.buffer;
  }

  /**
   * Update the active stream based on priority
   */
  private updateActiveStream(): void {
    let highestPriority = -1;
    let newActiveId: string | null = null;

    this.streams.forEach((source, id) => {
      if (source.active && source.priority > highestPriority) {
        highestPriority = source.priority;
        newActiveId = id;
      }
    });

    this.activeStreamId = newActiveId;
  }

  /**
   * Handle fallback when no audio is available
   */
  private handleFallback(): ArrayBuffer | null {
    switch (this.config.fallbackBehavior) {
      case 'silence':
        // Return silent audio
        return new Float32Array(1024).buffer;
      case 'last-good':
        // Return last mixed output if available
        return this.mixedOutput;
      case 'error':
        throw new Error('No audio available');
      default:
        return null;
    }
  }

  /**
   * Set stream priority
   */
  setStreamPriority(streamId: string, priority: number): void {
    const source = this.streams.get(streamId);
    if (source) {
      source.priority = priority;
      this.updateActiveStream();
    }
  }

  /**
   * Set stream active state
   */
  setStreamActive(streamId: string, active: boolean): void {
    const source = this.streams.get(streamId);
    if (source) {
      source.active = active;
      this.updateActiveStream();
    }
  }

  /**
   * Get bandwidth allocation for each stream
   */
  getBandwidthAllocation(): Map<string, number> {
    const allocations = new Map<string, number>();
    const totalPriority = Array.from(this.streams.values())
      .filter(s => s.active)
      .reduce((sum, s) => sum + s.priority, 0);

    if (totalPriority === 0) {
      return allocations;
    }

    this.streams.forEach((source, id) => {
      if (source.active) {
        const percentage = (source.priority / totalPriority) * 100;
        allocations.set(id, percentage);
      }
    });

    return allocations;
  }

  /**
   * Get stream statistics
   */
  getStreamStats(streamId: string): {
    bufferSize: number;
    isActive: boolean;
    priority: number;
  } | null {
    const source = this.streams.get(streamId);
    const buffer = this.audioBuffers.get(streamId);

    if (!source || !buffer) {
      return null;
    }

    return {
      bufferSize: buffer.length,
      isActive: source.active,
      priority: source.priority
    };
  }

  /**
   * Clear all buffers
   */
  clearBuffers(): void {
    this.audioBuffers.forEach(buffer => {
      buffer.length = 0;
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.streams.clear();
    this.audioBuffers.clear();
    this.activeStreamId = null;
    this.mixedOutput = null;
  }
}