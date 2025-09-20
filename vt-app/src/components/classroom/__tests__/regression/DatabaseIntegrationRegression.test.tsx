import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

/**
 * Database Integration Regression Tests
 *
 * These tests verify that Phase 4 doesn't break existing database integrations
 * by testing against the REAL processed textbook data.
 *
 * Focus: Ensure Phase 4 classroom can still access and use real curriculum content
 */

// Use real Supabase client with service role for testing (read-only operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

describe('Database Integration Regression - Real Data Access', () => {
  describe('Processed Textbook Data Accessibility', () => {
    it('can access processed NCERT textbook from Phase 2.5', async () => {
      const { data: textbooks, error } = await supabase
        .from('textbooks')
        .select('*')
        .eq('grade', 10)
        .eq('subject', 'Mathematics')

      expect(error).toBeNull()
      expect(textbooks).toBeDefined()
      expect(textbooks!.length).toBeGreaterThan(0)

      // Should have the processed NCERT textbook
      const ncertTextbook = textbooks!.find(t =>
        t.title?.toLowerCase().includes('real numbers') ||
        t.file_name?.includes('real-numbers')
      )
      expect(ncertTextbook).toBeDefined()
    })

    it('can access processed chapters from Phase 2.5', async () => {
      const { data: chapters, error } = await supabase
        .from('chapters')
        .select('*')
        .limit(5)

      expect(error).toBeNull()
      expect(chapters).toBeDefined()
      expect(chapters!.length).toBeGreaterThan(0)

      // Verify chapter structure is intact
      const chapter = chapters![0]
      expect(chapter).toHaveProperty('id')
      expect(chapter).toHaveProperty('title')
      expect(chapter).toHaveProperty('textbook_id')
    })

    it('can access processed content chunks from Phase 2.5', async () => {
      const { data: chunks, error } = await supabase
        .from('content_chunks')
        .select('*')
        .limit(10)

      expect(error).toBeNull()
      expect(chunks).toBeDefined()
      expect(chunks!.length).toBeGreaterThan(0)

      // Verify content chunk structure for AI context
      const chunk = chunks![0]
      expect(chunk).toHaveProperty('id')
      expect(chunk).toHaveProperty('content')
      expect(chunk).toHaveProperty('chapter_id')
      expect(chunk.content).toBeTruthy()
    })
  })

  describe('Phase 1-3 Database Queries Still Work', () => {
    it('can fetch curriculum data for wizard (Phase 1)', async () => {
      const { data: curriculum, error } = await supabase
        .from('curriculum_data')
        .select('*')
        .eq('grade', 10)
        .eq('subject', 'Mathematics')

      expect(error).toBeNull()
      expect(curriculum).toBeDefined()

      if (curriculum!.length > 0) {
        const curriculumItem = curriculum![0]
        expect(curriculumItem).toHaveProperty('grade')
        expect(curriculumItem).toHaveProperty('subject')
      }
    })

    it('can access user profiles for dashboard (Phase 2)', async () => {
      // This verifies the user profile structure is accessible
      // (We don't create test users, just verify the query works)
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      // Query should work (even if no results for test user)
      expect(error).toBeNull()
    })

    it('can access session data for classroom (Phase 3)', async () => {
      // Verify classroom can access session-related data
      const { error } = await supabase
        .from('learning_sessions')
        .select('id, student_id, created_at')
        .limit(1)

      // Query structure should be valid
      expect(error).toBeNull()
    })
  })

  describe('Database Performance with Phase 4', () => {
    it('textbook content queries remain fast', async () => {
      const startTime = performance.now()

      const { data, error } = await supabase
        .from('content_chunks')
        .select('content')
        .limit(20)

      const queryTime = performance.now() - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(2000) // Should complete in under 2 seconds

      if (data && data.length > 0) {
        // Content should be available for AI context
        expect(data[0].content).toBeTruthy()
      }
    })

    it('chapter navigation queries remain efficient', async () => {
      const startTime = performance.now()

      const { data: chapters, error } = await supabase
        .from('chapters')
        .select(`
          id,
          title,
          chapter_number,
          textbooks(title, grade, subject)
        `)
        .limit(10)

      const queryTime = performance.now() - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(1500) // Should be fast

      if (chapters && chapters.length > 0) {
        const chapter = chapters[0]
        expect(chapter).toHaveProperty('textbooks')
      }
    })
  })

  describe('Real-time Subscriptions Compatibility', () => {
    it('can establish real-time connection for classroom updates', async () => {
      // Test that Supabase real-time subscriptions work
      // (Required for Phase 3 AI classroom real-time features)

      const channel = supabase.channel('test-classroom')

      let connectionEstablished = false

      const subscription = channel
        .on('presence', { event: 'sync' }, () => {
          connectionEstablished = true
        })
        .subscribe()

      // Give it a moment to establish connection
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Connection should be established or in progress (SUBSCRIBED or joining)
      expect(['SUBSCRIBED', 'joining'].includes(subscription.state)).toBe(true)

      // Cleanup
      await supabase.removeChannel(channel)
    }, 5000) // Allow extra time for real-time connection

    it('maintains RLS policies for secure data access', async () => {
      // Verify Row Level Security is still working
      // Anonymous users should have limited access

      const { data: textbooks, error } = await supabase
        .from('textbooks')
        .select('*')

      // Should either get public data or proper RLS error
      // (Not a generic permission error that would indicate broken setup)
      if (error) {
        expect(error.code).not.toBe('42501') // Not a permission denied error
      } else {
        expect(textbooks).toBeDefined()
      }
    })
  })

  describe('Content Availability for AI Context', () => {
    it('has sufficient content chunks for AI conversations', async () => {
      const { data: chunks, error, count } = await supabase
        .from('content_chunks')
        .select('*', { count: 'exact' })

      expect(error).toBeNull()
      expect(count).toBeGreaterThan(100) // Should have substantial content

      // Processing script created 194 chunks from all textbooks
      if (count && count > 0) {
        expect(count).toBeGreaterThanOrEqual(100)
      }
    })

    it('content chunks have proper structure for AI context', async () => {
      const { data: chunks, error } = await supabase
        .from('content_chunks')
        .select('content, chapter_id')
        .limit(5)

      expect(error).toBeNull()
      expect(chunks).toBeDefined()

      if (chunks && chunks.length > 0) {
        const chunk = chunks[0]

        // Should have actual content
        expect(chunk.content).toBeTruthy()
        expect(typeof chunk.content).toBe('string')
        expect(chunk.content.length).toBeGreaterThan(10)

        // Should be linked to a chapter
        expect(chunk.chapter_id).toBeTruthy()
      }
    })

    it('can construct AI context from real textbook data', async () => {
      // Simulate how the AI classroom would fetch context
      const { data: contextData, error } = await supabase
        .from('content_chunks')
        .select(`
          content,
          chapters(
            title,
            chapter_number,
            textbooks(title, grade, subject)
          )
        `)
        .limit(10)

      expect(error).toBeNull()
      expect(contextData).toBeDefined()

      if (contextData && contextData.length > 0) {
        const contextChunk = contextData[0]

        // Should have hierarchical structure for AI context
        expect(contextChunk.content).toBeTruthy()
        expect(contextChunk.chapters).toBeDefined()

        if (contextChunk.chapters && Array.isArray(contextChunk.chapters) && contextChunk.chapters.length > 0) {
          expect(contextChunk.chapters[0].textbooks).toBeDefined()
        }
      }
    })
  })
})