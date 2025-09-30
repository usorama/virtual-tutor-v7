import React, { useMemo } from 'react';
import { Streamdown } from 'streamdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import 'katex/dist/katex.min.css';
import type { MathFragmentData } from '@/protected-core';

interface StreamingMessageProps {
  content: string;
  speaker: string;
  mathFragments?: MathFragmentData;
}

export const StreamingMessage = React.memo(function StreamingMessage({
  content,
  speaker,
  mathFragments
}: StreamingMessageProps) {
  const streamingIndicator = useMemo(() => {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <span className="animate-pulse">●</span>
        AI Teacher is typing...
      </span>
    );
  }, []);

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-blue-100 text-blue-600">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">AI Teacher</span>
          {streamingIndicator}
        </div>

        <div className="bg-muted text-foreground rounded-lg p-3 max-w-[85%]">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown
              parseIncompleteMarkdown={true}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </Streamdown>
          </div>

          {/* PC-013: Math fragments could be used for progressive math rendering */}
          {mathFragments && (
            <div className="mt-2 text-xs text-muted-foreground">
              Progressive math: {mathFragments.fragments.length} fragments
            </div>
          )}
        </div>
      </div>
    </div>
  );
});