import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        trust: true,
        strict: false,
        // Additional options for better educational rendering
        fleqn: false, // Center equations
        macros: {
          // Add common educational macros
          '\\dfrac': '\\frac',
          '\\tfrac': '\\frac'
        }
      });
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