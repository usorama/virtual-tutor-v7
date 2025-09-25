'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { GRADE_LABELS, LearningPurpose } from '@/types/wizard'
import { CheckCircle2, GraduationCap, BookOpen, Target, Zap, Circle } from 'lucide-react'
import { formatTopicWithChapter, sortTopicsByChapter } from '@/lib/chapter-mappings'

interface WizardSummaryProps {
  grade: number | null
  purpose: LearningPurpose | null
  subjects: string[]
  topics: Record<string, string[]>
  className?: string
}

const PURPOSE_LABELS: Record<LearningPurpose, string> = {
  new_class: 'New Class',
  revision: 'Revision',
  exam_prep: 'Exam Prep'
}

const PURPOSE_DESCRIPTIONS: Record<LearningPurpose, string> = {
  new_class: 'Learn new topics at your own pace',
  revision: 'Quick review of topics you know',
  exam_prep: 'Intensive practice with key concepts'
}

export function WizardSummary({
  grade,
  purpose,
  subjects,
  topics,
  className
}: WizardSummaryProps) {
  const totalTopics = Object.values(topics).reduce((sum, topicList) => sum + topicList.length, 0)

  return (
    <div className={cn('', className)}>
      {/* Compact Header */}
      <div className="text-center mb-4">
        <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-2" />
        <h2 className="text-xl font-semibold text-white">Review Your Selections</h2>
        <p className="text-xs text-white/60 mt-1">
          Your personalized learning path
        </p>
      </div>

      {/* Vertical Stepper Layout */}
      <div className="max-w-2xl mx-auto w-full px-2">
        <div className="relative pb-4">
          {/* Vertical Line */}
          <div className="absolute left-4 top-8 bottom-8 w-[2px] bg-white/10"></div>

          {/* Step 1: Grade */}
          <div className="relative flex gap-4 pb-4">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border-2 border-accent">
              <GraduationCap className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white">Grade Level</span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-sm text-white/80">
                  {grade ? GRADE_LABELS[grade] : 'Not selected'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Purpose */}
          <div className="relative flex gap-4 pb-4">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border-2 border-accent">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white">Learning Purpose</span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-sm text-white/80">
                  {purpose ? PURPOSE_LABELS[purpose] : 'Not selected'}
                </span>
              </div>
              {purpose && (
                <p className="text-xs text-white/50 mt-1">
                  {PURPOSE_DESCRIPTIONS[purpose]}
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Subjects */}
          <div className="relative flex gap-4 pb-4">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border-2 border-accent">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white">Selected Subjects</span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-sm text-white/80">{subjects.length} selected</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {subjects.map(subject => (
                  <span
                    key={subject}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/10 text-white/90 border border-white/20"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Topics */}
          <div className="relative flex gap-4 pb-2">
            <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border-2 border-accent">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-white">Selected Topics</span>
                <span className="text-xs text-white/40">•</span>
                <span className="text-sm text-white/80">{totalTopics} total</span>
              </div>
              <div className="mt-2 space-y-2">
                {subjects.map(subject => {
                  const subjectTopics = topics[subject] || []
                  if (subjectTopics.length === 0) return null

                  return (
                    <div key={subject} className="pl-2 border-l-2 border-white/10">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-white/70">{subject}</span>
                        <span className="text-xs text-white/40">
                          {subjectTopics.length} {subjectTopics.length === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sortTopicsByChapter(subjectTopics).map((topic, index) => {
                          const displayTopic = formatTopicWithChapter(topic)
                          return (
                            <span
                              key={topic}
                              className="text-xs text-white/60 after:content-['•'] after:ml-1 after:text-white/30 last:after:content-none"
                              title={displayTopic}
                            >
                              {displayTopic.length > 30 ? displayTopic.slice(0, 30) + '...' : displayTopic}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Ready Message - Compact */}
        <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-sm text-white/90 text-center">
            Ready to personalize your learning experience
          </p>
        </div>

        {/* End Indicator */}
        <div className="flex items-center justify-center mt-8 mb-4 gap-3">
          <div className="h-[1px] w-12 bg-white/10"></div>
          <div className="flex items-center gap-2">
            <Circle className="h-2 w-2 fill-white/20 text-white/20" />
            <span className="text-xs text-white/40 uppercase tracking-wider">End of Summary</span>
            <Circle className="h-2 w-2 fill-white/20 text-white/20" />
          </div>
          <div className="h-[1px] w-12 bg-white/10"></div>
        </div>
      </div>
    </div>
  )
}