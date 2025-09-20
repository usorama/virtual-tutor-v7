'use client';

import { useState, useCallback, useEffect } from 'react';
import { Room } from 'livekit-client';
import { useEnsureRoom } from '@livekit/components-react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import { useSyncDemo } from '@tldraw/sync';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { VoiceCommandProcessor } from './VoiceCommandProcessor';
import { MathNotationOverlay } from './MathNotationOverlay';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { CollaborationIndicator } from './CollaborationIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  MicOff,
  Palette,
  Calculator,
  Users,
  MessageSquare,
  FileText,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiModalClassroomProps {
  sessionId: string;
  isConnected: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onEndSession: () => void;
  studentName: string;
  sessionDuration: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface DrawingCommand {
  action: 'draw' | 'move' | 'select' | 'erase' | 'text' | 'math';
  shape?: 'circle' | 'rectangle' | 'line' | 'arrow' | 'triangle';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  text?: string;
  mathExpression?: string;
  position?: { x: number; y: number };
}

export function MultiModalClassroom({
  sessionId,
  isConnected,
  isMuted,
  onMuteToggle,
  onEndSession,
  studentName,
  sessionDuration,
  connectionQuality
}: MultiModalClassroomProps) {
  // Use LiveKit hook to get room instance
  const liveKitRoom = useEnsureRoom();
  // UI State
  const [isListeningForCommands, setIsListeningForCommands] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<DrawingCommand | null>(null);
  const [mathMode, setMathMode] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Whiteboard State
  const [editor, setEditor] = useState<Editor | null>(null);

  // Real-time collaboration store
  const whiteboardStore = useSyncDemo({
    roomId: `classroom-${sessionId}`,
    userInfo: {
      id: `student-${sessionId}`,
      name: studentName,
      color: '#3b82f6' // Blue for student
    }
  });

  /**
   * Handle voice command execution
   */
  const executeDrawingCommand = useCallback((command: DrawingCommand) => {
    if (!editor) return;

    setLastVoiceCommand(command);

    try {
      switch (command.action) {
        case 'draw':
          if (command.shape) {
            createShape(command.shape, command.position);
          }
          break;
        case 'move':
          if (command.direction && command.distance) {
            moveSelection(command.direction, command.distance);
          }
          break;
        case 'erase':
          eraseSelection();
          break;
        case 'text':
          if (command.text) {
            createText(command.text, command.position);
          }
          break;
        case 'math':
          if (command.mathExpression) {
            createMathExpression(command.mathExpression, command.position);
          }
          break;
      }
    } catch (error) {
      console.error('Error executing drawing command:', error);
    }
  }, [editor]);

  /**
   * Create a shape on the whiteboard
   */
  const createShape = useCallback((shape: string, position?: { x: number; y: number }) => {
    if (!editor) return;

    const center = position || editor.getViewportScreenBounds().center;

    const shapeProps = {
      type: 'geo' as const,
      x: center.x - 50,
      y: center.y - 50,
      props: {
        w: 100,
        h: 100,
        geo: shape === 'circle' ? 'ellipse' :
             shape === 'triangle' ? 'triangle' :
             shape === 'rectangle' ? 'rectangle' :
             shape === 'arrow' ? 'arrow' : 'rectangle',
        color: 'blue',
        fill: 'none',
        size: 'm'
      }
    };

    editor.createShapes([shapeProps]);
  }, [editor]);

  /**
   * Move selected shapes
   */
  const moveSelection = useCallback((direction: string, distance: number) => {
    if (!editor) return;

    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length === 0) return;

    const delta = {
      x: direction === 'right' ? distance : direction === 'left' ? -distance : 0,
      y: direction === 'down' ? distance : direction === 'up' ? -distance : 0
    };

    editor.nudgeShapes(selectedShapes, delta);
  }, [editor]);

  /**
   * Erase selected shapes
   */
  const eraseSelection = useCallback(() => {
    if (!editor) return;

    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length > 0) {
      editor.deleteShapes(selectedShapes.map(s => s.id));
    }
  }, [editor]);

  /**
   * Create text on whiteboard
   */
  const createText = useCallback((text: string, position?: { x: number; y: number }) => {
    if (!editor) return;

    const center = position || editor.getViewportScreenBounds().center;

    const textProps = {
      type: 'text' as const,
      x: center.x,
      y: center.y,
      props: {
        text,
        size: 'm',
        color: 'blue'
      }
    };

    editor.createShapes([textProps]);
  }, [editor]);

  /**
   * Create mathematical expression
   */
  const createMathExpression = useCallback((expression: string, position?: { x: number; y: number }) => {
    if (!editor) return;

    // For now, create as text - will enhance with KaTeX rendering
    const center = position || editor.getViewportScreenBounds().center;

    const mathProps = {
      type: 'text' as const,
      x: center.x,
      y: center.y,
      props: {
        text: `Math: ${expression}`,
        size: 'l',
        color: 'green'
      }
    };

    editor.createShapes([mathProps]);
  }, [editor]);

  /**
   * Handle whiteboard mount
   */
  const handleWhiteboardMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    console.log('Whiteboard mounted with editor:', editorInstance);
  }, []);

  /**
   * Toggle voice command listening
   */
  const toggleVoiceCommands = useCallback(() => {
    setIsListeningForCommands(!isListeningForCommands);
  }, [isListeningForCommands]);

  /**
   * Add message to transcript
   */
  const addToTranscript = useCallback((speaker: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTranscript(prev => [...prev, `[${timestamp}] ${speaker}: ${message}`]);
  }, []);

  return (
    <div className="h-screen flex bg-gradient-to-b from-background to-muted">
      {/* Main Whiteboard Area - 80% */}
      <div className="flex-1 flex flex-col relative">
        {/* Status Indicators - Top Right Overlay */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Users className="h-3 w-3" />
            {collaborators.length + 1}
          </Badge>
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="gap-1 text-xs"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {connectionQuality}
          </Badge>
        </div>

        {/* Whiteboard Toolbar - Top Left Overlay */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-2 border shadow-lg">
            <WhiteboardToolbar
              editor={editor}
              mathMode={mathMode}
              onMathModeToggle={() => setMathMode(!mathMode)}
            />
          </div>
        </div>

        {/* Tldraw Canvas - Full Area */}
        <div className="flex-1 relative">
          <Tldraw
            store={whiteboardStore}
            onMount={handleWhiteboardMount}
          />

          {/* Collaboration Indicator */}
          <CollaborationIndicator
            collaborators={collaborators}
            sessionId={sessionId}
          />

          {/* Math Notation Overlay */}
          {mathMode && (
            <MathNotationOverlay
              editor={editor}
              onMathInsert={createMathExpression}
            />
          )}
        </div>

        {/* Audio Controls - Bottom Center Floating */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-background/95 backdrop-blur-sm rounded-full p-3 border shadow-lg flex items-center gap-3">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="sm"
              onClick={onMuteToggle}
              className="rounded-full"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <div className="text-xs text-muted-foreground px-2">
              {sessionDuration}
            </div>

            <Button
              variant={isListeningForCommands ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceCommands}
              className="rounded-full gap-2"
            >
              <Palette className="h-3 w-3" />
              Voice Drawing
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onEndSession}
              className="rounded-full"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Voice Command Processor - Hidden but Active */}
        {isListeningForCommands && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-background/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg max-w-sm">
              <VoiceCommandProcessor
                onCommand={executeDrawingCommand}
                isActive={isListeningForCommands}
                lastCommand={lastVoiceCommand}
              />
            </div>
          </div>
        )}

        {/* Command Feedback */}
        {lastVoiceCommand && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
            <Badge variant="secondary" className="gap-2 animate-in fade-in duration-300">
              <Palette className="h-3 w-3" />
              {lastVoiceCommand.action} {lastVoiceCommand.shape || lastVoiceCommand.text || lastVoiceCommand.mathExpression}
            </Badge>
          </div>
        )}
      </div>

      {/* Right Sidebar - Transcript & Notes - 20% */}
      <div className="w-80 border-l bg-background/50 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Mathematics Classroom
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Topic: Grade 10 Mathematics | Session: {sessionDuration}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="transcript" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="flex-1 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {transcript.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Conversation will appear here</p>
                    <p className="text-xs mt-1">Speak naturally - you can interrupt anytime</p>
                  </div>
                ) : (
                  transcript.map((line, index) => (
                    <div key={index} className="text-sm p-2 rounded bg-muted/30">
                      {line}
                    </div>
                  ))
                )}

                {/* Placeholder conversation */}
                <div className="space-y-3 opacity-60">
                  <div className="text-sm p-2 rounded bg-blue-50 border-l-2 border-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">AI Tutor</span>
                      <span className="text-xs text-muted-foreground">is listening...</span>
                    </div>
                    <p className="text-muted-foreground text-xs">Speak naturally - you can interrupt anytime</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="flex-1 px-4 pb-4">
            <div className="h-full flex flex-col">
              <textarea
                placeholder="Take notes during your session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 p-3 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Notes auto-save during your session
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}