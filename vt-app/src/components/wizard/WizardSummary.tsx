'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { GRADE_LABELS, PURPOSE_OPTIONS, LearningPurpose } from '@/types/wizard'
import { CheckCircle2, GraduationCap, BookOpen, Target, Play, RotateCcw } from 'lucide-react'

interface WizardSummaryProps {
  grade: number | null
  subjects: string[]
  purpose: LearningPurpose | null
  topics: Record<string, string[]>
  className?: string
}

export function WizardSummary({
  grade,
  subjects,
  purpose,
  topics,
  className
}: WizardSummaryProps) {
  const totalTopics = Object.values(topics).reduce((sum, topicList) => sum + topicList.length, 0)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Review Your Selections</h2>
        <p className="text-gray-600">
          Please review your learning preferences before we begin
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* Grade Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Grade Level</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-lg py-1 px-3">
              {grade ? GRADE_LABELS[grade] : 'Not selected'}
            </Badge>
          </CardContent>
        </Card>

        {/* Subjects Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">
                Selected Subjects ({subjects.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjects.map(subject => (
                <Badge key={subject} variant="outline">
                  {subject}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Purpose Summary */}
        {purpose && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {purpose === 'new_class' && <Play className="h-5 w-5 text-blue-600" />}
                {purpose === 'revision' && <RotateCcw className="h-5 w-5 text-orange-600" />}
                {purpose === 'exam_prep' && <Target className="h-5 w-5 text-red-600" />}
                <CardTitle className="text-lg">Learning Purpose</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const purposeConfig = PURPOSE_OPTIONS.find(p => p.value === purpose)
                if (!purposeConfig) return null

                return (
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{purposeConfig.icon}</div>
                    <div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-sm py-1 px-3',
                          {
                            'bg-blue-100 text-blue-800': purpose === 'new_class',
                            'bg-orange-100 text-orange-800': purpose === 'revision',
                            'bg-red-100 text-red-800': purpose === 'exam_prep',
                          }
                        )}
                      >
                        {purposeConfig.label}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {purposeConfig.description}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Topics Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">
                Selected Topics ({totalTopics})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map(subject => {
              const subjectTopics = topics[subject] || []
              
              if (subjectTopics.length === 0) return null
              
              return (
                <div key={subject} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">
                    {subject} ({subjectTopics.length} topics)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {subjectTopics.slice(0, 6).map(topic => (
                      <div 
                        key={topic}
                        className="text-xs bg-gray-50 rounded px-2 py-1 truncate"
                        title={topic}
                      >
                        {topic}
                      </div>
                    ))}
                    {subjectTopics.length > 6 && (
                      <div className="text-xs text-gray-500 px-2 py-1">
                        +{subjectTopics.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Ready Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">
            Great choices! We&apos;re ready to personalize your learning experience.
          </p>
          <p className="text-green-600 text-sm mt-1">
            Click &quot;Complete&quot; to save your preferences and start learning
          </p>
        </div>
      </div>
    </div>
  )
}