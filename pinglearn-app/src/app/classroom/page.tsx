'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, AlertCircle, Play, Pause, Square, Home } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ChatInterface } from '@/components/classroom/ChatInterface';
import { NotesPanel } from '@/components/classroom/NotesPanel';
import { LiveKitRoom } from '@/components/voice/LiveKitRoom';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useSessionState } from '@/hooks/useSessionState';
import { useSessionMetrics } from '@/hooks/useSessionMetrics';
import { SessionOrchestrator } from '@/protected-core';
import styles from '@/styles/classroom-chat.module.css';

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

  // Metrics available but not used in chat interface
  // const { liveMetrics, qualityScore, engagementTrend } = useSessionMetrics();

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
  const [sessionControlState, setSessionControlState] = useState<'active' | 'paused' | 'ended'>('active');
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Notes panel not implemented yet
  // const [showNotes, setShowNotes] = useState(false);

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

  // PC-011: Sync session state with orchestrator
  useEffect(() => {
    if (!session || !isActive) return;

    const syncInterval = setInterval(() => {
      try {
        const orchestrator = SessionOrchestrator.getInstance();
        const orchestratorState = orchestrator.getSessionState();

        if (orchestratorState) {
          // Sync pause/resume state
          const actualStatus = orchestratorState.status;
          const currentUIState = sessionControlState;

          if (actualStatus === 'paused' && currentUIState !== 'paused') {
            console.log('[PC-011] Syncing UI to paused state');
            setSessionControlState('paused');
          } else if (actualStatus === 'active' && currentUIState !== 'active') {
            console.log('[PC-011] Syncing UI to active state');
            setSessionControlState('active');
          } else if (actualStatus === 'ended' && currentUIState !== 'ended') {
            console.log('[PC-011] Syncing UI to ended state');
            setSessionControlState('ended');
          }
        }
      } catch (error) {
        console.warn('[PC-011] State sync error:', error);
      }
    }, 500); // Check twice per second for responsive UI

    return () => clearInterval(syncInterval);
  }, [session, isActive, sessionControlState]);

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
   * PC-011: Enhanced pause/resume using SessionOrchestrator with real state
   */
  async function handlePauseResume() {
    setIsTransitioning(true);
    try {
      const orchestrator = SessionOrchestrator.getInstance();
      const currentState = orchestrator.getSessionState();

      if (!currentState) {
        throw new Error('No active session in orchestrator');
      }

      console.log('[PC-011] Current orchestrator state:', currentState.status);

      if (currentState.status === 'active') {
        // Pause the session
        await controls.pause();
        orchestrator.pauseSession();
        setSessionControlState('paused');
        console.log('[PC-011] Session paused');
      } else if (currentState.status === 'paused') {
        // Resume the session
        await controls.resume();
        orchestrator.resumeSession();
        setSessionControlState('active');
        console.log('[PC-011] Session resumed');
      } else {
        console.warn('[PC-011] Invalid state for pause/resume:', currentState.status);
      }
    } catch (err) {
      console.error('[PC-011] Session control error:', err);
      setErrorBoundary({
        hasError: true,
        error: err instanceof Error ? err : new Error('Failed to control session')
      });
    } finally {
      setIsTransitioning(false);
    }
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
      const orchestratorState = orchestrator.getSessionState();
      if (orchestratorState?.id) {
        await orchestrator.endSession(orchestratorState.id);
        console.log('[FC-001] Ended session with orchestrator ID:', orchestratorState.id);
      } else if (sessionId) {
        // Fallback to voice session ID
        console.log('[FC-001] Using fallback voice session ID:', sessionId);
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

  // Removed formatDuration as it's not used in chat interface

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

  // Chat-based learning interface
  if (session && (isActive || isPaused)) {
    return (
      <div className={styles.classroomContainer}>
        {/* Minimal Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            {/* Left: Session info */}
            <div className={styles.headerLeft}>
              <h1 className={styles.topic}>{currentTopic}</h1>
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

            {/* Right: Controls */}
            <div className={styles.headerRight}>
              {sessionControlState === 'ended' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant={audioControls.isMuted ? "destructive" : "secondary"}
                    size="sm"
                    onClick={toggleMute}
                    disabled={isConnecting || isLoading || isTransitioning}
                  >
                    {audioControls.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant={sessionControlState === 'paused' ? 'default' : 'outline'}
                    size="sm"
                    onClick={handlePauseResume}
                    disabled={isConnecting || isLoading || isTransitioning}
                  >
                    {isTransitioning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : sessionControlState === 'paused' ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndSession}
                    disabled={isConnecting || isLoading || isTransitioning}
                  >
                    {isTransitioning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content - Chat Interface */}
        <main className={styles.mainContent}>
          <ChatInterface
            sessionId={sessionId || undefined}
            className={styles.chatFullWidth}
          />

          {/* Notes Panel disabled for now
          {showNotes && (
            <div className={styles.notesPanel}>
              <NotesPanel
                sessionId={sessionId || undefined}
                topic={currentTopic}
              />
            </div>
          )}
          */}
        </main>

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

        {/* Status Messages */}
        <div className="fixed bottom-4 right-4 space-y-2 max-w-md">
          {sessionControlState === 'paused' && (
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