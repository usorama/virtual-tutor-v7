/**
 * Tests for runtime type validators
 */

import {
  validate,
  validateObject,
  composeValidators,
  optional,
  nullable,
  type ValidationResult,
  type ValidationError
} from './validators';
import { isString, isNumber, isBoolean } from './type-guards';

describe('Runtime Type Validators', () => {
  describe('validate', () => {
    it('should return success for valid value', () => {
      const result = validate('test', isString);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test');
      }
    });

    it('should return error for invalid value', () => {
      const result = validate(123, isString);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Validation failed');
        expect(result.error.received).toBe(123);
      }
    });

    it('should use custom error message', () => {
      const result = validate(123, isString, {
        errorMessage: 'Must be string'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Must be string');
      }
    });

    it('should include field name in error', () => {
      const result = validate(123, isString, {
        field: 'username'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe('username');
      }
    });

    it('should include expected type in error', () => {
      const result = validate(123, isString, {
        expected: 'string'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.expected).toBe('string');
      }
    });
  });

  describe('validateObject', () => {
    interface User {
      name: string;
      age: number;
      active: boolean;
    }

    const userValidators = {
      name: isString,
      age: isNumber,
      active: isBoolean
    };

    it('should validate valid object', () => {
      const validUser = {
        name: 'Alice',
        age: 30,
        active: true
      };

      const result = validateObject<User>(validUser, userValidators);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.age).toBe(30);
        expect(result.data.active).toBe(true);
      }
    });

    it('should fail for invalid field', () => {
      const invalidUser = {
        name: 'Alice',
        age: 'thirty', // wrong type
        active: true
      };

      const result = validateObject<User>(invalidUser, userValidators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe('age');
      }
    });

    it('should fail for non-object', () => {
      const result = validateObject<User>('not an object', userValidators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected object');
      }
    });

    it('should fail for null', () => {
      const result = validateObject<User>(null, userValidators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected object');
      }
    });

    it('should fail for array', () => {
      const result = validateObject<User>([], userValidators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Expected object');
      }
    });
  });

  describe('composeValidators', () => {
    const isNonEmptyString = (value: unknown): value is string => {
      return typeof value === 'string' && value.length > 0;
    };

    const isEmail = (value: unknown): value is string => {
      return typeof value === 'string' && value.includes('@');
    };

    const isValidEmail = composeValidators(isNonEmptyString, isEmail);

    it('should pass when all validators pass', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should fail when first validator fails', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should fail when second validator fails', () => {
      expect(isValidEmail('no-at-sign')).toBe(false);
    });

    it('should fail for non-string', () => {
      expect(isValidEmail(123)).toBe(false);
    });

    it('should work with single validator', () => {
      const singleValidator = composeValidators(isString);
      expect(singleValidator('test')).toBe(true);
      expect(singleValidator(123)).toBe(false);
    });
  });

  describe('optional', () => {
    const optionalString = optional(isString);

    it('should accept undefined', () => {
      expect(optionalString(undefined)).toBe(true);
    });

    it('should accept valid value', () => {
      expect(optionalString('test')).toBe(true);
      expect(optionalString('')).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(optionalString(123)).toBe(false);
      expect(optionalString({})).toBe(false);
      expect(optionalString([])).toBe(false);
    });

    it('should reject null', () => {
      expect(optionalString(null)).toBe(false);
    });
  });

  describe('nullable', () => {
    const nullableString = nullable(isString);

    it('should accept null', () => {
      expect(nullableString(null)).toBe(true);
    });

    it('should accept valid value', () => {
      expect(nullableString('test')).toBe(true);
      expect(nullableString('')).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(nullableString(123)).toBe(false);
      expect(nullableString({})).toBe(false);
      expect(nullableString([])).toBe(false);
    });

    it('should reject undefined', () => {
      expect(nullableString(undefined)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested validation', () => {
      const isNested = (value: unknown): value is { inner: { value: string } } => {
        if (typeof value !== 'object' || value === null) return false;
        const obj = value as Record<string, unknown>;
        if (typeof obj.inner !== 'object' || obj.inner === null) return false;
        const inner = obj.inner as Record<string, unknown>;
        return typeof inner.value === 'string';
      };

      const validNested = { inner: { value: 'test' } };
      const result = validate(validNested, isNested);
      expect(result.success).toBe(true);
    });

    it('should handle empty objects', () => {
      interface EmptyType {}
      const emptyValidators: { [K in keyof EmptyType]: (val: unknown) => val is EmptyType[K] } = {};

      const result = validateObject<EmptyType>({}, emptyValidators);
      expect(result.success).toBe(true);
    });

    it('should preserve types through composition', () => {
      const composed = composeValidators(
        optional(isString),
        (v): v is string | undefined => v === undefined || (typeof v === 'string' && v.length > 0)
      );

      expect(composed(undefined)).toBe(true);
      expect(composed('valid')).toBe(true);
      expect(composed('')).toBe(false);
    });
  });

  describe('Type Narrowing', () => {
    it('should properly narrow types in success case', () => {
      const result = validate('test', isString);

      // TypeScript should know result.data is string when success is true
      if (result.success) {
        const upper: string = result.data.toUpperCase();
        expect(upper).toBe('TEST');
      }
    });

    it('should provide error details in failure case', () => {
      const result = validate(123, isString, { field: 'testField' });

      // TypeScript should know result.error exists when success is false
      if (!result.success) {
        const errorField: string | undefined = result.error.field;
        expect(errorField).toBe('testField');
      }
    });
  });
});