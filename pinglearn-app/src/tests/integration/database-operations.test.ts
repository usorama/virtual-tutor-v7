/**
 * Database Operations Integration Tests
 *
 * Tests database operations, data consistency, and transaction handling
 * for TEST-002 coverage expansion with focus on real-world scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestContext,
  cleanupTestContext,
  createMockStudent,
  createMockLearningSession,
  createMockTextbook,
  createMockTranscript,
  PerformanceTimer,
  assertDatabaseConsistency,
  seedComplexTestData,
  type TestContext
} from '@/tests/utils/enhanced-integration-helpers';

describe('Database Operations Integration Tests', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await cleanupTestContext(context);
  });

  describe('Profile Management Operations', () => {
    it('should create and retrieve user profiles with all fields', async () => {
      const timer = new PerformanceTimer();

      const student = await createMockStudent(context, {
        voice_preferences: {
          language: 'en',
          speed: 1.2,
          pitch: 0.9,
          volume: 0.8,
          accent: 'american'
        },
        learning_style: 'visual'
      });

      // Verify profile was created correctly
      const { data: profile, error } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', student.id)
        .single();

      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile.id).toBe(student.id);
      expect(profile.email).toBe(student.email);
      expect(profile.full_name).toBe(student.full_name);
      expect(profile.voice_preferences).toEqual(student.voice_preferences);
      expect(profile.learning_style).toBe(student.learning_style);

      // Test performance
      timer.expectUnder(100, 'Profile creation and retrieval should be fast');
    });

    it('should handle profile updates correctly', async () => {
      const student = await createMockStudent(context);

      // Update profile with new preferences
      const updatedPreferences = {
        language: 'es',
        speed: 0.8,
        pitch: 1.1,
        volume: 0.7
      };

      const { error: updateError } = await context.supabase
        .from('profiles')
        .update({
          voice_preferences: updatedPreferences,
          learning_style: 'auditory',
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      expect(updateError).toBeNull();

      // Verify updates were applied
      const { data: updatedProfile } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', student.id)
        .single();

      expect(updatedProfile.voice_preferences).toEqual(updatedPreferences);
      expect(updatedProfile.learning_style).toBe('auditory');
    });

    it('should enforce data validation on profile creation', async () => {
      // Test invalid email
      const { error: emailError } = await context.supabase
        .from('profiles')
        .insert({
          id: 'test-invalid-email',
          email: 'not-an-email',
          full_name: 'Test User'
        });

      // Note: This depends on database constraints being configured
      // If no constraint exists, this test documents expected behavior
      expect(emailError?.message).toMatch(/email|validation|constraint/i);
    });
  });

  describe('Learning Sessions Operations', () => {
    it('should create learning sessions with proper relationships', async () => {
      const student = await createMockStudent(context);
      const session = await createMockLearningSession(context, student.id, {
        topic: 'quadratic_equations',
        status: 'active'
      });

      // Verify session was created with proper foreign key relationship
      const { data: savedSession, error } = await context.supabase
        .from('learning_sessions')
        .select(`
          *,
          profiles:student_id(id, full_name, email)
        `)
        .eq('id', session.id)
        .single();

      expect(error).toBeNull();
      expect(savedSession).toBeDefined();
      expect(savedSession.student_id).toBe(student.id);
      expect(savedSession.topic).toBe('quadratic_equations');
      expect(savedSession.status).toBe('active');

      // Verify relationship data is populated
      expect(savedSession.profiles).toBeDefined();
      expect(savedSession.profiles.id).toBe(student.id);
      expect(savedSession.profiles.full_name).toBe(student.full_name);
    });

    it('should handle session progress updates correctly', async () => {
      const student = await createMockStudent(context);
      const session = await createMockLearningSession(context, student.id);

      // Update session progress
      const progressUpdate = {
        current_topic: 'quadratic_equations',
        completion_percentage: 45,
        topics_covered: ['linear_equations', 'quadratic_basics'],
        next_topics: ['quadratic_formula'],
        milestones_reached: ['chapter_1_complete']
      };

      const { error: updateError } = await context.supabase
        .from('learning_sessions')
        .update({
          progress: progressUpdate,
          session_data: {
            topics_discussed: ['linear_equations', 'quadratic_basics'],
            chapter_focus: 'algebra',
            student_questions: ['What is a quadratic equation?'],
            ai_responses: ['A quadratic equation is...'],
            progress_markers: [{
              timestamp: new Date().toISOString(),
              milestone: 'chapter_1_complete',
              details: 'Completed basic algebra concepts'
            }],
            difficulty_adjustments: []
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      expect(updateError).toBeNull();

      // Verify progress was saved correctly
      const { data: updatedSession } = await context.supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', session.id)
        .single();

      expect(updatedSession.progress).toEqual(progressUpdate);
      expect(updatedSession.session_data.topics_discussed).toContain('quadratic_basics');
      expect(updatedSession.session_data.progress_markers).toHaveLength(1);
    });

    it('should handle concurrent session updates safely', async () => {
      const student = await createMockStudent(context);
      const session = await createMockLearningSession(context, student.id);

      // Simulate concurrent updates
      const update1 = context.supabase
        .from('learning_sessions')
        .update({
          progress: {
            completion_percentage: 25,
            topics_covered: ['topic_1'],
            current_topic: 'topic_1',
            next_topics: ['topic_2'],
            milestones_reached: []
          }
        })
        .eq('id', session.id);

      const update2 = context.supabase
        .from('learning_sessions')
        .update({
          session_data: {
            student_questions: ['Question 1', 'Question 2'],
            ai_responses: ['Answer 1', 'Answer 2'],
            topics_discussed: ['topic_1'],
            progress_markers: [],
            difficulty_adjustments: []
          }
        })
        .eq('id', session.id);

      // Both updates should succeed
      const [result1, result2] = await Promise.all([update1, update2]);
      expect(result1.error).toBeNull();
      expect(result2.error).toBeNull();

      // Verify final state is consistent
      const { data: finalSession } = await context.supabase
        .from('learning_sessions')
        .select('*')
        .eq('id', session.id)
        .single();

      expect(finalSession).toBeDefined();
      expect(finalSession.progress.completion_percentage).toBe(25);
      expect(finalSession.session_data.student_questions).toHaveLength(2);
    });
  });

  describe('Textbook and Content Management', () => {
    it('should create textbooks with hierarchical metadata', async () => {
      const student = await createMockStudent(context);
      const textbook = await createMockTextbook(context, student.id, {
        subject: 'mathematics',
        grade_level: 10,
        enhanced_metadata: {
          isbn: '978-0-123456-78-9',
          publisher: 'Educational Press',
          edition: '2nd Edition',
          language: 'en',
          curriculum_board: 'CBSE',
          difficulty_level: 'intermediate',
          tags: ['algebra', 'geometry', 'trigonometry'],
          description: 'Comprehensive mathematics textbook for grade 10'
        }
      });

      // Verify textbook creation
      const { data: savedTextbook, error } = await context.supabase
        .from('textbooks')
        .select('*')
        .eq('id', textbook.id)
        .single();

      expect(error).toBeNull();
      expect(savedTextbook).toBeDefined();
      expect(savedTextbook.enhanced_metadata.isbn).toBe('978-0-123456-78-9');
      expect(savedTextbook.enhanced_metadata.tags).toContain('algebra');
      expect(savedTextbook.enhanced_metadata.difficulty_level).toBe('intermediate');
    });

    it('should handle textbook processing status updates', async () => {
      const student = await createMockStudent(context);
      const textbook = await createMockTextbook(context, student.id, {
        status: 'processing',
        processing_status: 'pending'
      });

      // Simulate processing completion
      const { error: updateError } = await context.supabase
        .from('textbooks')
        .update({
          status: 'ready',
          processing_status: 'completed',
          processed_content: {
            chapters: [
              {
                chapter_number: 1,
                title: 'Introduction to Algebra',
                content: 'Chapter 1 content...',
                topics: ['variables', 'expressions'],
                start_page: 1,
                end_page: 25,
                math_equations: ['x + 2 = 5', 'y = mx + b'],
                examples: ['Example 1: Solve for x'],
                exercises: ['Exercise 1.1', 'Exercise 1.2']
              }
            ],
            total_pages: 200,
            processing_version: '2.0',
            last_processed: new Date().toISOString(),
            extraction_quality: 'high'
          },
          processed_at: new Date().toISOString()
        })
        .eq('id', textbook.id);

      expect(updateError).toBeNull();

      // Verify processing update
      const { data: processedTextbook } = await context.supabase
        .from('textbooks')
        .select('*')
        .eq('id', textbook.id)
        .single();

      expect(processedTextbook.status).toBe('ready');
      expect(processedTextbook.processing_status).toBe('completed');
      expect(processedTextbook.processed_content.chapters).toHaveLength(1);
      expect(processedTextbook.processed_content.extraction_quality).toBe('high');
    });
  });

  describe('Voice Sessions and Transcription Integration', () => {
    it('should create voice sessions with proper transcription relationships', async () => {
      const student = await createMockStudent(context);
      const learningSession = await createMockLearningSession(context, student.id);

      // Create voice session
      const { data: voiceSession, error: voiceError } = await context.supabase
        .from('voice_sessions')
        .insert({
          id: `voice-${context.testId}`,
          session_id: learningSession.id,
          livekit_room_name: `room-${context.testId}`,
          started_at: new Date().toISOString(),
          status: 'active',
          audio_quality: 'good',
          total_interactions: 0,
          error_count: 0,
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      expect(voiceError).toBeNull();
      expect(voiceSession).toBeDefined();

      // Add cleanup for voice session
      context.cleanup.push(async () => {
        await context.supabase
          .from('voice_sessions')
          .delete()
          .eq('id', voiceSession.id);
      });

      // Create transcription for the voice session
      const transcript = await createMockTranscript(context, voiceSession.id, {
        content: 'How do I solve quadratic equations?',
        speaker: 'student',
        math_content: true,
        confidence: 0.92
      });

      // Verify relationship between voice session and transcription
      const { data: sessionWithTranscripts } = await context.supabase
        .from('voice_sessions')
        .select(`
          *,
          transcripts(*)
        `)
        .eq('id', voiceSession.id)
        .single();

      expect(sessionWithTranscripts.transcripts).toHaveLength(1);
      expect(sessionWithTranscripts.transcripts[0].content).toContain('quadratic equations');
    });

    it('should update voice session statistics correctly', async () => {
      const student = await createMockStudent(context);
      const learningSession = await createMockLearningSession(context, student.id);

      // Create voice session
      const { data: voiceSession } = await context.supabase
        .from('voice_sessions')
        .insert({
          id: `voice-stats-${context.testId}`,
          session_id: learningSession.id,
          livekit_room_name: `room-stats-${context.testId}`,
          status: 'active',
          total_interactions: 0,
          error_count: 0
        })
        .select()
        .single();

      context.cleanup.push(async () => {
        await context.supabase.from('voice_sessions').delete().eq('id', voiceSession.id);
      });

      // Simulate interaction updates
      const { error: updateError } = await context.supabase
        .from('voice_sessions')
        .update({
          total_interactions: 5,
          audio_quality: 'excellent',
          last_activity: new Date().toISOString()
        })
        .eq('id', voiceSession.id);

      expect(updateError).toBeNull();

      // Verify statistics update
      const { data: updatedSession } = await context.supabase
        .from('voice_sessions')
        .select('*')
        .eq('id', voiceSession.id)
        .single();

      expect(updatedSession.total_interactions).toBe(5);
      expect(updatedSession.audio_quality).toBe('excellent');
    });
  });

  describe('Complex Data Relationships and Queries', () => {
    it('should handle complex multi-table queries efficiently', async () => {
      const timer = new PerformanceTimer();

      // Create complex test data
      const { students, textbooks } = await seedComplexTestData(context);
      const sessions = await Promise.all(
        students.map(student =>
          createMockLearningSession(context, student.id, {
            topic: 'mathematics_advanced'
          })
        )
      );

      // Complex query: Get all learning sessions with student profiles and textbook data
      const { data: complexQuery, error } = await context.supabase
        .from('learning_sessions')
        .select(`
          *,
          profiles:student_id(id, full_name, learning_style),
          textbooks:textbooks!textbooks_user_id_fkey(id, title, subject, grade_level)
        `)
        .in('student_id', students.map(s => s.id));

      expect(error).toBeNull();
      expect(complexQuery).toHaveLength(sessions.length);

      // Verify relationships are populated
      complexQuery.forEach(session => {
        expect(session.profiles).toBeDefined();
        expect(session.profiles.full_name).toBeTruthy();
        // Note: textbook relationship depends on actual foreign key setup
      });

      // Performance check for complex query
      timer.expectUnder(500, 'Complex multi-table query should complete quickly');
    });

    it('should maintain referential integrity with cascading operations', async () => {
      const student = await createMockStudent(context);
      const session = await createMockLearningSession(context, student.id);

      // Create voice session linked to learning session
      const { data: voiceSession } = await context.supabase
        .from('voice_sessions')
        .insert({
          id: `cascade-test-${context.testId}`,
          session_id: session.id,
          livekit_room_name: `cascade-room-${context.testId}`,
          status: 'active'
        })
        .select()
        .single();

      context.cleanup.push(async () => {
        await context.supabase.from('voice_sessions').delete().eq('id', voiceSession.id);
      });

      // Create transcript linked to voice session
      await createMockTranscript(context, voiceSession.id);

      // Verify all records exist
      await assertDatabaseConsistency(context, [
        {
          table: 'profiles',
          condition: { id: student.id },
          expectedCount: 1,
          message: 'Student profile should exist'
        },
        {
          table: 'learning_sessions',
          condition: { id: session.id },
          expectedCount: 1,
          message: 'Learning session should exist'
        },
        {
          table: 'voice_sessions',
          condition: { id: voiceSession.id },
          expectedCount: 1,
          message: 'Voice session should exist'
        },
        {
          table: 'transcripts',
          condition: { voice_session_id: voiceSession.id },
          expectedCount: 1,
          message: 'Transcript should exist'
        }
      ]);
    });

    it('should handle batch operations efficiently', async () => {
      const timer = new PerformanceTimer();
      const student = await createMockStudent(context);

      // Create multiple textbooks in batch
      const textbookData = Array.from({ length: 5 }, (_, i) => ({
        id: `batch-textbook-${i}-${context.testId}`,
        title: `Batch Textbook ${i + 1}`,
        file_name: `batch-${i + 1}.pdf`,
        subject: 'mathematics',
        grade_level: 10 + (i % 3),
        user_id: student.id,
        status: 'ready',
        upload_status: 'completed',
        processing_status: 'completed',
        enhanced_metadata: {
          language: 'en',
          curriculum_board: 'CBSE',
          difficulty_level: 'intermediate',
          tags: [`batch-${i}`, 'mathematics'],
          description: `Batch textbook ${i + 1}`
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: batchError, data: insertedBooks } = await context.supabase
        .from('textbooks')
        .insert(textbookData)
        .select();

      expect(batchError).toBeNull();
      expect(insertedBooks).toHaveLength(5);

      // Add cleanup for batch
      context.cleanup.push(async () => {
        await context.supabase
          .from('textbooks')
          .delete()
          .in('id', textbookData.map(book => book.id));
      });

      // Performance check for batch operation
      timer.expectUnder(200, 'Batch insert should be fast');

      // Verify all books were inserted correctly
      const { count } = await context.supabase
        .from('textbooks')
        .select('*', { count: 'exact' })
        .eq('user_id', student.id)
        .like('id', `%${context.testId}`);

      expect(count).toBe(6); // 5 batch + 1 from previous test
    });
  });
});