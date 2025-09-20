"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Zap, Activity } from 'lucide-react'
import { GlassButton, GlassCard } from '@/components/glass'
import { cn } from '@/lib/utils'

interface VoiceDemoProps {
  className?: string
  onVoiceStart?: () => void
  onVoiceEnd?: () => void
}

const VoiceDemo: React.FC<VoiceDemoProps> = ({
  className,
  onVoiceStart,
  onVoiceEnd
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)

  // Simulate audio level for visualization
  useEffect(() => {
    if (!isListening) return

    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100)
    }, 100)

    return () => clearInterval(interval)
  }, [isListening])

  const handleVoiceToggle = async () => {
    if (isListening) {
      // Stop listening
      setIsListening(false)
      setIsProcessing(true)
      onVoiceEnd?.()

      // Simulate processing
      setTimeout(() => {
        setResponse("Great question! I can help you understand that concept. Let me break it down step by step...")
        setIsProcessing(false)
      }, 2000)
    } else {
      // Start listening
      setIsListening(true)
      setTranscript("")
      setResponse("")
      onVoiceStart?.()

      // Simulate transcript
      setTimeout(() => {
        setTranscript("What is the quadratic formula and how do I use it?")
      }, 3000)
    }
  }

  const buttonVariants = {
    idle: { scale: 1 },
    listening: {
      scale: [1, 1.05, 1]
    },
    processing: {
      rotate: 360
    }
  }

  const waveVariants = {
    hidden: { scaleY: 0.2, opacity: 0 },
    visible: (custom: number) => ({
      scaleY: [0.2, custom / 100, 0.2],
      opacity: 1
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Voice Button */}
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          className="relative"
          variants={buttonVariants}
          animate={
            isProcessing ? "processing" :
            isListening ? "listening" :
            "idle"
          }
          transition={{
            duration: isProcessing ? 2 : 1.5,
            repeat: (isProcessing || isListening) ? Infinity : 0,
            ease: isProcessing ? "linear" : "easeInOut"
          }}
        >
          <GlassButton
            variant="liquid-primary"
            size="xl"
            glow
            depth="deep"
            onClick={handleVoiceToggle}
            disabled={isProcessing}
            className="relative w-20 h-20 rounded-full p-0"
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Activity className="w-8 h-8 text-white" />
                </motion.div>
              ) : isListening ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <MicOff className="w-8 h-8 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Mic className="w-8 h-8 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassButton>

          {/* Audio visualization rings */}
          {isListening && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-ping-accent/30"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.3, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Status Text */}
        <motion.div
          className="text-center"
          layout
        >
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.p
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-semibold text-ping-accent flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                AI is thinking...
              </motion.p>
            ) : isListening ? (
              <motion.p
                key="listening"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-semibold text-ping-primary"
              >
                Listening... Speak now!
              </motion.p>
            ) : (
              <motion.p
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-semibold"
              >
                Talk to PingLearn AI
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-sm text-muted-foreground mt-1">
            Experience real-time voice AI conversation
          </p>
        </motion.div>
      </div>

      {/* Audio Level Visualization */}
      {isListening && (
        <motion.div
          className="flex items-center justify-center gap-1 h-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              custom={audioLevel + (i * 20)}
              className="w-1 bg-gradient-to-t from-ping-primary to-ping-accent rounded-full"
              variants={waveVariants}
              initial="hidden"
              animate="visible"
              style={{ height: '20px' }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Transcript & Response Display */}
      <AnimatePresence>
        {(transcript || response) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {transcript && (
              <GlassCard animated className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">You</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Student says:</p>
                    <p className="text-base">{transcript}</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {response && (
              <GlassCard animated className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ping-primary/20 to-ping-accent/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-ping-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-muted-foreground">PingLearn AI responds:</p>
                      <Volume2 className="w-4 h-4 text-ping-accent" />
                    </div>
                    <p className="text-base">{response}</p>
                  </div>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { VoiceDemo }