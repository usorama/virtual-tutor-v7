/**
 * Filename Sanitization and Security
 * SEC-008: File Upload Security - Filename Sanitization
 *
 * This module provides comprehensive filename sanitization to prevent:
 * - Path traversal attacks (../, ..\\)
 * - XSS attacks via malicious filenames
 * - Directory traversal via encoded sequences
 * - Invalid characters for cross-platform compatibility
 *
 * OWASP Recommendations:
 * - Restrict filename length
 * - Restrict allowed characters
 * - Detect path traversal patterns
 * - Generate secure random filenames (UUID-based)
 *
 * @module lib/security/filename-sanitizer
 */

import type {
  FilenameSanitizationOptions,
  FilenameSanitizationResult
} from '@/types/file-security';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Patterns that indicate malicious filename attempts
 */
const MALICIOUS_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\.\./g, description: 'Path traversal sequence (..)' },
  { pattern: /\\/g, description: 'Backslash (path separator)' },
  { pattern: /\//g, description: 'Forward slash (path separator)' },
  { pattern: /[<>:"|?*]/g, description: 'Windows reserved characters' },
  { pattern: /[\x00-\x1f]/g, description: 'Control characters' },
  { pattern: /^\./, description: 'Leading dot (hidden file)' },
  { pattern: /\.$/, description: 'Trailing dot' },
  { pattern: /%2e%2e/gi, description: 'URL-encoded path traversal' },
  { pattern: /%2f/gi, description: 'URL-encoded forward slash' },
  { pattern: /%5c/gi, description: 'URL-encoded backslash' }
];

/**
 * Additional patterns for XSS prevention
 */
const XSS_PATTERNS: RegExp[] = [
  /<script/gi,
  /<iframe/gi,
  /javascript:/gi,
  /on\w+=/gi // Event handlers (onclick=, onerror=, etc.)
];

/**
 * Character replacements for safe filenames
 */
const SAFE_REPLACEMENTS: Record<string, string> = {
  ' ': '-',    // Replace spaces with hyphens
  '_': '-',    // Normalize underscores to hyphens
  '--': '-',   // Collapse multiple hyphens
  '---': '-'   // Collapse triple hyphens
};

/**
 * Filesystem limits
 */
const MAX_FILENAME_LENGTH = 255;  // Standard filesystem limit
const MAX_SAFE_LENGTH = 100;      // Safe length for cross-platform compatibility
const MIN_FILENAME_LENGTH = 1;

/**
 * Allowed characters in filenames (conservative whitelist)
 * Alphanumeric + hyphen + underscore + dot
 */
const ALLOWED_CHARS_PATTERN = /[^a-zA-Z0-9\-_.]/g;

// ============================================================================
// PATH TRAVERSAL DETECTION
// ============================================================================

/**
 * Detects path traversal attempts in filename
 *
 * Checks for various path traversal patterns including:
 * - Standard traversal (..)
 * - URL-encoded traversal (%2e%2e)
 * - Mixed separators (..\ ../  ../../)
 *
 * @param filename - Filename to check
 * @returns True if path traversal detected
 *
 * @example
 * detectPathTraversal('../etc/passwd.pdf'); // true
 * detectPathTraversal('chapter1.pdf'); // false
 */
export function detectPathTraversal(filename: string): boolean {
  const traversalPatterns = [
    /\.\./,           // Standard traversal
    /\.\.%2[fF]/,     // URL-encoded traversal (forward slash)
    /\.\.%5[cC]/,     // URL-encoded traversal (backslash)
    /%2e%2e/i,        // Double URL-encoded
    /\.\.\\/,         // Windows-style
    /\.\.\//          // Unix-style
  ];

  return traversalPatterns.some(pattern => pattern.test(filename));
}

/**
 * Detects malicious characters in filename
 *
 * Checks for characters that could be used for:
 * - XSS attacks
 * - Command injection
 * - Path manipulation
 *
 * @param filename - Filename to check
 * @returns True if malicious characters detected
 */
export function containsMaliciousCharacters(filename: string): boolean {
  // Check malicious patterns
  const hasMaliciousPattern = MALICIOUS_PATTERNS.some(({ pattern }) =>
    pattern.test(filename)
  );

  // Check XSS patterns
  const hasXSSPattern = XSS_PATTERNS.some(pattern => pattern.test(filename));

  return hasMaliciousPattern || hasXSSPattern;
}

// ============================================================================
// FILENAME EXTRACTION
// ============================================================================

/**
 * Extracts file extension from filename
 *
 * @param filename - Filename
 * @returns Extension (with dot) or empty string if none
 *
 * @example
 * extractExtension('document.pdf'); // '.pdf'
 * extractExtension('image.backup.jpg'); // '.jpg'
 * extractExtension('noextension'); // ''
 */
export function extractExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex);
}

/**
 * Extracts base name (without extension) from filename
 *
 * @param filename - Filename
 * @returns Base name without extension
 *
 * @example
 * extractBaseName('document.pdf'); // 'document'
 * extractBaseName('image.backup.jpg'); // 'image.backup'
 */
export function extractBaseName(filename: string): string {
  const extension = extractExtension(filename);
  return extension ? filename.slice(0, -extension.length) : filename;
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Normalizes filename (applies standard replacements)
 *
 * @param filename - Filename to normalize
 * @returns Normalized filename
 */
function normalizeFilename(filename: string): string {
  let normalized = filename;

  // Apply safe replacements
  for (const [char, replacement] of Object.entries(SAFE_REPLACEMENTS)) {
    normalized = normalized.split(char).join(replacement);
  }

  return normalized;
}

/**
 * Sanitizes filename to remove dangerous characters and patterns
 *
 * Process:
 * 1. Extract extension (preserve it)
 * 2. Remove malicious patterns from base name
 * 3. Apply character replacements
 * 4. Remove non-allowed characters
 * 5. Trim and normalize
 * 6. Enforce length limits
 *
 * @param filename - Original filename
 * @param options - Sanitization options
 * @returns Sanitized filename
 *
 * @example
 * sanitizeFilename('../etc/passwd.pdf'); // 'etcpasswd.pdf'
 * sanitizeFilename('<script>alert(1)</script>.pdf'); // 'scriptalert1script.pdf'
 * sanitizeFilename('my document (final).pdf'); // 'my-document-final.pdf'
 */
export function sanitizeFilename(
  filename: string,
  options: FilenameSanitizationOptions = {}
): string {
  const {
    maxLength = MAX_SAFE_LENGTH,
    preserveExtension = true,
    removeNonAscii = true
  } = options;

  // 1. Extract extension safely
  const extension = preserveExtension ? extractExtension(filename) : '';
  let baseName = extractBaseName(filename);

  // 2. Remove malicious patterns
  for (const { pattern } of MALICIOUS_PATTERNS) {
    baseName = baseName.replace(pattern, '');
  }

  // 3. Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    baseName = baseName.replace(pattern, '');
  }

  // 4. Normalize (replace spaces, underscores, etc.)
  baseName = normalizeFilename(baseName);

  // 5. Remove non-ASCII characters (if requested)
  if (removeNonAscii) {
    baseName = baseName.replace(/[^\x20-\x7E]/g, '');
  }

  // 6. Remove non-allowed characters (whitelist approach)
  baseName = baseName.replace(ALLOWED_CHARS_PATTERN, '');

  // 7. Trim whitespace
  baseName = baseName.trim();

  // 8. Collapse multiple hyphens
  baseName = baseName.replace(/-+/g, '-');

  // 9. Remove leading/trailing hyphens
  baseName = baseName.replace(/^-+|-+$/g, '');

  // 10. Ensure minimum length
  if (baseName.length < MIN_FILENAME_LENGTH) {
    baseName = 'file';
  }

  // 11. Enforce length limit (account for extension)
  const maxBaseLength = maxLength - extension.length;
  if (baseName.length > maxBaseLength) {
    baseName = baseName.slice(0, maxBaseLength);
  }

  // 12. Combine base name and extension
  return `${baseName}${extension}`;
}

/**
 * Performs comprehensive filename sanitization with security checks
 *
 * This function not only sanitizes the filename but also reports detected security issues.
 *
 * @param filename - Original filename
 * @param options - Sanitization options
 * @returns Sanitization result with security report
 *
 * @example
 * const result = sanitizeFilenameSecure('../etc/passwd.pdf');
 * if (!result.isSafe) {
 *   console.error('Security issues:', result.issues);
 * }
 * console.log('Safe filename:', result.sanitized);
 */
export function sanitizeFilenameSecure(
  filename: string,
  options: FilenameSanitizationOptions = {}
): FilenameSanitizationResult {
  const issues: string[] = [];

  // Check for path traversal
  const hasPathTraversal = detectPathTraversal(filename);
  if (hasPathTraversal) {
    issues.push('Path traversal pattern detected');
  }

  // Check for malicious characters
  const hasMaliciousChars = containsMaliciousCharacters(filename);
  if (hasMaliciousChars) {
    issues.push('Malicious characters detected');
  }

  // Check length
  if (filename.length > MAX_FILENAME_LENGTH) {
    issues.push(`Filename exceeds maximum length (${MAX_FILENAME_LENGTH} characters)`);
  }

  // Sanitize
  const sanitized = sanitizeFilename(filename, options);

  return {
    isSafe: issues.length === 0,
    original: filename,
    sanitized,
    issues,
    pathTraversalDetected: hasPathTraversal,
    maliciousCharactersDetected: hasMaliciousChars
  };
}

// ============================================================================
// SECURE FILENAME GENERATION
// ============================================================================

/**
 * Generates a secure UUID-based filename
 *
 * Format: {uuid}-{sanitized-original-name}{extension}
 * Example: a1b2c3d4-e5f6-4789-90ab-cdef12345678-chapter1.pdf
 *
 * This approach:
 * - Prevents filename collisions (UUID is unique)
 * - Prevents path traversal (UUID doesn't contain .. or /)
 * - Preserves original name for human readability (truncated)
 * - Maintains extension for MIME type detection
 *
 * @param originalFilename - Original filename
 * @param options - Sanitization options
 * @returns Secure UUID-based filename
 *
 * @example
 * generateSecureFilename('my document.pdf');
 * // Returns: 'a1b2c3d4-e5f6-4789-90ab-cdef12345678-my-document.pdf'
 */
export function generateSecureFilename(
  originalFilename: string,
  options: FilenameSanitizationOptions = {}
): string {
  const {
    preserveExtension = true
  } = options;

  // Generate UUID (using crypto.randomUUID if available, otherwise fallback)
  const uuid = crypto.randomUUID
    ? crypto.randomUUID()
    : generateUUIDFallback();

  // Extract and sanitize extension
  const extension = preserveExtension ? extractExtension(originalFilename) : '';

  // Sanitize original filename
  const sanitized = sanitizeFilename(originalFilename, {
    ...options,
    maxLength: 30 // Keep original name short (30 chars max)
  });

  // Remove extension from sanitized (we'll add it at the end)
  const sanitizedBase = sanitized.replace(extension, '');

  // Combine: {uuid}-{sanitized-name}{extension}
  return sanitizedBase
    ? `${uuid}-${sanitizedBase}${extension}`
    : `${uuid}${extension}`;
}

/**
 * Fallback UUID generator (for environments without crypto.randomUUID)
 */
function generateUUIDFallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates filename against security rules (without sanitizing)
 *
 * Useful for checking if a filename is safe without modifying it.
 *
 * @param filename - Filename to validate
 * @returns True if filename is safe
 */
export function isFilenameSafe(filename: string): boolean {
  return (
    !detectPathTraversal(filename) &&
    !containsMaliciousCharacters(filename) &&
    filename.length > 0 &&
    filename.length <= MAX_FILENAME_LENGTH
  );
}