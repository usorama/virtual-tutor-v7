'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Calendar, TrendingUp, BookOpen, Play, ChevronRight } from 'lucide-react';

interface Session {
  id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  topics_discussed?: string[];
  chapter_focus?: string;
  quality_score?: number;
  session_summary?: string;
  chapters?: {
    title: string;
  };
}

interface SessionHistoryProps {
  studentId: string;
  limit?: number;
  onSessionClick?: (session: Session) => void;
}

export function SessionHistory({ studentId, limit = 5, onSessionClick }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const supabase = createClient();
  
  useEffect(() => {
    loadSessions();
  }, [studentId]);
  
  async function loadSessions() {
    try {
      // Fetch recent sessions
      const { data: sessionsData, error } = await supabase
        .from('learning_sessions')
        .select(`
          *,
          chapters:chapter_focus (
            title
          )
        `)
        .eq('student_id', studentId)
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }
      
      setSessions(sessionsData || []);
      
      // Calculate total minutes
      const total = (sessionsData || []).reduce((sum, session) => {
        return sum + (session.duration_minutes || 0);
      }, 0);
      setTotalMinutes(total);
      
    } catch (error) {
      console.error('Error in loadSessions:', error);
    } finally {
      setLoading(false);
    }
  }
  
  function getQualityColor(score?: number): string {
    if (!score) return 'secondary';
    if (score >= 80) return 'success';
    if (score >= 60) return 'default';
    if (score >= 40) return 'warning';
    return 'destructive';
  }
  
  function formatDuration(minutes?: number): string {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Sessions</CardTitle>
          <CardDescription>Loading your session history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Sessions</CardTitle>
          <CardDescription>No sessions yet. Start your first session!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Begin your learning journey with an AI tutor
            </p>
            <Button 
              onClick={() => window.location.href = '/classroom'}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Start First Session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Learning Sessions</CardTitle>
            <CardDescription>
              Total study time: {formatDuration(totalMinutes)}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {sessions.length} sessions
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="group relative rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => onSessionClick?.(session)}
              >
                {/* Session Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                    </span>
                  </div>
                  {session.quality_score !== undefined && (
                    <Badge variant={getQualityColor(session.quality_score) as any}>
                      {session.quality_score}% quality
                    </Badge>
                  )}
                </div>
                
                {/* Session Details */}
                <div className="space-y-2">
                  {/* Chapter/Topic */}
                  {session.chapters?.title && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{session.chapters.title}</span>
                    </div>
                  )}
                  
                  {/* Duration */}
                  {session.duration_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">
                        Duration: {formatDuration(session.duration_minutes)}
                      </span>
                    </div>
                  )}
                  
                  {/* Topics Discussed */}
                  {session.topics_discussed && session.topics_discussed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.topics_discussed.slice(0, 3).map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {session.topics_discussed.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{session.topics_discussed.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Summary */}
                  {session.session_summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                      {session.session_summary}
                    </p>
                  )}
                </div>
                
                {/* Hover Action */}
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* View All Button */}
        {sessions.length === limit && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/sessions'}
            >
              View All Sessions
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}