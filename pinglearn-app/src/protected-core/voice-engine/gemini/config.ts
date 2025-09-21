/**
 * Gemini Configuration
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Configuration for Google Gemini Live API
 */

import { GeminiConfig, GeminiSessionConfig, EducationalContext, GeminiAudioConfig, GeminiStreamConfig } from './types';

/**
 * Default Gemini configuration
 */
export const DEFAULT_GEMINI_CONFIG: GeminiConfig = {
  model: 'gemini-2.0-flash-live',
  apiKey: process.env.GOOGLE_API_KEY || '',
  region: process.env.GEMINI_REGION || 'asia-south1',
  responseModalities: ['TEXT', 'AUDIO'],
  maxTokens: 8192,
  temperature: 0.7,
  systemInstruction: `You are an AI teacher in an educational platform. Your role is to:
1. Provide clear, patient explanations
2. Use mathematical notation when explaining math concepts
3. Speak at a moderate pace suitable for learning
4. Ask clarifying questions to ensure understanding
5. Provide examples and step-by-step solutions
6. Encourage and motivate students
7. Adapt your teaching style to the student's needs
8. Use LaTeX notation for math expressions (wrapped in $ for inline or $$ for block)

Always maintain a supportive and encouraging tone. Break complex concepts into simpler parts.
When teaching mathematics, show your work step by step.`
};

/**
 * Audio configuration for voice input
 */
export const DEFAULT_AUDIO_CONFIG: GeminiAudioConfig = {
  encoding: 'OGG_OPUS',
  sampleRateHertz: 48000,
  audioChannelCount: 1,
  enableSeparateRecognitionPerChannel: false,
  languageCode: 'en-US',
  alternativeLanguageCodes: ['en-IN', 'hi-IN']
};

/**
 * Stream configuration for real-time responses
 */
export const DEFAULT_STREAM_CONFIG: GeminiStreamConfig = {
  enablePartialResults: true,
  enableWordTimeOffsets: true,
  enableAutomaticPunctuation: true
};

/**
 * Default educational context
 */
export const DEFAULT_EDUCATIONAL_CONTEXT: EducationalContext = {
  subject: 'mathematics',
  gradeLevel: 'high',
  learningStyle: 'mixed',
  difficultyLevel: 3
};

/**
 * Create a complete session configuration
 */
export function createSessionConfig(
  overrides?: Partial<GeminiSessionConfig>
): GeminiSessionConfig {
  return {
    ...DEFAULT_GEMINI_CONFIG,
    educationalContext: overrides?.educationalContext || DEFAULT_EDUCATIONAL_CONTEXT,
    enableMathRendering: overrides?.enableMathRendering ?? true,
    enableRealTimeTranscription: overrides?.enableRealTimeTranscription ?? true,
    audioConfig: overrides?.audioConfig || DEFAULT_AUDIO_CONFIG,
    streamConfig: overrides?.streamConfig || DEFAULT_STREAM_CONFIG,
    ...overrides
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: GeminiSessionConfig): string[] {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('API key is required');
  }

  if (!config.model) {
    errors.push('Model name is required');
  }

  if (!config.region) {
    errors.push('Region is required');
  }

  if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (config.maxTokens && config.maxTokens < 1) {
    errors.push('Max tokens must be at least 1');
  }

  return errors;
}

/**
 * Get WebSocket URL for Gemini Live API
 */
export function getWebSocketUrl(config: GeminiConfig): string {
  // Gemini Live API WebSocket endpoint
  return `wss://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${config.apiKey}`;
}

/**
 * Format system instruction based on educational context
 */
export function formatSystemInstruction(context: EducationalContext): string {
  const subject = context.subject.charAt(0).toUpperCase() + context.subject.slice(1);
  const level = context.gradeLevel.charAt(0).toUpperCase() + context.gradeLevel.slice(1);

  let instruction = DEFAULT_GEMINI_CONFIG.systemInstruction + '\n\n';
  instruction += `Current Teaching Context:\n`;
  instruction += `- Subject: ${subject}\n`;
  instruction += `- Grade Level: ${level} school\n`;
  instruction += `- Learning Style: ${context.learningStyle}\n`;
  instruction += `- Difficulty Level: ${context.difficultyLevel}/5\n`;

  if (context.currentTopic) {
    instruction += `- Current Topic: ${context.currentTopic}\n`;
  }

  if (context.previousTopics && context.previousTopics.length > 0) {
    instruction += `- Previous Topics: ${context.previousTopics.join(', ')}\n`;
  }

  return instruction;
}

/**
 * Export configuration status
 */
export function isConfigured(): boolean {
  return !!process.env.GOOGLE_API_KEY;
}