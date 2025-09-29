'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'

export interface Note {
  id: string
  content: string
  type: 'definition' | 'formula' | 'example' | 'tip'
  latex?: string
}

export interface NotesData {
  keyConcepts: Note[]
  examples: Note[]
  summary: string[]
  sessionTopic?: string
}

export async function getSessionNotes(sessionId?: string): Promise<{
  data: NotesData | null
  error: string | null
}> {
  try {
    const userResponse = await getUser()

    if (!userResponse.success || !userResponse.data?.user) {
      return { data: null, error: 'User not authenticated' }
    }

    const user = userResponse.data.user

    const supabase = await createClient()

    if (sessionId) {
      // Get specific session notes
      const { data: session, error: sessionError } = await supabase
        .from('learning_sessions')
        .select(`
          id,
          topic,
          subject,
          transcripts(
            speaker,
            message,
            timestamp
          ),
          session_analytics(
            concepts_covered
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (sessionError || !session) {
        return { data: null, error: 'Session not found' }
      }

      return {
        data: processSessionIntoNotes(session),
        error: null
      }
    } else {
      // Get notes from most recent session
      const { data: recentSession, error: sessionError } = await supabase
        .from('learning_sessions')
        .select(`
          id,
          topic,
          subject,
          transcripts(
            speaker,
            message,
            timestamp
          ),
          session_analytics(
            concepts_covered
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (sessionError || !recentSession) {
        // Return empty notes if no session found
        return {
          data: {
            keyConcepts: [],
            examples: [],
            summary: [],
            sessionTopic: 'No recent sessions'
          },
          error: null
        }
      }

      return {
        data: processSessionIntoNotes(recentSession),
        error: null
      }
    }
  } catch (error) {
    console.error('Error fetching session notes:', error)
    return { data: null, error: 'Failed to fetch session notes' }
  }
}

interface SessionData {
  id: string
  topic?: string
  subject?: string
  transcripts?: {
    speaker: string
    message: string
    timestamp: string
  }[]
  session_analytics?: {
    concepts_covered?: string[]
  }[]
}

function processSessionIntoNotes(session: SessionData): NotesData {
  const keyConcepts: Note[] = []
  const examples: Note[] = []
  const summary: string[] = []

  // Extract from session analytics if available
  if (session.session_analytics && session.session_analytics.length > 0) {
    const analytics = session.session_analytics[0]
    if (analytics.concepts_covered && Array.isArray(analytics.concepts_covered)) {
      analytics.concepts_covered.forEach((concept: string, index: number) => {
        keyConcepts.push({
          id: `concept-${index}`,
          content: concept,
          type: 'definition'
        })
      })
    }
  }

  // Process transcripts to extract mathematical content and examples
  if (session.transcripts && Array.isArray(session.transcripts)) {
    const tutorMessages = session.transcripts
      .filter((t) => t.speaker === 'tutor')
      .map((t) => t.message)

    let exampleCounter = 0
    tutorMessages.forEach((message: string, index: number) => {
      // Look for mathematical expressions (simple heuristic)
      const mathRegex = /([a-zA-Z]*\s*=\s*[^.]+|[0-9]+\s*[+\-*/]\s*[0-9]+|[a-zA-Z]\^[0-9]+)/g
      const mathMatches = message.match(mathRegex)

      if (mathMatches) {
        mathMatches.forEach((match) => {
          examples.push({
            id: `example-${exampleCounter++}`,
            content: `From session discussion`,
            type: 'example',
            latex: match.trim()
          })
        })
      }

      // Look for definitions or key concepts
      if (message.toLowerCase().includes('definition') ||
          message.toLowerCase().includes('formula') ||
          message.toLowerCase().includes('theorem')) {
        keyConcepts.push({
          id: `concept-${keyConcepts.length}`,
          content: message.split('.')[0], // Take first sentence
          type: 'definition'
        })
      }

      // Create summary points from key tutor explanations
      if (message.length > 50 && message.length < 200) {
        summary.push(message.trim())
      }
    })

    // Limit summary to 4 most relevant points
    summary.splice(4)
  }

  // Add some fallback content based on subject if no meaningful content was extracted
  if (keyConcepts.length === 0 && examples.length === 0 && summary.length === 0) {
    const subjectDefaults = getDefaultContentForSubject(session.subject || 'General', session.topic || 'Learning Session')
    keyConcepts.push(...subjectDefaults.keyConcepts)
    examples.push(...subjectDefaults.examples)
    summary.push(...subjectDefaults.summary)
  }

  return {
    keyConcepts: keyConcepts.slice(0, 5), // Limit to 5 key concepts
    examples: examples.slice(0, 4), // Limit to 4 examples
    summary: summary.slice(0, 4), // Limit to 4 summary points
    sessionTopic: session.topic || session.subject
  }
}

function getDefaultContentForSubject(subject: string, topic: string): NotesData {
  // Provide meaningful defaults based on subject
  switch (subject?.toLowerCase()) {
    case 'mathematics':
      return {
        keyConcepts: [
          {
            id: 'default-1',
            content: `Key concepts in ${topic || 'Mathematics'}`,
            type: 'definition'
          }
        ],
        examples: [
          {
            id: 'default-ex-1',
            content: 'Example problem discussion',
            type: 'example'
          }
        ],
        summary: [
          `Explored fundamental concepts in ${topic || 'Mathematics'}`,
          'Practiced problem-solving techniques',
          'Discussed real-world applications'
        ]
      }

    case 'physics':
      return {
        keyConcepts: [
          {
            id: 'default-1',
            content: `Physics principles in ${topic || 'Motion'}`,
            type: 'definition'
          }
        ],
        examples: [
          {
            id: 'default-ex-1',
            content: 'Practical physics example',
            type: 'example'
          }
        ],
        summary: [
          `Studied ${topic || 'Physics'} concepts`,
          'Analyzed physical phenomena',
          'Connected theory with real-world examples'
        ]
      }

    case 'chemistry':
      return {
        keyConcepts: [
          {
            id: 'default-1',
            content: `Chemical concepts in ${topic || 'Reactions'}`,
            type: 'definition'
          }
        ],
        examples: [
          {
            id: 'default-ex-1',
            content: 'Chemical reaction example',
            type: 'example'
          }
        ],
        summary: [
          `Explored ${topic || 'Chemistry'} principles`,
          'Studied molecular interactions',
          'Discussed chemical processes'
        ]
      }

    default:
      return {
        keyConcepts: [
          {
            id: 'default-1',
            content: `Key learning points from ${topic || subject || 'the session'}`,
            type: 'definition'
          }
        ],
        examples: [
          {
            id: 'default-ex-1',
            content: 'Practice example from discussion',
            type: 'example'
          }
        ],
        summary: [
          `Completed learning session on ${topic || subject || 'various topics'}`,
          'Engaged in interactive discussion',
          'Gained new understanding of key concepts'
        ]
      }
  }
}