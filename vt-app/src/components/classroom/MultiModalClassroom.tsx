'use client';

import { useState, useCallback, useEffect } from 'react';
import { Room } from 'livekit-client';
import { useEnsureRoom } from '@livekit/components-react';
import { Tldraw, Editor, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import { MathNotationOverlay } from './MathNotationOverlay';
import { CollaborationIndicator } from './CollaborationIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import {
  Mic,
  MicOff,
  Palette,
  Calculator,
  Users,
  MessageSquare,
  FileText,
  Phone,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import '@tldraw/tldraw/tldraw.css';

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
  const [mathMode, setMathMode] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Whiteboard State
  const [editor, setEditor] = useState<Editor | null>(null);

  // Create store without sync to avoid watermark
  const [store] = useState(() => {
    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    return store;
  });






  /**
   * Handle whiteboard mount
   */
  const handleWhiteboardMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    console.log('Whiteboard mounted with editor:', editorInstance);
  }, []);


  /**
   * Add message to transcript
   */
  const addToTranscript = useCallback((speaker: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTranscript(prev => [...prev, `[${timestamp}] ${speaker}: ${message}`]);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-b from-background to-muted">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Main Whiteboard Panel */}
        <Panel defaultSize={80} minSize={60} maxSize={90}>
          <div className="h-full relative flex flex-col">
            {/* Status Indicators - Fixed Top Right */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs bg-background/95 backdrop-blur-sm">
                <Users className="h-3 w-3" />
                {collaborators.length + 1}
              </Badge>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="gap-1 text-xs bg-background/95 backdrop-blur-sm"
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-background/95 backdrop-blur-sm">
                {connectionQuality}
              </Badge>
            </div>

            {/* Tldraw Canvas - Full Height with native UI */}
            <div className="flex-1 relative">
              <Tldraw
                store={store}
                onMount={handleWhiteboardMount}
                hideUi={false}  // Keep tldraw's native UI
                inferDarkMode
                licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY || undefined}
              />

              {/* Collaboration Indicator */}
              <CollaborationIndicator
                collaborators={collaborators}
                sessionId={sessionId}
              />

              {/* Math Notation Overlay - only when needed */}
              {mathMode && (
                <MathNotationOverlay
                  editor={editor}
                  onMathInsert={createMathExpression}
                />
              )}
            </div>

            {/* Audio Controls - Fixed Bottom Center */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
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
                  variant="destructive"
                  size="sm"
                  onClick={onEndSession}
                  className="rounded-full"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>
        </Panel>

        {/* Resizable Handle */}
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors">
          <div className="h-full flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </PanelResizeHandle>

        {/* Right Sidebar Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <div className="h-full flex flex-col border-l bg-background/50 backdrop-blur-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                AI Mathematics Classroom
              </h2>
              <p className="text-sm text-muted-foreground">
                Topic: Grade 10 Mathematics | Session: {sessionDuration}
              </p>
            </div>

            <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="transcript" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transcript" className="flex-1 p-0 m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {transcript.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Conversation will appear here</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Speak naturally - you can interrupt anytime
                        </p>
                      </div>
                    ) : (
                      transcript.map((message, index) => (
                        <div key={index} className="text-sm">
                          {message}
                        </div>
                      ))
                    )}

                    {/* Live AI Status */}
                    {isConnected && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-pulse">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">AI Tutor</span>
                          <span className="text-xs text-muted-foreground">is listening...</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Speak naturally - you can interrupt anytime
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="notes" className="flex-1 p-0 m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Take notes during your session..."
                      className="w-full h-full min-h-[300px] p-3 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}