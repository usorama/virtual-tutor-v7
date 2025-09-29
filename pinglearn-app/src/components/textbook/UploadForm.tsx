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
    isLoading: false
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
    setProgress({ status: 'idle', progress: 0, isLoading: false })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async (): Promise<void> => {
    if (!file) return

    try {
      setProgress({ status: 'processing', progress: 0, message: 'Starting upload...', isLoading: true })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('grade', grade.toString())
      formData.append('subject', subject)

      setProgress({ status: 'processing', progress: 25, message: 'Uploading file...', isLoading: true })

      const result = await uploadTextbook(formData)

      if (result.data) {
        setProgress({ status: 'completed', progress: 100, message: 'Upload completed successfully!', isLoading: false })
        toast.success('Textbook uploaded successfully!')

        if (onUploadComplete) {
          onUploadComplete(result.data.id)
        }

        // Reset form
        setFile(null)
        setProgress({ status: 'idle', progress: 0, isLoading: false })
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
        message: error instanceof Error ? error.message : 'Upload failed',
        isLoading: false
      })
      toast.error('Upload failed. Please try again.')
    }
  }

  const removeFile = (): void => {
    setFile(null)
    setProgress({ status: 'idle', progress: 0, isLoading: false })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Upload className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusMessage = () => {
    if (progress.message) {
      return progress.message
    }

    switch (progress.status) {
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Upload completed successfully!'
      case 'failed':
        return 'Upload failed'
      default:
        return 'Ready to upload'
    }
  }

  return (
    <Card className={cn('w-full', className)} id={id} data-testid={testId}>
      <CardHeader>
        <CardTitle>Upload Textbook</CardTitle>
        <CardDescription>
          Upload a PDF textbook for Grade {grade} {subject}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            file && 'border-green-500 bg-green-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {file ? (
            <div className="space-y-2">
              <FileText className="h-8 w-8 mx-auto text-green-500" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={removeFile}
                className="mt-2"
              >
                Remove File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your PDF here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
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

        {/* Upload Progress */}
        {progress.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {getStatusMessage()}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress.progress}%
              </span>
            </div>
            <Progress value={progress.progress} className="w-full" />
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'failed' && progress.message && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {progress.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || progress.status === 'processing'}
            className="min-w-[120px]"
          >
            {progress.status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
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