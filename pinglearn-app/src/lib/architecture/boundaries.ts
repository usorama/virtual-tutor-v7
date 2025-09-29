/**
 * Architectural Boundaries and Layer Enforcement - ARCH-001 Implementation
 *
 * This module enforces architectural boundaries through runtime validation
 * and provides clear guidelines for dependency relationships between layers.
 *
 * Features:
 * - Layer dependency validation
 * - Architectural rule enforcement
 * - Dependency injection patterns
 * - Circular dependency prevention
 */

import { ServiceRegistry, ServiceFactory } from '@/types/contracts/service-contracts';

// =============================================================================
// ARCHITECTURAL LAYER DEFINITIONS
// =============================================================================

/**
 * Application layer definitions with clear responsibilities
 */
export enum ArchitecturalLayer {
  PRESENTATION = 'presentation',     // Components, Pages, UI
  APPLICATION = 'application',       // Hooks, State Management
  SERVICES = 'services',             // API calls, External services
  UTILITIES = 'utilities',           // Pure functions, Helpers
  TYPES = 'types',                   // Type definitions, Interfaces
}

/**
 * Dependency rules matrix - who can depend on whom
 */
const DEPENDENCY_RULES: Record<ArchitecturalLayer, ArchitecturalLayer[]> = {
  [ArchitecturalLayer.PRESENTATION]: [
    ArchitecturalLayer.APPLICATION,
    ArchitecturalLayer.SERVICES,
    ArchitecturalLayer.UTILITIES,
    ArchitecturalLayer.TYPES
  ],
  [ArchitecturalLayer.APPLICATION]: [
    ArchitecturalLayer.SERVICES,
    ArchitecturalLayer.UTILITIES,
    ArchitecturalLayer.TYPES
  ],
  [ArchitecturalLayer.SERVICES]: [
    ArchitecturalLayer.UTILITIES,
    ArchitecturalLayer.TYPES
  ],
  [ArchitecturalLayer.UTILITIES]: [
    ArchitecturalLayer.TYPES
  ],
  [ArchitecturalLayer.TYPES]: []
};

/**
 * Module path patterns for layer identification
 */
const LAYER_PATH_PATTERNS: Record<ArchitecturalLayer, RegExp[]> = {
  [ArchitecturalLayer.PRESENTATION]: [
    /^src\/components\//,
    /^src\/app\//,
    /^src\/pages\//,
  ],
  [ArchitecturalLayer.APPLICATION]: [
    /^src\/hooks\//,
    /^src\/contexts\//,
    /^src\/providers\//,
  ],
  [ArchitecturalLayer.SERVICES]: [
    /^src\/lib\/services\//,
    /^src\/services\//,
    /^src\/lib\/api\//,
  ],
  [ArchitecturalLayer.UTILITIES]: [
    /^src\/lib\/utils\//,
    /^src\/utils\//,
    /^src\/lib\/helpers\//,
  ],
  [ArchitecturalLayer.TYPES]: [
    /^src\/types\//,
    /^src\/interfaces\//,
  ],
};

// =============================================================================
// DEPENDENCY VALIDATION
// =============================================================================

/**
 * Violation severity levels
 */
export enum ViolationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Architectural violation interface
 */
export interface ArchitecturalViolation {
  readonly type: 'circular_dependency' | 'layer_violation' | 'protected_core_access';
  readonly severity: ViolationSeverity;
  readonly source: string;
  readonly target: string;
  readonly message: string;
  readonly layer: ArchitecturalLayer;
  readonly violatedLayer: ArchitecturalLayer;
  readonly timestamp: string;
}

/**
 * Dependency validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly violations: ArchitecturalViolation[];
  readonly summary: {
    readonly totalViolations: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
  };
}

/**
 * Architectural boundary validator
 */
export class ArchitectureBoundaryValidator {
  private readonly violations: ArchitecturalViolation[] = [];

  /**
   * Determine layer from module path
   */
  private determineLayer(modulePath: string): ArchitecturalLayer | null {
    for (const [layer, patterns] of Object.entries(LAYER_PATH_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(modulePath))) {
        return layer as ArchitecturalLayer;
      }
    }
    return null;
  }

  /**
   * Check if dependency is allowed between layers
   */
  private isDependencyAllowed(
    sourceLayer: ArchitecturalLayer,
    targetLayer: ArchitecturalLayer
  ): boolean {
    const allowedDependencies = DEPENDENCY_RULES[sourceLayer] || [];
    return allowedDependencies.includes(targetLayer);
  }

  /**
   * Validate single dependency
   */
  validateDependency(
    sourcePath: string,
    targetPath: string
  ): ArchitecturalViolation | null {
    // Skip validation for protected core (it has its own rules)
    if (targetPath.includes('/protected-core/')) {
      return {
        type: 'protected_core_access',
        severity: ViolationSeverity.ERROR,
        source: sourcePath,
        target: targetPath,
        message: `Protected core access violation: ${sourcePath} cannot import from ${targetPath}`,
        layer: this.determineLayer(sourcePath) || ArchitecturalLayer.UTILITIES,
        violatedLayer: ArchitecturalLayer.SERVICES,
        timestamp: new Date().toISOString(),
      };
    }

    const sourceLayer = this.determineLayer(sourcePath);
    const targetLayer = this.determineLayer(targetPath);

    if (!sourceLayer || !targetLayer) {
      return null; // Skip validation for unrecognized paths
    }

    if (!this.isDependencyAllowed(sourceLayer, targetLayer)) {
      return {
        type: 'layer_violation',
        severity: ViolationSeverity.ERROR,
        source: sourcePath,
        target: targetPath,
        message: `Layer violation: ${sourceLayer} layer cannot depend on ${targetLayer} layer`,
        layer: sourceLayer,
        violatedLayer: targetLayer,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Validate multiple dependencies
   */
  validateDependencies(dependencies: Array<{ source: string; target: string }>): ValidationResult {
    this.violations.length = 0;

    for (const { source, target } of dependencies) {
      const violation = this.validateDependency(source, target);
      if (violation) {
        this.violations.push(violation);
      }
    }

    // Check for potential circular dependencies
    const circularViolations = this.detectCircularDependencies(dependencies);
    this.violations.push(...circularViolations);

    const summary = {
      totalViolations: this.violations.length,
      errorCount: this.violations.filter(v => v.severity === ViolationSeverity.ERROR).length,
      warningCount: this.violations.filter(v => v.severity === ViolationSeverity.WARNING).length,
      infoCount: this.violations.filter(v => v.severity === ViolationSeverity.INFO).length,
    };

    return {
      isValid: summary.errorCount === 0,
      violations: [...this.violations],
      summary,
    };
  }

  /**
   * Detect circular dependencies using graph traversal
   */
  private detectCircularDependencies(
    dependencies: Array<{ source: string; target: string }>
  ): ArchitecturalViolation[] {
    const violations: ArchitecturalViolation[] = [];
    const graph = new Map<string, Set<string>>();
    const visiting = new Set<string>();
    const visited = new Set<string>();

    // Build dependency graph
    for (const { source, target } of dependencies) {
      if (!graph.has(source)) {
        graph.set(source, new Set());
      }
      graph.get(source)!.add(target);
    }

    // Depth-first search to detect cycles
    const dfs = (node: string, path: string[]): void => {
      if (visiting.has(node)) {
        // Cycle detected
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart).concat([node]);

        violations.push({
          type: 'circular_dependency',
          severity: ViolationSeverity.ERROR,
          source: cycle[0],
          target: cycle[cycle.length - 1],
          message: `Circular dependency detected: ${cycle.join(' → ')}`,
          layer: this.determineLayer(cycle[0]) || ArchitecturalLayer.UTILITIES,
          violatedLayer: this.determineLayer(cycle[cycle.length - 1]) || ArchitecturalLayer.UTILITIES,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visiting.add(node);
      const dependencies = graph.get(node) || new Set();

      for (const dependency of dependencies) {
        dfs(dependency, [...path, node]);
      }

      visiting.delete(node);
      visited.add(node);
    };

    // Check all nodes for cycles
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return violations;
  }

  /**
   * Get violations by layer
   */
  getViolationsByLayer(layer: ArchitecturalLayer): ArchitecturalViolation[] {
    return this.violations.filter(v => v.layer === layer);
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: ViolationSeverity): ArchitecturalViolation[] {
    return this.violations.filter(v => v.severity === severity);
  }
}

// =============================================================================
// DEPENDENCY INJECTION CONTAINER
// =============================================================================

/**
 * Simple dependency injection container for services
 */
export class ServiceContainer {
  private readonly services = new Map<string, unknown>();
  private readonly factories = new Map<string, () => unknown>();
  private readonly singletons = new Set<string>();

  /**
   * Register a service instance
   */
  register<T>(name: string, instance: T, singleton: boolean = true): void {
    this.services.set(name, instance);
    if (singleton) {
      this.singletons.add(name);
    }
  }

  /**
   * Register a service factory
   */
  registerFactory<T>(name: string, factory: () => T, singleton: boolean = true): void {
    this.factories.set(name, factory);
    if (singleton) {
      this.singletons.add(name);
    }
  }

  /**
   * Get service instance
   */
  get<T>(name: string): T {
    // Return existing instance if singleton
    if (this.singletons.has(name) && this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Create instance from factory
    const factory = this.factories.get(name);
    if (factory) {
      const instance = factory();
      if (this.singletons.has(name)) {
        this.services.set(name, instance);
      }
      return instance as T;
    }

    // Return registered instance
    const instance = this.services.get(name);
    if (instance) {
      return instance as T;
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    const names = new Set([
      ...this.services.keys(),
      ...this.factories.keys(),
    ]);
    return Array.from(names);
  }
}

// =============================================================================
// ARCHITECTURAL GUIDELINES
// =============================================================================

/**
 * Architectural guidelines and best practices
 */
const ARCHITECTURAL_GUIDELINES = {
  /**
   * Layer responsibilities and examples
   */
  LAYER_RESPONSIBILITIES: {
    [ArchitecturalLayer.PRESENTATION]: {
      description: 'React components, pages, and UI elements',
      responsibilities: [
        'Render UI elements and handle user interactions',
        'Manage component-level state and effects',
        'Consume data from application layer hooks',
        'Emit events for user actions',
      ],
      examples: [
        'src/components/textbook/UploadForm.tsx',
        'src/app/(main)/dashboard/page.tsx',
        'src/components/ui/Button.tsx',
      ],
      canImportFrom: ['hooks', 'services', 'utilities', 'types'],
      cannotImportFrom: [],
    },

    [ArchitecturalLayer.APPLICATION]: {
      description: 'Business logic, state management, and custom hooks',
      responsibilities: [
        'Manage application state and data flow',
        'Coordinate between services and presentation',
        'Handle complex business logic',
        'Provide reusable stateful logic via hooks',
      ],
      examples: [
        'src/hooks/useErrorHandler.ts',
        'src/contexts/ThemeContext.tsx',
        'src/providers/AuthProvider.tsx',
      ],
      canImportFrom: ['services', 'utilities', 'types'],
      cannotImportFrom: ['components'],
    },

    [ArchitecturalLayer.SERVICES]: {
      description: 'External integrations, API calls, and data services',
      responsibilities: [
        'Handle external API communications',
        'Manage data persistence and retrieval',
        'Implement business domain services',
        'Emit events for service operations',
      ],
      examples: [
        'src/lib/services/repository-base.ts',
        'src/lib/textbook/processor.ts',
        'src/services/voice-service.ts',
      ],
      canImportFrom: ['utilities', 'types'],
      cannotImportFrom: ['components', 'hooks'],
    },

    [ArchitecturalLayer.UTILITIES]: {
      description: 'Pure functions, helpers, and utilities',
      responsibilities: [
        'Provide pure, stateless utility functions',
        'Handle data transformations and validations',
        'Implement common algorithms and helpers',
        'No side effects or external dependencies',
      ],
      examples: [
        'src/lib/utils/validation.ts',
        'src/lib/utils/formatting.ts',
        'src/utils/constants.ts',
      ],
      canImportFrom: ['types'],
      cannotImportFrom: ['components', 'hooks', 'services'],
    },

    [ArchitecturalLayer.TYPES]: {
      description: 'Type definitions, interfaces, and contracts',
      responsibilities: [
        'Define data structures and interfaces',
        'Provide type contracts between layers',
        'No runtime code or dependencies',
        'Pure type definitions only',
      ],
      examples: [
        'src/types/contracts/service-contracts.ts',
        'src/types/common.ts',
        'src/types/database.ts',
      ],
      canImportFrom: [],
      cannotImportFrom: ['components', 'hooks', 'services', 'utilities'],
    },
  },

  /**
   * Communication patterns between layers
   */
  COMMUNICATION_PATTERNS: {
    DIRECT_IMPORT: {
      description: 'Direct import for same or lower layers',
      example: 'Components can directly import hooks, services, utilities, types',
      whenToUse: 'When dependency direction follows architectural rules',
    },

    EVENT_DRIVEN: {
      description: 'Event bus for decoupled communication',
      example: 'Services emit events, components listen to events',
      whenToUse: 'When you need to communicate across layer boundaries in reverse direction',
    },

    DEPENDENCY_INJECTION: {
      description: 'Inject dependencies through props or context',
      example: 'Pass service instances to components via props',
      whenToUse: 'For testability and loose coupling',
    },

    CALLBACK_PATTERN: {
      description: 'Pass callbacks for reverse communication',
      example: 'Services accept progress callbacks from components',
      whenToUse: 'For progress updates and status notifications',
    },
  },

  /**
   * Common anti-patterns to avoid
   */
  ANTI_PATTERNS: {
    CIRCULAR_DEPENDENCIES: 'Components importing services that import components',
    LAYER_SKIPPING: 'Utilities importing from services or application layer',
    TIGHT_COUPLING: 'Direct component-to-component communication without events',
    GOD_OBJECTS: 'Single service handling multiple unrelated responsibilities',
    PROTECTED_CORE_ACCESS: 'Non-protected code importing from protected-core',
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export const architectureBoundaryValidator = new ArchitectureBoundaryValidator();
export const serviceContainer = new ServiceContainer();

export {
  DEPENDENCY_RULES,
  LAYER_PATH_PATTERNS,
  ARCHITECTURAL_GUIDELINES,
};