/**
 * Student Personalization System
 * Handles learning preferences, progress tracking, and adaptive tutoring
 */

import { createClient } from '@/lib/supabase/server';
import { CurriculumData } from '@/types/curriculum';

export interface StudentProfile {
  id: string;
  grade: number;
  current_subject: string;
  current_chapter?: string;
  learning_pace: 'slow' | 'medium' | 'fast';
  preferred_explanation_style: 'visual' | 'verbal' | 'practical';
  topics_mastered: string[];
  weak_areas: string[];
  total_session_minutes: number;
  last_session_at?: string;
  voice_preferences?: VoicePreferences;
}

export interface VoicePreferences {
  speech_rate: number; // 0.5 to 2.0
  language: string;
  accent?: string;
  formality_level: 'casual' | 'formal' | 'friendly';
  encouragement_frequency: 'low' | 'medium' | 'high';
}

export interface LearningProgress {
  topicId: string;
  mastery_level: number; // 0-100
  attempts: number;
  last_attempted: string;
  time_spent_minutes: number;
  concepts_understood: string[];
  concepts_struggling: string[];
}

export interface AdaptiveSettings {
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  explanation_depth: 'basic' | 'detailed' | 'comprehensive';
  example_frequency: 'minimal' | 'moderate' | 'extensive';
  practice_problem_count: number;
  hint_availability: boolean;
  step_by_step_guidance: boolean;
}

export class PersonalizationEngine {
  /**
   * Get student's complete learning profile
   */
  static async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    const supabase = await createClient();
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error || !profile) {
        console.error('Error fetching student profile:', error);
        return null;
      }
      
      // Parse voice preferences if stored as JSON
      const voicePreferences = profile.preferred_voice_settings 
        ? JSON.parse(profile.preferred_voice_settings)
        : this.getDefaultVoicePreferences();
      
      return {
        ...profile,
        voice_preferences: voicePreferences,
        learning_pace: profile.learning_pace || 'medium',
        preferred_explanation_style: profile.preferred_explanation_style || 'verbal',
        topics_mastered: profile.topics_mastered || [],
        weak_areas: profile.weak_areas || []
      };
    } catch (error) {
      console.error('Error in getStudentProfile:', error);
      return null;
    }
  }
  
  /**
   * Update student preferences
   */
  static async updatePreferences(
    studentId: string,
    preferences: Partial<StudentProfile>
  ): Promise<boolean> {
    const supabase = await createClient();
    
    try {
      const updateData: Record<string, unknown> = { ...preferences };
      
      // Convert voice preferences to JSON if provided
      if (preferences.voice_preferences) {
        updateData.preferred_voice_settings = JSON.stringify(preferences.voice_preferences);
        delete updateData.voice_preferences;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', studentId);
      
      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }
  
  /**
   * Get adaptive settings based on student's progress
   */
  static async getAdaptiveSettings(studentId: string): Promise<AdaptiveSettings> {
    const profile = await this.getStudentProfile(studentId);
    
    if (!profile) {
      return this.getDefaultSettings();
    }
    
    // Calculate difficulty based on mastery
    const masteryRate = profile.topics_mastered.length / (profile.topics_mastered.length + profile.weak_areas.length || 1);
    
    let difficulty_level: AdaptiveSettings['difficulty_level'] = 'beginner';
    if (masteryRate > 0.7) {
      difficulty_level = 'advanced';
    } else if (masteryRate > 0.4) {
      difficulty_level = 'intermediate';
    }
    
    // Adjust based on learning pace
    const settings: AdaptiveSettings = {
      difficulty_level,
      explanation_depth: profile.learning_pace === 'slow' ? 'comprehensive' : 
                        profile.learning_pace === 'fast' ? 'basic' : 'detailed',
      example_frequency: profile.preferred_explanation_style === 'practical' ? 'extensive' :
                        profile.preferred_explanation_style === 'visual' ? 'moderate' : 'minimal',
      practice_problem_count: profile.learning_pace === 'slow' ? 5 : 
                             profile.learning_pace === 'fast' ? 2 : 3,
      hint_availability: profile.learning_pace !== 'fast',
      step_by_step_guidance: profile.learning_pace === 'slow'
    };
    
    return settings;
  }
  
  /**
   * Track learning progress for a topic
   */
  static async trackProgress(
    studentId: string,
    topicId: string,
    understood: boolean,
    timeSpent: number,
    concepts?: string[]
  ): Promise<void> {
    const supabase = await createClient();
    
    try {
      // Check if progress record exists
      const { data: existing } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('topic_id', topicId)
        .single();
      
      if (existing) {
        // Update existing progress
        const newMastery = understood 
          ? Math.min(100, existing.mastery_level + 10)
          : Math.max(0, existing.mastery_level - 5);
        
        await supabase
          .from('learning_progress')
          .update({
            mastery_level: newMastery,
            attempts: existing.attempts + 1,
            time_spent_minutes: existing.time_spent_minutes + timeSpent,
            last_attempted: new Date().toISOString(),
            concepts_understood: understood && concepts 
              ? [...(existing.concepts_understood || []), ...concepts]
              : existing.concepts_understood,
            concepts_struggling: !understood && concepts
              ? [...(existing.concepts_struggling || []), ...concepts]
              : existing.concepts_struggling
          })
          .eq('id', existing.id);
      } else {
        // Create new progress record
        await supabase
          .from('learning_progress')
          .insert({
            student_id: studentId,
            topic_id: topicId,
            mastery_level: understood ? 10 : 0,
            attempts: 1,
            time_spent_minutes: timeSpent,
            last_attempted: new Date().toISOString(),
            concepts_understood: understood ? concepts : [],
            concepts_struggling: !understood ? concepts : []
          });
      }
      
      // Update student's mastered topics or weak areas
      await this.updateMasteryStatus(studentId, topicId, understood);
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  }
  
  /**
   * Get personalized greeting based on time and progress
   */
  static async getPersonalizedGreeting(studentId: string): Promise<string> {
    const profile = await this.getStudentProfile(studentId);
    
    if (!profile) {
      return "Hello! I'm your NCERT Mathematics tutor. Ready to learn together?";
    }
    
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : 
                        hour < 17 ? "Good afternoon" : "Good evening";
    
    // Check if returning student
    if (profile.last_session_at) {
      const lastSession = new Date(profile.last_session_at);
      const daysSince = Math.floor((Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 0) {
        return `Welcome back! Ready to continue where we left off?`;
      } else if (daysSince === 1) {
        return `${timeGreeting}! Great to see you again. Let's pick up from yesterday.`;
      } else if (daysSince < 7) {
        return `${timeGreeting}! It's been ${daysSince} days. Ready to continue learning?`;
      } else {
        return `${timeGreeting}! Welcome back after your break. Let's refresh your memory and continue.`;
      }
    }
    
    return `${timeGreeting}! I'm excited to help you learn Mathematics today. What would you like to explore?`;
  }
  
  /**
   * Generate personalized encouragement based on progress
   */
  static getEncouragement(
    masteryLevel: number,
    attempts: number,
    improved: boolean
  ): string {
    if (improved) {
      if (masteryLevel > 80) {
        return "Excellent work! You're mastering this concept beautifully!";
      } else if (masteryLevel > 50) {
        return "Great progress! You're really getting the hang of this.";
      } else {
        return "Good effort! Every step forward is progress.";
      }
    } else {
      if (attempts > 3) {
        return "This is challenging, but I know you can do it. Let's try a different approach.";
      } else {
        return "Don't worry, learning takes time. Let me explain it differently.";
      }
    }
  }
  
  /**
   * Determine if student needs a break
   */
  static shouldSuggestBreak(sessionDuration: number, recentErrors: number): boolean {
    // Suggest break after 25 minutes or if making many errors
    return sessionDuration > 25 || (sessionDuration > 15 && recentErrors > 3);
  }
  
  /**
   * Get next recommended topic based on curriculum and progress
   */
  static async getNextTopic(studentId: string): Promise<CurriculumData | null> {
    const supabase = await createClient();
    
    try {
      const profile = await this.getStudentProfile(studentId);
      if (!profile) return null;
      
      // Get curriculum topics for student's grade
      const { data: curriculum } = await supabase
        .from('curriculum')
        .select('*')
        .eq('grade', profile.grade)
        .eq('subject', 'Mathematics')
        .order('sequence_order', { ascending: true });
      
      if (!curriculum || curriculum.length === 0) return null;
      
      // Find first topic not mastered
      for (const topic of curriculum) {
        if (!profile.topics_mastered.includes(topic.id)) {
          // Check if prerequisites are met
          if (await this.checkPrerequisites(studentId, topic.prerequisites)) {
            return topic;
          }
        }
      }
      
      // All topics mastered or prerequisites not met
      return curriculum[0]; // Return to basics for review
    } catch (error) {
      console.error('Error getting next topic:', error);
      return null;
    }
  }
  
  /**
   * Check if prerequisites for a topic are met
   */
  private static async checkPrerequisites(
    studentId: string,
    prerequisites?: string[]
  ): Promise<boolean> {
    if (!prerequisites || prerequisites.length === 0) {
      return true;
    }
    
    const profile = await this.getStudentProfile(studentId);
    if (!profile) return false;
    
    // Check if all prerequisites are in mastered topics
    return prerequisites.every(prereq => 
      profile.topics_mastered.includes(prereq)
    );
  }
  
  /**
   * Update mastery status based on performance
   */
  private static async updateMasteryStatus(
    studentId: string,
    topicId: string,
    understood: boolean
  ): Promise<void> {
    const supabase = await createClient();
    
    try {
      // Get current progress
      const { data: progress } = await supabase
        .from('learning_progress')
        .select('mastery_level')
        .eq('student_id', studentId)
        .eq('topic_id', topicId)
        .single();
      
      if (!progress) return;
      
      const profile = await this.getStudentProfile(studentId);
      if (!profile) return;
      
      // Topic is mastered if mastery level > 80
      if (progress.mastery_level > 80) {
        if (!profile.topics_mastered.includes(topicId)) {
          await supabase
            .from('profiles')
            .update({
              topics_mastered: [...profile.topics_mastered, topicId],
              weak_areas: profile.weak_areas.filter(id => id !== topicId)
            })
            .eq('id', studentId);
        }
      }
      // Topic is weak if mastery level < 30 and multiple attempts
      else if (progress.mastery_level < 30) {
        if (!profile.weak_areas.includes(topicId)) {
          await supabase
            .from('profiles')
            .update({
              weak_areas: [...profile.weak_areas, topicId],
              topics_mastered: profile.topics_mastered.filter(id => id !== topicId)
            })
            .eq('id', studentId);
        }
      }
    } catch (error) {
      console.error('Error updating mastery status:', error);
    }
  }
  
  /**
   * Get default voice preferences
   */
  private static getDefaultVoicePreferences(): VoicePreferences {
    return {
      speech_rate: 1.0,
      language: 'en',
      formality_level: 'friendly',
      encouragement_frequency: 'medium'
    };
  }
  
  /**
   * Get default adaptive settings
   */
  private static getDefaultSettings(): AdaptiveSettings {
    return {
      difficulty_level: 'beginner',
      explanation_depth: 'detailed',
      example_frequency: 'moderate',
      practice_problem_count: 3,
      hint_availability: true,
      step_by_step_guidance: true
    };
  }
}