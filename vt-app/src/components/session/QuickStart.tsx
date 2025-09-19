'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Play, BookOpen, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface QuickStartProps {
  currentChapter?: string;
  chapterTitle?: string;
  lastSessionDate?: string;
  suggestedTopics?: string[];
  masteryLevel?: number;
}

export function QuickStart({ 
  currentChapter,
  chapterTitle,
  lastSessionDate,
  suggestedTopics = [],
  masteryLevel = 0
}: QuickStartProps) {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  
  async function startQuickSession() {
    setIsStarting(true);
    
    // Navigate to classroom with pre-selected topic
    const params = new URLSearchParams();
    if (selectedTopic) {
      params.append('topic', selectedTopic);
    }
    if (currentChapter) {
      params.append('chapter', currentChapter);
    }
    
    router.push(`/classroom?${params.toString()}`);
  }
  
  function getMasteryBadge() {
    if (masteryLevel >= 80) {
      return { label: 'Expert', variant: 'default' as const, icon: Sparkles };
    } else if (masteryLevel >= 60) {
      return { label: 'Proficient', variant: 'secondary' as const, icon: TrendingUp };
    } else if (masteryLevel >= 40) {
      return { label: 'Learning', variant: 'outline' as const, icon: BookOpen };
    }
    return { label: 'Beginner', variant: 'outline' as const, icon: BookOpen };
  }
  
  const mastery = getMasteryBadge();
  const MasteryIcon = mastery.icon;
  
  return (
    <Card className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Quick Start Learning
            </CardTitle>
            <CardDescription>
              {lastSessionDate 
                ? `Continue from where you left off`
                : 'Start your first AI tutoring session'}
            </CardDescription>
          </div>
          <Badge variant={mastery.variant} className="gap-1">
            <MasteryIcon className="w-3 h-3" />
            {mastery.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Chapter Display */}
        {chapterTitle && (
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Chapter</span>
            </div>
            <p className="text-sm text-muted-foreground">{chapterTitle}</p>
          </div>
        )}
        
        {/* Suggested Topics */}
        {suggestedTopics.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Recommended Focus Area (Optional)
            </label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Let AI choose based on your progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-recommended">AI Recommended</SelectItem>
                {suggestedTopics.map((topic, i) => (
                  <SelectItem key={i} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Session Info */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Sessions are 30 minutes long. You can pause or end early anytime.
          </AlertDescription>
        </Alert>
        
        {/* Benefits List */}
        <div className="space-y-2">
          <p className="text-sm font-medium">What to expect:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Natural conversation with your AI tutor
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Personalized explanations at your pace
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Practice problems and instant feedback
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Progress tracking and improvement insights
            </li>
          </ul>
        </div>
        
        {/* Start Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={startQuickSession}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting Session...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Voice Session Now
            </>
          )}
        </Button>
        
        {/* Alternative Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => router.push('/wizard')}
          >
            Change Topic
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => router.push('/settings')}
          >
            Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}