'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UploadForm } from '@/components/textbook/UploadForm'
import { getTextbooks, deleteTextbook, retryProcessing } from '@/lib/textbook/actions'
import { Textbook } from '@/types/textbook'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RefreshCw,
  Loader2,
  AlertCircle,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface TextbooksClientProps {
  initialTextbooks: Textbook[]
  userGrade: number
  userSubjects: string[]
}

export function TextbooksClient({ 
  initialTextbooks, 
  userGrade, 
  userSubjects 
}: TextbooksClientProps) {
  const [textbooks, setTextbooks] = useState<Textbook[]>(initialTextbooks)
  const [selectedSubject, setSelectedSubject] = useState(userSubjects[0] || '')
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [textbookToDelete, setTextbookToDelete] = useState<string | null>(null)

  const refreshTextbooks = useCallback(async () => {
    const { data } = await getTextbooks()
    if (data) {
      setTextbooks(data)
    }
  }, [])

  // Refresh textbooks periodically to check processing status
  useEffect(() => {
    const interval = setInterval(async () => {
      const processingTextbooks = textbooks.filter(t => t.status === 'processing')
      if (processingTextbooks.length > 0) {
        await refreshTextbooks()
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [textbooks, refreshTextbooks])

  const handleUploadComplete = async () => {
    await refreshTextbooks()
    toast.success('Textbook uploaded! Processing will continue in the background.')
  }

  const handleDelete = async () => {
    if (!textbookToDelete) return

    setIsLoading(true)
    const { success, error } = await deleteTextbook(textbookToDelete)
    
    if (success) {
      toast.success('Textbook deleted successfully')
      await refreshTextbooks()
    } else {
      toast.error(error || 'Failed to delete textbook')
    }
    
    setIsLoading(false)
    setDeleteDialogOpen(false)
    setTextbookToDelete(null)
  }

  const handleRetry = async (textbookId: string) => {
    setIsLoading(true)
    const { success, error } = await retryProcessing(textbookId)
    
    if (success) {
      toast.success('Reprocessing textbook...')
      await refreshTextbooks()
    } else {
      toast.error(error || 'Failed to retry processing')
    }
    
    setIsLoading(false)
  }

  const getStatusIcon = (status: Textbook['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'ready':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadgeVariant = (status: Textbook['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'ready':
        return 'success'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Filter textbooks by selected subject
  const filteredTextbooks = textbooks.filter(
    t => !selectedSubject || t.subject === selectedSubject
  )

  return (
    <>
      <Tabs defaultValue={selectedSubject} onValueChange={setSelectedSubject}>
        <TabsList className="mb-6">
          {userSubjects.map(subject => (
            <TabsTrigger key={subject} value={subject}>
              {subject}
            </TabsTrigger>
          ))}
        </TabsList>

        {userSubjects.map(subject => (
          <TabsContent key={subject} value={subject} className="space-y-6">
            {/* Upload Section */}
            <UploadForm
              grade={userGrade}
              subject={subject}
              onUploadComplete={handleUploadComplete}
            />

            {/* Textbooks List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Textbooks</h2>
              
              {filteredTextbooks.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No textbooks uploaded yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Upload your first textbook to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredTextbooks.map(textbook => (
                    <Card key={textbook.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <CardTitle className="text-base">{textbook.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {textbook.file_name} • {textbook.file_size_mb?.toFixed(2)} MB
                              </CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getStatusBadgeVariant(textbook.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(textbook.status)}
                              {textbook.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {textbook.total_pages && (
                              <span>{textbook.total_pages} pages</span>
                            )}
                            {textbook.processed_at && (
                              <span className="ml-3">
                                Processed {new Date(textbook.processed_at).toLocaleDateString()}
                              </span>
                            )}
                            {textbook.error_message && (
                              <div className="flex items-center gap-1 mt-2 text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                {textbook.error_message}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {textbook.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetry(textbook.id)}
                                disabled={isLoading}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setTextbookToDelete(textbook.id)
                                setDeleteDialogOpen(true)
                              }}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Textbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this textbook? This action cannot be undone
              and will remove all associated chapters and content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}