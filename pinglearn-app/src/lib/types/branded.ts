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
 * @template BrandSymbol - The unique symbol used as the brand
 *
 * @example
 * ```typescript
 * declare const UserIdBrand: unique symbol;
 * type UserId = Brand<string, typeof UserIdBrand>;
 *
 * const id: UserId = 'user_123' as UserId;
 * ```
 */
export type Brand<T, BrandSymbol extends symbol> = T & { readonly [brand in BrandSymbol]: void };

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
 * @template BrandSymbol - The unique symbol brand
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
export function createBrandedTypeGuard<T, BrandSymbol extends symbol>(
  baseTypeGuard: (value: unknown) => value is T,
  validator?: (value: T) => boolean
): (value: unknown) => value is Brand<T, BrandSymbol> {
  return (value: unknown): value is Brand<T, BrandSymbol> => {
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
 * @template BrandSymbol - The unique symbol brand
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
export function createBrandedFactory<T, BrandSymbol extends symbol>(
  validator: (value: T) => void
): (value: T) => Brand<T, BrandSymbol> {
  return (value: T): Brand<T, BrandSymbol> => {
    validator(value);
    return value as Brand<T, BrandSymbol>;
  };
}

/**
 * Unsafe factory generator for branded types without validation.
 *
 * Creates a factory function that skips validation for trusted sources
 * (e.g., database reads, internal APIs). Use with caution.
 *
 * @template T - The base type
 * @template BrandSymbol - The unique symbol brand
 * @returns Unsafe factory function (no validation)
 *
 * @example
 * ```typescript
 * const unsafeCreateUserId = createUnsafeBrandedFactory<string, typeof UserIdBrand>();
 * const id = unsafeCreateUserId(dbResult.id); // Assumes valid
 * ```
 */
export function createUnsafeBrandedFactory<T, BrandSymbol extends symbol>(): (
  value: T
) => Brand<T, BrandSymbol> {
  return (value: T): Brand<T, BrandSymbol> => value as Brand<T, BrandSymbol>;
}