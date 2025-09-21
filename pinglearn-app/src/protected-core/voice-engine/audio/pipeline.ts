/**
 * Audio Processing Pipeline
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Handles audio preprocessing, noise reduction, and quality optimization
 */

export interface AudioPipelineConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  highpassFilter: boolean;
  compressionRatio?: number;
  noiseGateThreshold?: number;
}

export interface AudioProcessingState {
  inputLevel: number;
  outputLevel: number;
  noiseLevel: number;
  isClipping: boolean;
  isGated: boolean;
}

/**
 * Real-time audio processing pipeline for educational voice interactions
 */
export class AudioPipeline {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private noiseGateNode: GainNode | null = null;

  private isProcessing = false;
  private processingState: AudioProcessingState = {
    inputLevel: 0,
    outputLevel: 0,
    noiseLevel: 0,
    isClipping: false,
    isGated: false,
  };

  private config: AudioPipelineConfig;
  private monitoringInterval: number | null = null;

  constructor(config: Partial<AudioPipelineConfig> = {}) {
    this.config = {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      highpassFilter: true,
      compressionRatio: 3,
      noiseGateThreshold: -50, // dB
      ...config,
    };
  }

  /**
   * Initialize the audio pipeline
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context with optimal settings
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive',
      });

      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('Audio pipeline initialized');
    } catch (error) {
      console.error('Failed to initialize audio pipeline:', error);
      throw new Error(`Audio pipeline initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process input stream through the pipeline
   */
  async processInputStream(inputStream: MediaStream): Promise<MediaStream> {
    if (!this.audioContext) {
      throw new Error('Audio pipeline not initialized');
    }

    try {
      // Create source from input stream
      this.sourceNode = this.audioContext.createMediaStreamSource(inputStream);

      // Create processing chain
      this.setupProcessingChain();

      // Connect the chain
      this.connectProcessingChain();

      // Start monitoring
      this.startMonitoring();

      this.isProcessing = true;

      // Return processed stream
      return this.destinationNode!.stream;
    } catch (error) {
      console.error('Failed to process audio stream:', error);
      throw new Error(`Stream processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup the audio processing chain
   */
  private setupProcessingChain(): void {
    if (!this.audioContext) return;

    // 1. Highpass filter to remove low frequency noise
    if (this.config.highpassFilter) {
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'highpass';
      this.filterNode.frequency.value = 80; // Remove frequencies below 80Hz
      this.filterNode.Q.value = 0.7;
    }

    // 2. Noise gate to eliminate background noise
    this.noiseGateNode = this.audioContext.createGain();
    this.noiseGateNode.gain.value = 1.0;

    // 3. Dynamic range compressor for consistent levels
    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24; // dB
    this.compressorNode.knee.value = 30; // dB
    this.compressorNode.ratio.value = this.config.compressionRatio || 3;
    this.compressorNode.attack.value = 0.003; // 3ms
    this.compressorNode.release.value = 0.25; // 250ms

    // 4. Output gain control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // 5. Analyser for monitoring
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // 6. Destination for output stream
    this.destinationNode = this.audioContext.createMediaStreamDestination();
  }

  /**
   * Connect the processing chain
   */
  private connectProcessingChain(): void {
    if (!this.sourceNode || !this.destinationNode) return;

    let currentNode: AudioNode = this.sourceNode;

    // Connect highpass filter
    if (this.filterNode) {
      currentNode.connect(this.filterNode);
      currentNode = this.filterNode;
    }

    // Connect noise gate
    if (this.noiseGateNode) {
      currentNode.connect(this.noiseGateNode);
      currentNode = this.noiseGateNode;
    }

    // Connect compressor
    if (this.compressorNode) {
      currentNode.connect(this.compressorNode);
      currentNode = this.compressorNode;
    }

    // Connect gain
    if (this.gainNode) {
      currentNode.connect(this.gainNode);
      currentNode = this.gainNode;
    }

    // Connect analyser (for monitoring)
    if (this.analyserNode) {
      currentNode.connect(this.analyserNode);
      currentNode = this.analyserNode;
    }

    // Connect to destination
    currentNode.connect(this.destinationNode);
  }

  /**
   * Start real-time audio monitoring
   */
  private startMonitoring(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitor = () => {
      if (!this.analyserNode || !this.isProcessing) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate audio levels
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        sum += value;
        peak = Math.max(peak, value);
      }

      const average = sum / bufferLength;
      const normalizedAverage = average / 255;
      const normalizedPeak = peak / 255;

      // Update processing state
      this.processingState.inputLevel = normalizedAverage;
      this.processingState.outputLevel = normalizedAverage; // Same for now
      this.processingState.isClipping = normalizedPeak > 0.95;

      // Implement noise gate
      this.updateNoiseGate(normalizedAverage);

      // Continue monitoring
      requestAnimationFrame(monitor);
    };

    monitor();

    // Also set up interval-based monitoring for state updates
    this.monitoringInterval = window.setInterval(() => {
      this.updateProcessingState();
    }, 100); // Update every 100ms
  }

  /**
   * Update noise gate based on input level
   */
  private updateNoiseGate(level: number): void {
    if (!this.noiseGateNode) return;

    // Convert threshold from dB to linear
    const thresholdLinear = Math.pow(10, this.config.noiseGateThreshold! / 20);
    const normalizedThreshold = thresholdLinear * 255 / 255; // Normalize to 0-1

    if (level < normalizedThreshold) {
      // Apply gate - reduce gain
      this.noiseGateNode.gain.exponentialRampToValueAtTime(
        0.1, // Reduce to 10%
        this.audioContext!.currentTime + 0.01
      );
      this.processingState.isGated = true;
    } else {
      // Open gate - full gain
      this.noiseGateNode.gain.exponentialRampToValueAtTime(
        1.0,
        this.audioContext!.currentTime + 0.01
      );
      this.processingState.isGated = false;
    }
  }

  /**
   * Update processing state
   */
  private updateProcessingState(): void {
    // Calculate noise floor (this is a simplified estimation)
    if (this.processingState.isGated) {
      this.processingState.noiseLevel = this.processingState.inputLevel;
    }
  }

  /**
   * Set input gain
   */
  setInputGain(gain: number): void {
    if (!this.gainNode) return;

    // Clamp gain between 0 and 2 (0 to +6dB)
    const clampedGain = Math.max(0, Math.min(2, gain));

    this.gainNode.gain.exponentialRampToValueAtTime(
      clampedGain,
      this.audioContext!.currentTime + 0.1
    );
  }

  /**
   * Enable/disable noise suppression (software-based)
   */
  setNoiseSuppression(enabled: boolean): void {
    if (!this.noiseGateNode) return;

    if (enabled) {
      // More aggressive noise gate
      this.config.noiseGateThreshold = -45;
    } else {
      // Less aggressive noise gate
      this.config.noiseGateThreshold = -60;
    }
  }

  /**
   * Get current processing state
   */
  getProcessingState(): AudioProcessingState {
    return { ...this.processingState };
  }

  /**
   * Get audio level for visual feedback
   */
  getAudioLevel(): number {
    return this.processingState.inputLevel;
  }

  /**
   * Check if audio is clipping
   */
  isClipping(): boolean {
    return this.processingState.isClipping;
  }

  /**
   * Stop processing and clean up
   */
  async stop(): Promise<void> {
    this.isProcessing = false;

    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Disconnect nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }

    if (this.noiseGateNode) {
      this.noiseGateNode.disconnect();
      this.noiseGateNode = null;
    }

    if (this.compressorNode) {
      this.compressorNode.disconnect();
      this.compressorNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log('Audio pipeline stopped');
  }

  /**
   * Get optimal audio constraints for getUserMedia
   */
  static getOptimalConstraints(config: Partial<AudioPipelineConfig> = {}): MediaTrackConstraints {
    const finalConfig = {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...config,
    };

    return {
      echoCancellation: finalConfig.echoCancellation,
      noiseSuppression: finalConfig.noiseSuppression,
      autoGainControl: finalConfig.autoGainControl,
      sampleRate: finalConfig.sampleRate,
      channelCount: finalConfig.channelCount,
      // Advanced constraints for better quality
      suppressLocalAudioPlayback: false,
      googEchoCancellation: finalConfig.echoCancellation,
      googAutoGainControl: finalConfig.autoGainControl,
      googNoiseSuppression: finalConfig.noiseSuppression,
      googHighpassFilter: true,
      googTypingNoiseDetection: true,
      googAudioMirroring: false,
    } as MediaTrackConstraints;
  }
}