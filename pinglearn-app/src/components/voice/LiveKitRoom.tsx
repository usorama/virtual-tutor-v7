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

  // Audio delay system for show-then-tell methodology
  const pendingAudioTracksRef = useRef<RemoteTrack[]>([]);
  const audioDelayTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      room.disconnect();

      // Clean up audio delay timeouts
      audioDelayTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      audioDelayTimeoutsRef.current = [];

      // Clean up pending audio tracks
      pendingAudioTracksRef.current = [];

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

  // Handle remote audio tracks (teacher voice) with 400ms delay
  useEffect(() => {
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication
    ) => {
      if (track.kind === 'audio' && audioElementRef.current) {
        console.log('[LiveKitRoom] Audio track received - storing for delayed playback');

        // Store track for delayed attachment (show-then-tell methodology)
        pendingAudioTracksRef.current.push(track);

        // NOTE: We don't immediately attach the track here!
        // Audio will be delayed by 400ms and triggered by transcript events
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

    const handleConnectionQualityChanged = (quality: any) => {
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

          // SHOW-THEN-TELL: Trigger delayed audio playback (400ms after visual)
          console.log(`[LiveKitRoom] Transcript received - scheduling audio delay for show-then-tell`);

          // Schedule audio playback 400ms later
          const audioTimeout = setTimeout(() => {
            console.log('[LiveKitRoom] Playing delayed audio (400ms after visual)');

            // Attach any pending audio tracks
            if (pendingAudioTracksRef.current.length > 0 && audioElementRef.current) {
              pendingAudioTracksRef.current.forEach(track => {
                try {
                  track.attach(audioElementRef.current!);
                  console.log('[LiveKitRoom] Audio track attached with 400ms delay');
                } catch (error) {
                  console.error('[LiveKitRoom] Error attaching delayed audio:', error);
                }
              });

              // Clear pending tracks after attachment
              pendingAudioTracksRef.current = [];
            }
          }, 400); // 400ms delay for show-then-tell methodology

          // Store timeout for cleanup
          audioDelayTimeoutsRef.current.push(audioTimeout);
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