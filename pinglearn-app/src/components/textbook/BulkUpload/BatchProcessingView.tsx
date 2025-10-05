/**
 * FS-00-AC: BulkUpload System - BatchProcessingView Component
 *
 * Progress tracking for multiple file uploads with real-time status updates
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Pause,
  Play
} from 'lucide-react';

import type { BatchProcessingState, ProcessingJob } from '@/types/textbook-hierarchy';

// ==================================================
// TYPES
// ==================================================

export interface BatchProcessingViewProps {
  /** Current batch processing state */
  processingState: BatchProcessingState;
  /** Callback to cancel processing */
  onCancel?: () => void;
  /** Callback to pause processing */
  onPause?: () => void;
  /** Callback to resume processing */
  onResume?: () => void;
  /** Custom className */
  className?: string;
}

// ==================================================
// COMPONENT
// ==================================================

export function BatchProcessingView({
  processingState,
  onCancel,
  onPause,
  onResume,
  className = ''
}: BatchProcessingViewProps) {
  // ==================================================
  // RENDER HELPERS
  // ==================================================

  const renderStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const renderJobRow = (job: ProcessingJob) => (
    <div
      key={job.id}
      className="flex items-center gap-3 text-sm py-2 border-b last:border-b-0"
    >
      <div className="w-4 h-4 flex-shrink-0">
        {renderStatusIcon(job.status)}
      </div>

      <span className="flex-1 truncate" title={job.fileName}>
        {job.fileName}
      </span>

      {job.status === 'processing' && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Progress value={job.progress} className="w-16 h-2" />
          <span className="text-xs text-gray-500 w-10 text-right">
            {job.progress}%
          </span>
        </div>
      )}

      {job.status === 'completed' && (
        <Badge variant="default" className="text-xs flex-shrink-0">
          Done
        </Badge>
      )}

      {job.status === 'error' && (
        <Badge variant="destructive" className="text-xs flex-shrink-0">
          Failed
        </Badge>
      )}

      {job.status === 'pending' && (
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          Waiting
        </Badge>
      )}
    </div>
  );

  const renderSummaryStats = () => (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {processingState.totalJobs}
        </div>
        <div className="text-xs text-gray-600 mt-1">Total Files</div>
      </div>

      <div className="text-center p-3 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {processingState.completedJobs}
        </div>
        <div className="text-xs text-gray-600 mt-1">Completed</div>
      </div>

      <div className="text-center p-3 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {processingState.failedJobs}
        </div>
        <div className="text-xs text-gray-600 mt-1">Failed</div>
      </div>
    </div>
  );

  const renderControls = () => {
    if (!processingState.isProcessing || !processingState.canCancel) {
      return null;
    }

    return (
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          Processing {processingState.completedJobs} of {processingState.totalJobs} files...
        </div>

        <div className="flex items-center gap-2">
          {onPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              disabled={!processingState.isProcessing}
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}

          {onResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResume}
              disabled={processingState.isProcessing}
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          )}

          {onCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              disabled={!processingState.canCancel}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Processing Files
          {processingState.isProcessing && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </CardTitle>
        <CardDescription>
          {processingState.completedJobs} of {processingState.totalJobs} files processed
        </CardDescription>
      </CardHeader>

      <CardContent>
        {renderSummaryStats()}

        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{Math.round(processingState.overallProgress)}%</span>
          </div>
          <Progress value={processingState.overallProgress} className="h-3" />
        </div>

        {/* Jobs List */}
        <div className="max-h-64 overflow-y-auto border rounded-lg">
          <div className="divide-y">
            {processingState.jobs.map(renderJobRow)}
          </div>
        </div>

        {/* Controls */}
        {renderControls()}

        {/* Error Summary */}
        {processingState.failedJobs > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">
                  {processingState.failedJobs} {processingState.failedJobs === 1 ? 'file' : 'files'} failed to process
                </p>
                <p className="text-xs mt-1">
                  Check individual file errors above for details
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {processingState.completedJobs === processingState.totalJobs &&
          processingState.failedJobs === 0 &&
          !processingState.isProcessing && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">All files processed successfully!</p>
                  <p className="text-xs mt-1">
                    You can now continue to the metadata wizard
                  </p>
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
