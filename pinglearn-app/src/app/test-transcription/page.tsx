'use client';

/**
 * Test page for TranscriptionDisplay integration testing
 * Bypasses authentication to test core functionality
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TranscriptionDisplay } from '@/components/transcription/TranscriptionDisplay';
import { getDisplayBuffer } from '@/protected-core';
import PerformanceTestSuite from './performance-test';

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

  const simulateHeavyLoad = () => {
    setIsSimulating(true);
    const displayBuffer = getDisplayBuffer();

    // Add 50 heavy math equations for performance testing
    const heavyMathEquations = [
      'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
      '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
      '\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e',
      'F(x) = \\int_{-\\infty}^{x} f(t) dt',
      '\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}',
      '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u',
      'H = -\\sum_{i} p_i \\log_2 p_i',
      '\\det(A) = \\sum_{\\sigma \\in S_n} \\text{sgn}(\\sigma) \\prod_{i=1}^{n} a_{i,\\sigma(i)}',
      'e^{i\\pi} + 1 = 0'
    ];

    // Add 50 equations rapidly
    for (let i = 0; i < 50; i++) {
      const equation = heavyMathEquations[i % heavyMathEquations.length];
      setTimeout(() => {
        displayBuffer.addItem({
          type: 'math',
          content: equation + ` \\\\ \\text{Equation ${i + 1}}`,
          speaker: 'teacher',
          confidence: 0.99
        });

        // Add some text too
        if (i % 3 === 0) {
          displayBuffer.addItem({
            type: 'text',
            content: `This is explanation ${i + 1} with mathematical context about equation ${i + 1}.`,
            speaker: 'teacher',
            confidence: 0.95
          });
        }

        if (i === 49) {
          setIsSimulating(false);
        }
      }, i * 100); // Add one every 100ms
    }
  };

  const runPerformanceTests = () => {
    console.log('🚀 Starting Performance Tests...');
    PerformanceTestSuite.runAllTests();
  };

  // Load performance test suite into window for console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { PerformanceTestSuite?: typeof PerformanceTestSuite }).PerformanceTestSuite = PerformanceTestSuite;
      console.log('💡 Performance test suite loaded. Run in console: PerformanceTestSuite.runAllTests()');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>TranscriptionDisplay Integration & Performance Test</CardTitle>
            <CardDescription>
              Test page for verifying Gemini integration, math rendering functionality, and performance analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={simulateTranscription}
                disabled={isSimulating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSimulating ? 'Simulating...' : 'Simulate AI Teacher'}
              </Button>
              <Button
                onClick={simulateHeavyLoad}
                disabled={isSimulating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSimulating ? 'Loading...' : 'Heavy Load Test (50 Equations)'}
              </Button>
              <Button
                onClick={runPerformanceTests}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Run Performance Tests
              </Button>
              <Button
                onClick={clearTranscription}
                variant="outline"
              >
                Clear Transcription
              </Button>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              <p><strong>Performance Testing Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Open browser DevTools (F12) and go to Console tab</li>
                <li>Click "Run Performance Tests" or run manually: <code>PerformanceTestSuite.runAllTests()</code></li>
                <li>Monitor memory usage in DevTools Performance tab during Heavy Load Test</li>
                <li>Check console for detailed performance metrics and bottleneck analysis</li>
              </ul>
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