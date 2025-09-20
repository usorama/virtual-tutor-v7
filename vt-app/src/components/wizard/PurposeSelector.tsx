'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { PURPOSE_OPTIONS, LearningPurpose } from '@/types/wizard'

interface PurposeSelectorProps {
  selectedPurpose: LearningPurpose | null
  onPurposeSelect: (purpose: LearningPurpose) => void
  className?: string
}

export function PurposeSelector({
  selectedPurpose,
  onPurposeSelect,
  className
}: PurposeSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What&apos;s Your Learning Goal?</h2>
        <p className="text-gray-600">
          Choose your purpose to personalize your learning experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {PURPOSE_OPTIONS.map(option => {
          const isSelected = selectedPurpose === option.value

          return (
            <Card
              key={option.value}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg relative group',
                {
                  'ring-2 ring-blue-600 bg-blue-50': isSelected,
                  'hover:ring-2 hover:ring-gray-300 hover:bg-gray-50': !isSelected,
                }
              )}
              onClick={() => onPurposeSelect(option.value)}
            >
              <CardContent className="p-6 text-center">
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className="text-4xl mb-4">{option.icon}</div>

                {/* Title */}
                <h3 className={cn(
                  'font-semibold text-lg mb-2',
                  {
                    'text-blue-700': isSelected,
                    'text-gray-900': !isSelected,
                  }
                )}>
                  {option.label}
                </h3>

                {/* Description */}
                <p className={cn(
                  'text-sm',
                  {
                    'text-blue-600': isSelected,
                    'text-gray-500': !isSelected,
                  }
                )}>
                  {option.description}
                </p>

                {/* Additional learning path hints */}
                <div className="mt-4 text-xs text-gray-400">
                  {option.value === 'new_class' && 'Start from Chapter 1, cover all topics'}
                  {option.value === 'revision' && 'Focus on key concepts and practice'}
                  {option.value === 'exam_prep' && 'Prioritize important topics and tests'}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedPurpose && (
        <div className="text-center mt-6">
          <p className="text-sm text-green-600 font-medium">
            Learning goal selected: {PURPOSE_OPTIONS.find(p => p.value === selectedPurpose)?.label}
          </p>
        </div>
      )}
    </div>
  )
}