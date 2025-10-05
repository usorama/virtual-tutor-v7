/**
 * API endpoint for uploading textbook PDF files to Supabase Storage
 *
 * POST /api/textbooks/upload
 * - Handles multipart/form-data file uploads
 * - Validates PDF files (max 50MB per file, max 50 files)
 * - Stores files in Supabase Storage bucket 'textbooks'
 * - Returns file URLs and metadata
 *
 * Part of FC-00-AC (Book Hierarchy Integration)
 * Implements SEC-008 file validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  validateUploadedFile,
  getValidationOptionsForFileType
} from '@/lib/security/file-validation';
import {
  handleAPIError,
  createErrorContext,
  createAPIError
} from '@/lib/errors/api-error-handler';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/error-types';

// Constants
const MAX_FILES_PER_REQUEST = 50;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const STORAGE_BUCKET = 'textbooks';

/**
 * POST /api/textbooks/upload
 *
 * Upload PDF files to Supabase Storage
 *
 * Request (multipart/form-data):
 * - bookId: string (UUID of book)
 * - file_0: File (PDF)
 * - file_1: File (PDF) [optional]
 * - ... up to file_49
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   data: {
 *     filesUploaded: string[],
 *     uploadPaths: string[],
 *     totalSize: number
 *   }
 * }
 *
 * Error Responses:
 * - 400: Missing bookId, no files, or invalid file type
 * - 401: Not authenticated
 * - 413: File too large
 * - 500: Storage upload error
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Test mode bypass: Check for service role key and create appropriate client
    let authenticated = false;
    let user: { id: string } | null = null;
    let supabase;

    if (process.env.TEST_MODE === 'true') {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token === process.env.SUPABASE_SECRET_KEY) {
          authenticated = true;
          // Create service role client (bypasses RLS) for tests
          supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
          );
          // Create mock user for test mode
          user = { id: 'test-user-id' };
        }
      }
    }

    // If not in test mode or test auth failed, use normal client
    if (!supabase) {
      supabase = await createClient();
    }

    // Check authentication
    if (!authenticated) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        const error = createAPIError(
          new Error('Authentication required'),
          requestId,
          'Please sign in to continue',
          ErrorCode.AUTHENTICATION_ERROR
        );

        return handleAPIError(
          error,
          requestId,
          createErrorContext(
            { url: request.url, method: 'POST' },
            undefined,
            ErrorSeverity.MEDIUM
          )
        );
      }
      user = authUser;
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      const error = createAPIError(
        parseError,
        requestId,
        'Invalid multipart/form-data request',
        ErrorCode.VALIDATION_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.LOW
        )
      );
    }

    // Extract bookId parameter
    const bookId = formData.get('bookId');
    if (!bookId || typeof bookId !== 'string') {
      const error = createAPIError(
        new Error('Missing required parameter: bookId'),
        requestId,
        'bookId is required',
        ErrorCode.MISSING_REQUIRED_FIELD
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.LOW
        )
      );
    }

    // Extract files from form data
    const files: File[] = [];
    for (let i = 0; i < MAX_FILES_PER_REQUEST; i++) {
      const file = formData.get(`file_${i}`);
      if (file instanceof File) {
        files.push(file);
      }
    }

    // Validate we have files
    if (files.length === 0) {
      const error = createAPIError(
        new Error('No files provided'),
        requestId,
        'Please upload at least one PDF file',
        ErrorCode.MISSING_REQUIRED_FIELD
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.LOW
        )
      );
    }

    // Validate file count
    if (files.length > MAX_FILES_PER_REQUEST) {
      const error = createAPIError(
        new Error(`Too many files: ${files.length}`),
        requestId,
        `Maximum ${MAX_FILES_PER_REQUEST} files allowed per request`,
        ErrorCode.VALIDATION_ERROR
      );

      return handleAPIError(
        error,
        requestId,
        createErrorContext(
          { url: request.url, method: 'POST' },
          { id: user!.id },
          ErrorSeverity.LOW
        )
      );
    }

    // SEC-008: Validate each file using comprehensive validation
    const validationOptions = getValidationOptionsForFileType('textbook');
    const validatedFiles: Array<{
      file: File;
      sanitizedName: string;
    }> = [];

    for (const file of files) {
      // Validate file
      const validationResult = await validateUploadedFile(file, validationOptions);

      if (!validationResult.isValid) {
        const error = createAPIError(
          new Error(`File validation failed: ${file.name}`),
          requestId,
          validationResult.errors.join(', '),
          ErrorCode.VALIDATION_ERROR,
          { filename: file.name, errors: validationResult.errors }
        );

        return handleAPIError(
          error,
          requestId,
          createErrorContext(
            { url: request.url, method: 'POST' },
            { id: user!.id },
            ErrorSeverity.LOW
          )
        );
      }

      // Check file size explicitly (defense-in-depth)
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const error = createAPIError(
          new Error(`File too large: ${file.name}`),
          requestId,
          `File ${file.name} is ${fileSizeMB} MB. Maximum allowed is 50 MB.`,
          ErrorCode.FILE_TOO_LARGE,
          {
            fileName: file.name,
            fileSize: file.size,
            maxSize: MAX_FILE_SIZE
          }
        );

        return handleAPIError(
          error,
          requestId,
          createErrorContext(
            { url: request.url, method: 'POST' },
            { id: user!.id },
            ErrorSeverity.LOW
          )
        );
      }

      validatedFiles.push({
        file,
        sanitizedName: validationResult.metadata.sanitizedFilename
      });
    }

    // Upload files to Supabase Storage
    const uploadedFiles: string[] = [];
    const uploadPaths: string[] = [];
    let totalSize = 0;

    for (const { file, sanitizedName } of validatedFiles) {
      try {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}_${sanitizedName}`;
        const storagePath = `${bookId}/${uniqueFileName}`;

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          const error = createAPIError(
            uploadError,
            requestId,
            `Failed to upload ${file.name}: ${uploadError.message}`,
            ErrorCode.FILE_PROCESSING_ERROR,
            { filename: file.name, originalError: uploadError }
          );

          return handleAPIError(
            error,
            requestId,
            createErrorContext(
              { url: request.url, method: 'POST' },
              { id: user!.id },
              ErrorSeverity.HIGH
            )
          );
        }

        uploadedFiles.push(file.name);
        uploadPaths.push(data.path);
        totalSize += file.size;

        console.log(`✅ Uploaded: ${file.name} → ${data.path}`);
      } catch (fileError) {
        const error = createAPIError(
          fileError,
          requestId,
          `Failed to process file ${file.name}`,
          ErrorCode.FILE_PROCESSING_ERROR,
          { filename: file.name }
        );

        return handleAPIError(
          error,
          requestId,
          createErrorContext(
            { url: request.url, method: 'POST' },
            { id: user!.id },
            ErrorSeverity.HIGH
          )
        );
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        filesUploaded: uploadedFiles,
        uploadPaths,
        totalSize
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId
      }
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId
      }
    });

  } catch (error) {
    return handleAPIError(
      error,
      requestId,
      createErrorContext(
        { url: request.url, method: 'POST' },
        undefined,
        ErrorSeverity.CRITICAL
      )
    );
  }
}
