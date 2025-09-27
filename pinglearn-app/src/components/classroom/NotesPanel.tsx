'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  BookOpen, Lightbulb, Calculator,
  FileText, Hash, Sparkles
} from 'lucide-react';

interface Note {
  id: string;
  content: string;
  type: 'definition' | 'formula' | 'example' | 'tip';
  latex?: string;
}

interface NotesPanelProps {
  sessionId?: string;
  keyConcepts?: Note[];
  examples?: Note[];
  summary?: string[];
  className?: string;
}

export function NotesPanel({
  sessionId,
  keyConcepts = [],
  examples = [],
  summary = [],
  className = ''
}: NotesPanelProps) {
  // Glassmorphic card component
  const GlassCard = ({
    children,
    className: cardClassName = '',
    title,
    icon
  }: {
    children: React.ReactNode;
    className?: string;
    title: string;
    icon: React.ReactNode;
  }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/[0.02] dark:bg-white/[0.05]",
        "backdrop-blur-md backdrop-saturate-150",
        "border border-white/[0.05] dark:border-white/[0.08]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        cardClassName
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );

  // Mock data for demonstration (will be replaced with real data from session)
  const mockKeyConcepts: Note[] = [
    {
      id: '1',
      content: 'Quadratic equation',
      type: 'definition',
      latex: 'ax^2 + bx + c = 0'
    },
    {
      id: '2',
      content: 'Discriminant',
      type: 'formula',
      latex: 'D = b^2 - 4ac'
    },
    {
      id: '3',
      content: 'When D > 0: Two distinct real roots',
      type: 'tip'
    },
    {
      id: '4',
      content: 'When D = 0: One real root (repeated)',
      type: 'tip'
    },
    {
      id: '5',
      content: 'When D < 0: No real roots',
      type: 'tip'
    }
  ];

  const mockExamples: Note[] = [
    {
      id: 'e1',
      content: 'Example 1',
      type: 'example',
      latex: 'x^2 + 5x + 6 = 0'
    },
    {
      id: 'e2',
      content: 'Step 1: Identify coefficients',
      type: 'example',
      latex: 'a=1, b=5, c=6'
    },
    {
      id: 'e3',
      content: 'Step 2: Calculate discriminant',
      type: 'example',
      latex: 'D = 25 - 24 = 1'
    },
    {
      id: 'e4',
      content: 'Step 3: Find roots',
      type: 'example',
      latex: 'x = -2, -3'
    }
  ];

  const mockSummary = [
    'Identified quadratic equation forms',
    'Learned discriminant formula',
    'Practiced finding roots systematically',
    'Understood relationship between discriminant and nature of roots'
  ];

  const displayKeyConcepts = keyConcepts.length > 0 ? keyConcepts : mockKeyConcepts;
  const displayExamples = examples.length > 0 ? examples : mockExamples;
  const displaySummary = summary.length > 0 ? summary : mockSummary;

  return (
    <div className={cn("flex flex-col h-full bg-background/80 dark:bg-background/60", className)}>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                AI-Generated Study Notes
              </span>
            </div>
            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Auto-captured from your learning session
              </p>
            )}
          </div>

          {/* Key Concepts Section */}
          <GlassCard
            title="📌 Key Concepts"
            icon={<BookOpen className="w-4 h-4 text-blue-400" />}
          >
            <div className="space-y-2">
              {displayKeyConcepts.map((concept) => (
                <div key={concept.id} className="text-sm">
                  {concept.type === 'definition' && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <div>
                        <span className="text-foreground/90">{concept.content}:</span>
                        {concept.latex && (
                          <div className="mt-1 font-mono text-primary/80 bg-primary/10 px-2 py-1 rounded inline-block">
                            {concept.latex}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {concept.type === 'formula' && (
                    <div className="flex items-start gap-2">
                      <Hash className="w-3 h-3 text-green-400 mt-0.5" />
                      <div>
                        <span className="text-foreground/90">{concept.content}:</span>
                        {concept.latex && (
                          <div className="mt-1 font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded inline-block">
                            {concept.latex}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {concept.type === 'tip' && (
                    <div className="flex items-start gap-2 ml-4">
                      <span className="text-yellow-400">→</span>
                      <span className="text-foreground/70 text-xs">{concept.content}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Examples & Practice Section */}
          <GlassCard
            title="🔢 Examples & Practice"
            icon={<Calculator className="w-4 h-4 text-purple-400" />}
          >
            <div className="space-y-2">
              {displayExamples.map((example, index) => (
                <div key={example.id} className="text-sm">
                  {example.content.startsWith('Example') ? (
                    <div className="font-medium text-purple-400 mb-1">
                      {example.content}: {example.latex && (
                        <span className="font-mono">{example.latex}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 ml-2">
                      <span className="text-purple-300/60">•</span>
                      <div>
                        <span className="text-foreground/80">{example.content}</span>
                        {example.latex && (
                          <span className="ml-2 font-mono text-purple-300 bg-purple-400/10 px-2 py-0.5 rounded text-xs">
                            {example.latex}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Summary Section */}
          <GlassCard
            title="💡 Quick Summary"
            icon={<Lightbulb className="w-4 h-4 text-yellow-400" />}
          >
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                Today we learned:
              </p>
              {displaySummary.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Notes Footer */}
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              📚 These notes will be saved automatically when the session ends
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}