/**
 * Type definitions for file upload security
 * SEC-008: File Upload Security Implementation
 *
 * This module provides comprehensive type definitions for:
 * - File validation (extension, size, filename, magic numbers)
 * - Upload rate limiting (per-user, per-IP)
 * - Security error handling
 *
 * @module types/file-security
 */

// ============================================================================
// FILE VALIDATION TYPES
// ============================================================================

/**
 * Configuration options for file validation
 */
export interface FileValidationOptions {
  /** Allowed file extensions (e.g., ['.pdf', '.jpg']) */
  allowedExtensions: string[];

  /** Maximum file size in bytes */
  maxFileSize: number;

  /** Whether to perform magic number verification */
  requireMagicNumberCheck: boolean;

  /** Allowed MIME types (optional, for additional verification) */
  allowedMimeTypes?: string[];
}

/**
 * Result of file validation operation
 */
export interface FileValidationResult {
  /** Whether the file passed all validation checks */
  isValid: boolean;

  /** Individual validation check results */
  checks: {
    extension: ValidationCheck;
    size: ValidationCheck;
    filename: ValidationCheck;
    magicNumber?: ValidationCheck;
  };

  /** List of validation errors */
  errors: string[];

  /** List of validation warnings (non-blocking) */
  warnings: string[];

  /** Metadata about the validated file */
  metadata: {
    originalFilename: string;
    sanitizedFilename: string;
    detectedType?: string;
    fileSize: number;
    validatedAt: Date;
  };
}

/**
 * Result of an individual validation check
 */
export interface ValidationCheck {
  /** Whether the check passed */
  passed: boolean;

  /** Human-readable message about the check result */
  message?: string;

  /** Additional details about the check (for debugging) */
  details?: Record<string, unknown>;
}

// ============================================================================
// MAGIC NUMBER TYPES
// ============================================================================

/**
 * Supported file types for magic number validation
 */
export type FileType = 'pdf' | 'jpeg' | 'png' | 'gif';

/**
 * Result of file type detection via magic number
 */
export interface DetectedFileType {
  /** Detected file type */
  type: FileType;

  /** MIME type corresponding to the detected type */
  mimeType: string;

  /** File extension corresponding to the detected type */
  extension: string;

  /** Confidence level of detection (0-1) */
  confidence: number;

  /** Hex representation of the magic number */
  signature: string;
}

/**
 * Magic number signature definition
 */
export interface MagicNumberSignature {
  /** File type */
  type: FileType;

  /** Magic number byte sequence */
  signature: number[];

  /** Offset in the file where signature is expected (usually 0) */
  offset: number;

  /** MIME type for this file type */
  mimeType: string;

  /** Standard file extension */
  extension: string;
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  readonly allowed: boolean;

  /** Number of attempts remaining in current window */
  readonly remaining: number;

  /** Seconds until the rate limit window resets */
  readonly resetIn: number;

  /** Reason for rate limit denial (if applicable) */
  readonly reason?: 'RATE_LIMIT_EXCEEDED';
}

/**
 * Status information for a rate-limited identifier
 */
export interface RateLimitStatus {
  /** The identifier being rate-limited */
  identifier: string;

  /** Attempts in short window (e.g., 15 minutes) */
  attemptsShort: number;

  /** Attempts in long window (e.g., 1 hour) */
  attemptsLong: number;

  /** Timestamp of first attempt in short window */
  firstAttemptShort: number;

  /** Timestamp of first attempt in long window */
  firstAttemptLong: number;

  /** Timestamp when short window resets */
  nextResetShort: number;

  /** Timestamp when long window resets */
  nextResetLong: number;
}

/**
 * Internal rate limit entry (stored in rate limiter)
 */
export interface UploadRateLimitEntry {
  /** Number of uploads in short window */
  attemptsShort: number;

  /** Number of uploads in long window */
  attemptsLong: number;

  /** Timestamp of first upload in short window */
  firstAttemptShort: number;

  /** Timestamp of first upload in long window */
  firstAttemptLong: number;

  /** Timestamp of most recent upload */
  lastAttempt: number;

  /** Total bytes uploaded (for bandwidth tracking) */
  totalBytesUploaded: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * File security error codes
 */
export type FileSecurityErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILENAME'
  | 'MAGIC_NUMBER_MISMATCH'
  | 'PATH_TRAVERSAL_DETECTED'
  | 'UPLOAD_RATE_LIMIT_EXCEEDED'
  | 'MALICIOUS_FILE_DETECTED';

/**
 * File security error
 */
export interface FileSecurityError {
  /** Error code */
  code: FileSecurityErrorCode;

  /** Technical error message (for logging) */
  message: string;

  /** Additional error details */
  details?: Record<string, unknown>;

  /** User-friendly error message */
  userMessage: string;
}

// ============================================================================
// FILENAME SANITIZATION TYPES
// ============================================================================

/**
 * Options for filename sanitization
 */
export interface FilenameSanitizationOptions {
  /** Maximum filename length */
  maxLength?: number;

  /** Whether to preserve the original extension */
  preserveExtension?: boolean;

  /** Whether to remove non-ASCII characters */
  removeNonAscii?: boolean;

  /** Whether to generate UUID-based secure filename */
  generateSecureName?: boolean;
}

/**
 * Result of filename sanitization
 */
export interface FilenameSanitizationResult {
  /** Whether the filename is safe */
  isSafe: boolean;

  /** Original filename */
  original: string;

  /** Sanitized filename */
  sanitized: string;

  /** Detected security issues */
  issues: string[];

  /** Whether path traversal was detected */
  pathTraversalDetected: boolean;

  /** Whether malicious characters were detected */
  maliciousCharactersDetected: boolean;
}

// ============================================================================
// CONFIGURATION PRESETS
// ============================================================================

/**
 * Predefined validation configurations for common use cases
 */
export type FileValidationPreset = 'textbook' | 'image' | 'document';

/**
 * Mapping of presets to validation options
 */
export interface FileValidationPresetConfig {
  textbook: FileValidationOptions;
  image: FileValidationOptions;
  document: FileValidationOptions;
}