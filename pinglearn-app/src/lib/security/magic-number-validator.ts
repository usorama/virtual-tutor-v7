/**
 * Magic Number (File Signature) Validator
 * SEC-008: File Upload Security - Magic Number Validation
 *
 * This module provides file type verification by examining magic numbers (file signatures).
 * Magic numbers are unique byte sequences at the beginning of files that identify file types.
 * This is more secure than checking file extensions, which can be easily spoofed.
 *
 * Supported file types:
 * - PDF (.pdf)
 * - JPEG (.jpg, .jpeg)
 * - PNG (.png)
 * - GIF (.gif)
 *
 * @module lib/security/magic-number-validator
 */

import type {
  FileType,
  MagicNumberSignature,
  DetectedFileType,
  ValidationCheck
} from '@/types/file-security';

// ============================================================================
// MAGIC NUMBER DATABASE
// ============================================================================

/**
 * Database of known file signatures (magic numbers)
 * Source: OWASP File Upload Cheat Sheet + standard file format specifications
 */
export const MAGIC_NUMBER_SIGNATURES: Record<FileType, MagicNumberSignature> = {
  pdf: {
    type: 'pdf',
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
    mimeType: 'application/pdf',
    extension: '.pdf'
  },
  jpeg: {
    type: 'jpeg',
    signature: [0xFF, 0xD8, 0xFF], // JPEG start of image marker
    offset: 0,
    mimeType: 'image/jpeg',
    extension: '.jpg'
  },
  png: {
    type: 'png',
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG signature
    offset: 0,
    mimeType: 'image/png',
    extension: '.png'
  },
  gif: {
    type: 'gif',
    signature: [0x47, 0x49, 0x46, 0x38], // GIF8 (GIF87a or GIF89a)
    offset: 0,
    mimeType: 'image/gif',
    extension: '.gif'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts magic number bytes from a buffer
 *
 * @param buffer - File buffer (ArrayBuffer)
 * @param byteCount - Number of bytes to extract
 * @returns Uint8Array containing the magic number
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const magicBytes = extractMagicNumber(buffer, 4);
 */
export function extractMagicNumber(
  buffer: ArrayBuffer,
  byteCount: number
): Uint8Array {
  const view = new Uint8Array(buffer);
  return view.slice(0, byteCount);
}

/**
 * Compares two byte sequences for equality
 *
 * @param actual - Actual byte sequence
 * @param expected - Expected byte sequence (can be number[] or Uint8Array)
 * @returns True if sequences match
 *
 * @example
 * const matches = compareSignatures(actualBytes, [0x25, 0x50, 0x44, 0x46]);
 */
export function compareSignatures(
  actual: Uint8Array,
  expected: number[] | Uint8Array
): boolean {
  const expectedArray = Array.isArray(expected)
    ? expected
    : Array.from(expected);

  if (actual.length !== expectedArray.length) {
    return false;
  }

  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expectedArray[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Converts byte array to hex string representation
 *
 * @param bytes - Byte array
 * @returns Hex string (e.g., "25 50 44 46" for PDF)
 *
 * @example
 * const hex = bytesToHex([0x25, 0x50, 0x44, 0x46]); // "25 50 44 46"
 */
export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

/**
 * Gets the expected magic number signature for a file type
 *
 * @param fileType - File type
 * @returns Magic number signature
 * @throws Error if file type is not supported
 *
 * @example
 * const signature = getExpectedSignature('pdf');
 */
export function getExpectedSignature(fileType: FileType): MagicNumberSignature {
  const signature = MAGIC_NUMBER_SIGNATURES[fileType];
  if (!signature) {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  return signature;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that a file's magic number matches the expected type
 *
 * This is the PRIMARY file type verification method. It reads the first few bytes
 * of the file and compares them against known signatures. This cannot be spoofed
 * by simply renaming a file.
 *
 * @param buffer - File buffer (ArrayBuffer)
 * @param expectedType - Expected file type
 * @returns Validation check result
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const check = validateMagicNumber(buffer, 'pdf');
 * if (!check.passed) {
 *   console.error(check.message);
 * }
 */
export function validateMagicNumber(
  buffer: ArrayBuffer,
  expectedType: FileType
): ValidationCheck {
  try {
    // Get expected signature
    const signature = getExpectedSignature(expectedType);

    // Extract actual magic number
    const magicBytes = extractMagicNumber(buffer, signature.signature.length);

    // Compare signatures
    const matches = compareSignatures(magicBytes, signature.signature);

    // Build result
    return {
      passed: matches,
      message: matches
        ? `File signature verified: ${expectedType.toUpperCase()} (${bytesToHex(magicBytes)})`
        : `File signature mismatch. Expected ${expectedType.toUpperCase()} but found ${bytesToHex(magicBytes)}`,
      details: {
        expectedType,
        expectedSignature: signature.signature,
        expectedHex: bytesToHex(signature.signature),
        actualSignature: Array.from(magicBytes),
        actualHex: bytesToHex(magicBytes),
        matches
      }
    };
  } catch (error) {
    return {
      passed: false,
      message: `Magic number validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: String(error)
      }
    };
  }
}

/**
 * Detects file type by examining magic number (type unknown)
 *
 * This function checks the file's magic number against all known signatures
 * and returns the detected type. Useful when you don't know what type to expect.
 *
 * @param buffer - File buffer (ArrayBuffer)
 * @returns Detected file type or null if unknown
 *
 * @example
 * const buffer = await file.arrayBuffer();
 * const detected = detectFileType(buffer);
 * if (detected) {
 *   console.log(`Detected: ${detected.type}`);
 * }
 */
export function detectFileType(buffer: ArrayBuffer): DetectedFileType | null {
  // Check against all known signatures
  for (const [type, signature] of Object.entries(MAGIC_NUMBER_SIGNATURES)) {
    const magicBytes = extractMagicNumber(buffer, signature.signature.length);

    if (compareSignatures(magicBytes, signature.signature)) {
      return {
        type: signature.type,
        mimeType: signature.mimeType,
        extension: signature.extension,
        confidence: 1.0, // Exact match = 100% confidence
        signature: bytesToHex(magicBytes)
      };
    }
  }

  return null; // Unknown file type
}

/**
 * Validates magic number from a File object
 *
 * Convenience wrapper that handles reading the file buffer internally.
 *
 * @param file - File object
 * @param expectedType - Expected file type
 * @returns Promise resolving to validation check result
 *
 * @example
 * const check = await validateFileTypeMagicNumber(file, 'pdf');
 */
export async function validateFileTypeMagicNumber(
  file: File,
  expectedType: FileType
): Promise<ValidationCheck> {
  try {
    const buffer = await file.arrayBuffer();
    return validateMagicNumber(buffer, expectedType);
  } catch (error) {
    return {
      passed: false,
      message: `Failed to read file for magic number validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: String(error)
      }
    };
  }
}

/**
 * Detects file type from a File object
 *
 * Convenience wrapper that handles reading the file buffer internally.
 *
 * @param file - File object
 * @returns Promise resolving to detected file type or null
 *
 * @example
 * const detected = await detectFileTypeFromFile(file);
 */
export async function detectFileTypeFromFile(
  file: File
): Promise<DetectedFileType | null> {
  try {
    const buffer = await file.arrayBuffer();
    return detectFileType(buffer);
  } catch (error) {
    console.error('Failed to detect file type:', error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets a list of all supported file types
 *
 * @returns Array of supported file types
 */
export function getSupportedFileTypes(): FileType[] {
  return Object.keys(MAGIC_NUMBER_SIGNATURES) as FileType[];
}

/**
 * Checks if a file type is supported for magic number validation
 *
 * @param fileType - File type to check
 * @returns True if supported
 */
export function isFileTypeSupported(fileType: string): fileType is FileType {
  return fileType in MAGIC_NUMBER_SIGNATURES;
}

/**
 * Gets MIME type for a file type
 *
 * @param fileType - File type
 * @returns MIME type or undefined if not supported
 */
export function getMimeTypeForFileType(fileType: FileType): string | undefined {
  return MAGIC_NUMBER_SIGNATURES[fileType]?.mimeType;
}

/**
 * Gets file extension for a file type
 *
 * @param fileType - File type
 * @returns File extension (with dot) or undefined if not supported
 */
export function getExtensionForFileType(fileType: FileType): string | undefined {
  return MAGIC_NUMBER_SIGNATURES[fileType]?.extension;
}