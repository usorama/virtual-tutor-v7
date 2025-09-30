'use client';

/**
 * Math Renderer Component
 * Renders LaTeX math expressions using KaTeX
 * Handles both inline and display math with error boundaries
 * OPTIMIZED: Memoization, async rendering, and caching
 * SECURITY: XSS protection via multi-layered validation (SEC-002)
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  validateLatexForXSS,
  getSecureKatexOptions,
  sanitizeMathHTML,
  reportMathXSSAttempt
} from '@/lib/security/xss-protection';

// Math rendering cache to avoid re-rendering identical equations
const mathCache = new Map<string, { html: string; error: string | null }>();
const MAX_CACHE_SIZE = 100; // Prevent memory leaks by limiting cache size

// Cache cleanup function
const cleanupCache = () => {
  if (mathCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries (keep last 50)
    const entries = Array.from(mathCache.entries());
    mathCache.clear();
    entries.slice(-50).forEach(([key, value]) => {
      mathCache.set(key, value);
    });
  }
};

interface MathRendererProps {
  latex: string;
  display?: boolean;
  highlighted?: boolean;
  className?: string;
}

export function MathRenderer({
  latex,
  display = false,
  highlighted = false,
  className = ''
}: MathRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mathHtml, setMathHtml] = useState<string>('');

  // Create cache key for memoization
  const cacheKey = useMemo(() => `${latex}:${display}`, [latex, display]);

  // Check cache first
  const cachedResult = useMemo(() => mathCache.get(cacheKey), [cacheKey]);

  useEffect(() => {
    // Return cached result immediately if available
    if (cachedResult) {
      setMathHtml(cachedResult.html);
      setError(cachedResult.error);
      setIsLoaded(true);
      return;
    }

    // Reset state for new rendering
    setIsLoaded(false);
    setError(null);

    // Async math rendering to avoid blocking UI
    const renderMathAsync = async () => {
      try {
        // SECURITY LAYER 1: XSS Validation (before KaTeX)
        const xssValidation = validateLatexForXSS(latex);
        if (!xssValidation.safe) {
          // Report to threat detector
          await reportMathXSSAttempt(latex, xssValidation.threats[0]?.pattern || 'unknown', {
            component: 'MathRenderer-Transcription',
            display,
            threatCount: xssValidation.threats.length,
            riskScore: xssValidation.riskScore
          });

          // Block rendering, show security error
          const errorMsg = `Math expression blocked for security: ${xssValidation.threats[0]?.type || 'suspicious content'}`;
          mathCache.set(cacheKey, { html: latex, error: errorMsg });
          cleanupCache();

          setError(errorMsg);
          setMathHtml(latex); // Fallback: display raw LaTeX
          setIsLoaded(true);
          return;
        }

        const katex = await import('katex');

        // Use requestIdleCallback for non-blocking rendering when available
        const renderFunction = window.requestIdleCallback || ((callback) => {
          setTimeout(callback, 0);
        });

        renderFunction(() => {
          try {
            // SECURITY LAYER 2: Secure KaTeX Configuration
            const secureOptions = getSecureKatexOptions(display);

            // Use renderToString with SECURE options and SANITIZED input
            const html = katex.default.renderToString(
              xssValidation.sanitized, // Use sanitized LaTeX
              secureOptions
            );

            // SECURITY LAYER 3: HTML Output Sanitization
            const sanitizedHtml = sanitizeMathHTML(html);

            // Cache the sanitized result with cleanup
            mathCache.set(cacheKey, { html: sanitizedHtml, error: null });
            cleanupCache();

            setMathHtml(sanitizedHtml);
            setIsLoaded(true);
            setError(null);
          } catch (err) {
            const errorMsg = `Math rendering error: ${err}`;
            console.error('KaTeX rendering error:', err);

            // Cache the error result with cleanup
            mathCache.set(cacheKey, { html: latex, error: errorMsg });
            cleanupCache();

            setError(errorMsg);
            setMathHtml(latex); // Fallback: display raw LaTeX
            setIsLoaded(true);
          }
        });
      } catch (err) {
        const errorMsg = 'Failed to load math renderer';
        console.error('Failed to load KaTeX:', err);

        // Cache the loading error with cleanup
        mathCache.set(cacheKey, { html: latex, error: errorMsg });
        cleanupCache();

        setError(errorMsg);
        setMathHtml(latex); // Fallback: display raw LaTeX
        setIsLoaded(true);
      }
    };

    renderMathAsync();
  }, [latex, display, cacheKey, cachedResult]);

  const containerClasses = [
    'math-renderer',
    display ? 'text-center my-4' : 'inline-block mx-1',
    highlighted ? 'transition-transform scale-105' : '',
    error ? 'text-red-600 font-mono text-sm' : '',
    !isLoaded && !error ? 'opacity-50' : 'opacity-100 transition-opacity',
    className
  ].filter(Boolean).join(' ');

  if (isLoaded && !error && mathHtml) {
    return (
      <span
        className={containerClasses}
        role="math"
        aria-label={`Mathematical expression: ${latex}`}
        dangerouslySetInnerHTML={{ __html: mathHtml }}
      />
    );
  }

  return (
    <span
      className={containerClasses}
      role="math"
      aria-label={`Mathematical expression: ${latex}`}
    >
      {!isLoaded && !error && (
        <span className="text-gray-400">Loading math...</span>
      )}
      {error && (
        <span className="text-red-600">{error}</span>
      )}
    </span>
  );
}

/**
 * Math Error Boundary
 * Catches errors in math rendering and displays fallback
 */
export class MathErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Math rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-600 p-2 border border-red-300 rounded bg-red-50">
          <p className="font-semibold">Math rendering error</p>
          <p className="text-sm mt-1">
            {this.state.error?.message || 'Unable to render mathematical expression'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Utility function to detect math expressions in text
 */
export function detectMathExpressions(text: string): {
  type: 'text' | 'math';
  content: string;
  display: boolean;
}[] {
  const segments: { type: 'text' | 'math'; content: string; display: boolean }[] = [];

  // Pattern for display math $$...$$
  const displayMathRegex = /\$\$(.*?)\$\$/g;
  // Pattern for inline math $...$
  const inlineMathRegex = /\$(.*?)\$/g;

  const lastIndex = 0;
  const processedText = text;

  // First, extract display math
  let match;
  const displayMatches: { start: number; end: number; content: string }[] = [];

  while ((match = displayMathRegex.exec(text)) !== null) {
    displayMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1]
    });
  }

  // Process the text, extracting both display and inline math
  let currentIndex = 0;

  for (const displayMatch of displayMatches) {
    // Add text before display math
    if (currentIndex < displayMatch.start) {
      const textBefore = text.substring(currentIndex, displayMatch.start);

      // Check for inline math in this text segment
      const inlineSegments = extractInlineMath(textBefore);
      segments.push(...inlineSegments);
    }

    // Add display math
    segments.push({
      type: 'math',
      content: displayMatch.content,
      display: true
    });

    currentIndex = displayMatch.end;
  }

  // Process remaining text after last display math
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    const inlineSegments = extractInlineMath(remainingText);
    segments.push(...inlineSegments);
  }

  // If no display math was found, process the entire text for inline math
  if (displayMatches.length === 0) {
    const inlineSegments = extractInlineMath(text);
    segments.push(...inlineSegments);
  }

  return segments;
}

/**
 * Extract inline math from text
 */
function extractInlineMath(text: string): {
  type: 'text' | 'math';
  content: string;
  display: boolean;
}[] {
  const segments: { type: 'text' | 'math'; content: string; display: boolean }[] = [];
  const inlineMathRegex = /\$(.*?)\$/g;

  let lastIndex = 0;
  let match;

  while ((match = inlineMathRegex.exec(text)) !== null) {
    // Add text before math
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
        display: false
      });
    }

    // Add inline math
    segments.push({
      type: 'math',
      content: match[1],
      display: false
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
      display: false
    });
  }

  // If no math found, return the entire text as a single segment
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: text,
      display: false
    });
  }

  return segments;
}