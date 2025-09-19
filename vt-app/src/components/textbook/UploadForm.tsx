'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { uploadTextbook } from '@/lib/textbook/actions'
import { ProcessingProgress } from '@/types/textbook'
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

interface UploadFormProps {
  grade: number
  subject: string
  onUploadComplete?: (textbookId: string) => void
  className?: string
}

export function UploadForm({ 
  grade, 
  subject, 
  onUploadComplete,
  className 
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: 'idle',
    progress: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setProgress({ status: 'uploading', progress: 20 })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('grade', grade.toString())
      formData.append('subject', subject)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.progress < 80) {
            return { ...prev, progress: prev.progress + 10 }
          }
          return prev
        })
      }, 500)

      const { data, error } = await uploadTextbook(formData)

      clearInterval(progressInterval)

      if (error) {
        setProgress({ 
          status: 'error', 
          progress: 0, 
          message: error 
        })
        toast.error(error)
      } else if (data) {
        setProgress({ 
          status: 'completed', 
          progress: 100,
          message: 'Upload complete! Processing textbook...'
        })
        toast.success('Textbook uploaded successfully!')
        
        if (onUploadComplete) {
          onUploadComplete(data.id)
        }

        // Reset after a delay
        setTimeout(() => {
          setFile(null)
          setProgress({ status: 'idle', progress: 0 })
        }, 3000)
      }
    } catch {
      setProgress({ 
        status: 'error', 
        progress: 0,
        message: 'Upload failed. Please try again.'
      })
      toast.error('Upload failed')
    }
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upload Textbook</CardTitle>
        <CardDescription>
          Upload a PDF textbook for {subject} (Grade {grade})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            {
              'border-gray-300 bg-gray-50': !isDragging && !file,
              'border-blue-400 bg-blue-50': isDragging || (file && (progress.status === 'uploading' || progress.status === 'processing')),
              'border-green-400 bg-green-50': file && progress.status === 'idle',
              'border-green-500 bg-green-50': file && progress.status === 'completed',
              'border-red-400 bg-red-50': file && progress.status === 'error',
            }
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Drag & drop your PDF here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) {
                    handleFileSelect(selectedFile)
                  }
                }}
              />
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-10 w-10 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {getStatusIcon()}
              </div>

              {progress.status === 'uploading' && (
                <div className="space-y-2">
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-sm text-center text-gray-500">
                    Uploading... {progress.progress}%
                  </p>
                </div>
              )}

              {progress.message && (
                <Alert variant={progress.status === 'error' ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{progress.message}</AlertDescription>
                </Alert>
              )}

              {progress.status === 'idle' && (
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                      setProgress({ status: 'idle', progress: 0 })
                    }}
                  >
                    Remove
                  </Button>
                  <Button onClick={handleUpload}>
                    Upload Textbook
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Maximum file size: 50 MB</p>
          <p>• Supported format: PDF</p>
          <p>• Processing time: 2-5 minutes depending on file size</p>
        </div>
      </CardContent>
    </Card>
  )
}