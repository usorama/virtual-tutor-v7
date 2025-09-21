'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Loader2, AlertCircle, Play, Pause, Square } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TranscriptionDisplay } from '@/components/transcription/TranscriptionDisplay';
import { SessionOrchestrator } from '@/protected-core';

interface SessionData {
  sessionId: string;
  studentId: string;
  topic: string;
  startTime: number;
  status: 'idle' | 'connecting' | 'active' | 'paused' | 'ended';
}

export default function ClassroomPage() {
  const router = useRouter();
  const supabase = createClient();

  // Session state
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('General Mathematics');

  // Orchestrator instance
  const [orchestrator, setOrchestrator] = useState<SessionOrchestrator | null>(null);

  // Check authentication and load user data
  useEffect(() => {
    checkAuth();

    // Get orchestrator singleton instance
    const orch = SessionOrchestrator.getInstance();
    setOrchestrator(orch);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update session duration timer
  useEffect(() => {
    if (sessionStartTime && !isPaused) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionStartTime, isPaused]);

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
   * Request microphone permissions
   */
  async function requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Stop the stream immediately - we just needed to request permissions
      stream.getTracks().forEach(track => track.stop());

      setHasPermissions(true);
      return true;
    } catch (err) {
      console.error('Permission denied:', err);
      setError('Microphone access is required for the AI classroom. Please allow microphone access and refresh the page.');
      setHasPermissions(false);
      return false;
    }
  }

  /**
   * Start a new learning session
   */
  async function startSession() {
    if (!userId || !orchestrator) {
      setError('Please log in to start a session');
      return;
    }

    // Request permissions first
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Start the session with config
      const sessionId = await orchestrator.startSession({
        studentId: userId,
        topic: currentTopic,
        voiceEnabled: true,
        mathTranscriptionEnabled: true
      });

      // Update session data
      setSessionData({
        sessionId,
        studentId: userId,
        topic: currentTopic,
        startTime: Date.now(),
        status: 'active'
      });

      setSessionStartTime(new Date());
      setIsConnecting(false);

      console.log('Session started successfully:', sessionId);

    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session. Please try again.');
      setIsConnecting(false);
    }
  }

  /**
   * Pause/Resume the session
   */
  async function togglePause() {
    if (!orchestrator || !sessionData) return;

    if (isPaused) {
      await orchestrator.resumeSession();
      setIsPaused(false);
      setSessionData(prev => prev ? {...prev, status: 'active'} : null);
    } else {
      await orchestrator.pauseSession();
      setIsPaused(true);
      setSessionData(prev => prev ? {...prev, status: 'paused'} : null);
    }
  }

  /**
   * End the current session
   */
  async function endSession() {
    if (!orchestrator || !sessionData) return;

    try {
      await orchestrator.endSession(sessionData.sessionId);

      // Save session to Supabase
      if (userId) {
        await supabase.from('learning_sessions').insert({
          student_id: userId,
          topic: currentTopic,
          duration: sessionDuration,
          ended_at: new Date().toISOString()
        });
      }

      // Reset state
      setSessionData(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      setIsPaused(false);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session properly');
    }
  }

  /**
   * Toggle mute state
   */
  async function toggleMute() {
    if (!orchestrator) return;

    // This would be connected to the actual audio stream
    setIsMuted(!isMuted);
  }

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

  // If we have an active session, show the transcription interface
  if (sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Session Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>AI Learning Session</CardTitle>
                  <CardDescription>
                    {currentTopic} • Duration: {formatDuration(sessionDuration)}
                  </CardDescription>
                </div>

                {/* Session Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="icon"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={togglePause}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={endSession}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Transcription Display */}
          <TranscriptionDisplay
            sessionId={sessionData.sessionId}
            className="min-h-[600px]"
          />

          {/* Status Alerts */}
          {isPaused && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Session is paused. Click the play button to resume.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
          {!hasPermissions && (
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
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Start Button */}
          <Button
            onClick={startSession}
            disabled={isConnecting}
            size="lg"
            className="w-full"
          >
            {isConnecting ? (
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