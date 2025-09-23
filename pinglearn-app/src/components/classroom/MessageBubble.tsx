import React, { useMemo } from 'react';
import { MathRenderer } from './MathRenderer';
import { WordHighlighter } from './WordHighlighter';
import { ProgressiveMath } from './ProgressiveMath';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import type { DisplayItem } from '@/protected-core/contracts/transcription.contract';

interface MessageBubbleProps {
  message: DisplayItem;
  enableWordTiming?: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  enableWordTiming = false
}: MessageBubbleProps) {
  const isTeacher = message.speaker === 'teacher';
  const isStudent = message.speaker === 'student';

  const renderContent = useMemo(() => {
    // PC-013: If word timing is available and enabled
    if (enableWordTiming && message.wordTimings && message.wordTimings.length > 0) {
      return <WordHighlighter item={message} />;
    }

    // PC-013: Progressive math rendering if fragments available
    if (message.mathFragments) {
      return (
        <ProgressiveMath
          fragments={message.mathFragments}
          fullLatex={message.content}
          timingOffset={message.audioSyncOffset}
        />
      );
    }

    // Math content - check both type field and content patterns
    if (message.type === 'math' || isValidMathContent(message.content)) {
      return <MathRenderer latex={message.content} />;
    }

    // Regular content with potential inline math
    // Support both contentHtml (processed) and content (raw)
    const htmlContent = (message.metadata?.contentHtml as string) || message.content;

    return (
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{
          __html: htmlContent
        }}
      />
    );
  }, [message, enableWordTiming]);

  // Simple math detection helper
  function isValidMathContent(content: string): boolean {
    const cleanContent = content.trim();

    // Reject simple concatenated words
    if (/^[a-zA-Z]+$/.test(cleanContent) && cleanContent.length > 3) {
      return false;
    }

    // Look for math indicators
    const mathPatterns = [
      /[\+\-\*\/\=\(\)\[\]\{\}]/,  // Math operators and brackets
      /\\[a-zA-Z]+/,                // LaTeX commands
      /\$.*\$/,                     // Dollar-wrapped math
      /[∑∏∫∂∇√∞≠≤≥±×÷]/,          // Math symbols
      /^\d+[\+\-\*\/\=]/,          // Number followed by operator
      /[a-z]\s*[\+\-\*\/\=]\s*[a-z0-9]/ // Variable equations
    ];

    return mathPatterns.some(pattern => pattern.test(cleanContent));
  }

  return (
    <div className={`flex gap-3 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={isTeacher ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
          {isTeacher ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 space-y-1 ${isStudent ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">
            {isTeacher ? 'AI Teacher' : 'You'}
          </span>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className={`rounded-lg p-3 max-w-[85%] ${
          isTeacher
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground ml-auto'
        }`}>
          {renderContent}
        </div>
      </div>
    </div>
  );
});