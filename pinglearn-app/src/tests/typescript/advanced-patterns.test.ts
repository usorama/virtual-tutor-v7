/**
 * Advanced TypeScript Patterns Tests
 *
 * Comprehensive test suite for validating advanced TypeScript patterns including
 * branded types, generic constraints, conditional types, and repository patterns.
 *
 * Built on: TS-008 advanced TypeScript infrastructure
 * Implements: TEST-003 TypeScript pattern validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Branded types
  UserId,
  SessionId,
  TextbookId,
  ChapterId,
  createUserId,
  createSessionId,
  createTextbookId,
  createChapterId,

  // Generic constraints
  Entity,

  // Conditional types
  DeepReadonly,
  DeepPartial,
  ArrayElement,
  PromiseValue,

  // Template literal types
  EventKey,
  StateKey,
  LoadingKey,
  CacheKey,
  ApiEndpoint,

  // Mapped types
  ValidationErrors,
  FormState,
  Optional,
  RequiredFields,
  Nullable,

  // Type guards
  isEntity,
  isArray,
  isNotNull,
  assertType
} from '../../types/advanced';
import { BaseRepository, RepositoryError } from '../../lib/services/repository-base';

describe('Advanced TypeScript Patterns', () => {
  describe('Branded Types', () => {
    it('should create and validate branded user IDs', () => {
      // Valid user ID creation
      const userId = createUserId('user-12345');
      expect(userId).toBe('user-12345');

      // Should have branded type (compile-time check)
      const verifyUserIdType = (id: UserId): string => id;
      expect(verifyUserIdType(userId)).toBe('user-12345');

      // Invalid user ID should throw
      expect(() => createUserId('')).toThrow('Invalid user ID');
      expect(() => createUserId('ab')).toThrow('Invalid user ID');
    });

    it('should create and validate branded session IDs', () => {
      const sessionId = createSessionId('session-abc123_def');
      expect(sessionId).toBe('session-abc123_def');

      // Invalid session ID should throw
      expect(() => createSessionId('')).toThrow('Invalid session ID');
      expect(() => createSessionId('session with spaces')).toThrow('Invalid session ID');
      expect(() => createSessionId('session@invalid')).toThrow('Invalid session ID');
    });

    it('should create and validate branded textbook IDs', () => {
      const textbookId = createTextbookId('textbook_math_grade10');
      expect(textbookId).toBe('textbook_math_grade10');

      // Invalid textbook ID should throw
      expect(() => createTextbookId('math_grade10')).toThrow('Invalid textbook ID');
      expect(() => createTextbookId('')).toThrow('Invalid textbook ID');
    });

    it('should create and validate branded chapter IDs', () => {
      const chapterId = createChapterId('textbook_math_ch_01');
      expect(chapterId).toBe('textbook_math_ch_01');

      // Invalid chapter ID should throw
      expect(() => createChapterId('textbook_math_01')).toThrow('Invalid chapter ID');
      expect(() => createChapterId('')).toThrow('Invalid chapter ID');
    });

    it('should prevent ID type confusion at compile time', () => {
      const userId = createUserId('user-123');
      const textbookId = createTextbookId('textbook_math');

      // This function should only accept UserId
      const getUserData = (id: UserId): string => `User: ${id}`;

      // This should work
      expect(getUserData(userId)).toBe('User: user-123');

      // Verify runtime types are still strings
      expect(typeof userId).toBe('string');
      expect(typeof textbookId).toBe('string');
    });
  });

  describe('Generic Repository Pattern', () => {
    interface TestUser extends Entity {
      email: string;
      full_name: string;
      role: 'student' | 'teacher' | 'admin';
      last_login_at?: string;
      deleted_at?: string;
    }

    class MockTestRepository extends BaseRepository<TestUser> {
      private mockData: Map<string, TestUser> = new Map();
      private nextId = 1;

      constructor() {
        super('test_users');
      }

      protected async executeQuery<TResult>(query: any): Promise<TResult> {
        // Mock query execution
        switch (query.operation) {
          case 'SELECT':
            if (query.where?.id) {
              return this.mockData.get(query.where.id) as TResult;
            }
            return Array.from(this.mockData.values()) as TResult;

          case 'INSERT':
            const newId = `user-${this.nextId++}`;
            const newUser: TestUser = {
              id: newId,
              ...query.data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            this.mockData.set(newId, newUser);
            return newUser as TResult;

          case 'UPDATE':
            const existingUser = this.mockData.get(query.where.id);
            if (existingUser) {
              const updatedUser = { ...existingUser, ...query.data };
              this.mockData.set(query.where.id, updatedUser);
              return updatedUser as TResult;
            }
            return null as TResult;

          case 'DELETE':
            const deleted = this.mockData.delete(query.where.id);
            return { affectedRows: deleted ? 1 : 0 } as TResult;

          case 'COUNT':
            return { count: this.mockData.size } as TResult;

          default:
            throw new Error(`Unsupported operation: ${query.operation}`);
        }
      }

      protected buildSelectQuery(where?: any, select?: string[], options?: any): any {
        return { operation: 'SELECT', where, select, options };
      }

      protected buildInsertQuery(data: any): any {
        return { operation: 'INSERT', data };
      }

      protected buildUpdateQuery(id: any, data: any): any {
        return { operation: 'UPDATE', where: { id }, data };
      }

      protected buildDeleteQuery(id: any): any {
        return { operation: 'DELETE', where: { id } };
      }

      protected buildBatchInsertQuery(items: any[]): any {
        return { operation: 'BATCH_INSERT', items };
      }

      protected buildCountQuery(where?: any): any {
        return { operation: 'COUNT', where };
      }

      // Override validation for testing
      protected async validateEntity(data: Partial<TestUser>, operation: 'create' | 'update' = 'create'): Promise<void> {
        if (operation === 'create') {
          if (!data.email) {
            throw new RepositoryError('Email is required', 'VALIDATION_ERROR');
          }
          if (!data.full_name) {
            throw new RepositoryError('Full name is required', 'VALIDATION_ERROR');
          }
        }

        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          throw new RepositoryError('Invalid email format', 'VALIDATION_ERROR');
        }

        if (data.role && !['student', 'teacher', 'admin'].includes(data.role)) {
          throw new RepositoryError('Invalid role', 'VALIDATION_ERROR');
        }
      }
    }

    let repository: MockTestRepository;

    beforeEach(() => {
      repository = new MockTestRepository();
    });

    it('should create entities with proper type constraints', async () => {
      const userData = {
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'student' as const
      };

      const user = await repository.create(userData);

      expect(user.id).toBeTruthy();
      expect(user.email).toBe('test@example.com');
      expect(user.full_name).toBe('Test User');
      expect(user.role).toBe('student');
      expect(user.created_at).toBeTruthy();
      expect(user.updated_at).toBeTruthy();
    });

    it('should enforce validation constraints', async () => {
      // Missing required fields
      await expect(repository.create({
        full_name: 'Test User',
        role: 'student'
      } as any)).rejects.toThrow('Email is required');

      // Invalid email format
      await expect(repository.create({
        email: 'invalid-email',
        full_name: 'Test User',
        role: 'student'
      })).rejects.toThrow('Invalid email format');

      // Invalid role
      await expect(repository.create({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'invalid_role'
      } as any)).rejects.toThrow('Invalid role');
    });

    it('should support selective field queries with type safety', async () => {
      // Create a test user
      const user = await repository.create({
        email: 'selective@example.com',
        full_name: 'Selective Test',
        role: 'teacher'
      });

      // Query with selective fields
      const partialUser = await repository.findById(user.id, ['email', 'full_name'] as const);

      expect(partialUser).toBeTruthy();
      expect(partialUser!.id).toBeTruthy(); // ID is always included
      expect(partialUser!.email).toBe('selective@example.com');
      expect(partialUser!.full_name).toBe('Selective Test');
    });

    it('should support complex queries with filtering', async () => {
      // Create multiple users
      await repository.create({
        email: 'student1@example.com',
        full_name: 'Student One',
        role: 'student'
      });

      await repository.create({
        email: 'teacher1@example.com',
        full_name: 'Teacher One',
        role: 'teacher'
      });

      // Query with filtering
      const students = await repository.findMany({
        where: { role: 'student' },
        select: ['email', 'role'] as const,
        limit: 10
      });

      expect(students.length).toBeGreaterThan(0);
      students.forEach(student => {
        expect(student.role).toBe('student');
        expect(student.email).toBeTruthy();
        expect(student.id).toBeTruthy(); // Always included
      });
    });

    it('should handle batch operations efficiently', async () => {
      const users = [
        { email: 'batch1@example.com', full_name: 'Batch User 1', role: 'student' as const },
        { email: 'batch2@example.com', full_name: 'Batch User 2', role: 'teacher' as const },
        { email: 'batch3@example.com', full_name: 'Batch User 3', role: 'admin' as const }
      ];

      const created = await repository.batchCreate(users);

      expect(created.length).toBe(3);
      created.forEach((user, index) => {
        expect(user.email).toBe(users[index].email);
        expect(user.full_name).toBe(users[index].full_name);
        expect(user.role).toBe(users[index].role);
      });
    });

    it('should support soft delete operations', async () => {
      const user = await repository.create({
        email: 'soft-delete@example.com',
        full_name: 'Soft Delete User',
        role: 'student'
      });

      // Soft delete
      const softDeleted = await repository.softDelete(user.id);
      expect(softDeleted).toBe(true);

      // Verify soft delete
      const deletedUser = await repository.findById(user.id);
      expect(deletedUser?.deleted_at).toBeTruthy();

      // Restore
      const restored = await repository.restore(user.id);
      expect(restored).toBe(true);

      // Verify restoration
      const restoredUser = await repository.findById(user.id);
      expect(restoredUser?.deleted_at).toBeNull();
    });
  });

  describe('Conditional Types', () => {
    it('should create deep readonly types', () => {
      interface NestedData {
        user: {
          id: string;
          profile: {
            name: string;
            settings: {
              theme: string;
            };
          };
        };
      }

      type ReadonlyData = DeepReadonly<NestedData>;

      const data: ReadonlyData = {
        user: {
          id: 'user-123',
          profile: {
            name: 'Test User',
            settings: {
              theme: 'dark'
            }
          }
        }
      };

      expect(data.user.id).toBe('user-123');
      expect(data.user.profile.name).toBe('Test User');
      expect(data.user.profile.settings.theme).toBe('dark');
    });

    it('should create deep partial types', () => {
      interface FullUser {
        id: string;
        profile: {
          name: string;
          email: string;
          settings: {
            theme: string;
            notifications: boolean;
          };
        };
      }

      type PartialUser = DeepPartial<FullUser>;

      // All fields should be optional, including nested ones
      const partialUser: PartialUser = {
        profile: {
          settings: {
            theme: 'dark'
            // notifications omitted - should be fine
          }
          // name and email omitted - should be fine
        }
        // id omitted - should be fine
      };

      expect(partialUser.profile?.settings?.theme).toBe('dark');
    });

    it('should extract array element types', () => {
      const users = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' }
      ];

      type UserElement = ArrayElement<typeof users>;

      const singleUser: UserElement = { id: 'user-3', name: 'User 3' };

      expect(singleUser.id).toBe('user-3');
      expect(singleUser.name).toBe('User 3');
    });

    it('should extract promise value types', () => {
      const userPromise = Promise.resolve({
        id: 'user-123',
        email: 'test@example.com'
      });

      type UserType = PromiseValue<typeof userPromise>;

      const user: UserType = {
        id: 'user-456',
        email: 'another@example.com'
      };

      expect(user.id).toBe('user-456');
      expect(user.email).toBe('another@example.com');
    });
  });

  describe('Template Literal Types', () => {
    it('should generate event keys correctly', () => {
      type ClickEvent = EventKey<'click'>;
      type SubmitEvent = EventKey<'submit'>;
      type ChangeEvent = EventKey<'change'>;

      const clickHandler: ClickEvent = 'onClick';
      const submitHandler: SubmitEvent = 'onSubmit';
      const changeHandler: ChangeEvent = 'onChange';

      expect(clickHandler).toBe('onClick');
      expect(submitHandler).toBe('onSubmit');
      expect(changeHandler).toBe('onChange');
    });

    it('should generate state keys correctly', () => {
      type UserState = StateKey<'user'>;
      type LoadingState = StateKey<'loading'>;

      const userState: UserState = 'userState';
      const loadingState: LoadingState = 'loadingState';

      expect(userState).toBe('userState');
      expect(loadingState).toBe('loadingState');
    });

    it('should generate loading keys correctly', () => {
      type UserLoading = LoadingKey<'user'>;
      type DataLoading = LoadingKey<'data'>;

      const userLoading: UserLoading = 'isUserLoading';
      const dataLoading: DataLoading = 'isDataLoading';

      expect(userLoading).toBe('isUserLoading');
      expect(dataLoading).toBe('isDataLoading');
    });

    it('should generate cache keys correctly', () => {
      type UserCache = CacheKey<'user'>;
      type ApiCache = CacheKey<'api/data'>;

      const userCache: UserCache = 'cache:user';
      const apiCache: ApiCache = 'cache:api/data';

      expect(userCache).toBe('cache:user');
      expect(apiCache).toBe('cache:api/data');
    });

    it('should generate API endpoints correctly', () => {
      type UsersEndpoint = ApiEndpoint<'users'>;
      type TextbooksEndpoint = ApiEndpoint<'textbooks'>;

      const usersEndpoint: UsersEndpoint = '/api/users';
      const textbooksEndpoint: TextbooksEndpoint = '/api/textbooks';

      expect(usersEndpoint).toBe('/api/users');
      expect(textbooksEndpoint).toBe('/api/textbooks');
    });
  });

  describe('Mapped Types', () => {
    it('should create validation error types correctly', () => {
      interface UserForm {
        name: string;
        email: string;
        age: number;
        preferences: {
          newsletter: boolean;
          theme: string;
        };
      }

      type UserFormErrors = ValidationErrors<UserForm>;

      const errors: UserFormErrors = {
        name: 'Name is required',
        email: 'Invalid email format',
        age: null, // No error
        preferences: {
          newsletter: null, // No error
          theme: 'Invalid theme selected'
        }
      };

      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Invalid email format');
      expect(errors.age).toBeNull();
      expect(errors.preferences?.newsletter).toBeNull();
      expect(errors.preferences?.theme).toBe('Invalid theme selected');
    });

    it('should create form state correctly', () => {
      interface LoginForm {
        email: string;
        password: string;
      }

      const formState: FormState<LoginForm> = {
        values: {
          email: 'test@example.com',
          password: 'password123'
        },
        errors: {
          email: null,
          password: 'Password too weak'
        },
        touched: {
          email: true,
          password: true
        },
        isSubmitting: false,
        isValid: false,
        isDirty: true
      };

      expect(formState.values.email).toBe('test@example.com');
      expect(formState.errors.password).toBe('Password too weak');
      expect(formState.touched.email).toBe(true);
      expect(formState.isValid).toBe(false);
    });

    it('should create optional fields correctly', () => {
      interface User {
        id: string;
        name: string;
        email: string;
        avatar?: string;
      }

      type UserWithOptionalEmail = Optional<User, 'email'>;

      const user: UserWithOptionalEmail = {
        id: 'user-123',
        name: 'Test User'
        // email is now optional
      };

      expect(user.id).toBe('user-123');
      expect(user.name).toBe('Test User');
      expect(user.email).toBeUndefined();
    });

    it('should create required fields correctly', () => {
      interface User {
        id: string;
        name: string;
        email?: string;
        avatar?: string;
      }

      type UserWithRequiredFields = RequiredFields<User, 'email' | 'avatar'>;

      const user: UserWithRequiredFields = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com', // Now required
        avatar: 'avatar.jpg' // Now required
      };

      expect(user.email).toBe('test@example.com');
      expect(user.avatar).toBe('avatar.jpg');
    });

    it('should create nullable types correctly', () => {
      interface User {
        id: string;
        name: string;
        email: string;
      }

      type NullableUser = Nullable<User>;

      const user: NullableUser = {
        id: 'user-123',
        name: null, // Can be null
        email: 'test@example.com'
      };

      expect(user.id).toBe('user-123');
      expect(user.name).toBeNull();
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Type Guards and Utilities', () => {
    it('should validate entity objects correctly', () => {
      const validEntity = { id: 'entity-123', name: 'Test Entity' };
      const invalidEntity = { name: 'No ID Entity' };
      const nullValue = null;

      expect(isEntity(validEntity)).toBe(true);
      expect(isEntity(invalidEntity)).toBe(false);
      expect(isEntity(nullValue)).toBe(false);
      expect(isEntity('string')).toBe(false);
    });

    it('should validate arrays correctly', () => {
      const validArray = [1, 2, 3];
      const emptyArray: number[] = [];
      const notArray = 'not an array';

      expect(isArray(validArray)).toBe(true);
      expect(isArray(emptyArray)).toBe(true);
      expect(isArray(notArray)).toBe(false);
      expect(isArray(null)).toBe(false);
    });

    it('should validate non-null values correctly', () => {
      const validValue = 'test';
      const nullValue = null;
      const undefinedValue = undefined;
      const zeroValue = 0;
      const falseValue = false;

      expect(isNotNull(validValue)).toBe(true);
      expect(isNotNull(zeroValue)).toBe(true);
      expect(isNotNull(falseValue)).toBe(true);
      expect(isNotNull(nullValue)).toBe(false);
      expect(isNotNull(undefinedValue)).toBe(false);
    });

    it('should assert types correctly', () => {
      const isString = (value: unknown): value is string => typeof value === 'string';

      const validString = 'test';
      const invalidString = 123;

      // Should not throw for valid type
      expect(() => assertType(validString, isString)).not.toThrow();

      // Should throw for invalid type
      expect(() => assertType(invalidString, isString)).toThrow('Type assertion failed');

      // Should throw with custom message
      expect(() => assertType(invalidString, isString, 'Must be a string')).toThrow('Must be a string');
    });
  });

  describe('Performance and Type Checking', () => {
    it('should handle large type operations efficiently', () => {
      // Create a large interface to test type performance
      interface LargeEntity extends Entity {
        field1: string;
        field2: string;
        field3: string;
        field4: string;
        field5: string;
        nested: {
          subField1: string;
          subField2: number;
          subField3: boolean;
          deepNested: {
            value1: string;
            value2: number;
          };
        };
      }

      type ReadonlyLarge = DeepReadonly<LargeEntity>;
      type PartialLarge = DeepPartial<LargeEntity>;

      const startTime = Date.now();

      const readonlyEntity: ReadonlyLarge = {
        id: 'large-entity',
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
        field4: 'value4',
        field5: 'value5',
        nested: {
          subField1: 'sub1',
          subField2: 42,
          subField3: true,
          deepNested: {
            value1: 'deep1',
            value2: 100
          }
        }
      };

      const partialEntity: PartialLarge = {
        id: 'partial-entity',
        nested: {
          deepNested: {
            value1: 'partial-deep'
          }
        }
      };

      const endTime = Date.now();

      // Type operations should be near-instantaneous at runtime
      expect(endTime - startTime).toBeLessThan(10);
      expect(readonlyEntity.nested.deepNested.value1).toBe('deep1');
      expect(partialEntity.nested?.deepNested?.value1).toBe('partial-deep');
    });

    it('should maintain type safety across complex operations', () => {
      interface ComplexUser extends Entity {
        profile: {
          personal: {
            firstName: string;
            lastName: string;
          };
          contact: {
            email: string;
            phone?: string;
          };
        };
        preferences: {
          theme: 'light' | 'dark';
          notifications: boolean;
        };
      }

      type ValidationErrors = ValidationErrors<ComplexUser>;
      type FormState = FormState<ComplexUser>;

      const complexFormState: FormState = {
        values: {
          id: 'user-complex',
          profile: {
            personal: {
              firstName: 'John',
              lastName: 'Doe'
            },
            contact: {
              email: 'john@example.com'
            }
          },
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        errors: {
          profile: {
            contact: {
              email: 'Invalid email format'
            }
          }
        },
        touched: {
          profile: {
            contact: {
              email: true
            }
          }
        },
        isSubmitting: false,
        isValid: false,
        isDirty: true
      };

      expect(complexFormState.values.profile.personal.firstName).toBe('John');
      expect(complexFormState.errors.profile?.contact?.email).toBe('Invalid email format');
      expect(complexFormState.touched.profile?.contact?.email).toBe(true);
    });
  });
});