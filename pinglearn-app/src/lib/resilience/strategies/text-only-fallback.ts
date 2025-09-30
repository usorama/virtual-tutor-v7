/**
 * ERR-005: Text-Only Fallback Strategy
 * Disables voice features and provides text-only interaction
 */

import type { OperationContext } from '../types';
import type { FallbackStrategy } from './fallback-strategy.interface';

/**
 * Text-Only Fallback Strategy
 *
 * Disables voice features and provides text-only interaction
 * when voice services fail.
 *
 * Use cases:
 * - Voice API failures
 * - Microphone access issues
 * - Audio processing errors
 * - Network bandwidth limitations
 */
export class TextOnlyFallbackStrategy implements FallbackStrategy {
  readonly name = 'text-only-fallback';

  private textOnlyMode = false;

  async canHandle(error: unknown, context: OperationContext): Promise<boolean> {
    // This strategy can handle voice-related operations
    return (
      context.operationType === 'voice_session' ||
      context.operationType === 'audio_processing' ||
      context.operationType === 'voice_interaction' ||
      (context.metadata?.component as string)?.includes('voice') ||
      false
    );
  }

  async execute<T>(context: OperationContext): Promise<T> {
    console.log(`[TextOnlyFallback] Switching to text-only mode`, {
      operationType: context.operationType,
      operationId: context.operationId,
    });

    // Enable text-only mode
    this.textOnlyMode = true;

    // Dispatch event to notify UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('voice-disabled', {
          detail: {
            reason: 'fallback',
            operationType: context.operationType,
            operationId: context.operationId,
          },
        })
      );
    }

    // Generate text-only response based on operation type
    const response = await this.generateTextOnlyResponse(context);

    return {
      ...response,
      _textOnlyMode: true,
      _voiceDisabled: true,
      _message:
        'Voice features are temporarily unavailable. Using text-only mode.',
    } as T;
  }

  /**
   * Generate appropriate text-only response
   */
  private async generateTextOnlyResponse(
    context: OperationContext
  ): Promise<Record<string, unknown>> {
    const { operationType, params } = context;

    switch (operationType) {
      case 'voice_session':
        return {
          sessionType: 'text-chat',
          features: {
            voice: false,
            text: true,
            math: true,
            realtime: false,
          },
          instructions:
            'You can type your questions and receive text responses.',
        };

      case 'audio_processing':
        return {
          processingType: 'text',
          features: {
            transcription: false,
            tts: false,
            textInput: true,
            textOutput: true,
          },
          instructions:
            'Audio processing is unavailable. Please type your input.',
        };

      case 'voice_interaction':
        return {
          interactionType: 'text',
          features: {
            voiceInput: false,
            voiceOutput: false,
            textInput: true,
            textOutput: true,
          },
          instructions: 'Switched to text-based interaction.',
        };

      default:
        return {
          mode: 'text-only',
          features: {
            voice: false,
            text: true,
          },
          instructions:
            'Voice features disabled. All interactions will be text-based.',
        };
    }
  }

  /**
   * Check if text-only mode is active
   */
  isTextOnlyMode(): boolean {
    return this.textOnlyMode;
  }

  /**
   * Enable text-only mode manually
   */
  enableTextOnlyMode(): void {
    this.textOnlyMode = true;
    console.log(`[TextOnlyFallback] Text-only mode enabled`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('voice-disabled', {
          detail: { reason: 'manual' },
        })
      );
    }
  }

  /**
   * Disable text-only mode (re-enable voice)
   */
  disableTextOnlyMode(): void {
    this.textOnlyMode = false;
    console.log(`[TextOnlyFallback] Text-only mode disabled`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('voice-enabled', {
          detail: { reason: 'manual' },
        })
      );
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.textOnlyMode = false;
  }
}