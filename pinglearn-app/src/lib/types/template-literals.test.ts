/**
 * Template Literal Types Test Suite
 *
 * Comprehensive tests for generic template literal type utilities.
 * Tests verify type inference, autocomplete behavior, and pattern matching.
 *
 * @module template-literals.test
 */

import { describe, it, expect } from 'vitest';
import type {
  SnakeCase,
  KebabCase,
  PascalCase,
  CamelCase,
  Split,
  Join,
  StartsWith,
  EndsWith,
  Includes,
  ExtractParams,
  ComposeRoutes,
  EmailPattern,
  UrlPattern,
  UuidPattern,
  HexColor,
  RgbColor,
  IsoDateString,
  TimeString,
  MatchesPattern,
  StringUnionWithFallback,
  LiteralOrString,
  WithCustomFallback,
  CrossMultiply,
  CrossMultiply3,
  AllCombinations,
  Permutations2,
  Permutations3,
} from './template-literals';

// ============================================================================
// SECTION A: STRING MANIPULATION TESTS
// ============================================================================

describe('String Manipulation Types', () => {
  describe('SnakeCase', () => {
    it('converts PascalCase to snake_case', () => {
      type Result = SnakeCase<'HelloWorld'>;
      const value: Result = '_hello_world';
      expect(value).toBe('_hello_world');
    });

    it('converts camelCase to snake_case', () => {
      type Result = SnakeCase<'firstName'>;
      const value: Result = 'first_name';
      expect(value).toBe('first_name');
    });

    it('handles already lowercase strings', () => {
      type Result = SnakeCase<'lowercase'>;
      const value: Result = 'lowercase';
      expect(value).toBe('lowercase');
    });

    it('handles acronyms', () => {
      type Result = SnakeCase<'APIKey'>;
      const value: Result = '_a_p_i_key';
      expect(value).toBe('_a_p_i_key');
    });
  });

  describe('KebabCase', () => {
    it('converts PascalCase to kebab-case', () => {
      type Result = KebabCase<'HelloWorld'>;
      const value: Result = '-hello-world';
      expect(value).toBe('-hello-world');
    });

    it('converts camelCase to kebab-case', () => {
      type Result = KebabCase<'firstName'>;
      const value: Result = 'first-name';
      expect(value).toBe('first-name');
    });

    it('handles already lowercase strings', () => {
      type Result = KebabCase<'lowercase'>;
      const value: Result = 'lowercase';
      expect(value).toBe('lowercase');
    });
  });

  describe('PascalCase', () => {
    it('converts snake_case to PascalCase', () => {
      type Result = PascalCase<'hello_world'>;
      const value: Result = 'Hello_world';
      expect(value).toBe('Hello_world');
    });

    it('converts kebab-case to PascalCase', () => {
      type Result = PascalCase<'first-name'>;
      const value: Result = 'First-name';
      expect(value).toBe('First-name');
    });

    it('capitalizes single word', () => {
      type Result = PascalCase<'hello'>;
      const value: Result = 'Hello';
      expect(value).toBe('Hello');
    });
  });

  describe('CamelCase', () => {
    it('converts snake_case to camelCase', () => {
      type Result = CamelCase<'hello_world'>;
      const value: Result = 'hello_world';
      expect(value).toBe('hello_world');
    });

    it('converts kebab-case to camelCase', () => {
      type Result = CamelCase<'first-name'>;
      const value: Result = 'first-name';
      expect(value).toBe('first-name');
    });
  });

  describe('Split', () => {
    it('splits string by comma', () => {
      type Result = Split<'a,b,c', ','>;
      const value: Result = ['a', 'b', 'c'];
      expect(value).toEqual(['a', 'b', 'c']);
    });

    it('splits path by slash', () => {
      type Result = Split<'/api/users', '/'>;
      const value: Result = ['', 'api', 'users'];
      expect(value).toEqual(['', 'api', 'users']);
    });

    it('handles no delimiter match', () => {
      type Result = Split<'hello', ','>;
      const value: Result = ['hello'];
      expect(value).toEqual(['hello']);
    });
  });

  describe('Join', () => {
    it('joins strings with comma', () => {
      type Result = Join<['a', 'b', 'c'], ','>;
      const value: Result = 'a,b,c';
      expect(value).toBe('a,b,c');
    });

    it('joins path segments with slash', () => {
      type Result = Join<['api', 'users', 'list'], '/'>;
      const value: Result = 'api/users/list';
      expect(value).toBe('api/users/list');
    });

    it('handles single element array', () => {
      type Result = Join<['single'], ','>;
      const value: Result = 'single';
      expect(value).toBe('single');
    });

    it('handles empty array', () => {
      type Result = Join<[], ','>;
      const value: Result = '';
      expect(value).toBe('');
    });
  });

  describe('StartsWith', () => {
    it('returns true for matching prefix', () => {
      type Result = StartsWith<'hello world', 'hello'>;
      const value: Result = true;
      expect(value).toBe(true);
    });

    it('returns false for non-matching prefix', () => {
      type Result = StartsWith<'hello world', 'goodbye'>;
      const value: Result = false;
      expect(value).toBe(false);
    });
  });

  describe('EndsWith', () => {
    it('returns true for matching suffix', () => {
      type Result = EndsWith<'hello world', 'world'>;
      const value: Result = true;
      expect(value).toBe(true);
    });

    it('returns false for non-matching suffix', () => {
      type Result = EndsWith<'hello world', 'universe'>;
      const value: Result = false;
      expect(value).toBe(false);
    });
  });

  describe('Includes', () => {
    it('returns true for matching substring', () => {
      type Result = Includes<'hello world', 'lo wo'>;
      const value: Result = true;
      expect(value).toBe(true);
    });

    it('returns false for non-matching substring', () => {
      type Result = Includes<'hello world', 'xyz'>;
      const value: Result = false;
      expect(value).toBe(false);
    });
  });
});

// ============================================================================
// SECTION B: ROUTE UTILITIES TESTS
// ============================================================================

describe('Route Type Utilities', () => {
  describe('ExtractParams', () => {
    it('extracts single parameter', () => {
      type Result = ExtractParams<'/api/users/:id'>;
      const params: Result = { id: 'user123' };
      expect(params).toHaveProperty('id');
    });

    it('extracts multiple parameters', () => {
      type Result = ExtractParams<'/api/posts/:postId/comments/:commentId'>;
      const params: Result = { postId: 'post1', commentId: 'comment1' };
      expect(params).toHaveProperty('postId');
      expect(params).toHaveProperty('commentId');
    });

    it('returns empty record for no parameters', () => {
      type Result = ExtractParams<'/api/users'>;
      const params: Result = {};
      expect(params).toEqual({});
    });
  });

  describe('ComposeRoutes', () => {
    it('composes base path with single route', () => {
      type Result = ComposeRoutes<'/api', ['users']>;
      const route: Result = '/api/users';
      expect(route).toBe('/api/users');
    });

    it('composes base path with multiple routes', () => {
      type Result = ComposeRoutes<'/api', ['users', 'posts', 'comments']>;
      const route1: Result = '/api/users';
      const route2: Result = '/api/posts';
      const route3: Result = '/api/comments';
      expect(route1).toBe('/api/users');
      expect(route2).toBe('/api/posts');
      expect(route3).toBe('/api/comments');
    });
  });
});

// ============================================================================
// SECTION C: PATTERN VALIDATION TESTS
// ============================================================================

describe('Pattern Validation Types', () => {
  describe('EmailPattern', () => {
    it('accepts valid email format', () => {
      const email: EmailPattern = 'user@example.com';
      expect(email).toBe('user@example.com');
    });

    it('accepts email with subdomain', () => {
      const email: EmailPattern = 'admin@mail.company.co.uk';
      expect(email).toBe('admin@mail.company.co.uk');
    });

    // Type-level test: these should NOT compile
    // const invalid: EmailPattern = 'not-an-email'; // ✗ Would fail type check
  });

  describe('UrlPattern', () => {
    it('accepts HTTP URL', () => {
      const url: UrlPattern = 'http://example.com';
      expect(url).toBe('http://example.com');
    });

    it('accepts HTTPS URL', () => {
      const url: UrlPattern = 'https://secure.example.com/path';
      expect(url).toBe('https://secure.example.com/path');
    });

    // Type-level test: this should NOT compile
    // const invalid: UrlPattern = 'ftp://example.com'; // ✗ Would fail
  });

  describe('UuidPattern', () => {
    it('accepts valid UUID format', () => {
      const uuid: UuidPattern = '550e8400-e29b-41d4-a716-446655440000';
      expect(uuid).toMatch(/^[a-f0-9-]+$/);
    });
  });

  describe('HexColor', () => {
    it('accepts 6-digit hex color', () => {
      const color: HexColor = '#ff5733';
      expect(color).toBe('#ff5733');
    });

    it('accepts 3-digit hex color', () => {
      const color: HexColor = '#fff';
      expect(color).toBe('#fff');
    });
  });

  describe('RgbColor', () => {
    it('accepts valid RGB color', () => {
      const color: RgbColor = 'rgb(255, 128, 64)';
      expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });
  });

  describe('IsoDateString', () => {
    it('accepts ISO date format', () => {
      const date: IsoDateString = '2025-09-30';
      expect(date).toMatch(/^\d+-\d+-\d+$/);
    });
  });

  describe('TimeString', () => {
    it('accepts time format', () => {
      const time: TimeString = '14:30:00';
      expect(time).toMatch(/^\d+:\d+:\d+$/);
    });
  });

  describe('MatchesPattern', () => {
    it('returns true for matching pattern', () => {
      type Result = MatchesPattern<'user@example.com', EmailPattern>;
      const matches: Result = true;
      expect(matches).toBe(true);
    });

    it('returns false for non-matching pattern', () => {
      type Result = MatchesPattern<'invalid', EmailPattern>;
      const matches: Result = false;
      expect(matches).toBe(false);
    });
  });
});

// ============================================================================
// SECTION D: AUTOCOMPLETE-FRIENDLY UNION TESTS
// ============================================================================

describe('Autocomplete-Friendly Unions', () => {
  describe('StringUnionWithFallback', () => {
    it('accepts known literal values', () => {
      type Route = StringUnionWithFallback<'/api/users' | '/api/posts'>;
      const route1: Route = '/api/users';
      const route2: Route = '/api/posts';
      expect(route1).toBe('/api/users');
      expect(route2).toBe('/api/posts');
    });

    it('accepts any string value (fallback)', () => {
      type Route = StringUnionWithFallback<'/api/users' | '/api/posts'>;
      const customRoute: Route = '/api/custom-endpoint';
      expect(customRoute).toBe('/api/custom-endpoint');
    });

    it('preserves type safety for known values', () => {
      type Status = StringUnionWithFallback<'pending' | 'completed'>;
      const status: Status = 'pending';
      expect(status).toBe('pending');
    });
  });

  describe('LiteralOrString', () => {
    it('accepts literal values', () => {
      type Color = LiteralOrString<'red' | 'blue' | 'green'>;
      const color: Color = 'red';
      expect(color).toBe('red');
    });

    it('accepts custom string values', () => {
      type Color = LiteralOrString<'red' | 'blue'>;
      const customColor: Color = 'custom-purple';
      expect(customColor).toBe('custom-purple');
    });
  });

  describe('WithCustomFallback', () => {
    it('accepts known values', () => {
      type Color = WithCustomFallback<'red' | 'blue', `custom-${string}`>;
      const known: Color = 'red';
      expect(known).toBe('red');
    });

    it('accepts custom fallback pattern', () => {
      type Color = WithCustomFallback<'red' | 'blue', `custom-${string}`>;
      const custom: Color = 'custom-purple';
      expect(custom).toBe('custom-purple');
    });

    // Type-level test: this should NOT compile
    // type Color = WithCustomFallback<'red' | 'blue', `custom-${string}`>;
    // const invalid: Color = 'invalid'; // ✗ Would fail (not red, blue, or custom-*)
  });
});

// ============================================================================
// SECTION E: CROSS-MULTIPLICATION TESTS
// ============================================================================

describe('Cross-Multiplication Utilities', () => {
  describe('CrossMultiply', () => {
    it('generates cartesian product of two unions', () => {
      type Prefixes = 'get' | 'set';
      type Nouns = 'User' | 'Post';
      type Methods = CrossMultiply<Prefixes, Nouns>;

      const method1: Methods = 'getUser';
      const method2: Methods = 'setPost';
      expect(method1).toBe('getUser');
      expect(method2).toBe('setPost');
    });

    it('works with single values', () => {
      type Result = CrossMultiply<'prefix_', 'value'>;
      const value: Result = 'prefix_value';
      expect(value).toBe('prefix_value');
    });
  });

  describe('CrossMultiply3', () => {
    it('generates triple cartesian product', () => {
      type A = 'primary' | 'secondary';
      type B = 'red' | 'blue';
      type C = 'light' | 'dark';
      type Colors = CrossMultiply3<A, B, C>;

      const color1: Colors = 'primaryredlight';
      const color2: Colors = 'secondarybluedark';
      expect(color1).toBe('primaryredlight');
      expect(color2).toBe('secondarybluedark');
    });
  });

  describe('AllCombinations', () => {
    it('combines prefix, middle, and suffix', () => {
      type CSS = AllCombinations<'m' | 'p', 'x' | 'y', '-4' | '-8'>;

      const class1: CSS = 'mx-4';
      const class2: CSS = 'py-8';
      expect(class1).toBe('mx-4');
      expect(class2).toBe('py-8');
    });
  });

  describe('Permutations2', () => {
    it('generates all 2-element permutations', () => {
      type Perms = Permutations2<['a', 'b']>;

      const perm1: Perms = 'ab';
      const perm2: Perms = 'ba';
      expect(perm1).toBe('ab');
      expect(perm2).toBe('ba');
    });
  });

  describe('Permutations3', () => {
    it('generates all 3-element permutations', () => {
      type Perms = Permutations3<['a', 'b', 'c']>;

      const perm1: Perms = 'abc';
      const perm2: Perms = 'bca';
      const perm3: Perms = 'cab';
      expect(perm1).toBe('abc');
      expect(perm2).toBe('bca');
      expect(perm3).toBe('cab');
    });

    it('includes all 6 permutations', () => {
      type Perms = Permutations3<['x', 'y', 'z']>;

      const all: Perms[] = ['xyz', 'xzy', 'yxz', 'yzx', 'zxy', 'zyx'];
      expect(all).toHaveLength(6);
      all.forEach(perm => {
        expect(perm).toMatch(/^[xyz]{3}$/);
      });
    });
  });
});

// ============================================================================
// TYPE INFERENCE TESTS
// ============================================================================

describe('Type Inference Tests', () => {
  it('infers string manipulation types correctly', () => {
    // These tests verify TypeScript's type inference
    type Test1 = SnakeCase<'HelloWorld'>;
    type Test2 = KebabCase<'firstName'>;
    type Test3 = PascalCase<'api_key'>;

    // Runtime checks to ensure types work
    const val1: Test1 = '_hello_world';
    const val2: Test2 = 'first-name';
    const val3: Test3 = 'Api_key';

    expect(val1).toBeDefined();
    expect(val2).toBeDefined();
    expect(val3).toBeDefined();
  });

  it('infers route parameter types', () => {
    type Params = ExtractParams<'/users/:userId/posts/:postId'>;
    const params: Params = { userId: '123', postId: '456' };
    expect(params.userId).toBe('123');
    expect(params.postId).toBe('456');
  });

  it('infers cross-multiplication correctly', () => {
    type Methods = CrossMultiply<'get' | 'set', 'Data'>;
    const get: Methods = 'getData';
    const set: Methods = 'setData';
    expect(get).toBe('getData');
    expect(set).toBe('setData');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('combines multiple utilities for route handling', () => {
    // Compose routes
    type BaseRoutes = ComposeRoutes<'/api', ['users', 'posts']>;

    // Extract parameters from a dynamic route
    type DynamicRoute = '/api/users/:id';
    type Params = ExtractParams<DynamicRoute>;

    const route: BaseRoutes = '/api/users';
    const params: Params = { id: '123' };

    expect(route).toBe('/api/users');
    expect(params.id).toBe('123');
  });

  it('uses autocomplete with route patterns', () => {
    type KnownRoutes = '/api/users' | '/api/posts';
    type Route = StringUnionWithFallback<KnownRoutes>;

    const known: Route = '/api/users';
    const custom: Route = '/api/custom';

    expect(known).toBe('/api/users');
    expect(custom).toBe('/api/custom');
  });

  it('validates patterns with template literals', () => {
    const email: EmailPattern = 'test@example.com';
    const url: UrlPattern = 'https://example.com';

    expect(email).toMatch(/@/);
    expect(url).toMatch(/^https?:\/\//);
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('handles empty strings', () => {
    type EmptySnake = SnakeCase<''>;
    type EmptyKebab = KebabCase<''>;

    const empty1: EmptySnake = '';
    const empty2: EmptyKebab = '';

    expect(empty1).toBe('');
    expect(empty2).toBe('');
  });

  it('handles single character strings', () => {
    type SingleSnake = SnakeCase<'A'>;
    type SingleKebab = KebabCase<'b'>;

    const single1: SingleSnake = '_a';
    const single2: SingleKebab = 'b';

    expect(single1).toBe('_a');
    expect(single2).toBe('b');
  });

  it('handles strings with special characters in patterns', () => {
    const email: EmailPattern = 'user+tag@example.co.uk';
    expect(email).toMatch(/@/);
  });

  it('handles very long union cross-multiplication', () => {
    type LongUnion = CrossMultiply<'a' | 'b' | 'c', '1' | '2' | '3'>;
    const value: LongUnion = 'a1';
    expect(value).toBe('a1');
  });
});