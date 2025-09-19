'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom, AudioConference, ControlBar, useTracks, TrackReference } from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, Room, RoomEvent, ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { AudioStreamManager, AudioQualityMonitor } from '@/lib/livekit/audio-manager';
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
  
  // Check authentication and load user data
  useEffect(() => {
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
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      router.push('/login?redirect=/classroom');
      return;
    }
    
    setUserId(user.id);
    
    // Load user profile for topic preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_chapter, current_subject')
      .eq('id', user.id)
      .single();
    
    if (profile?.current_chapter) {
      // Get chapter name
      const { data: chapter } = await supabase
        .from('chapters')
        .select('title')
        .eq('id', profile.current_chapter)
        .single();
      
      if (chapter) {
        setCurrentTopic(chapter.title);
      }
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
        throw new Error('Failed to create room');
      }
      
      const data: SessionData = await response.json();
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
    if (!sessionData) return;
    
    try {
      // Get the session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      // End session in backend
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
        audioManager.cleanup();
      }
      
      // Reset state
      setSessionData(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      setConnectionState(ConnectionState.Disconnected);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error ending session:', err);
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
  function handleRoomConnected(room: Room) {
    setConnectionState(ConnectionState.Connected);
    setIsConnecting(false);
    
    // Initialize audio manager with room
    if (audioManager) {
      audioManager.initializeAudio(room);
    }
    
    // Listen for connection quality changes
    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant === room.localParticipant) {
        console.log('Connection quality:', quality);
      }
    });
  }
  
  /**
   * Handle room disconnection
   */
  function handleRoomDisconnected() {
    setConnectionState(ConnectionState.Disconnected);
    endSession();
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <LiveKitRoom
          token={sessionData.token}
          serverUrl={sessionData.url}
          connect={true}
          audio={true}
          video={false}
          onConnected={() => handleRoomConnected(undefined as any)}
          onDisconnected={handleRoomDisconnected}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Mathematics Classroom</CardTitle>
                    <CardDescription>
                      Topic: {currentTopic} | Session: {formatDuration(sessionDuration)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={connectionState === ConnectionState.Connected ? 'default' : 'secondary'}>
                      {connectionState === ConnectionState.Connected ? 'Connected' : 'Connecting...'}
                    </Badge>
                    <Badge className={getQualityColor(audioQuality)}>
                      {audioQuality} quality
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Main Audio Interface */}
            <Card className="min-h-[400px]">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-8">
                  {/* AI Avatar/Visualization */}
                  <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full animate-pulse opacity-50" />
                    <div 
                      className="w-32 h-32 rounded-full bg-primary/30 flex items-center justify-center"
                      style={{
                        transform: `scale(${1 + volumeLevel * 0.5})`,
                        transition: 'transform 0.1s ease-out'
                      }}
                    >
                      <Volume2 className="w-16 h-16 text-primary" />
                    </div>
                  </div>
                  
                  {/* Status Text */}
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">
                      {connectionState === ConnectionState.Connected 
                        ? 'AI Tutor is listening...' 
                        : 'Connecting to AI Tutor...'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Speak naturally - you can interrupt anytime
                    </p>
                  </div>
                  
                  {/* Audio Level Indicator */}
                  <div className="w-full max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Audio Level:</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-100"
                          style={{ width: `${volumeLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isMuted ? "destructive" : "default"}
                    size="lg"
                    onClick={toggleMute}
                    className="gap-2"
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={endSession}
                    className="gap-2"
                  >
                    <PhoneOff className="w-5 h-5" />
                    End Session
                  </Button>
                </div>
                
                {/* Additional Controls */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Tip: Press and hold spacebar for push-to-talk
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Hidden Audio Conference Component */}
            <div className="hidden">
              <AudioConference />
            </div>
          </div>
        </LiveKitRoom>
      </div>
    );
  }
  
  // Show start session interface
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