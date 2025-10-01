/**
 * Service Registry
 * ARCH-002: Service Layer Architecture
 *
 * Centralized service discovery and lifecycle management with
 * dependency resolution and health monitoring
 */

import type { BaseService } from './base-service';
import type { ServiceHealth, AggregatedHealth, ServiceErrorCode } from './types';
import {
  ServiceError,
  ServiceNotFoundError,
  ServiceDuplicateError,
  ServiceDependencyError,
} from './errors';
import { ServiceErrorCode as ErrorCode } from './types';
import { ErrorSeverity } from '@/lib/errors/error-types';

/**
 * Service Registry
 *
 * Singleton registry for managing service lifecycle and dependencies
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, BaseService> = new Map();
  private dependencies: Map<string, string[]> = new Map();
  private initializationOrder: string[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  // =============================================================================
  // SERVICE REGISTRATION
  // =============================================================================

  /**
   * Register a service with optional dependencies
   *
   * @param name - Unique service name
   * @param service - Service instance
   * @param dependencies - Array of service names this service depends on
   */
  register<T extends BaseService>(
    name: string,
    service: T,
    dependencies: string[] = []
  ): void {
    // Check for duplicate registration
    if (this.services.has(name)) {
      throw new ServiceDuplicateError(name);
    }

    // Validate dependencies exist
    for (const dep of dependencies) {
      if (!this.services.has(dep)) {
        throw new ServiceDependencyError(name, dep);
      }
    }

    // Register service
    this.services.set(name, service);
    this.dependencies.set(name, dependencies);
    this.updateInitializationOrder(name, dependencies);

    const depsList = dependencies.length > 0 ? dependencies.join(', ') : 'none';
    console.log(
      `[ServiceRegistry] Registered: ${name} (dependencies: ${depsList})`
    );
  }

  /**
   * Get service by name with type safety
   *
   * @param name - Service name
   * @returns Service instance
   * @throws ServiceNotFoundError if service not registered
   */
  get<T extends BaseService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new ServiceNotFoundError(name);
    }
    return service as T;
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   *
   * @param name - Service name
   */
  async unregister(name: string): Promise<void> {
    const service = this.services.get(name);
    if (!service) return;

    // Stop service if running
    if (service.isReady()) {
      await service.stop();
    }

    this.services.delete(name);
    this.dependencies.delete(name);
    this.initializationOrder = this.initializationOrder.filter(
      (n) => n !== name
    );

    console.log(`[ServiceRegistry] Unregistered: ${name}`);
  }

  // =============================================================================
  // LIFECYCLE MANAGEMENT
  // =============================================================================

  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    console.log(
      `[ServiceRegistry] Initializing ${this.services.size} services...`
    );

    for (const name of this.initializationOrder) {
      const service = this.services.get(name);
      if (!service) continue;

      try {
        if (service.getState() === 'uninitialized') {
          await service.initialize();
          console.log(`[ServiceRegistry] ✓ Initialized: ${name}`);
        } else {
          console.log(
            `[ServiceRegistry] ⊘ Skipped (already initialized): ${name}`
          );
        }
      } catch (error) {
        console.error(
          `[ServiceRegistry] ✗ Failed to initialize: ${name}`,
          error
        );
        throw ServiceError.from(error, 'ServiceRegistry', ErrorCode.INITIALIZATION_FAILED);
      }
    }

    console.log(`[ServiceRegistry] All services initialized successfully`);
  }

  /**
   * Start all services
   */
  async startAll(): Promise<void> {
    console.log(`[ServiceRegistry] Starting services...`);

    for (const [name, service] of this.services) {
      try {
        if (service.getState() === 'ready') {
          await service.start();
          console.log(`[ServiceRegistry] ✓ Started: ${name}`);
        }
      } catch (error) {
        console.error(`[ServiceRegistry] ✗ Failed to start: ${name}`, error);
        // Continue starting other services
      }
    }
  }

  /**
   * Stop all services in reverse initialization order
   */
  async stopAll(): Promise<void> {
    console.log(`[ServiceRegistry] Stopping services...`);

    const reverseOrder = [...this.initializationOrder].reverse();

    for (const name of reverseOrder) {
      const service = this.services.get(name);
      if (!service) continue;

      try {
        if (service.isReady()) {
          await service.stop();
          console.log(`[ServiceRegistry] ✓ Stopped: ${name}`);
        }
      } catch (error) {
        console.error(`[ServiceRegistry] ✗ Failed to stop: ${name}`, error);
        // Continue stopping other services
      }
    }
  }

  // =============================================================================
  // HEALTH MONITORING
  // =============================================================================

  /**
   * Get health status of all services
   *
   * @returns Map of service names to health status
   */
  async getHealth(): Promise<Record<string, ServiceHealth>> {
    const health: Record<string, ServiceHealth> = {};

    for (const [name, service] of this.services) {
      try {
        health[name] = await service.health();
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
          lastCheck: new Date(),
        };
      }
    }

    return health;
  }

  /**
   * Get aggregated health status
   *
   * @returns Aggregated health with overall system status
   */
  async getAggregatedHealth(): Promise<AggregatedHealth> {
    const services = await this.getHealth();

    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const health of Object.values(services)) {
      if (health.status === 'healthy') healthyCount++;
      else if (health.status === 'degraded') degradedCount++;
      else unhealthyCount++;
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      services,
      totalServices: this.services.size,
      healthyServices: healthyCount,
      degradedServices: degradedCount,
      unhealthyServices: unhealthyCount,
      timestamp: new Date(),
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get initialization order
   */
  getInitializationOrder(): string[] {
    return [...this.initializationOrder];
  }

  /**
   * Get service dependencies
   */
  getDependencies(serviceName: string): string[] {
    return this.dependencies.get(serviceName) || [];
  }

  /**
   * Clear all services (for testing)
   */
  async clear(): Promise<void> {
    await this.stopAll();
    this.services.clear();
    this.dependencies.clear();
    this.initializationOrder = [];
  }

  /**
   * Get service count
   */
  getServiceCount(): number {
    return this.services.size;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Update initialization order based on dependencies
   * Uses topological sort to ensure dependencies are initialized first
   */
  private updateInitializationOrder(name: string, dependencies: string[]): void {
    // Remove name if already in order
    this.initializationOrder = this.initializationOrder.filter(
      (n) => n !== name
    );

    // Find insertion point (after all dependencies)
    let insertIndex = 0;
    for (const dep of dependencies) {
      const depIndex = this.initializationOrder.indexOf(dep);
      if (depIndex >= insertIndex) {
        insertIndex = depIndex + 1;
      }
    }

    this.initializationOrder.splice(insertIndex, 0, name);
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();
