/**
 * Validation Utility Functions
 *
 * Helper functions for validating data with Zod schemas.
 * Provides consistent error handling and formatting.
 */

import { z, ZodError, ZodSchema } from 'zod';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validate data against a schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with data or errors
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validate and throw on error
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @throws ValidationException if validation fails
 * @returns Validated data
 */
export function validateOrThrow<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationException(formatZodErrors(error));
    }
    throw error;
  }
}

/**
 * Format Zod errors into a consistent structure
 *
 * @param error - Zod error object
 * @returns Array of formatted validation errors
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map(issue => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Custom validation exception
 */
export class ValidationException extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = `Validation failed:\n${errors
      .map(e => `  - ${e.field}: ${e.message}`)
      .join('\n')}`;
    super(message);
    this.name = 'ValidationException';
    this.errors = errors;
  }

  /**
   * Convert to JSON-friendly format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors,
    };
  }
}

/**
 * Validate API request body
 * Convenience wrapper for Next.js API routes
 *
 * @param schema - Zod schema to validate against
 * @param request - Request object or JSON body
 * @returns Validated data
 */
export async function validateRequestBody<T>(
  schema: ZodSchema<T>,
  request: Request | unknown
): Promise<T> {
  let body: unknown;

  if (request instanceof Request) {
    try {
      body = await request.json();
    } catch {
      throw new ValidationException([
        {
          field: 'body',
          message: 'Invalid JSON body',
          code: 'invalid_json',
        },
      ]);
    }
  } else {
    body = request;
  }

  return validateOrThrow(schema, body);
}

/**
 * Validate query parameters
 * Convenience wrapper for Next.js API routes
 *
 * @param schema - Zod schema to validate against
 * @param searchParams - URLSearchParams or object
 * @returns Validated data
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams | Record<string, string | string[]>
): T {
  let params: Record<string, unknown>;

  if (searchParams instanceof URLSearchParams) {
    params = Object.fromEntries(searchParams.entries());
  } else {
    params = searchParams;
  }

  return validateOrThrow(schema, params);
}

/**
 * Type guard helper
 * Validates and narrows type in one operation
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Type predicate
 */
export function is<T>(schema: ZodSchema<T>, data: unknown): data is T {
  return schema.safeParse(data).success;
}

/**
 * Partial validation
 * Returns valid fields and errors separately
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Partial validation result
 */
export function validatePartial<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  data: unknown
): {
  validFields: Partial<T>;
  errors: ValidationError[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      validFields: result.data,
      errors: [],
    };
  }

  const validFields: Partial<T> = {};
  const errors: ValidationError[] = [];

  if (typeof data === 'object' && data !== null) {
    const dataObj = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(dataObj)) {
      try {
        // Validate individual field
        if (schema instanceof z.ZodObject) {
          const shape = schema.shape;
          if (key in shape) {
            const fieldSchema = shape[key as keyof typeof shape];
            (validFields as Record<string, unknown>)[key] = fieldSchema.parse(value);
          }
        }
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...formatZodErrors(error));
        }
      }
    }
  }

  // Add remaining errors
  if (result.error) {
    errors.push(...formatZodErrors(result.error));
  }

  return { validFields, errors };
}
