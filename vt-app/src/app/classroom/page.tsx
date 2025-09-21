'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom, AudioConference, ControlBar, useTracks, TrackReference } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent, ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { AudioStreamManager, AudioQualityMonitor } from '@/lib/livekit/audio-manager';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { MultiModalClassroom } from '@/components/classroom/MultiModalClassroom';
import { createClient } from '@/lib/supabase/client';

interface SessionData {
  token: string;
  roomName: string;
  sessionId: string;
  url: string;
}

export default function ClassroomPage() {
  const router = useRouter();
  const supabase = createClient();

  console.log('🎯 ClassroomPage: Component mounting');

  // Session state
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [audioManager, setAudioManager] = useState<AudioStreamManager | null>(null);
  const [audioQuality, setAudioQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('General Mathematics');
  
  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [hasConnectedSuccessfully, setHasConnectedSuccessfully] = useState(false);
  
  // Check authentication and load user data
  useEffect(() => {
    console.log('🔐 ClassroomPage: useEffect triggered - calling checkAuth');
    checkAuth();
  }, []);
  
  // Update session duration timer
  useEffect(() => {
    if (sessionStartTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [sessionStartTime]);
  
  /**
   * Check if user is authenticated
   */
  async function checkAuth() {
    console.log('🔐 checkAuth: Starting authentication check');

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('🔐 checkAuth: Auth result', { user: user?.id, error: error?.message });

      if (error || !user) {
        console.log('🔐 checkAuth: No user or error, redirecting to login');
        router.push('/login?redirect=/classroom');
        return;
      }

      console.log('🔐 checkAuth: Setting userId:', user.id);
      setUserId(user.id);

      // Load user profile for topic preference
      console.log('🔐 checkAuth: Loading user profile');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('grade, preferred_subjects, selected_topics')
        .eq('id', user.id)
        .single();

      console.log('🔐 checkAuth: Profile result', { profile, profileError: profileError?.message });

      if (profile?.preferred_subjects && profile.preferred_subjects.length > 0) {
        const topic = `Grade ${profile.grade} ${profile.preferred_subjects[0]}`;
        console.log('🔐 checkAuth: Setting current topic:', topic);
        setCurrentTopic(topic);
      }

      console.log('🔐 checkAuth: Authentication check completed successfully');
    } catch (err) {
      console.error('🔐 checkAuth: Unexpected error during auth check:', err);
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
    if (!userId) {
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
    setHasConnectedSuccessfully(false); // Reset connection flag for new session
    
    try {
      // Get the session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create room and get token
      const response = await fetch('/api/livekit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'create-room',
          chapterId: currentTopic,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to create room: ${errorData.error || response.statusText}`);
      }
      
      const data: SessionData = await response.json();
      console.log('Session created successfully:', data);
      setSessionData(data);
      setSessionStartTime(new Date());
      
      // Initialize audio manager
      const manager = new AudioStreamManager();
      setAudioManager(manager);
      
      // Set up audio quality monitoring
      const monitor = new AudioQualityMonitor(manager);
      monitor.subscribe((metrics) => {
        const quality = AudioQualityMonitor.assessQuality(metrics);
        setAudioQuality(quality);
        setVolumeLevel(metrics.audioLevel);
      });
      
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session. Please try again.');
      setIsConnecting(false);
    }
  }
  
  /**
   * End the current session
   */
  async function endSession() {
    console.log('🔚 endSession: Function called');
    console.trace('🔚 endSession: Call stack trace');

    if (!sessionData) {
      console.log('🔚 endSession: No session data, returning early');
      return;
    }

    console.log('🔚 endSession: Processing session end for session:', sessionData.sessionId);

    try {
      // Get the session for auth
      const { data: { session } } = await supabase.auth.getSession();

      // End session in backend
      console.log('🔚 endSession: Calling backend to end session');
      await fetch('/api/livekit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'end-session',
          sessionId: sessionData.sessionId,
        }),
      });

      // Clean up audio manager
      if (audioManager) {
        console.log('🔚 endSession: Cleaning up audio manager');
        audioManager.cleanup();
      }

      // Reset state
      console.log('🔚 endSession: Resetting state');
      setSessionData(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      setConnectionState(ConnectionState.Disconnected);
      setHasConnectedSuccessfully(false);

      // Redirect to dashboard
      console.log('🔚 endSession: Redirecting to dashboard');
      router.push('/dashboard');
    } catch (err) {
      console.error('🔚 endSession: Error ending session:', err);
    }
  }
  
  /**
   * Toggle mute state
   */
  async function toggleMute() {
    if (audioManager) {
      const newMuteState = await audioManager.toggleMute();
      setIsMuted(newMuteState);
    }
  }
  
  /**
   * Handle room connection
   */
  function handleRoomConnected() {
    console.log('🟢 handleRoomConnected: Room connected successfully');
    setConnectionState(ConnectionState.Connected);
    setIsConnecting(false);
    setHasConnectedSuccessfully(true); // Track successful connection
    setError(null); // Clear any previous errors
    // Note: Room instance can be accessed via useRoom hook inside the LiveKitRoom context

    // Initialize audio manager
    if (audioManager) {
      console.log('🟢 handleRoomConnected: Initializing audio manager');
      // Note: Will initialize audio when room reference is available
    }
  }
  
  /**
   * Handle room disconnection
   */
  function handleRoomDisconnected() {
    console.log('🔴 handleRoomDisconnected: Room disconnected');
    console.trace('🔴 handleRoomDisconnected: Call stack trace');

    setConnectionState(ConnectionState.Disconnected);
    setIsConnecting(false);
    console.log('🔴 handleRoomDisconnected: Room disconnected - cleaning up session');

    // Only auto-redirect if we had a successful connection first
    // This prevents redirect on immediate connection failures (invalid credentials)
    if (hasConnectedSuccessfully && sessionData && sessionStartTime) {
      console.log('🔴 handleRoomDisconnected: Had successful connection - calling endSession due to disconnection');
      endSession();
    } else {
      console.log('🔴 handleRoomDisconnected: No successful connection yet - showing error instead of redirecting');
      setError('Failed to connect to voice session. Please check your internet connection and try again. If the problem persists, the LiveKit service may be temporarily unavailable.');

      // Reset session data but don't redirect
      setSessionData(null);
      setSessionStartTime(null);
      setSessionDuration(0);

      // Clean up audio manager
      if (audioManager) {
        audioManager.cleanup();
        setAudioManager(null);
      }
    }
  }
  
  /**
   * Format duration for display
   */
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get quality indicator color
   */
  function getQualityColor(quality: string): string {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }
  
  // If we have a session, show the LiveKit room
  if (sessionData) {
    console.log('🎬 ClassroomPage: Rendering LiveKit room interface');
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <LiveKitRoom
          token={sessionData.token}
          serverUrl={sessionData.url}
          connect={true}
          audio={true}
          video={false}
          onConnected={handleRoomConnected}
          onDisconnected={handleRoomDisconnected}
        >
          {/* Phase 4 Multi-Modal Classroom */}
          <MultiModalClassroom
            sessionId={sessionData.sessionId}
            isConnected={connectionState === ConnectionState.Connected}
            isMuted={isMuted}
            onMuteToggle={toggleMute}
            onEndSession={endSession}
            studentName="Student"
            sessionDuration={formatDuration(sessionDuration)}
            connectionQuality={audioQuality}
          />

          {/* Hidden Audio Conference Component */}
          <div className="hidden">
            <AudioConference />
          </div>
        </LiveKitRoom>
      </div>
    );
  }
  
  // Show start session interface
  console.log('🎬 ClassroomPage: Rendering start session interface');
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Start Learning Session</CardTitle>
          <CardDescription>
            Connect with your AI Mathematics tutor for personalized learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          {!hasPermissions && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Microphone access is required for voice conversations with your AI tutor.
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
          
          {/* Session Info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Natural voice conversation with AI tutor
            </p>
            <p className="text-sm text-muted-foreground">
              • Personalized to your learning pace
            </p>
            <p className="text-sm text-muted-foreground">
              • Interrupt anytime with questions
            </p>
            <p className="text-sm text-muted-foreground">
              • 30-minute focused sessions
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
                Connecting...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Session
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