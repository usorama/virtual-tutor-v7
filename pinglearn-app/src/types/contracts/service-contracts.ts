/**
 * Service Contracts and Interfaces - ARCH-001 Implementation
 *
 * This file defines service contracts to enable dependency inversion and
 * eliminate circular dependencies between layers. Services implement these
 * contracts, and consumers depend on contracts, not implementations.
 *
 * Features:
 * - Clear service boundaries and responsibilities
 * - Dependency inversion principle implementation
 * - Type-safe service interactions
 * - Mockable interfaces for testing
 */

import { EventData } from '@/lib/events/event-bus';

// =============================================================================
// BASE CONTRACT INTERFACES
// =============================================================================

/**
 * Base result interface for all service operations
 */
export interface ServiceResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ServiceError;
  readonly metadata?: {
    readonly timestamp: string;
    readonly duration: number;
    readonly requestId: string;
  };
}

/**
 * Service error interface
 */
export interface ServiceError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Progress callback interface for long-running operations
 */
export interface ProgressCallback {
  onProgress(progress: number): void;
  onStatusUpdate?(status: string): void;
  onComplete?(result: unknown): void;
  onError?(error: ServiceError): void;
}

// =============================================================================
// TEXTBOOK SERVICE CONTRACTS
// =============================================================================

/**
 * Textbook processing result
 */
export interface ProcessedTextbook {
  readonly id: string;
  readonly title: string;
  readonly author?: string;
  readonly totalPages: number;
  readonly chapters: TextbookChapter[];
  readonly metadata: TextbookMetadata;
  readonly processingStats: {
    readonly duration: number;
    readonly chunksCreated: number;
    readonly topicsExtracted: number;
  };
}

/**
 * Textbook chapter interface
 */
export interface TextbookChapter {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly startPage: number;
  readonly endPage: number;
  readonly topics: string[];
  readonly contentChunks: ContentChunk[];
}

/**
 * Content chunk interface
 */
export interface ContentChunk {
  readonly id: string;
  readonly index: number;
  readonly content: string;
  readonly type: 'text' | 'example' | 'exercise' | 'summary';
  readonly pageNumber: number;
  readonly tokenCount: number;
}

/**
 * Textbook metadata
 */
export interface TextbookMetadata {
  readonly subject: string;
  readonly grade: string;
  readonly language: string;
  readonly curriculum: string;
  readonly isbn?: string;
  readonly publisher?: string;
  readonly publishYear?: number;
}

/**
 * Validation result for textbook uploads
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly metadata?: Partial<TextbookMetadata>;
}

/**
 * Textbook processor contract - Service Layer
 */
export interface TextbookProcessorContract {
  /**
   * Process uploaded textbook file
   */
  processTextbook(
    file: File,
    metadata: Partial<TextbookMetadata>,
    progressCallback?: ProgressCallback
  ): Promise<ServiceResult<ProcessedTextbook>>;

  /**
   * Validate textbook file before processing
   */
  validateTextbook(file: File): Promise<ServiceResult<ValidationResult>>;

  /**
   * Extract metadata from textbook file
   */
  extractMetadata(file: File): Promise<ServiceResult<TextbookMetadata>>;

  /**
   * Get processing status
   */
  getProcessingStatus(textbookId: string): Promise<ServiceResult<ProcessingStatus>>;

  /**
   * Cancel ongoing processing
   */
  cancelProcessing(textbookId: string): Promise<ServiceResult<boolean>>;
}

/**
 * Processing status interface
 */
export interface ProcessingStatus {
  readonly textbookId: string;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  readonly progress: number;
  readonly currentStep: string;
  readonly estimatedTimeRemaining?: number;
  readonly error?: ServiceError;
}

// =============================================================================
// UPLOAD SERVICE CONTRACTS
// =============================================================================

/**
 * Upload configuration
 */
export interface UploadConfig {
  readonly maxFileSize: number;
  readonly allowedTypes: string[];
  readonly uploadEndpoint: string;
  readonly chunkSize: number;
  readonly maxConcurrentUploads: number;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  readonly fileId: string;
  readonly filename: string;
  readonly uploadedBytes: number;
  readonly totalBytes: number;
  readonly progress: number;
  readonly speed: number; // bytes per second
  readonly timeRemaining: number; // seconds
  readonly status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
}

/**
 * Upload result
 */
export interface UploadResult {
  readonly fileId: string;
  readonly filename: string;
  readonly url: string;
  readonly size: number;
  readonly type: string;
  readonly uploadedAt: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Upload service contract - Service Layer
 */
export interface UploadServiceContract {
  /**
   * Upload single file with progress tracking
   */
  uploadFile(
    file: File,
    config?: Partial<UploadConfig>,
    progressCallback?: ProgressCallback
  ): Promise<ServiceResult<UploadResult>>;

  /**
   * Upload multiple files
   */
  uploadFiles(
    files: File[],
    config?: Partial<UploadConfig>,
    progressCallback?: ProgressCallback
  ): Promise<ServiceResult<UploadResult[]>>;

  /**
   * Resume paused upload
   */
  resumeUpload(fileId: string): Promise<ServiceResult<boolean>>;

  /**
   * Pause ongoing upload
   */
  pauseUpload(fileId: string): Promise<ServiceResult<boolean>>;

  /**
   * Cancel upload
   */
  cancelUpload(fileId: string): Promise<ServiceResult<boolean>>;

  /**
   * Get upload progress
   */
  getUploadProgress(fileId: string): Promise<ServiceResult<UploadProgress>>;

  /**
   * Validate file before upload
   */
  validateFile(file: File, config?: Partial<UploadConfig>): ServiceResult<ValidationResult>;
}

// =============================================================================
// VOICE SERVICE CONTRACTS
// =============================================================================

/**
 * Voice session configuration
 */
export interface VoiceSessionConfig {
  readonly userId: string;
  readonly topic: string;
  readonly language: string;
  readonly voiceSettings: VoiceSettings;
  readonly transcriptionEnabled: boolean;
  readonly recordingEnabled: boolean;
}

/**
 * Voice settings
 */
export interface VoiceSettings {
  readonly voice: string;
  readonly speed: number;
  readonly pitch: number;
  readonly volume: number;
  readonly language: string;
}

/**
 * Voice session state
 */
export interface VoiceSessionState {
  readonly sessionId: string;
  readonly status: 'connecting' | 'connected' | 'disconnected' | 'ended' | 'error';
  readonly duration: number;
  readonly participantCount: number;
  readonly isRecording: boolean;
  readonly transcriptionActive: boolean;
}

/**
 * Transcription data
 */
export interface TranscriptionData {
  readonly sessionId: string;
  readonly text: string;
  readonly confidence: number;
  readonly timestamp: string;
  readonly speaker: 'user' | 'ai';
  readonly isFinal: boolean;
  readonly language: string;
}

/**
 * Voice service contract - Service Layer
 */
export interface VoiceServiceContract {
  /**
   * Start new voice session
   */
  startSession(
    config: VoiceSessionConfig,
    progressCallback?: ProgressCallback
  ): Promise<ServiceResult<VoiceSessionState>>;

  /**
   * End voice session
   */
  endSession(sessionId: string): Promise<ServiceResult<boolean>>;

  /**
   * Get session state
   */
  getSessionState(sessionId: string): Promise<ServiceResult<VoiceSessionState>>;

  /**
   * Start recording
   */
  startRecording(sessionId: string): Promise<ServiceResult<boolean>>;

  /**
   * Stop recording
   */
  stopRecording(sessionId: string): Promise<ServiceResult<string>>; // Returns recording URL

  /**
   * Enable transcription
   */
  enableTranscription(sessionId: string): Promise<ServiceResult<boolean>>;

  /**
   * Disable transcription
   */
  disableTranscription(sessionId: string): Promise<ServiceResult<boolean>>;

  /**
   * Send message to AI
   */
  sendMessage(sessionId: string, message: string): Promise<ServiceResult<string>>;
}

// =============================================================================
// USER SERVICE CONTRACTS
// =============================================================================

/**
 * User profile data
 */
export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly avatarUrl?: string;
  readonly role: 'student' | 'teacher' | 'admin';
  readonly preferences: UserPreferences;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'system';
  readonly language: string;
  readonly notifications: NotificationSettings;
  readonly accessibility: AccessibilitySettings;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  readonly email: boolean;
  readonly push: boolean;
  readonly sessionReminders: boolean;
  readonly progressUpdates: boolean;
}

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  readonly highContrast: boolean;
  readonly fontSize: 'small' | 'medium' | 'large';
  readonly reducedMotion: boolean;
  readonly screenReader: boolean;
}

/**
 * Authentication result
 */
export interface AuthResult {
  readonly user: UserProfile;
  readonly token: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
}

/**
 * User service contract - Service Layer
 */
export interface UserServiceContract {
  /**
   * Authenticate user
   */
  authenticate(email: string, password: string): Promise<ServiceResult<AuthResult>>;

  /**
   * Register new user
   */
  register(userData: RegisterUserData): Promise<ServiceResult<UserProfile>>;

  /**
   * Get user profile
   */
  getProfile(userId: string): Promise<ServiceResult<UserProfile>>;

  /**
   * Update user profile
   */
  updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ServiceResult<UserProfile>>;

  /**
   * Update user preferences
   */
  updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<ServiceResult<UserPreferences>>;

  /**
   * Reset password
   */
  resetPassword(email: string): Promise<ServiceResult<boolean>>;

  /**
   * Logout user
   */
  logout(userId: string): Promise<ServiceResult<boolean>>;
}

/**
 * Registration data
 */
export interface RegisterUserData {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly role: 'student' | 'teacher';
  readonly preferences?: Partial<UserPreferences>;
}

// =============================================================================
// SESSION SERVICE CONTRACTS
// =============================================================================

/**
 * Learning session data
 */
export interface LearningSession {
  readonly id: string;
  readonly userId: string;
  readonly textbookId: string;
  readonly chapterId?: string;
  readonly topic: string;
  readonly status: 'active' | 'paused' | 'completed' | 'cancelled';
  readonly startTime: string;
  readonly endTime?: string;
  readonly duration: number;
  readonly progress: SessionProgress;
  readonly metadata: Record<string, unknown>;
}

/**
 * Session progress tracking
 */
export interface SessionProgress {
  readonly questionsAsked: number;
  readonly questionsAnswered: number;
  readonly correctAnswers: number;
  readonly topicsCovered: string[];
  readonly completionPercentage: number;
  readonly learningObjectivesCompleted: string[];
}

/**
 * Session metrics
 */
export interface SessionMetrics {
  readonly sessionId: string;
  readonly totalTime: number;
  readonly activeTime: number;
  readonly idleTime: number;
  readonly interactionCount: number;
  readonly averageResponseTime: number;
  readonly engagementScore: number;
}

/**
 * Session service contract - Service Layer
 */
export interface SessionServiceContract {
  /**
   * Start new learning session
   */
  startSession(
    userId: string,
    textbookId: string,
    topic: string,
    chapterId?: string
  ): Promise<ServiceResult<LearningSession>>;

  /**
   * End learning session
   */
  endSession(sessionId: string): Promise<ServiceResult<SessionMetrics>>;

  /**
   * Update session progress
   */
  updateProgress(
    sessionId: string,
    progress: Partial<SessionProgress>
  ): Promise<ServiceResult<SessionProgress>>;

  /**
   * Get session details
   */
  getSession(sessionId: string): Promise<ServiceResult<LearningSession>>;

  /**
   * Get user sessions
   */
  getUserSessions(
    userId: string,
    filters?: {
      status?: LearningSession['status'];
      textbookId?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ServiceResult<LearningSession[]>>;

  /**
   * Pause session
   */
  pauseSession(sessionId: string): Promise<ServiceResult<boolean>>;

  /**
   * Resume session
   */
  resumeSession(sessionId: string): Promise<ServiceResult<boolean>>;
}

// =============================================================================
// NOTIFICATION SERVICE CONTRACTS
// =============================================================================

/**
 * Notification data
 */
export interface Notification {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly read: boolean;
  readonly createdAt: string;
  readonly readAt?: string;
  readonly actionUrl?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Notification types
 */
export type NotificationType =
  | 'session_reminder'
  | 'progress_update'
  | 'system_announcement'
  | 'textbook_processed'
  | 'achievement_unlocked'
  | 'error_alert'
  | 'maintenance_notice';

/**
 * Notification service contract - Service Layer
 */
export interface NotificationServiceContract {
  /**
   * Send notification to user
   */
  sendNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt' | 'readAt'>
  ): Promise<ServiceResult<Notification>>;

  /**
   * Get user notifications
   */
  getUserNotifications(
    userId: string,
    filters?: {
      unreadOnly?: boolean;
      type?: NotificationType;
      priority?: Notification['priority'];
    }
  ): Promise<ServiceResult<Notification[]>>;

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Promise<ServiceResult<boolean>>;

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): Promise<ServiceResult<number>>;

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Promise<ServiceResult<boolean>>;
}

// =============================================================================
// SERVICE REGISTRY INTERFACE
// =============================================================================

/**
 * Service registry for dependency injection
 */
export interface ServiceRegistry {
  readonly textbookProcessor: TextbookProcessorContract;
  readonly uploadService: UploadServiceContract;
  readonly voiceService: VoiceServiceContract;
  readonly userService: UserServiceContract;
  readonly sessionService: SessionServiceContract;
  readonly notificationService: NotificationServiceContract;
}

/**
 * Service factory interface
 */
export interface ServiceFactory {
  createTextbookProcessor(): TextbookProcessorContract;
  createUploadService(): UploadServiceContract;
  createVoiceService(): VoiceServiceContract;
  createUserService(): UserServiceContract;
  createSessionService(): SessionServiceContract;
  createNotificationService(): NotificationServiceContract;
}