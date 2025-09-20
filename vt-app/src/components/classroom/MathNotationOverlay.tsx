'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tldraw/tldraw';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calculator,
  X,
  Type,
  Square,
  Circle,
  Triangle,
  Plus,
  Minus,
  Equal,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import katex from 'katex';

interface MathNotationOverlayProps {
  editor: Editor | null;
  onMathInsert: (expression: string, position?: { x: number; y: number }) => void;
  className?: string;
}

interface MathTemplate {
  id: string;
  name: string;
  latex: string;
  category: 'basic' | 'algebra' | 'geometry' | 'calculus';
  icon: React.ComponentType<{ className?: string }>;
}

const mathTemplates: MathTemplate[] = [
  // Basic Operations
  { id: 'fraction', name: 'Fraction', latex: '\\frac{1}{2}', category: 'basic', icon: Hash },
  { id: 'sqrt', name: 'Square Root', latex: '\\sqrt{25}', category: 'basic', icon: Square },
  { id: 'power', name: 'Power', latex: 'x^{2}', category: 'basic', icon: Type },
  { id: 'sum', name: 'Sum', latex: '1 + 2', category: 'basic', icon: Plus },
  { id: 'diff', name: 'Difference', latex: '5 - 3', category: 'basic', icon: Minus },

  // Algebra
  { id: 'quadratic', name: 'Quadratic', latex: 'x^2 + 2x + 1 = 0', category: 'algebra', icon: Equal },
  { id: 'binomial', name: 'Binomial', latex: '(x + y)^2', category: 'algebra', icon: Type },
  { id: 'logarithm', name: 'Logarithm', latex: '\\log_2(8)', category: 'algebra', icon: Type },

  // Geometry
  { id: 'area_circle', name: 'Circle Area', latex: 'A = \\pi r^2', category: 'geometry', icon: Circle },
  { id: 'area_triangle', name: 'Triangle Area', latex: 'A = \\frac{1}{2}bh', category: 'geometry', icon: Triangle },
  { id: 'pythagorean', name: 'Pythagorean', latex: 'a^2 + b^2 = c^2', category: 'geometry', icon: Triangle },

  // Calculus
  { id: 'derivative', name: 'Derivative', latex: '\\frac{d}{dx}x^2', category: 'calculus', icon: Type },
  { id: 'integral', name: 'Integral', latex: '\\int_0^1 x^2dx', category: 'calculus', icon: Type },
  { id: 'limit', name: 'Limit', latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x}', category: 'calculus', icon: Type },
];

export function MathNotationOverlay({
  editor,
  onMathInsert,
  className
}: MathNotationOverlayProps) {
  // State
  const [isVisible, setIsVisible] = useState(false);
  const [customExpression, setCustomExpression] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [previewHTML, setPreviewHTML] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /**
   * Render LaTeX expression to HTML
   */
  const renderLatex = useCallback((latex: string): string => {
    try {
      return katex.renderToString(latex, {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return `<span style="color: red;">Invalid LaTeX: ${latex}</span>`;
    }
  }, []);

  /**
   * Update preview when custom expression changes
   */
  useEffect(() => {
    if (customExpression) {
      setPreviewHTML(renderLatex(customExpression));
    } else {
      setPreviewHTML('');
    }
  }, [customExpression, renderLatex]);

  /**
   * Get cursor position from editor
   */
  const getCursorPosition = useCallback(() => {
    if (!editor) return null;

    try {
      const viewport = editor.getViewportScreenBounds();
      const center = viewport.center;

      return {
        x: center.x,
        y: center.y
      };
    } catch (error) {
      console.error('Error getting cursor position:', error);
      return { x: 400, y: 300 }; // Default center position
    }
  }, [editor]);

  /**
   * Handle template selection
   */
  const handleTemplateSelect = useCallback((template: MathTemplate) => {
    const position = getCursorPosition();
    onMathInsert(template.latex, position || undefined);
    setIsVisible(false);
  }, [onMathInsert, getCursorPosition]);

  /**
   * Handle custom expression insertion
   */
  const handleCustomInsert = useCallback(() => {
    if (!customExpression.trim()) return;

    const position = getCursorPosition();
    onMathInsert(customExpression, position || undefined);
    setCustomExpression('');
    setIsVisible(false);
  }, [customExpression, onMathInsert, getCursorPosition]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCustomInsert();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsVisible(false);
    }
  }, [handleCustomInsert]);

  /**
   * Filter templates by category
   */
  const filteredTemplates = mathTemplates.filter(
    template => selectedCategory === 'all' || template.category === selectedCategory
  );

  /**
   * Update cursor position when editor changes
   */
  useEffect(() => {
    if (editor && isVisible) {
      const position = getCursorPosition();
      setCursorPosition(position);
    }
  }, [editor, isVisible, getCursorPosition]);

  /**
   * Focus input when visible
   */
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className={cn("gap-2", className)}
      >
        <Calculator className="h-4 w-4" />
        Math Expression
      </Button>
    );
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute top-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden",
        className
      )}
    >
      <Card className="shadow-xl border-2 bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Math Notation
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Custom Expression Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom LaTeX Expression:</label>
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={customExpression}
                onChange={(e) => setCustomExpression(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter LaTeX expression (e.g., \\frac{x}{y})"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Live Preview */}
              {previewHTML && (
                <div className="p-3 bg-muted rounded-md border">
                  <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                  <div
                    className="text-lg"
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                  />
                </div>
              )}

              <Button
                onClick={handleCustomInsert}
                disabled={!customExpression.trim()}
                size="sm"
                className="w-full"
              >
                Insert Custom Expression
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Templates:</label>
            <div className="flex gap-1 flex-wrap">
              {['basic', 'algebra', 'geometry', 'calculus'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Template Grid */}
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {filteredTemplates.map((template) => {
                const IconComponent = template.icon;
                const renderedHTML = renderLatex(template.latex);

                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 text-left border rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{template.name}</span>
                    </div>
                    <div
                      className="text-base group-hover:scale-105 transition-transform"
                      dangerouslySetInnerHTML={{ __html: renderedHTML }}
                    />
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {template.latex}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Help */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <div className="font-medium">Quick LaTeX Reference:</div>
            <div className="grid grid-cols-2 gap-1">
              <div>{"\\frac{1}{2}"} → fraction</div>
              <div>{"\\sqrt{25}"} → square root</div>
              <div>{"x^{2}"} → superscript</div>
              <div>{"x_{1}"} → subscript</div>
              <div>\\pi → π symbol</div>
              <div>\\alpha → α symbol</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}