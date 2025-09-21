'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { processTextbook } from './processor'
import { TextbookUploadResponse, Textbook } from '@/types/textbook'
import { randomUUID } from 'crypto'

export async function uploadTextbook(formData: FormData): Promise<TextbookUploadResponse> {
  try {
    const user = await getUser()
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const file = formData.get('file') as File
    const grade = parseInt(formData.get('grade') as string)
    const subject = formData.get('subject') as string

    // Validate file
    if (!file || !file.name.endsWith('.pdf')) {
      return { data: null, error: 'Please select a valid PDF file' }
    }

    const maxSizeMB = 50
    const fileSizeMB = file.size / (1024 * 1024)
    
    if (fileSizeMB > maxSizeMB) {
      return { data: null, error: `File size must be less than ${maxSizeMB}MB` }
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFileName = `${randomUUID()}_${file.name}`
    const tempPath = join('/tmp', tempFileName)
    
    await writeFile(tempPath, buffer)

    try {
      // Create database entry
      const supabase = await createClient()
      const { data: textbook, error: dbError } = await supabase
        .from('textbooks')
        .insert({
          file_name: file.name,
          title: file.name.replace('.pdf', ''),
          grade,
          subject,
          status: 'processing',
          file_size_mb: fileSizeMB,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        await unlink(tempPath) // Clean up temp file
        return { data: null, error: 'Failed to save textbook information' }
      }

      // Queue for processing (async - don't await)
      processTextbook(textbook.id, tempPath)
        .catch(error => {
          console.error('Background processing failed:', error)
          // Update status to failed
          supabase
            .from('textbooks')
            .update({ 
              status: 'failed', 
              error_message: error.message 
            })
            .eq('id', textbook.id)
            .then(() => {
              console.log('Updated textbook status to failed')
            })
        })
        .finally(() => {
          // Clean up temp file after processing
          unlink(tempPath).catch(console.error)
        })

      return { data: textbook as Textbook, error: null }
    } catch (error) {
      await unlink(tempPath) // Clean up temp file on error
      throw error
    }
  } catch (error) {
    console.error('Unexpected error in uploadTextbook:', error)
    return { data: null, error: 'Failed to upload textbook' }
  }
}

export async function getTextbooks(
  grade?: number,
  subject?: string
): Promise<{ data: Textbook[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    let query = supabase.from('textbooks').select('*')
    
    if (grade) {
      query = query.eq('grade', grade)
    }
    
    if (subject) {
      query = query.eq('subject', subject)
    }
    
    const { data, error } = await query.order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching textbooks:', error)
      return { data: null, error: error.message }
    }
    
    return { data: data as Textbook[], error: null }
  } catch (error) {
    console.error('Unexpected error in getTextbooks:', error)
    return { data: null, error: 'Failed to fetch textbooks' }
  }
}

export async function deleteTextbook(
  textbookId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    
    // Delete textbook and cascade will handle related records
    const { error } = await supabase
      .from('textbooks')
      .delete()
      .eq('id', textbookId)
    
    if (error) {
      console.error('Error deleting textbook:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in deleteTextbook:', error)
    return { success: false, error: 'Failed to delete textbook' }
  }
}

export async function retryProcessing(
  textbookId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    
    // Update status to processing
    const { error } = await supabase
      .from('textbooks')
      .update({ 
        status: 'processing',
        error_message: null 
      })
      .eq('id', textbookId)
    
    if (error) {
      console.error('Error updating textbook status:', error)
      return { success: false, error: error.message }
    }
    
    // TODO: Re-queue for processing once we have the original file
    // For now, this just resets the status
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in retryProcessing:', error)
    return { success: false, error: 'Failed to retry processing' }
  }
}