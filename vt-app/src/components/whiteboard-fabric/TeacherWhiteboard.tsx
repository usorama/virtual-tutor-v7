'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, Text, Rect } from 'fabric';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { Track, LocalVideoTrack } from 'livekit-client';
import { FabricCanvas } from './FabricCanvas';
import { DrawingTools, DrawingTool } from './DrawingTools';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, MonitorOff, Users, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeacherWhiteboardProps {
  className?: string;
}

export function TeacherWhiteboard({ className }: TeacherWhiteboardProps) {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Handle canvas ready
   */
  const handleCanvasReady = useCallback((fabricCanvas: Canvas) => {
    setCanvas(fabricCanvas);
    // @ts-ignore - Access the actual canvas element
    canvasElementRef.current = fabricCanvas.getElement();

    console.log('Teacher whiteboard canvas ready');
  }, []);

  /**
   * Start streaming the canvas
   */
  const startStreaming = useCallback(async () => {
    if (!canvasElementRef.current || !room || !localParticipant) {
      setStreamError('Canvas or room not ready');
      return;
    }

    try {
      setStreamError(null);

      // Capture canvas stream at 30fps
      const stream = canvasElementRef.current.captureStream(30);
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track available from canvas');
      }

      // Create LiveKit LocalVideoTrack
      const localVideoTrack = new LocalVideoTrack(videoTrack);

      videoTrackRef.current = localVideoTrack;

      // Publish to room
      await localParticipant.localParticipant.publishTrack(localVideoTrack, {
        name: 'whiteboard',
        source: Track.Source.ScreenShare, // Use screenshare source for whiteboard
      });

      setIsStreaming(true);
      console.log('Started streaming whiteboard');
    } catch (error) {
      console.error('Error starting stream:', error);
      setStreamError(error instanceof Error ? error.message : 'Failed to start streaming');
      setIsStreaming(false);
    }
  }, [room, localParticipant]);

  /**
   * Stop streaming
   */
  const stopStreaming = useCallback(async () => {
    try {
      if (videoTrackRef.current && localParticipant) {
        await localParticipant.localParticipant.unpublishTrack(videoTrackRef.current);
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsStreaming(false);
      console.log('Stopped streaming whiteboard');
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  }, [localParticipant]);

  /**
   * Toggle streaming
   */
  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  }, [isStreaming, startStreaming, stopStreaming]);

  /**
   * Add sample math content for Class X Chapter 1
   */
  const addMathContent = useCallback(() => {
    if (!canvas) return;

    // Clear existing content
    canvas.clear();
    canvas.backgroundColor = 'white';

    // Title
    const title = new Text('Class X - Chapter 1: Real Numbers', {
      left: 50,
      top: 30,
      fontSize: 28,
      fontWeight: 'bold',
      fill: '#1a1a1a',
      fontFamily: 'Arial',
    });
    canvas.add(title);

    // Euclid's Division Lemma
    const lemmaTitle = new Text("1. Euclid\'s Division Lemma:", {
      left: 50,
      top: 90,
      fontSize: 20,
      fontWeight: 'bold',
      fill: '#2563eb',
      fontFamily: 'Arial',
    });
    canvas.add(lemmaTitle);

    const lemmaText = new Text(
      'For any two positive integers a and b,\nthere exist unique integers q and r such that:\n\na = bq + r, where 0 ≤ r < b',
      {
        left: 50,
        top: 130,
        fontSize: 18,
        fill: '#333',
        fontFamily: 'Arial',
        lineHeight: 1.5,
      }
    );
    canvas.add(lemmaText);

    // Example
    const exampleTitle = new Text('Example:', {
      left: 50,
      top: 230,
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#059669',
      fontFamily: 'Arial',
    });
    canvas.add(exampleTitle);

    const exampleText = new Text(
      'Find HCF of 455 and 42 using Euclid\'s algorithm:\n\n455 = 42 × 10 + 35\n42 = 35 × 1 + 7\n35 = 7 × 5 + 0\n\nTherefore, HCF(455, 42) = 7',
      {
        left: 50,
        top: 260,
        fontSize: 16,
        fill: '#333',
        fontFamily: 'Courier New',
        lineHeight: 1.6,
      }
    );
    canvas.add(exampleText);

    // Draw a box around the example
    const exampleBox = new Rect({
      left: 40,
      top: 250,
      width: 350,
      height: 150,
      fill: 'transparent',
      stroke: '#059669',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
    });
    canvas.add(exampleBox);
    // Note: In fabric v6, layering is handled differently
    // The box will be behind text added after it

    // Fundamental Theorem
    const theoremTitle = new Text('2. Fundamental Theorem of Arithmetic:', {
      left: 50,
      top: 430,
      fontSize: 20,
      fontWeight: 'bold',
      fill: '#2563eb',
      fontFamily: 'Arial',
    });
    canvas.add(theoremTitle);

    const theoremText = new Text(
      'Every composite number can be expressed as a product\nof primes in a unique way (ignoring order).',
      {
        left: 50,
        top: 470,
        fontSize: 18,
        fill: '#333',
        fontFamily: 'Arial',
        lineHeight: 1.5,
      }
    );
    canvas.add(theoremText);

    // Example of prime factorization
    const primeExample = new Text(
      'Example: 140 = 2² × 5 × 7',
      {
        left: 50,
        top: 540,
        fontSize: 18,
        fill: '#dc2626',
        fontFamily: 'Courier New',
        fontWeight: 'bold',
      }
    );
    canvas.add(primeExample);

    canvas.renderAll();
  }, [canvas]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
      }
    };
  }, [isStreaming, stopStreaming]);

  // Calculate participant count safely
  const participantCount = room ? room.numParticipants : 0;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Teacher Whiteboard (Fabric.js)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isStreaming ? 'default' : 'secondary'}>
                {isStreaming ? 'Streaming' : 'Not Streaming'}
              </Badge>
              {room && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {participantCount}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Streaming Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={toggleStreaming}
                variant={isStreaming ? 'destructive' : 'default'}
                className="gap-2"
              >
                {isStreaming ? (
                  <>
                    <MonitorOff className="h-4 w-4" />
                    Stop Streaming
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4" />
                    Start Streaming
                  </>
                )}
              </Button>
              <Button
                onClick={addMathContent}
                variant="outline"
                disabled={!canvas}
              >
                Load Chapter 1: Real Numbers
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {streamError && (
            <Alert variant="destructive">
              <AlertDescription>{streamError}</AlertDescription>
            </Alert>
          )}

          {/* Drawing Tools */}
          <DrawingTools
            canvas={canvas}
            activeTool={activeTool}
            onToolChange={setActiveTool}
          />

          {/* Canvas */}
          <FabricCanvas
            onCanvasReady={handleCanvasReady}
            isTeacher={true}
          />

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Use the drawing tools to create content for your students</p>
            <p>• Click "Start Streaming" to broadcast your whiteboard</p>
            <p>• Students will see your whiteboard in real-time</p>
            <p>• Load sample math content to test the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}