/**
 * Audio Stream Manager
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Manages bidirectional audio streaming between LiveKit and Gemini
 */

export interface AudioStreamConfig {
  sampleRate: number;
  channels: number;
  encoding: 'pcm' | 'opus' | 'mp3';
  bitrate?: number;
  bufferSize?: number;
}

export interface StreamMetrics {
  packetsReceived: number;
  packetsSent: number;
  packetsLost: number;
  jitter: number;
  latency: number;
  bitrate: number;
}

export class AudioStreamManager {
  private inputStream: MediaStream | null = null;
  private outputStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private config: AudioStreamConfig;
  private metrics: StreamMetrics;
  private buffers: Map<string, ArrayBuffer[]> = new Map();
  private isStreaming = false;

  constructor(config: AudioStreamConfig = {
    sampleRate: 48000,
    channels: 1,
    encoding: 'opus',
    bufferSize: 4096
  }) {
    this.config = config;
    this.metrics = {
      packetsReceived: 0,
      packetsSent: 0,
      packetsLost: 0,
      jitter: 0,
      latency: 0,
      bitrate: 0
    };
  }

  /**
   * Initialize audio context and streams
   */
  async initialize(): Promise<void> {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate
      });
    }
  }

  /**
   * Start audio streaming
   */
  async startStreaming(inputSource?: MediaStream): Promise<void> {
    if (this.isStreaming) {
      console.warn('Already streaming');
      return;
    }

    await this.initialize();

    if (inputSource) {
      this.inputStream = inputSource;
    } else if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      // Get user's microphone
      this.inputStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    }

    this.isStreaming = true;
    this.startMetricsCollection();
  }

  /**
   * Stop audio streaming
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    this.isStreaming = false;

    if (this.inputStream) {
      this.inputStream.getTracks().forEach(track => track.stop());
      this.inputStream = null;
    }

    if (this.outputStream) {
      this.outputStream.getTracks().forEach(track => track.stop());
      this.outputStream = null;
    }

    this.stopMetricsCollection();
  }

  /**
   * Process incoming audio data
   */
  async processIncomingAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.isStreaming) {
      return;
    }

    this.metrics.packetsReceived++;

    // Buffer management
    const streamId = 'incoming';
    if (!this.buffers.has(streamId)) {
      this.buffers.set(streamId, []);
    }

    const buffer = this.buffers.get(streamId)!;
    buffer.push(audioData);

    // Process when buffer reaches threshold
    if (buffer.length >= 10) {
      await this.processBufferedAudio(streamId);
    }
  }

  /**
   * Process outgoing audio data
   */
  async processOutgoingAudio(): Promise<ArrayBuffer | null> {
    if (!this.isStreaming || !this.inputStream) {
      return null;
    }

    // Get audio data from input stream
    const audioData = await this.captureAudioFrame();

    if (audioData) {
      this.metrics.packetsSent++;
    }

    return audioData;
  }

  /**
   * Capture single audio frame from input stream
   */
  private async captureAudioFrame(): Promise<ArrayBuffer | null> {
    if (!this.audioContext || !this.inputStream) {
      return null;
    }

    return new Promise((resolve) => {
      const source = this.audioContext!.createMediaStreamSource(this.inputStream!);
      const processor = this.audioContext!.createScriptProcessor(
        this.config.bufferSize || 4096,
        this.config.channels,
        this.config.channels
      );

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);
        const arrayBuffer = new ArrayBuffer(channelData.length * 2);
        const view = new Int16Array(arrayBuffer);

        // Convert float32 to int16
        for (let i = 0; i < channelData.length; i++) {
          const s = Math.max(-1, Math.min(1, channelData[i]));
          view[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        source.disconnect();
        processor.disconnect();
        resolve(arrayBuffer);
      };

      source.connect(processor);
      processor.connect(this.audioContext!.destination);

      // Timeout after 100ms
      setTimeout(() => {
        source.disconnect();
        processor.disconnect();
        resolve(null);
      }, 100);
    });
  }

  /**
   * Process buffered audio
   */
  private async processBufferedAudio(streamId: string): Promise<void> {
    const buffer = this.buffers.get(streamId);
    if (!buffer || buffer.length === 0) {
      return;
    }

    // Combine buffers
    const totalLength = buffer.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const buf of buffer) {
      combined.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    // Clear buffer
    buffer.length = 0;

    // Play audio if it's incoming
    if (streamId === 'incoming' && this.audioContext) {
      await this.playAudio(combined.buffer);
    }
  }

  /**
   * Play audio through speakers
   */
  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      return;
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  /**
   * Start collecting metrics
   */
  private startMetricsCollection(): void {
    // Update metrics every second
    const interval = setInterval(() => {
      if (!this.isStreaming) {
        clearInterval(interval);
        return;
      }

      // Calculate jitter (simplified)
      this.metrics.jitter = Math.random() * 5; // Mock for now

      // Calculate latency (simplified)
      this.metrics.latency = 50 + Math.random() * 50; // Mock for now

      // Calculate bitrate
      const bitsPerSecond = (this.metrics.packetsSent * this.config.bufferSize! * 16) / 1;
      this.metrics.bitrate = bitsPerSecond;
    }, 1000);
  }

  /**
   * Stop collecting metrics
   */
  private stopMetricsCollection(): void {
    // Metrics collection stops automatically when streaming stops
  }

  /**
   * Get current stream metrics
   */
  getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  /**
   * Get stream configuration
   */
  getConfig(): AudioStreamConfig {
    return { ...this.config };
  }

  /**
   * Check if currently streaming
   */
  isActive(): boolean {
    return this.isStreaming;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.stopStreaming();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.buffers.clear();
  }
}