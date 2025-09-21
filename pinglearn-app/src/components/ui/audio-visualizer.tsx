"use client"

import { useState, useEffect, useRef } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioVisualizerProps {
  isConnected?: boolean
  isMuted?: boolean
  onMuteToggle?: () => void
  onEndSession?: () => void
  studentName?: string
  sessionDuration?: string
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor'
  className?: string
}

export function AudioVisualizer({
  isConnected = false,
  isMuted = false,
  onMuteToggle,
  onEndSession,
  studentName = "Student",
  sessionDuration = "0:00",
  connectionQuality = "good",
  className
}: AudioVisualizerProps) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [activeSpeaker, setActiveSpeaker] = useState<'student' | 'teacher' | null>(null)
  const [isListening, setIsListening] = useState(false)
  const animationRef = useRef<number | undefined>(undefined)

  // Simulate audio level dancing animation
  useEffect(() => {
    if (!isConnected) return

    const animate = () => {
      // Create a more natural audio wave pattern
      const time = Date.now() / 1000
      const baseLevel = 15 + Math.sin(time * 2) * 10
      const noise = Math.random() * 20
      const spike = Math.random() > 0.95 ? 30 : 0 // Occasional spikes
      
      setAudioLevel(Math.max(0, Math.min(100, baseLevel + noise + spike)))
      
      // Randomly switch active speaker for demo
      if (Math.random() > 0.98) {
        const speakers = [null, 'student', 'teacher'] as const
        setActiveSpeaker(speakers[Math.floor(Math.random() * speakers.length)])
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isConnected])

  // Simulate listening state
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setIsListening(prev => !prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [isConnected])

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getAudioLevelColor = () => {
    if (audioLevel > 70) return 'bg-gradient-to-r from-green-400 to-green-600'
    if (audioLevel > 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    return 'bg-gradient-to-r from-blue-400 to-blue-600'
  }

  return (
    <div className={cn("space-y-6 p-6 bg-gradient-to-br from-background to-secondary/20 rounded-lg border", className)}>
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">AI Mathematics Classroom</h3>
          <p className="text-sm text-muted-foreground">
            Topic: Grade 10 Mathematics | Session: {sessionDuration}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant="outline" className={getConnectionColor()}>
            {connectionQuality} quality
          </Badge>
        </div>
      </div>

      {/* Audio Visualization Area */}
      <div className="space-y-4">
        {/* Speaker Indicators */}
        <div className="flex items-center justify-center gap-8">
          <div className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300",
            activeSpeaker === 'student' ? "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500" : "bg-secondary/50"
          )}>
            <div className={cn(
              "p-3 rounded-full transition-all duration-300",
              activeSpeaker === 'student' ? "bg-blue-500 text-white animate-pulse" : "bg-secondary"
            )}>
              <User className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">{studentName}</span>
            {activeSpeaker === 'student' && (
              <Badge variant="default" className="text-xs animate-pulse">Speaking</Badge>
            )}
          </div>

          <div className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300",
            activeSpeaker === 'teacher' ? "bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500" : "bg-secondary/50"
          )}>
            <div className={cn(
              "p-3 rounded-full transition-all duration-300",
              activeSpeaker === 'teacher' ? "bg-purple-500 text-white animate-pulse" : "bg-secondary"
            )}>
              <Bot className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">AI Tutor</span>
            {activeSpeaker === 'teacher' && (
              <Badge variant="default" className="text-xs animate-pulse">Speaking</Badge>
            )}
          </div>
        </div>

        {/* AI Status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full transition-all duration-500",
              isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <p className="text-lg font-medium">
              {isListening ? "AI Tutor is listening..." : "AI Tutor is thinking..."}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Speak naturally - you can interrupt anytime
          </p>
        </div>

        {/* Audio Level Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Audio Level:</span>
            <span className="text-muted-foreground">{Math.round(audioLevel)}%</span>
          </div>
          
          {/* Main Audio Bar */}
          <div className="space-y-2">
            <Progress 
              value={audioLevel} 
              className={cn(
                "h-4 transition-all duration-150",
                isConnected ? "opacity-100" : "opacity-50"
              )}
            />
            
            {/* Dancing Audio Bars */}
            <div className="flex items-end justify-center gap-1 h-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 rounded-t transition-all duration-150",
                    getAudioLevelColor()
                  )}
                  style={{
                    height: `${Math.max(8, (audioLevel / 100) * 48 * (0.5 + Math.sin(Date.now() / 200 + i) * 0.5))}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Toggle
            pressed={isMuted}
            onPressedChange={onMuteToggle}
            aria-label="Toggle mute"
            className={cn(
              "flex items-center gap-2 px-4 py-2",
              isMuted ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""
            )}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isMuted ? "Unmute" : "Mute"}
          </Toggle>

          <Button 
            variant="destructive" 
            onClick={onEndSession}
            className="flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-white rounded-full" />
            End Session
          </Button>
        </div>

        {/* Mute State Indicator */}
        {isMuted && (
          <div className="text-center space-y-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Badge variant="destructive" className="animate-pulse">
              <MicOff className="h-3 w-3 mr-1" />
              MUTED
            </Badge>
            <p className="text-sm text-red-700 dark:text-red-400">
              Press and hold spacebar for push-to-talk
            </p>
          </div>
        )}

        {/* Regular Tip (when not muted) */}
        {!isMuted && (
          <p className="text-center text-xs text-muted-foreground">
            Tip: Use the mute button if you need private moments during the session
          </p>
        )}
      </div>
    </div>
  )
}

export default AudioVisualizer