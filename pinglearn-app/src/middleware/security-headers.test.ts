/**
 * Security Headers Module Tests (SEC-012)
 *
 * Comprehensive test suite for security headers configuration utilities.
 * Tests nonce generation, CSP directive building, and environment-specific configurations.
 */

import { describe, it, expect } from 'vitest';
import {
  generateNonce,
  getCSPDirectives,
  buildCSP,
  getCSPHeaderName,
  getExternalDomains
} from './security-headers';

describe('Security Headers Module', () => {
  describe('generateNonce', () => {
    it('generates unique nonces on each call', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      const nonce3 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
      expect(nonce2).not.toBe(nonce3);
      expect(nonce1).not.toBe(nonce3);
    });

    it('generates valid base64 strings', () => {
      const nonce = generateNonce();

      // Base64 regex: alphanumeric + + / and optional = padding
      expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('generates nonces of consistent length', () => {
      const nonces = Array.from({ length: 10 }, () => generateNonce());
      const lengths = nonces.map(n => n.length);

      // All nonces should have same length (UUID base64 is always 48 chars)
      expect(new Set(lengths).size).toBe(1);
      expect(lengths[0]).toBe(48);
    });

    it('generates nonces that are not empty', () => {
      const nonce = generateNonce();
      expect(nonce.length).toBeGreaterThan(0);
    });
  });

  describe('getExternalDomains', () => {
    it('returns all required service domains', () => {
      const domains = getExternalDomains();

      expect(domains).toHaveProperty('supabase');
      expect(domains).toHaveProperty('livekit');
      expect(domains).toHaveProperty('sentry');
      expect(domains).toHaveProperty('gemini');
    });

    it('includes Supabase domains for database and realtime', () => {
      const domains = getExternalDomains();

      expect(domains.supabase).toContain('https://*.supabase.co');
      expect(domains.supabase).toContain('wss://*.supabase.co');
    });

    it('includes LiveKit domains for voice services', () => {
      const domains = getExternalDomains();

      expect(domains.livekit).toContain('https://*.livekit.cloud');
      expect(domains.livekit).toContain('wss://*.livekit.cloud');
    });

    it('includes Sentry domain for error tracking', () => {
      const domains = getExternalDomains();

      expect(domains.sentry).toContain('https://*.sentry.io');
    });

    it('includes Gemini AI domain', () => {
      const domains = getExternalDomains();

      expect(domains.gemini).toContain('https://generativelanguage.googleapis.com');
    });
  });

  describe('getCSPDirectives', () => {
    it('includes nonce in script-src directive', () => {
      const directives = getCSPDirectives({
        nonce: 'test-nonce-123',
        isDevelopment: false
      });

      expect(directives['script-src']).toContain("'nonce-test-nonce-123'");
    });

    it('includes self in script-src directive', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['script-src']).toContain("'self'");
    });

    it('includes unsafe-eval in development mode', () => {
      const devDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: true
      });

      expect(devDirectives['script-src']).toContain("'unsafe-eval'");
    });

    it('does not include unsafe-eval in production', () => {
      const prodDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(prodDirectives['script-src']).not.toContain("'unsafe-eval'");
    });

    it('includes strict-dynamic in production', () => {
      const prodDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(prodDirectives['script-src']).toContain("'strict-dynamic'");
    });

    it('does not include strict-dynamic in development', () => {
      const devDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: true
      });

      expect(devDirectives['script-src']).not.toContain("'strict-dynamic'");
    });

    it('includes unsafe-inline in style-src for KaTeX', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['style-src']).toContain("'unsafe-inline'");
    });

    it('includes nonce in style-src directive', () => {
      const directives = getCSPDirectives({
        nonce: 'test-nonce-456',
        isDevelopment: false
      });

      expect(directives['style-src']).toContain("'nonce-test-nonce-456'");
    });

    it('allows data URIs in img-src for KaTeX', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['img-src']).toContain('data:');
    });

    it('allows blob URIs in img-src', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['img-src']).toContain('blob:');
    });

    it('allows data URIs in font-src for KaTeX', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['font-src']).toContain('data:');
    });

    it('includes all external domains in connect-src', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      const connectSrc = directives['connect-src'];

      // Supabase
      expect(connectSrc).toContain('https://*.supabase.co');
      expect(connectSrc).toContain('wss://*.supabase.co');

      // LiveKit
      expect(connectSrc).toContain('https://*.livekit.cloud');
      expect(connectSrc).toContain('wss://*.livekit.cloud');

      // Sentry
      expect(connectSrc).toContain('https://*.sentry.io');

      // Gemini
      expect(connectSrc).toContain('https://generativelanguage.googleapis.com');
    });

    it('sets frame-ancestors to none (prevent clickjacking)', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['frame-ancestors']).toEqual(["'none'"]);
    });

    it('sets base-uri to self only', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['base-uri']).toEqual(["'self'"]);
    });

    it('sets form-action to self only', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['form-action']).toEqual(["'self'"]);
    });

    it('sets object-src to none', () => {
      const directives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(directives['object-src']).toEqual(["'none'"]);
    });

    it('includes upgrade-insecure-requests in production', () => {
      const prodDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: false
      });

      expect(prodDirectives).toHaveProperty('upgrade-insecure-requests');
      expect(prodDirectives['upgrade-insecure-requests']).toEqual([]);
    });

    it('does not include upgrade-insecure-requests in development', () => {
      const devDirectives = getCSPDirectives({
        nonce: 'test',
        isDevelopment: true
      });

      expect(devDirectives).not.toHaveProperty('upgrade-insecure-requests');
    });
  });

  describe('buildCSP', () => {
    it('builds valid CSP string from directives', () => {
      const csp = buildCSP({
        nonce: 'test-nonce',
        isDevelopment: false
      });

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src");
      expect(csp).toContain("'nonce-test-nonce'");
    });

    it('separates directives with semicolons', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });

      // Should have multiple semicolons separating directives
      const semicolonCount = (csp.match(/;/g) || []).length;
      expect(semicolonCount).toBeGreaterThan(5);
    });

    it('does not have trailing semicolon', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });

      expect(csp).not.toMatch(/;\s*$/);
    });

    it('formats directives with values correctly', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });

      // Check format: "directive value1 value2; directive value3"
      expect(csp).toMatch(/default-src 'self'/);
      expect(csp).toMatch(/script-src 'self'/);
      expect(csp).toMatch(/frame-ancestors 'none'/);
    });

    it('handles directives with no values (upgrade-insecure-requests)', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });

      // upgrade-insecure-requests should appear alone without values
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).not.toContain("upgrade-insecure-requests 'self'");
    });

    it('includes all required directives in development', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: true
      });

      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
      expect(csp).toContain('font-src');
      expect(csp).toContain('connect-src');
      expect(csp).toContain('frame-ancestors');
      expect(csp).toContain('base-uri');
      expect(csp).toContain('form-action');
      expect(csp).toContain('object-src');
    });

    it('includes all required directives in production', () => {
      const csp = buildCSP({
        nonce: 'test',
        isDevelopment: false
      });

      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('img-src');
      expect(csp).toContain('font-src');
      expect(csp).toContain('connect-src');
      expect(csp).toContain('frame-ancestors');
      expect(csp).toContain('base-uri');
      expect(csp).toContain('form-action');
      expect(csp).toContain('object-src');
      expect(csp).toContain('upgrade-insecure-requests');
    });
  });

  describe('getCSPHeaderName', () => {
    it('returns report-only header in development', () => {
      const headerName = getCSPHeaderName({
        nonce: 'test',
        isDevelopment: true
      });

      expect(headerName).toBe('Content-Security-Policy-Report-Only');
    });

    it('returns enforcing header in production', () => {
      const headerName = getCSPHeaderName({
        nonce: 'test',
        isDevelopment: false
      });

      expect(headerName).toBe('Content-Security-Policy');
    });

    it('returns report-only header when reportOnly is true', () => {
      const headerName = getCSPHeaderName({
        nonce: 'test',
        isDevelopment: false,
        reportOnly: true
      });

      expect(headerName).toBe('Content-Security-Policy-Report-Only');
    });

    it('returns report-only header in development even with reportOnly false', () => {
      const headerName = getCSPHeaderName({
        nonce: 'test',
        isDevelopment: true,
        reportOnly: false
      });

      // Development should override reportOnly
      expect(headerName).toBe('Content-Security-Policy-Report-Only');
    });
  });
});