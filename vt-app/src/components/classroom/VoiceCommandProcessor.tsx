'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingCommand {
  action: 'draw' | 'move' | 'select' | 'erase' | 'text' | 'math';
  shape?: 'circle' | 'rectangle' | 'line' | 'arrow' | 'triangle';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  text?: string;
  mathExpression?: string;
  position?: { x: number; y: number };
}

interface VoiceCommandProcessorProps {
  onCommand: (command: DrawingCommand) => void;
  isActive: boolean;
  lastCommand: DrawingCommand | null;
  className?: string;
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  timestamp: number;
}

export function VoiceCommandProcessor({
  onCommand,
  isActive,
  lastCommand,
  className
}: VoiceCommandProcessorProps) {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Audio State
  const [hasPermission, setHasPermission] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Transcription State
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastProcessedCommand, setLastProcessedCommand] = useState<string>('');
  const [processingLatency, setProcessingLatency] = useState(0);

  // Refs
  const deepgramSocket = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const commandStartTime = useRef<number>(0);

  /**
   * Initialize Deepgram WebSocket connection
   */
  const initializeConnection = useCallback(async () => {
    try {
      setConnectionError(null);

      // Create Deepgram client
      const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!);

      // Create WebSocket connection for live transcription
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        utterance_end_ms: 1000,
        vad_events: true,
        keywords: ['draw', 'circle', 'rectangle', 'line', 'arrow', 'triangle', 'move', 'up', 'down', 'left', 'right', 'erase', 'text', 'math']
      });

      // Handle connection events
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('🎤 Deepgram connection opened');
        setIsConnected(true);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('🎤 Deepgram connection closed');
        setIsConnected(false);
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('🚨 Deepgram connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0]?.transcript;
        const confidence = data.channel.alternatives[0]?.confidence || 0;

        if (transcript && confidence > 0.7) {
          setCurrentTranscript(transcript);

          // Process final results only
          if (data.is_final) {
            commandStartTime.current = Date.now();
            processVoiceCommand(transcript);
          }
        }
      });

      deepgramSocket.current = connection as any; // Type assertion for connection access

    } catch (error) {
      console.error('Failed to initialize Deepgram:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    }
  }, []);

  /**
   * Start audio capture and processing
   */
  const startListening = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      setHasPermission(true);

      // Set up audio context for level monitoring
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      analyser.current.fftSize = 256;

      // Start level monitoring
      monitorAudioLevel();

      // Set up MediaRecorder for Deepgram
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0 && deepgramSocket.current) {
          deepgramSocket.current.send(event.data);
        }
      };

      mediaRecorder.current.start(100); // Send data every 100ms
      setIsListening(true);

    } catch (error) {
      console.error('Failed to start listening:', error);
      setConnectionError('Microphone access denied');
      setHasPermission(false);
    }
  }, []);

  /**
   * Stop audio capture
   */
  const stopListening = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }

    if (audioContext.current) {
      audioContext.current.close();
    }

    setIsListening(false);
    setAudioLevel(0);
  }, []);

  /**
   * Monitor audio input level
   */
  const monitorAudioLevel = useCallback(() => {
    if (!analyser.current) return;

    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyser.current) return;

      analyser.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      setAudioLevel(average / 255);

      if (isListening) {
        requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();
  }, [isListening]);

  /**
   * Process voice command and convert to DrawingCommand
   */
  const processVoiceCommand = useCallback((transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    setLastProcessedCommand(transcript);

    // Parse drawing commands
    let command: DrawingCommand | null = null;

    // Draw commands
    if (lowerTranscript.includes('draw')) {
      if (lowerTranscript.includes('circle')) {
        command = { action: 'draw', shape: 'circle' };
      } else if (lowerTranscript.includes('rectangle') || lowerTranscript.includes('square')) {
        command = { action: 'draw', shape: 'rectangle' };
      } else if (lowerTranscript.includes('line')) {
        command = { action: 'draw', shape: 'line' };
      } else if (lowerTranscript.includes('arrow')) {
        command = { action: 'draw', shape: 'arrow' };
      } else if (lowerTranscript.includes('triangle')) {
        command = { action: 'draw', shape: 'triangle' };
      }
    }

    // Move commands
    else if (lowerTranscript.includes('move')) {
      const distance = extractNumber(lowerTranscript) || 50;

      if (lowerTranscript.includes('up')) {
        command = { action: 'move', direction: 'up', distance };
      } else if (lowerTranscript.includes('down')) {
        command = { action: 'move', direction: 'down', distance };
      } else if (lowerTranscript.includes('left')) {
        command = { action: 'move', direction: 'left', distance };
      } else if (lowerTranscript.includes('right')) {
        command = { action: 'move', direction: 'right', distance };
      }
    }

    // Erase command
    else if (lowerTranscript.includes('erase') || lowerTranscript.includes('delete')) {
      command = { action: 'erase' };
    }

    // Text command
    else if (lowerTranscript.includes('write') || lowerTranscript.includes('text')) {
      const textMatch = lowerTranscript.match(/(?:write|text)\s+(.+)/);
      if (textMatch) {
        command = { action: 'text', text: textMatch[1] };
      }
    }

    // Math command
    else if (lowerTranscript.includes('math') || lowerTranscript.includes('equation')) {
      const mathMatch = lowerTranscript.match(/(?:math|equation)\s+(.+)/);
      if (mathMatch) {
        command = { action: 'math', mathExpression: mathMatch[1] };
      }
    }

    // Execute command if valid
    if (command) {
      const latency = Date.now() - commandStartTime.current;
      setProcessingLatency(latency);
      onCommand(command);
      console.log('🎯 Voice command executed:', command, `(${latency}ms)`);
    } else {
      console.log('❓ Unrecognized command:', transcript);
    }
  }, [onCommand]);

  /**
   * Extract number from transcript
   */
  const extractNumber = (text: string): number | null => {
    const numberMatch = text.match(/\d+/);
    return numberMatch ? parseInt(numberMatch[0], 10) : null;
  };

  /**
   * Effect: Handle active state changes
   */
  useEffect(() => {
    if (isActive && !isConnected) {
      initializeConnection();
    }

    if (isActive && isConnected && !isListening && hasPermission) {
      startListening();
    }

    if (!isActive && isListening) {
      stopListening();
    }

    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isActive, isConnected, isListening, hasPermission, initializeConnection, startListening, stopListening]);

  /**
   * Effect: Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (deepgramSocket.current) {
        deepgramSocket.current.close();
      }
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return (
    <div className={cn("space-y-4 p-4 bg-muted/30 rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-medium">Voice Drawing Commands</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>

          {/* Processing Latency */}
          {processingLatency > 0 && (
            <Badge variant="outline">
              {processingLatency}ms
            </Badge>
          )}
        </div>
      </div>

      {/* Error Display */}
      {connectionError && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{connectionError}</span>
        </div>
      )}

      {/* Audio Level Indicator */}
      {isListening && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {audioLevel > 0.1 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Audio Level
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-75 rounded-full",
                audioLevel > 0.5 ? "bg-green-500" :
                audioLevel > 0.2 ? "bg-yellow-500" : "bg-blue-500"
              )}
              style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Transcript */}
      {currentTranscript && (
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Listening:</div>
          <div className="p-2 bg-background border rounded text-sm">
            {currentTranscript}
          </div>
        </div>
      )}

      {/* Last Processed Command */}
      {lastProcessedCommand && (
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Last Command:</div>
          <div className="p-2 bg-primary/10 border border-primary/20 rounded text-sm">
&quot;{lastProcessedCommand}&quot;
          </div>
        </div>
      )}

      {/* Command Help */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Voice Commands:</div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>&quot;Draw circle/rectangle/line&quot;</div>
          <div>&quot;Move up/down/left/right&quot;</div>
          <div>&quot;Erase&quot; or &quot;Delete&quot;</div>
          <div>&quot;Write [text]&quot;</div>
          <div>&quot;Math [expression]&quot;</div>
          <div>&quot;Move [number] pixels&quot;</div>
        </div>
      </div>

      {/* Manual Controls */}
      <div className="flex gap-2">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          disabled={!isConnected}
          className="gap-2"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Stop' : 'Start'} Listening
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={initializeConnection}
          disabled={isConnected}
        >
          Reconnect
        </Button>
      </div>
    </div>
  );
}