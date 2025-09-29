/**
 * Enhanced Textbooks Client
 *
 * This replaces the existing textbooks-client.tsx with the new enhanced upload flow
 * that includes metadata extraction and the wizard
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedUploadFlow } from '@/components/textbook/EnhancedUploadFlow'
import { ContentManagementDashboard } from '@/components/textbook/ContentManagementDashboard'
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
  BookOpen,
  Upload,
  Library,
  Plus
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
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TextbooksClientEnhancedProps {
  initialTextbooks: Textbook[]
  userGrade: number
  userSubjects: string[]
}

export function TextbooksClientEnhanced({
  initialTextbooks,
  userGrade,
  userSubjects
}: TextbooksClientEnhancedProps) {
  const [activeTab, setActiveTab] = useState('library')
  const [textbooks, setTextbooks] = useState<Textbook[]>(initialTextbooks)
  const [selectedSubject, setSelectedSubject] = useState(userSubjects[0] || '')
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [textbookToDelete, setTextbookToDelete] = useState<string | null>(null)
  const [showUploadFlow, setShowUploadFlow] = useState(false)

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
    toast.success('Textbook uploaded and organized successfully!')
    setShowUploadFlow(false)
    setActiveTab('library')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'ready':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      processing: 'secondary',
      ready: 'default',
      failed: 'destructive',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    )
  }

  const subjectTextbooks = selectedSubject
    ? textbooks.filter(t => t.subject === selectedSubject)
    : textbooks

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Textbook Library</h2>
          <p className="text-muted-foreground">
            Manage your study materials with intelligent organization
          </p>
        </div>
        <Button
          onClick={() => setShowUploadFlow(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload New Textbook
        </Button>
      </div>

      {/* Info Alert for New Features */}
      {textbooks.length === 0 && (
        <Alert>
          <Library className="h-4 w-4" />
          <AlertDescription>
            <strong>New!</strong> Upload multiple chapter PDFs and we'll automatically organize them into proper textbook structures.
            Our AI detects metadata and helps you review before processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Show Upload Flow or Library */}
      {showUploadFlow ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upload New Textbook</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadFlow(false)}
            >
              Back to Library
            </Button>
          </div>

          <EnhancedUploadFlow
            userGrade={userGrade}
            userSubject={selectedSubject}
            onComplete={handleUploadComplete}
          />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library">My Library</TabsTrigger>
            <TabsTrigger value="organize">Organize</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {/* Subject Filter */}
            {userSubjects.length > 0 && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!selectedSubject ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSubject('')}
                >
                  All
                </Button>
                {userSubjects.map(subject => (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            )}

            {/* Existing Textbooks List */}
            {subjectTextbooks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No textbooks yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your first textbook to get started with organized learning
                  </p>
                  <Button onClick={() => setShowUploadFlow(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Textbook
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {subjectTextbooks.map(textbook => (
                  <Card key={textbook.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          {textbook.title}
                        </CardTitle>
                        <CardDescription>
                          {textbook.file_name} • {textbook.file_size_mb?.toFixed(1)}MB
                        </CardDescription>
                      </div>
                      {getStatusBadge(textbook.status)}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline">Grade {textbook.grade}</Badge>
                          <Badge variant="outline">{textbook.subject}</Badge>
                          {textbook.total_pages && (
                            <Badge variant="outline">{textbook.total_pages} pages</Badge>
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
                              <RefreshCw className="h-4 w-4" />
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
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {textbook.error_message && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {textbook.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="organize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Organization</CardTitle>
                <CardDescription>
                  Upload multiple chapter PDFs and we'll automatically organize them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedUploadFlow
                  userGrade={userGrade}
                  userSubject={selectedSubject}
                  onComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <ContentManagementDashboard
              onUploadNew={() => setShowUploadFlow(true)}
              onEditContent={(type, id) => {
                console.log(`Edit ${type} with ID: ${id}`)
                toast.info(`Edit functionality coming soon`)
              }}
              onDeleteContent={(type, id) => {
                console.log(`Delete ${type} with ID: ${id}`)
                toast.info(`Delete functionality coming soon`)
              }}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the textbook and all its chapters. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}