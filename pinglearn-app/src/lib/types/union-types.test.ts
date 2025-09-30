/**
 * Tests for Generic Discriminated Union Utilities
 *
 * @module union-types.test
 */

import {
  // Result types and functions
  Result,
  success,
  failure,
  isSuccess,
  isFailure,
  map,
  flatMap,
  mapError,
  unwrap,
  unwrapOr,
  // AsyncState types and functions
  AsyncState,
  idle,
  loading,
  asyncSuccess,
  asyncError,
  isIdle,
  isLoading,
  isAsyncSuccess,
  isAsyncError,
  fromResult,
  toResult,
  // Option types and functions
  Option,
  some,
  none,
  fromNullable,
  isSome,
  isNone,
  mapOption,
  flatMapOption,
  unwrapOption,
  unwrapOrOption,
  toNullable,
  // Exhaustive checking
  assertNever,
  match,
} from './union-types';

// ============================================================================
// RESULT<T, E> TESTS
// ============================================================================

describe('Result<T, E>', () => {
  describe('Factory Functions', () => {
    test('success creates successful result', () => {
      const result = success(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    test('failure creates failure result', () => {
      const result = failure('error message');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('error message');
      }
    });

    test('success with object data', () => {
      const data = { id: '123', name: 'Test' };
      const result = success(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    test('failure with Error object', () => {
      const error = new Error('Test error');
      const result = failure(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('Type Guards', () => {
    test('isSuccess correctly identifies success', () => {
      const result: Result<number, string> = success(42);

      expect(isSuccess(result)).toBe(true);
      expect(isFailure(result)).toBe(false);

      // Type narrowing test
      if (isSuccess(result)) {
        expect(result.data).toBe(42);
      }
    });

    test('isFailure correctly identifies failure', () => {
      const result: Result<number, string> = failure('error');

      expect(isFailure(result)).toBe(true);
      expect(isSuccess(result)).toBe(false);

      // Type narrowing test
      if (isFailure(result)) {
        expect(result.error).toBe('error');
      }
    });
  });

  describe('Utility Functions', () => {
    describe('map', () => {
      test('map transforms success data', () => {
        const result = success(5);
        const doubled = map(result, (x) => x * 2);

        expect(isSuccess(doubled)).toBe(true);
        if (isSuccess(doubled)) {
          expect(doubled.data).toBe(10);
        }
      });

      test('map preserves failure', () => {
        const result: Result<number, string> = failure('error');
        const doubled = map(result, (x) => x * 2);

        expect(isFailure(doubled)).toBe(true);
        if (isFailure(doubled)) {
          expect(doubled.error).toBe('error');
        }
      });

      test('map can change data type', () => {
        const result = success(42);
        const stringified = map(result, (x) => x.toString());

        expect(isSuccess(stringified)).toBe(true);
        if (isSuccess(stringified)) {
          expect(stringified.data).toBe('42');
          expect(typeof stringified.data).toBe('string');
        }
      });
    });

    describe('flatMap', () => {
      test('flatMap chains successful results', () => {
        const result = success(10);
        const divided = flatMap(result, (x) =>
          x === 0 ? failure('Division by zero') : success(100 / x)
        );

        expect(isSuccess(divided)).toBe(true);
        if (isSuccess(divided)) {
          expect(divided.data).toBe(10);
        }
      });

      test('flatMap returns failure from transformation', () => {
        const result = success(0);
        const divided = flatMap(result, (x) =>
          x === 0 ? failure('Division by zero') : success(100 / x)
        );

        expect(isFailure(divided)).toBe(true);
        if (isFailure(divided)) {
          expect(divided.error).toBe('Division by zero');
        }
      });

      test('flatMap preserves original failure', () => {
        const result: Result<number, string> = failure('original error');
        const divided = flatMap(result, (x) => success(100 / x));

        expect(isFailure(divided)).toBe(true);
        if (isFailure(divided)) {
          expect(divided.error).toBe('original error');
        }
      });

      test('flatMap allows chaining multiple operations', () => {
        const result = success(20);
        const chained = flatMap(
          flatMap(result, (x) => success(x / 2)),
          (x) => success(x + 5)
        );

        expect(isSuccess(chained)).toBe(true);
        if (isSuccess(chained)) {
          expect(chained.data).toBe(15); // (20 / 2) + 5
        }
      });
    });

    describe('mapError', () => {
      test('mapError transforms error', () => {
        const result: Result<number, Error> = failure(new Error('Failed'));
        const withString = mapError(result, (err) => err.message);

        expect(isFailure(withString)).toBe(true);
        if (isFailure(withString)) {
          expect(withString.error).toBe('Failed');
          expect(typeof withString.error).toBe('string');
        }
      });

      test('mapError preserves success', () => {
        const result: Result<number, Error> = success(42);
        const mapped = mapError(result, (err) => err.message);

        expect(isSuccess(mapped)).toBe(true);
        if (isSuccess(mapped)) {
          expect(mapped.data).toBe(42);
        }
      });
    });

    describe('unwrap', () => {
      test('unwrap returns data on success', () => {
        const result = success(42);
        const value = unwrap(result);

        expect(value).toBe(42);
      });

      test('unwrap throws on failure', () => {
        const result = failure('error message');

        expect(() => unwrap(result)).toThrow('error message');
      });

      test('unwrap throws Error object', () => {
        const error = new Error('Test error');
        const result = failure(error);

        expect(() => unwrap(result)).toThrow(error);
      });
    });

    describe('unwrapOr', () => {
      test('unwrapOr returns data on success', () => {
        const result = success(42);
        const value = unwrapOr(result, 0);

        expect(value).toBe(42);
      });

      test('unwrapOr returns default on failure', () => {
        const result: Result<number, string> = failure('error');
        const value = unwrapOr(result, 0);

        expect(value).toBe(0);
      });

      test('unwrapOr with object default', () => {
        const defaultUser = { id: '0', name: 'Guest' };
        const result: Result<{ id: string; name: string }, string> =
          failure('Not found');
        const value = unwrapOr(result, defaultUser);

        expect(value).toEqual(defaultUser);
      });
    });
  });

  describe('Type Safety', () => {
    test('TypeScript narrows correctly in if statements', () => {
      const result: Result<number, string> = success(42);

      if (isSuccess(result)) {
        // TypeScript should know result.data exists here
        const value: number = result.data;
        expect(value).toBe(42);
      }

      if (isFailure(result)) {
        // This branch should not be reached
        fail('Should not reach failure branch');
      }
    });

    test('TypeScript narrows correctly in else branch', () => {
      const result: Result<number, string> = failure('error');

      if (isSuccess(result)) {
        fail('Should not reach success branch');
      } else {
        // TypeScript should know result.error exists here
        const error: string = result.error;
        expect(error).toBe('error');
      }
    });
  });

  describe('Real-world scenarios', () => {
    test('divide function using Result', () => {
      function divide(a: number, b: number): Result<number, string> {
        if (b === 0) {
          return failure('Cannot divide by zero');
        }
        return success(a / b);
      }

      const result1 = divide(10, 2);
      expect(isSuccess(result1)).toBe(true);
      if (isSuccess(result1)) {
        expect(result1.data).toBe(5);
      }

      const result2 = divide(10, 0);
      expect(isFailure(result2)).toBe(true);
      if (isFailure(result2)) {
        expect(result2.error).toBe('Cannot divide by zero');
      }
    });

    test('parsing JSON with Result', () => {
      function parseJSON<T>(json: string): Result<T, string> {
        try {
          const data = JSON.parse(json) as T;
          return success(data);
        } catch (error) {
          return failure(
            error instanceof Error ? error.message : 'Parse error'
          );
        }
      }

      const result1 = parseJSON<{ name: string }>('{"name": "Alice"}');
      expect(isSuccess(result1)).toBe(true);

      const result2 = parseJSON<{ name: string }>('invalid json');
      expect(isFailure(result2)).toBe(true);
    });
  });
});

// ============================================================================
// ASYNC STATE<T, E> TESTS
// ============================================================================

describe('AsyncState<T, E>', () => {
  describe('Factory Functions', () => {
    test('idle creates idle state', () => {
      const state = idle<number>();

      expect(state.status).toBe('idle');
    });

    test('loading creates loading state', () => {
      const state = loading<number>();

      expect(state.status).toBe('loading');
    });

    test('asyncSuccess creates success state', () => {
      const state = asyncSuccess(42);

      expect(state.status).toBe('success');
      if (state.status === 'success') {
        expect(state.data).toBe(42);
      }
    });

    test('asyncError creates error state', () => {
      const error = new Error('Failed');
      const state = asyncError<number>(error);

      expect(state.status).toBe('error');
      if (state.status === 'error') {
        expect(state.error).toBe(error);
      }
    });
  });

  describe('Type Guards', () => {
    test('isIdle correctly identifies idle', () => {
      const state: AsyncState<number> = idle();

      expect(isIdle(state)).toBe(true);
      expect(isLoading(state)).toBe(false);
      expect(isAsyncSuccess(state)).toBe(false);
      expect(isAsyncError(state)).toBe(false);
    });

    test('isLoading correctly identifies loading', () => {
      const state: AsyncState<number> = loading();

      expect(isLoading(state)).toBe(true);
      expect(isIdle(state)).toBe(false);
      expect(isAsyncSuccess(state)).toBe(false);
      expect(isAsyncError(state)).toBe(false);
    });

    test('isAsyncSuccess correctly identifies success', () => {
      const state: AsyncState<number> = asyncSuccess(42);

      expect(isAsyncSuccess(state)).toBe(true);
      expect(isIdle(state)).toBe(false);
      expect(isLoading(state)).toBe(false);
      expect(isAsyncError(state)).toBe(false);

      // Type narrowing test
      if (isAsyncSuccess(state)) {
        expect(state.data).toBe(42);
      }
    });

    test('isAsyncError correctly identifies error', () => {
      const error = new Error('Failed');
      const state: AsyncState<number> = asyncError(error);

      expect(isAsyncError(state)).toBe(true);
      expect(isIdle(state)).toBe(false);
      expect(isLoading(state)).toBe(false);
      expect(isAsyncSuccess(state)).toBe(false);

      // Type narrowing test
      if (isAsyncError(state)) {
        expect(state.error).toBe(error);
      }
    });
  });

  describe('Conversions', () => {
    describe('fromResult', () => {
      test('fromResult converts success Result to success state', () => {
        const result = success(42);
        const state = fromResult(result);

        expect(state.status).toBe('success');
        if (state.status === 'success') {
          expect(state.data).toBe(42);
        }
      });

      test('fromResult converts failure Result to error state', () => {
        const result = failure('error');
        const state = fromResult(result);

        expect(state.status).toBe('error');
        if (state.status === 'error') {
          expect(state.error).toBe('error');
        }
      });
    });

    describe('toResult', () => {
      test('toResult extracts Result from success state', () => {
        const state = asyncSuccess(42);
        const result = toResult(state);

        expect(result).not.toBeNull();
        if (result) {
          expect(isSuccess(result)).toBe(true);
          if (isSuccess(result)) {
            expect(result.data).toBe(42);
          }
        }
      });

      test('toResult extracts Result from error state', () => {
        const state = asyncError<number>('error');
        const result = toResult(state);

        expect(result).not.toBeNull();
        if (result) {
          expect(isFailure(result)).toBe(true);
          if (isFailure(result)) {
            expect(result.error).toBe('error');
          }
        }
      });

      test('toResult returns null for idle state', () => {
        const state = idle<number>();
        const result = toResult(state);

        expect(result).toBeNull();
      });

      test('toResult returns null for loading state', () => {
        const state = loading<number>();
        const result = toResult(state);

        expect(result).toBeNull();
      });
    });
  });

  describe('Real-world scenarios', () => {
    test('simulating API call lifecycle', async () => {
      let state: AsyncState<{ id: string; name: string }> = idle();

      // Start loading
      state = loading();
      expect(state.status).toBe('loading');

      // Simulate successful response
      const mockUser = { id: '123', name: 'Alice' };
      state = asyncSuccess(mockUser);
      expect(state.status).toBe('success');
      if (state.status === 'success') {
        expect(state.data).toEqual(mockUser);
      }
    });

    test('simulating API call with error', () => {
      let state: AsyncState<string> = idle();

      // Start loading
      state = loading();

      // Simulate error
      const error = new Error('Network error');
      state = asyncError(error);

      expect(state.status).toBe('error');
      if (state.status === 'error') {
        expect(state.error.message).toBe('Network error');
      }
    });

    test('exhaustive switch statement compiles', () => {
      const state: AsyncState<number> = loading();

      function renderState(s: AsyncState<number>): string {
        switch (s.status) {
          case 'idle':
            return 'Not started';
          case 'loading':
            return 'Loading...';
          case 'success':
            return `Value: ${s.data}`;
          case 'error':
            return `Error: ${s.error.message}`;
          default:
            return assertNever(s);
        }
      }

      expect(renderState(state)).toBe('Loading...');
      expect(renderState(asyncSuccess(42))).toBe('Value: 42');
      expect(renderState(idle())).toBe('Not started');
      expect(renderState(asyncError(new Error('Test')))).toBe('Error: Test');
    });
  });
});

// ============================================================================
// OPTION<T> TESTS
// ============================================================================

describe('Option<T>', () => {
  describe('Factory Functions', () => {
    test('some creates some option', () => {
      const option = some(42);

      expect(option.type).toBe('some');
      if (option.type === 'some') {
        expect(option.value).toBe(42);
      }
    });

    test('none creates none option', () => {
      const option = none<number>();

      expect(option.type).toBe('none');
    });

    describe('fromNullable', () => {
      test('fromNullable converts value to some', () => {
        const option = fromNullable(42);

        expect(option.type).toBe('some');
        if (option.type === 'some') {
          expect(option.value).toBe(42);
        }
      });

      test('fromNullable converts null to none', () => {
        const option = fromNullable(null);

        expect(option.type).toBe('none');
      });

      test('fromNullable converts undefined to none', () => {
        const option = fromNullable(undefined);

        expect(option.type).toBe('none');
      });

      test('fromNullable handles falsy values correctly', () => {
        expect(fromNullable(0).type).toBe('some');
        expect(fromNullable('').type).toBe('some');
        expect(fromNullable(false).type).toBe('some');
      });
    });
  });

  describe('Type Guards', () => {
    test('isSome correctly identifies some', () => {
      const option: Option<number> = some(42);

      expect(isSome(option)).toBe(true);
      expect(isNone(option)).toBe(false);

      // Type narrowing test
      if (isSome(option)) {
        expect(option.value).toBe(42);
      }
    });

    test('isNone correctly identifies none', () => {
      const option: Option<number> = none();

      expect(isNone(option)).toBe(true);
      expect(isSome(option)).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    describe('mapOption', () => {
      test('mapOption transforms some value', () => {
        const option = some(5);
        const doubled = mapOption(option, (x) => x * 2);

        expect(isSome(doubled)).toBe(true);
        if (isSome(doubled)) {
          expect(doubled.value).toBe(10);
        }
      });

      test('mapOption preserves none', () => {
        const option: Option<number> = none();
        const doubled = mapOption(option, (x) => x * 2);

        expect(isNone(doubled)).toBe(true);
      });

      test('mapOption can change type', () => {
        const option = some(42);
        const stringified = mapOption(option, (x) => x.toString());

        expect(isSome(stringified)).toBe(true);
        if (isSome(stringified)) {
          expect(stringified.value).toBe('42');
          expect(typeof stringified.value).toBe('string');
        }
      });
    });

    describe('flatMapOption', () => {
      test('flatMapOption chains some options', () => {
        const option = some(10);
        const divided = flatMapOption(option, (x) =>
          x === 0 ? none() : some(100 / x)
        );

        expect(isSome(divided)).toBe(true);
        if (isSome(divided)) {
          expect(divided.value).toBe(10);
        }
      });

      test('flatMapOption returns none from transformation', () => {
        const option = some(0);
        const divided = flatMapOption(option, (x) =>
          x === 0 ? none() : some(100 / x)
        );

        expect(isNone(divided)).toBe(true);
      });

      test('flatMapOption preserves original none', () => {
        const option: Option<number> = none();
        const divided = flatMapOption(option, (x) => some(100 / x));

        expect(isNone(divided)).toBe(true);
      });
    });

    describe('unwrapOption', () => {
      test('unwrapOption returns value on some', () => {
        const option = some(42);
        const value = unwrapOption(option);

        expect(value).toBe(42);
      });

      test('unwrapOption throws on none', () => {
        const option: Option<number> = none();

        expect(() => unwrapOption(option)).toThrow('Cannot unwrap None option');
      });
    });

    describe('unwrapOrOption', () => {
      test('unwrapOrOption returns value on some', () => {
        const option = some(42);
        const value = unwrapOrOption(option, 0);

        expect(value).toBe(42);
      });

      test('unwrapOrOption returns default on none', () => {
        const option: Option<number> = none();
        const value = unwrapOrOption(option, 0);

        expect(value).toBe(0);
      });
    });

    describe('toNullable', () => {
      test('toNullable converts some to value', () => {
        const option = some(42);
        const nullable = toNullable(option);

        expect(nullable).toBe(42);
      });

      test('toNullable converts none to null', () => {
        const option: Option<number> = none();
        const nullable = toNullable(option);

        expect(nullable).toBeNull();
      });
    });
  });

  describe('Real-world scenarios', () => {
    test('find user by ID using Option', () => {
      const users = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ];

      function findUser(id: string): Option<{ id: string; name: string }> {
        const user = users.find((u) => u.id === id);
        return fromNullable(user);
      }

      const user1 = findUser('1');
      expect(isSome(user1)).toBe(true);
      if (isSome(user1)) {
        expect(user1.value.name).toBe('Alice');
      }

      const user3 = findUser('3');
      expect(isNone(user3)).toBe(true);
    });
  });
});

// ============================================================================
// EXHAUSTIVE CHECKING TESTS
// ============================================================================

describe('Exhaustive Checking', () => {
  describe('assertNever', () => {
    test('assertNever throws with value information', () => {
      const invalidValue = { status: 'unknown' } as never;

      expect(() => assertNever(invalidValue)).toThrow(
        'Unhandled discriminated union member'
      );
      expect(() => assertNever(invalidValue)).toThrow('unknown');
    });

    test('switch with all cases compiles and works', () => {
      const state: AsyncState<number> = loading();

      function handleState(s: AsyncState<number>): string {
        switch (s.status) {
          case 'idle':
            return 'idle';
          case 'loading':
            return 'loading';
          case 'success':
            return s.data.toString();
          case 'error':
            return s.error.message;
          default:
            return assertNever(s);
        }
      }

      expect(handleState(idle())).toBe('idle');
      expect(handleState(loading())).toBe('loading');
      expect(handleState(asyncSuccess(42))).toBe('42');
      expect(handleState(asyncError(new Error('test')))).toBe('test');
    });
  });

  describe('Exhaustiveness demonstration', () => {
    test('exhaustive Result handling', () => {
      const result: Result<number, string> = success(42);

      function handleResult(r: Result<number, string>): string {
        if (isSuccess(r)) {
          return `Success: ${r.data}`;
        } else if (isFailure(r)) {
          return `Failure: ${r.error}`;
        } else {
          return assertNever(r);
        }
      }

      expect(handleResult(result)).toBe('Success: 42');
      expect(handleResult(failure('error'))).toBe('Failure: error');
    });

    test('exhaustive Option handling', () => {
      const option: Option<number> = some(42);

      function handleOption(o: Option<number>): string {
        switch (o.type) {
          case 'some':
            return `Some: ${o.value}`;
          case 'none':
            return 'None';
          default:
            return assertNever(o);
        }
      }

      expect(handleOption(option)).toBe('Some: 42');
      expect(handleOption(none())).toBe('None');
    });
  });
});

// ============================================================================
// PATTERN MATCHING TESTS
// ============================================================================

describe('Pattern Matching', () => {
  describe('match utility', () => {
    test('match handles all AsyncState cases', () => {
      const state: AsyncState<number> = asyncSuccess(42);

      const result = match(state, 'status', {
        idle: () => 'Not started',
        loading: () => 'Loading...',
        success: (s) => `Value: ${s.data}`,
        error: (s) => `Error: ${s.error.message}`,
      });

      expect(result).toBe('Value: 42');
    });

    test('match returns correct value for each case', () => {
      expect(
        match(idle<number>(), 'status', {
          idle: () => 'idle',
          loading: () => 'loading',
          success: (s) => s.data.toString(),
          error: (s) => s.error.message,
        })
      ).toBe('idle');

      expect(
        match(loading<number>(), 'status', {
          idle: () => 'idle',
          loading: () => 'loading',
          success: (s) => s.data.toString(),
          error: (s) => s.error.message,
        })
      ).toBe('loading');

      expect(
        match(asyncSuccess(99), 'status', {
          idle: () => 'idle',
          loading: () => 'loading',
          success: (s) => s.data.toString(),
          error: (s) => s.error.message,
        })
      ).toBe('99');

      expect(
        match(asyncError<number>(new Error('fail')), 'status', {
          idle: () => 'idle',
          loading: () => 'loading',
          success: (s) => s.data.toString(),
          error: (s) => s.error.message,
        })
      ).toBe('fail');
    });

    test('match infers correct types in handlers', () => {
      const state = asyncSuccess({ id: '123', name: 'Alice' });

      const result = match(state, 'status', {
        idle: () => 'No user',
        loading: () => 'Loading user...',
        success: (s) => {
          // TypeScript should know s.data has id and name properties
          const user: { id: string; name: string } = s.data;
          return user.name;
        },
        error: (s) => `Error: ${s.error.message}`,
      });

      expect(result).toBe('Alice');
    });

    test('match with Option type', () => {
      const option: Option<number> = some(42);

      const result = match(option, 'type', {
        some: (o) => `Value: ${o.value}`,
        none: () => 'No value',
      });

      expect(result).toBe('Value: 42');
    });

    test('match with Result type using success discriminant', () => {
      const result: Result<number, string> = success(42);

      const output = match(result, 'success', {
        true: (r) => `Success: ${r.data}`,
        false: (r) => `Failure: ${r.error}`,
      });

      expect(output).toBe('Success: 42');
    });
  });

  describe('match error handling', () => {
    test('match throws for unhandled case', () => {
      // This would normally be caught by TypeScript, but testing runtime behavior
      const state: AsyncState<number> = asyncSuccess(42);
      const incompleteHandlers = {
        idle: () => 'idle',
        loading: () => 'loading',
        // Missing success and error
      };

      // Type assertion to bypass TypeScript (simulating runtime error)
      expect(() =>
        match(state, 'status', incompleteHandlers as any)
      ).toThrow('No handler for discriminant value');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  test('combining Result and AsyncState', () => {
    // Simulate API call that returns Result
    function apiCall(): Result<string, Error> {
      return success('data');
    }

    // Convert to AsyncState for UI
    let state: AsyncState<string, Error> = idle();

    state = loading();
    const result = apiCall();
    state = fromResult(result);

    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data).toBe('data');
    }
  });

  test('combining Option and Result', () => {
    // Find user (returns Option)
    function findUser(id: string): Option<{ id: string; name: string }> {
      if (id === '1') {
        return some({ id: '1', name: 'Alice' });
      }
      return none();
    }

    // Validate user (returns Result)
    function validateUser(
      option: Option<{ id: string; name: string }>
    ): Result<{ id: string; name: string }, string> {
      if (isSome(option)) {
        return success(option.value);
      }
      return failure('User not found');
    }

    const userOption = findUser('1');
    const userResult = validateUser(userOption);

    expect(isSuccess(userResult)).toBe(true);
  });

  test('complete data fetching flow', () => {
    // Simulate complete flow: Option -> Result -> AsyncState
    let state: AsyncState<{ id: string; name: string }, string> = idle();

    // Start loading
    state = loading();

    // Find user
    const userOption = fromNullable({ id: '1', name: 'Alice' });

    // Convert to Result
    const userResult: Result<{ id: string; name: string }, string> =
      isSome(userOption)
        ? success(userOption.value)
        : failure('User not found');

    // Convert to AsyncState
    state = fromResult(userResult);

    expect(state.status).toBe('success');
  });
});