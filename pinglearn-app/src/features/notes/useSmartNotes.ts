import { useState, useEffect, useCallback } from 'react';
import { NotesGenerationService, type SmartNotes, type Note } from './NotesGenerationService';

/**
 * Custom hook for Smart Learning Notes functionality
 * Manages real-time notes generation and updates
 */
export function useSmartNotes(sessionId?: string, voiceSessionId?: string) {
  const [notes, setNotes] = useState<SmartNotes>({
    keyConcepts: [],
    examples: [],
    summary: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0',
      totalConcepts: 0,
      totalExamples: 0,
      wordCount: 0
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize notes generation when session starts
  useEffect(() => {
    if (!sessionId) return;

    let unsubscribe: (() => void) | undefined;

    const initializeNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize the service for this session
        await NotesGenerationService.initializeForSession(sessionId, voiceSessionId);

        // Subscribe to real-time updates
        unsubscribe = NotesGenerationService.subscribe((updatedNotes) => {
          setNotes(updatedNotes);
        });

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize notes');
        setIsLoading(false);
      }
    };

    initializeNotes();

    // Cleanup on unmount or session change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId, voiceSessionId]);

  // Cleanup service when component unmounts
  useEffect(() => {
    return () => {
      NotesGenerationService.cleanup();
    };
  }, []);

  // Get current notes (for external access)
  const getCurrentNotes = useCallback(() => {
    return NotesGenerationService.getCurrentNotes();
  }, []);

  // Derived values for easier component usage
  const isLive = Boolean(sessionId);
  const hasNotes = notes.keyConcepts.length > 0 || notes.examples.length > 0 || notes.summary.length > 0;
  const wordCount = notes.metadata.wordCount;
  const conceptCount = notes.metadata.totalConcepts;

  return {
    // Notes data
    notes,
    keyConcepts: notes.keyConcepts,
    examples: notes.examples,
    summary: notes.summary,

    // Metadata
    metadata: notes.metadata,

    // Status
    isLoading,
    error,
    isLive,
    hasNotes,
    wordCount,
    conceptCount,

    // Actions
    getCurrentNotes
  };
}