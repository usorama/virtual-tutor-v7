'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import performanceMonitor from '@/lib/performance/performance-monitor';
import { FEATURES } from '@/config/features';

interface TimingMetric {
  name: string;
  value: number;
  timestamp: number;
  category: string;
}

interface TimingStats {
  averageLeadTime: number;
  minLeadTime: number;
  maxLeadTime: number;
  standardDeviation: number;
  measurementCount: number;
  isHealthy: boolean;
}

export function ShowThenTellTimingDashboard() {
  const [timingMetrics, setTimingMetrics] = useState<TimingMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<TimingStats | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Only show in development with timing enabled
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const timingEnabled = FEATURES.showThenTellTiming;
    setIsVisible(isDev && timingEnabled);
  }, []);

  // Subscribe to performance metrics
  useEffect(() => {
    if (!isVisible) return;

    const handleMetric = (metric: TimingMetric) => {
      if (metric.name.includes('show-then-tell')) {
        setTimingMetrics(prev => [...prev.slice(-50), metric]); // Keep last 50 metrics
      }
    };

    unsubscribeRef.current = performanceMonitor.subscribe(handleMetric);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isVisible]);

  // Calculate statistics
  useEffect(() => {
    const leadTimeMetrics = timingMetrics.filter(m => m.name === 'show-then-tell-lead-time');

    if (leadTimeMetrics.length === 0) {
      setStats(null);
      return;
    }

    const values = leadTimeMetrics.map(m => m.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate standard deviation
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Health check: average should be 350-450ms, stdDev < 100ms
    const isHealthy = avg >= 350 && avg <= 450 && stdDev < 100;

    setStats({
      averageLeadTime: avg,
      minLeadTime: min,
      maxLeadTime: max,
      standardDeviation: stdDev,
      measurementCount: leadTimeMetrics.length,
      isHealthy
    });
  }, [timingMetrics]);

  // Clear metrics
  const clearMetrics = () => {
    setTimingMetrics([]);
    performanceMonitor.clearMetrics();
  };

  // Export data for analysis
  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: timingMetrics,
      stats
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `show-then-tell-timing-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="p-4 bg-black/90 backdrop-blur border-gray-700 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-400">
            🎯 Show-Then-Tell Timing
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={clearMetrics}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Clear
            </button>
            <button
              onClick={exportData}
              className="text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded"
            >
              Export
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        {stats ? (
          <div className="space-y-3">
            {/* Health Status */}
            <div className={`text-xs p-2 rounded ${
              stats.isHealthy
                ? 'bg-green-900/50 text-green-300'
                : 'bg-red-900/50 text-red-300'
            }`}>
              {stats.isHealthy ? '✅ Timing Healthy' : '⚠️ Timing Issues Detected'}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400">Avg Lead Time</div>
                <div className={`font-bold ${
                  stats.averageLeadTime >= 350 && stats.averageLeadTime <= 450
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {stats.averageLeadTime.toFixed(1)}ms
                </div>
              </div>

              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400">Consistency</div>
                <div className={`font-bold ${
                  stats.standardDeviation < 50 ? 'text-green-400' :
                  stats.standardDeviation < 100 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  ±{stats.standardDeviation.toFixed(1)}ms
                </div>
              </div>

              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400">Range</div>
                <div className="font-bold text-blue-400">
                  {stats.minLeadTime.toFixed(0)}-{stats.maxLeadTime.toFixed(0)}ms
                </div>
              </div>

              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400">Samples</div>
                <div className="font-bold text-purple-400">
                  {stats.measurementCount}
                </div>
              </div>
            </div>

            {/* Real-time Chart */}
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-400 mb-1">Live Timing Chart</div>
              <div className="h-16 flex items-end space-x-1">
                {timingMetrics
                  .filter(m => m.name === 'show-then-tell-lead-time')
                  .slice(-20)
                  .map((metric, index) => {
                    const height = Math.max(4, (metric.value / 600) * 60); // Scale to 60px max
                    const color = metric.value >= 350 && metric.value <= 450
                      ? 'bg-green-500'
                      : metric.value >= 300 && metric.value <= 500
                        ? 'bg-yellow-500'
                        : 'bg-red-500';

                    return (
                      <div
                        key={index}
                        className={`w-2 ${color} rounded-t`}
                        style={{ height: `${height}px` }}
                        title={`${metric.value.toFixed(1)}ms`}
                      />
                    );
                  })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0ms</span>
                <span>300ms</span>
                <span>450ms</span>
                <span>600ms</span>
              </div>
            </div>

            {/* Recent Measurements */}
            <div className="bg-gray-800 p-2 rounded max-h-20 overflow-y-auto">
              <div className="text-xs text-gray-400 mb-1">Recent Events</div>
              {timingMetrics.slice(-5).reverse().map((metric, index) => (
                <div key={index} className="text-xs flex justify-between">
                  <span className="text-gray-300">
                    {metric.name.replace('show-then-tell-', '')}:
                  </span>
                  <span className="text-blue-300">
                    {metric.value.toFixed(1)}ms
                  </span>
                </div>
              ))}
            </div>

            {/* Performance Guidelines */}
            <div className="text-xs text-gray-400 space-y-1">
              <div>Target: 350-450ms visual lead time</div>
              <div>✅ Good: 300-500ms ⚠️ Warning: &lt;300 or &gt;500ms</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">
            🎵 Waiting for show-then-tell events...
            <div className="mt-2 text-gray-500">
              Start a voice session to see timing data
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Development-only floating toggle button
export function ShowThenTellTimingToggle() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const timingEnabled = FEATURES.showThenTellTiming;
    setIsVisible(isDev && timingEnabled);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {!showDashboard && (
        <button
          onClick={() => setShowDashboard(true)}
          className="fixed bottom-4 right-4 z-40 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg"
          title="Show Timing Dashboard"
        >
          ⏱️
        </button>
      )}
      {showDashboard && <ShowThenTellTimingDashboard />}
    </>
  );
}