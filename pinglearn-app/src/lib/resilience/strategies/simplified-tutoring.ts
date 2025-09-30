/**
 * ERR-005: Simplified Tutoring Fallback Strategy
 * Provides simplified AI tutoring when full features fail
 */

import type { OperationContext } from '../types';
import type { FallbackStrategy } from './fallback-strategy.interface';

/**
 * Simplified Tutoring Fallback Strategy
 *
 * Provides a degraded but functional tutoring experience when
 * the full AI tutoring system fails.
 *
 * Simplifications:
 * - Shorter, simpler prompts
 * - Cached response patterns
 * - Pre-defined answer templates
 * - No advanced features (voice, real-time, etc.)
 */
export class SimplifiedTutoringStrategy implements FallbackStrategy {
  readonly name = 'simplified-tutoring';

  private responseTemplates: Map<string, string[]> = new Map([
    [
      'math-help',
      [
        "Let's break this problem down into smaller steps.",
        "I'll help you understand the key concepts first.",
        'Try solving a simpler version of this problem first.',
      ],
    ],
    [
      'explanation',
      [
        'Let me explain this concept in simpler terms.',
        'Here are the main points you need to understand.',
        'Think of it this way...',
      ],
    ],
    [
      'practice',
      [
        "Let's practice with a similar but easier problem.",
        'Try this step-by-step approach.',
        'Focus on understanding one concept at a time.',
      ],
    ],
  ]);

  async canHandle(error: unknown, context: OperationContext): Promise<boolean> {
    // This strategy can handle AI/tutoring related operations
    return (
      context.operationType === 'ai_tutoring' ||
      context.operationType === 'generate_explanation' ||
      context.operationType === 'practice_problem'
    );
  }

  async execute<T>(context: OperationContext): Promise<T> {
    console.log(`[SimplifiedTutoring] Providing simplified tutoring`, {
      operationType: context.operationType,
      operationId: context.operationId,
    });

    // Get operation type and parameters
    const { operationType, params } = context;

    // Generate simplified response based on operation type
    let response: unknown;

    switch (operationType) {
      case 'ai_tutoring':
        response = await this.generateSimplifiedTutoring(params);
        break;
      case 'generate_explanation':
        response = await this.generateSimplifiedExplanation(params);
        break;
      case 'practice_problem':
        response = await this.generateSimplifiedPractice(params);
        break;
      default:
        throw new Error(`Unsupported operation type: ${operationType}`);
    }

    // Add metadata indicating this is a simplified response
    return {
      ...response,
      _simplified: true,
      _fullFeaturesAvailable: false,
      _message:
        'Using simplified mode. Some features may be unavailable.',
    } as T;
  }

  /**
   * Generate simplified tutoring response
   */
  private async generateSimplifiedTutoring(
    params: Record<string, unknown> | undefined
  ): Promise<Record<string, unknown>> {
    const templates = this.responseTemplates.get('math-help') || [];
    const response = templates[Math.floor(Math.random() * templates.length)];

    return {
      response,
      suggestions: [
        'Try breaking down the problem',
        'Review the relevant concepts',
        'Practice similar problems',
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * Generate simplified explanation
   */
  private async generateSimplifiedExplanation(
    params: Record<string, unknown> | undefined
  ): Promise<Record<string, unknown>> {
    const templates = this.responseTemplates.get('explanation') || [];
    const response = templates[Math.floor(Math.random() * templates.length)];

    return {
      explanation: response,
      keyPoints: [
        'Understand the main concept',
        'Practice with examples',
        'Apply to different scenarios',
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * Generate simplified practice problem
   */
  private async generateSimplifiedPractice(
    params: Record<string, unknown> | undefined
  ): Promise<Record<string, unknown>> {
    const templates = this.responseTemplates.get('practice') || [];
    const response = templates[Math.floor(Math.random() * templates.length)];

    return {
      instruction: response,
      hints: [
        'Start with what you know',
        'Take it one step at a time',
        'Check your work as you go',
      ],
      timestamp: Date.now(),
    };
  }

  /**
   * Add custom response template
   */
  addTemplate(category: string, template: string): void {
    const existing = this.responseTemplates.get(category) || [];
    existing.push(template);
    this.responseTemplates.set(category, existing);
  }

  /**
   * Get available templates
   */
  getTemplates(): Map<string, string[]> {
    return new Map(this.responseTemplates);
  }
}