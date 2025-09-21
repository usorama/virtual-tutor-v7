'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

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
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Topics to Study</h2>
        <p className="text-gray-600">
          Choose specific topics for each subject you want to focus on
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {subjects.map(subject => {
          const topics = availableTopics[subject] || []
          const selected = selectedTopics[subject] || []
          const isExpanded = expandedSubject === subject
          
          return (
            <Card 
              key={subject}
              className={cn(
                'transition-all',
                {
                  'ring-2 ring-blue-600': isExpanded,
                }
              )}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{subject}</CardTitle>
                    <Badge variant="secondary">
                      {selected.length}/{topics.length} selected
                    </Badge>
                  </div>
                  <ChevronRight 
                    className={cn(
                      'h-5 w-5 transition-transform',
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
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id={`${subject}-all`}
                        checked={selected.length === topics.length && topics.length > 0}
                        onCheckedChange={() => handleSelectAll(subject)}
                      />
                      <label 
                        htmlFor={`${subject}-all`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>

                    {/* Topics grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {topics.map(topic => {
                        const isSelected = selected.includes(topic)
                        const id = `${subject}-${topic}`
                        
                        return (
                          <div 
                            key={topic}
                            className={cn(
                              'flex items-center space-x-2 p-2 rounded-md transition-colors',
                              {
                                'bg-blue-50': isSelected,
                                'hover:bg-gray-50': !isSelected,
                              }
                            )}
                          >
                            <Checkbox
                              id={id}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleTopic(subject, topic)}
                            />
                            <label 
                              htmlFor={id}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {topic}
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
        <p className="text-sm text-gray-600">
          Total topics selected: {' '}
          <span className="font-medium text-green-600">
            {Object.values(selectedTopics).reduce((sum, topics) => sum + topics.length, 0)}
          </span>
        </p>
      </div>
    </div>
  )
}