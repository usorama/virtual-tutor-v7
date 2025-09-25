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
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Clean horizontal step indicator */}
      <div className="relative flex items-center justify-center space-x-8">
        {WIZARD_STEP_NAMES.map((name, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={index} className="flex items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
                  {
                    // Active step - Cyan with glow
                    'bg-accent text-background shadow-lg shadow-accent/50': isActive,
                    // Completed steps - Cyan with check
                    'bg-accent text-background': isCompleted,
                    // Upcoming steps - Glass effect
                    'bg-white/5 text-white/50 border border-white/10': isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Step Label - Only show for active step */}
              {isActive && (
                <div className="ml-3">
                  <div className="text-sm font-medium text-accent">
                    {name}
                  </div>
                </div>
              )}

              {/* Connecting line */}
              {index < WIZARD_STEP_NAMES.length - 1 && (
                <div className="ml-4 w-12 h-0.5 bg-white/10">
                  <div
                    className={cn(
                      'h-full bg-accent transition-all duration-500',
                      isCompleted ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}