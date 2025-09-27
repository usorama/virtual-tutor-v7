'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionInfoPanel } from './SessionInfoPanel';
import { NotesPanel } from './NotesPanel';
import { cn } from '@/lib/utils';
import { Info, FileText } from 'lucide-react';

interface TabsContainerProps {
  // Session Info Panel props
  sessionId?: string;
  topic: string;
  sessionState: any;
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
  audioControls: {
    isMuted: boolean;
    volume: number;
    hasPermissions?: boolean;
  };
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  duration: number;
  isPaused: boolean;

  // Notes Panel props (will be populated later)
  keyConcepts?: any[];
  examples?: any[];
  summary?: string[];

  className?: string;
}

export function TabsContainer({
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
  keyConcepts,
  examples,
  summary,
  className = ''
}: TabsContainerProps) {
  return (
    <Tabs
      defaultValue="session"
      className={cn("flex flex-col h-full", className)}
    >
      {/* Custom styled tabs list with glassmorphic effect */}
      <TabsList className={cn(
        "grid w-full grid-cols-2 h-10",
        "bg-white/[0.02] dark:bg-white/[0.05]",
        "backdrop-blur-md backdrop-saturate-150",
        "border border-white/[0.05] dark:border-white/[0.08]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        "m-3 mb-0"
      )}>
        <TabsTrigger
          value="session"
          className={cn(
            "flex items-center gap-2",
            "data-[state=active]:bg-primary/20",
            "data-[state=active]:text-primary",
            "transition-all duration-200"
          )}
        >
          <Info className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Session</span>
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className={cn(
            "flex items-center gap-2",
            "data-[state=active]:bg-primary/20",
            "data-[state=active]:text-primary",
            "transition-all duration-200"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Notes</span>
        </TabsTrigger>
      </TabsList>

      {/* Session Info Tab */}
      <TabsContent
        value="session"
        className="flex-1 mt-0 overflow-hidden"
      >
        <SessionInfoPanel
          sessionId={sessionId}
          topic={topic}
          sessionState={sessionState}
          liveMetrics={liveMetrics}
          qualityScore={qualityScore}
          engagementTrend={engagementTrend}
          audioControls={audioControls}
          onVolumeChange={onVolumeChange}
          onMuteToggle={onMuteToggle}
          duration={duration}
          isPaused={isPaused}
          className="h-full"
        />
      </TabsContent>

      {/* Notes Tab */}
      <TabsContent
        value="notes"
        className="flex-1 mt-0 overflow-hidden"
      >
        <NotesPanel
          sessionId={sessionId}
          keyConcepts={keyConcepts}
          examples={examples}
          summary={summary}
          className="h-full"
        />
      </TabsContent>
    </Tabs>
  );
}