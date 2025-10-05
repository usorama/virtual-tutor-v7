/**
 * FS-00-AC: HierarchicalDashboard - SearchAndFilter Component
 *
 * Search and filter controls for content discovery
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';

import type { ContentSearchFilters, DifficultyLevel, BookStatus } from '@/types/textbook-hierarchy';

// ==================================================
// TYPES
// ==================================================

export interface SearchAndFilterProps {
  /** Current filter state */
  filters: ContentSearchFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: ContentSearchFilters) => void;
  /** Available filter options */
  options?: {
    grades?: number[];
    subjects?: string[];
    publishers?: string[];
    curriculumStandards?: string[];
  };
  /** Show/hide specific filter controls */
  showControls?: {
    grade?: boolean;
    subject?: boolean;
    publisher?: boolean;
    curriculumStandard?: boolean;
    difficultyLevel?: boolean;
    status?: boolean;
  };
  /** Custom className */
  className?: string;
}

// ==================================================
// COMPONENT
// ==================================================

export function SearchAndFilter({
  filters,
  onFiltersChange,
  options = {},
  showControls = {
    grade: true,
    subject: true,
    publisher: true,
    curriculumStandard: true,
    difficultyLevel: false,
    status: false
  },
  className = ''
}: SearchAndFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ==================================================
  // HANDLERS
  // ==================================================

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleFilterChange = (key: keyof ContentSearchFilters, value: string | number | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof ContentSearchFilters) => {
    onFiltersChange({ ...filters, [key]: undefined });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: ''
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.grade) count++;
    if (filters.subject) count++;
    if (filters.publisher) count++;
    if (filters.curriculumStandard) count++;
    if (filters.difficultyLevel) count++;
    if (filters.status) count++;
    return count;
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderActiveFilterBadges = () => {
    const badges: React.ReactNode[] = [];

    if (filters.grade) {
      badges.push(
        <Badge key="grade" variant="secondary" className="gap-1">
          Grade {filters.grade}
          <X
            className="w-3 h-3 cursor-pointer hover:text-red-600"
            onClick={() => clearFilter('grade')}
          />
        </Badge>
      );
    }

    if (filters.subject) {
      badges.push(
        <Badge key="subject" variant="secondary" className="gap-1">
          {filters.subject}
          <X
            className="w-3 h-3 cursor-pointer hover:text-red-600"
            onClick={() => clearFilter('subject')}
          />
        </Badge>
      );
    }

    if (filters.publisher) {
      badges.push(
        <Badge key="publisher" variant="secondary" className="gap-1">
          {filters.publisher}
          <X
            className="w-3 h-3 cursor-pointer hover:text-red-600"
            onClick={() => clearFilter('publisher')}
          />
        </Badge>
      );
    }

    if (filters.curriculumStandard) {
      badges.push(
        <Badge key="curriculum" variant="secondary" className="gap-1">
          {filters.curriculumStandard}
          <X
            className="w-3 h-3 cursor-pointer hover:text-red-600"
            onClick={() => clearFilter('curriculumStandard')}
          />
        </Badge>
      );
    }

    if (filters.difficultyLevel) {
      badges.push(
        <Badge key="difficulty" variant="secondary" className="gap-1">
          {filters.difficultyLevel}
          <X
            className="w-3 h-3 cursor-pointer hover:text-red-600"
            onClick={() => clearFilter('difficultyLevel')}
          />
        </Badge>
      );
    }

    if (filters.status) {
      badges.push(
        <Badge key="status" variant="secondary" className="gap-1">
          {filters.status}
          <X
            className="w-3 h-3 cursor-pointer hover:text-red-600"
            onClick={() => clearFilter('status')}
          />
        </Badge>
      );
    }

    return badges;
  };

  // ==================================================
  // RENDER
  // ==================================================

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar and Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search textbooks, chapters, topics..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {renderActiveFilterBadges()}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-6"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
          {showControls.grade && (
            <div>
              <label className="text-sm font-medium mb-2 block">Grade</label>
              <Select
                value={filters.grade?.toString()}
                onValueChange={(value) => handleFilterChange('grade', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {(options.grades || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showControls.subject && (
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select
                value={filters.subject}
                onValueChange={(value) => handleFilterChange('subject', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {(options.subjects || ['Mathematics', 'Science', 'English', 'Social Studies']).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showControls.publisher && (
            <div>
              <label className="text-sm font-medium mb-2 block">Publisher</label>
              <Select
                value={filters.publisher}
                onValueChange={(value) => handleFilterChange('publisher', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select publisher" />
                </SelectTrigger>
                <SelectContent>
                  {(options.publishers || ['NCERT', 'Oxford', 'Pearson', 'Macmillan']).map((publisher) => (
                    <SelectItem key={publisher} value={publisher}>
                      {publisher}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showControls.curriculumStandard && (
            <div>
              <label className="text-sm font-medium mb-2 block">Curriculum</label>
              <Select
                value={filters.curriculumStandard}
                onValueChange={(value) => handleFilterChange('curriculumStandard', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent>
                  {(options.curriculumStandards || ['NCERT', 'CBSE', 'ICSE', 'State Board']).map((standard) => (
                    <SelectItem key={standard} value={standard}>
                      {standard}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showControls.difficultyLevel && (
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select
                value={filters.difficultyLevel}
                onValueChange={(value) => handleFilterChange('difficultyLevel', value as DifficultyLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showControls.status && (
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value as BookStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
