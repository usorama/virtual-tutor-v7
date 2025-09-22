'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, AlertCircle, Play, Pause, Square, Activity, BarChart3, Zap, Home } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TranscriptionDisplay } from '@/components/transcription/TranscriptionDisplay';
import { TeachingBoard } from '@/components/classroom/TeachingBoard';
import { NotesPanel } from '@/components/classroom/NotesPanel';
import { LiveKitRoom } from '@/components/voice/LiveKitRoom';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useSessionState } from '@/hooks/useSessionState';
import { useSessionMetrics } from '@/hooks/useSessionMetrics';
import { SessionOrchestrator } from '@/protected-core';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AudioControlState {
  isMuted: boolean;
  volume: number;
  hasPermissions: boolean;
}

export default function ClassroomPage() {
  const router = useRouter();
  const supabase = createClient();

  // Voice session management hooks
  const {
    session,
    isLoading,
    error: voiceError,
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
    state: sessionState,
    sessionId,
    roomName,
    getDetailedStatus
  } = useSessionState();

  const {
    liveMetrics,
    qualityScore,
    engagementTrend
  } = useSessionMetrics();

  // Local UI state
  const [audioControls, setAudioControls] = useState<AudioControlState>({
    isMuted: false,
    volume: 100,
    hasPermissions: false
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('General Mathematics');
  const [errorBoundary, setErrorBoundary] = useState<ErrorBoundaryState>({ hasError: false });
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes'>('transcript');
  const [sessionControlState, setSessionControlState] = useState<'active' | 'paused' | 'ended'>('active');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check authentication and load user data
  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear voice errors when user dismisses them
  useEffect(() => {
    if (voiceError) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000); // Auto-clear errors after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [voiceError, clearError]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      setErrorBoundary({ hasError: true, error: new Error(error.message) });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  /**
   * Check if user is authenticated
   */
  async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      router.push('/login?redirect=/classroom');
      return;
    }

    setUserId(user.id);

    // Load user profile for topic preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, preferred_subjects, selected_topics')
      .eq('id', user.id)
      .single();

    if (profile?.preferred_subjects && profile.preferred_subjects.length > 0) {
      setCurrentTopic(`Grade ${profile.grade} ${profile.preferred_subjects[0]}`);
    }
  }

  /**
   * Request microphone permissions with enhanced error handling
   */
  async function requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      // Stop the stream immediately - we just needed to request permissions
      stream.getTracks().forEach(track => track.stop());

      setAudioControls(prev => ({ ...prev, hasPermissions: true }));
      return true;
    } catch (err) {
      console.error('Permission denied:', err);
      const errorMessage = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone access was denied. Please allow microphone access and refresh the page.'
        : 'Unable to access microphone. Please check your device settings and try again.';

      setErrorBoundary({ hasError: true, error: new Error(errorMessage) });
      setAudioControls(prev => ({ ...prev, hasPermissions: false }));
      return false;
    }
  }

  /**
   * Start a new learning session with comprehensive error handling
   */
  async function startVoiceSession() {
    if (!userId) {
      setErrorBoundary({ hasError: true, error: new Error('Please log in to start a session') });
      return;
    }

    // Request permissions first
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      return;
    }

    try {
      clearError();
      setErrorBoundary({ hasError: false });

      // Create session through VoiceSessionManager
      const voiceSessionId = await createSession({
        studentId: userId,
        topic: currentTopic,
        voiceEnabled: true,
        mathTranscriptionEnabled: true,
        recordingEnabled: true
      });

      console.log('Voice session created successfully:', voiceSessionId);

      // Start the session
      await controls.start();

      console.log('Voice session started successfully');

    } catch (err) {
      console.error('Error starting voice session:', err);
      setErrorBoundary({
        hasError: true,
        error: err instanceof Error ? err : new Error('Failed to start session. Please try again.')
      });
    }
  }

  /**
   * Enhanced pause/resume using SessionOrchestrator
   */
  async function handlePauseResume() {
    setIsTransitioning(true);
    try {
      const orchestrator = SessionOrchestrator.getInstance();

      if (sessionControlState === 'active') {
        await controls.pause();
        orchestrator.pauseSession();
        setSessionControlState('paused');
      } else if (sessionControlState === 'paused') {
        await controls.resume();
        orchestrator.resumeSession();
        setSessionControlState('active');
      }
    } catch (err) {
      console.error('Session control error:', err);
      setErrorBoundary({
        hasError: true,
        error: err instanceof Error ? err : new Error('Failed to control session')
      });
    }
    setIsTransitioning(false);
  }

  /**
   * Enhanced session ending with SessionOrchestrator
   */
  async function handleEndSession() {
    setIsTransitioning(true);
    try {
      const orchestrator = SessionOrchestrator.getInstance();
      const finalMetrics = await endSession();

      // End session through orchestrator
      if (sessionId) {
        await orchestrator.endSession(sessionId);
      }

      setSessionControlState('ended');

      // Save session to Supabase with metrics
      if (userId && finalMetrics) {
        await supabase.from('learning_sessions').insert({
          student_id: userId,
          topic: currentTopic,
          duration: finalMetrics.duration,
          ended_at: new Date().toISOString(),
          engagement_score: finalMetrics.engagementScore,
          comprehension_score: finalMetrics.comprehensionScore
        });
      }

      // Redirect to dashboard after ending
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('End session error:', err);
      setErrorBoundary({
        hasError: true,
        error: err instanceof Error ? err : new Error('Failed to end session properly')
      });
    }
    setIsTransitioning(false);
  }

  /**
   * Toggle mute state
   */
  async function toggleMute() {
    try {
      if (audioControls.isMuted) {
        await controls.unmute();
      } else {
        await controls.mute();
      }
      setAudioControls(prev => ({ ...prev, isMuted: !prev.isMuted }));
    } catch (err) {
      console.error('Error toggling mute:', err);
      setErrorBoundary({
        hasError: true,
        error: err instanceof Error ? err : new Error('Failed to toggle mute')
      });
    }
  }

  // Note: Volume control available through setAudioControls state

  /**
   * Format duration for display
   */
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get status badge variant based on session state
   */
  function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'active': return 'default';
      case 'connecting': return 'outline';
      case 'paused': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  }

  /**
   * Clear error boundary
   */
  function clearErrorBoundary() {
    setErrorBoundary({ hasError: false });
    clearError();
  }

  // Error boundary display
  if (errorBoundary.hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Session Error</CardTitle>
            <CardDescription>
              Something went wrong with your learning session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorBoundary.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button onClick={clearErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced dual-pane learning interface
  if (session && (isActive || isPaused)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto p-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle>AI Learning Session</CardTitle>
                      <Badge variant={getStatusBadgeVariant(sessionState.status)}>
                        {getDetailedStatus()}
                      </Badge>
                      {voiceConnected && (
                        <Badge variant="outline" className="text-green-600">
                          <Mic className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center space-x-4">
                      <span>{currentTopic}</span>
                      <span>•</span>
                      <span>Duration: {formatDuration(liveMetrics.duration)}</span>
                      <span>•</span>
                      <span>Status: {
                        sessionControlState === 'ended' ? 'Session Ended' :
                        sessionControlState === 'paused' ? 'Paused' : 'Active'
                      }</span>
                      <span>•</span>
                      <span>Quality: {qualityScore}%</span>
                    </CardDescription>

                    {/* Real-time metrics */}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Activity className="h-3 w-3" />
                        <span>{liveMetrics.messagesExchanged} messages</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>Engagement: {engagementTrend}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-3 w-3" />
                        <span>{liveMetrics.mathEquationsCount} equations</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Session Controls */}
                  <div className="flex items-center space-x-2">
                    {sessionControlState === 'ended' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="h-8"
                      >
                        <Home className="w-3 h-3 mr-1" />
                        Back to Dashboard
                      </Button>
                    ) : (
                      <>
                        {/* Microphone Control */}
                        <Button
                          variant={audioControls.isMuted ? "destructive" : "secondary"}
                          size="sm"
                          onClick={toggleMute}
                          disabled={isConnecting || isLoading || isTransitioning}
                          className="h-8"
                        >
                          {audioControls.isMuted ? (
                            <>
                              <MicOff className="w-3 h-3 mr-1" />
                              Muted
                            </>
                          ) : (
                            <>
                              <Mic className="w-3 h-3 mr-1" />
                              Mic
                            </>
                          )}
                        </Button>

                        {/* Pause/Resume Control */}
                        <Button
                          variant={sessionControlState === 'paused' ? 'default' : 'outline'}
                          size="sm"
                          onClick={handlePauseResume}
                          disabled={isConnecting || isLoading || isTransitioning}
                          className="h-8"
                        >
                          {isTransitioning ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : sessionControlState === 'paused' ? (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3 mr-1" />
                              Pause
                            </>
                          )}
                        </Button>

                        {/* End Session Control */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleEndSession}
                          disabled={isConnecting || isLoading || isTransitioning}
                          className="h-8"
                        >
                          {isTransitioning ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              End Session
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* New 80/20 Layout */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex gap-6 h-[calc(100vh-200px)]">

            {/* Left Pane: Teaching Board (80%) */}
            <div className="flex-[4]">
              <TeachingBoard
                sessionId={sessionId || undefined}
                topic={currentTopic}
                className="h-full"
              />
            </div>

            {/* Right Pane: Tabbed Panel (20%) */}
            <div className="flex-[1] min-w-[300px]">
              <Card className="flex flex-col h-full">
                <CardHeader className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">AI Teacher</CardTitle>
                      <CardDescription className="text-xs">Real-time transcription with math</CardDescription>
                    </div>
                  </div>
                  {/* Tab Switcher */}
                  <div className="flex space-x-1 bg-muted p-1 rounded-md mt-2">
                    <button
                      onClick={() => setActiveTab('transcript')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        activeTab === 'transcript'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-background/50'
                      }`}
                    >
                      📝 Transcript
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        activeTab === 'notes'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-background/50'
                      }`}
                    >
                      📔 Notes
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  {activeTab === 'transcript' ? (
                    <TranscriptionDisplay
                      sessionId={sessionId || undefined}
                      className="h-full"
                    />
                  ) : (
                    <NotesPanel
                      sessionId={sessionId || undefined}
                      topic={currentTopic}
                      className="h-full"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* LiveKit Voice Connection (Hidden) */}
          {roomName && userId && isActive && (
            <div className="hidden">
              <LiveKitRoom
                roomName={roomName}
                participantId={userId}
                participantName={`Student-${userId.slice(0, 8)}`}
                onConnected={() => {
                  setVoiceConnected(true);
                  console.log('LiveKit voice connected');
                }}
                onDisconnected={() => {
                  setVoiceConnected(false);
                  console.log('LiveKit voice disconnected');
                }}
                onError={(error) => {
                  console.error('LiveKit error:', error);
                  setErrorBoundary({ hasError: true, error });
                }}
              />
            </div>
          )}

          {/* Status Alerts */}
          {isPaused && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Session is paused. Click the play button to resume.
              </AlertDescription>
            </Alert>
          )}

          {voiceError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {voiceError}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={clearError}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Session encountered an error. Attempting to recover...
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // Show start session interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start AI Learning Session</CardTitle>
          <CardDescription>
            Connect with your AI Mathematics teacher for personalized learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          {!audioControls.hasPermissions && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Microphone access is required for voice conversations with your AI teacher.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Topic */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Current Topic</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{currentTopic}</p>
            </div>
          </div>

          {/* Session Features */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              ✓ Real-time AI teacher with voice interaction
            </p>
            <p className="text-sm text-muted-foreground">
              ✓ Live mathematical equation rendering
            </p>
            <p className="text-sm text-muted-foreground">
              ✓ Personalized to your learning pace
            </p>
            <p className="text-sm text-muted-foreground">
              ✓ Interactive Q&A throughout the lesson
            </p>
          </div>

          {/* Error Display */}
          {(voiceError || errorBoundary.hasError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {voiceError || errorBoundary.error?.message || 'An error occurred'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={clearErrorBoundary}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Start Button */}
          <Button
            onClick={startVoiceSession}
            disabled={isConnecting || isLoading}
            size="lg"
            className="w-full"
          >
            {(isConnecting || isLoading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to AI Teacher...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Learning Session
              </>
            )}
          </Button>

          {/* Back to Dashboard */}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}