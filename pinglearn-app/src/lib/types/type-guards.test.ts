/**
 * Tests for runtime type guards
 */

import {
  isDefined,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isEmail,
  isURL,
  isArrayOf,
  isNonEmptyArray,
  isRecordOf,
  hasKey,
  isOneOf,
  isAPIError,
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
  isFeatureFlags,
  isEnvironmentConfig,
  isString,
  isNumber,
  isBoolean,
  isObject
} from './type-guards';

describe('Runtime Type Guards', () => {
  describe('Primitive Guards', () => {
    describe('isDefined', () => {
      it('should return true for defined values', () => {
        expect(isDefined('test')).toBe(true);
        expect(isDefined(0)).toBe(true);
        expect(isDefined(false)).toBe(true);
        expect(isDefined('')).toBe(true);
        expect(isDefined([])).toBe(true);
        expect(isDefined({})).toBe(true);
      });

      it('should return false for null or undefined', () => {
        expect(isDefined(null)).toBe(false);
        expect(isDefined(undefined)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('should return true for non-empty strings', () => {
        expect(isNonEmptyString('test')).toBe(true);
        expect(isNonEmptyString(' ')).toBe(true);
        expect(isNonEmptyString('a')).toBe(true);
      });

      it('should return false for empty string', () => {
        expect(isNonEmptyString('')).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isNonEmptyString(123)).toBe(false);
        expect(isNonEmptyString(null)).toBe(false);
        expect(isNonEmptyString(undefined)).toBe(false);
        expect(isNonEmptyString({})).toBe(false);
      });
    });

    describe('isPositiveNumber', () => {
      it('should return true for positive numbers', () => {
        expect(isPositiveNumber(1)).toBe(true);
        expect(isPositiveNumber(0.1)).toBe(true);
        expect(isPositiveNumber(1000)).toBe(true);
        expect(isPositiveNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
      });

      it('should return false for zero and negative', () => {
        expect(isPositiveNumber(0)).toBe(false);
        expect(isPositiveNumber(-1)).toBe(false);
        expect(isPositiveNumber(-0.1)).toBe(false);
      });

      it('should return false for NaN', () => {
        expect(isPositiveNumber(NaN)).toBe(false);
      });

      it('should return false for non-numbers', () => {
        expect(isPositiveNumber('1')).toBe(false);
        expect(isPositiveNumber(null)).toBe(false);
      });
    });

    describe('isNonNegativeNumber', () => {
      it('should return true for non-negative numbers', () => {
        expect(isNonNegativeNumber(0)).toBe(true);
        expect(isNonNegativeNumber(1)).toBe(true);
        expect(isNonNegativeNumber(1000)).toBe(true);
      });

      it('should return false for negative numbers', () => {
        expect(isNonNegativeNumber(-1)).toBe(false);
        expect(isNonNegativeNumber(-0.1)).toBe(false);
      });

      it('should return false for NaN', () => {
        expect(isNonNegativeNumber(NaN)).toBe(false);
      });
    });

    describe('isEmail', () => {
      it('should return true for valid emails', () => {
        expect(isEmail('user@example.com')).toBe(true);
        expect(isEmail('test.user@domain.co.uk')).toBe(true);
        expect(isEmail('name+tag@company.org')).toBe(true);
      });

      it('should return false for invalid emails', () => {
        expect(isEmail('not-an-email')).toBe(false);
        expect(isEmail('@example.com')).toBe(false);
        expect(isEmail('user@')).toBe(false);
        expect(isEmail('user@domain')).toBe(false);
        expect(isEmail('user domain@example.com')).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isEmail(123)).toBe(false);
        expect(isEmail(null)).toBe(false);
        expect(isEmail({})).toBe(false);
      });
    });

    describe('isURL', () => {
      it('should return true for valid URLs', () => {
        expect(isURL('https://example.com')).toBe(true);
        expect(isURL('http://localhost:3000')).toBe(true);
        expect(isURL('https://sub.domain.com/path')).toBe(true);
        expect(isURL('ftp://files.example.com')).toBe(true);
      });

      it('should return false for invalid URLs', () => {
        expect(isURL('not-a-url')).toBe(false);
        expect(isURL('example.com')).toBe(false);
        expect(isURL('//example.com')).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isURL(123)).toBe(false);
        expect(isURL(null)).toBe(false);
      });
    });
  });

  describe('Generic Utility Guards', () => {
    describe('isArrayOf', () => {
      it('should validate array of strings', () => {
        expect(isArrayOf(['a', 'b', 'c'], isString)).toBe(true);
      });

      it('should validate array of numbers', () => {
        expect(isArrayOf([1, 2, 3], isNumber)).toBe(true);
      });

      it('should reject mixed arrays', () => {
        expect(isArrayOf(['a', 1, 'c'], isString)).toBe(false);
        expect(isArrayOf([1, 'two', 3], isNumber)).toBe(false);
      });

      it('should accept empty array', () => {
        expect(isArrayOf([], isString)).toBe(true);
      });

      it('should reject non-arrays', () => {
        expect(isArrayOf('not-array', isString)).toBe(false);
        expect(isArrayOf({}, isString)).toBe(false);
        expect(isArrayOf(null, isString)).toBe(false);
      });
    });

    describe('isNonEmptyArray', () => {
      it('should accept non-empty arrays', () => {
        expect(isNonEmptyArray([1])).toBe(true);
        expect(isNonEmptyArray([1, 2, 3])).toBe(true);
        expect(isNonEmptyArray(['a', 'b'])).toBe(true);
      });

      it('should reject empty arrays', () => {
        expect(isNonEmptyArray([])).toBe(false);
      });

      it('should validate elements if validator provided', () => {
        expect(isNonEmptyArray([1, 2, 3], isNumber)).toBe(true);
        expect(isNonEmptyArray([1, 'two', 3], isNumber)).toBe(false);
      });

      it('should reject non-arrays', () => {
        expect(isNonEmptyArray('not-array')).toBe(false);
        expect(isNonEmptyArray(null)).toBe(false);
      });
    });

    describe('isRecordOf', () => {
      it('should validate record with all matching values', () => {
        const record = { a: 'one', b: 'two', c: 'three' };
        expect(isRecordOf(record, isString)).toBe(true);
      });

      it('should validate record with numbers', () => {
        const record = { x: 1, y: 2, z: 3 };
        expect(isRecordOf(record, isNumber)).toBe(true);
      });

      it('should reject record with mismatched values', () => {
        const record = { a: 'one', b: 2, c: 'three' };
        expect(isRecordOf(record, isString)).toBe(false);
      });

      it('should accept empty objects', () => {
        expect(isRecordOf({}, isString)).toBe(true);
      });

      it('should reject non-objects', () => {
        expect(isRecordOf('not-object', isString)).toBe(false);
        expect(isRecordOf(null, isString)).toBe(false);
        expect(isRecordOf([], isString)).toBe(false);
      });
    });

    describe('hasKey', () => {
      it('should return true for existing keys', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKey(obj, 'a')).toBe(true);
        expect(hasKey(obj, 'b')).toBe(true);
      });

      it('should return false for non-existent keys', () => {
        const obj = { a: 1, b: 2 };
        expect(hasKey(obj, 'c')).toBe(false);
        expect(hasKey(obj, 'z')).toBe(false);
      });

      it('should work with symbol keys', () => {
        const sym = Symbol('test');
        const obj = { [sym]: 'value' };
        expect(hasKey(obj, sym)).toBe(true);
      });
    });

    describe('isOneOf', () => {
      it('should accept allowed values', () => {
        const allowed = ['red', 'green', 'blue'] as const;
        expect(isOneOf('red', allowed)).toBe(true);
        expect(isOneOf('green', allowed)).toBe(true);
        expect(isOneOf('blue', allowed)).toBe(true);
      });

      it('should reject disallowed values', () => {
        const allowed = ['red', 'green', 'blue'] as const;
        expect(isOneOf('yellow', allowed)).toBe(false);
        expect(isOneOf(123, allowed)).toBe(false);
      });

      it('should work with numbers', () => {
        const allowed = [1, 2, 3] as const;
        expect(isOneOf(1, allowed)).toBe(true);
        expect(isOneOf(4, allowed)).toBe(false);
      });
    });
  });

  describe('API Response Guards', () => {
    describe('isAPIError', () => {
      it('should accept valid API errors', () => {
        const error = {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        };
        expect(isAPIError(error)).toBe(true);
      });

      it('should accept errors with details', () => {
        const error = {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email' }
        };
        expect(isAPIError(error)).toBe(true);
      });

      it('should reject invalid errors', () => {
        expect(isAPIError({ code: 'ERROR' })).toBe(false); // missing message
        expect(isAPIError({ message: 'Error' })).toBe(false); // missing code
        expect(isAPIError({ code: '', message: 'Error' })).toBe(false); // empty code
        expect(isAPIError('not-error')).toBe(false);
        expect(isAPIError(null)).toBe(false);
      });
    });

    describe('isSuccessResponse', () => {
      it('should accept valid success responses', () => {
        const response = {
          success: true,
          data: { id: '123', name: 'Test' }
        };

        const dataValidator = (data: unknown): data is { id: string; name: string } => {
          return typeof data === 'object' &&
                 data !== null &&
                 'id' in data &&
                 'name' in data;
        };

        expect(isSuccessResponse(response, dataValidator)).toBe(true);
      });

      it('should accept success responses with timestamp', () => {
        const response = {
          success: true,
          data: 'test-data',
          timestamp: '2025-09-30T00:00:00Z'
        };

        expect(isSuccessResponse(response, isString)).toBe(true);
      });

      it('should reject responses with invalid data', () => {
        const response = {
          success: true,
          data: 'wrong-type'
        };

        const dataValidator = (data: unknown): data is object => {
          return typeof data === 'object' && data !== null;
        };

        expect(isSuccessResponse(response, dataValidator)).toBe(false);
      });

      it('should reject responses with success false', () => {
        const response = {
          success: false,
          data: 'test'
        };

        expect(isSuccessResponse(response, isString)).toBe(false);
      });

      it('should reject responses without data', () => {
        const response = {
          success: true
        };

        expect(isSuccessResponse(response, isString)).toBe(false);
      });
    });

    describe('isErrorResponse', () => {
      it('should accept valid error responses', () => {
        const response = {
          success: false,
          error: {
            code: 'ERROR',
            message: 'Something went wrong'
          }
        };

        expect(isErrorResponse(response)).toBe(true);
      });

      it('should accept error responses with timestamp', () => {
        const response = {
          success: false,
          error: {
            code: 'ERROR',
            message: 'Error occurred'
          },
          timestamp: '2025-09-30T00:00:00Z'
        };

        expect(isErrorResponse(response)).toBe(true);
      });

      it('should reject responses without error', () => {
        const response = {
          success: false
        };

        expect(isErrorResponse(response)).toBe(false);
      });

      it('should reject responses with success true', () => {
        const response = {
          success: true,
          error: {
            code: 'ERROR',
            message: 'Error'
          }
        };

        expect(isErrorResponse(response)).toBe(false);
      });
    });

    describe('isPaginatedResponse', () => {
      it('should accept valid paginated responses', () => {
        const response = {
          success: true,
          data: [1, 2, 3],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 3,
            totalPages: 1
          }
        };

        expect(isPaginatedResponse(response, isNumber)).toBe(true);
      });

      it('should validate data items', () => {
        const response = {
          success: true,
          data: ['a', 'b', 'c'],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 3,
            totalPages: 1
          }
        };

        expect(isPaginatedResponse(response, isString)).toBe(true);
        expect(isPaginatedResponse(response, isNumber)).toBe(false);
      });

      it('should reject responses with invalid pagination', () => {
        const response = {
          success: true,
          data: [1, 2, 3],
          pagination: {
            page: 0, // invalid: must be positive
            pageSize: 10,
            total: 3,
            totalPages: 1
          }
        };

        expect(isPaginatedResponse(response, isNumber)).toBe(false);
      });

      it('should reject responses without pagination', () => {
        const response = {
          success: true,
          data: [1, 2, 3]
        };

        expect(isPaginatedResponse(response, isNumber)).toBe(false);
      });

      it('should reject responses with success false', () => {
        const response = {
          success: false,
          data: [1, 2, 3],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 3,
            totalPages: 1
          }
        };

        expect(isPaginatedResponse(response, isNumber)).toBe(false);
      });
    });
  });

  describe('Configuration Guards', () => {
    describe('isFeatureFlags', () => {
      it('should accept valid feature flags', () => {
        const flags = {
          enableNewUI: true,
          enableBeta: false,
          debugMode: true
        };

        expect(isFeatureFlags(flags)).toBe(true);
      });

      it('should accept empty flags object', () => {
        expect(isFeatureFlags({})).toBe(true);
      });

      it('should reject flags with non-boolean values', () => {
        const flags = {
          enableNewUI: true,
          enableBeta: 'yes' // wrong type
        };

        expect(isFeatureFlags(flags)).toBe(false);
      });

      it('should reject non-objects', () => {
        expect(isFeatureFlags('not-object')).toBe(false);
        expect(isFeatureFlags(null)).toBe(false);
        expect(isFeatureFlags([])).toBe(false);
      });
    });

    describe('isEnvironmentConfig', () => {
      it('should accept valid environment config', () => {
        const config = {
          environment: 'production' as const,
          apiUrl: 'https://api.example.com',
          debug: false
        };

        expect(isEnvironmentConfig(config)).toBe(true);
      });

      it('should accept all valid environments', () => {
        const devConfig = {
          environment: 'development' as const,
          apiUrl: 'http://localhost:3000',
          debug: true
        };

        const stagingConfig = {
          environment: 'staging' as const,
          apiUrl: 'https://staging.example.com',
          debug: false
        };

        expect(isEnvironmentConfig(devConfig)).toBe(true);
        expect(isEnvironmentConfig(stagingConfig)).toBe(true);
      });

      it('should reject invalid environment', () => {
        const config = {
          environment: 'invalid',
          apiUrl: 'https://api.example.com',
          debug: false
        };

        expect(isEnvironmentConfig(config)).toBe(false);
      });

      it('should reject invalid API URL', () => {
        const config = {
          environment: 'production' as const,
          apiUrl: 'not-a-url',
          debug: false
        };

        expect(isEnvironmentConfig(config)).toBe(false);
      });

      it('should reject non-boolean debug', () => {
        const config = {
          environment: 'production' as const,
          apiUrl: 'https://api.example.com',
          debug: 'yes' // wrong type
        };

        expect(isEnvironmentConfig(config)).toBe(false);
      });
    });
  });

  describe('Performance', () => {
    it('should execute simple guards in <1ms per call', () => {
      const iterations = 10000;
      const testValue = 'test-string';

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isString(testValue);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should execute complex guards in <1ms per call', () => {
      const iterations = 1000;
      const testValue = {
        success: true,
        data: [1, 2, 3, 4, 5],
        pagination: {
          page: 1,
          pageSize: 5,
          total: 5,
          totalPages: 1
        }
      };

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isPaginatedResponse(testValue, isNumber);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should execute email validation in <1ms per call', () => {
      const iterations = 10000;
      const testEmail = 'user@example.com';

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isEmail(testEmail);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Type Narrowing', () => {
    it('should narrow types correctly in conditional blocks', () => {
      const value: unknown = 'test';

      if (isString(value)) {
        // TypeScript should know value is string here
        const upper: string = value.toUpperCase();
        expect(upper).toBe('TEST');
      }
    });

    it('should narrow array element types', () => {
      const data: unknown = [1, 2, 3];

      if (isArrayOf(data, isNumber)) {
        // TypeScript should know data is number[]
        const sum = data.reduce((a, b) => a + b, 0);
        expect(sum).toBe(6);
      }
    });

    it('should narrow generic response types', () => {
      const response: unknown = {
        success: true,
        data: 'test-data'
      };

      if (isSuccessResponse(response, isString)) {
        // TypeScript should know response.data is string
        const upper: string = response.data.toUpperCase();
        expect(upper).toBe('TEST-DATA');
      }
    });
  });
});