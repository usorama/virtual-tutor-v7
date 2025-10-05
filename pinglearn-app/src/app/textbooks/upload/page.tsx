/**
 * Textbook Upload Page
 *
 * Uses NEW MetadataWizard with curriculum_id integration (FC-00-AC + FS-00-AD)
 * Integrates matchOrCreateCurriculum service for automatic curriculum matching
 */

'use client';

import { useState } from 'react';
import { WizardContainer } from '@/components/textbook/MetadataWizard';
import { UploadZone } from '@/components/textbook/BulkUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WizardSubmission } from '@/components/textbook/MetadataWizard';
// NOTE: No need to import matchOrCreateCurriculum - WizardContainer handles curriculum selection

type UploadState = 'upload' | 'wizard' | 'processing' | 'complete';

export default function TextbookUploadPage() {
  const [state, setState] = useState<UploadState>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');

  // Handle file selection from UploadZone
  const handleFilesSelected = (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      setError('Please upload at least one PDF file');
      return;
    }

    if (pdfFiles.length !== files.length) {
      toast.warning(`Filtered to ${pdfFiles.length} PDF files (ignored ${files.length - pdfFiles.length} non-PDF files)`);
    }

    setUploadedFiles(pdfFiles);
    setError('');

    // Move to wizard state
    setState('wizard');
  };

  // Handle wizard completion with FC-00-AC book series creation
  const handleWizardComplete = async (wizardData: WizardSubmission) => {
    setState('processing');
    setError('');

    try {
      // NOTE: WizardContainer already handles curriculum selection via SWR
      // wizardData.series.curriculumId is the UUID FK to curriculum_data table
      // This follows FC-00-AC-INTEGRATION-MODIFICATION.md (curriculum_id FK, NOT duplicate fields)

      console.log('[FC-00-AC] Creating book series with curriculum_id:', wizardData.series.curriculumId);

      // Step 1: Create book series with curriculum_id FK
      const seriesResponse = await fetch('/api/textbooks/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesName: wizardData.series.seriesName,
          publisher: wizardData.series.publisher,
          curriculumId: wizardData.series.curriculumId,  // ✅ FK to curriculum_data (NOT duplicate fields!)
          description: wizardData.series.description
        })
      });

      if (!seriesResponse.ok) {
        const errorData = await seriesResponse.json();
        throw new Error(errorData.message || 'Failed to create book series');
      }

      const { seriesId } = await seriesResponse.json();
      console.log('[FC-00-AC] Created series ID:', seriesId);

      // Step 2: Create book record
      const bookResponse = await fetch('/api/textbooks/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          volumeNumber: wizardData.book.volumeNumber,
          volumeTitle: wizardData.book.volumeTitle,
          edition: wizardData.book.edition,
          authors: wizardData.book.authors,
          isbn: wizardData.book.isbn,
          publicationYear: wizardData.book.publicationYear
        })
      });

      if (!bookResponse.ok) {
        const errorData = await bookResponse.json();
        throw new Error(errorData.message || 'Failed to create book');
      }

      const { bookId } = await bookResponse.json();
      console.log('[FC-00-AC] Created book ID:', bookId);

      // Step 3: Create chapters
      const chaptersResponse = await fetch('/api/textbooks/chapters/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          chapters: wizardData.chapters.map(ch => ({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            startPage: ch.startPage,
            endPage: ch.endPage,
            fileName: ch.fileName  // ✅ Use fileName, not sourceFile
          }))
        })
      });

      if (!chaptersResponse.ok) {
        const errorData = await chaptersResponse.json();
        throw new Error(errorData.message || 'Failed to create chapters');
      }

      console.log('[FC-00-AC] Created chapters');

      // Step 4: Upload PDF files (actual file storage)
      const formData = new FormData();
      formData.append('bookId', bookId);
      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const uploadResponse = await fetch('/api/textbooks/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload PDF files');
      }

      console.log('[FC-00-AC] Uploaded PDF files');

      // Success!
      toast.success('Textbook uploaded successfully! Book series created with curriculum integration.');
      setState('complete');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast.error('Failed to upload textbook');
      setState('wizard');  // Go back to wizard to retry
    }
  };

  const handleCancel = () => {
    if (confirm('Cancel upload? This will discard all uploaded files.')) {
      setState('upload');
      setUploadedFiles([]);
      setError('');
    }
  };

  const resetUpload = () => {
    setState('upload');
    setUploadedFiles([]);
    setError('');
  };

  // Render upload state
  if (state === 'upload') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Textbook Chapters
            </CardTitle>
            <CardDescription>
              Upload PDF files and we&apos;ll help you organize them into a proper textbook structure with automatic curriculum matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <UploadZone
              onFilesSelected={handleFilesSelected}
              maxFiles={50}
              maxFileSize={100}
            />

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Smart Curriculum Matching:</strong> We&apos;ll automatically match your textbook to existing curricula (Class 10 Math, Class 12 English, etc.) or create a new curriculum entry if needed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render wizard state
  if (state === 'wizard') {
    return (
      <div className="container mx-auto px-4 py-8">
        <WizardContainer
          onComplete={handleWizardComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Render processing state
  if (state === 'processing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Processing Upload...</CardTitle>
            <CardDescription>
              Please wait while we create your textbook structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render complete state
  if (state === 'complete') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Upload Complete!
            </CardTitle>
            <CardDescription>
              Your textbook has been successfully uploaded and organized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Your textbook is now available in the library.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Upload Another Textbook
                </button>
                <button
                  onClick={() => window.location.href = '/textbooks/library'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  View Library
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
