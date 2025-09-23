'use client';

import { useEffect, useState, useRef } from 'react';
import { Room, RoomEvent, RemoteTrack, RemoteTrackPublication } from 'livekit-client';

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

  useEffect(() => {
    return () => {
      room.disconnect();
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

  // Handle remote audio tracks (teacher voice)
  useEffect(() => {
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication
    ) => {
      if (track.kind === 'audio' && audioElementRef.current) {
        track.attach(audioElementRef.current);
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
          // DISABLED: SessionOrchestrator handles transcripts to prevent duplicates
          // The SessionOrchestrator listens to LiveKit transcription events
          // and adds them to DisplayBuffer as the single source of truth
          console.log('[LiveKitRoom] Transcript received (handled by SessionOrchestrator):', data.segments.length, 'segments');

          // Previously this component was adding to DisplayBuffer directly,
          // causing duplicate entries. Now SessionOrchestrator manages all transcripts.
        }
      } catch (error) {
        console.error('Error processing data packet:', error);
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