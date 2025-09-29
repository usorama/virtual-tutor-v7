/**
 * Performance Tests for Type-Heavy Operations
 *
 * Comprehensive performance testing for TypeScript-heavy operations including
 * type checking, complex generic computations, and large data transformations.
 *
 * Built on: TS-008 advanced TypeScript patterns + Security infrastructure
 * Implements: TEST-003 performance testing requirements
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  // Advanced types for testing
  DeepReadonly,
  DeepPartial,
  ValidationErrors,
  FormState,
  Entity,

  // Branded types
  UserId,
  TextbookId,
  ChapterId,
  createUserId,
  createTextbookId,
  createChapterId,

  // Type guards
  isEntity,
  isArray,
  isNotNull,
  assertType
} from '../../types/advanced';
import { BaseRepository } from '../../lib/services/repository-base';
import {
  SecurityError,
  SecurityErrorCode,
  ThreatAssessment
} from '../../lib/security/security-error-types';

interface PerformanceMetrics {
  operationName: string;
  executionTime: number;
  memoryUsage: {
    before: number;
    after: number;
    delta: number;
  };
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

interface PerformanceBenchmark {
  name: string;
  target: number; // Maximum acceptable time in ms
  iterations: number;
  setup?: () => Promise<void>;
  operation: () => Promise<any> | any;
  cleanup?: () => Promise<void>;
  validateResult?: (result: any) => boolean;
}

class PerformanceTestRunner {
  private metrics: PerformanceMetrics[] = [];

  async runBenchmark(benchmark: PerformanceBenchmark): Promise<PerformanceMetrics> {
    console.log(`🚀 Running benchmark: ${benchmark.name}`);

    // Setup
    if (benchmark.setup) {
      await benchmark.setup();
    }

    const times: number[] = [];
    let result: any;

    // Memory measurement
    const initialMemory = this.getMemoryUsage();

    // Warm-up run
    await this.executeOperation(benchmark.operation);

    // Benchmark runs
    for (let i = 0; i < benchmark.iterations; i++) {
      const startTime = performance.now();
      result = await this.executeOperation(benchmark.operation);
      const endTime = performance.now();

      times.push(endTime - startTime);
    }

    const finalMemory = this.getMemoryUsage();

    // Calculate statistics
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const metrics: PerformanceMetrics = {
      operationName: benchmark.name,
      executionTime: totalTime,
      memoryUsage: {
        before: initialMemory,
        after: finalMemory,
        delta: finalMemory - initialMemory
      },
      iterations: benchmark.iterations,
      averageTime,
      minTime,
      maxTime
    };

    // Validate result if validator provided
    if (benchmark.validateResult && !benchmark.validateResult(result)) {
      throw new Error(`Benchmark ${benchmark.name} failed validation`);
    }

    // Check performance target
    if (averageTime > benchmark.target) {
      console.warn(`⚠️  Performance target exceeded: ${averageTime.toFixed(2)}ms > ${benchmark.target}ms`);
    } else {
      console.log(`✅ Performance target met: ${averageTime.toFixed(2)}ms <= ${benchmark.target}ms`);
    }

    // Cleanup
    if (benchmark.cleanup) {
      await benchmark.cleanup();
    }

    this.metrics.push(metrics);
    return metrics;
  }

  private async executeOperation(operation: () => Promise<any> | any): Promise<any> {
    return await operation();
  }

  private getMemoryUsage(): number {
    // In Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }

    // In browser environment (approximation)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }

    return 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  generateReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics available';
    }

    const report = [
      '📊 Performance Test Report',
      '=' .repeat(50),
      ''
    ];

    for (const metric of this.metrics) {
      report.push(`Operation: ${metric.operationName}`);
      report.push(`  Average Time: ${metric.averageTime.toFixed(2)}ms`);
      report.push(`  Min Time: ${metric.minTime.toFixed(2)}ms`);
      report.push(`  Max Time: ${metric.maxTime.toFixed(2)}ms`);
      report.push(`  Memory Delta: ${(metric.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
      report.push(`  Iterations: ${metric.iterations}`);
      report.push('');
    }

    // Summary statistics
    const avgTimes = this.metrics.map(m => m.averageTime);
    const totalAvgTime = avgTimes.reduce((sum, time) => sum + time, 0) / avgTimes.length;
    const maxAvgTime = Math.max(...avgTimes);

    report.push('Summary:');
    report.push(`  Overall Average: ${totalAvgTime.toFixed(2)}ms`);
    report.push(`  Slowest Operation: ${maxAvgTime.toFixed(2)}ms`);
    report.push(`  Total Operations: ${this.metrics.length}`);

    return report.join('\n');
  }

  reset(): void {
    this.metrics = [];
  }
}

describe('Performance Tests for Type-Heavy Operations', () => {
  let performanceRunner: PerformanceTestRunner;

  beforeEach(() => {
    performanceRunner = new PerformanceTestRunner();
  });

  afterEach(() => {
    // Log performance report
    const report = performanceRunner.generateReport();
    if (report !== 'No performance metrics available') {
      console.log('\n' + report);
    }
  });

  describe('TypeScript Type System Performance', () => {
    it('should handle large branded type operations efficiently', async () => {
      const benchmark: PerformanceBenchmark = {
        name: 'Branded Type Creation and Validation',
        target: 50, // 50ms target
        iterations: 1000,
        operation: () => {
          const userIds: UserId[] = [];
          const textbookIds: TextbookId[] = [];
          const chapterIds: ChapterId[] = [];

          // Create many branded types
          for (let i = 0; i < 100; i++) {
            userIds.push(createUserId(`user-${i}`));
            textbookIds.push(createTextbookId(`textbook_subject_${i}`));
            chapterIds.push(createChapterId(`textbook_ch_${i}`));
          }

          // Validate type guards
          const isValidUser = (id: unknown): id is UserId => {
            return typeof id === 'string' && id.startsWith('user-');
          };

          userIds.forEach(id => {
            if (!isValidUser(id)) {
              throw new Error('Invalid user ID type');
            }
          });

          return { userIds, textbookIds, chapterIds };
        },
        validateResult: (result) => {
          return result.userIds.length === 100 &&
                 result.textbookIds.length === 100 &&
                 result.chapterIds.length === 100;
        }
      };

      const metrics = await performanceRunner.runBenchmark(benchmark);
      expect(metrics.averageTime).toBeLessThan(50);
    });

    it('should handle complex conditional type resolution efficiently', async () => {
      interface ComplexData {
        users: Array<{
          id: string;
          profile: {
            personal: {
              firstName: string;
              lastName: string;
              age: number;
            };
            preferences: {
              theme: 'light' | 'dark';
              notifications: {
                email: boolean;
                push: boolean;
                sms: boolean;
              };
            };
          };
          metadata: {
            createdAt: string;
            updatedAt: string;
            version: number;
          };
        }>;
        settings: {
          global: Record<string, unknown>;
          user: Record<string, unknown>;
        };
      }

      const benchmark: PerformanceBenchmark = {
        name: 'Complex Conditional Type Operations',
        target: 100, // 100ms target
        iterations: 500,
        operation: () => {
          // Create deeply nested readonly type
          type ReadonlyComplexData = DeepReadonly<ComplexData>;

          // Create deeply nested partial type
          type PartialComplexData = DeepPartial<ComplexData>;

          // Create validation errors type
          type ComplexDataErrors = ValidationErrors<ComplexData>;

          // Mock data operations
          const complexData: ComplexData = {
            users: Array.from({ length: 50 }, (_, i) => ({
              id: `user-${i}`,
              profile: {
                personal: {
                  firstName: `First${i}`,
                  lastName: `Last${i}`,
                  age: 20 + (i % 50)
                },
                preferences: {
                  theme: i % 2 === 0 ? 'light' : 'dark',
                  notifications: {
                    email: true,
                    push: i % 3 === 0,
                    sms: false
                  }
                }
              },
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1
              }
            })),
            settings: {
              global: { theme: 'light', language: 'en' },
              user: { customTheme: 'blue' }
            }
          };

          // Type transformations
          const readonlyData: ReadonlyComplexData = complexData;
          const partialData: PartialComplexData = {
            users: complexData.users.slice(0, 10),
            settings: { global: { theme: 'dark' } }
          };

          const errors: ComplexDataErrors = {
            users: complexData.users.map(() => ({
              profile: {
                personal: {
                  firstName: null,
                  lastName: 'Invalid name',
                  age: null
                }
              }
            })),
            settings: null
          };

          return { readonlyData, partialData, errors };
        },
        validateResult: (result) => {
          return result.readonlyData.users.length === 50 &&
                 result.partialData.users?.length === 10 &&
                 Array.isArray(result.errors.users);
        }
      };

      const metrics = await performanceRunner.runBenchmark(benchmark);
      expect(metrics.averageTime).toBeLessThan(100);
    });
  });

  describe('Security Operation Performance', () => {
    it('should handle security threat detection efficiently', async () => {
      const benchmark: PerformanceBenchmark = {
        name: 'Security Threat Detection',
        target: 100, // 100ms target
        iterations: 200,
        operation: () => {
          // Create multiple security errors
          const securityErrors: SecurityError[] = Array.from({ length: 50 }, (_, i) => ({
            code: 'SECURITY_ERROR',
            message: `Security threat ${i}`,
            severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4] as any,
            timestamp: new Date().toISOString(),
            correlationId: `correlation-${i}`,
            requestId: `request-${i}`,
            userId: `user-${i}`,
            securityCode: [
              SecurityErrorCode.AUTHENTICATION_FAILED,
              SecurityErrorCode.BRUTE_FORCE_DETECTED,
              SecurityErrorCode.SQL_INJECTION_ATTEMPT,
              SecurityErrorCode.XSS_ATTEMPT
            ][i % 4],
            threatLevel: ['suspicious', 'moderate', 'high', 'critical'][i % 4] as any,
            clientIP: `192.168.1.${i % 255}`,
            userAgent: `TestAgent-${i}`,
            sessionId: `session-${i}`,
            attemptCount: i % 10 + 1,
            metadata: {
              endpoint: `/api/endpoint-${i}`,
              method: 'POST',
              payload: { testData: i },
              headers: { 'User-Agent': `TestAgent-${i}` },
              timestamp: new Date().toISOString(),
              riskScore: (i % 100),
              confidence: 0.5 + (i % 50) / 100,
              attackVector: ['web', 'api'],
              mitreTactics: [`T${1000 + i % 200}`]
            },
            relatedIncidents: [],
            mitigationActions: []
          }));

          // Simulate threat assessment processing
          const assessments: ThreatAssessment[] = securityErrors.map(error => {
            const riskScore = error.metadata.riskScore;
            const level = riskScore >= 80 ? 'critical' :
                         riskScore >= 60 ? 'high' :
                         riskScore >= 40 ? 'moderate' : 'suspicious';

            return {
              level: level as any,
              action: level === 'critical' ? 'permanent_block' :
                     level === 'high' ? 'temporary_block' :
                     level === 'moderate' ? 'rate_limit' : 'monitor',
              reason: `Threat level: ${level}`,
              confidence: error.metadata.confidence,
              autoBlock: level === 'critical' || level === 'high',
              requiresManualReview: level === 'critical',
              recommendedActions: [
                'Monitor user behavior',
                'Review security policies'
              ],
              riskScore
            };
          });

          return {
            errorsProcessed: securityErrors.length,
            assessmentsGenerated: assessments.length,
            criticalThreats: assessments.filter(a => a.level === 'critical').length
          };
        },
        validateResult: (result) => {
          return result.errorsProcessed === 50 &&
                 result.assessmentsGenerated === 50;
        }
      };

      const metrics = await performanceRunner.runBenchmark(benchmark);
      expect(metrics.averageTime).toBeLessThan(100);
    });
  });

  describe('Large Data Structure Operations', () => {
    it('should handle complex form validation efficiently', async () => {
      interface ComplexForm {
        personalInfo: {
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          dateOfBirth: string;
          address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
          };
        };
        preferences: {
          notifications: {
            email: boolean;
            sms: boolean;
            push: boolean;
          };
          privacy: {
            profileVisible: boolean;
            dataSharing: boolean;
            analytics: boolean;
          };
          display: {
            theme: 'light' | 'dark' | 'auto';
            language: string;
            timezone: string;
          };
        };
        educationHistory: Array<{
          institution: string;
          degree: string;
          field: string;
          startDate: string;
          endDate?: string;
          gpa?: number;
        }>;
        workExperience: Array<{
          company: string;
          position: string;
          startDate: string;
          endDate?: string;
          description: string;
          skills: string[];
        }>;
      }

      const benchmark: PerformanceBenchmark = {
        name: 'Complex Form Validation',
        target: 80, // 80ms target
        iterations: 200,
        operation: () => {
          // Create form data
          const formData: ComplexForm = {
            personalInfo: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              phone: '+1-555-123-4567',
              dateOfBirth: '1990-01-01',
              address: {
                street: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                zipCode: '12345',
                country: 'USA'
              }
            },
            preferences: {
              notifications: {
                email: true,
                sms: false,
                push: true
              },
              privacy: {
                profileVisible: true,
                dataSharing: false,
                analytics: true
              },
              display: {
                theme: 'dark',
                language: 'en',
                timezone: 'America/Los_Angeles'
              }
            },
            educationHistory: Array.from({ length: 3 }, (_, i) => ({
              institution: `University ${i + 1}`,
              degree: ['Bachelor', 'Master', 'PhD'][i % 3],
              field: ['Computer Science', 'Engineering', 'Mathematics'][i % 3],
              startDate: `${2010 + i * 2}-09-01`,
              endDate: `${2014 + i * 2}-05-01`,
              gpa: 3.0 + (i * 0.3)
            })),
            workExperience: Array.from({ length: 5 }, (_, i) => ({
              company: `Company ${i + 1}`,
              position: `Position ${i + 1}`,
              startDate: `${2015 + i}-01-01`,
              endDate: i < 4 ? `${2016 + i}-12-31` : undefined,
              description: `Job description for position ${i + 1}`,
              skills: [`Skill ${i * 2 + 1}`, `Skill ${i * 2 + 2}`]
            }))
          };

          // Create validation errors type
          type FormErrors = ValidationErrors<ComplexForm>;

          // Validation logic
          const validateEmail = (email: string): string | null => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email) ? null : 'Invalid email format';
          };

          const validatePhone = (phone: string): string | null => {
            const phoneRegex = /^\+?1?-?\d{3}-?\d{3}-?\d{4}$/;
            return phoneRegex.test(phone) ? null : 'Invalid phone format';
          };

          const validateDate = (date: string): string | null => {
            const dateObj = new Date(date);
            return !isNaN(dateObj.getTime()) ? null : 'Invalid date';
          };

          const validateZipCode = (zipCode: string): string | null => {
            const zipRegex = /^\d{5}(-\d{4})?$/;
            return zipRegex.test(zipCode) ? null : 'Invalid ZIP code';
          };

          // Perform validation
          const errors: FormErrors = {
            personalInfo: {
              firstName: formData.personalInfo.firstName.length < 2 ? 'Too short' : null,
              lastName: formData.personalInfo.lastName.length < 2 ? 'Too short' : null,
              email: validateEmail(formData.personalInfo.email),
              phone: validatePhone(formData.personalInfo.phone),
              dateOfBirth: validateDate(formData.personalInfo.dateOfBirth),
              address: {
                street: formData.personalInfo.address.street.length < 5 ? 'Too short' : null,
                city: formData.personalInfo.address.city.length < 2 ? 'Too short' : null,
                state: formData.personalInfo.address.state.length !== 2 ? 'Invalid state code' : null,
                zipCode: validateZipCode(formData.personalInfo.address.zipCode),
                country: formData.personalInfo.address.country.length < 2 ? 'Too short' : null
              }
            },
            preferences: null,
            educationHistory: formData.educationHistory.map(edu => ({
              institution: edu.institution.length < 3 ? 'Too short' : null,
              degree: null,
              field: edu.field.length < 3 ? 'Too short' : null,
              startDate: validateDate(edu.startDate),
              endDate: edu.endDate ? validateDate(edu.endDate) : null,
              gpa: edu.gpa && (edu.gpa < 0 || edu.gpa > 4) ? 'Invalid GPA' : null
            })),
            workExperience: formData.workExperience.map(work => ({
              company: work.company.length < 2 ? 'Too short' : null,
              position: work.position.length < 2 ? 'Too short' : null,
              startDate: validateDate(work.startDate),
              endDate: work.endDate ? validateDate(work.endDate) : null,
              description: work.description.length < 10 ? 'Too short' : null,
              skills: work.skills.length === 0 ? 'At least one skill required' : null
            }))
          };

          // Count validation errors
          const countErrors = (obj: any): number => {
            let count = 0;
            for (const key in obj) {
              const value = obj[key];
              if (value === null) continue;
              if (typeof value === 'string') count++;
              else if (Array.isArray(value)) count += value.reduce((sum, item) => sum + countErrors(item), 0);
              else if (typeof value === 'object') count += countErrors(value);
            }
            return count;
          };

          const errorCount = countErrors(errors);

          return {
            formData,
            errors,
            errorCount,
            validationsPassed: Object.keys(formData).length
          };
        },
        validateResult: (result) => {
          return result.formData.personalInfo.firstName === 'John' &&
                 result.validationsPassed > 0 &&
                 typeof result.errorCount === 'number';
        }
      };

      const metrics = await performanceRunner.runBenchmark(benchmark);
      expect(metrics.averageTime).toBeLessThan(80);
    });
  });

  describe('Type Guard and Utility Performance', () => {
    it('should handle type guard operations efficiently', async () => {
      const benchmark: PerformanceBenchmark = {
        name: 'Type Guard Operations',
        target: 30, // 30ms target
        iterations: 1000,
        operation: () => {
          // Create mixed data array
          const mixedData: unknown[] = [
            'string',
            123,
            true,
            null,
            undefined,
            { id: 'entity-1', name: 'Entity 1' },
            { name: 'Not an entity' },
            [1, 2, 3],
            ['a', 'b', 'c'],
            { id: 'entity-2', created_at: '2023-01-01' },
            new Date(),
            { nested: { deep: { value: 42 } } }
          ];

          // Repeat data to create larger dataset
          const largeDataset = Array.from({ length: 100 }, () => mixedData).flat();

          // Perform type guard operations
          const entities = largeDataset.filter(isEntity);
          const arrays = largeDataset.filter(isArray);
          const nonNulls = largeDataset.filter(isNotNull);

          // Type assertions
          const strings = largeDataset.filter((item): item is string => typeof item === 'string');
          const numbers = largeDataset.filter((item): item is number => typeof item === 'number');
          const objects = largeDataset.filter((item): item is object =>
            typeof item === 'object' && item !== null
          );

          // Complex type guards
          const isComplexEntity = (item: unknown): item is Entity & { name: string } => {
            return isEntity(item) && 'name' in item && typeof (item as any).name === 'string';
          };

          const complexEntities = largeDataset.filter(isComplexEntity);

          // Assertion operations
          let assertionCount = 0;
          strings.forEach(str => {
            try {
              assertType(str, (val): val is string => typeof val === 'string');
              assertionCount++;
            } catch {
              // Assertion failed
            }
          });

          return {
            totalItems: largeDataset.length,
            entities: entities.length,
            arrays: arrays.length,
            nonNulls: nonNulls.length,
            strings: strings.length,
            numbers: numbers.length,
            objects: objects.length,
            complexEntities: complexEntities.length,
            successfulAssertions: assertionCount
          };
        },
        validateResult: (result) => {
          return result.totalItems === 1200 && // 12 items * 100 repetitions
                 result.entities >= 200 && // Should find entity objects
                 result.arrays >= 200 && // Should find arrays
                 result.nonNulls >= 1000; // Most items are non-null
        }
      };

      const metrics = await performanceRunner.runBenchmark(benchmark);
      expect(metrics.averageTime).toBeLessThan(30);
    });
  });

  describe('Overall System Performance', () => {
    it('should meet comprehensive performance benchmarks', async () => {
      const overallMetrics = performanceRunner.getMetrics();

      // Calculate overall statistics
      if (overallMetrics.length > 0) {
        const averageTimes = overallMetrics.map(m => m.averageTime);
        const maxTime = Math.max(...averageTimes);
        const avgTime = averageTimes.reduce((sum, time) => sum + time, 0) / averageTimes.length;
        const totalMemoryDelta = overallMetrics.reduce((sum, m) => sum + m.memoryUsage.delta, 0);

        console.log(`\n📊 Overall Performance Summary:`);
        console.log(`  Operations Tested: ${overallMetrics.length}`);
        console.log(`  Average Time: ${avgTime.toFixed(2)}ms`);
        console.log(`  Slowest Operation: ${maxTime.toFixed(2)}ms`);
        console.log(`  Total Memory Delta: ${(totalMemoryDelta / 1024 / 1024).toFixed(2)}MB`);

        // Performance assertions
        expect(maxTime).toBeLessThan(300); // No operation should take more than 300ms
        expect(avgTime).toBeLessThan(100); // Average should be under 100ms
        expect(totalMemoryDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB total memory increase
      }

      // Type system performance validation
      const typeOperationTime = Date.now();

      // Perform a complex type operation to validate TypeScript performance
      interface ComplexTypeTest extends Entity {
        data: DeepReadonly<{
          nested: {
            array: Array<{
              id: string;
              values: Record<string, unknown>;
            }>;
            metadata: Record<string, any>;
          };
        }>;
      }

      type PartialComplexTest = DeepPartial<ComplexTypeTest>;
      type ValidationComplexTest = ValidationErrors<ComplexTypeTest>;

      const complexData: ComplexTypeTest = {
        id: 'complex-test',
        data: {
          nested: {
            array: [{ id: 'item-1', values: { test: true } }],
            metadata: { version: 1 }
          }
        }
      };

      const typeOperationEndTime = Date.now();
      const typeOperationDuration = typeOperationEndTime - typeOperationTime;

      expect(typeOperationDuration).toBeLessThan(10); // Type operations should be near-instantaneous
      expect(complexData.id).toBe('complex-test');
    });
  });
});