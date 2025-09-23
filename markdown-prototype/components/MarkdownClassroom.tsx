'use client';

import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Room,
  RoomEvent,
  DataPacket_Kind,
  Track,
  createLocalAudioTrack,
  RemoteTrack,
  RemoteAudioTrack,
  RemoteParticipant,
  TrackPublication
} from 'livekit-client';

interface TranscriptionSegment {
  type: 'text' | 'math';
  content: string;
  latex?: string;
  streaming?: boolean;
  chunk_index?: number;
}

interface TranscriptionData {
  type: string;
  speaker: string;
  segments?: TranscriptionSegment[];
  text?: string;
  timestamp: string;
  total_chunks?: number;
}

interface Message {
  id: string;
  content: string;
  speaker: 'teacher' | 'student' | 'user';
  timestamp: Date;
  isPartial?: boolean;
}

export default function MarkdownClassroom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentMessageId = useRef<string>('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMessage]);

  const connectToLiveKit = async () => {
    setIsConnecting(true);

    try {
      // Get LiveKit token
      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: 'learning-session',
          participantName: 'student-markdown'
        }),
      });

      if (!response.ok) throw new Error('Failed to get token');

      const { token } = await response.json();

      // Create and configure the room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 0, height: 0 },
        },
      });

      roomRef.current = room;

      // Handle transcription data
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const decoder = new TextDecoder();
          const jsonStr = decoder.decode(payload);
          const data: TranscriptionData = JSON.parse(jsonStr);

          // Handle progressive transcript chunks
          if (data.type === 'transcript' && data.segments) {
            const speaker = data.speaker === 'teacher' ? 'teacher' : 'student';

            // Build content from segments
            let content = '';
            for (const segment of data.segments) {
              if (segment.type === 'math' && segment.latex) {
                // Use inline or block math based on content
                const isInline = !segment.latex.includes('\\frac') && segment.latex.length < 30;
                content += isInline ? ` $${segment.latex}$ ` : `\n\n$$${segment.latex}$$\n\n`;
              } else {
                content += segment.content || '';
              }
            }

            // If this is a streaming chunk, append to current message
            if (data.segments[0]?.streaming) {
              setCurrentMessage(prev => prev + ' ' + content);
              if (speaker === 'teacher') {
                setIsTeacherSpeaking(true);
              }
            } else {
              // Non-streaming, add as complete message
              if (currentMessage) {
                // Save current message first
                setMessages(prev => [...prev, {
                  id: currentMessageId.current || Date.now().toString(),
                  content: currentMessage,
                  speaker: 'teacher',
                  timestamp: new Date()
                }]);
                setCurrentMessage('');
              }

              // Add new message
              const newId = Date.now().toString();
              currentMessageId.current = newId;
              setMessages(prev => [...prev, {
                id: newId,
                content,
                speaker,
                timestamp: new Date()
              }]);
            }
          }

          // Handle completion marker
          if (data.type === 'transcript_complete') {
            if (currentMessage) {
              setMessages(prev => [...prev, {
                id: currentMessageId.current || Date.now().toString(),
                content: currentMessage,
                speaker: 'teacher',
                timestamp: new Date()
              }]);
              setCurrentMessage('');
              currentMessageId.current = '';
              setIsTeacherSpeaking(false);
            }
          }

          // Handle simple transcription format (fallback)
          if (data.type === 'transcription' && data.text) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              content: data.text,
              speaker: data.speaker === 'assistant' ? 'teacher' : 'student',
              timestamp: new Date()
            }]);
          }
        } catch (error) {
          console.error('Error processing data:', error);
        }
      });

      // Handle connection
      room.on(RoomEvent.Connected, async () => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('Connected to LiveKit room');

        // Publish local audio
        try {
          const audioTrack = await createLocalAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          });

          await room.localParticipant.publishTrack(audioTrack);
          console.log('Local audio track published');

          // Start voice session after a short delay
          setTimeout(() => startVoiceSession(), 1000);
        } catch (error) {
          console.error('Error publishing audio:', error);
        }
      });

      // Handle remote tracks (teacher audio)
      room.on(RoomEvent.TrackSubscribed, (
        track: RemoteTrack,
        publication: TrackPublication,
        participant: RemoteParticipant
      ) => {
        console.log(`Track subscribed: ${track.kind} from ${participant.identity}`);

        if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
          const audioTrack = track as RemoteAudioTrack;
          const audioElement = audioTrack.attach();

          // Configure audio element
          audioElement.autoplay = true;
          audioElement.controls = false;

          // Store and play
          audioElements.current.set(track.sid, audioElement);
          document.body.appendChild(audioElement);

          audioElement.play().catch(e => {
            console.error('Error playing audio:', e);
            // Try playing after user interaction
            document.addEventListener('click', () => {
              audioElement.play().catch(console.error);
            }, { once: true });
          });

          console.log('Teacher audio attached and playing');
        }
      });

      // Clean up on track unsubscribed
      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = audioElements.current.get(track.sid);
          if (audioElement) {
            audioElement.remove();
            audioElements.current.delete(track.sid);
          }
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setSessionStarted(false);
        console.log('Disconnected from LiveKit room');

        // Clean up all audio elements
        audioElements.current.forEach(element => element.remove());
        audioElements.current.clear();
      });

      // Connect to the room
      await room.connect(
        process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
        token
      );

    } catch (error) {
      console.error('Connection error:', error);
      setIsConnecting(false);
    }
  };

  const startVoiceSession = async () => {
    if (!roomRef.current?.localParticipant) return;

    try {
      const startCommand = {
        type: 'command',
        command: 'start_session',
        payload: {
          topic: 'quadratic equations',
          student_id: 'markdown-user',
          mode: 'conversation',
          timestamp: new Date().toISOString()
        }
      };

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(startCommand));
      await roomRef.current.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);

      console.log('Voice session start command sent');
      setSessionStarted(true);

      // Add a welcome message
      setMessages(prev => [...prev, {
        id: 'welcome',
        content: '👋 Starting voice session on quadratic equations...',
        speaker: 'teacher',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting voice session:', error);
    }
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;

    const audioTracks = Array.from(roomRef.current.localParticipant.audioTracks.values());
    for (const publication of audioTracks) {
      if (publication.track) {
        await publication.track.setEnabled(!isMicEnabled);
      }
    }
    setIsMicEnabled(!isMicEnabled);
  };

  const disconnect = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setIsConnected(false);
      setSessionStarted(false);
      setMessages([]);
      setCurrentMessage('');

      // Clean up audio
      audioElements.current.forEach(element => element.remove());
      audioElements.current.clear();
    }
  };

  const addSampleMessage = () => {
    const sampleMath = `## Understanding Quadratic Equations

A quadratic equation is a polynomial equation of degree 2, with the general form:

$ax^2 + bx + c = 0$

Where:
- $a$, $b$, and $c$ are constants
- $a \\neq 0$ (otherwise it wouldn't be quadratic)
- $x$ is the variable

### Example:
Consider the equation $x^2 + 3x + 2 = 0$

We can solve this using the quadratic formula:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

Substituting our values: $a = 1$, $b = 3$, $c = 2$

$$x = \\frac{-3 \\pm \\sqrt{9 - 8}}{2} = \\frac{-3 \\pm 1}{2}$$

Therefore: $x = -1$ or $x = -2$`;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: sampleMath,
      speaker: 'teacher',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">📚</span>
            PingLearn Markdown Prototype
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {isConnected ? '🟢 Connected' : isConnecting ? '🟡 Connecting...' : '⚫ Disconnected'}
              {sessionStarted && ' | 🎙️ Voice Active'}
              {isTeacherSpeaking && ' | 🗣️ Teacher Speaking'}
            </span>

            {isConnected && (
              <button
                onClick={toggleMic}
                className={`px-3 py-2 rounded-lg transition ${
                  isMicEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isMicEnabled ? '🎤 Mic On' : '🔇 Mic Off'}
              </button>
            )}

            {!isConnected ? (
              <button
                onClick={connectToLiveKit}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Start Voice Session'}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                End Session
              </button>
            )}

            <button
              onClick={addSampleMessage}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Add Sample
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 && !currentMessage ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg mb-2">Ready for voice conversation</p>
              <p className="text-sm mb-4">Click "Start Voice Session" to begin</p>
              <p className="text-xs">Your browser may ask for microphone permission</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.speaker === 'teacher' ? 'bg-gray-900' : 'bg-gray-800'
                  } rounded-lg p-4`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                    {message.speaker === 'teacher' ? '🤖' : '👤'}
                  </div>
                  <div className="flex-1 markdown-message">
                    <Markdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </Markdown>
                  </div>
                </div>
              ))}

              {/* Show current message being built progressively */}
              {currentMessage && (
                <div className="flex gap-4 bg-gray-900 rounded-lg p-4 animate-pulse">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                    🤖
                  </div>
                  <div className="flex-1 markdown-message">
                    <Markdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {currentMessage}
                    </Markdown>
                    <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1">|</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}