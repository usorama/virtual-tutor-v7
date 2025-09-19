'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { 
  Calculator, 
  Beaker, 
  BookOpen, 
  Globe, 
  Atom,
  TestTube,
  Dna
} from 'lucide-react'

interface Subject {
  name: string
  icon: React.ElementType
  description: string
  color: string
}

const SUBJECT_CONFIG: Record<string, Subject> = {
  Mathematics: {
    name: 'Mathematics',
    icon: Calculator,
    description: 'Numbers, equations, geometry',
    color: 'blue',
  },
  Science: {
    name: 'Science',
    icon: Beaker,
    description: 'General science concepts',
    color: 'green',
  },
  Physics: {
    name: 'Physics',
    icon: Atom,
    description: 'Motion, forces, energy',
    color: 'purple',
  },
  Chemistry: {
    name: 'Chemistry',
    icon: TestTube,
    description: 'Elements, compounds, reactions',
    color: 'orange',
  },
  Biology: {
    name: 'Biology',
    icon: Dna,
    description: 'Life, organisms, ecosystems',
    color: 'emerald',
  },
  English: {
    name: 'English',
    icon: BookOpen,
    description: 'Literature, grammar, writing',
    color: 'red',
  },
  'Social Science': {
    name: 'Social Science',
    icon: Globe,
    description: 'History, geography, civics',
    color: 'indigo',
  },
}

interface SubjectSelectorProps {
  availableSubjects: string[]
  selectedSubjects: string[]
  onSubjectsChange: (subjects: string[]) => void
  className?: string
}

export function SubjectSelector({ 
  availableSubjects,
  selectedSubjects, 
  onSubjectsChange,
  className 
}: SubjectSelectorProps) {
  const handleToggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      onSubjectsChange(selectedSubjects.filter(s => s !== subject))
    } else {
      onSubjectsChange([...selectedSubjects, subject])
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Your Subjects</h2>
        <p className="text-gray-600">
          Choose the subjects you want to study (you can select multiple)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {availableSubjects.map(subject => {
          const config = SUBJECT_CONFIG[subject] || {
            name: subject,
            icon: BookOpen,
            description: subject,
            color: 'gray',
          }
          const Icon = config.icon
          const isSelected = selectedSubjects.includes(subject)
          
          return (
            <Card
              key={subject}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg relative',
                {
                  'ring-2 ring-blue-600 bg-blue-50': isSelected,
                  'hover:ring-2 hover:ring-gray-300': !isSelected,
                }
              )}
              onClick={() => handleToggleSubject(subject)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Icon 
                      className={cn(
                        'h-10 w-10 mb-3',
                        {
                          'text-blue-600': isSelected,
                          'text-gray-400': !isSelected,
                        }
                      )}
                    />
                    <h3 className="font-semibold text-lg">{config.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {config.description}
                    </p>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSubject(subject)}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedSubjects.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-sm text-green-600 font-medium">
            {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  )
}