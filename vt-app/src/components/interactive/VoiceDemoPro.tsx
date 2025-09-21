"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Loader2, Sparkles } from 'lucide-react'
import { GlassButton, GlassCard } from '@/components/glass'
import { cn } from '@/lib/utils'

interface VoiceDemoProProps {
  className?: string
}

const VoiceDemoPro: React.FC<VoiceDemoProProps> = ({ className }) => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  // Simulate realistic audio levels
  useEffect(() => {
    if (!isListening) return

    const interval = setInterval(() => {
      // Create more realistic wave pattern
      const base = 30
      const peak = Math.sin(Date.now() / 200) * 30
      const noise = Math.random() * 20
      setAudioLevel(base + peak + noise)
    }, 50)

    return () => clearInterval(interval)
  }, [isListening])

  const handleVoiceToggle = useCallback(async () => {
    setHasStarted(true)

    if (isListening) {
      // Stop listening
      setIsListening(false)
      setIsProcessing(true)

      // Simulate AI processing
      setTimeout(() => {
        const sampleResponses = [
          "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a. It's used to find the roots of any quadratic equation. Would you like me to walk through an example?",
          "Great question! Let me explain this concept step by step. First, we identify the coefficients a, b, and c from your equation...",
          "I understand this can be tricky. The key insight is that this formula works for any quadratic equation in standard form. Let's practice together!"
        ]
        setResponse(sampleResponses[Math.floor(Math.random() * sampleResponses.length)])
        setIsProcessing(false)
      }, 1500)
    } else {
      // Start listening
      setIsListening(true)
      setTranscript("")
      setResponse("")

      // Simulate transcript generation
      setTimeout(() => {
        const sampleQuestions = [
          "Can you explain the quadratic formula?",
          "How do I solve x² + 5x + 6 = 0?",
          "What's the difference between factoring and using the quadratic formula?"
        ]
        setTranscript(sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)])
      }, 2500)
    }
  }, [isListening])

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    listening: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <GlassCard
        animated
        depth="deep"
        className="p-8 bg-gradient-to-br from-background/40 via-background/30 to-ping-primary/5"
      >
        <div className="flex flex-col items-center space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              className="flex items-center justify-center gap-2 text-ping-accent"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Live Demo</span>
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <h3 className="text-2xl font-bold">Experience PingLearn Voice AI</h3>
            <p className="text-muted-foreground">
              Click the button and ask any educational question
            </p>
          </div>

          {/* Voice Button */}
          <div className="relative">
            <motion.div
              className="relative"
              variants={buttonVariants}
              animate={isListening ? "listening" : "idle"}
              whileHover="hover"
              whileTap="tap"
            >
              <GlassButton
                variant="liquid-primary"
                size="xl"
                glow
                depth="deep"
                onClick={handleVoiceToggle}
                disabled={isProcessing}
                className="relative w-24 h-24 rounded-full p-0"
              >
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                    >
                      <Loader2 className="w-10 h-10 text-white" />
                    </motion.div>
                  ) : isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <MicOff className="w-10 h-10 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassButton>

              {/* Ripple Effect */}
              {isListening && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-ping-primary/40"
                      initial={{ scale: 1, opacity: 0 }}
                      animate={{
                        scale: [1, 2, 2.5],
                        opacity: [0.8, 0.4, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.p
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-ping-accent font-medium"
              >
                AI is analyzing your question...
              </motion.p>
            ) : isListening ? (
              <motion.p
                key="listening"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-ping-primary font-medium"
              >
                Listening... Ask your question now
              </motion.p>
            ) : hasStarted ? (
              <motion.p
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-muted-foreground"
              >
                Click to ask another question
              </motion.p>
            ) : (
              <motion.p
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-muted-foreground"
              >
                Click the microphone to start
              </motion.p>
            )}
          </AnimatePresence>

          {/* Audio Visualization */}
          {isListening && (
            <motion.div
              className="flex items-center justify-center gap-1 h-16 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-ping-primary to-ping-accent rounded-full"
                  animate={{
                    height: [
                      '20px',
                      `${20 + (audioLevel + i * 5) % 40}px`,
                      '20px'
                    ]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Conversation Display */}
          <AnimatePresence>
            {(transcript || response) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-4"
              >
                {transcript && (
                  <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Mic className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">You asked:</p>
                        <p className="text-base">{transcript}</p>
                      </div>
                    </div>
                  </div>
                )}

                {response && (
                  <div className="bg-ping-primary/10 rounded-xl p-4 border border-ping-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-ping-primary/20 flex items-center justify-center flex-shrink-0">
                        <Volume2 className="w-4 h-4 text-ping-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">PingLearn AI:</p>
                        <p className="text-base">{response}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Powered by Gemini Live • &lt; 200ms latency</span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export { VoiceDemoPro }