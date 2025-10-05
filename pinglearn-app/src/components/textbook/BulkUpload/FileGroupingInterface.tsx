/**
 * FS-00-AC: BulkUpload System - FileGroupingInterface Component
 *
 * Displays auto-detected file groupings with confidence scores and manual override capabilities
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen,
  FileText,
  Edit3,
  Trash2,
  Eye,
  X,
  Plus
} from 'lucide-react';

import type { FileGroup, UploadedFile } from '@/types/textbook-hierarchy';

// ==================================================
// TYPES
// ==================================================

export interface FileGroupingInterfaceProps {
  /** Array of detected file groups */
  fileGroups: FileGroup[];
  /** Callback when group name is updated */
  onGroupNameUpdate: (groupId: string, newName: string) => void;
  /** Callback when file is removed from group */
  onFileRemoveFromGroup: (groupId: string, fileId: string) => void;
  /** Callback when group is deleted */
  onGroupDelete: (groupId: string) => void;
  /** Callback when new group is created */
  onNewGroupCreate: () => void;
  /** Callback when group is clicked for preview */
  onGroupPreview?: (groupId: string) => void;
  /** Callback when group is clicked for editing */
  onGroupEdit?: (groupId: string) => void;
  /** Custom className */
  className?: string;
}

// ==================================================
// COMPONENT
// ==================================================

export function FileGroupingInterface({
  fileGroups,
  onGroupNameUpdate,
  onFileRemoveFromGroup,
  onGroupDelete,
  onNewGroupCreate,
  onGroupPreview,
  onGroupEdit,
  className = ''
}: FileGroupingInterfaceProps) {
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // ==================================================
  // HANDLERS
  // ==================================================

  const handleGroupNameChange = (groupId: string, newName: string) => {
    onGroupNameUpdate(groupId, newName);
  };

  const handleGroupNameBlur = () => {
    setEditingGroupId(null);
  };

  const handleGroupNameClick = (groupId: string) => {
    setEditingGroupId(groupId);
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderConfidenceBadge = (confidence: number, isUserCreated: boolean) => {
    if (isUserCreated) {
      return (
        <Badge variant="outline" className="text-xs">
          Manual
        </Badge>
      );
    }

    const confidencePercent = Math.round(confidence * 100);
    const variant = confidencePercent >= 80 ? 'default' : 'secondary';

    return (
      <Badge variant={variant} className="text-xs">
        {confidencePercent}% confidence
      </Badge>
    );
  };

  const renderGroupCard = (group: FileGroup) => (
    <div key={group.id} className="border rounded-lg p-4 space-y-3 bg-white">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            {editingGroupId === group.id ? (
              <Input
                value={group.name}
                onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                onBlur={handleGroupNameBlur}
                autoFocus
                className="font-medium h-8"
              />
            ) : (
              <h4
                className="font-medium truncate cursor-text hover:text-blue-600"
                onClick={() => handleGroupNameClick(group.id)}
                title="Click to edit group name"
              >
                {group.name}
              </h4>
            )}

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
              </Badge>
              {renderConfidenceBadge(group.confidence, group.isUserCreated)}
            </div>
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onGroupPreview && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onGroupPreview(group.id)}
              title="Preview group"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}

          {onGroupEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onGroupEdit(group.id)}
              title="Edit group"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onGroupDelete(group.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Group Files List */}
      <div className="space-y-2">
        {group.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
            <span className="flex-1 truncate" title={file.name}>
              {file.name}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onFileRemoveFromGroup(group.id, file.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              title="Remove from group"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8 text-gray-500">
      <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium">No groups detected</p>
      <p className="text-sm mt-1">Upload related files to see automatic grouping</p>
    </div>
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Auto-detected Groups ({fileGroups.length})
          </CardTitle>
          <CardDescription>
            Related files grouped together as textbook collections
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNewGroupCreate}
          disabled={fileGroups.length === 0}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Group
        </Button>
      </CardHeader>

      <CardContent>
        {fileGroups.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-4">
            {fileGroups.map(renderGroupCard)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
