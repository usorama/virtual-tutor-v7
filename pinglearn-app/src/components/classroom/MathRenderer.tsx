import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  validateLatexForXSS,
  getSecureKatexOptions,
  sanitizeMathHTML,
  reportMathXSSAttempt
} from '@/lib/security/xss-protection';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer = React.memo(function MathRenderer({
  latex,
  displayMode = true,
  className = ''
}: MathRendererProps) {
  const renderedMath = useMemo(() => {
    // SECURITY LAYER 1: XSS Validation
    const xssValidation = validateLatexForXSS(latex);
    if (!xssValidation.safe) {
      // Report to threat detector (non-blocking)
      reportMathXSSAttempt(latex, xssValidation.threats[0]?.pattern || 'unknown', {
        component: 'MathRenderer-Classroom',
        displayMode,
        threatCount: xssValidation.threats.length,
        riskScore: xssValidation.riskScore
      }).catch(console.error);

      return `<span class="text-destructive font-mono text-sm">[Math Blocked: ${xssValidation.threats[0]?.type || 'security'}]</span>`;
    }

    try {
      // SECURITY LAYER 2: Secure KaTeX Configuration
      const secureOptions = getSecureKatexOptions(displayMode);

      // Render with sanitized input and secure options
      const html = katex.renderToString(
        xssValidation.sanitized,
        secureOptions
      );

      // SECURITY LAYER 3: HTML Output Sanitization
      return sanitizeMathHTML(html);
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return `<span class="text-destructive font-mono text-sm">[Math Error: ${latex}]</span>`;
    }
  }, [latex, displayMode]);

  return (
    <div
      className={`katex-content ${displayMode ? 'text-center my-2' : 'inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedMath }}
    />
  );
});