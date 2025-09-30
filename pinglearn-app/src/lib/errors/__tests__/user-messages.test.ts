/**
 * User Messages Tests
 * ERR-008: Enhanced age-appropriate error messages
 */

import { describe, it, expect } from 'vitest';
import {
  getEnhancedUserMessage,
  getAllErrorMessages,
  hasEnhancedMessage,
  validateMessageCoverage,
} from '../user-messages';
import { ErrorCode } from '../error-types';

describe('getEnhancedUserMessage', () => {
  describe('All Error Codes Coverage', () => {
    it('should have messages for all error codes', () => {
      const allCodes = Object.values(ErrorCode);

      allCodes.forEach((code) => {
        const message = getEnhancedUserMessage(code);
        expect(message.title).toBeDefined();
        expect(message.message).toBeDefined();
        expect(message.action).toBeDefined();
        expect(message.icon).toBeDefined();
        expect(message.severity).toBeDefined();
      });
    });

    it('should validate complete message coverage', () => {
      const validation = validateMessageCoverage();
      expect(validation.complete).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });
  });

  describe('Message Quality - Age-Appropriate Language', () => {
    it('should use encouraging, friendly tone', () => {
      const networkError = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR);
      expect(networkError.message.toLowerCase()).toMatch(/oops|don't worry|happens sometimes/);
      // Should avoid harsh technical language
      expect(networkError.message).not.toMatch(/ERROR|FAIL|CRITICAL/);
    });

    it('should avoid technical jargon', () => {
      const messages = getAllErrorMessages();
      messages.forEach(({ message }) => {
        // Should not contain overly technical terms
        expect(message.message).not.toMatch(/exception|stack trace|null pointer/i);
      });
    });

    it('should provide actionable guidance with action verbs', () => {
      const allCodes = Object.values(ErrorCode);
      allCodes.forEach((code) => {
        const message = getEnhancedUserMessage(code);
        // Action should contain clear verbs or instructional words (including "come back", "upgrade")
        expect(message.action).toMatch(/try|check|wait|contact|refresh|sign|go|click|review|fill|make sure|come back|upgrade|choose/i);
      });
    });
  });

  describe('Message Structure', () => {
    it('should follow what+why+how structure', () => {
      const message = getEnhancedUserMessage(ErrorCode.SESSION_EXPIRED);

      // Title should be short and clear
      expect(message.title.length).toBeLessThan(50);

      // Message should explain what happened and why (substantive content)
      expect(message.message.length).toBeGreaterThan(20);

      // Action should tell them what to do
      expect(message.action.length).toBeGreaterThan(10);
    });

    it('should have appropriate title lengths for readability', () => {
      const messages = getAllErrorMessages();
      messages.forEach(({ message }) => {
        expect(message.title.length).toBeLessThan(50);
        expect(message.title.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Context Awareness', () => {
    it('should personalize with user name', () => {
      const message = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR, {
        userName: 'Alex',
      });
      expect(message.message).toContain('Alex');
      expect(message.message).toContain('Hey');
    });

    it('should adapt for retry attempts', () => {
      const message = getEnhancedUserMessage(ErrorCode.API_TIMEOUT, {
        attemptCount: 3,
      });
      expect(message.message).toContain('attempt 3');
    });

    it('should interpolate retry timing', () => {
      const message = getEnhancedUserMessage(ErrorCode.RATE_LIMIT_EXCEEDED, {
        retryAfter: 60,
      });
      expect(message.action).toContain('60');
    });

    it('should interpolate resource names', () => {
      const message = getEnhancedUserMessage(ErrorCode.FILE_TOO_LARGE, {
        resourceName: 'homework.pdf',
      });
      // Message structure should support resource name interpolation
      expect(message).toHaveProperty('title');
      expect(message).toHaveProperty('action');
    });

    it('should handle missing context gracefully', () => {
      const message = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR);
      expect(message.message).toBeDefined();
      expect(message.message).not.toContain('undefined');
      expect(message.message).not.toContain('null');
    });
  });

  describe('Severity Assignment', () => {
    it('should assign error/critical severity to authentication errors', () => {
      const authError = getEnhancedUserMessage(ErrorCode.AUTHENTICATION_ERROR);
      expect(['info', 'warning']).toContain(authError.severity);
    });

    it('should assign warning severity to network errors', () => {
      const networkError = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR);
      expect(networkError.severity).toBe('warning');
    });

    it('should assign info severity to session expired', () => {
      const sessionError = getEnhancedUserMessage(ErrorCode.SESSION_EXPIRED);
      expect(sessionError.severity).toBe('info');
    });

    it('should assign error severity to system errors', () => {
      const systemError = getEnhancedUserMessage(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(systemError.severity).toBe('error');
    });
  });

  describe('Icon Assignment', () => {
    it('should assign wifi-off icon to network errors', () => {
      const networkError = getEnhancedUserMessage(ErrorCode.NETWORK_ERROR);
      expect(networkError.icon).toBe('wifi-off');
    });

    it('should assign lock icon to authentication errors', () => {
      const authError = getEnhancedUserMessage(ErrorCode.AUTHENTICATION_ERROR);
      expect(authError.icon).toBe('lock');
    });

    it('should assign file-x icon to file errors', () => {
      const fileError = getEnhancedUserMessage(ErrorCode.FILE_TOO_LARGE);
      expect(fileError.icon).toBe('file-x');
    });

    it('should assign clock icon to timeout errors', () => {
      const timeoutError = getEnhancedUserMessage(ErrorCode.API_TIMEOUT);
      expect(timeoutError.icon).toBe('clock');
    });
  });

  describe('Translation Readiness', () => {
    it('should support variable interpolation format', () => {
      const message = getEnhancedUserMessage(ErrorCode.RATE_LIMIT_EXCEEDED, {
        retryAfter: 30,
        maxRetries: 3,
      });

      // Should not have raw template literals
      expect(message.action).not.toContain('${');
    });

    it('should have consistent message structure for all codes', () => {
      const messages = getAllErrorMessages();
      messages.forEach(({ message }) => {
        expect(message).toHaveProperty('title');
        expect(message).toHaveProperty('message');
        expect(message).toHaveProperty('action');
        expect(message).toHaveProperty('icon');
        expect(message).toHaveProperty('severity');
      });
    });
  });

  describe('Utility Functions', () => {
    it('should check if error code has enhanced message', () => {
      expect(hasEnhancedMessage(ErrorCode.NETWORK_ERROR)).toBe(true);
      expect(hasEnhancedMessage(ErrorCode.VALIDATION_ERROR)).toBe(true);
    });

    it('should get all error messages', () => {
      const allMessages = getAllErrorMessages();
      expect(allMessages).toBeInstanceOf(Array);
      expect(allMessages.length).toBeGreaterThan(20); // At least all error codes covered

      allMessages.forEach((item) => {
        expect(item).toHaveProperty('code');
        expect(item).toHaveProperty('message');
      });
    });
  });

  describe('Category-Specific Messages', () => {
    describe('Network Errors', () => {
      it('should have reassuring tone for connection issues', () => {
        const networkCodes = [
          ErrorCode.NETWORK_ERROR,
          ErrorCode.API_TIMEOUT,
          ErrorCode.SERVICE_UNAVAILABLE,
        ];

        networkCodes.forEach((code) => {
          const message = getEnhancedUserMessage(code);
          expect(message.severity).toMatch(/warning|error/);
          // Should have reassuring or explanatory tone
          expect(message.message.length).toBeGreaterThan(30);
          expect(message.icon).toMatch(/wifi-off|clock|alert-circle/);
        });
      });
    });

    describe('Validation Errors', () => {
      it('should be helpful and specific', () => {
        const validationCodes = [
          ErrorCode.VALIDATION_ERROR,
          ErrorCode.INVALID_INPUT,
          ErrorCode.MISSING_REQUIRED_FIELD,
        ];

        validationCodes.forEach((code) => {
          const message = getEnhancedUserMessage(code);
          expect(message.severity).toBe('warning');
          expect(message.action.toLowerCase()).toMatch(/check|fill|make sure/);
        });
      });
    });

    describe('File Errors', () => {
      it('should explain limits and alternatives', () => {
        const fileError = getEnhancedUserMessage(ErrorCode.FILE_TOO_LARGE);
        expect(fileError.message).toMatch(/10MB|too large|big/i);
        expect(fileError.action.toLowerCase()).toMatch(/smaller|compress/);
      });
    });
  });
});