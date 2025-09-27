'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BookOpen, Lightbulb, Calculator,
  FileText, Hash, Sparkles, Copy, Printer, Download, Share2, Check
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  isLive?: boolean;
  wordCount?: number;
  isLoading?: boolean;
}

export function NotesPanel({
  sessionId,
  keyConcepts = [],
  examples = [],
  summary = [],
  className = '',
  isLive = false,
  wordCount = 0,
  isLoading = false
}: NotesPanelProps) {
  const [copiedState, setCopiedState] = useState<'copy' | 'copied' | 'error'>('copy');
  const notesContentRef = useRef<HTMLDivElement>(null);

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

  // Check if we have any content to display (real or mock)
  const hasNotes = displayKeyConcepts.length > 0 || displayExamples.length > 0 || displaySummary.length > 0;

  // Copy notes to clipboard function
  const copyNotesToClipboard = useCallback(async () => {
    try {
      const notesContent = generateNotesText();
      await navigator.clipboard.writeText(notesContent);
      setCopiedState('copied');
      toast.success('Notes copied to clipboard!');
      setTimeout(() => setCopiedState('copy'), 2000);
    } catch (error) {
      setCopiedState('error');
      toast.error('Failed to copy notes');
      setTimeout(() => setCopiedState('copy'), 2000);
    }
  }, [displayKeyConcepts, displayExamples, displaySummary]);

  // Generate plain text version of notes
  const generateNotesText = () => {
    let text = '📚 Smart Learning Notes\n';
    text += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

    if (displayKeyConcepts.length > 0) {
      text += '📌 Key Concepts\n';
      displayKeyConcepts.forEach(concept => {
        text += `• ${concept.content}`;
        if (concept.latex) text += `: ${concept.latex}`;
        text += '\n';
      });
      text += '\n';
    }

    if (displayExamples.length > 0) {
      text += '🔢 Examples & Practice\n';
      displayExamples.forEach((example, index) => {
        if (example.content.startsWith('Example')) {
          text += `${example.content}`;
          if (example.latex) text += `: ${example.latex}`;
          text += '\n';
        } else {
          text += `  ${example.content}`;
          if (example.latex) text += `: ${example.latex}`;
          text += '\n';
        }
      });
      text += '\n';
    }

    if (displaySummary.length > 0) {
      text += '💡 Quick Summary\n';
      text += 'Today we learned:\n';
      displaySummary.forEach(item => {
        text += `✓ ${item}\n`;
      });
    }

    return text;
  };

  // Handle print - only notes content
  const handlePrint = () => {
    if (!notesContentRef.current) return;

    // Create a print window with only notes content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open print dialog');
      return;
    }

    const notesHTML = generateNotesText();
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PingLearn Smart Notes</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          h1 { color: #06B6D4; margin-bottom: 20px; }
          h2 { color: #333; margin-top: 30px; margin-bottom: 15px; }
          pre { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <pre>${notesHTML}</pre>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Handle export - download as text file
  const handleExport = () => {
    const notesContent = generateNotesText();
    const blob = new Blob([notesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PingLearn_Notes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Notes exported successfully!');
  };

  // Handle share - use Web Share API if available
  const handleShare = async () => {
    const notesContent = generateNotesText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PingLearn Smart Notes',
          text: notesContent
        });
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as any).name !== 'AbortError') {
          toast.error('Failed to share notes');
        }
      }
    } else {
      // Fallback: copy to clipboard
      await copyNotesToClipboard();
      toast.info('Notes copied to clipboard for sharing');
    }
  };

  return (
    <div className={cn("h-full bg-background/80 dark:bg-background/60 overflow-hidden", className)}>
      <ScrollArea className="h-full">
          <div className="px-4 pt-3 pb-4 prose prose-sm max-w-none text-foreground">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">📚 Smart Learning Notes</h2>
              {isLive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                  • Live
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isLive ? 'Auto-generating from your learning session' : 'Auto-captured from your learning session'}
            </p>
          </div>

          {/* Key Concepts Section */}
          {displayKeyConcepts.length > 0 && (
            <section className="mb-6">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                📌 Key Concepts
              </h3>
              <div className="space-y-3 ml-4">
                {displayKeyConcepts.map((concept) => (
                  <div key={concept.id} className="text-sm">
                    {concept.type === 'definition' && (
                      <div className="flex items-start gap-3">
                        <span className="text-blue-400 mt-1">•</span>
                        <div className="flex-1">
                          <span className="font-medium">{concept.content}:</span>
                          {concept.latex && (
                            <div className="mt-2">
                              <MathRenderer latex={concept.latex} displayMode={false} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {concept.type === 'formula' && (
                      <div className="flex items-start gap-3">
                        <Hash className="w-3 h-3 text-green-400 mt-1" />
                        <div className="flex-1">
                          <span className="font-medium">{concept.content}:</span>
                          {concept.latex && (
                            <div className="mt-2">
                              <MathRenderer latex={concept.latex} displayMode={false} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {concept.type === 'tip' && (
                      <div className="flex items-start gap-3 ml-4">
                        <span className="text-yellow-400 mt-0.5">→</span>
                        <span className="text-foreground/80 text-sm">{concept.content}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Examples & Practice Section */}
          {displayExamples.length > 0 && (
            <section className="mb-6">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-400" />
                🔢 Examples & Practice
              </h3>
              <div className="space-y-3 ml-4">
                {displayExamples.map((example, index) => (
                  <div key={example.id} className="text-sm">
                    {example.content.startsWith('Example') ? (
                      <div className="font-semibold text-purple-400 mb-2">
                        {example.content}
                        {example.latex && (
                          <div className="mt-2">
                            <MathRenderer latex={example.latex} displayMode={false} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 ml-2">
                        <span className="text-purple-300/60 mt-0.5">•</span>
                        <div className="flex-1">
                          <span className="text-foreground/90">{example.content}</span>
                          {example.latex && (
                            <div className="mt-1">
                              <MathRenderer latex={example.latex} displayMode={false} className="text-purple-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Summary Section */}
          {displaySummary.length > 0 && (
            <section className="mb-6">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                💡 Quick Summary
              </h3>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Today we learned:
                </p>
                <div className="space-y-2">
                  {displaySummary.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Sparkles className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Action buttons - ChatGPT/Claude pattern: appear after content generation */}
          <AnimatePresence>
            {!isLoading && hasNotes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ delay: 0.3, duration: 0.2 }}
                className="mt-8 pt-4 border-t border-white/10"
              >
                <div className="flex items-center justify-start">
                  {/* Action buttons on the left with Framer Motion hover effects */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyNotesToClipboard}
                      className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      disabled={copiedState === 'copied'}
                      title={copiedState === 'copied' ? 'Copied!' : 'Copy notes'}
                      initial={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}
                      transition={{ duration: 0.2 }}
                    >
                      {copiedState === 'copied' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrint}
                      className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      title="Print notes"
                      initial={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Printer className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleExport}
                      className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      title="Export notes"
                      initial={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                      title="Share notes"
                      initial={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
      </ScrollArea>
    </div>
  );
}