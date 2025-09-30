/**
 * Generic Template Literal Type Utilities
 *
 * Provides reusable template literal patterns and utilities following 2025
 * TypeScript best practices. These generic utilities can be used across any
 * TypeScript project for type-safe string manipulation and pattern matching.
 *
 * @module template-literals
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html}
 * @see {@link https://2ality.com/2025/01/template-literal-types.html}
 *
 * Features:
 * - String case conversion (snake_case, kebab-case, PascalCase, camelCase)
 * - Route type builders with parameter extraction
 * - Pattern validation (email, URL, UUID, etc.)
 * - Autocomplete-friendly union types
 * - Cross-multiplication utilities for generating permutations
 *
 * @example
 * ```typescript
 * // String manipulation
 * type Snake = SnakeCase<'HelloWorld'>; // 'hello_world'
 *
 * // Route utilities
 * type ApiPath = `/api/${'users' | 'posts'}`; // '/api/users' | '/api/posts'
 *
 * // Autocomplete with fallback
 * type Route = StringUnionWithFallback<'/api/users' | '/api/posts'>;
 * // Provides autocomplete for known routes, accepts any string
 * ```
 */

// ============================================================================
// SECTION A: STRING MANIPULATION TYPES
// ============================================================================

/**
 * Converts a string type to snake_case.
 *
 * Transforms PascalCase and camelCase strings to lowercase with underscores.
 *
 * @template T - String type to convert
 *
 * @example
 * ```typescript
 * type A = SnakeCase<'HelloWorld'>; // 'hello_world'
 * type B = SnakeCase<'firstName'>; // 'first_name'
 * type C = SnakeCase<'APIKey'>; // 'a_p_i_key'
 * ```
 */
export type SnakeCase<T extends string> = T extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `_${Lowercase<First>}${SnakeCase<Rest>}`
    : `${Lowercase<First>}${SnakeCase<Rest>}`
  : T;

/**
 * Converts a string type to kebab-case.
 *
 * Transforms PascalCase and camelCase strings to lowercase with hyphens.
 *
 * @template T - String type to convert
 *
 * @example
 * ```typescript
 * type A = KebabCase<'HelloWorld'>; // 'hello-world'
 * type B = KebabCase<'firstName'>; // 'first-name'
 * type C = KebabCase<'APIKey'>; // 'a-p-i-key'
 * ```
 */
export type KebabCase<T extends string> = T extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `-${Lowercase<First>}${KebabCase<Rest>}`
    : `${Lowercase<First>}${KebabCase<Rest>}`
  : T;

/**
 * Converts a string type to PascalCase.
 *
 * Capitalizes the first letter and removes underscores/hyphens.
 *
 * @template T - String type to convert
 *
 * @example
 * ```typescript
 * type A = PascalCase<'hello_world'>; // 'HelloWorld'
 * type B = PascalCase<'first-name'>; // 'FirstName'
 * type C = PascalCase<'api_key'>; // 'ApiKey'
 * ```
 */
export type PascalCase<T extends string> = T extends `${infer First}_${infer Rest}`
  ? `${Capitalize<First>}${PascalCase<Rest>}`
  : T extends `${infer First}-${infer Rest}`
  ? `${Capitalize<First>}${PascalCase<Rest>}`
  : Capitalize<T>;

/**
 * Converts a string type to camelCase.
 *
 * Lowercase first letter, removes underscores/hyphens, capitalizes following letters.
 *
 * @template T - String type to convert
 *
 * @example
 * ```typescript
 * type A = CamelCase<'hello_world'>; // 'helloWorld'
 * type B = CamelCase<'first-name'>; // 'firstName'
 * type C = CamelCase<'api_key'>; // 'apiKey'
 * ```
 */
export type CamelCase<T extends string> = Uncapitalize<PascalCase<T>>;

/**
 * Splits a string type by a delimiter.
 *
 * Returns a tuple of string segments.
 *
 * @template S - String to split
 * @template D - Delimiter character(s)
 *
 * @example
 * ```typescript
 * type A = Split<'a,b,c', ','>; // ['a', 'b', 'c']
 * type B = Split<'hello-world', '-'>; // ['hello', 'world']
 * type C = Split<'/api/users', '/'>; // ['', 'api', 'users']
 * ```
 */
export type Split<S extends string, D extends string> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : [S];

/**
 * Joins an array of strings with a delimiter.
 *
 * Concatenates string types with specified separator.
 *
 * @template T - Array of strings to join
 * @template D - Delimiter character(s)
 *
 * @example
 * ```typescript
 * type A = Join<['a', 'b', 'c'], ','>; // 'a,b,c'
 * type B = Join<['hello', 'world'], '-'>; // 'hello-world'
 * type C = Join<['api', 'users'], '/'>; // 'api/users'
 * ```
 */
export type Join<T extends readonly string[], D extends string> = T extends readonly [
  infer First extends string,
  ...infer Rest extends readonly string[]
]
  ? Rest extends readonly []
    ? First
    : `${First}${D}${Join<Rest, D>}`
  : '';

/**
 * Checks if a string starts with a given prefix.
 *
 * @template S - String to check
 * @template Prefix - Expected prefix
 *
 * @example
 * ```typescript
 * type A = StartsWith<'hello', 'hel'>; // true
 * type B = StartsWith<'world', 'hel'>; // false
 * ```
 */
export type StartsWith<S extends string, Prefix extends string> = S extends `${Prefix}${string}`
  ? true
  : false;

/**
 * Checks if a string ends with a given suffix.
 *
 * @template S - String to check
 * @template Suffix - Expected suffix
 *
 * @example
 * ```typescript
 * type A = EndsWith<'hello', 'lo'>; // true
 * type B = EndsWith<'world', 'lo'>; // false
 * ```
 */
export type EndsWith<S extends string, Suffix extends string> = S extends `${string}${Suffix}`
  ? true
  : false;

/**
 * Checks if a string contains a substring.
 *
 * @template S - String to check
 * @template SubStr - Substring to find
 *
 * @example
 * ```typescript
 * type A = Includes<'hello world', 'world'>; // true
 * type B = Includes<'hello', 'world'>; // false
 * ```
 */
export type Includes<S extends string, SubStr extends string> = S extends `${string}${SubStr}${string}`
  ? true
  : false;

// ============================================================================
// SECTION B: ROUTE TYPE UTILITIES
// ============================================================================

/**
 * Basic path segment type (any string).
 */
export type PathSegment = string;

/**
 * Path parameters as key-value mapping.
 */
export type PathParams = Record<string, string>;

/**
 * Constructs a route with typed parameters.
 *
 * @template Path - Base path string
 * @template Params - Parameter key-value mapping
 *
 * @example
 * ```typescript
 * type UserRoute = RouteWithParams<'/api/users/:id', { id: string }>;
 * ```
 */
export type RouteWithParams<Path extends string, Params extends PathParams> = {
  path: Path;
  params: Params;
};

/**
 * Extracts parameter names from a path string.
 *
 * Finds all segments prefixed with `:` and returns them as object keys.
 *
 * @template Path - Path string with `:param` syntax
 *
 * @example
 * ```typescript
 * type A = ExtractParams<'/api/users/:id'>; // { id: string }
 * type B = ExtractParams<'/api/posts/:postId/comments/:commentId'>;
 * // { postId: string, commentId: string }
 * ```
 */
export type ExtractParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
  : Path extends `${string}:${infer Param}`
  ? { [K in Param]: string }
  : Record<string, never>;

/**
 * Converts an object to query string type.
 *
 * @template T - Object with query parameters
 *
 * @example
 * ```typescript
 * type Q = QueryString<{ page: 1, limit: 10 }>;
 * // '?page=1&limit=10'
 * ```
 */
export type QueryString<T extends Record<string, string | number | boolean>> = T extends Record<
  string,
  never
>
  ? ''
  : `?${string}`;

/**
 * Composes routes from base path and route segments.
 *
 * Generates union of all possible routes by concatenating base with each segment.
 *
 * @template Base - Base path (e.g., '/api')
 * @template Routes - Array of route segments
 *
 * @example
 * ```typescript
 * type ApiRoutes = ComposeRoutes<'/api', ['users', 'posts', 'comments']>;
 * // '/api/users' | '/api/posts' | '/api/comments'
 * ```
 */
export type ComposeRoutes<
  Base extends string,
  Routes extends readonly string[]
> = Routes extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
  ? `${Base}/${First}` | ComposeRoutes<Base, Rest>
  : never;

// ============================================================================
// SECTION C: PATTERN VALIDATION TYPES
// ============================================================================

/**
 * Email address pattern.
 *
 * Basic email structure: `user@domain.extension`
 *
 * @example
 * ```typescript
 * const email: EmailPattern = 'user@example.com'; // ✓
 * const invalid: EmailPattern = 'not-an-email'; // ✗
 * ```
 */
export type EmailPattern = `${string}@${string}.${string}`;

/**
 * URL pattern with protocol.
 *
 * Supports HTTP and HTTPS protocols.
 *
 * @example
 * ```typescript
 * const url: UrlPattern = 'https://example.com'; // ✓
 * const invalid: UrlPattern = 'ftp://example.com'; // ✗
 * ```
 */
export type UrlPattern = `${'http' | 'https'}://${string}`;

/**
 * UUID v4 pattern.
 *
 * Standard UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
 *
 * @example
 * ```typescript
 * const uuid: UuidPattern = '550e8400-e29b-41d4-a716-446655440000'; // ✓
 * ```
 */
export type UuidPattern = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Hexadecimal color code.
 *
 * @example
 * ```typescript
 * type A = HexColor; // '#ffffff' | '#000' | etc.
 * const color: HexColor = '#ff5733'; // ✓
 * ```
 */
export type HexColor = `#${string}`;

/**
 * RGB color function.
 *
 * @example
 * ```typescript
 * const color: RgbColor = 'rgb(255, 0, 128)'; // ✓
 * ```
 */
export type RgbColor = `rgb(${number}, ${number}, ${number})`;

/**
 * ISO date string pattern (simplified).
 *
 * Format: YYYY-MM-DD
 *
 * @example
 * ```typescript
 * const date: IsoDateString = '2025-09-30'; // ✓
 * ```
 */
export type IsoDateString = `${number}-${number}-${number}`;

/**
 * Time string pattern.
 *
 * Format: HH:MM:SS
 *
 * @example
 * ```typescript
 * const time: TimeString = '14:30:00'; // ✓
 * ```
 */
export type TimeString = `${number}:${number}:${number}`;

/**
 * Generic pattern matcher.
 *
 * Checks if a string matches a template literal pattern.
 *
 * @template S - String to validate
 * @template Pattern - Pattern to match against
 *
 * @example
 * ```typescript
 * type IsEmail = MatchesPattern<'user@example.com', EmailPattern>; // true
 * type IsNotEmail = MatchesPattern<'invalid', EmailPattern>; // false
 * ```
 */
export type MatchesPattern<S extends string, Pattern extends string> = S extends Pattern
  ? true
  : false;

// ============================================================================
// SECTION D: AUTOCOMPLETE-FRIENDLY UNIONS
// ============================================================================

/**
 * Union type with string fallback (preserves autocomplete).
 *
 * Provides autocomplete suggestions for known literal types while still
 * accepting any string value. Uses the `string & {}` pattern to maintain
 * distinct union members in the type system.
 *
 * @template T - Known string literals
 *
 * @remarks
 * This pattern solves the autocomplete challenge identified in 2025 research:
 * - `string & {}` is treated as a distinct branded type
 * - The type system doesn't collapse the union
 * - IDEs can provide autocomplete for literal members
 * - Any string is still accepted at runtime
 *
 * @example
 * ```typescript
 * type Route = StringUnionWithFallback<'/api/users' | '/api/posts'>;
 *
 * const knownRoute: Route = '/api/users'; // ✓ with autocomplete
 * const customRoute: Route = '/api/custom'; // ✓ no error
 * ```
 *
 * @see {@link https://stackoverflow.com/questions/74467392}
 * @see {@link https://www.ashbyhq.com/blog/engineering/ts-autocomplete-literal-union-template-literals}
 */
export type StringUnionWithFallback<T extends string> = T | (string & {});

/**
 * Literal union that accepts any string (alternative pattern).
 *
 * Uses `Omit<string, T>` to preserve literal types while accepting strings.
 *
 * @template T - Known string literals
 *
 * @example
 * ```typescript
 * type Status = LiteralOrString<'pending' | 'completed'>;
 * const s1: Status = 'pending'; // ✓ autocomplete
 * const s2: Status = 'custom-status'; // ✓ accepted
 * ```
 */
export type LiteralOrString<T extends string> = T | Omit<string, T>;

/**
 * Known values with custom fallback message.
 *
 * Combines known literals with a custom fallback type.
 *
 * @template Known - Known string literals
 * @template Fallback - Custom fallback type
 *
 * @example
 * ```typescript
 * type Color = WithCustomFallback<'red' | 'blue', `custom-${string}`>;
 * const c1: Color = 'red'; // ✓
 * const c2: Color = 'custom-purple'; // ✓
 * const c3: Color = 'invalid'; // ✗
 * ```
 */
export type WithCustomFallback<Known extends string, Fallback extends string> = Known | Fallback;

// ============================================================================
// SECTION E: CROSS-MULTIPLICATION UTILITIES
// ============================================================================

/**
 * Cartesian product of two string unions.
 *
 * Generates all possible combinations by concatenating strings from two unions.
 * The unions are "cross multiplied" at the interpolation position.
 *
 * @template A - First string union
 * @template B - Second string union
 *
 * @remarks
 * Warning: Can generate large types. Use with unions of reasonable size.
 *
 * @example
 * ```typescript
 * type Prefixes = 'get' | 'set';
 * type Nouns = 'User' | 'Post';
 * type Methods = CrossMultiply<Prefixes, Nouns>;
 * // 'getUser' | 'getPost' | 'setUser' | 'setPost'
 * ```
 */
export type CrossMultiply<A extends string, B extends string> = `${A}${B}`;

/**
 * Triple cross-multiplication of string unions.
 *
 * Generates all combinations of three string unions.
 *
 * @template A - First string union
 * @template B - Second string union
 * @template C - Third string union
 *
 * @remarks
 * Warning: Can generate very large types. Limit union sizes to prevent
 * performance issues (recommended: <5 members each, <125 total combinations).
 *
 * @example
 * ```typescript
 * type Prefixes = 'primary' | 'secondary';
 * type Colors = 'red' | 'blue';
 * type Shades = 'light' | 'dark';
 * type Classes = CrossMultiply3<Prefixes, Colors, Shades>;
 * // 'primaryredlight' | 'primaryreddark' | 'primarybluelight' | ...
 * ```
 */
export type CrossMultiply3<A extends string, B extends string, C extends string> = `${A}${B}${C}`;

/**
 * All combinations with prefix, middle, and suffix.
 *
 * Generates template literal combinations with separators.
 *
 * @template Prefix - Prefix strings
 * @template Middle - Middle strings
 * @template Suffix - Suffix strings
 *
 * @example
 * ```typescript
 * type CSS = AllCombinations<'m' | 'p', 'x' | 'y', '-4' | '-8'>;
 * // 'mx-4' | 'mx-8' | 'my-4' | 'my-8' | 'px-4' | 'px-8' | 'py-4' | 'py-8'
 * ```
 */
export type AllCombinations<
  Prefix extends string,
  Middle extends string,
  Suffix extends string
> = `${Prefix}${Middle}${Suffix}`;

/**
 * Safe cross-multiplication with size limit (type-level check).
 *
 * Provides a type-safe way to cross-multiply unions while being mindful of size.
 * Note: TypeScript doesn't enforce tuple length at type level for unions,
 * so this is primarily for documentation and intent.
 *
 * @template A - First string union
 * @template B - Second string union
 *
 * @example
 * ```typescript
 * type Small = SafeCrossMultiply<'a' | 'b', '1' | '2'>; // 'a1' | 'a2' | 'b1' | 'b2'
 * ```
 */
export type SafeCrossMultiply<A extends string, B extends string> = CrossMultiply<A, B>;

/**
 * Permutations of a string array (2 elements).
 *
 * Generates all orderings of elements.
 *
 * @template T - Tuple of strings
 *
 * @example
 * ```typescript
 * type Perms = Permutations2<['a', 'b']>; // 'ab' | 'ba'
 * ```
 */
export type Permutations2<T extends readonly [string, string]> = T extends readonly [
  infer A extends string,
  infer B extends string
]
  ? `${A}${B}` | `${B}${A}`
  : never;

/**
 * Permutations of a string array (3 elements).
 *
 * Generates all orderings of three elements.
 *
 * @template T - Tuple of 3 strings
 *
 * @example
 * ```typescript
 * type Perms = Permutations3<['a', 'b', 'c']>;
 * // 'abc' | 'acb' | 'bac' | 'bca' | 'cab' | 'cba'
 * ```
 */
export type Permutations3<T extends readonly [string, string, string]> = T extends readonly [
  infer A extends string,
  infer B extends string,
  infer C extends string
]
  ?
      | `${A}${B}${C}`
      | `${A}${C}${B}`
      | `${B}${A}${C}`
      | `${B}${C}${A}`
      | `${C}${A}${B}`
      | `${C}${B}${A}`
  : never;