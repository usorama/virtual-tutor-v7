'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIZARD_STEP_NAMES } from '@/types/wizard'

interface StepIndicatorProps {
  currentStep: number
  className?: string
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('w-full max-w-4xl mx-auto px-4', className)}>
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / (WIZARD_STEP_NAMES.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {WIZARD_STEP_NAMES.map((name, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div 
                key={index}
                className="flex flex-col items-center"
              >
                {/* Circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-colors',
                    {
                      'border-blue-600 bg-blue-600': isActive || isCompleted,
                      'border-gray-300': !isActive && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span 
                      className={cn('text-sm font-semibold', {
                        'text-white': isActive,
                        'text-gray-500': !isActive && !isCompleted,
                      })}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span 
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[100px]',
                    {
                      'text-blue-600': isActive,
                      'text-gray-900': isCompleted,
                      'text-gray-500': !isActive && !isCompleted,
                    }
                  )}
                >
                  {name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}