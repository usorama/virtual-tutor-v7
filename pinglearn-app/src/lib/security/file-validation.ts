/**
 * Comprehensive File Validation System
 * SEC-008: File Upload Security - Main Orchestrator
 *
 * This module provides the central file validation system that orchestrates:
 * - File extension validation (whitelist)
 * - File size validation (configurable limits)
 * - Filename security checks
 * - Magic number verification (file signature)
 *
 * This implements OWASP File Upload Security best practices with a
 * defense-in-depth approach (multiple validation layers).
 *
 * @module lib/security/file-validation
 */

import type {
  FileValidationOptions,
  FileValidationResult,
  ValidationCheck,
  FileValidationPreset,
  FileType
} from '@/types/file-security';

import {
  validateFileTypeMagicNumber,
  getExtensionForFileType
} from './magic-number-validator';

import {
  sanitizeFilename,
  detectPathTraversal,
  containsMaliciousCharacters
} from './filename-sanitizer';

// ============================================================================
// CONFIGURATION PRESETS
// ============================================================================

/**
 * Validation configuration for textbook uploads (PDFs)
 *
 * These limits are based on:
 * - Average textbook PDF size: 20-40 MB
 * - Max practical size: 50 MB (prevents DoS, reasonable for educational content)
 * - Magic number check: REQUIRED for PDFs (ensures file integrity)
 *
 * @example
 * // Use this preset for textbook uploads
 * const options = getValidationOptionsForFileType('textbook');
 * const result = await validateUploadedFile(pdfFile, options);
 */
const TEXTBOOK_VALIDATION_OPTIONS: FileValidationOptions = {
  allowedExtensions: ['.pdf'],
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  requireMagicNumberCheck: true,
  allowedMimeTypes: ['application/pdf']
};

/**
 * Validation configuration for image uploads (covers, metadata)
 *
 * These limits are based on:
 * - Typical cover image size: 500 KB - 2 MB
 * - Max practical size: 5 MB (prevents DoS, adequate for high-quality images)
 * - Magic number check: REQUIRED (prevents file type spoofing)
 *
 * @example
 * // Use this preset for cover images and metadata
 * const options = getValidationOptionsForFileType('image');
 * const result = await validateUploadedFile(imageFile, options);
 */
const IMAGE_VALIDATION_OPTIONS: FileValidationOptions = {
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  requireMagicNumberCheck: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
};

/**
 * Validation configuration for general documents
 *
 * These limits are based on:
 * - Typical document size: 1-5 MB
 * - Max practical size: 10 MB (prevents DoS, reasonable for documents)
 * - Magic number check: DISABLED (DOC/DOCX not supported in current implementation)
 *
 * NOTE: Magic number validation only supports PDF. For DOC/DOCX, we rely on
 * extension and MIME type validation only. Consider implementing DOC/DOCX
 * magic number checks in the future.
 *
 * @example
 * // Use this preset for general document uploads
 * const options = getValidationOptionsForFileType('document');
 * const result = await validateUploadedFile(docFile, options);
 */
const DOCUMENT_VALIDATION_OPTIONS: FileValidationOptions = {
  allowedExtensions: ['.pdf', '.doc', '.docx'],
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  requireMagicNumberCheck: false, // DOC/DOCX not supported for magic number check
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

/**
 * Map of presets to configurations
 */
const VALIDATION_PRESETS: Record<FileValidationPreset, FileValidationOptions> = {
  textbook: TEXTBOOK_VALIDATION_OPTIONS,
  image: IMAGE_VALIDATION_OPTIONS,
  document: DOCUMENT_VALIDATION_OPTIONS
};

// ============================================================================
// INDIVIDUAL VALIDATORS
// ============================================================================

/**
 * Validates file extension against whitelist
 *
 * OWASP Recommendation: Always use whitelist (not blacklist) for extensions.
 * Much easier to specify allowed extensions than to enumerate all dangerous ones.
 *
 * @param filename - Filename to validate
 * @param allowedExtensions - Allowed extensions (with dots, e.g., ['.pdf', '.jpg'])
 * @returns Validation check result
 *
 * @example
 * const check = validateFileExtension('document.pdf', ['.pdf']);
 * if (!check.passed) {
 *   console.error(check.message);
 * }
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): ValidationCheck {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  if (!extension) {
    return {
      passed: false,
      message: 'File has no extension',
      details: { filename, allowedExtensions }
    };
  }

  const isAllowed = allowedExtensions
    .map(ext => ext.toLowerCase())
    .includes(extension);

  return {
    passed: isAllowed,
    message: isAllowed
      ? `File extension validated: ${extension}`
      : `Invalid file extension: ${extension}. Allowed: ${allowedExtensions.join(', ')}`,
    details: { filename, extension, allowedExtensions, isAllowed }
  };
}

/**
 * Validates file size against maximum limit
 *
 * OWASP Recommendation: Set maximum file size to prevent DoS attacks
 * and excessive storage consumption.
 *
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns Validation check result
 *
 * @example
 * const check = validateFileSize(file.size, 50 * 1024 * 1024); // 50 MB
 */
export function validateFileSize(
  size: number,
  maxSize: number
): ValidationCheck {
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);
  const maxSizeInMB = (maxSize / (1024 * 1024)).toFixed(2);

  const isWithinLimit = size <= maxSize;

  return {
    passed: isWithinLimit,
    message: isWithinLimit
      ? `File size validated: ${sizeInMB} MB`
      : `File too large: ${sizeInMB} MB. Maximum allowed: ${maxSizeInMB} MB`,
    details: {
      sizeBytes: size,
      maxSizeBytes: maxSize,
      sizeMB: parseFloat(sizeInMB),
      maxSizeMB: parseFloat(maxSizeInMB),
      isWithinLimit
    }
  };
}

/**
 * Validates filename for security issues
 *
 * Checks for:
 * - Path traversal attempts
 * - Malicious characters (XSS, command injection)
 * - Invalid length
 *
 * @param filename - Filename to validate
 * @returns Validation check result
 *
 * @example
 * const check = validateFileName('../etc/passwd.pdf');
 * if (!check.passed) {
 *   console.error(check.message);
 * }
 */
export function validateFileName(filename: string): ValidationCheck {
  const issues: string[] = [];

  // Check for path traversal
  if (detectPathTraversal(filename)) {
    issues.push('Path traversal pattern detected');
  }

  // Check for malicious characters
  if (containsMaliciousCharacters(filename)) {
    issues.push('Malicious characters detected');
  }

  // Check length
  if (filename.length === 0) {
    issues.push('Filename is empty');
  } else if (filename.length > 255) {
    issues.push('Filename exceeds maximum length (255 characters)');
  }

  const passed = issues.length === 0;

  return {
    passed,
    message: passed
      ? 'Filename validated successfully'
      : `Filename security issues: ${issues.join(', ')}`,
    details: {
      filename,
      issues,
      hasPathTraversal: detectPathTraversal(filename),
      hasMaliciousChars: containsMaliciousCharacters(filename),
      length: filename.length
    }
  };
}

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Gets default validation options (same as textbook preset)
 *
 * @returns Default validation options
 */
export function getDefaultValidationOptions(): FileValidationOptions {
  return { ...TEXTBOOK_VALIDATION_OPTIONS };
}

/**
 * Gets validation options for a specific file type preset
 *
 * @param preset - File type preset
 * @returns Validation options for the preset
 *
 * @example
 * const options = getValidationOptionsForFileType('textbook');
 * const result = await validateUploadedFile(file, options);
 */
export function getValidationOptionsForFileType(
  preset: FileValidationPreset
): FileValidationOptions {
  const config = VALIDATION_PRESETS[preset];
  if (!config) {
    throw new Error(`Unknown validation preset: ${preset}`);
  }
  return { ...config };
}

/**
 * Gets all available validation presets
 *
 * @returns Array of preset names
 */
export function getAvailablePresets(): FileValidationPreset[] {
  return Object.keys(VALIDATION_PRESETS) as FileValidationPreset[];
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validates an uploaded file against comprehensive security checks
 *
 * This is the main validation function that orchestrates all security checks:
 * 1. Extension validation (whitelist)
 * 2. File size validation
 * 3. Filename security checks
 * 4. Magic number verification (if required)
 *
 * IMPORTANT: This function performs defense-in-depth validation. Even if one
 * check fails, it continues with other checks to provide complete feedback.
 *
 * @param file - File to validate
 * @param options - Validation options (or use preset)
 * @returns Promise resolving to validation result
 *
 * @example
 * // Using preset
 * const options = getValidationOptionsForFileType('textbook');
 * const result = await validateUploadedFile(file, options);
 *
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors);
 *   return;
 * }
 *
 * // File is valid, proceed with upload
 * const secureName = result.metadata.sanitizedFilename;
 */
export async function validateUploadedFile(
  file: File,
  options: FileValidationOptions = getDefaultValidationOptions()
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    isValid: true,
    checks: {
      extension: { passed: true },
      size: { passed: true },
      filename: { passed: true }
    },
    errors: [],
    warnings: [],
    metadata: {
      originalFilename: file.name,
      sanitizedFilename: sanitizeFilename(file.name),
      fileSize: file.size,
      validatedAt: new Date()
    }
  };

  // Check 1: Extension validation
  result.checks.extension = validateFileExtension(
    file.name,
    options.allowedExtensions
  );

  if (!result.checks.extension.passed) {
    result.isValid = false;
    result.errors.push(result.checks.extension.message || 'Invalid file extension');
  }

  // Check 2: Size validation
  result.checks.size = validateFileSize(file.size, options.maxFileSize);

  if (!result.checks.size.passed) {
    result.isValid = false;
    result.errors.push(result.checks.size.message || 'File size exceeds limit');
  }

  // Check 3: Filename security
  result.checks.filename = validateFileName(file.name);

  if (!result.checks.filename.passed) {
    result.isValid = false;
    result.errors.push(result.checks.filename.message || 'Filename security issue');
  }

  // Check 4: Magic number verification (if required and extension is valid)
  if (options.requireMagicNumberCheck && result.checks.extension.passed) {
    try {
      // Determine expected file type from extension
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const expectedType = getFileTypeFromExtension(extension);

      if (expectedType) {
        result.checks.magicNumber = await validateFileTypeMagicNumber(
          file,
          expectedType
        );

        if (!result.checks.magicNumber.passed) {
          result.isValid = false;
          result.errors.push(
            result.checks.magicNumber.message || 'File signature verification failed'
          );
        } else {
          // Add detected type to metadata
          result.metadata.detectedType = expectedType;
        }
      } else {
        // Extension valid but no magic number signature available
        result.warnings.push(
          `Magic number check skipped: No signature available for ${extension}`
        );
      }
    } catch (error) {
      result.warnings.push(
        `Magic number check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return result;
}

/**
 * Validates multiple files in batch
 *
 * @param files - Files to validate
 * @param options - Validation options
 * @returns Promise resolving to array of validation results
 *
 * @example
 * const results = await validateMultipleFiles(files, options);
 * const failedFiles = results.filter(r => !r.isValid);
 */
export async function validateMultipleFiles(
  files: File[],
  options: FileValidationOptions = getDefaultValidationOptions()
): Promise<FileValidationResult[]> {
  return Promise.all(files.map(file => validateUploadedFile(file, options)));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Maps file extension to FileType for magic number validation
 *
 * @param extension - File extension (with dot, e.g., '.pdf')
 * @returns FileType or null if not supported
 */
function getFileTypeFromExtension(extension: string): FileType | null {
  const ext = extension.toLowerCase();
  const mapping: Record<string, FileType> = {
    '.pdf': 'pdf',
    '.jpg': 'jpeg',
    '.jpeg': 'jpeg',
    '.png': 'png',
    '.gif': 'gif'
  };
  return mapping[ext] || null;
}

/**
 * Formats file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted size string
 *
 * @example
 * formatFileSize(1536000); // '1.46 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Creates user-friendly error message from validation result
 *
 * @param result - Validation result
 * @returns User-friendly error message
 *
 * @example
 * const message = getValidationErrorMessage(result);
 * alert(message);
 */
export function getValidationErrorMessage(result: FileValidationResult): string {
  if (result.isValid) {
    return 'File validation passed';
  }

  const errors = result.errors.join('. ');
  return `File validation failed: ${errors}`;
}