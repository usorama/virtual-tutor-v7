'use client';

import { useState, useCallback, useEffect } from 'react';
import { Room } from 'livekit-client';
import { Tldraw, Editor } from '@tldraw/tldraw';
import { useSyncDemo } from '@tldraw/sync';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { VoiceCommandProcessor } from './VoiceCommandProcessor';
import { MathNotationOverlay } from './MathNotationOverlay';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { CollaborationIndicator } from './CollaborationIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PanelLeftOpen,
  PanelLeftClose,
  Mic,
  MicOff,
  Palette,
  Calculator,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiModalClassroomProps {
  sessionId: string;
  liveKitRoom: Room | null;
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
  liveKitRoom,
  isConnected,
  isMuted,
  onMuteToggle,
  onEndSession,
  studentName,
  sessionDuration,
  connectionQuality
}: MultiModalClassroomProps) {
  // UI State
  const [whiteboardVisible, setWhiteboardVisible] = useState(true);
  const [isListeningForCommands, setIsListeningForCommands] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<DrawingCommand | null>(null);
  const [mathMode, setMathMode] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);

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
   * Toggle whiteboard visibility
   */
  const toggleWhiteboard = useCallback(() => {
    setWhiteboardVisible(!whiteboardVisible);
  }, [whiteboardVisible]);

  /**
   * Toggle voice command listening
   */
  const toggleVoiceCommands = useCallback(() => {
    setIsListeningForCommands(!isListeningForCommands);
  }, [isListeningForCommands]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        {/* Left: Session Info */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">AI Mathematics Classroom</h1>
          <Badge variant="outline" className="gap-2">
            <Users className="h-3 w-3" />
            {collaborators.length + 1} participant{collaborators.length !== 0 ? 's' : ''}
          </Badge>
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="gap-2"
          >
            Duration: {sessionDuration}
          </Badge>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isListeningForCommands ? "default" : "outline"}
            size="sm"
            onClick={toggleVoiceCommands}
            className="gap-2"
          >
            {isListeningForCommands ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            Voice Drawing
          </Button>

          <Button
            variant={mathMode ? "default" : "outline"}
            size="sm"
            onClick={() => setMathMode(!mathMode)}
            className="gap-2"
          >
            <Calculator className="h-4 w-4" />
            Math Mode
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleWhiteboard}
            className="gap-2"
          >
            {whiteboardVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            {whiteboardVisible ? 'Hide' : 'Show'} Whiteboard
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Audio Interface */}
        <div className={cn(
          "flex flex-col transition-all duration-300",
          whiteboardVisible ? "w-1/2" : "w-full"
        )}>
          {/* Audio Visualizer */}
          <div className="flex-1">
            <AudioVisualizer
              isConnected={isConnected}
              isMuted={isMuted}
              onMuteToggle={onMuteToggle}
              onEndSession={onEndSession}
              studentName={studentName}
              sessionDuration={sessionDuration}
              connectionQuality={connectionQuality}
              className="h-full"
            />
          </div>

          {/* Voice Command Processor */}
          {isListeningForCommands && (
            <div className="p-4 border-t">
              <VoiceCommandProcessor
                onCommand={executeDrawingCommand}
                isActive={isListeningForCommands}
                lastCommand={lastVoiceCommand}
              />
            </div>
          )}
        </div>

        {/* Right Side: Interactive Whiteboard */}
        {whiteboardVisible && (
          <div className="w-1/2 border-l flex flex-col">
            {/* Whiteboard Toolbar */}
            <div className="p-2 border-b bg-muted/30">
              <WhiteboardToolbar
                editor={editor}
                mathMode={mathMode}
                onMathModeToggle={() => setMathMode(!mathMode)}
              />
            </div>

            {/* Tldraw Canvas */}
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
          </div>
        )}
      </div>

      {/* Command Feedback */}
      {lastVoiceCommand && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Badge variant="secondary" className="gap-2 animate-in fade-in duration-300">
            <Palette className="h-3 w-3" />
            Last command: {lastVoiceCommand.action} {lastVoiceCommand.shape || lastVoiceCommand.text || lastVoiceCommand.mathExpression}
          </Badge>
        </div>
      )}
    </div>
  );
}