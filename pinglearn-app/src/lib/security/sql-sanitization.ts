/**
 * SQL Sanitization Utilities for PingLearn
 *
 * Security Implementation: SEC-007
 * Based on: OWASP SQL Injection Prevention + Defense in Depth
 * Integrates with: SQL Injection Detector, Input Sanitization
 *
 * This module provides SQL-specific input sanitization functions as an
 * additional defense layer on top of Supabase's parameterized queries.
 *
 * Note: These are defense-in-depth utilities. Supabase client already
 * protects against SQL injection. These functions provide additional safety.
 */

import { detectSQLInjection } from './sql-injection-detector';

/**
 * Sanitization result
 */
export interface SanitizationResult {
  readonly sanitized: string;
  readonly modified: boolean;
  readonly removedPatterns: string[];
  readonly originalLength: number;
  readonly sanitizedLength: number;
}

/**
 * Sanitization options
 */
export interface SanitizationOptions {
  readonly maxLength?: number;
  readonly neutralizeKeywords?: boolean;
  readonly removeComments?: boolean;
  readonly escapeQuotes?: boolean;
  readonly removeSemicolons?: boolean;
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: Required<SanitizationOptions> = {
  maxLength: 500,
  neutralizeKeywords: true,
  removeComments: true,
  escapeQuotes: true,
  removeSemicolons: true
};

/**
 * Dangerous SQL keywords that should be neutralized in user input
 */
const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'EXEC',
  'EXECUTE',
  'SCRIPT',
  'UNION',
  'INSERT',
  'UPDATE',
  'GRANT',
  'REVOKE',
  'SHUTDOWN',
  'KILL'
] as const;

/**
 * Escape SQL special characters in string
 *
 * This function escapes characters that have special meaning in SQL to prevent
 * injection attacks. It's a defense-in-depth measure since Supabase uses
 * parameterized queries.
 *
 * @param input - The string to escape
 * @returns Escaped string safe for SQL
 *
 * @example
 * ```typescript
 * const escaped = escapeSQLString("O'Reilly");
 * console.log(escaped); // "O''Reilly"
 * ```
 */
export function escapeSQLString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')      // Escape backslashes
    .replace(/'/g, "''")         // Escape single quotes (SQL standard)
    .replace(/"/g, '""')         // Escape double quotes
    .replace(/\0/g, '\\0')       // Escape null bytes
    .replace(/\n/g, '\\n')       // Escape newlines
    .replace(/\r/g, '\\r')       // Escape carriage returns
    .replace(/\x1a/g, '\\Z')     // Escape EOF character (Ctrl+Z)
    .replace(/\t/g, '\\t');      // Escape tabs
}

/**
 * Neutralize dangerous SQL keywords
 *
 * Wraps dangerous SQL keywords in brackets to neutralize them while
 * preserving the original text content.
 *
 * @param input - The string to neutralize
 * @returns String with neutralized keywords
 *
 * @example
 * ```typescript
 * const safe = neutralizeSQLKeywords("DROP TABLE users");
 * console.log(safe); // "[DROP] [TABLE] users"
 * ```
 */
export function neutralizeSQLKeywords(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  for (const keyword of DANGEROUS_KEYWORDS) {
    // Case-insensitive replacement with word boundaries
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    sanitized = sanitized.replace(regex, `[${keyword}]`);
  }

  return sanitized;
}

/**
 * Remove SQL comments from input
 *
 * Removes all types of SQL comments that could be used to bypass security
 * or hide malicious code.
 *
 * @param input - The string to process
 * @returns String with comments removed
 *
 * @example
 * ```typescript
 * const clean = removeSQLComments("SELECT * FROM users -- admin only");
 * console.log(clean); // "SELECT * FROM users "
 * ```
 */
export function removeSQLComments(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/--[^\n]*/g, '')          // Remove -- comments
    .replace(/#[^\n]*/g, '')           // Remove # comments (MySQL style)
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ block comments
}

/**
 * Remove semicolons (statement terminators)
 *
 * Removes semicolons that could be used for stacked queries attack.
 *
 * @param input - The string to process
 * @returns String with semicolons removed
 *
 * @example
 * ```typescript
 * const safe = removeSemicolons("SELECT * FROM users; DROP TABLE users;");
 * console.log(safe); // "SELECT * FROM users DROP TABLE users"
 * ```
 */
export function removeSemicolons(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/;/g, '');
}

/**
 * Limit input length
 *
 * Truncates input to maximum length to prevent buffer overflow and
 * excessively long malicious inputs.
 *
 * @param input - The string to limit
 * @param maxLength - Maximum allowed length
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * const limited = limitInputLength("Very long string...", 10);
 * console.log(limited); // "Very long "
 * ```
 */
export function limitInputLength(
  input: string,
  maxLength: number = 255
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  if (input.length > maxLength) {
    return input.substring(0, maxLength);
  }

  return input;
}

/**
 * Remove excessive whitespace
 *
 * Normalizes whitespace to prevent obfuscation attacks using excessive
 * spaces, tabs, or newlines.
 *
 * @param input - The string to normalize
 * @returns String with normalized whitespace
 *
 * @example
 * ```typescript
 * const clean = normalizeWhitespace("SELECT    *    FROM     users");
 * console.log(clean); // "SELECT * FROM users"
 * ```
 */
export function normalizeWhitespace(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();               // Remove leading/trailing whitespace
}

/**
 * Comprehensive sanitization for database inputs
 *
 * Applies multiple sanitization techniques based on options.
 * This is the main function to use for comprehensive protection.
 *
 * @param input - The input string to sanitize
 * @param options - Sanitization options
 * @returns Sanitization result with details
 *
 * @example
 * ```typescript
 * const result = sanitizeForDatabase("'; DROP TABLE users; --");
 * console.log(result.sanitized); // Sanitized, safe string
 * console.log(result.modified); // true
 * console.log(result.removedPatterns); // ['SQL_COMMENT', 'SEMICOLON']
 * ```
 */
export function sanitizeForDatabase(
  input: string,
  options?: SanitizationOptions
): SanitizationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalInput = input;
  const originalLength = input?.length || 0;
  const removedPatterns: string[] = [];

  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      modified: false,
      removedPatterns: [],
      originalLength: 0,
      sanitizedLength: 0
    };
  }

  let sanitized = input;

  // 1. Remove comments
  if (opts.removeComments) {
    const withoutComments = removeSQLComments(sanitized);
    if (withoutComments !== sanitized) {
      removedPatterns.push('SQL_COMMENTS');
      sanitized = withoutComments;
    }
  }

  // 2. Remove semicolons
  if (opts.removeSemicolons) {
    const withoutSemicolons = removeSemicolons(sanitized);
    if (withoutSemicolons !== sanitized) {
      removedPatterns.push('SEMICOLONS');
      sanitized = withoutSemicolons;
    }
  }

  // 3. Escape quotes
  if (opts.escapeQuotes) {
    const escaped = escapeSQLString(sanitized);
    if (escaped !== sanitized) {
      removedPatterns.push('SPECIAL_CHARS');
      sanitized = escaped;
    }
  }

  // 4. Neutralize keywords
  if (opts.neutralizeKeywords) {
    const neutralized = neutralizeSQLKeywords(sanitized);
    if (neutralized !== sanitized) {
      removedPatterns.push('SQL_KEYWORDS');
      sanitized = neutralized;
    }
  }

  // 5. Normalize whitespace
  const normalized = normalizeWhitespace(sanitized);
  if (normalized !== sanitized) {
    removedPatterns.push('EXCESSIVE_WHITESPACE');
    sanitized = normalized;
  }

  // 6. Limit length
  if (opts.maxLength) {
    const limited = limitInputLength(sanitized, opts.maxLength);
    if (limited !== sanitized) {
      removedPatterns.push('LENGTH_LIMIT');
      sanitized = limited;
    }
  }

  return {
    sanitized,
    modified: sanitized !== originalInput,
    removedPatterns,
    originalLength,
    sanitizedLength: sanitized.length
  };
}

/**
 * Check if input is safe for database operations
 *
 * Uses SQL injection detector to determine if input contains threats.
 * This is a quick check before sanitization.
 *
 * @param input - The input to check
 * @returns True if input is safe, false if threats detected
 *
 * @example
 * ```typescript
 * if (!isSafeDatabaseInput(userInput)) {
 *   // Reject or sanitize input
 * }
 * ```
 */
export function isSafeDatabaseInput(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true; // Empty input is safe
  }

  const detection = detectSQLInjection(input);
  return !detection.isThreat;
}

/**
 * Validate and sanitize input in one step
 *
 * Combines threat detection with sanitization. Returns sanitized version
 * even if threats detected (for defensive programming).
 *
 * @param input - The input to validate and sanitize
 * @param options - Sanitization options
 * @returns Validation and sanitization result
 *
 * @example
 * ```typescript
 * const result = validateAndSanitize(userInput);
 * if (!result.isValid) {
 *   console.warn('Threats detected:', result.threats);
 * }
 * // Use result.sanitized (always safe)
 * ```
 */
export function validateAndSanitize(
  input: string,
  options?: SanitizationOptions
): {
  isValid: boolean;
  sanitized: string;
  threats: string[];
  recommendations: string[];
  sanitizationResult: SanitizationResult;
} {
  // Detect threats first
  const detection = detectSQLInjection(input);

  // Sanitize regardless of threat status
  const sanitizationResult = sanitizeForDatabase(input, options);

  return {
    isValid: !detection.isThreat,
    sanitized: sanitizationResult.sanitized,
    threats: detection.matchedPatterns.map(p => p.name),
    recommendations: detection.recommendations,
    sanitizationResult
  };
}

/**
 * Sanitize table name
 *
 * Table names have stricter requirements - alphanumeric and underscores only.
 *
 * @param tableName - The table name to sanitize
 * @returns Sanitized table name
 * @throws Error if table name is invalid
 *
 * @example
 * ```typescript
 * const safe = sanitizeTableName("users_table");
 * // Use in query safely
 * ```
 */
export function sanitizeTableName(tableName: string): string {
  if (!tableName || typeof tableName !== 'string') {
    throw new Error('Table name must be a non-empty string');
  }

  // Remove any non-alphanumeric characters except underscore
  const sanitized = tableName.replace(/[^a-zA-Z0-9_]/g, '');

  // Must start with letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    throw new Error('Table name must start with a letter or underscore');
  }

  // Must not be empty after sanitization
  if (!sanitized) {
    throw new Error('Table name is invalid after sanitization');
  }

  // Check for SQL keywords
  const detection = detectSQLInjection(sanitized);
  if (detection.isThreat && detection.threatScore > 75) {
    throw new Error('Table name contains suspicious patterns');
  }

  return sanitized;
}

/**
 * Sanitize column name
 *
 * Column names have same requirements as table names.
 *
 * @param columnName - The column name to sanitize
 * @returns Sanitized column name
 * @throws Error if column name is invalid
 *
 * @example
 * ```typescript
 * const safe = sanitizeColumnName("user_email");
 * ```
 */
export function sanitizeColumnName(columnName: string): string {
  if (!columnName || typeof columnName !== 'string') {
    throw new Error('Column name must be a non-empty string');
  }

  // Remove any non-alphanumeric characters except underscore
  const sanitized = columnName.replace(/[^a-zA-Z0-9_]/g, '');

  // Must start with letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    throw new Error('Column name must start with a letter or underscore');
  }

  // Must not be empty after sanitization
  if (!sanitized) {
    throw new Error('Column name is invalid after sanitization');
  }

  return sanitized;
}

/**
 * Sanitize search term for LIKE/ILIKE queries
 *
 * Escapes special characters used in SQL LIKE patterns.
 *
 * @param searchTerm - The search term to sanitize
 * @returns Sanitized search term
 *
 * @example
 * ```typescript
 * const safe = sanitizeSearchTerm("50% off");
 * // Escapes % to prevent wildcard abuse
 * ```
 */
export function sanitizeSearchTerm(searchTerm: string): string {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '';
  }

  // First, general sanitization
  const result = sanitizeForDatabase(searchTerm, {
    maxLength: 100,
    neutralizeKeywords: true,
    removeComments: true,
    escapeQuotes: true,
    removeSemicolons: true
  });

  // Then escape LIKE wildcards
  return result.sanitized
    .replace(/%/g, '\\%')    // Escape % wildcard
    .replace(/_/g, '\\_');   // Escape _ wildcard
}

/**
 * Create safe SQL identifier (table or column name)
 *
 * Ensures identifier follows PostgreSQL naming rules.
 *
 * @param identifier - The identifier to make safe
 * @returns Safe identifier or throws error
 *
 * @example
 * ```typescript
 * const safe = createSafeIdentifier("my-table-name");
 * console.log(safe); // "my_table_name"
 * ```
 */
export function createSafeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Identifier must be a non-empty string');
  }

  // Convert to lowercase
  let safe = identifier.toLowerCase();

  // Replace hyphens with underscores
  safe = safe.replace(/-/g, '_');

  // Remove any character that's not alphanumeric or underscore
  safe = safe.replace(/[^a-z0-9_]/g, '');

  // Ensure it starts with letter or underscore
  if (!/^[a-z_]/.test(safe)) {
    safe = '_' + safe;
  }

  // Limit length (PostgreSQL limit is 63 characters)
  if (safe.length > 63) {
    safe = safe.substring(0, 63);
  }

  if (!safe) {
    throw new Error('Could not create safe identifier from input');
  }

  return safe;
}

/**
 * Sanitize array of values
 *
 * Applies sanitization to each value in an array.
 *
 * @param values - Array of values to sanitize
 * @param options - Sanitization options
 * @returns Array of sanitized values
 *
 * @example
 * ```typescript
 * const safe = sanitizeArray(['value1', 'value2; DROP TABLE']);
 * ```
 */
export function sanitizeArray(
  values: string[],
  options?: SanitizationOptions
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter(v => typeof v === 'string')
    .map(v => sanitizeForDatabase(v, options).sanitized);
}

export default {
  escapeSQLString,
  neutralizeSQLKeywords,
  removeSQLComments,
  removeSemicolons,
  limitInputLength,
  normalizeWhitespace,
  sanitizeForDatabase,
  isSafeDatabaseInput,
  validateAndSanitize,
  sanitizeTableName,
  sanitizeColumnName,
  sanitizeSearchTerm,
  createSafeIdentifier,
  sanitizeArray
};