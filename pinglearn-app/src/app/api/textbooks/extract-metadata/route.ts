/**
 * API endpoint for extracting metadata from PDF files
 *
 * This endpoint analyzes uploaded file names and extracts metadata
 * to auto-populate the textbook wizard
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFMetadataExtractor } from '@/lib/textbook/pdf-metadata-extractor';
import type { UploadedFile } from '@/types/textbook-hierarchy';

interface AggregatedMetadata {
  publisher?: string;
  publisherConfidence?: number;
  subject?: string;
  subjectConfidence?: number;
  grade?: number;
  gradeConfidence?: number;
  seriesName?: string;
  curriculum?: string;
}

/**
 * POST /api/textbooks/extract-metadata
 * Extract metadata from uploaded PDF files
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { files } = body as {
      files: Array<{
        name: string;
        size: number;
        type: string;
      }>;
    };

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Convert to UploadedFile format
    const uploadedFiles: UploadedFile[] = files.map((file, index) => ({
      id: `file-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: null as unknown as File, // File object not needed for metadata extraction
      processingStatus: 'pending',
      progress: 0
    }));

    // Extract metadata from each file
    const extractedMetadata = await Promise.all(
      uploadedFiles.map(file => PDFMetadataExtractor.extractFromFile(file))
    );

    // Group files by detected book/series
    const fileGroups = await PDFMetadataExtractor.groupFilesByBook(uploadedFiles);

    // Aggregate metadata across all files
    const aggregatedMetadata = extractedMetadata.reduce((acc, curr) => {
      // Use highest confidence values
      if (curr.publisher && (!acc.publisher || curr.confidence.publisher > (acc.publisherConfidence || 0))) {
        acc.publisher = curr.publisher;
        acc.publisherConfidence = curr.confidence.publisher;
      }
      if (curr.subject && (!acc.subject || curr.confidence.subject > (acc.subjectConfidence || 0))) {
        acc.subject = curr.subject;
        acc.subjectConfidence = curr.confidence.subject;
      }
      if (curr.grade && (!acc.grade || curr.confidence.grade > (acc.gradeConfidence || 0))) {
        acc.grade = curr.grade;
        acc.gradeConfidence = curr.confidence.grade;
      }
      if (curr.seriesName && !acc.seriesName) {
        acc.seriesName = curr.seriesName;
      }
      if (curr.curriculum && !acc.curriculum) {
        acc.curriculum = curr.curriculum;
      }

      return acc;
    }, {} as AggregatedMetadata);

    // Build suggested metadata for wizard
    const suggestedMetadata = {
      seriesInfo: {
        seriesName: aggregatedMetadata.seriesName || '',
        publisher: aggregatedMetadata.publisher || '',
        curriculumStandard: aggregatedMetadata.curriculum || aggregatedMetadata.publisher || 'NCERT',
        grade: aggregatedMetadata.grade || 10,
        subject: aggregatedMetadata.subject || '',
      },
      bookDetails: {
        volumeNumber: 1,
        volumeTitle: aggregatedMetadata.seriesName || '',
        edition: new Date().getFullYear().toString(),
        publicationYear: new Date().getFullYear(),
      },
      chapters: extractedMetadata
        .filter(m => m.chapterNumber !== undefined)
        .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
        .map(m => ({
          chapterNumber: m.chapterNumber!,
          chapterTitle: m.chapterTitle || `Chapter ${m.chapterNumber}`,
          fileName: files.find((_, i) => extractedMetadata[i] === m)?.name || '',
          confidence: m.confidence.chapter || 0.5
        })),
      confidence: {
        overall: Math.max(...extractedMetadata.map(m => m.confidence.overall)),
        publisher: aggregatedMetadata.publisherConfidence || 0,
        subject: aggregatedMetadata.subjectConfidence || 0,
        grade: aggregatedMetadata.gradeConfidence || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        extractedMetadata,
        fileGroups,
        suggestedMetadata
      }
    });

  } catch (error) {
    console.error('Metadata extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract metadata' },
      { status: 500 }
    );
  }
}