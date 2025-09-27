'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioControlState {
  // Volume controls (teacher output)
  teacherVolume: number;
  teacherMuted: boolean;
}

interface AudioControlPanelProps {
  audioControls: AudioControlState;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSpeedChange?: (speed: number) => void;
  currentSpeed?: number;
  className?: string;
  compact?: boolean; // For different sizing contexts
}

export function AudioControlPanel({
  audioControls,
  onVolumeChange,
  onMuteToggle,
  onSpeedChange,
  currentSpeed = 1,
  className = '',
  compact = false
}: AudioControlPanelProps) {
  const speedOptions = [
    { label: '0.75x', value: 0.75 },
    { label: '1x', value: 1 },
    { label: '1.25x', value: 1.25 }
  ];

  return (
    <div className={cn(
      "p-4 space-y-4",
      "bg-black/80 backdrop-blur-xl border border-white/10",
      "rounded-2xl shadow-xl",
      compact && "p-3 space-y-3",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Volume2 className="w-3 h-3 text-purple-400" />
        </div>
        <span className="text-sm font-medium text-white">Audio Controls</span>
      </div>

      {/* Volume Control */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMuteToggle}
            className={cn(
              "h-7 w-7 hover:bg-white/10",
              compact && "h-6 w-6"
            )}
          >
            {audioControls.teacherMuted ? (
              <VolumeX className="w-3 h-3 text-white" />
            ) : (
              <Volume2 className="w-3 h-3 text-white" />
            )}
          </Button>
          <Slider
            value={[audioControls.teacherMuted ? 0 : audioControls.teacherVolume]}
            onValueChange={([value]) => onVolumeChange(value)}
            max={100}
            step={1}
            className="flex-1"
            disabled={audioControls.teacherMuted}
          />
          <span className={cn(
            "text-xs text-white/60 w-8 text-right tabular-nums",
            compact && "w-6"
          )}>
            {audioControls.teacherMuted ? '0' : audioControls.teacherVolume}
          </span>
        </div>

        {/* Speed Controls */}
        {onSpeedChange && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Speed</span>
            <div className="flex gap-1">
              {speedOptions.map((speed) => (
                <Button
                  key={speed.value}
                  variant={speed.value === currentSpeed ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onSpeedChange(speed.value)}
                  className={cn(
                    "h-6 px-2 text-xs",
                    speed.value === currentSpeed
                      ? "bg-primary/20 hover:bg-primary/30 text-primary"
                      : "hover:bg-white/10 text-white/80",
                    compact && "h-5 px-1.5 text-[10px]"
                  )}
                >
                  {speed.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}