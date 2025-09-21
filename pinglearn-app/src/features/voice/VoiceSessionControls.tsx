/**
 * Voice Session Controls Component
 *
 * Provides comprehensive UI controls for voice session management including
 * start/stop, pause/resume, mute/unmute, volume control, and session monitoring.
 */

import React, { useState, useEffect } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useSessionState } from '@/hooks/useSessionState';
import { useSessionMetrics } from '@/hooks/useSessionMetrics';
import { SessionRecoveryService } from './SessionRecoveryService';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Activity,
  Clock,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export interface VoiceSessionControlsProps {
  studentId: string;
  topic: string;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Comprehensive voice session controls with real-time monitoring
 */
export function VoiceSessionControls({
  studentId,
  topic,
  onSessionStart,
  onSessionEnd,
  onError
}: VoiceSessionControlsProps) {
  const {
    session,
    metrics,
    isLoading,
    error,
    controls,
    createSession,
    endSession,
    isActive,
    isPaused,
    isConnecting,
    isError,
    clearError
  } = useVoiceSession();

  const {
    state,
    sessionId,
    roomName,
    getDetailedStatus,
    getConnectionDuration,
    hasRecentActivity
  } = useSessionState();

  const {
    liveMetrics,
    engagementTrend,
    qualityScore,
    recentTranscripts,
    getPerformanceSummary
  } = useSessionMetrics();

  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [recoveryService] = useState(() => SessionRecoveryService.getInstance());

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Session lifecycle handlers
  const handleStartSession = async () => {
    try {
      clearError();

      if (!session) {
        await createSession({
          studentId,
          topic,
          voiceEnabled: true,
          mathTranscriptionEnabled: true,
          recordingEnabled: true
        });
      }

      await controls.start();
      onSessionStart?.();
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleEndSession = async () => {
    try {
      clearError();
      const finalMetrics = await endSession();
      onSessionEnd?.();
      console.log('Session ended with metrics:', finalMetrics);
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await controls.resume();
      } else {
        await controls.pause();
      }
    } catch (err) {
      console.error('Failed to pause/resume session:', err);
    }
  };

  const handleMuteToggle = async () => {
    try {
      if (isMuted) {
        await controls.unmute();
        setIsMuted(false);
      } else {
        await controls.mute();
        setIsMuted(true);
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const handleVolumeChange = async (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);

    try {
      await controls.setVolume(volumeValue / 100);
    } catch (err) {
      console.error('Failed to set volume:', err);
    }
  };

  // Status indicators
  const getStatusColor = () => {
    switch (state.status) {
      case 'active': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'paused': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (engagementTrend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const performanceSummary = getPerformanceSummary();

  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Voice Session Controls</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              <Badge variant={isActive ? "default" : "secondary"}>
                {getDetailedStatus()}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Controls */}
          <div className="flex items-center space-x-2">
            {!session || state.status === 'idle' ? (
              <Button
                onClick={handleStartSession}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>{isLoading ? 'Starting...' : 'Start Session'}</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePauseResume}
                  disabled={isLoading || isError}
                  variant="outline"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={handleEndSession}
                  disabled={isLoading}
                  variant="destructive"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Audio Controls */}
            {(isActive || isPaused) && (
              <>
                <Button
                  onClick={handleMuteToggle}
                  variant="outline"
                  size="sm"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <div className="flex items-center space-x-2 min-w-[120px]">
                  {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-8">{volume}%</span>
                </div>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <Button onClick={clearError} variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          )}

          {/* Session Info */}
          {session && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(liveMetrics.duration)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>{liveMetrics.messagesExchanged} messages</span>
              </div>

              <div className="flex items-center space-x-2">
                {getTrendIcon()}
                <span>{engagementTrend}</span>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>{qualityScore}% quality</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Metrics */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Session Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceSummary.overall}%
                </div>
                <div className="text-sm text-muted-foreground">Overall</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceSummary.voice}%
                </div>
                <div className="text-sm text-muted-foreground">Voice Quality</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceSummary.transcription}%
                </div>
                <div className="text-sm text-muted-foreground">Transcription</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceSummary.engagement}%
                </div>
                <div className="text-sm text-muted-foreground">Engagement</div>
              </div>
            </div>

            {/* Real-time Stats */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Math Equations:</span>
                  <span className="ml-2 font-medium">{liveMetrics.mathEquationsCount}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Error Rate:</span>
                  <span className="ml-2 font-medium">{liveMetrics.errorRate.toFixed(1)}%</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Avg Response:</span>
                  <span className="ml-2 font-medium">{liveMetrics.averageResponseTime.toFixed(1)}s</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Room:</span>
                  <span className="ml-2 font-medium text-xs">{roomName?.slice(-8)}</span>
                </div>

                <div>
                  <span className="text-muted-foreground">Recent Activity:</span>
                  <span className="ml-2 font-medium">
                    {hasRecentActivity() ? '✓' : '⚠️'}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground">Connection:</span>
                  <span className="ml-2 font-medium">{formatDuration(getConnectionDuration())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transcripts */}
      {recentTranscripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentTranscripts.slice(-5).map((transcript) => (
                <div key={transcript.id} className="flex items-start space-x-2 text-sm">
                  <Badge variant={transcript.speaker === 'student' ? 'default' : 'secondary'}>
                    {transcript.speaker}
                  </Badge>
                  <span className="flex-1">{transcript.content}</span>
                  {transcript.mathContent && (
                    <Badge variant="outline" className="text-xs">Math</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}