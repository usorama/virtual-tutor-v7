'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { GRADE_LABELS } from '@/types/wizard'
import { getAvailableGrades } from '@/lib/wizard/actions'
import { GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GradeSelectorProps {
  selectedGrade: number | null
  onGradeSelect: (grade: number) => void
  className?: string
}

export function GradeSelector({ 
  selectedGrade, 
  onGradeSelect,
  className 
}: GradeSelectorProps) {
  const [availableGrades, setAvailableGrades] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchGrades() {
      try {
        const { data, error } = await getAvailableGrades()
        
        if (error) {
          toast.error('Failed to load available grades')
          console.error(error)
        } else if (data) {
          setAvailableGrades(data)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrades()
  }, [])

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Select Your Grade</h2>
          <p className="text-gray-600">
            Choose your current grade level to personalize your learning experience
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Your Grade</h2>
        <p className="text-gray-600">
          Choose your current grade level to personalize your learning experience
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {availableGrades.map(grade => (
          <Card
            key={grade}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              {
                'ring-2 ring-blue-600 bg-blue-50': selectedGrade === grade,
                'hover:ring-2 hover:ring-gray-300': selectedGrade !== grade,
              }
            )}
            onClick={() => onGradeSelect(grade)}
          >
            <CardContent className="p-6 text-center">
              <GraduationCap 
                className={cn(
                  'h-12 w-12 mx-auto mb-3',
                  {
                    'text-blue-600': selectedGrade === grade,
                    'text-gray-400': selectedGrade !== grade,
                  }
                )}
              />
              <h3 className="font-semibold text-lg">{GRADE_LABELS[grade]}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {grade === 9 || grade === 10 ? 'Secondary' : 'Higher Secondary'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedGrade && (
        <div className="text-center mt-6">
          <p className="text-sm text-green-600 font-medium">
            You&apos;ve selected {GRADE_LABELS[selectedGrade]}
          </p>
        </div>
      )}
    </div>
  )
}