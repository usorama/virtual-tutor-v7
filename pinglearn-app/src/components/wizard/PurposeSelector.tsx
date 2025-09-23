'use client';

import { BookOpen, RefreshCw, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LearningPurpose } from '@/types/wizard';

interface PurposeSelectorProps {
  selected: LearningPurpose | null;
  onSelect: (purpose: LearningPurpose) => void;
}

const purposes = [
  {
    id: 'new_class' as const,
    label: 'New Class',
    description: 'Learn new topics at your own pace',
    icon: BookOpen,
    color: 'text-blue-500'
  },
  {
    id: 'revision' as const,
    label: 'Revision',
    description: 'Quick review of topics you know',
    icon: RefreshCw,
    color: 'text-green-500'
  },
  {
    id: 'exam_prep' as const,
    label: 'Exam Prep',
    description: 'Intensive practice with key concepts',
    icon: GraduationCap,
    color: 'text-purple-500'
  }
];

export function PurposeSelector({ selected, onSelect }: PurposeSelectorProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {purposes.map((purpose) => {
        const Icon = purpose.icon;
        const isSelected = selected === purpose.id;

        return (
          <Card
            key={purpose.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(purpose.id)}
          >
            <CardContent className="p-6 text-center">
              <Icon className={cn("h-12 w-12 mx-auto mb-3", purpose.color)} />
              <h3 className="font-semibold text-lg mb-2">{purpose.label}</h3>
              <p className="text-sm text-muted-foreground">
                {purpose.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}