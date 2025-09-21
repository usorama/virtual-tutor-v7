'use client';

import { useEffect, useRef, useState } from 'react';
import { useRoomContext, useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Users, Monitor, MonitorOff, Loader2 } from 'lucide-react';

interface StudentWhiteboardProps {
  className?: string;
}

export function StudentWhiteboard({ className }: StudentWhiteboardProps) {
  const room = useRoomContext();
  const [isReceivingStream, setIsReceivingStream] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Get all screen share tracks (whiteboard is published as screen share)
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);

  // Find the whiteboard track
  const whiteboardTrack = screenShareTracks.find(
    (trackRef) => trackRef.publication?.trackName === 'whiteboard'
  );

  useEffect(() => {
    if (room) {
      setConnectionStatus(room.state === 'connected' ? 'connected' : 'connecting');
    }
  }, [room]);

  useEffect(() => {
    setIsReceivingStream(!!whiteboardTrack?.publication);
  }, [whiteboardTrack]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  // Calculate participant count safely
  const participantCount = room ? room.numParticipants : 0;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Student View - Whiteboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant={isReceivingStream ? 'default' : 'secondary'}
                className="gap-1"
              >
                {isReceivingStream ? (
                  <>
                    <Monitor className="h-3 w-3" />
                    Receiving
                  </>
                ) : (
                  <>
                    <MonitorOff className="h-3 w-3" />
                    No Stream
                  </>
                )}
              </Badge>
              {room && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {participantCount}
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`} />
                <span className="text-xs text-muted-foreground capitalize">
                  {connectionStatus}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Whiteboard Display Area */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ minHeight: '700px' }}>
            {whiteboardTrack?.publication ? (
              <VideoTrack
                trackRef={whiteboardTrack}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />
                    <p className="text-gray-600 text-lg">Connecting to classroom...</p>
                    <p className="text-gray-500 text-sm mt-2">Please wait while we establish connection</p>
                  </>
                ) : (
                  <>
                    <MonitorOff className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">Waiting for teacher to start sharing</p>
                    <p className="text-gray-500 text-sm mt-2">The whiteboard will appear here once your teacher starts</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Connection Info */}
          {!isReceivingStream && connectionStatus === 'connected' && (
            <Alert>
              <AlertDescription>
                You are connected to the classroom. The whiteboard will appear when your teacher starts sharing.
              </AlertDescription>
            </Alert>
          )}

          {/* Student Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Student Guidelines:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>You can view the whiteboard content shared by your teacher</li>
              <li>The whiteboard updates in real-time as your teacher writes</li>
              <li>You cannot directly interact with the whiteboard</li>
              <li>Take notes as needed while following along</li>
              <li>Use the audio channel to ask questions</li>
            </ul>
          </div>

          {/* Current Topic */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">Current Topic</h3>
            <p className="text-blue-800">Class X Mathematics - Chapter 1: Real Numbers</p>
            <div className="mt-2 text-xs text-blue-600 space-y-1">
              <p>• Euclid's Division Lemma</p>
              <p>• Fundamental Theorem of Arithmetic</p>
              <p>• Rational and Irrational Numbers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}