/**
 * FS-00-AC: Bulk Upload & Organization Interface
 *
 * This component provides drag-and-drop file upload with intelligent
 * auto-grouping and manual organization capabilities.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Plus,
  Trash2,
  Download,
  Eye,
  Lightbulb
} from 'lucide-react';

import type {
  UploadedFile,
  FileGroup,
  ProcessingStatus,
  BatchProcessingState
} from '@/types/textbook-hierarchy';

import { EnhancedTextbookProcessor } from '@/lib/textbook/enhanced-processor';

// ==================================================
// COMPONENT PROPS
// ==================================================

interface BulkUploadInterfaceProps {
  onFilesProcessed: (groups: FileGroup[]) => void;
  onStartWizard: (groups: FileGroup[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export function BulkUploadInterface({
  onFilesProcessed,
  onStartWizard,
  maxFiles = 50,
  maxFileSize = 100
}: BulkUploadInterfaceProps) {
  // ==================================================
  // STATE
  // ==================================================

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<BatchProcessingState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processor = useRef(new EnhancedTextbookProcessor());

  // ==================================================
  // FILE HANDLING
  // ==================================================

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('pdf')) {
      return `${file.name}: Only PDF files are allowed`;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `${file.name}: File size exceeds ${maxFileSize}MB limit`;
    }

    return null;
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Validate files
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Check total file count
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      validationErrors.push(`Maximum ${maxFiles} files allowed. Current: ${uploadedFiles.length}, Adding: ${validFiles.length}`);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear any previous errors
    setErrors([]);

    // Convert to UploadedFile objects
    const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      processingStatus: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

    // Auto-detect file groups
    await detectFileGroups([...uploadedFiles, ...newUploadedFiles]);
  };

  const detectFileGroups = async (files: UploadedFile[]) => {
    setIsProcessing(true);

    try {
      const detectedGroups = await processor.current.detectBookGroups(files);
      setFileGroups(detectedGroups);
      onFilesProcessed(detectedGroups);
    } catch (error) {
      console.error('Failed to detect file groups:', error);
      setErrors(['Failed to analyze uploaded files. Please try again.']);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================================================
  // DRAG AND DROP HANDLERS
  // ==================================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // ==================================================
  // FILE INPUT HANDLER
  // ==================================================

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset the input so the same files can be selected again
    e.target.value = '';
  };

  // ==================================================
  // FILE MANAGEMENT
  // ==================================================

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

    // Re-detect groups after removing files
    const remainingFiles = uploadedFiles.filter(f => f.id !== fileId);
    if (remainingFiles.length > 0) {
      detectFileGroups(remainingFiles);
    } else {
      setFileGroups([]);
    }
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setFileGroups([]);
    setErrors([]);
  };

  // ==================================================
  // GROUP MANAGEMENT
  // ==================================================

  const updateGroupName = (groupId: string, newName: string) => {
    setFileGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    ));
  };

  const removeFileFromGroup = (groupId: string, fileId: string) => {
    setFileGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const updatedFiles = group.files.filter(f => f.id !== fileId);
        return { ...group, files: updatedFiles };
      }
      return group;
    }).filter(group => group.files.length > 0)); // Remove empty groups
  };

  const createNewGroup = () => {
    const ungroupedFiles = uploadedFiles.filter(file =>
      !fileGroups.some(group => group.files.some(f => f.id === file.id))
    );

    if (ungroupedFiles.length === 0) return;

    const newGroup: FileGroup = {
      id: `manual-group-${Date.now()}`,
      name: 'New Group',
      files: [ungroupedFiles[0]], // Start with first ungrouped file
      confidence: 1.0,
      isUserCreated: true
    };

    setFileGroups(prev => [...prev, newGroup]);
  };

  const deleteGroup = (groupId: string) => {
    setFileGroups(prev => prev.filter(group => group.id !== groupId));
  };

  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderUploadZone = () => (
    <Card
      className={`transition-all duration-200 cursor-pointer ${
        isDragOver
          ? 'border-blue-500 bg-blue-50 border-2'
          : 'border-dashed border-2 border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Upload className={`w-12 h-12 mb-4 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
        <h3 className="text-lg font-semibold mb-2">
          {isDragOver ? 'Drop files here' : 'Drag and drop PDF files here'}
        </h3>
        <p className="text-gray-600 mb-4 text-center">
          or click to browse • PDF files only • Max {maxFiles} files • Max {maxFileSize}MB each
        </p>
        <Button>Browse Files</Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );

  const renderFileList = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Uploaded Files ({uploadedFiles.length})
          </CardTitle>
          <CardDescription>
            Individual PDF files ready for organization
          </CardDescription>
        </div>
        {uploadedFiles.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFiles}>
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload PDF files to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>

                {file.processingStatus === 'processing' && (
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {file.processingStatus === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}

                {file.processingStatus === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderFileGroups = () => (
    <Card>
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
        <Button variant="outline" size="sm" onClick={createNewGroup}>
          <Plus className="w-4 h-4 mr-1" />
          New Group
        </Button>
      </CardHeader>
      <CardContent>
        {fileGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No groups detected</p>
            <p className="text-sm">Upload related files to see automatic grouping</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fileGroups.map((group) => (
              <div
                key={group.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <Input
                        value={group.name}
                        onChange={(e) => updateGroupName(group.id, e.target.value)}
                        className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {group.files.length} files
                        </Badge>
                        {!group.isUserCreated && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {Math.round(group.confidence * 100)}% confidence
                          </Badge>
                        )}
                        {group.isUserCreated && (
                          <Badge variant="outline" className="text-xs">
                            Manual
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGroup(group.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Group Files */}
                <div className="space-y-2">
                  {group.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm"
                    >
                      <FileText className="w-3 h-3 text-gray-500" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFileFromGroup(group.id, file.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderProcessingState = () => {
    if (!processingState) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processing Files</CardTitle>
          <CardDescription>
            {processingState.completedJobs} of {processingState.totalJobs} completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={processingState.overallProgress} className="mb-4" />

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {processingState.jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4">
                  {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {job.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  {job.status === 'processing' && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {job.status === 'pending' && <div className="w-4 h-4 bg-gray-300 rounded-full" />}
                </div>
                <span className="flex-1 truncate">{job.fileName}</span>
                {job.status === 'processing' && (
                  <span className="text-xs text-gray-500">{job.progress}%</span>
                )}
                {job.status === 'error' && job.errorMessage && (
                  <span className="text-xs text-red-600">{job.errorMessage}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Zone */}
      {renderUploadZone()}

      {/* Processing State */}
      {renderProcessingState()}

      {/* File List */}
      {renderFileList()}

      {/* File Groups */}
      {renderFileGroups()}

      {/* Actions */}
      {fileGroups.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to Organize</h3>
                <p className="text-sm text-gray-600">
                  {fileGroups.length} groups with {uploadedFiles.length} files detected
                </p>
              </div>
              <Button
                onClick={() => onStartWizard(fileGroups)}
                disabled={isProcessing}
                size="lg"
              >
                Continue to Setup Wizard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Pro Tips for Better Organization</p>
              <ul className="space-y-1 text-sm">
                <li>• Name your files like: "Ch1_RealNumbers.pdf", "Ch2_Polynomials.pdf"</li>
                <li>• Upload all chapters from the same textbook together</li>
                <li>• Include series/publisher info in filenames for better detection</li>
                <li>• Review auto-detected groups before proceeding to setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}