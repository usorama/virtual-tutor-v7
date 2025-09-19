'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationButtonsProps {
  canGoNext: boolean
  canGoPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  isLastStep?: boolean
  isLoading?: boolean
  className?: string
}

export function NavigationButtons({
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  isLastStep = false,
  isLoading = false,
  className,
}: NavigationButtonsProps) {
  return (
    <div className={cn('flex justify-between items-center', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className="gap-2"
      >
        {isLastStep ? (
          <>
            Complete
            <Check className="h-4 w-4" />
          </>
        ) : (
          <>
            Next
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}