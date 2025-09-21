'use client';

/**
 * Test page for TranscriptionDisplay integration testing
 * Bypasses authentication to test core functionality
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TranscriptionDisplay } from '@/components/transcription/TranscriptionDisplay';
import { getDisplayBuffer } from '@/protected-core';

export default function TestTranscriptionPage() {
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate some transcription data for testing
  const simulateTranscription = () => {
    setIsSimulating(true);
    const displayBuffer = getDisplayBuffer();

    // Add some test items
    const testItems = [
      {
        type: 'text' as const,
        content: 'Welcome to our math lesson today! Let\'s start with quadratic equations.',
        speaker: 'teacher' as const,
        confidence: 0.95
      },
      {
        type: 'math' as const,
        content: 'ax^2 + bx + c = 0',
        speaker: 'teacher' as const,
        confidence: 0.98
      },
      {
        type: 'text' as const,
        content: 'This is the standard form of a quadratic equation. The quadratic formula is:',
        speaker: 'teacher' as const,
        confidence: 0.96
      },
      {
        type: 'math' as const,
        content: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        speaker: 'teacher' as const,
        confidence: 0.99
      },
      {
        type: 'text' as const,
        content: 'Can you solve this equation: x² - 5x + 6 = 0?',
        speaker: 'teacher' as const,
        confidence: 0.97
      }
    ];

    // Add items with delay to simulate real-time transcription
    testItems.forEach((item, index) => {
      setTimeout(() => {
        displayBuffer.addItem(item);
        if (index === testItems.length - 1) {
          setIsSimulating(false);
        }
      }, index * 2000); // 2 second delay between items
    });
  };

  const clearTranscription = () => {
    const displayBuffer = getDisplayBuffer();
    displayBuffer.clearBuffer();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>TranscriptionDisplay Integration Test</CardTitle>
            <CardDescription>
              Test page for verifying Gemini integration and math rendering functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={simulateTranscription}
                disabled={isSimulating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSimulating ? 'Simulating...' : 'Simulate AI Teacher'}
              </Button>
              <Button
                onClick={clearTranscription}
                variant="outline"
              >
                Clear Transcription
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main transcription display */}
        <div className="h-96">
          <TranscriptionDisplay
            sessionId="test-session"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}