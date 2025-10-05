/**
 * FS-00-AC: HierarchicalDashboard - QuickEditModal Component
 *
 * Modal dialog for quick inline editing of series, book, or chapter metadata
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

import type { BookSeries, Book, BookChapter, DifficultyLevel } from '@/types/textbook-hierarchy';

// ==================================================
// TYPES
// ==================================================

export type EditableEntity = BookSeries | Book | BookChapter;
export type EntityType = 'series' | 'book' | 'chapter';

export interface QuickEditModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Type of entity being edited */
  entityType: EntityType;
  /** The entity being edited */
  entity: EditableEntity | null;
  /** Callback when save is clicked */
  onSave: (updatedEntity: EditableEntity) => Promise<void>;
  /** Whether save operation is in progress */
  isSaving?: boolean;
}

// ==================================================
// COMPONENT
// ==================================================

export function QuickEditModal({
  isOpen,
  onClose,
  entityType,
  entity,
  onSave,
  isSaving = false
}: QuickEditModalProps) {
  const [editedEntity, setEditedEntity] = useState<EditableEntity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entity) {
      setEditedEntity({ ...entity });
      setError(null);
    }
  }, [entity]);

  // ==================================================
  // HANDLERS
  // ==================================================

  const handleFieldChange = (field: string, value: string | number | string[]) => {
    if (editedEntity) {
      setEditedEntity({ ...editedEntity, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!editedEntity) return;

    try {
      setError(null);
      await onSave(editedEntity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditedEntity(entity ? { ...entity } : null);
    setError(null);
    onClose();
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderSeriesFields = (series: BookSeries) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="series_name">Series Name *</Label>
        <Input
          id="series_name"
          value={series.series_name}
          onChange={(e) => handleFieldChange('series_name', e.target.value)}
          placeholder="e.g., NCERT Mathematics"
        />
      </div>

      <div>
        <Label htmlFor="publisher">Publisher *</Label>
        <Input
          id="publisher"
          value={series.publisher}
          onChange={(e) => handleFieldChange('publisher', e.target.value)}
          placeholder="e.g., NCERT"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grade">Grade *</Label>
          <Select
            value={series.grade.toString()}
            onValueChange={(value) => handleFieldChange('grade', parseInt(value))}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                <SelectItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={series.subject}
            onChange={(e) => handleFieldChange('subject', e.target.value)}
            placeholder="e.g., Mathematics"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="curriculum_standard">Curriculum Standard</Label>
        <Input
          id="curriculum_standard"
          value={series.curriculum_standard || ''}
          onChange={(e) => handleFieldChange('curriculum_standard', e.target.value)}
          placeholder="e.g., NCERT, CBSE"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={series.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Brief description of the series"
          rows={3}
        />
      </div>
    </div>
  );

  const renderBookFields = (book: Book) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="volume_number">Volume Number *</Label>
          <Input
            id="volume_number"
            type="number"
            value={book.volume_number}
            onChange={(e) => handleFieldChange('volume_number', parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="edition">Edition</Label>
          <Input
            id="edition"
            value={book.edition || ''}
            onChange={(e) => handleFieldChange('edition', e.target.value)}
            placeholder="e.g., 2024"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="volume_title">Volume Title</Label>
        <Input
          id="volume_title"
          value={book.volume_title || ''}
          onChange={(e) => handleFieldChange('volume_title', e.target.value)}
          placeholder="e.g., Part 1, Volume A"
        />
      </div>

      <div>
        <Label htmlFor="isbn">ISBN</Label>
        <Input
          id="isbn"
          value={book.isbn || ''}
          onChange={(e) => handleFieldChange('isbn', e.target.value)}
          placeholder="e.g., 978-3-16-148410-0"
        />
      </div>

      <div>
        <Label htmlFor="publication_year">Publication Year</Label>
        <Input
          id="publication_year"
          type="number"
          value={book.publication_year || ''}
          onChange={(e) => handleFieldChange('publication_year', parseInt(e.target.value))}
          placeholder="e.g., 2024"
          min="1900"
          max={new Date().getFullYear()}
        />
      </div>

      <div>
        <Label>Authors</Label>
        <div className="flex items-center gap-2">
          <Input
            value={book.authors.join(', ')}
            onChange={(e) => handleFieldChange('authors', e.target.value.split(',').map(a => a.trim()))}
            placeholder="Comma-separated author names"
          />
        </div>
      </div>
    </div>
  );

  const renderChapterFields = (chapter: BookChapter) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="chapter_number">Chapter Number *</Label>
          <Input
            id="chapter_number"
            type="number"
            value={chapter.chapter_number}
            onChange={(e) => handleFieldChange('chapter_number', parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="difficulty_level">Difficulty Level</Label>
          <Select
            value={chapter.difficulty_level || ''}
            onValueChange={(value) => handleFieldChange('difficulty_level', value as DifficultyLevel)}
          >
            <SelectTrigger id="difficulty_level">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Chapter Title *</Label>
        <Input
          id="title"
          value={chapter.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder="e.g., Real Numbers"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={chapter.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Brief description of the chapter"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_page">Start Page</Label>
          <Input
            id="start_page"
            type="number"
            value={chapter.start_page || ''}
            onChange={(e) => handleFieldChange('start_page', parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="end_page">End Page</Label>
          <Input
            id="end_page"
            type="number"
            value={chapter.end_page || ''}
            onChange={(e) => handleFieldChange('end_page', parseInt(e.target.value))}
            min="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="estimated_duration_minutes">Estimated Duration (minutes)</Label>
        <Input
          id="estimated_duration_minutes"
          type="number"
          value={chapter.estimated_duration_minutes || ''}
          onChange={(e) => handleFieldChange('estimated_duration_minutes', parseInt(e.target.value))}
          min="1"
          placeholder="e.g., 45"
        />
      </div>
    </div>
  );

  const getDialogTitle = () => {
    switch (entityType) {
      case 'series':
        return 'Edit Book Series';
      case 'book':
        return 'Edit Book';
      case 'chapter':
        return 'Edit Chapter';
      default:
        return 'Edit';
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  if (!editedEntity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Make changes to the {entityType} metadata. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {entityType === 'series' && renderSeriesFields(editedEntity as BookSeries)}
          {entityType === 'book' && renderBookFields(editedEntity as Book)}
          {entityType === 'chapter' && renderChapterFields(editedEntity as BookChapter)}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
