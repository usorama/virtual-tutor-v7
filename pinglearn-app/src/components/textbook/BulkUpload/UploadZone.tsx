/**
 * FS-00-AC: BulkUpload System - UploadZone Component
 *
 * Drag-and-drop file upload zone with visual feedback and validation
 */

'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';

// ==================================================
// TYPES
// ==================================================

export interface UploadZoneProps {
  /** Callback when files are selected/dropped */
  onFilesSelected: (files: File[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Maximum file size in MB */
  maxFileSize?: number;
  /** Whether upload is currently disabled */
  disabled?: boolean;
  /** Custom className for styling */
  className?: string;
}

export interface UploadZoneState {
  isDragOver: boolean;
}

// ==================================================
// COMPONENT
// ==================================================

export function UploadZone({
  onFilesSelected,
  maxFiles = 50,
  maxFileSize = 100,
  disabled = false,
  className = ''
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  // ==================================================
  // DRAG AND DROP HANDLERS
  // ==================================================

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onFilesSelected(fileArray);
    }
  }, [disabled, onFilesSelected]);

  // ==================================================
  // FILE INPUT HANDLER
  // ==================================================

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onFilesSelected(fileArray);
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <Card
      className={`transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isDragOver
          ? 'border-blue-500 bg-blue-50 border-2'
          : 'border-dashed border-2 border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Upload
          className={`w-12 h-12 mb-4 ${
            isDragOver ? 'text-blue-600' : 'text-gray-400'
          }`}
        />

        <h3 className="text-lg font-semibold mb-2">
          {isDragOver ? 'Drop files here' : 'Drag and drop PDF files here'}
        </h3>

        <p className="text-gray-600 mb-4 text-center text-sm">
          or click to browse • PDF files only • Max {maxFiles} files • Max {maxFileSize}MB each
        </p>

        <Button disabled={disabled} type="button">
          Browse Files
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload PDF files"
        />
      </CardContent>
    </Card>
  );
}

// Fix: Import React for useState
import React from 'react';
