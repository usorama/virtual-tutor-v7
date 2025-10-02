'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { formatTopicWithChapter, sortTopicsByChapter } from '@/lib/chapter-mappings'

interface TopicSelectorProps {
  subjects: string[]
  availableTopics: Record<string, string[]>
  selectedTopics: Record<string, string[]>
  onTopicsChange: (subject: string, topics: string[]) => void
  className?: string
}

export function TopicSelector({ 
  subjects,
  availableTopics,
  selectedTopics, 
  onTopicsChange,
  className 
}: TopicSelectorProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(
    subjects.length > 0 ? subjects[0] : null
  )

  const handleToggleTopic = (subject: string, topic: string) => {
    const currentTopics = selectedTopics[subject] || []
    
    if (currentTopics.includes(topic)) {
      onTopicsChange(
        subject,
        currentTopics.filter(t => t !== topic)
      )
    } else {
      onTopicsChange(subject, [...currentTopics, topic])
    }
  }

  const handleSelectAll = (subject: string) => {
    const allTopics = availableTopics[subject] || []
    const currentTopics = selectedTopics[subject] || []
    
    if (currentTopics.length === allTopics.length) {
      // Deselect all
      onTopicsChange(subject, [])
    } else {
      // Select all
      onTopicsChange(subject, allTopics)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="max-w-4xl mx-auto space-y-4">
        {subjects.map(subject => {
          const topics = availableTopics[subject] || []
          const selected = selectedTopics[subject] || []
          const isExpanded = expandedSubject === subject

          return (
            <Card
              key={subject}
              className={cn(
                'glass-interactive-elevated transition-all',
                {
                  'border-2 border-accent': isExpanded,
                  'border border-white/10': !isExpanded,
                }
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg text-white">{subject}</CardTitle>
                    <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                      {selected.length}/{topics.length} selected
                    </Badge>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-5 w-5 transition-transform text-white/60',
                      {
                        'rotate-90': isExpanded,
                      }
                    )}
                  />
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Select all checkbox */}
                    <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
                      <Checkbox
                        id={`${subject}-all`}
                        checked={selected.length === topics.length && topics.length > 0}
                        onCheckedChange={() => handleSelectAll(subject)}
                        className="border-white/20 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      />
                      <label
                        htmlFor={`${subject}-all`}
                        className="text-sm font-medium cursor-pointer text-white"
                      >
                        Select All
                      </label>
                    </div>

                    {/* Topics grid - sorted by chapter number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sortTopicsByChapter(topics).map(topic => {
                        const isSelected = selected.includes(topic)
                        const id = `${subject}-${topic}`
                        const displayTopic = formatTopicWithChapter(topic)

                        return (
                          <div
                            key={`${subject}-${topic}`}
                            className={cn(
                              'flex items-center space-x-2 p-2 rounded-md transition-colors',
                              {
                                'bg-accent/10 border border-accent/30': isSelected,
                                'hover:bg-white/5': !isSelected,
                              }
                            )}
                          >
                            <Checkbox
                              id={id}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleTopic(subject, topic)}
                              className="border-white/20 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                            />
                            <label
                              htmlFor={id}
                              className="text-sm cursor-pointer flex-1 text-white"
                            >
                              {displayTopic}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Summary of selections */}
      <div className="text-center mt-6">
        <p className="text-sm text-white/70">
          Total topics selected: {' '}
          <span className="font-medium text-accent">
            {Object.values(selectedTopics).reduce((sum, topics) => sum + topics.length, 0)}
          </span>
        </p>
      </div>
    </div>
  )
}