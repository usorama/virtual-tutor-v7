/**
 * Audio Codec Service
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Handles audio encoding and decoding for various formats
 */

export type AudioFormat = 'pcm' | 'opus' | 'mp3' | 'wav';
export type SampleRate = 8000 | 16000 | 24000 | 48000;

export interface CodecConfig {
  inputFormat: AudioFormat;
  outputFormat: AudioFormat;
  sampleRate: SampleRate;
  channels: number;
  bitrate?: number;
}

export class AudioCodec {
  private config: CodecConfig;

  constructor(config: CodecConfig) {
    this.config = config;
  }

  /**
   * Encode PCM audio to Opus format
   */
  async encodePCMToOpus(pcmData: ArrayBuffer): Promise<ArrayBuffer> {
    // For now, return the data as-is
    // In production, would use libopus.js or similar
    return pcmData;
  }

  /**
   * Decode Opus audio to PCM format
   */
  async decodeOpusToPCM(opusData: ArrayBuffer): Promise<ArrayBuffer> {
    // For now, return the data as-is
    // In production, would use libopus.js or similar
    return opusData;
  }

  /**
   * Convert sample rate
   */
  async resample(
    audioData: ArrayBuffer,
    fromRate: SampleRate,
    toRate: SampleRate
  ): Promise<ArrayBuffer> {
    if (fromRate === toRate) {
      return audioData;
    }

    const ratio = toRate / fromRate;
    const inputView = new Float32Array(audioData);
    const outputLength = Math.floor(inputView.length * ratio);
    const outputView = new Float32Array(outputLength);

    // Simple linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / ratio;
      const srcIndexInt = Math.floor(srcIndex);
      const srcIndexFrac = srcIndex - srcIndexInt;

      if (srcIndexInt >= inputView.length - 1) {
        outputView[i] = inputView[inputView.length - 1];
      } else {
        outputView[i] = inputView[srcIndexInt] * (1 - srcIndexFrac) +
                       inputView[srcIndexInt + 1] * srcIndexFrac;
      }
    }

    return outputView.buffer;
  }

  /**
   * Convert mono to stereo
   */
  monoToStereo(monoData: ArrayBuffer): ArrayBuffer {
    const monoView = new Float32Array(monoData);
    const stereoView = new Float32Array(monoView.length * 2);

    for (let i = 0; i < monoView.length; i++) {
      stereoView[i * 2] = monoView[i];     // Left channel
      stereoView[i * 2 + 1] = monoView[i]; // Right channel
    }

    return stereoView.buffer;
  }

  /**
   * Convert stereo to mono
   */
  stereoToMono(stereoData: ArrayBuffer): ArrayBuffer {
    const stereoView = new Float32Array(stereoData);
    const monoView = new Float32Array(stereoView.length / 2);

    for (let i = 0; i < monoView.length; i++) {
      // Average left and right channels
      monoView[i] = (stereoView[i * 2] + stereoView[i * 2 + 1]) / 2;
    }

    return monoView.buffer;
  }

  /**
   * Optimize bit rate
   */
  optimizeBitrate(audioData: ArrayBuffer, targetBitrate: number): ArrayBuffer {
    // Simplified: just return the original data
    // In production, would apply compression algorithms
    return audioData;
  }

  /**
   * Apply noise reduction
   */
  reduceNoise(audioData: ArrayBuffer): ArrayBuffer {
    const view = new Float32Array(audioData);
    const filtered = new Float32Array(view.length);

    // Simple low-pass filter for noise reduction
    const alpha = 0.8;
    filtered[0] = view[0];

    for (let i = 1; i < view.length; i++) {
      filtered[i] = alpha * filtered[i - 1] + (1 - alpha) * view[i];
    }

    return filtered.buffer;
  }

  /**
   * Normalize audio levels
   */
  normalizeAudio(audioData: ArrayBuffer): ArrayBuffer {
    const view = new Float32Array(audioData);

    // Find peak amplitude
    let maxAmplitude = 0;
    for (let i = 0; i < view.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(view[i]));
    }

    if (maxAmplitude === 0) {
      return audioData;
    }

    // Normalize to 0.95 to avoid clipping
    const normalizedView = new Float32Array(view.length);
    const normalizationFactor = 0.95 / maxAmplitude;

    for (let i = 0; i < view.length; i++) {
      normalizedView[i] = view[i] * normalizationFactor;
    }

    return normalizedView.buffer;
  }

  /**
   * Get codec configuration
   */
  getConfig(): CodecConfig {
    return { ...this.config };
  }
}