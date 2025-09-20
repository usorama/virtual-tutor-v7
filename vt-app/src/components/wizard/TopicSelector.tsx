'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronRight, Play, RotateCcw, Target } from 'lucide-react'
import { useState } from 'react'
import { LearningPurpose } from '@/types/wizard'

interface TopicSelectorProps {
  subjects: string[]
  availableTopics: Record<string, string[]>
  selectedTopics: Record<string, string[]>
  selectedPurpose: LearningPurpose | null
  onTopicsChange: (subject: string, topics: string[]) => void
  className?: string
}

export function TopicSelector({
  subjects,
  availableTopics,
  selectedTopics,
  selectedPurpose,
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

  const handleStartAtBeginning = (subject: string) => {
    const allTopics = availableTopics[subject] || []
    // For "start at beginning", select all topics but emphasize starting from first
    onTopicsChange(subject, allTopics)
  }

  const handlePurposeBasedSelection = (subject: string) => {
    const allTopics = availableTopics[subject] || []

    if (selectedPurpose === 'new_class') {
      // New class: select all topics, start from beginning
      onTopicsChange(subject, allTopics)
    } else if (selectedPurpose === 'revision') {
      // Revision: select first few key topics as starting point
      const keyTopics = allTopics.slice(0, Math.min(3, allTopics.length))
      onTopicsChange(subject, keyTopics)
    } else if (selectedPurpose === 'exam_prep') {
      // Exam prep: focus on important/common exam topics
      const examTopics = allTopics.filter((_, index) => index % 2 === 0) // Simple algorithm: every other topic
      onTopicsChange(subject, examTopics.length > 0 ? examTopics : allTopics.slice(0, 2))
    }
  }

  const getPurposeBasedSuggestion = () => {
    if (selectedPurpose === 'new_class') {
      return {
        title: 'New Class Learning',
        description: 'Start from the beginning and cover all topics systematically',
        icon: Play,
        action: 'Start at Chapter 1'
      }
    } else if (selectedPurpose === 'revision') {
      return {
        title: 'Revision Focus',
        description: 'Review key concepts and strengthen understanding',
        icon: RotateCcw,
        action: 'Select Key Topics'
      }
    } else if (selectedPurpose === 'exam_prep') {
      return {
        title: 'Exam Preparation',
        description: 'Focus on important topics commonly asked in exams',
        icon: Target,
        action: 'Select Exam Topics'
      }
    }
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Topics to Study</h2>
        <p className="text-gray-600">
          Choose specific topics for each subject you want to focus on
        </p>
      </div>

      {/* Purpose-based suggestion card */}
      {selectedPurpose && getPurposeBasedSuggestion() && (
        <Card className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const suggestion = getPurposeBasedSuggestion()!
                  const Icon = suggestion.icon
                  return (
                    <>
                      <Icon className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">{suggestion.title}</h4>
                        <p className="text-sm text-blue-700">{suggestion.description}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => subjects.forEach(subject => handlePurposeBasedSelection(subject))}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {getPurposeBasedSuggestion()!.action}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                    {/* Quick action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                      <div className="flex items-center space-x-2">
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

                      <div className="flex gap-1 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartAtBeginning(subject)}
                          className="h-7 px-2 text-xs"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start at Beginning
                        </Button>

                        {selectedPurpose && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePurposeBasedSelection(subject)}
                            className="h-7 px-2 text-xs"
                          >
                            {selectedPurpose === 'new_class' && <Play className="h-3 w-3 mr-1" />}
                            {selectedPurpose === 'revision' && <RotateCcw className="h-3 w-3 mr-1" />}
                            {selectedPurpose === 'exam_prep' && <Target className="h-3 w-3 mr-1" />}
                            {selectedPurpose === 'new_class' ? 'All Topics' :
                             selectedPurpose === 'revision' ? 'Key Topics' :
                             'Exam Topics'}
                          </Button>
                        )}
                      </div>
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