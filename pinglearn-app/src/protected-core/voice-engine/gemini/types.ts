/**
 * Gemini Live API Types
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Type definitions for Gemini Live API integration
 */

export interface GeminiConfig {
  model: 'gemini-2.0-flash-live';
  apiKey: string;
  region: string;
  responseModalities: string[];
  maxTokens?: number;
  temperature?: number;
  systemInstruction?: string;
}

export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  parts: GeminiPart[];
  timestamp?: number;
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded
  };
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

export interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason?: 'FINISH_REASON_UNSPECIFIED' | 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  index?: number;
  safetyRatings?: GeminiSafetyRating[];
}

export interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}

export interface GeminiSafetyRating {
  category: string;
  probability: string;
  blocked?: boolean;
}

// Streaming types for real-time responses
export interface GeminiStreamChunk {
  candidates?: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
}

export interface GeminiStreamConfig {
  enablePartialResults: boolean;
  enableWordTimeOffsets: boolean;
  enableAutomaticPunctuation: boolean;
}

// Audio configuration for voice input
export interface GeminiAudioConfig {
  encoding: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE';
  sampleRateHertz: number;
  audioChannelCount?: number;
  enableSeparateRecognitionPerChannel?: boolean;
  languageCode: string;
  alternativeLanguageCodes?: string[];
}

// Educational context types for math and learning
export interface EducationalContext {
  subject: 'mathematics' | 'science' | 'language' | 'history' | 'general';
  gradeLevel: 'elementary' | 'middle' | 'high' | 'college' | 'adult';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  currentTopic?: string;
  previousTopics?: string[];
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
}

// Math-specific types for equation rendering
export interface MathExpression {
  latex: string;
  description: string;
  context: 'equation' | 'formula' | 'theorem' | 'example' | 'problem';
  complexity: 'basic' | 'intermediate' | 'advanced';
}

// Session configuration
export interface GeminiSessionConfig extends GeminiConfig {
  educationalContext: EducationalContext;
  enableMathRendering: boolean;
  enableRealTimeTranscription: boolean;
  audioConfig: GeminiAudioConfig;
  streamConfig: GeminiStreamConfig;
}

// Error types
export interface GeminiError {
  code: number;
  message: string;
  status: string;
  details?: Record<string, unknown>;
}

// Connection state types
export type GeminiConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

// Event types for the service
export interface GeminiEvents {
  transcription: {
    text: string;
    timestamp: number;
    isFinal: boolean;
    confidence?: number;
    mathExpressions?: MathExpression[];
  };
  error: GeminiError;
  connectionChange: GeminiConnectionState;
  sessionStart: {
    sessionId: string;
    timestamp: number;
  };
  sessionEnd: {
    sessionId: string;
    timestamp: number;
    duration: number;
  };
}