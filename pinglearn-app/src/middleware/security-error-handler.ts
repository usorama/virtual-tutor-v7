/**
 * Advanced Security Middleware for API Routes
 *
 * This middleware integrates the comprehensive security error handling system
 * with Next.js API routes, providing real-time threat detection, automated
 * response, and incident management for all API endpoints.
 *
 * Features:
 * - Request-level security analysis
 * - Real-time threat detection
 * - Automated security responses
 * - Rate limiting integration
 * - Audit logging and compliance
 * - IP blocking and session management
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SecurityError,
  SecurityErrorCode,
  SecurityMetadata,
  SECURITY_ERROR_TO_HTTP_STATUS,
  SECURITY_USER_MESSAGES
} from '../lib/security/security-error-types';
import { ErrorSeverity } from '../lib/errors/error-types';
import { SecurityThreatDetector } from '../lib/security/threat-detector';
import { SecurityRecoveryManager } from '../lib/security/security-recovery';

/**
 * Security middleware configuration
 */
interface SecurityMiddlewareConfig {
  enableThreatDetection: boolean;
  enableAutoBlocking: boolean;
  enableAuditLogging: boolean;
  rateLimiting: {
    enabled: boolean;
    requests: number;
    windowMs: number;
  };
  allowedOrigins?: string[];
  bypassPaths?: string[];
  strictMode: boolean;
}

/**
 * Request security context
 */
interface RequestSecurityContext {
  clientIP: string;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  payload?: any;
  timestamp: string;
  requestId: string;
}

/**
 * Security analysis result
 */
interface SecurityAnalysisResult {
  isSecure: boolean;
  riskScore: number;
  threats: SecurityErrorCode[];
  suspiciousPatterns: string[];
  recommendation: 'allow' | 'block' | 'challenge' | 'monitor';
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityMiddlewareConfig = {
  enableThreatDetection: true,
  enableAutoBlocking: true,
  enableAuditLogging: true,
  rateLimiting: {
    enabled: true,
    requests: 100,
    windowMs: 60 * 1000 // 1 minute
  },
  allowedOrigins: [],
  bypassPaths: ['/api/health', '/api/ping'],
  strictMode: false
};

/**
 * Sliding window rate limit entry
 */
interface SlidingWindowEntry {
  timestamps: number[];  // Request timestamps within window
  lastCleanup: number;   // Last cleanup time for optimization
}

/**
 * Rate limit rule for specific endpoints
 */
interface RateLimitRule {
  perUser: number;       // Requests per user per window
  perIP: number;         // Requests per IP per window
  windowMs: number;      // Time window in milliseconds
  blockDuration?: number; // Optional: block duration after limit exceeded
}

/**
 * Voice session rate limit configuration
 * Optimized for different voice/session endpoints based on traffic patterns
 */
const VOICE_SESSION_RATE_LIMITS: Record<string, RateLimitRule> = {
  '/api/livekit': {
    perUser: 5,           // 5 room creations per user per minute
    perIP: 10,            // 10 per IP (allows some flexibility)
    windowMs: 60000,      // 1 minute window
    blockDuration: 120000 // 2 minute block after abuse
  },
  '/api/livekit/token': {
    perUser: 10,          // 10 token requests per user per minute (allows refreshes)
    perIP: 20,            // 20 per IP (higher for shared networks)
    windowMs: 60000,
    blockDuration: 300000 // 5 minute block (high-risk endpoint)
  },
  '/api/session/start': {
    perUser: 3,           // 3 session starts per user per minute
    perIP: 5,             // 5 per IP
    windowMs: 60000
  },
  '/api/transcription': {
    perUser: 100,         // High frequency during active voice session
    perIP: 150,           // Allow more per IP for transcription bursts
    windowMs: 60000
  }
};

/**
 * Advanced Security Middleware Class
 */
export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private config: SecurityMiddlewareConfig;
  private threatDetector: SecurityThreatDetector;
  private recoveryManager: SecurityRecoveryManager;

  // Sliding window rate limiting tracking
  private slidingWindowStore = new Map<string, SlidingWindowEntry>();

  // Request tracking for analysis
  private recentRequests = new Map<string, RequestSecurityContext[]>();

  // Block tracker for temporary bans after rate limit abuse
  private blockTracker = new Map<string, number>();

  private constructor(config: Partial<SecurityMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
    this.threatDetector = SecurityThreatDetector.getInstance();
    this.recoveryManager = SecurityRecoveryManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<SecurityMiddlewareConfig>): SecurityMiddleware {
    if (!this.instance) {
      this.instance = new SecurityMiddleware(config);
    }
    return this.instance;
  }

  /**
   * Main middleware function for Next.js API routes
   */
  async handleRequest(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Extract request context
      const context = await this.extractRequestContext(request);

      // Check if path should bypass security
      if (this.shouldBypassSecurity(context.endpoint)) {
        return null; // Continue to next middleware/handler
      }

      // Check if IP is blocked
      if (this.config.enableAutoBlocking && this.threatDetector.isBlocked(context.clientIP)) {
        return this.createBlockedResponse(context, 'IP address blocked due to security violations');
      }

      // Rate limiting check
      if (this.config.rateLimiting.enabled) {
        const rateLimitResult = await this.checkRateLimit(context);
        if (!rateLimitResult.allowed) {
          await this.handleRateLimitExceeded(context, rateLimitResult);
          return this.createRateLimitResponse(context);
        }
      }

      // CORS security check
      const corsResult = await this.checkCORS(request, context);
      if (!corsResult.allowed) {
        return this.createCORSViolationResponse(context, corsResult.reason || 'CORS policy violation');
      }

      // Comprehensive security analysis
      const analysisResult = await this.analyzeRequestSecurity(context);

      // Handle security threats
      if (!analysisResult.isSecure) {
        return await this.handleSecurityThreats(context, analysisResult);
      }

      // Log secure request for behavioral analysis
      if (this.config.enableAuditLogging) {
        await this.logSecureRequest(context, analysisResult);
      }

      // Request is secure - continue processing
      return null;

    } catch (error) {
      console.error('Security middleware error:', error);

      // In case of middleware failure, allow request but log incident
      await this.logMiddlewareError(error, request);

      // In strict mode, block on middleware errors
      if (this.config.strictMode) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SECURITY_MIDDLEWARE_ERROR',
              message: 'Security check failed - access denied',
              timestamp: new Date().toISOString()
            }
          },
          { status: 500 }
        );
      }

      return null; // Continue processing in non-strict mode
    }
  }

  /**
   * Extract comprehensive request context
   */
  private async extractRequestContext(request: NextRequest): Promise<RequestSecurityContext> {
    const url = new URL(request.url);
    const clientIP = this.extractClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const requestId = this.generateRequestId();

    // Extract payload for POST/PUT requests
    let payload: any = undefined;
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          payload = await request.clone().json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.clone().formData();
          payload = Object.fromEntries(formData);
        }
      } catch (error) {
        console.warn('Failed to extract request payload:', error);
      }
    }

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return {
      clientIP,
      userAgent,
      sessionId: await this.extractSessionId(request),
      userId: await this.extractUserId(request),
      endpoint: url.pathname,
      method: request.method,
      headers,
      payload,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Comprehensive security analysis of the request
   */
  private async analyzeRequestSecurity(context: RequestSecurityContext): Promise<SecurityAnalysisResult> {
    let riskScore = 0;
    const threats: SecurityErrorCode[] = [];
    const suspiciousPatterns: string[] = [];

    // Analyze URL for suspicious patterns
    const urlAnalysis = this.analyzeURL(context.endpoint);
    riskScore += urlAnalysis.riskScore;
    threats.push(...urlAnalysis.threats);
    suspiciousPatterns.push(...urlAnalysis.patterns);

    // Analyze headers for threats
    const headerAnalysis = this.analyzeHeaders(context.headers);
    riskScore += headerAnalysis.riskScore;
    threats.push(...headerAnalysis.threats);
    suspiciousPatterns.push(...headerAnalysis.patterns);

    // Analyze payload if present
    if (context.payload) {
      const payloadAnalysis = this.analyzePayload(context.payload);
      riskScore += payloadAnalysis.riskScore;
      threats.push(...payloadAnalysis.threats);
      suspiciousPatterns.push(...payloadAnalysis.patterns);
    }

    // Analyze behavioral patterns
    const behaviorAnalysis = this.analyzeBehavioralPatterns(context);
    riskScore += behaviorAnalysis.riskScore;
    threats.push(...behaviorAnalysis.threats);

    // Determine recommendation
    let recommendation: SecurityAnalysisResult['recommendation'] = 'allow';
    if (riskScore >= 80) {
      recommendation = 'block';
    } else if (riskScore >= 60) {
      recommendation = 'challenge';
    } else if (riskScore >= 30) {
      recommendation = 'monitor';
    }

    return {
      isSecure: riskScore < 60,
      riskScore: Math.min(riskScore, 100),
      threats: [...new Set(threats)], // Remove duplicates
      suspiciousPatterns: [...new Set(suspiciousPatterns)],
      recommendation
    };
  }

  /**
   * Analyze URL for suspicious patterns
   */
  private analyzeURL(url: string): { riskScore: number; threats: SecurityErrorCode[]; patterns: string[] } {
    let riskScore = 0;
    const threats: SecurityErrorCode[] = [];
    const patterns: string[] = [];

    const urlLower = url.toLowerCase();

    // Path traversal detection
    if (urlLower.includes('../') || urlLower.includes('..\\') || urlLower.includes('%2e%2e')) {
      riskScore += 40;
      threats.push(SecurityErrorCode.PATH_TRAVERSAL);
      patterns.push('path_traversal');
    }

    // SQL injection patterns
    const sqlPatterns = ['union', 'select', 'insert', 'update', 'delete', 'drop', 'exec', '--', ';--'];
    if (sqlPatterns.some(pattern => urlLower.includes(pattern))) {
      riskScore += 50;
      threats.push(SecurityErrorCode.SQL_INJECTION_ATTEMPT);
      patterns.push('sql_injection');
    }

    // XSS patterns
    const xssPatterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'eval('];
    if (xssPatterns.some(pattern => urlLower.includes(pattern.toLowerCase()))) {
      riskScore += 45;
      threats.push(SecurityErrorCode.XSS_ATTEMPT);
      patterns.push('xss_attempt');
    }

    // Command injection
    const cmdPatterns = ['|', '&&', '||', ';', '`', '$(', '${'];
    if (cmdPatterns.some(pattern => urlLower.includes(pattern))) {
      riskScore += 35;
      threats.push(SecurityErrorCode.COMMAND_INJECTION);
      patterns.push('command_injection');
    }

    return { riskScore, threats, patterns };
  }

  /**
   * Analyze headers for security threats
   */
  private analyzeHeaders(headers: Record<string, string>): { riskScore: number; threats: SecurityErrorCode[]; patterns: string[] } {
    let riskScore = 0;
    const threats: SecurityErrorCode[] = [];
    const patterns: string[] = [];

    // Check for suspicious user agents
    const userAgent = headers['user-agent'] || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      riskScore += 20;
      patterns.push('suspicious_user_agent');
    }

    // Check for proxy headers (potential IP spoofing)
    const proxyHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip', 'x-remote-ip'];
    const proxyCount = proxyHeaders.filter(header => headers[header]).length;
    if (proxyCount > 1) {
      riskScore += 15;
      patterns.push('multiple_proxy_headers');
    }

    // Check for missing security headers
    if (!headers['user-agent']) {
      riskScore += 10;
      patterns.push('missing_user_agent');
    }

    // Check for suspicious referrers
    const referer = headers['referer'];
    if (referer && this.isSuspiciousReferer(referer)) {
      riskScore += 25;
      patterns.push('suspicious_referer');
    }

    return { riskScore, threats, patterns };
  }

  /**
   * Analyze payload for security threats
   */
  private analyzePayload(payload: any): { riskScore: number; threats: SecurityErrorCode[]; patterns: string[] } {
    let riskScore = 0;
    const threats: SecurityErrorCode[] = [];
    const patterns: string[] = [];

    const payloadStr = JSON.stringify(payload).toLowerCase();

    // SQL injection detection
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)/gi,
      /(\bselect\b.*\bfrom\b.*\bwhere\b)/gi,
      /(\bdrop\b.*\btable\b)/gi,
      /(;.*--)/gi
    ];

    if (sqlPatterns.some(pattern => pattern.test(payloadStr))) {
      riskScore += 60;
      threats.push(SecurityErrorCode.SQL_INJECTION_ATTEMPT);
      patterns.push('sql_injection_payload');
    }

    // XSS detection
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:[^'"]*['"]?/gi,
      /on\w+\s*=\s*['"][^'"]*['"]?/gi
    ];

    if (xssPatterns.some(pattern => pattern.test(payloadStr))) {
      riskScore += 55;
      threats.push(SecurityErrorCode.XSS_ATTEMPT);
      patterns.push('xss_payload');
    }

    // Command injection
    const cmdPatterns = [
      /[|&;`$(){}[\]<>]/g
    ];

    if (cmdPatterns.some(pattern => pattern.test(payloadStr))) {
      riskScore += 40;
      threats.push(SecurityErrorCode.COMMAND_INJECTION);
      patterns.push('command_injection_payload');
    }

    // Check payload size (potential DoS)
    if (payloadStr.length > 10000) { // 10KB
      riskScore += 15;
      patterns.push('large_payload');
    }

    return { riskScore, threats, patterns };
  }

  /**
   * Analyze behavioral patterns
   */
  private analyzeBehavioralPatterns(context: RequestSecurityContext): { riskScore: number; threats: SecurityErrorCode[] } {
    let riskScore = 0;
    const threats: SecurityErrorCode[] = [];

    // Get recent requests for this IP
    const recentRequests = this.recentRequests.get(context.clientIP) || [];

    // Check request frequency
    const now = Date.now();
    const recentWindow = 60 * 1000; // 1 minute
    const recentCount = recentRequests.filter(req =>
      (now - new Date(req.timestamp).getTime()) < recentWindow
    ).length;

    if (recentCount > 50) { // More than 50 requests per minute
      riskScore += 30;
      threats.push(SecurityErrorCode.RATE_LIMIT_EXCEEDED);
    }

    // Check for endpoint scanning
    const uniqueEndpoints = new Set(recentRequests.map(req => req.endpoint));
    if (uniqueEndpoints.size > 20) { // Accessing many different endpoints
      riskScore += 25;
      threats.push(SecurityErrorCode.SUSPICIOUS_TRAFFIC);
    }

    // Update recent requests tracker
    recentRequests.push(context);
    if (recentRequests.length > 100) {
      recentRequests.shift(); // Keep only last 100 requests
    }
    this.recentRequests.set(context.clientIP, recentRequests);

    return { riskScore, threats };
  }

  /**
   * Handle detected security threats
   */
  private async handleSecurityThreats(
    context: RequestSecurityContext,
    analysis: SecurityAnalysisResult
  ): Promise<NextResponse> {
    // Create security error for the most severe threat
    const primaryThreat = this.selectPrimaryThreat(analysis.threats);
    const securityError = await this.createSecurityError(context, primaryThreat, analysis);

    // Run threat detection and recovery
    if (this.config.enableThreatDetection) {
      const assessment = await this.threatDetector.detectThreat(securityError);

      if (this.config.enableAutoBlocking && assessment.autoBlock) {
        // Execute automated security recovery
        await this.recoveryManager.initiateSecurityRecovery(assessment, securityError);
      }
    }

    // Return appropriate response based on recommendation
    switch (analysis.recommendation) {
      case 'block':
        return this.createThreatBlockedResponse(context, primaryThreat, analysis);

      case 'challenge':
        return this.createSecurityChallengeResponse(context, primaryThreat);

      case 'monitor':
        // Log but allow request
        console.warn('Security threat detected but allowing request:', {
          clientIP: context.clientIP,
          endpoint: context.endpoint,
          threats: analysis.threats,
          riskScore: analysis.riskScore
        });
        return NextResponse.next(); // Continue processing

      default:
        return NextResponse.next();
    }
  }

  /**
   * Sliding window rate limiter - accurate rate limiting without boundary burst issues
   *
   * @param key - Unique identifier (e.g., "IP:endpoint" or "userId:endpoint")
   * @param limit - Maximum number of requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns Rate limit check result with allowed status and metadata
   */
  private checkSlidingWindowRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    count: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create entry
    let entry = this.slidingWindowStore.get(key);
    if (!entry) {
      entry = { timestamps: [], lastCleanup: now };
      this.slidingWindowStore.set(key, entry);
    }

    // Remove expired timestamps (this is what makes the window "slide")
    entry.timestamps = entry.timestamps.filter((ts: number) => ts > windowStart);
    entry.lastCleanup = now;

    // Check if limit exceeded
    const allowed = entry.timestamps.length < limit;
    const count = entry.timestamps.length;

    if (allowed) {
      // Add current request timestamp
      entry.timestamps.push(now);
    }

    // Calculate reset time (when oldest request will expire)
    const resetTime = entry.timestamps.length > 0
      ? entry.timestamps[0] + windowMs
      : now + windowMs;

    return {
      allowed,
      remaining: Math.max(0, limit - entry.timestamps.length),
      resetTime,
      count: entry.timestamps.length
    };
  }

  /**
   * Check voice session rate limiting with per-user and per-IP limits
   *
   * @param request - Next.js request object
   * @param endpoint - API endpoint path
   * @returns Rate limit check result
   */
  async checkVoiceRateLimit(
    request: NextRequest,
    endpoint: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter: number;
    limit: number;
    violationType?: 'user' | 'ip';
  }> {
    // Check if endpoint has voice rate limit configuration
    const rule = VOICE_SESSION_RATE_LIMITS[endpoint];
    if (!rule) {
      // No specific rule, use default rate limiting
      return {
        allowed: true,
        remaining: 100,
        resetTime: Date.now() + 60000,
        retryAfter: 0,
        limit: 100
      };
    }

    const clientIP = this.extractClientIP(request);
    const userId = await this.extractUserId(request);
    const now = Date.now();

    // Check if temporarily blocked
    if (rule.blockDuration) {
      const ipBlockKey = `block:${clientIP}:${endpoint}`;
      const ipBlockUntil = this.blockTracker.get(ipBlockKey);
      if (ipBlockUntil && now < ipBlockUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: ipBlockUntil,
          retryAfter: ipBlockUntil - now,
          limit: rule.perIP,
          violationType: 'ip'
        };
      }

      if (userId) {
        const userBlockKey = `block:${userId}:${endpoint}`;
        const userBlockUntil = this.blockTracker.get(userBlockKey);
        if (userBlockUntil && now < userBlockUntil) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: userBlockUntil,
            retryAfter: userBlockUntil - now,
            limit: rule.perUser,
            violationType: 'user'
          };
        }
      }
    }

    // Check per-user limit (primary check)
    if (userId) {
      const userKey = `user:${userId}:${endpoint}`;
      const userResult = this.checkSlidingWindowRateLimit(
        userKey,
        rule.perUser,
        rule.windowMs
      );

      if (!userResult.allowed) {
        // User limit exceeded - apply block if configured
        if (rule.blockDuration) {
          const blockKey = `block:${userId}:${endpoint}`;
          this.blockTracker.set(blockKey, now + rule.blockDuration);
        }

        return {
          allowed: false,
          remaining: userResult.remaining,
          resetTime: userResult.resetTime,
          retryAfter: userResult.resetTime - now,
          limit: rule.perUser,
          violationType: 'user'
        };
      }

      // User limit passed, check IP limit (secondary check)
      const ipKey = `ip:${clientIP}:${endpoint}`;
      const ipResult = this.checkSlidingWindowRateLimit(
        ipKey,
        rule.perIP,
        rule.windowMs
      );

      if (!ipResult.allowed) {
        // IP limit exceeded - apply block if configured
        if (rule.blockDuration) {
          const blockKey = `block:${clientIP}:${endpoint}`;
          this.blockTracker.set(blockKey, now + rule.blockDuration);
        }

        return {
          allowed: false,
          remaining: ipResult.remaining,
          resetTime: ipResult.resetTime,
          retryAfter: ipResult.resetTime - now,
          limit: rule.perIP,
          violationType: 'ip'
        };
      }

      // Both limits passed
      return {
        allowed: true,
        remaining: Math.min(userResult.remaining, ipResult.remaining),
        resetTime: Math.min(userResult.resetTime, ipResult.resetTime),
        retryAfter: 0,
        limit: rule.perUser
      };
    }

    // No user ID, only check IP limit
    const ipKey = `ip:${clientIP}:${endpoint}`;
    const ipResult = this.checkSlidingWindowRateLimit(
      ipKey,
      rule.perIP,
      rule.windowMs
    );

    if (!ipResult.allowed && rule.blockDuration) {
      const blockKey = `block:${clientIP}:${endpoint}`;
      this.blockTracker.set(blockKey, now + rule.blockDuration);
    }

    return {
      allowed: ipResult.allowed,
      remaining: ipResult.remaining,
      resetTime: ipResult.resetTime,
      retryAfter: ipResult.allowed ? 0 : ipResult.resetTime - now,
      limit: rule.perIP,
      violationType: ipResult.allowed ? undefined : 'ip'
    };
  }

  /**
   * Legacy rate limiting check (kept for backward compatibility)
   * @deprecated Use checkVoiceRateLimit for new implementations
   */
  private async checkRateLimit(context: RequestSecurityContext): Promise<{ allowed: boolean; resetTime?: number }> {
    const key = `${context.clientIP}:${context.endpoint}`;
    const result = this.checkSlidingWindowRateLimit(
      key,
      this.config.rateLimiting.requests,
      this.config.rateLimiting.windowMs
    );

    return {
      allowed: result.allowed,
      resetTime: result.resetTime
    };
  }

  /**
   * Handle rate limit exceeded
   */
  private async handleRateLimitExceeded(
    context: RequestSecurityContext,
    rateLimitResult: { resetTime?: number }
  ): Promise<void> {
    const securityError = await this.createSecurityError(
      context,
      SecurityErrorCode.RATE_LIMIT_EXCEEDED,
      {
        isSecure: false,
        riskScore: 30,
        threats: [SecurityErrorCode.RATE_LIMIT_EXCEEDED],
        suspiciousPatterns: ['rate_limit_exceeded'],
        recommendation: 'block'
      }
    );

    if (this.config.enableThreatDetection) {
      await this.threatDetector.detectThreat(securityError);
    }
  }

  /**
   * Check CORS security
   */
  private async checkCORS(request: NextRequest, context: RequestSecurityContext): Promise<{ allowed: boolean; reason?: string }> {
    const origin = request.headers.get('origin');

    if (!origin) {
      return { allowed: true }; // No CORS check needed for same-origin requests
    }

    // Check allowed origins
    if (this.config.allowedOrigins && this.config.allowedOrigins.length > 0) {
      if (!this.config.allowedOrigins.includes(origin)) {
        return {
          allowed: false,
          reason: `Origin ${origin} not in allowed list`
        };
      }
    }

    return { allowed: true };
  }

  // Response creation methods
  private createBlockedResponse(context: RequestSecurityContext, reason: string): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: SecurityErrorCode.IP_BLOCKED,
          message: SECURITY_USER_MESSAGES[SecurityErrorCode.IP_BLOCKED],
          details: { reason },
          timestamp: new Date().toISOString(),
          requestId: context.requestId
        }
      },
      { status: 403 }
    );
  }

  private createRateLimitResponse(context: RequestSecurityContext): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: SecurityErrorCode.RATE_LIMIT_EXCEEDED,
          message: SECURITY_USER_MESSAGES[SecurityErrorCode.RATE_LIMIT_EXCEEDED],
          timestamp: new Date().toISOString(),
          requestId: context.requestId
        }
      },
      { status: 429 }
    );
  }

  private createThreatBlockedResponse(
    context: RequestSecurityContext,
    threat: SecurityErrorCode,
    analysis: SecurityAnalysisResult
  ): NextResponse {
    const httpStatus = SECURITY_ERROR_TO_HTTP_STATUS[threat] || 400;
    const userMessage = SECURITY_USER_MESSAGES[threat] || 'Security threat detected and blocked.';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: threat,
          message: userMessage,
          details: {
            riskScore: analysis.riskScore,
            threats: analysis.threats.length,
            blocked: true
          },
          timestamp: new Date().toISOString(),
          requestId: context.requestId
        }
      },
      { status: httpStatus }
    );
  }

  private createSecurityChallengeResponse(
    context: RequestSecurityContext,
    threat: SecurityErrorCode
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SECURITY_CHALLENGE_REQUIRED',
          message: 'Additional security verification required.',
          details: {
            challenge: 'captcha', // Could be CAPTCHA, MFA, etc.
            reason: threat
          },
          timestamp: new Date().toISOString(),
          requestId: context.requestId
        }
      },
      { status: 403 }
    );
  }

  private createCORSViolationResponse(context: RequestSecurityContext, reason: string): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: SecurityErrorCode.CORS_VIOLATION,
          message: SECURITY_USER_MESSAGES[SecurityErrorCode.CORS_VIOLATION],
          details: { reason },
          timestamp: new Date().toISOString(),
          requestId: context.requestId
        }
      },
      { status: 400 }
    );
  }

  // Utility methods
  private async createSecurityError(
    context: RequestSecurityContext,
    errorCode: SecurityErrorCode,
    analysis: SecurityAnalysisResult
  ): Promise<SecurityError> {
    const metadata: SecurityMetadata = {
      endpoint: context.endpoint,
      method: context.method,
      payload: context.payload,
      headers: context.headers,
      timestamp: context.timestamp,
      riskScore: analysis.riskScore,
      confidence: 0.8, // High confidence from middleware analysis
      attackVector: analysis.suspiciousPatterns
    };

    return {
      code: 'AUTHENTICATION_ERROR' as any,
      securityCode: errorCode,
      message: `Security threat detected: ${errorCode}`,
      details: { analysisResult: analysis },
      timestamp: context.timestamp,
      requestId: context.requestId,
      threatLevel: 'moderate', // Will be updated by threat detector
      severity: analysis.riskScore > 70 ? ErrorSeverity.CRITICAL : analysis.riskScore > 40 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      clientIP: context.clientIP,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      userId: context.userId,
      metadata
    };
  }

  private selectPrimaryThreat(threats: SecurityErrorCode[]): SecurityErrorCode {
    // Priority order for threat severity
    const priorityOrder = [
      SecurityErrorCode.SQL_INJECTION_ATTEMPT,
      SecurityErrorCode.COMMAND_INJECTION,
      SecurityErrorCode.XSS_ATTEMPT,
      SecurityErrorCode.PATH_TRAVERSAL,
      SecurityErrorCode.RATE_LIMIT_EXCEEDED,
      SecurityErrorCode.SUSPICIOUS_TRAFFIC
    ];

    for (const priority of priorityOrder) {
      if (threats.includes(priority)) {
        return priority;
      }
    }

    return threats[0] || SecurityErrorCode.SECURITY_POLICY_VIOLATION;
  }

  private shouldBypassSecurity(endpoint: string): boolean {
    return this.config.bypassPaths?.some(path => endpoint.startsWith(path)) || false;
  }

  private extractClientIP(request: NextRequest): string {
    // Try various headers for real IP
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // Take first IP if comma-separated
        return value.split(',')[0].trim();
      }
    }

    return 'unknown';
  }

  private async extractSessionId(request: NextRequest): Promise<string | undefined> {
    // Extract from cookie or header
    const sessionCookie = request.cookies.get('session-id');
    if (sessionCookie) {
      return sessionCookie.value;
    }

    const sessionHeader = request.headers.get('x-session-id');
    return sessionHeader || undefined;
  }

  private async extractUserId(request: NextRequest): Promise<string | undefined> {
    // Extract from JWT token or session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        // In production, this would decode and validate JWT
        const token = authHeader.substring(7);
        // Decode token and extract user ID
        return 'user-from-jwt'; // Placeholder
      } catch (error) {
        console.warn('Failed to extract user ID from token:', error);
      }
    }

    return undefined;
  }

  private generateRequestId(): string {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /script/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isSuspiciousReferer(referer: string): boolean {
    try {
      const url = new URL(referer);
      // Check for known malicious domains or patterns
      const suspiciousDomains = ['malicious-site.com', 'phishing-domain.net'];
      return suspiciousDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return true; // Invalid referer URL is suspicious
    }
  }

  private async logSecureRequest(context: RequestSecurityContext, analysis: SecurityAnalysisResult): Promise<void> {
    console.log('Secure request logged:', {
      requestId: context.requestId,
      clientIP: context.clientIP,
      endpoint: context.endpoint,
      method: context.method,
      riskScore: analysis.riskScore,
      timestamp: context.timestamp
    });

    // In production, this would write to audit log
  }

  private async logMiddlewareError(error: any, request: NextRequest): Promise<void> {
    console.error('Security middleware error:', {
      error: error.message,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    });

    // In production, this would alert security team
  }

  /**
   * Log rate limit events for monitoring and abuse detection
   */
  logRateLimitEvent(context: {
    userId?: string;
    clientIP: string;
    endpoint: string;
    limitType: 'user' | 'ip';
    limit: number;
    count: number;
    blocked: boolean;
  }): void {
    const logEntry = {
      event: 'rate_limit',
      userId: context.userId,
      clientIP: context.clientIP,
      endpoint: context.endpoint,
      limitType: context.limitType,
      limit: context.limit,
      currentCount: context.count,
      blocked: context.blocked,
      timestamp: new Date().toISOString()
    };

    if (context.blocked) {
      console.warn('[RATE_LIMIT_BLOCKED]', logEntry);
    } else {
      console.log('[RATE_LIMIT_CHECK]', logEntry);
    }

    // In production, this would:
    // 1. Send to logging service (e.g., DataDog, LogRocket)
    // 2. Trigger alerts for repeated violations
    // 3. Feed into security analytics dashboard
  }
}

/**
 * Next.js middleware integration function
 */
export function createSecurityMiddleware(config?: Partial<SecurityMiddlewareConfig>) {
  const middleware = SecurityMiddleware.getInstance(config);

  return async function securityMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
    const result = await middleware.handleRequest(request);
    return result || undefined;
  };
}

/**
 * API route wrapper for security integration
 */
export function withSecurityMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<SecurityMiddlewareConfig>
) {
  const middleware = SecurityMiddleware.getInstance(config);

  return async function securityWrappedHandler(req: NextRequest): Promise<NextResponse> {
    // Run security check first
    const securityResult = await middleware.handleRequest(req);
    if (securityResult) {
      return securityResult; // Security blocked the request
    }

    // Security passed - continue to original handler
    return handler(req);
  };
}