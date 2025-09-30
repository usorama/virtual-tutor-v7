'use client';

/**
 * TranscriptionInput Component
 *
 * Secure input component for transcription with:
 * - Input validation
 * - Length limits
 * - Rate limiting awareness
 * - XSS detection
 *
 * Security: SEC-001
 * Based on: OWASP Input Validation Best Practices
 */

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send } from 'lucide-react';
import { sanitizeText, detectXssAttempt } from '@/lib/security/input-sanitization';

/**
 * Props for the TranscriptionInput component
 */
export interface TranscriptionInputProps {
  /** Callback function called when user submits input */
  readonly onSubmit?: (content: string) => void;
  /** Maximum allowed length for input (default: 5000) */
  readonly maxLength?: number;
  /** Placeholder text for the input field */
  readonly placeholder?: string;
  /** Whether the input is disabled */
  readonly disabled?: boolean;
  /** Additional CSS classes */
  readonly className?: string;
}

/**
 * TranscriptionInput - Secure input component for transcription
 *
 * @example
 * ```tsx
 * <TranscriptionInput
 *   onSubmit={(content) => console.log('Submitted:', content)}
 *   maxLength={1000}
 *   placeholder="Type your message..."
 * />
 * ```
 */
export function TranscriptionInput({
  onSubmit,
  maxLength = 5000,
  placeholder = 'Type your message...',
  disabled = false,
  className = ''
}: TranscriptionInputProps): React.ReactElement {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate input for security and length constraints
   *
   * This function performs two key security checks:
   * 1. Length validation - prevents DoS via oversized input
   * 2. XSS detection - identifies and blocks malicious content
   *
   * Educational Note: We validate BEFORE submission but sanitize AFTER.
   * This prevents attackers from testing payloads but ensures clean output.
   */
  const validateInput = useCallback(
    (value: string): boolean => {
      // Length check - prevents DoS attacks with huge inputs
      if (value.length > maxLength) {
        setError(`Maximum length is ${maxLength} characters`);
        return false;
      }

      // XSS detection - identify malicious patterns
      const xssCheck = detectXssAttempt(value);
      if (xssCheck.detected) {
        setError('Invalid content detected. Please remove special characters.');
        console.warn('XSS attempt in input', {
          patterns: xssCheck.patterns,
          timestamp: new Date().toISOString()
        });
        return false;
      }

      setError(null);
      return true;
    },
    [maxLength]
  );

  /**
   * Handle form submission
   *
   * Educational Note: We sanitize at submission time (not on every keystroke)
   * to balance security with performance. This follows OWASP best practices.
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!input.trim() || !validateInput(input)) return;

    setIsSubmitting(true);
    try {
      // Sanitize the input before passing to callback
      const sanitized = sanitizeText(input);

      if (!sanitized.isClean) {
        console.warn('Content was sanitized', {
          threats: sanitized.threatsDetected,
          originalLength: sanitized.originalLength,
          sanitizedLength: sanitized.sanitizedLength
        });
      }

      // Call the onSubmit callback with sanitized content
      onSubmit?.(sanitized.sanitized);

      // Clear input on successful submission
      setInput('');
      setError(null);
    } catch (err) {
      setError('Failed to process input');
      console.error('Input submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [input, validateInput, onSubmit]);

  /**
   * Handle input change
   * Validates on each change to provide immediate feedback
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = e.target.value;
      setInput(newValue);
      validateInput(newValue);
    },
    [validateInput]
  );

  /**
   * Handle Enter key press for submission
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Calculate if nearing the character limit (90% threshold)
  const isNearingLimit = input.length > maxLength * 0.9;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Input Field */}
      <div className="flex items-center space-x-2">
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className={error ? 'border-red-500' : ''}
          aria-label="Transcription input"
          aria-invalid={!!error}
          aria-describedby={error ? 'input-error' : undefined}
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled || isSubmitting || !!error}
          size="icon"
          aria-label="Submit transcription"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="input-error"
          className="flex items-center space-x-2 text-red-600 text-sm"
          role="alert"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Character Counter and Status */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {input.length} / {maxLength}
        </span>
        {isNearingLimit && (
          <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">
            Approaching limit
          </Badge>
        )}
      </div>
    </div>
  );
}