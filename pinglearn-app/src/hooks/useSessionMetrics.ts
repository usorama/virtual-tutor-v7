/**
 * useSessionMetrics Hook
 *
 * Specialized hook for accessing and tracking voice session metrics,
 * analytics, and performance data in real-time.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSessionManager, type VoiceSessionMetrics, type TranscriptEntry } from '@/features/voice/VoiceSessionManager';
import { VoiceSession } from '@/types/session';

export interface LiveMetrics {
  duration: number; // Current session duration in seconds
  messagesExchanged: number;
  currentEngagement: number; // Real-time engagement score
  errorRate: number;
  averageResponseTime: number; // Average time between messages
  mathEquationsCount: number;
  lastTranscriptTime: Date | null;
}

export interface MetricsHistory {
  timestamp: Date;
  metrics: Partial<VoiceSessionMetrics>;
}

export interface UseSessionMetricsReturn {
  // Current metrics
  currentMetrics: VoiceSessionMetrics | null;
  liveMetrics: LiveMetrics;

  // Historical data
  metricsHistory: MetricsHistory[];

  // Performance indicators
  engagementTrend: 'improving' | 'declining' | 'stable';
  qualityScore: number; // Overall session quality (0-100)

  // Real-time data
  transcripts: TranscriptEntry[];
  recentTranscripts: TranscriptEntry[]; // Last 10 transcripts

  // Analytics methods
  getAverageMetrics: () => Partial<VoiceSessionMetrics>;
  getEngagementTrend: (windowMinutes?: number) => 'improving' | 'declining' | 'stable';
  getPerformanceSummary: () => {
    overall: number;
    voice: number;
    transcription: number;
    engagement: number;
  };

  // Data refresh
  refreshMetrics: () => Promise<void>;
  refreshTranscripts: () => Promise<void>;
}

/**
 * Hook for comprehensive session metrics and analytics
 */
export function useSessionMetrics(): UseSessionMetricsReturn {
  const [currentMetrics, setCurrentMetrics] = useState<VoiceSessionMetrics | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    duration: 0,
    messagesExchanged: 0,
    currentEngagement: 0,
    errorRate: 0,
    averageResponseTime: 0,
    mathEquationsCount: 0,
    lastTranscriptTime: null
  });

  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [engagementTrend, setEngagementTrend] = useState<'improving' | 'declining' | 'stable'>('stable');
  const [qualityScore, setQualityScore] = useState(0);

  const managerRef = useRef<VoiceSessionManager | undefined>(undefined);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const responseTimes = useRef<number[]>([]);
  const lastTranscriptTimeRef = useRef<Date | null>(null);

  // Initialize manager and event listeners
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = VoiceSessionManager.getInstance();
    }
    const manager = managerRef.current;

    // Event handlers
    const handleSessionStarted = () => {
      sessionStartTimeRef.current = new Date();
      setLiveMetrics(prev => ({ ...prev, duration: 0 }));
      startMetricsTracking();
    };

    const handleSessionEnded = ({ metrics }: { session: VoiceSession; metrics: VoiceSessionMetrics }) => {
      setCurrentMetrics(metrics);
      stopMetricsTracking();
      addToMetricsHistory(metrics);
    };

    const handleTranscriptAdded = ({ transcript }: { transcript: TranscriptEntry }) => {
      const newTranscript: TranscriptEntry = {
        id: transcript.id,
        voiceSessionId: transcript.voice_session_id,
        speaker: transcript.speaker,
        content: transcript.content,
        timestamp: transcript.timestamp,
        confidence: transcript.confidence,
        mathContent: transcript.math_content,
        processed: transcript.processed
      };

      setTranscripts(prev => [...prev, newTranscript]);

      // Update live metrics
      setLiveMetrics(prev => ({
        ...prev,
        messagesExchanged: prev.messagesExchanged + 1,
        mathEquationsCount: transcript.math_content ? prev.mathEquationsCount + 1 : prev.mathEquationsCount,
        lastTranscriptTime: new Date(transcript.timestamp)
      }));

      // Track response times
      if (lastTranscriptTimeRef.current) {
        const responseTime = new Date(transcript.timestamp).getTime() - lastTranscriptTimeRef.current.getTime();
        responseTimes.current.push(responseTime);

        // Keep only last 20 response times
        if (responseTimes.current.length > 20) {
          responseTimes.current.shift();
        }

        // Update average response time
        const avgResponseTime = responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length;
        setLiveMetrics(prev => ({
          ...prev,
          averageResponseTime: avgResponseTime / 1000 // Convert to seconds
        }));
      }

      lastTranscriptTimeRef.current = new Date(transcript.timestamp);
    };

    const handleSessionError = () => {
      // Update error rate in live metrics
      if (sessionStartTimeRef.current) {
        const duration = (Date.now() - sessionStartTimeRef.current.getTime()) / 1000;
        const errorRate = duration > 0 ? (liveMetrics.messagesExchanged / duration) * 100 : 0;
        setLiveMetrics(prev => ({ ...prev, errorRate }));
      }
    };

    // Register event listeners
    manager.addEventListener('sessionStarted', handleSessionStarted);
    manager.addEventListener('sessionEnded', handleSessionEnded);
    manager.addEventListener('transcriptAdded', handleTranscriptAdded);
    manager.addEventListener('sessionError', handleSessionError);

    // Initialize with current data
    const currentSession = manager.getCurrentSession();
    const initialMetrics = manager.getCurrentMetrics();

    if (currentSession && currentSession.status === 'active') {
      sessionStartTimeRef.current = new Date(currentSession.startedAt);
      startMetricsTracking();
    }

    if (initialMetrics) {
      setCurrentMetrics(initialMetrics);
    }

    return () => {
      // Cleanup
      manager.removeEventListener('sessionStarted', handleSessionStarted);
      manager.removeEventListener('sessionEnded', handleSessionEnded);
      manager.removeEventListener('transcriptAdded', handleTranscriptAdded);
      manager.removeEventListener('sessionError', handleSessionError);

      stopMetricsTracking();
    };
  }, []);

  // Start real-time metrics tracking
  const startMetricsTracking = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }

    metricsIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current) {
        const duration = Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000);

        // Calculate engagement based on activity
        let engagement = 0;
        if (duration > 0) {
          const messageRate = liveMetrics.messagesExchanged / (duration / 60); // messages per minute
          engagement = Math.min(100, messageRate * 10); // Scale to 0-100
        }

        setLiveMetrics(prev => ({
          ...prev,
          duration,
          currentEngagement: engagement
        }));

        // Update quality score
        calculateQualityScore(engagement);

        // Add current metrics to history (every minute)
        if (duration % 60 === 0 && duration > 0) {
          addToMetricsHistory({
            duration,
            messagesExchanged: liveMetrics.messagesExchanged,
            transcriptionAccuracy: 85 + Math.random() * 10, // Mock calculation
            voiceQuality: 80 + Math.random() * 15, // Mock calculation
            mathEquationsProcessed: liveMetrics.mathEquationsCount,
            errorRate: liveMetrics.errorRate,
            engagementScore: engagement,
            comprehensionScore: 70 + Math.random() * 25 // Mock calculation
          });
        }
      }
    }, 1000);
  }, [liveMetrics.messagesExchanged, liveMetrics.mathEquationsCount, liveMetrics.errorRate]);

  // Stop metrics tracking
  const stopMetricsTracking = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = undefined;
    }
  }, []);

  // Add metrics to history
  const addToMetricsHistory = useCallback((metrics: Partial<VoiceSessionMetrics>) => {
    setMetricsHistory(prev => {
      const newHistory = [...prev, { timestamp: new Date(), metrics }];
      // Keep only last 100 entries
      return newHistory.slice(-100);
    });
  }, []);

  // Calculate overall quality score
  const calculateQualityScore = useCallback((engagement: number) => {
    const transcriptionScore = 85; // Mock transcription accuracy
    const voiceScore = 80; // Mock voice quality
    const errorScore = Math.max(0, 100 - liveMetrics.errorRate * 10);

    const overall = (engagement * 0.3 + transcriptionScore * 0.3 + voiceScore * 0.2 + errorScore * 0.2);
    setQualityScore(Math.round(overall));
  }, [liveMetrics.errorRate]);

  // Calculate engagement trend
  useEffect(() => {
    if (metricsHistory.length >= 3) {
      const recentMetrics = metricsHistory.slice(-3);
      const engagementScores = recentMetrics.map(h => h.metrics.engagementScore || 0);

      const firstScore = engagementScores[0];
      const lastScore = engagementScores[engagementScores.length - 1];

      if (lastScore > firstScore + 5) {
        setEngagementTrend('improving');
      } else if (lastScore < firstScore - 5) {
        setEngagementTrend('declining');
      } else {
        setEngagementTrend('stable');
      }
    }
  }, [metricsHistory]);

  // Utility methods
  const getAverageMetrics = useCallback((): Partial<VoiceSessionMetrics> => {
    if (metricsHistory.length === 0) {
      return {};
    }

    const totals = metricsHistory.reduce((acc, { metrics }) => {
      return {
        duration: acc.duration + (metrics.duration || 0),
        messagesExchanged: acc.messagesExchanged + (metrics.messagesExchanged || 0),
        transcriptionAccuracy: acc.transcriptionAccuracy + (metrics.transcriptionAccuracy || 0),
        voiceQuality: acc.voiceQuality + (metrics.voiceQuality || 0),
        mathEquationsProcessed: acc.mathEquationsProcessed + (metrics.mathEquationsProcessed || 0),
        errorRate: acc.errorRate + (metrics.errorRate || 0),
        engagementScore: acc.engagementScore + (metrics.engagementScore || 0),
        comprehensionScore: acc.comprehensionScore + (metrics.comprehensionScore || 0)
      };
    }, {
      duration: 0,
      messagesExchanged: 0,
      transcriptionAccuracy: 0,
      voiceQuality: 0,
      mathEquationsProcessed: 0,
      errorRate: 0,
      engagementScore: 0,
      comprehensionScore: 0
    });

    const count = metricsHistory.length;
    return {
      duration: totals.duration / count,
      messagesExchanged: totals.messagesExchanged / count,
      transcriptionAccuracy: totals.transcriptionAccuracy / count,
      voiceQuality: totals.voiceQuality / count,
      mathEquationsProcessed: totals.mathEquationsProcessed / count,
      errorRate: totals.errorRate / count,
      engagementScore: totals.engagementScore / count,
      comprehensionScore: totals.comprehensionScore / count
    };
  }, [metricsHistory]);

  const getEngagementTrend = useCallback((windowMinutes: number = 5): 'improving' | 'declining' | 'stable' => {
    const windowMs = windowMinutes * 60 * 1000;
    const cutoffTime = Date.now() - windowMs;

    const recentHistory = metricsHistory.filter(h => h.timestamp.getTime() > cutoffTime);

    if (recentHistory.length < 2) {
      return 'stable';
    }

    const firstEngagement = recentHistory[0].metrics.engagementScore || 0;
    const lastEngagement = recentHistory[recentHistory.length - 1].metrics.engagementScore || 0;

    if (lastEngagement > firstEngagement + 10) {
      return 'improving';
    } else if (lastEngagement < firstEngagement - 10) {
      return 'declining';
    } else {
      return 'stable';
    }
  }, [metricsHistory]);

  const getPerformanceSummary = useCallback(() => {
    const averages = getAverageMetrics();

    return {
      overall: qualityScore,
      voice: averages.voiceQuality || 0,
      transcription: averages.transcriptionAccuracy || 0,
      engagement: averages.engagementScore || 0
    };
  }, [qualityScore, getAverageMetrics]);

  const refreshMetrics = useCallback(async () => {
    if (managerRef.current) {
      const metrics = managerRef.current.getCurrentMetrics();
      if (metrics) {
        setCurrentMetrics(metrics);
      }
    }
  }, []);

  const refreshTranscripts = useCallback(async () => {
    if (managerRef.current) {
      const sessionTranscripts = await managerRef.current.getSessionTranscripts();
      setTranscripts(sessionTranscripts);
    }
  }, []);

  // Get recent transcripts (last 10)
  const recentTranscripts = transcripts.slice(-10);

  return {
    // Current metrics
    currentMetrics,
    liveMetrics,

    // Historical data
    metricsHistory,

    // Performance indicators
    engagementTrend,
    qualityScore,

    // Real-time data
    transcripts,
    recentTranscripts,

    // Analytics methods
    getAverageMetrics,
    getEngagementTrend,
    getPerformanceSummary,

    // Data refresh
    refreshMetrics,
    refreshTranscripts
  };
}