/**
 * Textbook Upload Page
 * This page demonstrates how to use the Metadata Wizard for uploading textbooks
 */

'use client';

import { useState } from 'react';
import { MetadataWizard } from '@/components/textbook/MetadataWizard';
import { BulkUploadInterface } from '@/components/textbook/BulkUploadInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UploadedFile, FileGroup, TextbookWizardState } from '@/types/textbook-hierarchy';

export default function TextbookUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [detectedGroups, setDetectedGroups] = useState<FileGroup[]>([]);
  const [showWizard, setShowWizard] = useState(false);

  const handleFilesProcessed = (groups: FileGroup[]) => {
    setDetectedGroups(groups);
    // After files are grouped, show the wizard
    if (groups.length > 0) {
      setShowWizard(true);
    }
  };

  const handleWizardComplete = async (formData: TextbookWizardState['formData']) => {
    console.log('Wizard completed with data:', formData);

    // Here you would typically:
    // 1. Send the data to your backend API
    // 2. Create the book series, books, and chapters in the database
    // 3. Process and store the PDF files

    alert('Textbook metadata saved successfully!');

    // Reset the upload interface
    setShowWizard(false);
    setUploadedFiles([]);
    setDetectedGroups([]);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    // Optionally reset files
    if (confirm('Cancel upload? This will clear all uploaded files.')) {
      setUploadedFiles([]);
      setDetectedGroups([]);
    }
  };

  if (showWizard) {
    return (
      <MetadataWizard
        uploadedFiles={uploadedFiles}
        detectedGroups={detectedGroups}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Textbook Chapters</CardTitle>
          <CardDescription>
            Upload multiple chapter PDFs and we'll help you organize them into a proper textbook structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkUploadInterface
            onFilesProcessed={handleFilesProcessed}
            onStartWizard={(groups) => {
              console.log('Starting wizard with groups:', groups);
              setShowWizard(true);
            }}
          />

          {uploadedFiles.length > 0 && !showWizard && (
            <div className="mt-4 text-center">
              <Button onClick={() => setShowWizard(true)}>
                Continue to Metadata Setup →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}