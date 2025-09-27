'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/floating-controls.module.css';

interface FloatingControlsProps {
  audioControls: {
    isMuted: boolean;
    volume: number;
  };
  sessionControlState: 'active' | 'paused' | 'ended';
  isTransitioning: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onPauseResume: () => void;
  onEndSession: () => void;
  className?: string;
}

export function FloatingControls({
  audioControls,
  sessionControlState,
  isTransitioning,
  isConnecting,
  isLoading,
  onMuteToggle,
  onVolumeChange,
  onPauseResume,
  onEndSession,
  className
}: FloatingControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside volume slider
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    }

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showVolumeSlider]);

  const isDisabled = isConnecting || isLoading || isTransitioning;

  // Don't show controls if session has ended
  if (sessionControlState === 'ended') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-50',
        'bg-black/60 backdrop-blur-xl border border-white/10',
        'rounded-full px-4 py-3',
        'shadow-2xl shadow-black/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Mute/Unmute Control */}
        <button
          onClick={onMuteToggle}
          disabled={isDisabled}
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'hover:scale-110 active:scale-95',
            audioControls.isMuted
              ? 'bg-red-500/20 hover:bg-red-500/30'
              : 'bg-white/10 hover:bg-white/20',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={audioControls.isMuted ? 'Unmute' : 'Mute'}
        >
          {audioControls.isMuted ? (
            <MicOff className="w-5 h-5 text-red-400" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Volume Control */}
        <div className="relative" ref={volumeRef}>
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            disabled={isDisabled}
            className={cn(
              'relative w-12 h-12 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              'bg-white/10 hover:bg-white/20',
              'hover:scale-110 active:scale-95',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Volume control"
          >
            {audioControls.volume === 0 || audioControls.isMuted ? (
              <VolumeX className="w-5 h-5 text-white/70" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Volume Slider Popup */}
          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3"
              >
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-white/60">Volume</span>
                    <div className="h-32 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={audioControls.isMuted ? 0 : audioControls.volume}
                        onChange={(e) => onVolumeChange(Number(e.target.value))}
                        className={styles.volumeSlider}
                        disabled={isDisabled}
                        aria-label="Volume level"
                      />
                    </div>
                    <span className="text-sm font-mono text-white/80">
                      {audioControls.isMuted ? 0 : audioControls.volume}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pause/Resume Control */}
        <button
          onClick={onPauseResume}
          disabled={isDisabled}
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'hover:scale-110 active:scale-95',
            sessionControlState === 'paused'
              ? 'bg-green-500/20 hover:bg-green-500/30'
              : 'bg-white/10 hover:bg-white/20',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={sessionControlState === 'paused' ? 'Resume' : 'Pause'}
        >
          {isTransitioning ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : sessionControlState === 'paused' ? (
            <Play className="w-5 h-5 text-green-400 ml-0.5" />
          ) : (
            <Pause className="w-5 h-5 text-white" />
          )}
        </button>

        {/* End Session Control */}
        <button
          onClick={onEndSession}
          disabled={isDisabled}
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'bg-red-500/20 hover:bg-red-500/30',
            'hover:scale-110 active:scale-95',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="End session"
        >
          {isTransitioning ? (
            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
          ) : (
            <Square className="w-5 h-5 text-red-400" />
          )}
        </button>
      </div>
    </div>
  );
}