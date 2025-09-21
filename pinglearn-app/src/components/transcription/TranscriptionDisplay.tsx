'use client';

/**
 * Transcription Display Component
 * Simple, focused display for AI teacher transcription with math rendering
 * Based on docs/kb/ux-flow.md specifications
 */

import React, { useEffect, useState, useRef } from 'react';
import type { DisplayBuffer } from '@/protected-core';

// Use local DisplayItem type that matches what DisplayBuffer returns
interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'ai';
  rendered?: string;
  confidence?: number;
}
import { MathRenderer } from './MathRenderer';
import { AudioIndicator } from './AudioIndicator';
import { Card } from '@/components/ui/card';

interface TranscriptionDisplayProps {
  sessionId?: string;
  className?: string;
}

export function TranscriptionDisplay({ sessionId, className = '' }: TranscriptionDisplayProps) {
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayBufferRef = useRef<DisplayBuffer | null>(null);

  useEffect(() => {
    // Get display buffer instance from protected core
    if (typeof window !== 'undefined') {
      import('@/protected-core').then(({ getDisplayBuffer }) => {
        displayBufferRef.current = getDisplayBuffer();

        // Subscribe to display updates
        const updateInterval = setInterval(() => {
          if (displayBufferRef.current) {
            const items = displayBufferRef.current.getItems();
            setDisplayItems(items);

            // Auto-scroll to bottom
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }
        }, 100); // Update every 100ms for smooth display

        return () => clearInterval(updateInterval);
      });
    }
  }, [sessionId]);

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header with Audio Indicator */}
      <div className="border-b p-4">
        <AudioIndicator
          isActive={isTeacherSpeaking}
          label="AI Teacher"
        />
      </div>

      {/* Main Transcription Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {displayItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">Ready to start learning!</p>
            <p className="text-sm mt-2">The AI teacher will appear here when the session begins.</p>
          </div>
        ) : (
          displayItems.map((item) => (
            <TranscriptionItem key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Simple Footer Controls */}
      <div className="border-t p-4">
        <div className="flex justify-center space-x-4">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => {
              // Pause/Resume logic will be connected to SessionOrchestrator
              setIsTeacherSpeaking(!isTeacherSpeaking);
            }}
          >
            {isTeacherSpeaking ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Individual Transcription Item
 */
function TranscriptionItem({ item }: { item: DisplayItem }) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    // Highlight new items briefly based on timestamp
    const isNew = Date.now() - item.timestamp < 500;
    if (isNew) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [item.timestamp]);

  // Render based on item type
  switch (item.type) {
    case 'text':
      return (
        <div
          className={`text-lg leading-relaxed transition-all duration-500 ${
            isHighlighted ? 'bg-blue-50 px-3 py-1 rounded' : ''
          }`}
        >
          {item.content}
        </div>
      );

    case 'math':
      // Determine if it's inline or block based on content
      const isBlockMath = item.content.includes('\\\\') || item.content.length > 50;
      return (
        <div className={`${
          isBlockMath ? 'my-4' : 'inline-block'
        } transition-all duration-500 ${
          isHighlighted ? 'bg-yellow-50 p-2 rounded' : ''
        }`}>
          <MathRenderer
            latex={item.content}
            display={isBlockMath}
            highlighted={isHighlighted}
          />
        </div>
      );

    case 'code':
      return (
        <pre className={`p-4 bg-gray-100 rounded-lg overflow-x-auto transition-all duration-500 ${
          isHighlighted ? 'ring-2 ring-blue-400' : ''
        }`}>
          <code className="text-sm">{item.content}</code>
        </pre>
      );

    case 'diagram':
    case 'image':
      return (
        <div className="my-4 text-center text-gray-500">
          <p>[{item.type}: {item.content}]</p>
        </div>
      );

    default:
      return (
        <div className="text-gray-600">
          {item.content}
        </div>
      );
  }
}