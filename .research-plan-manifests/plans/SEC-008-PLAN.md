# SEC-008 Implementation Plan
## File Upload Security - Detailed Architecture & Roadmap

**Story ID**: SEC-008
**Agent**: story_sec008_001
**Plan Date**: 2025-09-30
**Phase**: 2 - PLAN (COMPLETE)
**Status**: ✅ Plan Complete - Ready for Implementation

---

## Plan Overview

**Objective**: Implement comprehensive file upload security for PingLearn textbook uploads using multi-layer defense approach.

**Implementation Strategy**: Create modular, reusable security utilities that integrate seamlessly with existing textbook hierarchy API endpoints.

**Risk Level**: LOW (leveraging existing patterns, no protected-core modifications)

**Estimated Implementation Time**: ~3 hours
- File validation utilities: 1.5 hours
- Upload rate limiting: 0.5 hours
- Integration + testing: 1 hour

---

## Architecture Design

### 1. File Validation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    File Upload Request                       │
│              (Next.js API Route Handler)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  1. Rate Limit Check  │◄─── Upload Rate Limiter
         └───────────┬───────────┘
                     │ ✓ Pass
                     ▼
         ┌───────────────────────┐
         │ 2. Extension Check    │◄─── File Validator
         └───────────┬───────────┘
                     │ ✓ Pass
                     ▼
         ┌───────────────────────┐
         │  3. Size Check        │◄─── File Validator
         └───────────┬───────────┘
                     │ ✓ Pass
                     ▼
         ┌───────────────────────┐
         │ 4. Filename Sanitize  │◄─── Filename Sanitizer
         └───────────┬───────────┘
                     │ ✓ Pass
                     ▼
         ┌───────────────────────┐
         │ 5. Magic Number Check │◄─── Magic Number Validator
         └───────────┬───────────┘
                     │ ✓ Pass
                     ▼
         ┌───────────────────────┐
         │ 6. Generate Secure    │◄─── Secure File Namer
         │    Filename (UUID)    │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  7. Store File        │◄─── Supabase Storage
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ 8. Record Upload      │◄─── Rate Limit Recorder
         └───────────┬───────────┘
                     │
                     ▼
              ✅ Success Response
```

### 2. Module Breakdown

**Module 1: Core File Validator** (`src/lib/security/file-validation.ts`)
- File extension validation (whitelist)
- File size validation (configurable limits)
- Comprehensive validation function (orchestrates all checks)

**Module 2: Magic Number Validator** (`src/lib/security/magic-number-validator.ts`)
- Magic number extraction
- Signature verification (PDF, JPEG, PNG, GIF)
- Type detection with confidence scoring

**Module 3: Filename Sanitizer** (`src/lib/security/filename-sanitizer.ts`)
- Path traversal detection (`../`, `..\\`)
- XSS/injection character removal
- Secure filename generation (UUID-based)
- Length validation

**Module 4: Upload Rate Limiter** (`src/lib/security/upload-rate-limiter.ts`)
- Per-user upload rate limiting
- Per-IP upload rate limiting
- Configurable windows and thresholds
- Integration with existing rate-limiter pattern

**Module 5: File Validation Types** (`src/types/file-security.ts`)
- Type definitions for validation results
- Configuration types
- Error types

---

## Detailed Component Specifications

### Component 1: File Validator (`file-validation.ts`)

**Purpose**: Central orchestrator for file validation, combines all security checks

**Public API**:

```typescript
// Main validation function
export async function validateUploadedFile(
  file: File,
  options?: FileValidationOptions
): Promise<FileValidationResult>

// Individual validators (can be used separately)
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): ValidationCheck

export function validateFileSize(
  size: number,
  maxSize: number
): ValidationCheck

export function validateFileName(
  filename: string
): ValidationCheck

// Configuration helpers
export function getDefaultValidationOptions(): FileValidationOptions
export function getValidationOptionsForFileType(
  fileType: 'textbook' | 'image' | 'document'
): FileValidationOptions
```

**Types**:

```typescript
export interface FileValidationOptions {
  allowedExtensions: string[];
  maxFileSize: number; // bytes
  requireMagicNumberCheck: boolean;
  allowedMimeTypes?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  checks: {
    extension: ValidationCheck;
    size: ValidationCheck;
    filename: ValidationCheck;
    magicNumber?: ValidationCheck;
  };
  errors: string[];
  warnings: string[];
  metadata: {
    originalFilename: string;
    sanitizedFilename: string;
    detectedType?: string;
    fileSize: number;
    validatedAt: Date;
  };
}

export interface ValidationCheck {
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}
```

**Validation Logic Flow**:

```typescript
async function validateUploadedFile(file, options) {
  const result: FileValidationResult = {
    isValid: true,
    checks: {},
    errors: [],
    warnings: [],
    metadata: {}
  };

  // Step 1: Extension check
  result.checks.extension = validateFileExtension(
    file.name,
    options.allowedExtensions
  );
  if (!result.checks.extension.passed) {
    result.isValid = false;
    result.errors.push(result.checks.extension.message);
  }

  // Step 2: Size check
  result.checks.size = validateFileSize(file.size, options.maxFileSize);
  if (!result.checks.size.passed) {
    result.isValid = false;
    result.errors.push(result.checks.size.message);
  }

  // Step 3: Filename check
  result.checks.filename = validateFileName(file.name);
  if (!result.checks.filename.passed) {
    result.isValid = false;
    result.errors.push(result.checks.filename.message);
  }

  // Step 4: Magic number check (if required and extension valid)
  if (options.requireMagicNumberCheck && result.checks.extension.passed) {
    const buffer = await file.arrayBuffer();
    result.checks.magicNumber = await validateMagicNumber(
      buffer,
      getExpectedMagicNumber(file.name)
    );

    if (!result.checks.magicNumber.passed) {
      result.isValid = false;
      result.errors.push(result.checks.magicNumber.message);
    }
  }

  // Populate metadata
  result.metadata = {
    originalFilename: file.name,
    sanitizedFilename: sanitizeFilename(file.name),
    fileSize: file.size,
    detectedType: result.checks.magicNumber?.details?.type,
    validatedAt: new Date()
  };

  return result;
}
```

**Configuration Constants**:

```typescript
// Textbook uploads (PDFs)
const TEXTBOOK_VALIDATION_OPTIONS: FileValidationOptions = {
  allowedExtensions: ['.pdf'],
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  requireMagicNumberCheck: true,
  allowedMimeTypes: ['application/pdf']
};

// Image uploads (covers, metadata)
const IMAGE_VALIDATION_OPTIONS: FileValidationOptions = {
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  requireMagicNumberCheck: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
};
```

**Estimated Lines**: ~200 lines

---

### Component 2: Magic Number Validator (`magic-number-validator.ts`)

**Purpose**: Verify file types by examining magic numbers (file signatures)

**Public API**:

```typescript
// Main validation function
export function validateMagicNumber(
  buffer: ArrayBuffer,
  expectedType: FileType
): ValidationCheck

// Detection function (type unknown)
export function detectFileType(
  buffer: ArrayBuffer
): DetectedFileType | null

// Helper functions
export function extractMagicNumber(
  buffer: ArrayBuffer,
  byteCount: number
): Uint8Array

export function compareSignatures(
  actual: Uint8Array,
  expected: Uint8Array
): boolean
```

**Types**:

```typescript
export type FileType = 'pdf' | 'jpeg' | 'png' | 'gif';

export interface DetectedFileType {
  type: FileType;
  mimeType: string;
  extension: string;
  confidence: number; // 0-1
  signature: string; // hex representation
}

export interface MagicNumberSignature {
  type: FileType;
  signature: number[];
  offset: number;
  mimeType: string;
  extension: string;
}
```

**Magic Number Database**:

```typescript
const MAGIC_NUMBER_SIGNATURES: Record<FileType, MagicNumberSignature> = {
  pdf: {
    type: 'pdf',
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
    mimeType: 'application/pdf',
    extension: '.pdf'
  },
  jpeg: {
    type: 'jpeg',
    signature: [0xFF, 0xD8, 0xFF],
    offset: 0,
    mimeType: 'image/jpeg',
    extension: '.jpg'
  },
  png: {
    type: 'png',
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    offset: 0,
    mimeType: 'image/png',
    extension: '.png'
  },
  gif: {
    type: 'gif',
    signature: [0x47, 0x49, 0x46, 0x38], // GIF8
    offset: 0,
    mimeType: 'image/gif',
    extension: '.gif'
  }
};
```

**Validation Algorithm**:

```typescript
function validateMagicNumber(buffer, expectedType) {
  // 1. Extract magic number bytes
  const signature = MAGIC_NUMBER_SIGNATURES[expectedType];
  const magicBytes = extractMagicNumber(buffer, signature.signature.length);

  // 2. Compare signatures
  const matches = compareSignatures(magicBytes, signature.signature);

  // 3. Return validation result
  return {
    passed: matches,
    message: matches
      ? `File signature matches expected type: ${expectedType}`
      : `File signature mismatch. Expected ${expectedType}, but signature doesn't match.`,
    details: {
      expectedType,
      expectedSignature: signature.signature,
      actualSignature: Array.from(magicBytes),
      hexSignature: Array.from(magicBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
    }
  };
}
```

**Detection Algorithm** (for unknown file types):

```typescript
function detectFileType(buffer): DetectedFileType | null {
  // Check against all known signatures
  for (const [type, signature] of Object.entries(MAGIC_NUMBER_SIGNATURES)) {
    const magicBytes = extractMagicNumber(buffer, signature.signature.length);

    if (compareSignatures(magicBytes, signature.signature)) {
      return {
        type: signature.type,
        mimeType: signature.mimeType,
        extension: signature.extension,
        confidence: 1.0, // Exact match
        signature: Array.from(magicBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
      };
    }
  }

  return null; // Unknown file type
}
```

**Estimated Lines**: ~150 lines

---

### Component 3: Filename Sanitizer (`filename-sanitizer.ts`)

**Purpose**: Sanitize filenames, detect malicious patterns, generate secure names

**Public API**:

```typescript
// Sanitization
export function sanitizeFilename(filename: string): string

// Security checks
export function detectPathTraversal(filename: string): boolean
export function containsMaliciousCharacters(filename: string): boolean

// Secure naming
export function generateSecureFilename(
  originalFilename: string,
  preserveExtension?: boolean
): string

// Utilities
export function extractExtension(filename: string): string
export function normalizeFilename(filename: string): string
```

**Sanitization Rules**:

```typescript
const MALICIOUS_PATTERNS = [
  /\.\./g,           // Path traversal (..)
  /\\/g,             // Backslashes
  /\//g,             // Forward slashes
  /[<>:"|?*]/g,      // Windows reserved characters
  /[\x00-\x1f]/g,    // Control characters
  /^\./,             // Leading dot (hidden files)
  /\.$/              // Trailing dot
];

const SANITIZATION_REPLACEMENTS = {
  ' ': '-',          // Replace spaces with hyphens
  '_': '-',          // Normalize underscores
  '--': '-'          // Collapse multiple hyphens
};

const MAX_FILENAME_LENGTH = 255; // Standard filesystem limit
const MAX_SAFE_LENGTH = 100;     // Safe length for cross-platform
```

**Sanitization Algorithm**:

```typescript
function sanitizeFilename(filename: string): string {
  // 1. Extract extension safely
  const extension = extractExtension(filename);
  let baseName = filename.slice(0, filename.lastIndexOf('.'));

  // 2. Remove malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    baseName = baseName.replace(pattern, '');
  }

  // 3. Apply replacements
  for (const [char, replacement] of Object.entries(SANITIZATION_REPLACEMENTS)) {
    baseName = baseName.split(char).join(replacement);
  }

  // 4. Remove non-ASCII characters (optional, but safer)
  baseName = baseName.replace(/[^\x20-\x7E]/g, '');

  // 5. Trim and collapse
  baseName = baseName.trim().replace(/-+/g, '-');

  // 6. Length limit
  if (baseName.length > MAX_SAFE_LENGTH) {
    baseName = baseName.slice(0, MAX_SAFE_LENGTH);
  }

  // 7. Ensure not empty
  if (!baseName) {
    baseName = 'file';
  }

  return `${baseName}${extension}`;
}
```

**Secure Filename Generation**:

```typescript
function generateSecureFilename(
  originalFilename: string,
  preserveExtension = true
): string {
  // 1. Generate UUID
  const uuid = crypto.randomUUID();

  // 2. Extract and sanitize extension
  const extension = preserveExtension
    ? extractExtension(originalFilename)
    : '';

  // 3. Optionally include sanitized original name (truncated)
  const sanitized = sanitizeFilename(originalFilename);
  const baseName = sanitized
    .replace(extension, '')
    .slice(0, 30); // Keep first 30 chars

  // 4. Combine: {uuid}-{original-name}{extension}
  return `${uuid}-${baseName}${extension}`;
}
```

**Path Traversal Detection**:

```typescript
function detectPathTraversal(filename: string): boolean {
  const traversalPatterns = [
    /\.\./,           // Standard traversal
    /\.\.%2[fF]/,     // URL-encoded traversal
    /\.\.%5[cC]/,     // URL-encoded backslash
    /%2e%2e/i,        // Double URL-encoded
    /\.\.\\/,         // Windows-style
    /\.\.\//          // Unix-style
  ];

  return traversalPatterns.some(pattern => pattern.test(filename));
}
```

**Estimated Lines**: ~120 lines

---

### Component 4: Upload Rate Limiter (`upload-rate-limiter.ts`)

**Purpose**: Prevent upload flooding and DoS attacks via rate limiting

**Pattern**: Extends existing `rate-limiter.ts` pattern

**Public API**:

```typescript
// User-based rate limiting
export function checkUploadRateLimit(userId: string): RateLimitResult
export function recordUploadAttempt(userId: string): void

// IP-based rate limiting
export function checkIPUploadRateLimit(ipAddress: string): RateLimitResult
export function recordIPUploadAttempt(ipAddress: string): void

// Combined check (both user and IP)
export function checkCombinedUploadRateLimit(
  userId: string,
  ipAddress: string
): RateLimitResult

// Management
export function clearUploadRateLimit(identifier: string): void
export function getUploadRateLimitStatus(identifier: string): RateLimitStatus
```

**Configuration**:

```typescript
// Rate limit windows
const UPLOAD_RATE_WINDOW_SHORT = 15 * 60 * 1000;  // 15 minutes
const UPLOAD_RATE_WINDOW_LONG = 60 * 60 * 1000;   // 1 hour

// Per-user limits (authenticated)
const MAX_UPLOADS_PER_USER_SHORT = 10;  // 10 files per 15 min
const MAX_UPLOADS_PER_USER_LONG = 50;   // 50 files per hour

// Per-IP limits (includes unauthenticated)
const MAX_UPLOADS_PER_IP_SHORT = 20;    // 20 files per 15 min
const MAX_UPLOADS_PER_IP_LONG = 100;    // 100 files per hour

// File size-based limits (consume multiple "tokens")
const SIZE_MULTIPLIER_THRESHOLD = 10 * 1024 * 1024; // 10 MB
const SIZE_MULTIPLIER = 2; // Large files count as 2 uploads
```

**Types**:

```typescript
export interface RateLimitStatus {
  identifier: string;
  attemptsShort: number;
  attemptsLong: number;
  firstAttemptShort: number;
  firstAttemptLong: number;
  nextResetShort: number; // timestamp
  nextResetLong: number;  // timestamp
}

export interface UploadRateLimitEntry {
  attemptsShort: number;
  attemptsLong: number;
  firstAttemptShort: number;
  firstAttemptLong: number;
  lastAttempt: number;
  totalBytesUploaded: number; // Optional: track bandwidth
}
```

**Storage**:

```typescript
// In-memory store (Phase 1)
// Future: Migrate to Redis for production scalability
const uploadRateLimitStore = new Map<string, UploadRateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of uploadRateLimitStore.entries()) {
    if (now - entry.lastAttempt > UPLOAD_RATE_WINDOW_LONG) {
      uploadRateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
```

**Rate Limiting Algorithm**:

```typescript
function checkUploadRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const identifier = `user:${userId}`;
  const entry = uploadRateLimitStore.get(identifier);

  // No previous uploads
  if (!entry) {
    return {
      allowed: true,
      remaining: MAX_UPLOADS_PER_USER_SHORT - 1,
      resetIn: Math.floor(UPLOAD_RATE_WINDOW_SHORT / 1000)
    };
  }

  // Check short window (15 min)
  const shortWindowExpired = now - entry.firstAttemptShort > UPLOAD_RATE_WINDOW_SHORT;
  const shortLimitExceeded = !shortWindowExpired &&
                             entry.attemptsShort >= MAX_UPLOADS_PER_USER_SHORT;

  if (shortLimitExceeded) {
    const resetIn = Math.ceil(
      (entry.firstAttemptShort + UPLOAD_RATE_WINDOW_SHORT - now) / 1000
    );
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Check long window (1 hour)
  const longWindowExpired = now - entry.firstAttemptLong > UPLOAD_RATE_WINDOW_LONG;
  const longLimitExceeded = !longWindowExpired &&
                            entry.attemptsLong >= MAX_UPLOADS_PER_USER_LONG;

  if (longLimitExceeded) {
    const resetIn = Math.ceil(
      (entry.firstAttemptLong + UPLOAD_RATE_WINDOW_LONG - now) / 1000
    );
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Within limits
  const resetIn = Math.ceil(
    shortWindowExpired
      ? UPLOAD_RATE_WINDOW_SHORT / 1000
      : (entry.firstAttemptShort + UPLOAD_RATE_WINDOW_SHORT - now) / 1000
  );

  return {
    allowed: true,
    remaining: MAX_UPLOADS_PER_USER_SHORT - entry.attemptsShort - 1,
    resetIn
  };
}
```

**Recording Algorithm** (dual-window):

```typescript
function recordUploadAttempt(userId: string, fileSize?: number): void {
  const now = Date.now();
  const identifier = `user:${userId}`;
  const entry = uploadRateLimitStore.get(identifier);

  // Calculate upload "cost" based on file size
  const uploadCost = fileSize && fileSize > SIZE_MULTIPLIER_THRESHOLD
    ? SIZE_MULTIPLIER
    : 1;

  if (!entry) {
    // New entry
    uploadRateLimitStore.set(identifier, {
      attemptsShort: uploadCost,
      attemptsLong: uploadCost,
      firstAttemptShort: now,
      firstAttemptLong: now,
      lastAttempt: now,
      totalBytesUploaded: fileSize || 0
    });
    return;
  }

  // Update short window
  if (now - entry.firstAttemptShort > UPLOAD_RATE_WINDOW_SHORT) {
    // Reset short window
    entry.attemptsShort = uploadCost;
    entry.firstAttemptShort = now;
  } else {
    entry.attemptsShort += uploadCost;
  }

  // Update long window
  if (now - entry.firstAttemptLong > UPLOAD_RATE_WINDOW_LONG) {
    // Reset long window
    entry.attemptsLong = uploadCost;
    entry.firstAttemptLong = now;
  } else {
    entry.attemptsLong += uploadCost;
  }

  entry.lastAttempt = now;
  entry.totalBytesUploaded += fileSize || 0;
}
```

**Estimated Lines**: ~180 lines

---

### Component 5: Type Definitions (`types/file-security.ts`)

**Purpose**: Centralized type definitions for file security

**Types** (consolidation of above):

```typescript
// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface FileValidationOptions {
  allowedExtensions: string[];
  maxFileSize: number;
  requireMagicNumberCheck: boolean;
  allowedMimeTypes?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  checks: {
    extension: ValidationCheck;
    size: ValidationCheck;
    filename: ValidationCheck;
    magicNumber?: ValidationCheck;
  };
  errors: string[];
  warnings: string[];
  metadata: {
    originalFilename: string;
    sanitizedFilename: string;
    detectedType?: string;
    fileSize: number;
    validatedAt: Date;
  };
}

export interface ValidationCheck {
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// MAGIC NUMBER TYPES
// ============================================================================

export type FileType = 'pdf' | 'jpeg' | 'png' | 'gif';

export interface DetectedFileType {
  type: FileType;
  mimeType: string;
  extension: string;
  confidence: number;
  signature: string;
}

export interface MagicNumberSignature {
  type: FileType;
  signature: number[];
  offset: number;
  mimeType: string;
  extension: string;
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetIn: number;
  readonly reason?: 'RATE_LIMIT_EXCEEDED';
}

export interface RateLimitStatus {
  identifier: string;
  attemptsShort: number;
  attemptsLong: number;
  firstAttemptShort: number;
  firstAttemptLong: number;
  nextResetShort: number;
  nextResetLong: number;
}

export interface UploadRateLimitEntry {
  attemptsShort: number;
  attemptsLong: number;
  firstAttemptShort: number;
  firstAttemptLong: number;
  lastAttempt: number;
  totalBytesUploaded: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type FileSecurityErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILENAME'
  | 'MAGIC_NUMBER_MISMATCH'
  | 'PATH_TRAVERSAL_DETECTED'
  | 'UPLOAD_RATE_LIMIT_EXCEEDED'
  | 'MALICIOUS_FILE_DETECTED';

export interface FileSecurityError {
  code: FileSecurityErrorCode;
  message: string;
  details?: Record<string, unknown>;
  userMessage: string;
}
```

**Estimated Lines**: ~100 lines

---

## Integration Plan

### 1. Textbook Hierarchy API Integration

**File**: `src/app/api/textbooks/hierarchy/route.ts`

**Current Code** (Lines 99-100):
```typescript
const { formData, uploadedFiles } = body;
```

**Enhanced Code** (with validation):

```typescript
import {
  validateUploadedFile,
  getValidationOptionsForFileType
} from '@/lib/security/file-validation';
import {
  checkUploadRateLimit,
  recordUploadAttempt
} from '@/lib/security/upload-rate-limiter';
import { generateSecureFilename } from '@/lib/security/filename-sanitizer';

// ... inside POST handler ...

// 1. Check upload rate limit
const uploadLimit = checkUploadRateLimit(user.id);
if (!uploadLimit.allowed) {
  return handleAPIError(
    createAPIError(
      new Error('Upload rate limit exceeded'),
      requestId,
      `Too many uploads. Please try again in ${Math.ceil(uploadLimit.resetIn / 60)} minutes.`,
      ErrorCode.RATE_LIMIT_ERROR
    ),
    requestId,
    createErrorContext(
      { url: request.url, method: 'POST' },
      { id: user.id },
      ErrorSeverity.MEDIUM
    )
  );
}

// 2. Parse and validate files
const { formData, uploadedFiles } = body;

// 3. Validate each file
const validationOptions = getValidationOptionsForFileType('textbook');
const validationResults = await Promise.all(
  uploadedFiles.map(async (fileInfo) => {
    // Reconstruct File object if needed, or validate file info
    const validation = await validateUploadedFile(fileInfo, validationOptions);
    return { fileInfo, validation };
  })
);

// 4. Check for validation failures
const failedValidations = validationResults.filter(r => !r.validation.isValid);
if (failedValidations.length > 0) {
  const errors = failedValidations.map(f => ({
    filename: f.fileInfo.name,
    errors: f.validation.errors
  }));

  return handleAPIError(
    createAPIError(
      new Error('File validation failed'),
      requestId,
      'One or more files failed security validation',
      ErrorCode.VALIDATION_ERROR,
      { failedFiles: errors }
    ),
    requestId,
    createErrorContext(
      { url: request.url, method: 'POST' },
      { id: user.id },
      ErrorSeverity.MEDIUM
    )
  );
}

// 5. Generate secure filenames
const secureFiles = validationResults.map(r => ({
  ...r.fileInfo,
  originalName: r.fileInfo.name,
  secureName: generateSecureFilename(r.fileInfo.name),
  validated: true,
  validationMetadata: r.validation.metadata
}));

// 6. Continue with existing processing...
// ... (series creation, book creation, etc.) ...

// 7. Record upload attempt (at the end, after success)
recordUploadAttempt(user.id);
```

**Integration Points**:
- Rate limit check: Before file processing
- File validation: After parsing, before database operations
- Secure naming: Before storage
- Upload recording: After successful processing

---

### 2. Metadata Extraction API Integration

**File**: `src/app/api/textbooks/extract-metadata/route.ts`

**Current Code** (Lines 31-37):
```typescript
const { files } = body as {
  files: Array<{
    name: string;
    size: number;
    type: string;  // ⚠️ User-provided, not verified
  }>;
};
```

**Enhanced Code**:

```typescript
import {
  validateFileExtension,
  validateFileSize,
  getValidationOptionsForFileType
} from '@/lib/security/file-validation';

// ... inside POST handler ...

// Parse request body
const body = await request.json();
const { files } = body as {
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
};

// Validate file metadata (lightweight validation, no full validation)
const options = getValidationOptionsForFileType('textbook');

for (const file of files) {
  // Check extension
  const extensionCheck = validateFileExtension(file.name, options.allowedExtensions);
  if (!extensionCheck.passed) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.name}. Only PDF files are allowed.` },
      { status: 400 }
    );
  }

  // Check size
  const sizeCheck = validateFileSize(file.size, options.maxFileSize);
  if (!sizeCheck.passed) {
    return NextResponse.json(
      { error: `File too large: ${file.name}. ${sizeCheck.message}` },
      { status: 400 }
    );
  }
}

// Continue with metadata extraction...
```

**Note**: Metadata extraction API receives file info (not full files), so only lightweight validation possible. Full validation happens at upload time.

---

## Testing Strategy

### 1. Unit Tests

**File**: `src/lib/security/file-validation.test.ts` (~200 lines)

**Test Cases**:
- ✅ Valid PDF file passes all checks
- ✅ Invalid extension rejected
- ✅ File exceeding size limit rejected
- ✅ Malicious filename detected
- ✅ Magic number mismatch detected
- ✅ All validation options respected
- ✅ Error messages clear and actionable

**File**: `src/lib/security/magic-number-validator.test.ts` (~150 lines)

**Test Cases**:
- ✅ PDF signature correctly identified
- ✅ JPEG signature correctly identified
- ✅ PNG signature correctly identified
- ✅ GIF signature correctly identified
- ✅ Mismatched signature detected (e.g., .exe renamed to .pdf)
- ✅ Unknown file type returns null
- ✅ Confidence scoring accurate

**File**: `src/lib/security/filename-sanitizer.test.ts` (~120 lines)

**Test Cases**:
- ✅ Path traversal patterns detected (`../`, `..\\`)
- ✅ Malicious characters removed
- ✅ Filenames sanitized correctly
- ✅ Length limits enforced
- ✅ Secure filenames generated (UUID-based)
- ✅ Extensions preserved
- ✅ Empty/invalid filenames handled

**File**: `src/lib/security/upload-rate-limiter.test.ts` (~150 lines)

**Test Cases**:
- ✅ First upload allowed
- ✅ Rate limit enforced after threshold
- ✅ Windows reset correctly
- ✅ Dual-window (short + long) logic works
- ✅ Large files count as multiple uploads
- ✅ Per-user and per-IP limits independent
- ✅ Combined check works correctly

**Total Unit Test Lines**: ~620 lines

---

### 2. Integration Tests

**File**: `src/tests/integration/file-upload-security.test.ts` (~200 lines)

**Test Scenarios**:

**Scenario 1: Valid textbook upload**
- Upload valid PDF file
- Verify all validation checks pass
- Verify secure filename generated
- Verify file stored correctly
- Verify upload recorded

**Scenario 2: Invalid file type**
- Upload .exe file renamed to .pdf
- Verify magic number check catches mismatch
- Verify error message clear
- Verify no file stored

**Scenario 3: Rate limit enforcement**
- Upload 10 files quickly (within 15 min)
- Verify 11th upload blocked
- Wait for window reset
- Verify upload allowed again

**Scenario 4: Malicious filename**
- Upload file with `../etc/passwd.pdf` name
- Verify path traversal detected
- Verify filename sanitized
- Verify secure name generated

**Scenario 5: File too large**
- Upload 60MB file (exceeds 50MB limit)
- Verify size check fails
- Verify error message includes size limit

**Scenario 6: Multiple file upload (batch)**
- Upload 5 files simultaneously
- Verify all validated independently
- Verify one failure doesn't block others (if partial success allowed)
- Verify rate limit counts all attempts

---

### 3. Security Tests

**File**: `src/tests/security/file-upload-attacks.test.ts` (~150 lines)

**Attack Scenarios**:

**Attack 1: File type confusion**
- Upload executable with .pdf extension
- Verify blocked by magic number check

**Attack 2: Path traversal**
- Upload file with `../../../../etc/passwd` in name
- Verify detected and sanitized

**Attack 3: DoS via large files**
- Attempt to upload 500MB file
- Verify rejected immediately

**Attack 4: DoS via flooding**
- Attempt to upload 100 files rapidly
- Verify rate limit blocks after threshold

**Attack 5: Malicious filename XSS**
- Upload file with `<script>alert(1)</script>.pdf` name
- Verify sanitized, XSS pattern removed

**Attack 6: Null byte injection**
- Upload file with null bytes in name (`file\x00.pdf.exe`)
- Verify null bytes removed

---

### 4. Performance Tests

**File**: `src/tests/performance/file-validation-performance.test.ts` (~100 lines)

**Performance Benchmarks**:

**Test 1: Magic number validation speed**
- Validate 100 PDF files
- Target: <10ms per file

**Test 2: Large file handling**
- Validate 50MB PDF file
- Target: <100ms (only read first 64 bytes)

**Test 3: Rate limiter performance**
- 1000 rate limit checks
- Target: <1ms per check

**Test 4: Filename sanitization speed**
- Sanitize 1000 filenames
- Target: <5ms total

---

## Implementation Roadmap

### Phase 3: IMPLEMENT (3 hours)

**Step 1: Core Type Definitions** (15 min)
- [ ] Create `src/types/file-security.ts`
- [ ] Define all types and interfaces
- [ ] Export types from index
- [ ] Git commit: "types: Add file security type definitions (SEC-008)"

**Step 2: Magic Number Validator** (30 min)
- [ ] Create `src/lib/security/magic-number-validator.ts`
- [ ] Implement magic number database
- [ ] Implement validation function
- [ ] Implement detection function
- [ ] Run `npm run typecheck` (must be 0 errors)
- [ ] Git commit: "feat: Add magic number validation for file uploads (SEC-008)"

**Step 3: Filename Sanitizer** (25 min)
- [ ] Create `src/lib/security/filename-sanitizer.ts`
- [ ] Implement sanitization logic
- [ ] Implement path traversal detection
- [ ] Implement secure filename generation
- [ ] Run `npm run typecheck` (must be 0 errors)
- [ ] Git commit: "feat: Add filename sanitization and security checks (SEC-008)"

**Step 4: File Validator** (35 min)
- [ ] Create `src/lib/security/file-validation.ts`
- [ ] Implement individual validators (extension, size, filename)
- [ ] Implement main validation orchestrator
- [ ] Implement configuration helpers
- [ ] Run `npm run typecheck` (must be 0 errors)
- [ ] Git commit: "feat: Add comprehensive file validation system (SEC-008)"

**Step 5: Upload Rate Limiter** (25 min)
- [ ] Create `src/lib/security/upload-rate-limiter.ts`
- [ ] Implement dual-window rate limiting
- [ ] Implement user-based and IP-based checks
- [ ] Implement recording logic
- [ ] Run `npm run typecheck` (must be 0 errors)
- [ ] Git commit: "feat: Add upload rate limiting to prevent DoS (SEC-008)"

**Step 6: API Integration - Hierarchy Endpoint** (30 min)
- [ ] Update `src/app/api/textbooks/hierarchy/route.ts`
- [ ] Add rate limit check at start
- [ ] Add file validation before processing
- [ ] Add secure filename generation
- [ ] Add upload recording at end
- [ ] Run `npm run typecheck` (must be 0 errors)
- [ ] Git commit: "feat: Integrate file security into textbook hierarchy API (SEC-008)"

**Step 7: API Integration - Metadata Endpoint** (15 min)
- [ ] Update `src/app/api/textbooks/extract-metadata/route.ts`
- [ ] Add lightweight validation (extension, size)
- [ ] Run `npm run typecheck` (must be 0 errors)
- [ ] Git commit: "feat: Add file validation to metadata extraction API (SEC-008)"

**Step 8: Documentation** (15 min)
- [ ] Add JSDoc comments to all public functions
- [ ] Create usage examples in file headers
- [ ] Document configuration options
- [ ] Git commit: "docs: Add documentation for file security utilities (SEC-008)"

**Total Implementation Time**: ~3 hours

---

### Phase 4: VERIFY (Continuous)

**After Each Step**:
```bash
npm run typecheck  # MUST show 0 errors
npm run lint       # MUST pass
```

**After Step 8** (Complete):
```bash
npm run typecheck  # Final check
npm run lint       # Final check
npm test --run src/lib/security/  # Run security tests
```

---

### Phase 5: TEST (1.5 hours)

**Step 9: Unit Tests - Magic Number Validator** (20 min)
- [ ] Create `src/lib/security/magic-number-validator.test.ts`
- [ ] Write all test cases (signatures, detection, mismatches)
- [ ] Run `npm test magic-number-validator.test.ts`
- [ ] Verify >80% coverage
- [ ] Git commit: "test: Add magic number validator tests (SEC-008)"

**Step 10: Unit Tests - Filename Sanitizer** (15 min)
- [ ] Create `src/lib/security/filename-sanitizer.test.ts`
- [ ] Write all test cases (sanitization, traversal, secure naming)
- [ ] Run `npm test filename-sanitizer.test.ts`
- [ ] Verify >80% coverage
- [ ] Git commit: "test: Add filename sanitizer tests (SEC-008)"

**Step 11: Unit Tests - File Validator** (20 min)
- [ ] Create `src/lib/security/file-validation.test.ts`
- [ ] Write all test cases (validation checks, configurations)
- [ ] Run `npm test file-validation.test.ts`
- [ ] Verify >80% coverage
- [ ] Git commit: "test: Add file validation tests (SEC-008)"

**Step 12: Unit Tests - Upload Rate Limiter** (20 min)
- [ ] Create `src/lib/security/upload-rate-limiter.test.ts`
- [ ] Write all test cases (rate limits, windows, recording)
- [ ] Run `npm test upload-rate-limiter.test.ts`
- [ ] Verify >80% coverage
- [ ] Git commit: "test: Add upload rate limiter tests (SEC-008)"

**Step 13: Integration Tests** (20 min)
- [ ] Create `src/tests/integration/file-upload-security.test.ts`
- [ ] Write integration test scenarios
- [ ] Run `npm test file-upload-security.test.ts`
- [ ] Verify all scenarios pass
- [ ] Git commit: "test: Add file upload security integration tests (SEC-008)"

**Step 14: Security Tests** (15 min)
- [ ] Create `src/tests/security/file-upload-attacks.test.ts`
- [ ] Write attack scenario tests
- [ ] Run `npm test file-upload-attacks.test.ts`
- [ ] Verify all attacks blocked
- [ ] Git commit: "test: Add file upload attack scenario tests (SEC-008)"

**Total Testing Time**: ~1.5 hours

---

### Phase 6: CONFIRM (Final)

**Step 15: Evidence Collection** (15 min)
- [ ] Create `.research-plan-manifests/evidence/SEC-008-EVIDENCE.md`
- [ ] Document all files created/modified
- [ ] Include verification results (typecheck, lint, tests)
- [ ] Include test coverage report
- [ ] Include git diff summary
- [ ] Git commit: "docs: Create SEC-008 implementation evidence"

**Step 16: Registry Updates** (10 min)
- [ ] Update `.research-plan-manifests/FILE-REGISTRY.json`
- [ ] Lock files during implementation
- [ ] Unlock files after completion
- [ ] Update `.research-plan-manifests/AGENT-COORDINATION.json`
- [ ] Mark SEC-008 as complete
- [ ] Git commit: "docs: Update registries for SEC-008 completion"

---

## Risk Assessment & Mitigation

### Technical Risks

**Risk 1: Magic number validation false positives**
- **Probability**: LOW
- **Impact**: MEDIUM (valid files rejected)
- **Mitigation**: Extensive testing with real textbook PDFs
- **Fallback**: Option to disable magic number check in emergency

**Risk 2: Rate limiting too strict**
- **Probability**: MEDIUM
- **Impact**: MEDIUM (teachers uploading multiple chapters blocked)
- **Mitigation**: Generous limits (10 per 15min, 50 per hour)
- **Adjustment**: Configurable thresholds, can increase if needed

**Risk 3: Performance impact of validation**
- **Probability**: LOW
- **Impact**: LOW (slight latency increase)
- **Mitigation**: Efficient algorithms (only read first 64 bytes)
- **Monitoring**: Add performance benchmarks

**Risk 4: TypeScript errors during integration**
- **Probability**: LOW
- **Impact**: LOW (blocks deployment)
- **Mitigation**: Strict type definitions, continuous typecheck

---

## Success Criteria

### Functional Requirements

- ✅ File extension validation (whitelist-based)
- ✅ File size limits (50MB PDFs, 5MB images)
- ✅ Magic number verification (PDF, JPEG, PNG, GIF)
- ✅ Filename sanitization (path traversal, XSS)
- ✅ Secure filename generation (UUID-based)
- ✅ Upload rate limiting (per-user, per-IP)
- ✅ Integration with textbook hierarchy API
- ✅ Clear error messages for users

### Non-Functional Requirements

- ✅ TypeScript: 0 errors (strict mode)
- ✅ Test coverage: >80%
- ✅ All tests passing: 100%
- ✅ Lint: 0 errors
- ✅ Performance: Magic number check <10ms
- ✅ No modifications to protected-core

### Security Requirements

- ✅ Blocks malicious file execution attempts
- ✅ Prevents path traversal attacks
- ✅ Prevents DoS via large files
- ✅ Prevents DoS via upload flooding
- ✅ Sanitizes malicious filenames
- ✅ Multi-layer defense (7 layers)

---

## Files to Create/Modify

### New Files (5 files, ~750 lines)

1. `src/types/file-security.ts` (~100 lines)
2. `src/lib/security/magic-number-validator.ts` (~150 lines)
3. `src/lib/security/filename-sanitizer.ts` (~120 lines)
4. `src/lib/security/file-validation.ts` (~200 lines)
5. `src/lib/security/upload-rate-limiter.ts` (~180 lines)

### Modified Files (2 files)

1. `src/app/api/textbooks/hierarchy/route.ts` (add ~40 lines)
2. `src/app/api/textbooks/extract-metadata/route.ts` (add ~20 lines)

### Test Files (6 files, ~720 lines)

1. `src/lib/security/magic-number-validator.test.ts` (~150 lines)
2. `src/lib/security/filename-sanitizer.test.ts` (~120 lines)
3. `src/lib/security/file-validation.test.ts` (~200 lines)
4. `src/lib/security/upload-rate-limiter.test.ts` (~150 lines)
5. `src/tests/integration/file-upload-security.test.ts` (~200 lines)
6. `src/tests/security/file-upload-attacks.test.ts` (~150 lines)

### Documentation Files (1 file)

1. `.research-plan-manifests/evidence/SEC-008-EVIDENCE.md` (created at end)

**Total New Code**: ~1,530 lines (implementation + tests)

---

## Plan Approval Checklist

- [x] Architecture designed with clear module boundaries
- [x] All public APIs specified with types
- [x] Integration points identified
- [x] Testing strategy comprehensive (unit, integration, security)
- [x] Implementation roadmap detailed with time estimates
- [x] Risk assessment completed
- [x] Success criteria clearly defined
- [x] No protected-core modifications
- [x] Follows existing patterns (rate-limiter, error-handler)
- [x] Multi-layer defense approach (OWASP recommended)

---

## Plan Complete Signature

**[PLAN-APPROVED-SEC-008]**

**Summary**: Comprehensive implementation plan created for file upload security. Architecture designed with 5 modular components (file-validation, magic-number-validator, filename-sanitizer, upload-rate-limiter, type definitions). Integration points identified (2 API routes). Testing strategy covers 6 test files (~720 lines). Implementation roadmap detailed with 16 steps over ~4.5 hours total (3 hours implementation, 1.5 hours testing). All requirements validated against OWASP 2025 best practices. Ready for implementation phase.

**Plan Duration**: 45 minutes
**Complexity**: MEDIUM (5 new files, 2 integrations, 6 test files)
**Confidence Level**: HIGH (9/10)
**Risk Level**: LOW (no protected-core modifications, proven patterns)

**Next Phase**: IMPLEMENT (Start with type definitions, then validators)