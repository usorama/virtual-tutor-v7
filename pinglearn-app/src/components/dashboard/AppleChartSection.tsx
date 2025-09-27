'use client'

import { useState } from 'react'
import { ComboChart } from './ComboChart'
import { AppleLightGlassContainer } from './AppleLightGlass'

export function AppleChartSection() {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  const mockChartData = {
    studySessions: [2, 1, 3, 2, 1, 2, 3],
    topicsMastered: [12, 14, 18, 21, 23, 26, 30],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }

  return (
    <AppleLightGlassContainer>
      <ComboChart
        data={mockChartData}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        className="h-full"
      />
    </AppleLightGlassContainer>
  )
}