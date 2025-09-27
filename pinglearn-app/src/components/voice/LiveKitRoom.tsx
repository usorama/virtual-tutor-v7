'use client';

import { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import { EventEmitter } from 'events';

// Create shared event bus for LiveKit data communication
export const liveKitEventBus = new EventEmitter();

interface LiveKitRoomProps {
  roomName: string;
  participantId: string;
  participantName: string;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
}

export function LiveKitRoom({
  roomName,
  participantId,
  participantName,
  onConnected,
  onDisconnected,
  onError
}: LiveKitRoomProps) {
  const [room] = useState(() => new Room());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  // Audio volume fade-in system for show-then-tell methodology
  const audioFadeTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const attachedAudioElementsRef = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    return () => {
      room.disconnect();

      // Clean up audio fade timeouts
      audioFadeTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      audioFadeTimeoutsRef.current = [];

      // Clean up attached audio elements
      attachedAudioElementsRef.current = [];

      // Clean up event bus listeners when component unmounts
      liveKitEventBus.removeAllListeners();
    };
  }, [room]);

  // Auto-connect when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connectToRoom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const connectToRoom = async () => {
    try {
      setIsConnecting(true);

      // Get token from PC-005 endpoint
      const tokenResponse = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantId,
          participantName
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token } = await tokenResponse.json();

      // Connect to LiveKit cloud
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);

      setIsConnected(true);
      onConnected();
    } catch (error) {
      console.error('LiveKit connection error:', error);
      onError(error as Error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromRoom = () => {
    room.disconnect();
    setIsConnected(false);
    onDisconnected();
  };

  // Handle remote audio tracks (teacher voice) with volume fade-in
  useEffect(() => {
    const handleTrackSubscribed = (
      track: RemoteTrack,
      _publication: RemoteTrackPublication
    ) => {
      if (track.kind === 'audio' && audioElementRef.current) {
        console.log('[LiveKitRoom] Audio track received - attaching immediately but muted');

        // Attach immediately but muted (volume = 0) for show-then-tell methodology
        const audioElement = track.attach() as HTMLAudioElement;
        audioElement.volume = 0; // Start muted
        audioElement.autoplay = true;

        // Store the audio element for later volume control
        attachedAudioElementsRef.current.push(audioElement);

        // Also attach to the main audio ref if it exists
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = audioElement.srcObject;
          audioElementRef.current.volume = 0;
        }

        console.log('[LiveKitRoom] Audio track attached but muted for show-then-tell timing');
      }
    };

    const handleTrackUnsubscribed = (
      track: RemoteTrack
    ) => {
      track.detach();
    };

    const handleConnected = () => {
      setIsConnected(true);
      onConnected();
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      onDisconnected();
    };

    const handleConnectionQualityChanged = (quality: unknown) => {
      console.log('Connection quality:', quality);
    };

    // Handle data packets (transcriptions)
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'transcript') {
          console.log('[LiveKitRoom] Transcript received, emitting to SessionOrchestrator');

          // Emit event for SessionOrchestrator
          liveKitEventBus.emit('livekit:transcript', {
            segments: data.segments,
            speaker: data.speaker || 'teacher',
            timestamp: Date.now()
          });

          // SHOW-THEN-TELL: Trigger volume fade-in (400ms after visual)
          console.log(`[LiveKitRoom] Transcript received - scheduling audio fade-in for show-then-tell`);

          // Schedule audio volume fade-in 400ms later
          const fadeTimeout = setTimeout(() => {
            console.log('[LiveKitRoom] Fading in audio volume (400ms after visual)');

            // Fade in volume for all attached audio elements
            attachedAudioElementsRef.current.forEach(audioElement => {
              try {
                // Smooth fade-in over 100ms
                audioElement.volume = 0;
                const fadeSteps = 10;
                const stepDuration = 100 / fadeSteps; // 10ms per step
                const volumeStep = 1 / fadeSteps;

                let currentStep = 0;
                const fadeInterval = setInterval(() => {
                  currentStep++;
                  audioElement.volume = Math.min(1, currentStep * volumeStep);

                  if (currentStep >= fadeSteps) {
                    clearInterval(fadeInterval);
                    audioElement.volume = 1; // Ensure final volume
                    console.log('[LiveKitRoom] Audio fade-in completed');
                  }
                }, stepDuration);

              } catch (error) {
                console.error('[LiveKitRoom] Error fading in audio:', error);
              }
            });

            // Also fade in the main audio element
            if (audioElementRef.current) {
              audioElementRef.current.volume = 1;
            }
          }, 400); // 400ms delay for show-then-tell methodology

          // Store timeout for cleanup
          audioFadeTimeoutsRef.current.push(fadeTimeout);
        }
      } catch (error) {
        console.error('[LiveKitRoom] Error processing data packet:', error);
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged);
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, onConnected, onDisconnected]);

  return (
    <div className="livekit-room">
      <audio ref={audioElementRef} autoPlay />

      {isConnecting && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Connecting to voice session...</span>
        </div>
      )}

      {isConnected && (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="w-4 h-4 bg-green-600 rounded-full animate-pulse"></div>
          <span>🎤 Connected to AI Teacher</span>
        </div>
      )}

      <div className="flex space-x-2 mt-4">
        {!isConnected ? (
          <button
            onClick={connectToRoom}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect Audio'}
          </button>
        ) : (
          <button
            onClick={disconnectFromRoom}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}