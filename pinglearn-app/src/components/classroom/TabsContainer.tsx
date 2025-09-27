'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionInfoPanel } from './SessionInfoPanel';
import { NotesPanel } from './NotesPanel';
import { useSmartNotes } from '@/features/notes/useSmartNotes';
import { cn } from '@/lib/utils';
import { Info, FileText } from 'lucide-react';

interface TabsContainerProps {
  // Session Info Panel props
  sessionId?: string;
  voiceSessionId?: string; // For Smart Notes integration
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
    // Microphone controls (student input)
    micMuted: boolean;
    micPermissions: boolean;
    // Volume controls (teacher output)
    teacherVolume: number;
    teacherMuted: boolean;
  };
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  duration: number;
  isPaused: boolean;

  className?: string;
}

export function TabsContainer({
  sessionId,
  voiceSessionId,
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
}: TabsContainerProps) {
  // Use Smart Notes hook for real-time notes generation
  const {
    notes,
    keyConcepts,
    examples,
    summary,
    isLoading,
    error,
    isLive,
    hasNotes,
    wordCount,
    conceptCount
  } = useSmartNotes(sessionId, voiceSessionId);
  return (
    <Tabs
      defaultValue="session"
      className={cn("flex flex-col h-full overflow-hidden", className)}
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
        className="flex-1 mt-0 overflow-hidden relative"
      >
        <NotesPanel
          sessionId={sessionId}
          topic={topic}
          keyConcepts={keyConcepts}
          examples={examples}
          summary={summary}
          isLive={isLive}
          isLoading={isLoading}
          wordCount={wordCount}
          className="absolute inset-0"
        />
      </TabsContent>
    </Tabs>
  );
}