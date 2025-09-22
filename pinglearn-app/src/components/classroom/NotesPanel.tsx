'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea'; // Temporarily use native textarea
import { PenTool, Save, Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Note {
  id: string;
  content: string;
  timestamp: number;
  topic?: string;
}

interface NotesPanelProps {
  sessionId?: string;
  topic: string;
  className?: string;
}

export function NotesPanel({ sessionId, topic, className = '' }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !currentNote.trim()) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentNote, autoSave]);

  // Load saved notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes_${sessionId || 'default'}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error loading saved notes:', error);
      }
    }
  }, [sessionId]);

  // Save notes to localStorage
  const saveNotesToStorage = (notesToSave: Note[]) => {
    localStorage.setItem(`notes_${sessionId || 'default'}`, JSON.stringify(notesToSave));
  };

  const saveCurrentNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: `note_${Date.now()}`,
      content: currentNote.trim(),
      timestamp: Date.now(),
      topic
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
    setCurrentNote('');

    // Scroll to bottom to show new note
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  const clearAllNotes = () => {
    setNotes([]);
    setCurrentNote('');
    localStorage.removeItem(`notes_${sessionId || 'default'}`);
  };

  const exportNotes = () => {
    const notesText = notes.map(note => {
      const date = new Date(note.timestamp).toLocaleString();
      return `[${date}] ${note.topic || topic}\n${note.content}\n\n`;
    }).join('');

    const blob = new Blob([notesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson_notes_${topic.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Notes Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <PenTool className="w-4 h-4" />
                <span className="text-sm font-medium">Lesson Notes</span>
                <Badge variant="outline" className="text-xs">
                  {notes.length}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                {notes.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exportNotes}
                      className="h-8 w-8 p-0"
                      title="Export notes"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotes}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      title="Clear all notes"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Saved Notes */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full">
              <div className="p-4 space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <PenTool className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No notes yet</p>
                    <p className="text-xs mt-1 opacity-75">
                      Start typing below to create your first note
                    </p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 group hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(note.timestamp)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Note Input */}
          <div className="p-4 border-t bg-muted/30">
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                placeholder="Take notes during the lesson..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    saveCurrentNote();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Press Ctrl+Enter to save
                </div>
                <div className="flex items-center space-x-2">
                  {autoSave && currentNote.trim() && (
                    <Badge variant="outline" className="text-xs">
                      Auto-saving...
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={saveCurrentNote}
                    disabled={!currentNote.trim()}
                    className="h-8"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}