/**
 * Enhanced Upload Form - ARCH-001 Implementation
 *
 * Refactored upload component that demonstrates architectural improvements:
 * - Uses event-driven communication (no circular dependencies)
 * - Implements service contracts for dependency inversion
 * - Clear separation between presentation and business logic
 * - Type-safe event handling
 *
 * This component:
 * - Listens to service events instead of directly calling services
 * - Uses dependency injection for services
 * - Follows presentation layer responsibilities
 * - Maintains UI state only
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BaseComponentProps } from '@/types/common';
import {
  TextbookProcessorContract,
  ProcessingStatus,
  TextbookMetadata,
  ProgressCallback,
} from '@/types/contracts/service-contracts';
import { eventBus, SystemEvents, type EventData } from '@/lib/events/event-bus';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Pause,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { serviceContainer } from '@/lib/architecture/boundaries';

/**
 * Enhanced upload form props with service injection
 */
interface EnhancedUploadFormProps extends BaseComponentProps {
  readonly grade: number;
  readonly subject: string;
  readonly onUploadComplete?: (textbookId: string, result: any) => void;
  readonly onUploadProgress?: (progress: number) => void;
  readonly textbookProcessor?: TextbookProcessorContract; // Dependency injection
}

/**
 * Internal upload state for UI management
 */
interface UploadState {
  readonly status: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  readonly progress: number;
  readonly message: string;
  readonly textbookId?: string;
  readonly canCancel: boolean;
  readonly canPause: boolean;
}

/**
 * Enhanced upload form with event-driven architecture
 */
export function EnhancedUploadForm({
  grade,
  subject,
  onUploadComplete,
  onUploadProgress,
  className,
  id,
  testId,
  textbookProcessor // Injected dependency
}: EnhancedUploadFormProps) {
  // UI State - Presentation Layer Responsibility
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: 'Ready to upload',
    canCancel: false,
    canPause: false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  // Get service instance (dependency injection or service locator)
  const processorService = textbookProcessor ||
    (serviceContainer.has('textbookProcessor')
      ? serviceContainer.get<TextbookProcessorContract>('textbookProcessor')
      : null);

  /**
   * Setup event listeners for service events
   */
  useEffect(() => {
    // Clear previous subscriptions
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];

    // Listen to textbook processing events
    const subscriptions = [
      // Upload progress events
      eventBus.on('textbook:upload:progress', handleUploadProgress),
      eventBus.on('textbook:upload:completed', handleUploadCompleted),
      eventBus.on('textbook:upload:failed', handleUploadFailed),

      // Processing events
      eventBus.on('textbook:processing:started', handleProcessingStarted),
      eventBus.on('textbook:processing:progress', handleProcessingProgress),
      eventBus.on('textbook:processing:completed', handleProcessingCompleted),
      eventBus.on('textbook:processing:failed', handleProcessingFailed),

      // System events
      eventBus.on('system:error', handleSystemError),
    ];

    unsubscribeRefs.current = subscriptions;

    return () => {
      subscriptions.forEach(unsub => unsub());
    };
  }, []);

  /**
   * Event handlers for service events
   */
  const handleUploadProgress = useCallback((eventData: EventData<any>) => {
    const { progress, uploadedBytes } = eventData.payload;

    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      progress: Math.round(progress * 0.3), // Upload is 30% of total progress
      message: `Uploading... ${(uploadedBytes / 1024 / 1024).toFixed(1)}MB`,
    }));

    if (onUploadProgress) {
      onUploadProgress(progress * 0.3);
    }
  }, [onUploadProgress]);

  const handleUploadCompleted = useCallback((eventData: EventData<any>) => {
    const { textbookId } = eventData.payload;

    setUploadState(prev => ({
      ...prev,
      status: 'processing',
      progress: 30,
      message: 'Upload completed. Starting processing...',
      textbookId,
      canCancel: true,
    }));
  }, []);

  const handleUploadFailed = useCallback((eventData: EventData<any>) => {
    const { error } = eventData.payload;

    setUploadState(prev => ({
      ...prev,
      status: 'failed',
      progress: 0,
      message: `Upload failed: ${error}`,
      canCancel: false,
      canPause: false,
    }));

    toast.error('Upload failed', {
      description: error,
    });
  }, []);

  const handleProcessingStarted = useCallback((eventData: EventData<any>) => {
    const { textbookId } = eventData.payload;

    setUploadState(prev => ({
      ...prev,
      status: 'processing',
      progress: 30,
      message: 'Processing textbook content...',
      textbookId,
      canCancel: true,
      canPause: false, // Processing can't be paused
    }));
  }, []);

  const handleProcessingProgress = useCallback((eventData: EventData<any>) => {
    const { progress, status } = eventData.payload;

    // Processing takes 70% of total progress (after 30% upload)
    const totalProgress = 30 + (progress * 0.7);

    setUploadState(prev => ({
      ...prev,
      status: 'processing',
      progress: Math.round(totalProgress),
      message: status || 'Processing...',
    }));

    if (onUploadProgress) {
      onUploadProgress(totalProgress);
    }
  }, [onUploadProgress]);

  const handleProcessingCompleted = useCallback((eventData: EventData<any>) => {
    const { textbookId, processingTime } = eventData.payload;

    setUploadState(prev => ({
      ...prev,
      status: 'completed',
      progress: 100,
      message: `Processing completed in ${(processingTime / 1000).toFixed(1)}s`,
      canCancel: false,
      canPause: false,
    }));

    toast.success('Textbook processed successfully!', {
      description: `Ready for learning sessions`,
    });

    if (onUploadComplete) {
      onUploadComplete(textbookId, eventData.payload);
    }

    // Reset form after completion
    setTimeout(() => {
      resetForm();
    }, 2000);
  }, [onUploadComplete]);

  const handleProcessingFailed = useCallback((eventData: EventData<any>) => {
    const { error } = eventData.payload;

    setUploadState(prev => ({
      ...prev,
      status: 'failed',
      progress: 0,
      message: `Processing failed: ${error}`,
      canCancel: false,
      canPause: false,
    }));

    toast.error('Processing failed', {
      description: error,
    });
  }, []);

  const handleSystemError = useCallback((eventData: EventData<any>) => {
    const { error, component, severity } = eventData.payload;

    if (component === 'TextbookProcessor' && severity === 'high') {
      setUploadState(prev => ({
        ...prev,
        status: 'failed',
        message: `System error: ${error}`,
        canCancel: false,
        canPause: false,
      }));

      toast.error('System error occurred', {
        description: error,
      });
    }
  }, []);

  /**
   * Progress callback implementation
   */
  const createProgressCallback = (): ProgressCallback => ({
    onProgress: (progress: number) => {
      // Progress updates will come through events
      // This callback is mainly for service-internal progress tracking
    },
    onStatusUpdate: (status: string) => {
      setUploadState(prev => ({ ...prev, message: status }));
    },
    onComplete: (result: unknown) => {
      // Completion will be handled by events
    },
    onError: (error: any) => {
      // Errors will be handled by events
    },
  });

  /**
   * File validation with service integration
   */
  const validateFile = async (selectedFile: File): Promise<boolean> => {
    if (!processorService) {
      toast.error('Processing service not available');
      return false;
    }

    setUploadState(prev => ({
      ...prev,
      status: 'validating',
      message: 'Validating file...',
      progress: 5,
    }));

    try {
      const validationResult = await processorService.validateTextbook(selectedFile);

      if (!validationResult.success || !validationResult.data?.isValid) {
        const errors = validationResult.data?.errors || ['Unknown validation error'];
        setValidationErrors(errors);

        setUploadState(prev => ({
          ...prev,
          status: 'failed',
          message: 'File validation failed',
          progress: 0,
        }));

        toast.error('Invalid file', {
          description: errors.join(', '),
        });

        return false;
      }

      // Show warnings if any
      const warnings = validationResult.data?.warnings || [];
      if (warnings.length > 0) {
        toast.warning('File validation warnings', {
          description: warnings.join(', '),
        });
      }

      setValidationErrors([]);
      setUploadState(prev => ({
        ...prev,
        status: 'idle',
        message: 'File validated successfully',
        progress: 0,
      }));

      return true;
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'failed',
        message: 'Validation error',
        progress: 0,
      }));

      toast.error('Validation error', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  };

  /**
   * File selection with validation
   */
  const handleFileSelect = async (selectedFile: File): Promise<void> => {
    // Basic client-side validation
    if (!selectedFile.type.includes('pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    const maxSizeMB = 50;
    const fileSizeMB = selectedFile.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);

    // Validate with service
    await validateFile(selectedFile);
  };

  /**
   * Start upload and processing
   */
  const handleUpload = async (): Promise<void> => {
    if (!file || !processorService) {
      toast.error('No file selected or service unavailable');
      return;
    }

    try {
      setUploadState(prev => ({
        ...prev,
        status: 'uploading',
        progress: 0,
        message: 'Starting upload...',
        canCancel: true,
      }));

      const metadata: Partial<TextbookMetadata> = {
        grade: `Grade ${grade}`,
        subject,
        language: 'English',
        curriculum: 'CBSE', // Could be made configurable
      };

      const progressCallback = createProgressCallback();

      // Start processing (this will emit events for progress)
      await processorService.processTextbook(file, metadata, progressCallback);

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed',
        canCancel: false,
        canPause: false,
      }));

      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Cancel processing
   */
  const handleCancel = async (): Promise<void> => {
    if (!uploadState.textbookId || !processorService) {
      return;
    }

    try {
      await processorService.cancelProcessing(uploadState.textbookId);

      setUploadState(prev => ({
        ...prev,
        status: 'cancelled',
        message: 'Processing cancelled',
        canCancel: false,
        canPause: false,
      }));

      toast.info('Processing cancelled');
    } catch (error) {
      toast.error('Failed to cancel processing');
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = (): void => {
    setFile(null);
    setUploadState({
      status: 'idle',
      progress: 0,
      message: 'Ready to upload',
      canCancel: false,
      canPause: false,
    });
    setValidationErrors([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * File drag and drop handlers
   */
  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * UI helper functions
   */
  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Upload className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isProcessing = ['validating', 'uploading', 'processing'].includes(uploadState.status);
  const hasError = ['failed', 'cancelled'].includes(uploadState.status);
  const isCompleted = uploadState.status === 'completed';

  return (
    <Card className={cn('w-full', className)} id={id} data-testid={testId}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Enhanced Upload</span>
          {processorService && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Service Connected
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Upload a PDF textbook for Grade {grade} {subject} with advanced processing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging && 'border-primary bg-primary/5',
            !isDragging && !file && 'border-muted-foreground/25 hover:border-muted-foreground/50',
            file && !hasError && 'border-green-500 bg-green-50',
            hasError && 'border-red-500 bg-red-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {file ? (
            <div className="space-y-2">
              <FileText className={cn(
                'h-8 w-8 mx-auto',
                hasError ? 'text-red-500' : 'text-green-500'
              )} />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              {!isProcessing && !isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="mt-2"
                >
                  Remove File
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your PDF here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files (Advanced Processing)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Validation errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Progress */}
        {uploadState.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {uploadState.message}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {uploadState.progress}%
              </span>
            </div>
            <Progress value={uploadState.progress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex space-x-2">
            {uploadState.canCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700"
              >
                Cancel
              </Button>
            )}
            {isCompleted && (
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Upload Another
              </Button>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing || !processorService || validationErrors.length > 0}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadState.status === 'validating' && 'Validating...'}
                {uploadState.status === 'uploading' && 'Uploading...'}
                {uploadState.status === 'processing' && 'Processing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process
              </>
            )}
          </Button>
        </div>

        {/* Service Status */}
        {!processorService && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Processing service not available. Please check your configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default EnhancedUploadForm;