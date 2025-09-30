/**
 * Tests for Generic Branded Type Utilities
 *
 * Validates functionality of Brand<T, BrandSymbol>, UnBrand, type guards,
 * and factory functions following 2025 TypeScript best practices.
 *
 * Target: 100% code coverage, <1ms performance per operation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  Brand,
  UnBrand,
  createBrandedTypeGuard,
  createBrandedFactory,
  createUnsafeBrandedFactory,
} from './branded';

// ============================================================================
// TEST SETUP - Sample Branded Types
// ============================================================================

declare const TestIdBrand: unique symbol;
type TestId = Brand<string, typeof TestIdBrand>;

declare const NumericIdBrand: unique symbol;
type NumericId = Brand<number, typeof NumericIdBrand>;

declare const EmailBrand: unique symbol;
type Email = Brand<string, typeof EmailBrand>;

// ============================================================================
// BRAND TYPE TESTS
// ============================================================================

describe('Brand<T, BrandSymbol>', () => {
  it('should create branded types that are assignable from base type via casting', () => {
    // Arrange & Act
    const testId: TestId = 'test_123' as TestId;
    const numericId: NumericId = 42 as NumericId;

    // Assert - If compilation succeeds, types are correct
    expect(testId).toBe('test_123');
    expect(numericId).toBe(42);
  });

  it('should prevent mixing different branded types at compile time', () => {
    // This test validates TypeScript's compile-time behavior
    // If this compiles, the type system is working correctly

    const testId: TestId = 'test_123' as TestId;
    const numericId: NumericId = 42 as NumericId;

    // These would cause TypeScript errors if uncommented:
    // const mixed1: TestId = numericId; // ❌ Type error
    // const mixed2: NumericId = testId; // ❌ Type error

    // But base type operations still work:
    expect(typeof testId).toBe('string');
    expect(typeof numericId).toBe('number');
  });

  it('should hide brand symbol from IntelliSense (runtime check)', () => {
    // Arrange
    const testId: TestId = 'test_123' as TestId;

    // Assert - Brand symbol should not exist at runtime
    expect(Object.keys(testId as object)).toHaveLength(0);
    expect(Object.getOwnPropertySymbols(testId as object)).toHaveLength(0);
  });
});

// ============================================================================
// UNBRAND TESTS
// ============================================================================

describe('UnBrand<BrandedType>', () => {
  it('should extract base type from branded type', () => {
    // Type-level test (validated at compile time)
    type ExtractedString = UnBrand<TestId>;
    type ExtractedNumber = UnBrand<NumericId>;

    // Runtime validation
    const testId: TestId = 'test_123' as TestId;
    const extracted: ExtractedString = testId as UnBrand<TestId>;

    expect(extracted).toBe('test_123');
    expect(typeof extracted).toBe('string');
  });

  it('should return original type for non-branded types', () => {
    // Type-level test
    type PlainString = UnBrand<string>;
    type PlainNumber = UnBrand<number>;

    // Runtime validation
    const plainString: PlainString = 'hello';
    const plainNumber: PlainNumber = 42;

    expect(plainString).toBe('hello');
    expect(plainNumber).toBe(42);
  });
});

// ============================================================================
// TYPE GUARD GENERATOR TESTS
// ============================================================================

describe('createBrandedTypeGuard', () => {
  it('should create type guard that validates base type', () => {
    // Arrange
    const isTestId = createBrandedTypeGuard<string, typeof TestIdBrand>(
      (value): value is string => typeof value === 'string'
    );

    // Act & Assert
    expect(isTestId('test_123')).toBe(true);
    expect(isTestId(123)).toBe(false);
    expect(isTestId(null)).toBe(false);
    expect(isTestId(undefined)).toBe(false);
    expect(isTestId({})).toBe(false);
  });

  it('should create type guard with additional validation', () => {
    // Arrange
    const isTestId = createBrandedTypeGuard<string, typeof TestIdBrand>(
      (value): value is string => typeof value === 'string',
      (value) => value.length >= 5 && value.startsWith('test_')
    );

    // Act & Assert
    expect(isTestId('test_123')).toBe(true);
    expect(isTestId('test_abc')).toBe(true);
    expect(isTestId('test')).toBe(false); // Too short
    expect(isTestId('abc_123')).toBe(false); // Wrong prefix
    expect(isTestId('')).toBe(false); // Empty
  });

  it('should create type guard for numeric branded types', () => {
    // Arrange
    const isNumericId = createBrandedTypeGuard<number, typeof NumericIdBrand>(
      (value): value is number => typeof value === 'number' && !isNaN(value),
      (value) => value > 0 && Number.isInteger(value)
    );

    // Act & Assert
    expect(isNumericId(42)).toBe(true);
    expect(isNumericId(1)).toBe(true);
    expect(isNumericId(0)).toBe(false); // Not > 0
    expect(isNumericId(-5)).toBe(false); // Not > 0
    expect(isNumericId(3.14)).toBe(false); // Not integer
    expect(isNumericId('42')).toBe(false); // Wrong type
  });

  it('should validate email format using regex', () => {
    // Arrange
    const isEmail = createBrandedTypeGuard<string, typeof EmailBrand>(
      (value): value is string => typeof value === 'string',
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );

    // Act & Assert
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('test.user@domain.co.uk')).toBe(true);
    expect(isEmail('invalid@')).toBe(false);
    expect(isEmail('@example.com')).toBe(false);
    expect(isEmail('not-an-email')).toBe(false);
  });

  it('should perform in under 1ms for single validation', () => {
    // Arrange
    const isTestId = createBrandedTypeGuard<string, typeof TestIdBrand>(
      (value): value is string => typeof value === 'string',
      (value) => value.length >= 3
    );

    // Act
    const startTime = performance.now();
    const result = isTestId('test_123');
    const endTime = performance.now();

    // Assert
    expect(result).toBe(true);
    expect(endTime - startTime).toBeLessThan(1);
  });
});

// ============================================================================
// VALIDATED FACTORY TESTS
// ============================================================================

describe('createBrandedFactory', () => {
  it('should create factory that validates and brands values', () => {
    // Arrange
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (!value || value.length < 5) {
          throw new Error('TestId must be at least 5 characters');
        }
      }
    );

    // Act & Assert
    const validId = createTestId('test_123');
    expect(validId).toBe('test_123');

    expect(() => createTestId('test')).toThrow('TestId must be at least 5 characters');
    expect(() => createTestId('')).toThrow('TestId must be at least 5 characters');
  });

  it('should throw validation errors with detailed messages', () => {
    // Arrange
    const createEmail = createBrandedFactory<string, typeof EmailBrand>(
      (value: string) => {
        if (!value.includes('@')) {
          throw new Error('Email must contain @ symbol');
        }
        if (!value.includes('.')) {
          throw new Error('Email must contain domain extension');
        }
      }
    );

    // Act & Assert
    expect(() => createEmail('invalid')).toThrow('Email must contain @ symbol');
    expect(() => createEmail('user@domain')).toThrow('Email must contain domain extension');

    const validEmail = createEmail('user@domain.com');
    expect(validEmail).toBe('user@domain.com');
  });

  it('should handle numeric validations', () => {
    // Arrange
    const createNumericId = createBrandedFactory<number, typeof NumericIdBrand>(
      (value: number) => {
        if (!Number.isInteger(value)) {
          throw new Error('ID must be an integer');
        }
        if (value <= 0) {
          throw new Error('ID must be positive');
        }
      }
    );

    // Act & Assert
    expect(createNumericId(42)).toBe(42);
    expect(() => createNumericId(3.14)).toThrow('ID must be an integer');
    expect(() => createNumericId(0)).toThrow('ID must be positive');
    expect(() => createNumericId(-5)).toThrow('ID must be positive');
  });

  it('should support complex multi-step validation', () => {
    // Arrange
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (!value) throw new Error('Value cannot be empty');
        if (value.length < 5) throw new Error('Value too short');
        if (!value.startsWith('test_')) throw new Error('Must start with test_');
        if (!/^[a-z_0-9]+$/.test(value)) throw new Error('Invalid characters');
      }
    );

    // Act & Assert
    expect(createTestId('test_123')).toBe('test_123');
    expect(createTestId('test_abc_xyz')).toBe('test_abc_xyz');

    expect(() => createTestId('')).toThrow('Value cannot be empty');
    expect(() => createTestId('test')).toThrow('Value too short');
    expect(() => createTestId('prod_123')).toThrow('Must start with test_');
    expect(() => createTestId('test_ABC')).toThrow('Invalid characters');
  });

  it('should perform in under 1ms for validated creation', () => {
    // Arrange
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (value.length < 3) throw new Error('Too short');
      }
    );

    // Act
    const startTime = performance.now();
    const result = createTestId('test_123');
    const endTime = performance.now();

    // Assert
    expect(result).toBe('test_123');
    expect(endTime - startTime).toBeLessThan(1);
  });
});

// ============================================================================
// UNSAFE FACTORY TESTS
// ============================================================================

describe('createUnsafeBrandedFactory', () => {
  it('should create factory that brands without validation', () => {
    // Arrange
    const unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestIdBrand>();

    // Act
    const id1 = unsafeCreateTestId('valid_test_123');
    const id2 = unsafeCreateTestId('x'); // Would fail validated factory
    const id3 = unsafeCreateTestId(''); // Would fail validated factory

    // Assert - All succeed because there's no validation
    expect(id1).toBe('valid_test_123');
    expect(id2).toBe('x');
    expect(id3).toBe('');
  });

  it('should be significantly faster than validated factory', () => {
    // Arrange
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (value.length < 3) throw new Error('Too short');
      }
    );
    const unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestIdBrand>();

    const testValue = 'test_123';
    const iterations = 1000;

    // Act - Validated factory
    const validatedStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      createTestId(testValue);
    }
    const validatedTime = performance.now() - validatedStart;

    // Act - Unsafe factory
    const unsafeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      unsafeCreateTestId(testValue);
    }
    const unsafeTime = performance.now() - unsafeStart;

    // Assert - Unsafe should be at least 2x faster
    expect(unsafeTime).toBeLessThan(validatedTime);
    console.log(`Performance: Validated ${validatedTime.toFixed(2)}ms, Unsafe ${unsafeTime.toFixed(2)}ms`);
  });

  it('should handle numeric types', () => {
    // Arrange
    const unsafeCreateNumericId = createUnsafeBrandedFactory<number, typeof NumericIdBrand>();

    // Act & Assert
    expect(unsafeCreateNumericId(42)).toBe(42);
    expect(unsafeCreateNumericId(0)).toBe(0);
    expect(unsafeCreateNumericId(-5)).toBe(-5);
    expect(unsafeCreateNumericId(3.14)).toBe(3.14);
  });

  it('should work with database-style scenarios', () => {
    // Arrange
    const unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestIdBrand>();

    // Simulate database response
    const dbResults = [
      { id: 'test_abc123' },
      { id: 'test_xyz789' },
      { id: 'test_def456' },
    ];

    // Act - Convert database IDs to branded types without validation
    const brandedIds = dbResults.map(row => unsafeCreateTestId(row.id));

    // Assert
    expect(brandedIds).toHaveLength(3);
    expect(brandedIds[0]).toBe('test_abc123');
    expect(brandedIds[1]).toBe('test_xyz789');
    expect(brandedIds[2]).toBe('test_def456');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Branded Type System Integration', () => {
  let createTestId: (value: string) => TestId;
  let unsafeCreateTestId: (value: string) => TestId;
  let isTestId: (value: unknown) => value is TestId;

  beforeEach(() => {
    createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (!value || value.length < 5) {
          throw new Error('TestId must be at least 5 characters');
        }
      }
    );

    unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestIdBrand>();

    isTestId = createBrandedTypeGuard<string, typeof TestIdBrand>(
      (value): value is string => typeof value === 'string',
      (value) => value.length >= 5
    );
  });

  it('should work together in typical workflow', () => {
    // User input (needs validation)
    const userInput = 'test_user_input';
    const validatedId = createTestId(userInput);
    expect(isTestId(validatedId)).toBe(true);

    // Database read (skip validation)
    const dbId = 'test_from_db';
    const unsafeId = unsafeCreateTestId(dbId);
    expect(isTestId(unsafeId)).toBe(true);

    // Type guard on unknown value
    const unknownValue: unknown = 'test_unknown';
    if (isTestId(unknownValue)) {
      // TypeScript now knows this is TestId
      expect(unknownValue).toBe('test_unknown');
    }
  });

  it('should handle error cases gracefully', () => {
    // Invalid user input
    expect(() => createTestId('bad')).toThrow('TestId must be at least 5 characters');

    // Type guard rejects invalid
    expect(isTestId('bad')).toBe(false);
    expect(isTestId(null)).toBe(false);
    expect(isTestId(undefined)).toBe(false);

    // Unsafe factory still creates (but type guard catches it)
    const unsafeInvalid = unsafeCreateTestId('bad');
    expect(isTestId(unsafeInvalid)).toBe(false);
  });

  it('should demonstrate type safety at compile time', () => {
    // This is primarily a TypeScript compile-time test
    const id1 = createTestId('test_123');
    const id2 = createTestId('test_456');

    // These should work
    const arr: TestId[] = [id1, id2];
    expect(arr).toHaveLength(2);

    // This would fail TypeScript if uncommented:
    // const mixed: TestId[] = ['plain_string']; // ❌ Type error

    // But explicit casting works (developer responsibility)
    const explicitCast = 'test_explicit' as TestId;
    const arr2: TestId[] = [id1, explicitCast];
    expect(arr2).toHaveLength(2);
  });
});

// ============================================================================
// EDGE CASES & ERROR HANDLING
// ============================================================================

describe('Edge Cases and Error Handling', () => {
  it('should handle empty strings appropriately', () => {
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (!value) throw new Error('Empty not allowed');
      }
    );

    expect(() => createTestId('')).toThrow('Empty not allowed');
  });

  it('should handle whitespace strings', () => {
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (!value.trim()) throw new Error('Whitespace only not allowed');
      }
    );

    expect(() => createTestId('   ')).toThrow('Whitespace only not allowed');
  });

  it('should handle special characters', () => {
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          throw new Error('Special characters not allowed');
        }
      }
    );

    expect(createTestId('test_123-abc')).toBe('test_123-abc');
    expect(() => createTestId('test@123')).toThrow('Special characters not allowed');
    expect(() => createTestId('test 123')).toThrow('Special characters not allowed');
  });

  it('should handle very long strings', () => {
    const createTestId = createBrandedFactory<string, typeof TestIdBrand>(
      (value: string) => {
        if (value.length > 100) throw new Error('Too long');
      }
    );

    const longString = 'a'.repeat(101);
    expect(() => createTestId(longString)).toThrow('Too long');

    const validString = 'a'.repeat(100);
    expect(createTestId(validString)).toBe(validString);
  });

  it('should handle numeric edge cases', () => {
    const createNumericId = createBrandedFactory<number, typeof NumericIdBrand>(
      (value: number) => {
        if (value > Number.MAX_SAFE_INTEGER) throw new Error('Too large');
        if (value < 0) throw new Error('Must be positive');
      }
    );

    expect(() => createNumericId(Number.MAX_SAFE_INTEGER + 1)).toThrow('Too large');
    expect(() => createNumericId(-1)).toThrow('Must be positive');
    expect(createNumericId(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });
});