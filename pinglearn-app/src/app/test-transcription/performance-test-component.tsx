'use client';

/**
 * Performance Test Component
 * Tests all optimizations: TranscriptionDisplay, MathRenderer, Memory Management
 */

import React, { useState, useEffect, useRef } from 'react';
import { TranscriptionDisplay } from '@/components/transcription/TranscriptionDisplay';
import { MathRenderer } from '@/components/transcription/MathRenderer';
import { useOptimizedDisplayBuffer } from '@/hooks/useOptimizedDisplayBuffer';
import { useMemoryManager } from '@/lib/memory-manager';
import { Card } from '@/components/ui/card';

interface PerformanceMetrics {
  mathRenderTime: number;
  bufferUpdateLatency: number;
  memoryUsage: number;
  updateFrequency: number;
  totalItems: number;
  timestamp: number;
}

export function PerformanceTestComponent() {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [testType, setTestType] = useState<'light' | 'heavy' | 'stress'>('light');

  const bufferHook = useOptimizedDisplayBuffer({
    maxLocalItems: 100,
    debounceMs: 16,
    enableVirtualization: true
  });

  const memoryManager = useMemoryManager({
    enableMonitoring: true,
    warningThresholdMB: 50,
    criticalThresholdMB: 100
  });

  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Test configurations
  const testConfigs = {
    light: {
      itemsPerSecond: 2,
      mathProbability: 0.3,
      duration: 30, // seconds
      description: 'Light load: 2 items/sec, 30% math'
    },
    heavy: {
      itemsPerSecond: 10,
      mathProbability: 0.6,
      duration: 60,
      description: 'Heavy load: 10 items/sec, 60% math'
    },
    stress: {
      itemsPerSecond: 20,
      mathProbability: 0.8,
      duration: 120,
      description: 'Stress test: 20 items/sec, 80% math'
    }
  };

  // Sample math equations for testing
  const mathEquations = [
    'x^2 + 2x + 1 = 0',
    '\\frac{a}{b} = \\frac{c}{d}',
    '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
    '\\int_0^1 x^2 dx = \\frac{1}{3}',
    '\\sqrt{a^2 + b^2} = c',
    'e^{i\\pi} + 1 = 0',
    '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
    '\\matrix{a & b \\\\ c & d}',
    'f(x) = ax^2 + bx + c',
    '\\alpha + \\beta = \\gamma'
  ];

  // Sample text content
  const textSamples = [
    'Today we\'ll learn about quadratic equations.',
    'Let\'s solve this step by step.',
    'Remember to factor the expression first.',
    'The discriminant tells us about the roots.',
    'Practice makes perfect!',
    'Great work on that problem.',
    'Let\'s try a more challenging example.',
    'Mathematical reasoning is important.',
    'Keep practicing these concepts.',
    'Excellent progress today!'
  ];

  // Start performance test
  const startTest = () => {
    setIsTestRunning(true);
    setMetrics([]);
    startTimeRef.current = Date.now();

    const config = testConfigs[testType];
    const interval = 1000 / config.itemsPerSecond;

    let itemCount = 0;
    const maxItems = config.itemsPerSecond * config.duration;

    testIntervalRef.current = setInterval(() => {
      if (itemCount >= maxItems) {
        stopTest();
        return;
      }

      // Measure performance
      const startTime = performance.now();

      // Add item to buffer
      const isMath = Math.random() < config.mathProbability;

      if (isMath) {
        const equation = mathEquations[Math.floor(Math.random() * mathEquations.length)];
        bufferHook.addItem({
          type: 'math',
          content: equation,
          speaker: 'ai'
        });
        memoryManager.recordActivity('math');
      } else {
        const text = textSamples[Math.floor(Math.random() * textSamples.length)];
        bufferHook.addItem({
          type: 'text',
          content: text,
          speaker: 'ai'
        });
        memoryManager.recordActivity('item');
      }

      const endTime = performance.now();

      // Collect metrics
      const currentMetrics: PerformanceMetrics = {
        mathRenderTime: isMath ? endTime - startTime : 0,
        bufferUpdateLatency: endTime - startTime,
        memoryUsage: memoryManager.memoryMetrics?.heapUsed || 0,
        updateFrequency: bufferHook.getMetrics().updateFrequency,
        totalItems: bufferHook.state.totalItems,
        timestamp: Date.now() - startTimeRef.current
      };

      setMetrics(prev => [...prev.slice(-50), currentMetrics]); // Keep last 50 metrics
      itemCount++;
    }, interval);
  };

  // Stop test
  const stopTest = () => {
    setIsTestRunning(false);
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    if (metrics.length === 0) return null;

    const mathRenderTimes = metrics.filter(m => m.mathRenderTime > 0).map(m => m.mathRenderTime);
    const bufferLatencies = metrics.map(m => m.bufferUpdateLatency);
    const memoryUsages = metrics.map(m => m.memoryUsage).filter(m => m > 0);

    return {
      avgMathRenderTime: mathRenderTimes.length > 0
        ? mathRenderTimes.reduce((a, b) => a + b, 0) / mathRenderTimes.length
        : 0,
      maxMathRenderTime: mathRenderTimes.length > 0 ? Math.max(...mathRenderTimes) : 0,
      avgBufferLatency: bufferLatencies.reduce((a, b) => a + b, 0) / bufferLatencies.length,
      maxBufferLatency: Math.max(...bufferLatencies),
      avgMemoryUsage: memoryUsages.length > 0
        ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
        : 0,
      maxMemoryUsage: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      totalItems: metrics.length > 0 ? metrics[metrics.length - 1].totalItems : 0,
      testDuration: metrics.length > 0 ? metrics[metrics.length - 1].timestamp / 1000 : 0
    };
  };

  const stats = calculateStats();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Test Controls</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(testConfigs).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setTestType(type as typeof testType)}
              className={`p-3 rounded border text-left ${
                testType === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              disabled={isTestRunning}
            >
              <div className="font-medium capitalize">{type} Test</div>
              <div className="text-sm text-gray-600">{config.description}</div>
              <div className="text-xs text-gray-500">{config.duration}s duration</div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={startTest}
            disabled={isTestRunning}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isTestRunning ? 'Test Running...' : 'Start Test'}
          </button>

          <button
            onClick={stopTest}
            disabled={!isTestRunning}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            Stop Test
          </button>

          <button
            onClick={() => {
              setMetrics([]);
              bufferHook.clearBuffer();
              memoryManager.resetSession();
            }}
            disabled={isTestRunning}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
          >
            Clear All
          </button>
        </div>
      </Card>

      {/* Performance Metrics */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Results</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.avgMathRenderTime.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Math Render</div>
              <div className="text-xs text-gray-500">
                Max: {stats.maxMathRenderTime.toFixed(1)}ms
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.avgBufferLatency.toFixed(1)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Buffer Latency</div>
              <div className="text-xs text-gray-500">
                Max: {stats.maxBufferLatency.toFixed(1)}ms
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.avgMemoryUsage.toFixed(1)}MB
              </div>
              <div className="text-sm text-gray-600">Avg Memory Usage</div>
              <div className="text-xs text-gray-500">
                Max: {stats.maxMemoryUsage.toFixed(1)}MB
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalItems}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-xs text-gray-500">
                {stats.testDuration.toFixed(1)}s duration
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Math Render Performance:</span>
              <span className={`font-medium ${
                stats.avgMathRenderTime < 50
                  ? 'text-green-600'
                  : stats.avgMathRenderTime < 100
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {stats.avgMathRenderTime < 50 ? '✅ Excellent' :
                 stats.avgMathRenderTime < 100 ? '⚠️ Good' : '❌ Needs Optimization'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Buffer Performance:</span>
              <span className={`font-medium ${
                stats.avgBufferLatency < 16
                  ? 'text-green-600'
                  : stats.avgBufferLatency < 33
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {stats.avgBufferLatency < 16 ? '✅ 60+ FPS' :
                 stats.avgBufferLatency < 33 ? '⚠️ 30+ FPS' : '❌ < 30 FPS'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Memory Performance:</span>
              <span className={`font-medium ${
                stats.maxMemoryUsage < 100
                  ? 'text-green-600'
                  : stats.maxMemoryUsage < 200
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}>
                {stats.maxMemoryUsage < 100 ? '✅ Efficient' :
                 stats.maxMemoryUsage < 200 ? '⚠️ Acceptable' : '❌ High Usage'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Live Memory Monitoring */}
      {memoryManager.memoryMetrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Live Memory Monitoring</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Memory Usage</div>
              <div className="text-xl font-bold">
                {memoryManager.memoryMetrics.heapUsed.toFixed(1)} MB
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Buffer Update Frequency</div>
              <div className="text-xl font-bold">
                {bufferHook.getMetrics().updateFrequency.toFixed(1)} Hz
              </div>
            </div>
          </div>

          {memoryManager.memoryState && (
            <div className="mt-4 text-sm text-gray-600">
              Session Duration: {((Date.now() - memoryManager.memoryState.startTime) / 1000 / 60).toFixed(1)} minutes
            </div>
          )}
        </Card>
      )}

      {/* Transcription Display Test */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Live Transcription Display</h3>
        <div className="h-96">
          <TranscriptionDisplay className="h-full" />
        </div>
      </Card>

      {/* Sample Math Rendering */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Math Rendering Test</h3>
        <div className="space-y-3">
          {mathEquations.slice(0, 5).map((equation, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="text-sm text-gray-600 w-16">#{index + 1}:</div>
              <MathRenderer latex={equation} display={false} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}