'use client';

import { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, RemoteTrack, RemoteTrackPublication } from 'livekit-client';
import performanceMonitor from '@/lib/performance/performance-monitor';
import { FEATURES } from '@/config/features';
import { getEventBus } from '@/lib/events/event-bus';

// PC-016: Use centralized EventBus singleton instead of local EventEmitter
// This allows both client and server code to share the same event bus
export const liveKitEventBus = getEventBus();

interface LiveKitRoomProps {
  roomName: string;
  participantId: string;
  participantName: string;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
  // PC-015: Metadata for dynamic prompt generation in Python agent
  metadata?: {
    topic: string;
    subject: string;
    grade: string;
  };
}

export function LiveKitRoom({
  roomName,
  participantId,
  participantName,
  onConnected,
  onDisconnected,
  onError,
  metadata
}: LiveKitRoomProps) {
  const [room] = useState(() => new Room());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  // Enable performance monitoring for show-then-tell timing
  useEffect(() => {
    const timingEnabled = FEATURES.showThenTellTiming;
    if (timingEnabled) {
      performanceMonitor.enable();
      console.log('[LiveKitRoom] Show-Then-Tell timing measurement enabled');
    }
  }, []);

  useEffect(() => {
    return () => {
      room.disconnect();

      // PC-016: Don't clear entire event bus on unmount (it's a singleton)
      // Individual listeners are cleaned up by their respective components
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

      // PC-015: Get token from v2 endpoint with metadata for dynamic prompts
      const tokenResponse = await fetch('/api/v2/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantId,
          participantName,
          metadata // Pass metadata so Python agent can use dynamic prompts
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

  // Handle remote audio tracks (teacher voice)
  useEffect(() => {
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication
    ) => {
      if (track.kind === 'audio' && audioElementRef.current) {
        // Natural audio attachment - no artificial delay
        console.log('[LiveKitRoom] Audio track received - attaching naturally');
        track.attach(audioElementRef.current);
        console.log('[LiveKitRoom] Audio track attached - text and audio sync naturally');
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
      console.log('[DEBUG-TRANSCRIPT] Data packet received, size:', payload.length, 'bytes');

      try {
        const decoder = new TextDecoder();
        const rawData = decoder.decode(payload);
        console.log('[DEBUG-TRANSCRIPT] Decoded data:', rawData);

        const data = JSON.parse(rawData);
        console.log('[DEBUG-TRANSCRIPT] Parsed data:', JSON.stringify(data));

        if (data.type === 'transcript') {
          console.log('[DEBUG-TRANSCRIPT] ✅ Transcript type confirmed');
          console.log('[DEBUG-TRANSCRIPT] Segments:', data.segments);
          console.log('[DEBUG-TRANSCRIPT] Speaker:', data.speaker);
          console.log('[LiveKitRoom] Transcript received, emitting to SessionOrchestrator');

          // 🎯 SHOW-THEN-TELL TIMING MEASUREMENT: Record text arrival time
          const textTimestamp = performance.now();

          // FC-010: The server sends transcripts 400ms before audio
          // The showThenTell flag indicates this is an advanced transcript
          if (data.showThenTell) {
            console.log('[LiveKitRoom] Show-Then-Tell transcript received (400ms before audio)');

            // Record show-then-tell text timing metric
            performanceMonitor.addMetric({
              name: 'show-then-tell-text-arrival',
              value: textTimestamp,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'user-interaction'
            });
          }

          // Emit event for SessionOrchestrator
          const eventData = {
            segments: data.segments,
            speaker: data.speaker || 'teacher',
            timestamp: Date.now(),
            showThenTell: data.showThenTell || false,
            audioDelay: data.audioDelay || 0,
            textTimestamp // Pass timing for further analysis
          };

          console.log('[DEBUG-TRANSCRIPT] Emitting to event bus:', JSON.stringify(eventData));
          liveKitEventBus.emit('livekit:transcript', eventData);
          console.log('[DEBUG-TRANSCRIPT] Event emitted successfully');
        } else {
          console.log('[DEBUG-TRANSCRIPT] ❌ Data type is not "transcript":', data.type);
        }
      } catch (error) {
        console.error('[DEBUG-TRANSCRIPT] ❌ Error processing data packet:', error);
        console.error('[DEBUG-TRANSCRIPT] Payload bytes:', Array.from(payload).slice(0, 100));
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    console.log('[DEBUG-TRANSCRIPT] Event listeners attached, DataReceived handler ready');

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