'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { uploadTextbook } from '@/lib/textbook/actions'
import { ProcessingProgress } from '@/types/textbook'
import { BaseUploadProps, UploadProgress, BaseComponentProps } from '@/types/common'
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadFormProps extends BaseComponentProps {
  readonly grade: number;
  readonly subject: string;
  readonly onUploadComplete?: (textbookId: string) => void;
}

export function UploadForm({
  grade,
  subject,
  onUploadComplete,
  className,
  id,
  testId
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: 'idle',
    progress: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File): void => {
    // Validate file
    if (!selectedFile.type.includes('pdf')) {
      toast.error('Please select a PDF file')
      return
    }

    const maxSizeMB = 50
    const fileSizeMB = selectedFile.size / (1024 * 1024)

    if (fileSizeMB > maxSizeMB) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setFile(selectedFile)
    setProgress({ status: 'idle', progress: 0 })
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async (): Promise<void> => {
    if (!file) return

    try {
      setProgress({ status: 'processing', progress: 0, message: 'Starting upload...' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('grade', grade.toString())
      formData.append('subject', subject)

      setProgress({ status: 'processing', progress: 25, message: 'Uploading file...' })

      const result = await uploadTextbook(formData)

      if (result.data) {
        setProgress({ status: 'completed', progress: 100, message: 'Upload completed successfully!' })
        toast.success('Textbook uploaded successfully!')

        if (onUploadComplete) {
          onUploadComplete(result.data.id)
        }

        // Reset form
        setFile(null)
        setProgress({ status: 'idle', progress: 0 })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else if (result.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setProgress({
        status: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed'
      })
      toast.error('Upload failed. Please try again.')
    }
  }

  const removeFile = (): void => {
    setFile(null)
    setProgress({ status: 'idle', progress: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isProcessing = progress.status === 'processing'
  const isCompleted = progress.status === 'completed'
  const isFailed = progress.status === 'failed'

  return (
    <Card
      id={id}
      data-testid={testId}
      className={cn('w-full max-w-2xl mx-auto', className)}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Textbook
        </CardTitle>
        <CardDescription>
          Upload a PDF textbook for Grade {grade} {subject}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            isProcessing && 'cursor-not-allowed opacity-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isProcessing}
          />

          {file ? (
            <div className="space-y-4">
              <FileText className="mx-auto h-12 w-12 text-blue-500" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="font-medium">Drop your PDF here or click to browse</p>
                <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {(isProcessing || isCompleted || isFailed) && (
          <div className="space-y-4">
            <Progress value={progress.progress} className="w-full" />

            <div className="flex items-center gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {isFailed && <AlertCircle className="h-4 w-4 text-red-500" />}

              <span className="text-sm">
                {progress.message || `${progress.progress}% complete`}
              </span>
            </div>

            {isFailed && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {progress.message || 'Upload failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing || isCompleted}
            className="min-w-32"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}