# TS-012 IMPLEMENTATION PLAN: Branded Types for IDs

**Story ID**: TS-012
**Plan Phase**: COMPLETE
**Date**: 2025-09-30
**Agent**: story_ts012_001
**Based on**: TS-012-RESEARCH.md

---

## PLAN SUMMARY

This plan implements a **consolidated, type-safe branded ID system** for PingLearn using 2025 TypeScript best practices. The implementation is **non-breaking** (adds types without enforcing migration) and provides a foundation for future type safety improvements.

---

## IMPLEMENTATION ARCHITECTURE

### **File Structure**
```
src/lib/types/
├── branded.ts              # Generic branded type utilities (NEW)
├── id-types.ts             # Domain-specific ID brands (NEW)
├── branded.test.ts         # Generic utility tests (NEW)
├── id-types.test.ts        # ID brand tests (NEW)
└── index.ts                # Update exports (MODIFY)

src/types/
├── advanced.ts             # Add deprecation re-exports (MODIFY)
└── common.ts               # Add deprecation re-exports (MODIFY)
```

### **Dependencies**
- Builds on: **TS-010** (type guards) - completed in Batch 1
- No external dependencies
- Zero runtime overhead (compile-time only)

---

## PHASE-BY-PHASE IMPLEMENTATION

### **STEP 1: Create Generic Branded Type Utilities**

**File**: `src/lib/types/branded.ts`

**Purpose**: Reusable branded type pattern that works for any domain

**Implementation**:

```typescript
/**
 * Generic Branded Type Utilities
 *
 * Provides reusable utilities for creating type-safe branded types following
 * 2025 TypeScript best practices using unique symbols.
 *
 * @module branded
 * @see {@link https://www.learningtypescript.com/articles/branded-types}
 */

/**
 * Creates a branded type from a base type.
 *
 * Uses unique symbol pattern to hide brand from IntelliSense while maintaining
 * compile-time type safety.
 *
 * @template T - The base type to brand (e.g., string, number)
 * @template Brand - The unique symbol used as the brand
 *
 * @example
 * ```typescript
 * declare const UserIdBrand: unique symbol;
 * type UserId = Brand<string, typeof UserIdBrand>;
 *
 * const id: UserId = 'user_123' as UserId;
 * ```
 */
export type Brand<T, Brand extends symbol> = T & { readonly [brand in Brand]: void };

/**
 * Helper type to extract the base type from a branded type.
 *
 * @template BrandedType - The branded type to unwrap
 *
 * @example
 * ```typescript
 * type UserId = Brand<string, typeof UserIdBrand>;
 * type BaseType = UnBrand<UserId>; // string
 * ```
 */
export type UnBrand<BrandedType> = BrandedType extends Brand<infer T, symbol> ? T : BrandedType;

/**
 * Type guard generator for branded types.
 *
 * Creates a type guard function that validates the base type and optionally
 * performs additional validation.
 *
 * @template T - The base type
 * @template Brand - The unique symbol brand
 * @param baseTypeGuard - Type guard for the base type
 * @param validator - Optional additional validation function
 * @returns Type guard for the branded type
 *
 * @example
 * ```typescript
 * const isUserId = createBrandedTypeGuard<string, typeof UserIdBrand>(
 *   (value): value is string => typeof value === 'string',
 *   (value) => value.length >= 3
 * );
 * ```
 */
export function createBrandedTypeGuard<T, Brand extends symbol>(
  baseTypeGuard: (value: unknown) => value is T,
  validator?: (value: T) => boolean
): (value: unknown) => value is Brand<T, Brand> {
  return (value: unknown): value is Brand<T, Brand> => {
    if (!baseTypeGuard(value)) return false;
    if (validator && !validator(value)) return false;
    return true;
  };
}

/**
 * Factory generator for branded types with validation.
 *
 * Creates a factory function that validates input and returns a branded type.
 * Throws an error if validation fails.
 *
 * @template T - The base type
 * @template Brand - The unique symbol brand
 * @param validator - Validation function that throws on invalid input
 * @returns Factory function that creates branded values
 *
 * @example
 * ```typescript
 * const createUserId = createBrandedFactory<string, typeof UserIdBrand>(
 *   (value) => {
 *     if (value.length < 3) throw new Error('ID too short');
 *   }
 * );
 * ```
 */
export function createBrandedFactory<T, Brand extends symbol>(
  validator: (value: T) => void
): (value: T) => Brand<T, Brand> {
  return (value: T): Brand<T, Brand> => {
    validator(value);
    return value as Brand<T, Brand>;
  };
}

/**
 * Unsafe factory generator for branded types without validation.
 *
 * Creates a factory function that skips validation for trusted sources
 * (e.g., database reads, internal APIs). Use with caution.
 *
 * @template T - The base type
 * @template Brand - The unique symbol brand
 * @returns Unsafe factory function (no validation)
 *
 * @example
 * ```typescript
 * const unsafeCreateUserId = createUnsafeBrandedFactory<string, typeof UserIdBrand>();
 * const id = unsafeCreateUserId(dbResult.id); // Assumes valid
 * ```
 */
export function createUnsafeBrandedFactory<T, Brand extends symbol>(): (
  value: T
) => Brand<T, Brand> {
  return (value: T): Brand<T, Brand> => value as Brand<T, Brand>;
}
```

**Git Checkpoint**:
```bash
git add src/lib/types/branded.ts
git commit -m "feat(types): Add generic branded type utilities (TS-012 Step 1)"
```

---

### **STEP 2: Create Domain-Specific ID Types**

**File**: `src/lib/types/id-types.ts`

**Purpose**: All PingLearn ID brands with validation and type guards

**Implementation**:

```typescript
/**
 * Domain-Specific ID Branded Types
 *
 * Type-safe ID types for PingLearn domain entities. Prevents accidental mixing
 * of different ID types at compile time.
 *
 * @module id-types
 * @see {@link ./branded} - Generic branded type utilities
 */

import { Brand, createBrandedFactory, createUnsafeBrandedFactory, createBrandedTypeGuard } from './branded';

// ============================================================================
// BRAND SYMBOLS (2025 Pattern - Hidden from IntelliSense)
// ============================================================================

declare const UserIdBrand: unique symbol;
declare const SessionIdBrand: unique symbol;
declare const VoiceSessionIdBrand: unique symbol;
declare const TextbookIdBrand: unique symbol;
declare const ChapterIdBrand: unique symbol;
declare const LessonIdBrand: unique symbol;
declare const TopicIdBrand: unique symbol;
declare const QuestionIdBrand: unique symbol;

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/**
 * Branded type for user identifiers.
 *
 * @remarks
 * Use {@link createUserId} to create instances with validation.
 * Use {@link unsafeCreateUserId} for trusted sources (e.g., database).
 * Use {@link isUserId} for runtime type checking.
 *
 * @example
 * ```typescript
 * // With validation
 * const userId = createUserId('user_abc123');
 *
 * // From database (skip validation)
 * const userId = unsafeCreateUserId(dbRow.user_id);
 *
 * // Runtime check
 * if (isUserId(unknownValue)) {
 *   console.log('Valid user ID:', unknownValue);
 * }
 * ```
 */
export type UserId = Brand<string, typeof UserIdBrand>;

/**
 * Branded type for learning session identifiers.
 */
export type SessionId = Brand<string, typeof SessionIdBrand>;

/**
 * Branded type for voice session identifiers.
 *
 * @remarks
 * Voice sessions are LiveKit-based real-time voice interactions.
 * IDs typically follow the format: `vs_[alphanumeric]`
 */
export type VoiceSessionId = Brand<string, typeof VoiceSessionIdBrand>;

/**
 * Branded type for textbook identifiers.
 */
export type TextbookId = Brand<string, typeof TextbookIdBrand>;

/**
 * Branded type for chapter identifiers.
 */
export type ChapterId = Brand<string, typeof ChapterIdBrand>;

/**
 * Branded type for lesson identifiers.
 */
export type LessonId = Brand<string, typeof LessonIdBrand>;

/**
 * Branded type for topic identifiers.
 */
export type TopicId = Brand<string, typeof TopicIdBrand>;

/**
 * Branded type for question identifiers.
 */
export type QuestionId = Brand<string, typeof QuestionIdBrand>;

// ============================================================================
// FACTORY FUNCTIONS (Validated)
// ============================================================================

/**
 * Creates a validated UserId.
 *
 * @param id - Raw user ID string
 * @returns Branded UserId
 * @throws {Error} If ID is invalid (less than 3 characters)
 */
export const createUserId = createBrandedFactory<string, typeof UserIdBrand>(
  (id: string) => {
    if (!id || id.length < 3) {
      throw new Error('Invalid user ID: must be at least 3 characters');
    }
  }
);

/**
 * Creates a validated SessionId.
 *
 * @param id - Raw session ID string
 * @returns Branded SessionId
 * @throws {Error} If ID contains invalid characters
 */
export const createSessionId = createBrandedFactory<string, typeof SessionIdBrand>(
  (id: string) => {
    if (!id || !/^[a-zA-Z0-9\-_]+$/.test(id)) {
      throw new Error(
        'Invalid session ID: must contain only alphanumeric characters, hyphens, and underscores'
      );
    }
  }
);

/**
 * Creates a validated VoiceSessionId.
 *
 * @param id - Raw voice session ID string
 * @returns Branded VoiceSessionId
 * @throws {Error} If ID does not match expected format (vs_...)
 */
export const createVoiceSessionId = createBrandedFactory<string, typeof VoiceSessionIdBrand>(
  (id: string) => {
    if (!id || !/^vs_[a-zA-Z0-9\-_]+$/.test(id)) {
      throw new Error(
        'Invalid voice session ID: must start with "vs_" and contain only alphanumeric characters, hyphens, and underscores'
      );
    }
  }
);

/**
 * Creates a validated TextbookId.
 *
 * @param id - Raw textbook ID string
 * @returns Branded TextbookId
 * @throws {Error} If ID does not start with "textbook_"
 */
export const createTextbookId = createBrandedFactory<string, typeof TextbookIdBrand>(
  (id: string) => {
    if (!id || !id.startsWith('textbook_')) {
      throw new Error('Invalid textbook ID: must start with "textbook_"');
    }
  }
);

/**
 * Creates a validated ChapterId.
 *
 * @param id - Raw chapter ID string
 * @returns Branded ChapterId
 * @throws {Error} If ID does not contain "_ch_"
 */
export const createChapterId = createBrandedFactory<string, typeof ChapterIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_ch_')) {
      throw new Error('Invalid chapter ID: must contain "_ch_"');
    }
  }
);

/**
 * Creates a validated LessonId.
 *
 * @param id - Raw lesson ID string
 * @returns Branded LessonId
 * @throws {Error} If ID does not contain "_lesson_"
 */
export const createLessonId = createBrandedFactory<string, typeof LessonIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_lesson_')) {
      throw new Error('Invalid lesson ID: must contain "_lesson_"');
    }
  }
);

/**
 * Creates a validated TopicId.
 *
 * @param id - Raw topic ID string
 * @returns Branded TopicId
 * @throws {Error} If ID does not contain "_topic_"
 */
export const createTopicId = createBrandedFactory<string, typeof TopicIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_topic_')) {
      throw new Error('Invalid topic ID: must contain "_topic_"');
    }
  }
);

/**
 * Creates a validated QuestionId.
 *
 * @param id - Raw question ID string
 * @returns Branded QuestionId
 * @throws {Error} If ID does not contain "_q_"
 */
export const createQuestionId = createBrandedFactory<string, typeof QuestionIdBrand>(
  (id: string) => {
    if (!id || !id.includes('_q_')) {
      throw new Error('Invalid question ID: must contain "_q_"');
    }
  }
);

// ============================================================================
// UNSAFE FACTORY FUNCTIONS (No Validation)
// ============================================================================

/**
 * Creates an UserId without validation.
 *
 * @remarks
 * Use only for trusted sources (database reads, internal APIs).
 * Skips validation for performance.
 *
 * @param id - Raw user ID string (assumed valid)
 * @returns Branded UserId
 */
export const unsafeCreateUserId = createUnsafeBrandedFactory<string, typeof UserIdBrand>();

export const unsafeCreateSessionId = createUnsafeBrandedFactory<string, typeof SessionIdBrand>();
export const unsafeCreateVoiceSessionId = createUnsafeBrandedFactory<string, typeof VoiceSessionIdBrand>();
export const unsafeCreateTextbookId = createUnsafeBrandedFactory<string, typeof TextbookIdBrand>();
export const unsafeCreateChapterId = createUnsafeBrandedFactory<string, typeof ChapterIdBrand>();
export const unsafeCreateLessonId = createUnsafeBrandedFactory<string, typeof LessonIdBrand>();
export const unsafeCreateTopicId = createUnsafeBrandedFactory<string, typeof TopicIdBrand>();
export const unsafeCreateQuestionId = createUnsafeBrandedFactory<string, typeof QuestionIdBrand>();

// ============================================================================
// TYPE GUARDS (Runtime Checks)
// ============================================================================

/**
 * Type guard to check if value is a valid UserId at runtime.
 *
 * @param value - Value to check
 * @returns True if value is a valid UserId
 */
export const isUserId = createBrandedTypeGuard<string, typeof UserIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.length >= 3
);

export const isSessionId = createBrandedTypeGuard<string, typeof SessionIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => /^[a-zA-Z0-9\-_]+$/.test(value)
);

export const isVoiceSessionId = createBrandedTypeGuard<string, typeof VoiceSessionIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => /^vs_[a-zA-Z0-9\-_]+$/.test(value)
);

export const isTextbookId = createBrandedTypeGuard<string, typeof TextbookIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.startsWith('textbook_')
);

export const isChapterId = createBrandedTypeGuard<string, typeof ChapterIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_ch_')
);

export const isLessonId = createBrandedTypeGuard<string, typeof LessonIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_lesson_')
);

export const isTopicId = createBrandedTypeGuard<string, typeof TopicIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_topic_')
);

export const isQuestionId = createBrandedTypeGuard<string, typeof QuestionIdBrand>(
  (value): value is string => typeof value === 'string',
  (value) => value.includes('_q_')
);
```

**Git Checkpoint**:
```bash
git add src/lib/types/id-types.ts
git commit -m "feat(types): Add domain-specific branded ID types (TS-012 Step 2)

Includes:
- 8 branded ID types (UserId, SessionId, VoiceSessionId, TextbookId, ChapterId, LessonId, TopicId, QuestionId)
- Validated factory functions
- Unsafe factory functions for trusted sources
- Runtime type guards for all IDs"
```

---

### **STEP 3: Create Generic Branded Type Tests**

**File**: `src/lib/types/branded.test.ts`

**Test Cases**:

```typescript
/**
 * Tests for generic branded type utilities
 */

import {
  Brand,
  UnBrand,
  createBrandedTypeGuard,
  createBrandedFactory,
  createUnsafeBrandedFactory
} from './branded';

describe('Generic Branded Type Utilities', () => {
  // Define test brand
  declare const TestBrand: unique symbol;
  type TestId = Brand<string, typeof TestBrand>;

  describe('Brand Type', () => {
    it('should prevent mixing different branded types at compile time', () => {
      // This test validates TypeScript compile-time behavior
      // Cannot write runtime test for compile-time type checking

      declare const TestBrand2: unique symbol;
      type TestId2 = Brand<string, typeof TestBrand2>;

      const id1: TestId = 'test' as TestId;
      const id2: TestId2 = 'test' as TestId2;

      // @ts-expect-error - Cannot assign TestId2 to TestId
      const invalid: TestId = id2;

      // TypeScript should catch this at compile time
      expect(id1).toBeDefined();
    });

    it('should allow assignment of same branded type', () => {
      const id1: TestId = 'test' as TestId;
      const id2: TestId = id1; // Should compile

      expect(id2).toBe('test');
    });
  });

  describe('UnBrand', () => {
    it('should extract base type from branded type', () => {
      type ExtractedType = UnBrand<TestId>;

      // Type-level test: ExtractedType should be string
      const value: ExtractedType = 'test';
      expect(typeof value).toBe('string');
    });
  });

  describe('createBrandedTypeGuard', () => {
    it('should create type guard with base validation only', () => {
      const isTestId = createBrandedTypeGuard<string, typeof TestBrand>(
        (value): value is string => typeof value === 'string'
      );

      expect(isTestId('valid')).toBe(true);
      expect(isTestId(123)).toBe(false);
      expect(isTestId(null)).toBe(false);
      expect(isTestId(undefined)).toBe(false);
    });

    it('should create type guard with additional validation', () => {
      const isTestId = createBrandedTypeGuard<string, typeof TestBrand>(
        (value): value is string => typeof value === 'string',
        (value) => value.length >= 3
      );

      expect(isTestId('abc')).toBe(true);
      expect(isTestId('ab')).toBe(false);
      expect(isTestId('')).toBe(false);
    });

    it('should execute in <1ms per call', () => {
      const iterations = 10000;
      const isTestId = createBrandedTypeGuard<string, typeof TestBrand>(
        (value): value is string => typeof value === 'string',
        (value) => value.length >= 3
      );

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isTestId('test-value');
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('createBrandedFactory', () => {
    it('should create factory that validates input', () => {
      const createTestId = createBrandedFactory<string, typeof TestBrand>(
        (value) => {
          if (value.length < 3) {
            throw new Error('Too short');
          }
        }
      );

      expect(() => createTestId('abc')).not.toThrow();
      expect(() => createTestId('ab')).toThrow('Too short');
    });

    it('should return branded type', () => {
      const createTestId = createBrandedFactory<string, typeof TestBrand>(
        (value) => {
          if (!value) throw new Error('Empty');
        }
      );

      const id: TestId = createTestId('test');
      expect(id).toBe('test');
    });

    it('should execute in <1ms per call', () => {
      const iterations = 10000;
      const createTestId = createBrandedFactory<string, typeof TestBrand>(
        (value) => {
          if (value.length < 3) throw new Error('Too short');
        }
      );

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        createTestId('test');
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('createUnsafeBrandedFactory', () => {
    it('should create factory without validation', () => {
      const unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestBrand>();

      // Should not throw even with invalid input
      expect(() => unsafeCreateTestId('')).not.toThrow();
      expect(() => unsafeCreateTestId('x')).not.toThrow();
    });

    it('should return branded type', () => {
      const unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestBrand>();

      const id: TestId = unsafeCreateTestId('test');
      expect(id).toBe('test');
    });

    it('should execute in <0.1ms per call (faster than validated)', () => {
      const iterations = 10000;
      const unsafeCreateTestId = createUnsafeBrandedFactory<string, typeof TestBrand>();

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        unsafeCreateTestId('test');
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(0.1);
    });
  });
});
```

**Git Checkpoint**:
```bash
git add src/lib/types/branded.test.ts
git commit -m "test(types): Add branded type utility tests (TS-012 Step 3)"
```

---

### **STEP 4: Create ID Type Tests**

**File**: `src/lib/types/id-types.test.ts`

**Test Cases**: (Comprehensive tests for all 8 ID types)

```typescript
/**
 * Tests for domain-specific ID branded types
 */

import {
  // Types
  UserId,
  SessionId,
  VoiceSessionId,
  TextbookId,
  ChapterId,
  LessonId,
  TopicId,
  QuestionId,
  // Factories
  createUserId,
  createSessionId,
  createVoiceSessionId,
  createTextbookId,
  createChapterId,
  createLessonId,
  createTopicId,
  createQuestionId,
  // Unsafe factories
  unsafeCreateUserId,
  unsafeCreateSessionId,
  unsafeCreateVoiceSessionId,
  unsafeCreateTextbookId,
  unsafeCreateChapterId,
  unsafeCreateLessonId,
  unsafeCreateTopicId,
  unsafeCreateQuestionId,
  // Type guards
  isUserId,
  isSessionId,
  isVoiceSessionId,
  isTextbookId,
  isChapterId,
  isLessonId,
  isTopicId,
  isQuestionId
} from './id-types';

describe('Domain-Specific ID Branded Types', () => {
  describe('Type Safety (Compile-Time)', () => {
    it('should prevent mixing different ID types', () => {
      const userId: UserId = 'user_123' as UserId;
      const sessionId: SessionId = 'sess_456' as SessionId;

      // @ts-expect-error - Cannot assign SessionId to UserId
      const invalid: UserId = sessionId;

      expect(userId).toBeDefined();
    });

    it('should allow assignment of same ID type', () => {
      const id1: UserId = 'user_123' as UserId;
      const id2: UserId = id1;

      expect(id2).toBe('user_123');
    });
  });

  describe('UserId', () => {
    describe('createUserId', () => {
      it('should create valid UserId', () => {
        expect(() => createUserId('user_123')).not.toThrow();
        expect(() => createUserId('abc')).not.toThrow();
      });

      it('should reject IDs shorter than 3 characters', () => {
        expect(() => createUserId('ab')).toThrow('Invalid user ID');
        expect(() => createUserId('a')).toThrow('Invalid user ID');
        expect(() => createUserId('')).toThrow('Invalid user ID');
      });

      it('should return branded UserId', () => {
        const id: UserId = createUserId('user_123');
        expect(id).toBe('user_123');
      });
    });

    describe('unsafeCreateUserId', () => {
      it('should create UserId without validation', () => {
        expect(() => unsafeCreateUserId('')).not.toThrow();
        expect(() => unsafeCreateUserId('x')).not.toThrow();
      });
    });

    describe('isUserId', () => {
      it('should validate UserId format', () => {
        expect(isUserId('abc')).toBe(true);
        expect(isUserId('user_123')).toBe(true);
        expect(isUserId('ab')).toBe(false);
        expect(isUserId(123)).toBe(false);
        expect(isUserId(null)).toBe(false);
      });
    });
  });

  describe('SessionId', () => {
    describe('createSessionId', () => {
      it('should create valid SessionId', () => {
        expect(() => createSessionId('sess_123')).not.toThrow();
        expect(() => createSessionId('session-abc-def')).not.toThrow();
        expect(() => createSessionId('session_abc_123')).not.toThrow();
      });

      it('should reject IDs with invalid characters', () => {
        expect(() => createSessionId('sess 123')).toThrow('Invalid session ID');
        expect(() => createSessionId('sess@123')).toThrow('Invalid session ID');
        expect(() => createSessionId('')).toThrow('Invalid session ID');
      });
    });

    describe('isSessionId', () => {
      it('should validate SessionId format', () => {
        expect(isSessionId('sess_123')).toBe(true);
        expect(isSessionId('session-abc')).toBe(true);
        expect(isSessionId('sess 123')).toBe(false);
        expect(isSessionId('sess@123')).toBe(false);
      });
    });
  });

  describe('VoiceSessionId', () => {
    describe('createVoiceSessionId', () => {
      it('should create valid VoiceSessionId', () => {
        expect(() => createVoiceSessionId('vs_123')).not.toThrow();
        expect(() => createVoiceSessionId('vs_abc-def_123')).not.toThrow();
      });

      it('should reject IDs not starting with vs_', () => {
        expect(() => createVoiceSessionId('session_123')).toThrow('Invalid voice session ID');
        expect(() => createVoiceSessionId('123')).toThrow('Invalid voice session ID');
        expect(() => createVoiceSessionId('')).toThrow('Invalid voice session ID');
      });

      it('should reject IDs with invalid characters', () => {
        expect(() => createVoiceSessionId('vs_abc 123')).toThrow('Invalid voice session ID');
        expect(() => createVoiceSessionId('vs_abc@123')).toThrow('Invalid voice session ID');
      });
    });

    describe('isVoiceSessionId', () => {
      it('should validate VoiceSessionId format', () => {
        expect(isVoiceSessionId('vs_123')).toBe(true);
        expect(isVoiceSessionId('vs_abc-def')).toBe(true);
        expect(isVoiceSessionId('session_123')).toBe(false);
        expect(isVoiceSessionId('vs_abc 123')).toBe(false);
      });
    });
  });

  describe('TextbookId', () => {
    describe('createTextbookId', () => {
      it('should create valid TextbookId', () => {
        expect(() => createTextbookId('textbook_123')).not.toThrow();
        expect(() => createTextbookId('textbook_math_grade10')).not.toThrow();
      });

      it('should reject IDs not starting with textbook_', () => {
        expect(() => createTextbookId('book_123')).toThrow('Invalid textbook ID');
        expect(() => createTextbookId('123')).toThrow('Invalid textbook ID');
        expect(() => createTextbookId('')).toThrow('Invalid textbook ID');
      });
    });

    describe('isTextbookId', () => {
      it('should validate TextbookId format', () => {
        expect(isTextbookId('textbook_123')).toBe(true);
        expect(isTextbookId('textbook_math')).toBe(true);
        expect(isTextbookId('book_123')).toBe(false);
      });
    });
  });

  describe('ChapterId', () => {
    describe('createChapterId', () => {
      it('should create valid ChapterId', () => {
        expect(() => createChapterId('textbook_123_ch_1')).not.toThrow();
        expect(() => createChapterId('book_ch_algebra')).not.toThrow();
      });

      it('should reject IDs not containing _ch_', () => {
        expect(() => createChapterId('chapter_123')).toThrow('Invalid chapter ID');
        expect(() => createChapterId('123')).toThrow('Invalid chapter ID');
      });
    });

    describe('isChapterId', () => {
      it('should validate ChapterId format', () => {
        expect(isChapterId('textbook_123_ch_1')).toBe(true);
        expect(isChapterId('book_ch_algebra')).toBe(true);
        expect(isChapterId('chapter_123')).toBe(false);
      });
    });
  });

  describe('LessonId', () => {
    describe('createLessonId', () => {
      it('should create valid LessonId', () => {
        expect(() => createLessonId('ch_1_lesson_1')).not.toThrow();
        expect(() => createLessonId('algebra_lesson_intro')).not.toThrow();
      });

      it('should reject IDs not containing _lesson_', () => {
        expect(() => createLessonId('lesson1')).toThrow('Invalid lesson ID');
        expect(() => createLessonId('123')).toThrow('Invalid lesson ID');
      });
    });

    describe('isLessonId', () => {
      it('should validate LessonId format', () => {
        expect(isLessonId('ch_1_lesson_1')).toBe(true);
        expect(isLessonId('algebra_lesson_intro')).toBe(true);
        expect(isLessonId('lesson1')).toBe(false);
      });
    });
  });

  describe('TopicId', () => {
    describe('createTopicId', () => {
      it('should create valid TopicId', () => {
        expect(() => createTopicId('lesson_1_topic_1')).not.toThrow();
        expect(() => createTopicId('algebra_topic_equations')).not.toThrow();
      });

      it('should reject IDs not containing _topic_', () => {
        expect(() => createTopicId('topic1')).toThrow('Invalid topic ID');
        expect(() => createTopicId('123')).toThrow('Invalid topic ID');
      });
    });

    describe('isTopicId', () => {
      it('should validate TopicId format', () => {
        expect(isTopicId('lesson_1_topic_1')).toBe(true);
        expect(isTopicId('algebra_topic_equations')).toBe(true);
        expect(isTopicId('topic1')).toBe(false);
      });
    });
  });

  describe('QuestionId', () => {
    describe('createQuestionId', () => {
      it('should create valid QuestionId', () => {
        expect(() => createQuestionId('topic_1_q_1')).not.toThrow();
        expect(() => createQuestionId('algebra_q_solve_x')).not.toThrow();
      });

      it('should reject IDs not containing _q_', () => {
        expect(() => createQuestionId('question1')).toThrow('Invalid question ID');
        expect(() => createQuestionId('123')).toThrow('Invalid question ID');
      });
    });

    describe('isQuestionId', () => {
      it('should validate QuestionId format', () => {
        expect(isQuestionId('topic_1_q_1')).toBe(true);
        expect(isQuestionId('algebra_q_solve_x')).toBe(true);
        expect(isQuestionId('question1')).toBe(false);
      });
    });
  });

  describe('Performance', () => {
    it('should create IDs in <1ms per call', () => {
      const iterations = 10000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        createUserId('user_' + i);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should validate IDs in <1ms per call', () => {
      const iterations = 10000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        isUserId('user_123');
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should create unsafe IDs in <0.1ms per call', () => {
      const iterations = 10000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        unsafeCreateUserId('user_' + i);
      }
      const duration = performance.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(0.1);
    });
  });

  describe('Type Narrowing', () => {
    it('should narrow types in conditional blocks', () => {
      const unknownValue: unknown = 'vs_123';

      if (isVoiceSessionId(unknownValue)) {
        // TypeScript should know unknownValue is VoiceSessionId here
        const id: VoiceSessionId = unknownValue;
        expect(id).toBe('vs_123');
      }
    });
  });
});
```

**Git Checkpoint**:
```bash
git add src/lib/types/id-types.test.ts
git commit -m "test(types): Add comprehensive ID type tests (TS-012 Step 4)

Tests cover:
- All 8 ID types (UserId, SessionId, VoiceSessionId, TextbookId, ChapterId, LessonId, TopicId, QuestionId)
- Factory function validation
- Unsafe factories
- Type guards
- Performance benchmarks
- Type narrowing"
```

---

### **STEP 5: Update Type Exports**

**File**: `src/lib/types/index.ts` (MODIFY)

**Changes**:

```typescript
// Add to existing exports:

// Branded type utilities
export * from './branded';
export * from './id-types';

// Re-export commonly used types for convenience
export type {
  UserId,
  SessionId,
  VoiceSessionId,
  TextbookId,
  ChapterId,
  LessonId,
  TopicId,
  QuestionId
} from './id-types';

// Re-export factory functions
export {
  createUserId,
  createSessionId,
  createVoiceSessionId,
  createTextbookId,
  createChapterId,
  createLessonId,
  createTopicId,
  createQuestionId,
  // Unsafe variants
  unsafeCreateUserId,
  unsafeCreateSessionId,
  unsafeCreateVoiceSessionId,
  unsafeCreateTextbookId,
  unsafeCreateChapterId,
  unsafeCreateLessonId,
  unsafeCreateTopicId,
  unsafeCreateQuestionId,
  // Type guards
  isUserId,
  isSessionId,
  isVoiceSessionId,
  isTextbookId,
  isChapterId,
  isLessonId,
  isTopicId,
  isQuestionId
} from './id-types';
```

**Git Checkpoint**:
```bash
git add src/lib/types/index.ts
git commit -m "feat(types): Export branded ID types from main index (TS-012 Step 5)"
```

---

### **STEP 6: Add Backwards-Compatible Re-exports**

**File**: `src/types/advanced.ts` (MODIFY - Add deprecation warnings)

**Changes**:

```typescript
// At the end of file, add:

/**
 * @deprecated Use {@link @/lib/types/id-types#UserId} instead.
 * This re-export exists for backwards compatibility and will be removed in v2.0.
 */
export type { UserId } from '@/lib/types/id-types';

/**
 * @deprecated Use {@link @/lib/types/id-types#SessionId} instead.
 * This re-export exists for backwards compatibility and will be removed in v2.0.
 */
export type { SessionId } from '@/lib/types/id-types';

/**
 * @deprecated Use {@link @/lib/types/id-types#TextbookId} instead.
 * This re-export exists for backwards compatibility and will be removed in v2.0.
 */
export type { TextbookId } from '@/lib/types/id-types';

/**
 * @deprecated Use {@link @/lib/types/id-types#ChapterId} instead.
 * This re-export exists for backwards compatibility and will be removed in v2.0.
 */
export type { ChapterId } from '@/lib/types/id-types';

// ... (same for LessonId, TopicId, QuestionId)

/**
 * @deprecated Use {@link @/lib/types/id-types#createUserId} instead.
 */
export { createUserId } from '@/lib/types/id-types';

// ... (re-export all factory functions with deprecation)
```

**File**: `src/types/common.ts` (MODIFY - Add deprecation warnings)

Similar deprecation re-exports.

**Git Checkpoint**:
```bash
git add src/types/advanced.ts src/types/common.ts
git commit -m "feat(types): Add backwards-compatible re-exports with deprecation (TS-012 Step 6)"
```

---

## VERIFICATION PLAN

### **Pre-Implementation Verification**
```bash
# Baseline check
npm run typecheck  # Should show 0 errors
```

### **Post-Implementation Verification**
```bash
# 1. TypeScript compilation
npm run typecheck
# Expected: 0 errors (no breaking changes)

# 2. Linting
npm run lint
# Expected: Pass

# 3. Run branded type tests
npm test -- branded.test.ts
# Expected: All tests pass

# 4. Run ID type tests
npm test -- id-types.test.ts
# Expected: All tests pass

# 5. Performance check
npm test -- id-types.test.ts -t Performance
# Expected: All operations <1ms

# 6. Type guard tests
npm test -- id-types.test.ts -t "Type Narrowing"
# Expected: Type narrowing works correctly
```

---

## ROLLBACK PLAN

**If any verification fails**:

```bash
# Find the checkpoint before the failing step
git log --oneline -10

# Rollback to the last good commit
git reset --hard <checkpoint-hash>
```

**Checkpoints** (in order):
1. Before Step 1: Initial checkpoint
2. After Step 1: branded.ts created
3. After Step 2: id-types.ts created
4. After Step 3: branded.test.ts created
5. After Step 4: id-types.test.ts created
6. After Step 5: index.ts updated
7. After Step 6: Backwards compatibility added

---

## MIGRATION GUIDE (For Future Stories)

**Non-Breaking Migration Pattern** (for future use):

```typescript
// Old code (plain strings)
function getUser(userId: string): User { ... }
const id: string = 'user_123';
getUser(id); // Works

// New code (branded types)
import { UserId, createUserId } from '@/lib/types/id-types';

function getUser(userId: UserId): User { ... }
const id: UserId = createUserId('user_123');
getUser(id); // Type-safe!

// Database reads (use unsafe factory)
const dbUser = await db.users.findOne(...);
const userId: UserId = unsafeCreateUserId(dbUser.id);
```

---

## RISK MITIGATION

### **Risk: Type Duplication**
**Status**: Mitigated
**How**: Backwards-compatible re-exports with deprecation warnings

### **Risk: Performance Overhead**
**Status**: Mitigated
**How**: Performance tests ensure <1ms, unsafe factories for hot paths

### **Risk: Developer Confusion**
**Status**: Mitigated
**How**: Comprehensive JSDoc, examples, migration guide

### **Risk: Breaking Changes**
**Status**: Mitigated
**How**: Non-breaking implementation (types added but not enforced)

---

## SUCCESS CRITERIA

### **Must Pass**:
- [x] Plan created with detailed implementation steps
- [ ] All files created (branded.ts, id-types.ts, branded.test.ts, id-types.test.ts)
- [ ] All tests pass (100%)
- [ ] TypeScript: 0 errors
- [ ] Lint: passes
- [ ] Performance: <1ms per ID creation
- [ ] Backwards compatibility: re-exports work
- [ ] Documentation: JSDoc complete

### **Quality Gates**:
1. TypeScript compilation: `npm run typecheck` → 0 errors
2. All tests passing: `npm test -- branded` → 100%
3. Performance benchmarks: All operations <1ms
4. Coverage: >80% for new files

---

## ESTIMATED TIME

**Total**: 4 hours (as per story)

**Breakdown**:
- Step 1 (branded.ts): 30 minutes
- Step 2 (id-types.ts): 1 hour
- Step 3 (branded.test.ts): 45 minutes
- Step 4 (id-types.test.ts): 1 hour
- Step 5 (exports): 15 minutes
- Step 6 (backwards compatibility): 30 minutes

---

[PLAN-APPROVED-TS-012]

**Next Phase**: IMPLEMENT (execute steps 1-6)
**Agent**: story_ts012_001
**Ready to Begin**: YES