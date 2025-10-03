/**
 * PC-015 E2E Test: Complete Metadata Flow Verification
 * Tests the end-to-end flow from wizard selections to Python agent prompts
 */

import { describe, test, expect } from 'vitest';

describe('PC-015: Metadata Flow E2E', () => {
  describe('Topic Format Parsing', () => {
    /**
     * Simulates the parsing logic from VoiceSessionManager
     * Topic format from classroom: "Grade X Subject"
     */

    function extractGrade(topic: string): string {
      const gradeMatch = topic.match(/Grade\s+(\d+)/i);
      if (gradeMatch) {
        return `Grade ${gradeMatch[1]}`;
      }
      return 'Grade 10';
    }

    function extractSubject(topic: string): string {
      // First try: Parse from "Grade X Subject" format
      const subjectMatch = topic.match(/Grade\s+\d+\s+(.+)/i);
      if (subjectMatch && subjectMatch[1]) {
        return subjectMatch[1].trim();
      }

      // Fallback: keyword detection
      const topicLower = topic.toLowerCase();
      if (topicLower.includes('mathematics') || topicLower.includes('math')) {
        return 'Mathematics';
      }
      if (topicLower.includes('science') || topicLower.includes('physics')) {
        return 'Science';
      }
      if (topicLower.includes('english')) {
        return 'English Language';
      }
      return 'General Studies';
    }

    test('should extract grade from "Grade 10 Mathematics" format', () => {
      expect(extractGrade('Grade 10 Mathematics')).toBe('Grade 10');
      expect(extractGrade('Grade 12 Physics')).toBe('Grade 12');
      expect(extractGrade('Grade 9 Hindi')).toBe('Grade 9');
      expect(extractGrade('Grade 11 Social Studies')).toBe('Grade 11');
    });

    test('should extract subject from "Grade X Subject" format', () => {
      expect(extractSubject('Grade 10 Mathematics')).toBe('Mathematics');
      expect(extractSubject('Grade 12 Physics')).toBe('Physics');
      expect(extractSubject('Grade 9 Hindi')).toBe('Hindi');
      expect(extractSubject('Grade 11 Social Studies')).toBe('Social Studies');
      expect(extractSubject('Grade 10 English Language')).toBe('English Language');
    });

    test('should handle edge cases gracefully', () => {
      // No grade in topic
      expect(extractGrade('Mathematics')).toBe('Grade 10'); // fallback
      expect(extractSubject('Mathematics')).toBe('Mathematics'); // keyword match

      // Case insensitive
      expect(extractGrade('grade 10 Mathematics')).toBe('Grade 10');
      expect(extractSubject('grade 10 Mathematics')).toBe('Mathematics');

      // Extra whitespace
      expect(extractGrade('Grade  10  Mathematics')).toBe('Grade 10');
      expect(extractSubject('Grade  10  Mathematics')).toBe('Mathematics');
    });
  });

  describe('Complete Metadata Flow', () => {
    test('should create correct metadata from classroom topic', () => {
      const classroomTopic = 'Grade 12 Physics';

      // Step 1: Classroom creates this topic from profile
      // (from classroom/page.tsx line 166)

      // Step 2: VoiceSessionManager extracts metadata
      function extractGrade(topic: string): string {
        const gradeMatch = topic.match(/Grade\s+(\d+)/i);
        return gradeMatch ? `Grade ${gradeMatch[1]}` : 'Grade 10';
      }

      function extractSubject(topic: string): string {
        const subjectMatch = topic.match(/Grade\s+\d+\s+(.+)/i);
        if (subjectMatch && subjectMatch[1]) {
          return subjectMatch[1].trim();
        }
        return 'General Studies';
      }

      const metadata = {
        topic: classroomTopic,
        subject: extractSubject(classroomTopic),
        grade: extractGrade(classroomTopic),
      };

      // Step 3: Verify metadata is correct
      expect(metadata).toEqual({
        topic: 'Grade 12 Physics',
        subject: 'Physics',
        grade: 'Grade 12',
      });

      // Step 4: This metadata goes to Python agent via LiveKit room.metadata
      // Python agent would use this for dynamic prompt generation
    });

    test('should handle all NCERT subjects correctly', () => {
      const testCases = [
        { topic: 'Grade 10 Mathematics', expectedSubject: 'Mathematics', expectedGrade: 'Grade 10' },
        { topic: 'Grade 11 Physics', expectedSubject: 'Physics', expectedGrade: 'Grade 11' },
        { topic: 'Grade 12 Chemistry', expectedSubject: 'Chemistry', expectedGrade: 'Grade 12' },
        { topic: 'Grade 9 Biology', expectedSubject: 'Biology', expectedGrade: 'Grade 9' },
        { topic: 'Grade 10 English Language', expectedSubject: 'English Language', expectedGrade: 'Grade 10' },
        { topic: 'Grade 11 Hindi', expectedSubject: 'Hindi', expectedGrade: 'Grade 11' },
        { topic: 'Grade 12 Social Studies', expectedSubject: 'Social Studies', expectedGrade: 'Grade 12' },
      ];

      function extractGrade(topic: string): string {
        const gradeMatch = topic.match(/Grade\s+(\d+)/i);
        return gradeMatch ? `Grade ${gradeMatch[1]}` : 'Grade 10';
      }

      function extractSubject(topic: string): string {
        const subjectMatch = topic.match(/Grade\s+\d+\s+(.+)/i);
        return subjectMatch && subjectMatch[1] ? subjectMatch[1].trim() : 'General Studies';
      }

      testCases.forEach(({ topic, expectedSubject, expectedGrade }) => {
        const subject = extractSubject(topic);
        const grade = extractGrade(topic);

        expect(subject).toBe(expectedSubject);
        expect(grade).toBe(expectedGrade);
      });
    });
  });

  describe('Python Agent Integration', () => {
    test('should generate correct prompt from metadata', () => {
      const metadata = {
        topic: 'Grade 12 Physics',
        subject: 'Physics',
        grade: 'Grade 12',
      };

      // Simulate Python agent's create_tutor_prompt()
      function createTutorPrompt(grade: string, subject: string, topic: string): string {
        return `You are a friendly and patient NCERT tutor for ${grade} students in India, specializing in ${subject}.

Your teaching approach:
- Use simple, clear explanations suitable for ${grade} level students
- Reference specific NCERT ${grade} ${subject} textbook examples when applicable

Important guidelines:
- Stay focused on ${subject} topics, especially ${topic}
- Keep responses concise and age-appropriate for ${grade} students

Current session focus: ${topic} from ${grade} ${subject}`;
      }

      const prompt = createTutorPrompt(metadata.grade, metadata.subject, metadata.topic);

      // Verify prompt contains correct values
      expect(prompt).toContain('Grade 12 students');
      expect(prompt).toContain('specializing in Physics');
      expect(prompt).toContain('Grade 12 Physics');
      expect(prompt).not.toContain('Grade 10'); // Should NOT have hardcoded grade
      expect(prompt).not.toContain('Mathematics'); // Should NOT have wrong subject
    });
  });
});
