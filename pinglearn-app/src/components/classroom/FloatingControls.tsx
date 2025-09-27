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
import { AudioControlPanel } from './AudioControlPanel';

interface FloatingControlsProps {
  audioControls: {
    // Microphone controls (student input)
    micMuted: boolean;
    micPermissions: boolean;
    // Volume controls (teacher output)
    teacherVolume: number;
    teacherMuted: boolean;
  };
  sessionControlState: 'active' | 'paused' | 'ended';
  isTransitioning: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  onMicMuteToggle: () => void;
  onTeacherVolumeChange: (volume: number) => void;
  onTeacherMuteToggle: () => void;
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
  onMicMuteToggle,
  onTeacherVolumeChange,
  onTeacherMuteToggle,
  onPauseResume,
  onEndSession,
  className
}: FloatingControlsProps) {
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const audioControlsRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside audio controls
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (audioControlsRef.current && !audioControlsRef.current.contains(event.target as Node)) {
        setShowAudioControls(false);
      }
    }

    if (showAudioControls) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAudioControls]);

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = setTimeout(() => {
      setShowAudioControls(true);
    }, 300); // 300ms delay to prevent accidental triggers
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    // Small delay before hiding to allow moving to the popup
    const timeout = setTimeout(() => {
      setShowAudioControls(false);
    }, 150);
    setHoverTimeout(timeout);
  };

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
        {/* Microphone Mute/Unmute Control (Student Input) */}
        <button
          onClick={onMicMuteToggle}
          disabled={isDisabled}
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'hover:scale-110 active:scale-95',
            audioControls.micMuted
              ? 'bg-red-500/20 hover:bg-red-500/30'
              : 'bg-white/10 hover:bg-white/20',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={audioControls.micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {audioControls.micMuted ? (
            <MicOff className="w-5 h-5 text-red-400" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Teacher Audio Control (Hover for Full Controls) */}
        <div className="relative" ref={audioControlsRef}>
          <button
            onClick={onTeacherMuteToggle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={isDisabled}
            className={cn(
              'relative w-12 h-12 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              'hover:scale-110 active:scale-95',
              audioControls.teacherMuted
                ? 'bg-orange-500/20 hover:bg-orange-500/30'
                : 'bg-white/10 hover:bg-white/20',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={audioControls.teacherMuted ? 'Unmute Teacher' : 'Mute Teacher (Hover for controls)'}
          >
            {audioControls.teacherMuted || audioControls.teacherVolume === 0 ? (
              <VolumeX className="w-5 h-5 text-orange-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Audio Controls Popup */}
          <AnimatePresence>
            {showAudioControls && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3"
                onMouseEnter={() => {
                  if (hoverTimeout) clearTimeout(hoverTimeout);
                }}
                onMouseLeave={handleMouseLeave}
              >
                <AudioControlPanel
                  audioControls={{
                    teacherVolume: audioControls.teacherVolume,
                    teacherMuted: audioControls.teacherMuted
                  }}
                  onVolumeChange={onTeacherVolumeChange}
                  onMuteToggle={onTeacherMuteToggle}
                  onSpeedChange={(speed) => {
                    // TODO: Implement speed change handler
                    console.log('Speed changed to:', speed);
                  }}
                  currentSpeed={1}
                  compact={true}
                />
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