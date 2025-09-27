'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock, TrendingUp,
  Activity, BookOpen, Signal, ChevronRight,
  Sparkles, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioControlPanel } from './AudioControlPanel';

interface AudioControlState {
  // Microphone controls (student input)
  micMuted: boolean;
  micPermissions: boolean;
  // Volume controls (teacher output)
  teacherVolume: number;
  teacherMuted: boolean;
}

interface SessionInfoPanelProps {
  sessionId?: string;
  topic: string;
  sessionState: any; // Type from useSessionState
  liveMetrics?: {
    duration: number;
    messagesExchanged: number;
    currentEngagement: number;
    errorRate: number;
    averageResponseTime: number;
    mathEquationsCount: number;
    lastTranscriptTime: Date | null;
  };
  qualityScore?: number;
  engagementTrend?: 'improving' | 'declining' | 'stable';
  audioControls: AudioControlState;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  duration: number;
  isPaused: boolean;
  className?: string;
}

export function SessionInfoPanel({
  sessionId,
  topic,
  sessionState,
  liveMetrics,
  qualityScore,
  engagementTrend,
  audioControls,
  onVolumeChange,
  onMuteToggle,
  duration,
  isPaused,
  className = ''
}: SessionInfoPanelProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getEngagementColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendIcon = () => {
    if (engagementTrend === 'improving') return '↗';
    if (engagementTrend === 'declining') return '↘';
    return '→';
  };

  // Glassmorphic panel card component
  const GlassCard = ({ children, className: cardClassName = '' }: { children: React.ReactNode; className?: string }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/[0.02] dark:bg-white/[0.05]",
        "backdrop-blur-md backdrop-saturate-150",
        "border border-white/[0.05] dark:border-white/[0.08]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        cardClassName
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full bg-background/80 dark:bg-background/60", className)}>
      <ScrollArea className="flex-1">
        <div className="p-3 pb-20 space-y-3">
          {/* Session Status - Glassmorphic Header */}
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Live Session</span>
                </div>
                <Badge
                  variant={isPaused ? 'secondary' : 'default'}
                  className={cn(
                    "text-xs",
                    !isPaused && "bg-green-500/20 text-green-400 border-green-500/30"
                  )}
                >
                  {isPaused ? 'Paused' : 'Active'}
                </Badge>
              </div>

              {/* Topic */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Topic</p>
                  <p className="text-sm font-medium line-clamp-2">{topic}</p>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Duration</span>
                  </div>
                  <span className="text-sm font-mono tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-1.5" />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Live Metrics - Glassmorphic Cards */}
          {liveMetrics && (
            <GlassCard>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium">Live Metrics</span>
                </div>

                <div className="space-y-3">
                  {/* Engagement */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">Engagement</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-sm font-bold", getEngagementColor(liveMetrics?.currentEngagement))}>
                        {liveMetrics?.currentEngagement || 0}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getTrendIcon()}
                      </span>
                    </div>
                  </div>

                  {/* Math Equations */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">Math Equations</span>
                    </div>
                    <span className="text-sm font-bold">
                      {liveMetrics?.mathEquationsCount || 0}
                    </span>
                  </div>

                  {/* Connection Quality */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Signal className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">Quality</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className={cn(
                            "w-1 h-3 rounded-full transition-colors",
                            bar <= (qualityScore || 0) / 20
                              ? 'bg-green-500'
                              : 'bg-gray-600'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Audio Controls - Using AudioControlPanel */}
          <GlassCard>
            <AudioControlPanel
              audioControls={audioControls}
              onVolumeChange={onVolumeChange}
              onMuteToggle={onMuteToggle}
              onSpeedChange={(speed) => {
                // TODO: Implement speed change handler
                console.log('Speed changed to:', speed);
              }}
              currentSpeed={1}
              className="bg-transparent border-none shadow-none"
            />
          </GlassCard>

          {/* Curriculum Navigation - Glassmorphic */}
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-orange-400" />
                </div>
                <span className="text-sm font-medium">Curriculum</span>
              </div>

              <div className="space-y-2">
                {/* Breadcrumb */}
                <div className="flex items-center text-xs text-muted-foreground flex-wrap">
                  <span>Grade 10</span>
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <span>Mathematics</span>
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <span className="text-foreground">Algebra</span>
                </div>

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 hover:bg-white/10 border-white/10"
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 hover:bg-white/10 border-white/10"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI Notes Preview - Glassmorphic */}
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-sm font-medium">Smart Notes</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-generated notes will be ready at the end of this session
              </p>
            </div>
          </GlassCard>
        </div>
      </ScrollArea>
    </div>
  );
}