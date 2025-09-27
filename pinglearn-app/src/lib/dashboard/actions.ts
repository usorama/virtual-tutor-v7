'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'

export interface DashboardMetrics {
  studySessions: number
  topicsMastered: number
  voiceMinutes: number
  mathProblems: number
  studyStreak: number
  weeklyGoalProgress: number
  achievements: number
}

export interface ChartData {
  studySessions: number[]
  topicsMastered: number[]
  labels: string[]
}

export interface RecentSession {
  id: string
  title: string
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology'
  type: 'voice' | 'practice' | 'review'
  time: string
  duration: string
  score: string
  date: string
}

export async function getDashboardMetrics(): Promise<{
  data: DashboardMetrics | null
  error: string | null
}> {
  try {
    const user = await getUser()

    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // Get learning sessions count
    const { count: sessionCount } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // Get voice sessions total minutes
    const { data: voiceSessions } = await supabase
      .from('voice_sessions')
      .select(`
        ended_at,
        started_at,
        learning_sessions!inner(user_id)
      `)
      .eq('learning_sessions.user_id', user.id)
      .not('ended_at', 'is', null)

    const totalVoiceMinutes = voiceSessions?.reduce((total: number, session: any) => {
      if (session.started_at && session.ended_at) {
        const duration = (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60)
        return total + duration
      }
      return total
    }, 0) || 0

    // Get topics mastered from user progress
    const { data: topicProgress } = await supabase
      .from('topic_progress')
      .select('topic')
      .eq('user_id', user.id)
      .eq('mastery', 'advanced')

    // Get math problems from session analytics
    const { data: analytics } = await supabase
      .from('session_analytics')
      .select(`
        math_equations_processed,
        learning_sessions!inner(user_id)
      `)
      .eq('learning_sessions.user_id', user.id)

    const totalMathProblems = analytics?.reduce((total: number, session: any) => {
      return total + (session.math_equations_processed || 0)
    }, 0) || 0

    // Calculate study streak (simple calculation - consecutive days with sessions)
    const { data: recentSessions } = await supabase
      .from('learning_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(30)

    let studyStreak = 0
    if (recentSessions && recentSessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let currentDate = new Date(today)
      const sessionDates = new Set(
        recentSessions.map((s: any) => {
          const date = new Date(s.started_at)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
      )

      while (sessionDates.has(currentDate.getTime())) {
        studyStreak++
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }

    // Calculate weekly goal progress (sessions completed this week)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { count: weeklySessionCount } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('started_at', weekStart.toISOString())

    const weeklyGoalProgress = Math.min(((weeklySessionCount || 0) / 5) * 100, 100) // Assuming goal of 5 sessions per week

    return {
      data: {
        studySessions: sessionCount || 0,
        topicsMastered: topicProgress?.length || 0,
        voiceMinutes: Math.round(totalVoiceMinutes),
        mathProblems: totalMathProblems,
        studyStreak,
        weeklyGoalProgress: Math.round(weeklyGoalProgress),
        achievements: 0 // TODO: Implement achievements system
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return { data: null, error: 'Failed to fetch dashboard metrics' }
  }
}

export async function getDashboardChartData(): Promise<{
  data: ChartData | null
  error: string | null
}> {
  try {
    const user = await getUser()

    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // Get last 7 days of session data
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('started_at, status')
      .eq('user_id', user.id)
      .gte('started_at', sevenDaysAgo.toISOString())
      .order('started_at', { ascending: true })

    // Get topic progress data
    const { data: topicData } = await supabase
      .from('topic_progress')
      .select('last_studied_at, mastery')
      .eq('user_id', user.id)
      .gte('last_studied_at', sevenDaysAgo.toISOString())
      .order('last_studied_at', { ascending: true })

    // Process data into daily arrays
    const labels = []
    const studySessions = []
    const topicsMastered = []

    let cumulativeTopics = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo)
      date.setDate(date.getDate() + i)

      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      // Count sessions for this day
      const daySessions = sessions?.filter((s: any) => {
        const sessionDate = new Date(s.started_at)
        return sessionDate >= dayStart && sessionDate <= dayEnd && s.status === 'completed'
      }).length || 0

      // Count topics mastered up to this day
      const topicsToday = topicData?.filter((t: any) => {
        if (!t.last_studied_at) return false
        const topicDate = new Date(t.last_studied_at)
        return topicDate <= dayEnd && t.mastery === 'advanced'
      }).length || 0

      cumulativeTopics = Math.max(cumulativeTopics, topicsToday)

      labels.push(date.toLocaleDateString('en', { weekday: 'short' }))
      studySessions.push(daySessions)
      topicsMastered.push(cumulativeTopics)
    }

    return {
      data: {
        studySessions,
        topicsMastered,
        labels
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return { data: null, error: 'Failed to fetch chart data' }
  }
}

export async function getRecentSessions(): Promise<{
  data: RecentSession[] | null
  error: string | null
}> {
  try {
    const user = await getUser()

    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select(`
        id,
        subject,
        topic,
        started_at,
        ended_at,
        duration_seconds,
        status,
        voice_sessions(id, total_interactions),
        session_analytics(comprehension_score, engagement_score)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(5)

    if (!sessions) {
      return { data: [], error: null }
    }

    const recentSessions: RecentSession[] = sessions.map((session: any) => {
      const startTime = new Date(session.started_at)
      const duration = session.duration_seconds
        ? `${Math.round(session.duration_seconds / 60)} min`
        : session.ended_at
          ? `${Math.round((new Date(session.ended_at).getTime() - startTime.getTime()) / (1000 * 60))} min`
          : 'Unknown'

      // Determine session type
      let type: 'voice' | 'practice' | 'review' = 'voice'
      if (session.voice_sessions && session.voice_sessions.length > 0) {
        type = 'voice'
      } else {
        type = 'practice' // Default for non-voice sessions
      }

      // Generate score based on available data
      let score = 'Completed'
      if (session.session_analytics && session.session_analytics.length > 0) {
        const analytics = session.session_analytics[0]
        if (analytics.comprehension_score) {
          score = `${Math.round(analytics.comprehension_score * 100)}% comprehension`
        } else if (analytics.engagement_score) {
          score = `${Math.round(analytics.engagement_score * 100)}% engagement`
        }
      }

      // Format date
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let date = 'Earlier'
      if (startTime.toDateString() === today.toDateString()) {
        date = 'Today'
      } else if (startTime.toDateString() === yesterday.toDateString()) {
        date = 'Yesterday'
      } else {
        const daysAgo = Math.floor((today.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24))
        if (daysAgo <= 7) {
          date = `${daysAgo} days ago`
        }
      }

      return {
        id: session.id,
        title: session.topic || 'Learning Session',
        subject: session.subject,
        type,
        time: startTime.toLocaleTimeString('en', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        duration,
        score,
        date
      }
    })

    return { data: recentSessions, error: null }
  } catch (error) {
    console.error('Error fetching recent sessions:', error)
    return { data: null, error: 'Failed to fetch recent sessions' }
  }
}