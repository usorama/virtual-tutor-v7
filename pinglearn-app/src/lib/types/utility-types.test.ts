/**
 * Unit Tests for Generic Utility Types
 * TS-011: Comprehensive test suite for utility-types.ts
 */

import { describe, it, expect } from 'vitest';
import type {
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  DeepMutable,
  If,
  Switch,
  Match,
  Not,
  And,
  Or,
  Params,
  AsyncResult,
  FirstParam,
  LastParam,
  SecondParam,
  ParamAt,
  InstanceOf,
  ConstructorParams,
  PromiseValue,
  AsyncReturnType,
  PromisifyReturnType,
  UnwrapPromise,
  AwaitedProps,
  PromisifyMethods,
  IsPromise,
  IsNever,
  IsAny,
  IsUnknown,
  IsEqual,
  IsExtends,
  IsNull,
  IsUndefined,
  IsNullable,
  IsArray,
  IsTuple,
  IsFunction,
  IsObject,
  IsUnion,
  AllExtend,
  AnyExtends
} from './utility-types';

describe('Utility Types - Type-Level Tests', () => {
  describe('Mapped Type Utilities', () => {
    it('DeepPartial should make nested properties optional', () => {
      interface User {
        id: string;
        profile: {
          name: string;
          settings: {
            theme: string;
          };
        };
      }

      type PartialUser = DeepPartial<User>;

      const user: PartialUser = {
        profile: {
          settings: {}
        }
      };

      expect(user).toBeDefined();
      expect(user.profile?.settings).toBeDefined();
    });

    it('DeepRequired should make nested properties required', () => {
      interface PartialConfig {
        db?: {
          host?: string;
        };
      }

      type RequiredConfig = DeepRequired<PartialConfig>;

      // This should be type-safe
      const config: RequiredConfig = {
        db: {
          host: 'localhost'
        }
      };

      expect(config.db.host).toBe('localhost');
    });

    it('DeepMutable should remove readonly modifiers', () => {
      interface ReadonlyData {
        readonly values: readonly number[];
      }

      type MutableData = DeepMutable<ReadonlyData>;

      const data: MutableData = {
        values: [1, 2, 3]
      };

      data.values.push(4); // Should compile (mutable)
      expect(data.values).toHaveLength(4);
    });
  });

  describe('Conditional Type Helpers', () => {
    it('If type should select correct branch', () => {
      type True = If<true, 'yes', 'no'>; // 'yes'
      type False = If<false, 'yes', 'no'>; // 'no'

      const trueVal: True = 'yes';
      const falseVal: False = 'no';

      expect(trueVal).toBe('yes');
      expect(falseVal).toBe('no');
    });

    it('Switch type should match cases', () => {
      type Status = 'idle' | 'loading' | 'success' | 'error';
      type Message<S extends Status> = Switch<S, [
        ['idle', 'Ready'],
        ['loading', 'Loading...'],
        ['success', 'Done!'],
        ['error', 'Failed']
      ]>;

      const idle: Message<'idle'> = 'Ready';
      const loading: Message<'loading'> = 'Loading...';

      expect(idle).toBe('Ready');
      expect(loading).toBe('Loading...');
    });

    it('logical operators should work correctly', () => {
      type NotTrue = Not<true>; // false
      type AndTrue = And<true, true>; // true
      type OrFalse = Or<false, false>; // false

      const notTrue: NotTrue = false;
      const andTrue: AndTrue = true;
      const orFalse: OrFalse = false;

      expect(notTrue).toBe(false);
      expect(andTrue).toBe(true);
      expect(orFalse).toBe(false);
    });
  });

  describe('Type Extraction Utilities', () => {
    it('should extract function parameters', () => {
      function greet(name: string, age: number): void {
        console.log(name, age);
      }

      type GreetParams = Params<typeof greet>;

      const params: GreetParams = ['Alice', 30];
      expect(params).toEqual(['Alice', 30]);
    });

    it('should extract first and last parameters', () => {
      function multi(a: string, b: number, c: boolean): void {
        console.log(a, b, c);
      }

      type First = FirstParam<typeof multi>;
      type Last = LastParam<typeof multi>;

      const first: First = 'test';
      const last: Last = true;

      expect(first).toBe('test');
      expect(last).toBe(true);
    });

    it('should extract async function return type', async () => {
      async function getUser(): Promise<{ id: number; name: string }> {
        return { id: 1, name: 'Alice' };
      }

      type User = AsyncResult<typeof getUser>;

      const user: User = { id: 1, name: 'Alice' };
      expect(user.id).toBe(1);
      expect(user.name).toBe('Alice');
    });

    it('should work with class constructors', () => {
      class TestClass {
        value: string;
        constructor(value: string) {
          this.value = value;
        }
      }

      type Instance = InstanceOf<typeof TestClass>;
      type Params = ConstructorParams<typeof TestClass>;

      const instance: Instance = new TestClass('test');
      const params: Params = ['test'];

      expect(instance.value).toBe('test');
      expect(params).toEqual(['test']);
    });
  });

  describe('Promise and Async Utilities', () => {
    it('should extract Promise value type', () => {
      type Value = PromiseValue<Promise<string>>;

      const value: Value = 'hello';
      expect(value).toBe('hello');
    });

    it('should unwrap nested Promises', () => {
      type Unwrapped = UnwrapPromise<Promise<Promise<number>>>;

      const value: Unwrapped = 42;
      expect(value).toBe(42);
    });

    it('should create async function signatures', () => {
      function syncFn(x: number): string {
        return x.toString();
      }

      type AsyncFn = PromisifyReturnType<typeof syncFn>;

      // Type-level test only
      const _asyncFn: AsyncFn = async (x: number) => x.toString();
      expect(true).toBe(true);
    });
  });

  describe('Generic Constraint Helpers', () => {
    it('IsNever should detect never type', () => {
      type Test1 = IsNever<never>; // true
      type Test2 = IsNever<string>; // false

      const test1: Test1 = true;
      const test2: Test2 = false;

      expect(test1).toBe(true);
      expect(test2).toBe(false);
    });

    it('IsEqual should detect type equality', () => {
      type Equal = IsEqual<string, string>; // true
      type NotEqual = IsEqual<string, number>; // false

      const equal: Equal = true;
      const notEqual: NotEqual = false;

      expect(equal).toBe(true);
      expect(notEqual).toBe(false);
    });

    it('IsArray should detect array types', () => {
      type Arr = IsArray<string[]>; // true
      type NotArr = IsArray<string>; // false

      const arr: Arr = true;
      const notArr: NotArr = false;

      expect(arr).toBe(true);
      expect(notArr).toBe(false);
    });

    it('IsTuple should detect tuple types', () => {
      type Tuple = IsTuple<[string, number]>; // true
      type NotTuple = IsTuple<string[]>; // false

      const tuple: Tuple = true;
      const notTuple: NotTuple = false;

      expect(tuple).toBe(true);
      expect(notTuple).toBe(false);
    });

    it('IsFunction should detect function types', () => {
      type Fn = IsFunction<() => void>; // true
      type NotFn = IsFunction<string>; // false

      const fn: Fn = true;
      const notFn: NotFn = false;

      expect(fn).toBe(true);
      expect(notFn).toBe(false);
    });

    it('IsObject should detect object types', () => {
      type Obj = IsObject<{ a: string }>; // true
      type NotObj = IsObject<string>; // false

      const obj: Obj = true;
      const notObj: NotObj = false;

      expect(obj).toBe(true);
      expect(notObj).toBe(false);
    });

    it('IsUnion should detect union types', () => {
      type Union = IsUnion<string | number>; // true
      type NotUnion = IsUnion<string>; // false

      const union: Union = true;
      const notUnion: NotUnion = false;

      expect(union).toBe(true);
      expect(notUnion).toBe(false);
    });

    it('IsNullable should detect nullable types', () => {
      type Nullable = IsNullable<string | null>; // true
      type NotNullable = IsNullable<string>; // false

      const nullable: Nullable = true;
      const notNullable: NotNullable = false;

      expect(nullable).toBe(true);
      expect(notNullable).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined correctly', () => {
      type NullPartial = DeepPartial<{ a: null }>;
      type UndefinedPartial = DeepPartial<{ a: undefined }>;

      const nullPartial: NullPartial = {};
      const undefinedPartial: UndefinedPartial = {};

      expect(nullPartial).toBeDefined();
      expect(undefinedPartial).toBeDefined();
    });

    it('should handle empty objects', () => {
      type EmptyPartial = DeepPartial<Record<string, never>>;

      const empty: EmptyPartial = {};
      expect(empty).toEqual({});
    });

    it('should handle arrays of arrays', () => {
      type NestedArrayPartial = DeepPartial<number[][]>;

      const nested: NestedArrayPartial = [[1, 2], [3]];
      expect(nested).toHaveLength(2);
    });

    it('should preserve primitives through transformations', () => {
      type StringPartial = DeepPartial<string>;
      type NumberRequired = DeepRequired<number>;
      type BooleanReadonly = DeepReadonly<boolean>;

      const str: StringPartial = 'test';
      const num: NumberRequired = 42;
      const bool: BooleanReadonly = true;

      expect(str).toBe('test');
      expect(num).toBe(42);
      expect(bool).toBe(true);
    });
  });

  describe('Complex Type Combinations', () => {
    it('should combine multiple utility types', () => {
      interface Config {
        db?: {
          host?: string;
          port?: number;
        };
      }

      // Make required, then readonly
      type FinalConfig = DeepReadonly<DeepRequired<Config>>;

      const config: FinalConfig = {
        db: {
          host: 'localhost',
          port: 5432
        }
      };

      expect(config.db.host).toBe('localhost');
    });

    it('should work with conditional types and constraints', () => {
      type CheckType<T> = And<
        IsObject<T>,
        Not<IsArray<T>>
      >;

      type ObjCheck = CheckType<{ a: string }>; // true
      type ArrCheck = CheckType<string[]>; // false

      const objCheck: ObjCheck = true;
      const arrCheck: ArrCheck = false;

      expect(objCheck).toBe(true);
      expect(arrCheck).toBe(false);
    });
  });
});

describe('Runtime Performance', () => {
  it('should handle deeply nested structures efficiently', () => {
    interface Deep {
      a: {
        b: {
          c: {
            d: {
              e: string;
            };
          };
        };
      };
    }

    type DeepP = DeepPartial<Deep>;

    const deep: DeepP = {
      a: {
        b: {
          c: {}
        }
      }
    };

    expect(deep.a?.b?.c).toBeDefined();
  });
});
