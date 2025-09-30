/**
 * SQL Injection Detection for PingLearn
 *
 * Security Implementation: SEC-007
 * Based on: OWASP SQL Injection Prevention + Research findings
 * Integrates with: ERR-006 (Error Monitoring), Supabase client
 *
 * This module provides pattern-based detection of SQL injection attempts
 * as a defense-in-depth layer on top of Supabase's built-in parameterization.
 *
 * Note: Supabase client already uses parameterized queries. This detector
 * provides early warning and audit trail for suspicious inputs.
 */

import { ErrorCode, ErrorSeverity } from '../errors/error-types';

/**
 * SQL injection pattern definition
 */
export interface SQLInjectionPattern {
  readonly name: string;
  readonly pattern: RegExp;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly description: string;
  readonly category: 'TAUTOLOGY' | 'UNION' | 'COMMENT' | 'STACKED' | 'BLIND' | 'KEYWORD' | 'SPECIAL_CHAR';
}

/**
 * Detection result with threat analysis
 */
export interface DetectionResult {
  readonly isThreat: boolean;
  readonly threatScore: number;
  readonly matchedPatterns: SQLInjectionPattern[];
  readonly sanitizedInput: string;
  readonly recommendations: string[];
  readonly originalInput: string;
  readonly detectionTime: number;
}

/**
 * Detector configuration
 */
export interface DetectorConfig {
  readonly sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly blockOnDetection: boolean;
  readonly logAttempts: boolean;
  readonly maxInputLength: number;
}

/**
 * Default detector configuration
 */
const DEFAULT_CONFIG: DetectorConfig = {
  sensitivity: 'MEDIUM',
  blockOnDetection: false, // Log but don't block (Supabase handles it)
  logAttempts: true,
  maxInputLength: 10000
};

/**
 * OWASP SQL Injection Pattern Library
 * Based on OWASP SQL Injection Prevention Cheat Sheet 2025
 */
const SQL_INJECTION_PATTERNS: readonly SQLInjectionPattern[] = [
  // CRITICAL: Classic OR-based tautology attacks
  {
    name: 'CLASSIC_OR_TAUTOLOGY',
    pattern: /(\bOR\b|\|\|)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
    severity: 'CRITICAL',
    description: "Classic OR-based tautology (e.g., OR '1'='1')",
    category: 'TAUTOLOGY'
  },
  {
    name: 'ALWAYS_TRUE_CONDITION',
    pattern: /\b(OR|AND)\s+(TRUE|1=1|'1'='1')/gi,
    severity: 'CRITICAL',
    description: 'Always-true condition injection',
    category: 'TAUTOLOGY'
  },

  // CRITICAL: UNION-based attacks
  {
    name: 'UNION_ATTACK',
    pattern: /\bUNION\b.*\bSELECT\b/gi,
    severity: 'CRITICAL',
    description: 'UNION-based SQL injection attempt',
    category: 'UNION'
  },
  {
    name: 'UNION_ALL_SELECT',
    pattern: /\bUNION\s+ALL\s+SELECT\b/gi,
    severity: 'CRITICAL',
    description: 'UNION ALL SELECT injection attempt',
    category: 'UNION'
  },

  // CRITICAL: Stacked queries with dangerous keywords
  {
    name: 'STACKED_QUERIES_DROP',
    pattern: /;\s*DROP\s+(TABLE|DATABASE|SCHEMA)/gi,
    severity: 'CRITICAL',
    description: 'Stacked query with DROP statement',
    category: 'STACKED'
  },
  {
    name: 'STACKED_QUERIES_DELETE',
    pattern: /;\s*DELETE\s+FROM/gi,
    severity: 'CRITICAL',
    description: 'Stacked query with DELETE statement',
    category: 'STACKED'
  },
  {
    name: 'STACKED_QUERIES_UPDATE',
    pattern: /;\s*UPDATE\s+\w+\s+SET/gi,
    severity: 'CRITICAL',
    description: 'Stacked query with UPDATE statement',
    category: 'STACKED'
  },
  {
    name: 'STACKED_QUERIES_INSERT',
    pattern: /;\s*INSERT\s+INTO/gi,
    severity: 'CRITICAL',
    description: 'Stacked query with INSERT statement',
    category: 'STACKED'
  },

  // HIGH: Blind SQL injection (time-based)
  {
    name: 'BLIND_TIME_BASED',
    pattern: /\b(SLEEP|WAITFOR|BENCHMARK|PG_SLEEP)\s*\(/gi,
    severity: 'HIGH',
    description: 'Time-based blind SQL injection attempt',
    category: 'BLIND'
  },
  {
    name: 'BLIND_BOOLEAN',
    pattern: /\b(IF|CASE)\s*\(.*\bSELECT\b/gi,
    severity: 'HIGH',
    description: 'Boolean-based blind SQL injection',
    category: 'BLIND'
  },

  // HIGH: Dangerous SQL keywords in input
  {
    name: 'EXEC_COMMAND',
    pattern: /\b(EXEC|EXECUTE)\s*\(/gi,
    severity: 'HIGH',
    description: 'EXEC/EXECUTE command injection',
    category: 'KEYWORD'
  },
  {
    name: 'ALTER_STATEMENT',
    pattern: /\bALTER\s+(TABLE|DATABASE|SCHEMA)/gi,
    severity: 'HIGH',
    description: 'ALTER statement detected',
    category: 'KEYWORD'
  },
  {
    name: 'CREATE_STATEMENT',
    pattern: /\bCREATE\s+(TABLE|DATABASE|USER|FUNCTION)/gi,
    severity: 'HIGH',
    description: 'CREATE statement detected',
    category: 'KEYWORD'
  },
  {
    name: 'TRUNCATE_STATEMENT',
    pattern: /\bTRUNCATE\s+TABLE/gi,
    severity: 'HIGH',
    description: 'TRUNCATE statement detected',
    category: 'KEYWORD'
  },

  // MEDIUM: Comment injection
  {
    name: 'SQL_COMMENT_DOUBLE_DASH',
    pattern: /--[^\n]*/g,
    severity: 'MEDIUM',
    description: 'SQL comment (--) detected',
    category: 'COMMENT'
  },
  {
    name: 'SQL_COMMENT_HASH',
    pattern: /#[^\n]*/g,
    severity: 'MEDIUM',
    description: 'SQL comment (#) detected',
    category: 'COMMENT'
  },
  {
    name: 'SQL_COMMENT_BLOCK',
    pattern: /\/\*[\s\S]*?\*\//g,
    severity: 'MEDIUM',
    description: 'SQL block comment (/* */) detected',
    category: 'COMMENT'
  },

  // MEDIUM: Special characters suspicious in context
  {
    name: 'EXCESSIVE_QUOTES',
    pattern: /'{3,}|"{3,}/g,
    severity: 'MEDIUM',
    description: 'Excessive quotes detected (possible escape attempt)',
    category: 'SPECIAL_CHAR'
  },
  {
    name: 'SEMICOLON_INJECTION',
    pattern: /;.*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b/gi,
    severity: 'MEDIUM',
    description: 'Semicolon followed by SQL keyword',
    category: 'SPECIAL_CHAR'
  },

  // LOW: Potentially dangerous but context-dependent
  {
    name: 'INFORMATION_SCHEMA',
    pattern: /\bINFORMATION_SCHEMA\b/gi,
    severity: 'LOW',
    description: 'Reference to INFORMATION_SCHEMA (database introspection)',
    category: 'KEYWORD'
  },
  {
    name: 'SYS_TABLES',
    pattern: /\b(SYS|SYSOBJECTS|SYSTABLES)\b/gi,
    severity: 'LOW',
    description: 'Reference to system tables',
    category: 'KEYWORD'
  }
] as const;

/**
 * Severity scores for threat calculation
 */
const SEVERITY_SCORES = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25
} as const;

/**
 * SQL Injection Detector Class
 *
 * Detects SQL injection patterns in user input using OWASP-based pattern matching.
 * Provides threat scoring and recommendations for mitigation.
 */
export class SQLInjectionDetector {
  private config: DetectorConfig;
  private detectionCache: Map<string, DetectionResult>;
  private readonly MAX_CACHE_SIZE = 100;

  constructor(config?: Partial<DetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detectionCache = new Map();
  }

  /**
   * Detect SQL injection attempts in input string
   *
   * @param input - The input string to analyze
   * @returns Detection result with threat analysis
   *
   * @example
   * ```typescript
   * const detector = new SQLInjectionDetector();
   * const result = detector.detect("' OR '1'='1");
   * console.log(result.isThreat); // true
   * console.log(result.threatScore); // 100
   * ```
   */
  detect(input: string): DetectionResult {
    const startTime = Date.now();

    // Handle edge cases
    if (!input || typeof input !== 'string') {
      return this.createSafeResult(input || '', startTime);
    }

    // Check cache first
    const cached = this.detectionCache.get(input);
    if (cached) {
      return { ...cached, detectionTime: Date.now() - startTime };
    }

    // Length check
    if (input.length > this.config.maxInputLength) {
      return this.createThreatResult(
        input,
        [],
        'Input exceeds maximum length',
        startTime
      );
    }

    // Scan for patterns
    const matchedPatterns = this.scanPatterns(input);

    // Calculate threat score
    const threatScore = this.calculateThreatScore(matchedPatterns);

    // Determine if threat based on sensitivity
    const isThreat = this.isThreatBySensitivity(threatScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(matchedPatterns);

    // Sanitize input
    const sanitizedInput = this.sanitize(input);

    const result: DetectionResult = {
      isThreat,
      threatScore,
      matchedPatterns,
      sanitizedInput,
      recommendations,
      originalInput: input,
      detectionTime: Date.now() - startTime
    };

    // Cache result
    this.cacheResult(input, result);

    // Log if configured
    if (this.config.logAttempts && isThreat) {
      this.logThreat(result).catch(error => {
        console.error('Failed to log SQL injection attempt:', error);
      });
    }

    return result;
  }

  /**
   * Sanitize input by removing/escaping dangerous patterns
   */
  sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove SQL comments
    sanitized = sanitized.replace(/--[^\n]*/g, '');
    sanitized = sanitized.replace(/#[^\n]*/g, '');
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

    // Escape single quotes
    sanitized = sanitized.replace(/'/g, "''");

    // Remove semicolons followed by SQL keywords
    sanitized = sanitized.replace(/;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)/gi, '');

    return sanitized.trim();
  }

  /**
   * Scan input for SQL injection patterns
   */
  private scanPatterns(input: string): SQLInjectionPattern[] {
    const matched: SQLInjectionPattern[] = [];

    for (const pattern of SQL_INJECTION_PATTERNS) {
      // Reset regex index
      pattern.pattern.lastIndex = 0;

      if (pattern.pattern.test(input)) {
        matched.push(pattern);
      }
    }

    return matched;
  }

  /**
   * Calculate overall threat score from matched patterns
   */
  private calculateThreatScore(patterns: SQLInjectionPattern[]): number {
    if (patterns.length === 0) {
      return 0;
    }

    // Use highest severity score
    const maxScore = Math.max(
      ...patterns.map(p => SEVERITY_SCORES[p.severity])
    );

    // Add bonus for multiple patterns
    const multiPatternBonus = Math.min(patterns.length * 5, 20);

    return Math.min(maxScore + multiPatternBonus, 100);
  }

  /**
   * Determine if input is a threat based on sensitivity setting
   */
  private isThreatBySensitivity(score: number): boolean {
    switch (this.config.sensitivity) {
      case 'HIGH':
        return score >= 25; // Flag LOW severity and above
      case 'MEDIUM':
        return score >= 50; // Flag MEDIUM severity and above
      case 'LOW':
        return score >= 75; // Flag HIGH severity and above
      default:
        return score >= 50;
    }
  }

  /**
   * Generate recommendations for mitigating detected threats
   */
  private generateRecommendations(patterns: SQLInjectionPattern[]): string[] {
    if (patterns.length === 0) {
      return [];
    }

    const recommendations: string[] = [];

    // Critical threats
    if (patterns.some(p => p.severity === 'CRITICAL')) {
      recommendations.push('CRITICAL: Block this input immediately');
      recommendations.push('Review input validation and sanitization');
      recommendations.push('Alert security team');
    }

    // Pattern-specific recommendations
    const categories = new Set(patterns.map(p => p.category));

    if (categories.has('TAUTOLOGY')) {
      recommendations.push('Remove tautology conditions (e.g., OR 1=1)');
    }
    if (categories.has('UNION')) {
      recommendations.push('Block UNION-based SQL injection attempts');
    }
    if (categories.has('STACKED')) {
      recommendations.push('Remove stacked query attempts');
    }
    if (categories.has('COMMENT')) {
      recommendations.push('Strip SQL comments from input');
    }
    if (categories.has('BLIND')) {
      recommendations.push('Block time-based blind SQL injection');
    }

    // General recommendations
    recommendations.push('Use parameterized queries (Supabase client does this)');
    recommendations.push('Validate input type and format');
    recommendations.push('Implement input length restrictions');

    return recommendations;
  }

  /**
   * Create safe result for non-threatening input
   */
  private createSafeResult(input: string, startTime: number): DetectionResult {
    return {
      isThreat: false,
      threatScore: 0,
      matchedPatterns: [],
      sanitizedInput: input,
      recommendations: [],
      originalInput: input,
      detectionTime: Date.now() - startTime
    };
  }

  /**
   * Create threat result for dangerous input
   */
  private createThreatResult(
    input: string,
    patterns: SQLInjectionPattern[],
    reason: string,
    startTime: number
  ): DetectionResult {
    return {
      isThreat: true,
      threatScore: 100,
      matchedPatterns: patterns,
      sanitizedInput: this.sanitize(input),
      recommendations: [reason, 'Block this input'],
      originalInput: input,
      detectionTime: Date.now() - startTime
    };
  }

  /**
   * Cache detection result (LRU eviction)
   */
  private cacheResult(input: string, result: DetectionResult): void {
    if (this.detectionCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.detectionCache.keys().next().value;
      if (firstKey !== undefined) {
        this.detectionCache.delete(firstKey);
      }
    }

    this.detectionCache.set(input, result);
  }

  /**
   * Log SQL injection attempt for security monitoring
   * Integrates with ERR-006 ErrorTracker in future
   */
  private async logThreat(result: DetectionResult): Promise<void> {
    // Console log for now (ERR-006 integration pending)
    console.warn('SQL Injection attempt detected', {
      timestamp: new Date().toISOString(),
      threatScore: result.threatScore,
      patterns: result.matchedPatterns.map(p => p.name),
      inputPreview: result.originalInput.substring(0, 100) +
        (result.originalInput.length > 100 ? '...' : ''),
      detectionTime: result.detectionTime
    });

    // TODO: Integration with ErrorTracker
    // if (typeof window !== 'undefined') {
    //   const { ErrorTracker } = await import('@/lib/monitoring/error-tracker');
    //   const tracker = ErrorTracker.getInstance();
    //   await tracker.logSecurityEvent({
    //     type: 'SQL_INJECTION_ATTEMPT',
    //     severity: ErrorSeverity.HIGH,
    //     details: result
    //   });
    // }
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.detectionCache.clear();
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.detectionCache.size;
  }

  /**
   * Update detector configuration
   */
  updateConfig(config: Partial<DetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<DetectorConfig> {
    return { ...this.config };
  }
}

/**
 * Singleton instance for convenience
 */
let defaultDetector: SQLInjectionDetector | null = null;

/**
 * Get or create default SQL injection detector
 */
export function getDefaultDetector(): SQLInjectionDetector {
  if (!defaultDetector) {
    defaultDetector = new SQLInjectionDetector();
  }
  return defaultDetector;
}

/**
 * Quick detection function using default detector
 */
export function detectSQLInjection(input: string): DetectionResult {
  return getDefaultDetector().detect(input);
}

/**
 * Check if input is safe (no threats detected)
 */
export function isSafeInput(input: string): boolean {
  const result = detectSQLInjection(input);
  return !result.isThreat;
}

export default SQLInjectionDetector;