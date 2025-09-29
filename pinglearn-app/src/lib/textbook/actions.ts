'use server'

import { createClient } from '@/lib/supabase/server'
import { Textbook, TextbookUploadResponse } from '@/types/textbook'
import { getUser } from '@/lib/auth/actions'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'

/**
 * Helper function to create properly formatted TextbookUploadResponse objects
 */
function createTextbookResponse(
  success: boolean,
  data?: Textbook,
  error?: string
): TextbookUploadResponse {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  }
}

export async function uploadTextbook(formData: FormData): Promise<TextbookUploadResponse> {
  try {
    const userResponse = await getUser()
    if (!userResponse.success || !userResponse.data?.user) {
      return createTextbookResponse(false, undefined, 'User not authenticated')
    }

    const file = formData.get('file') as File
    const grade = parseInt(formData.get('grade') as string)
    const subject = formData.get('subject') as string

    // Validate file
    if (!file || !file.name.endsWith('.pdf')) {
      return createTextbookResponse(false, undefined, 'Please select a valid PDF file')
    }

    const maxSizeMB = 50
    const fileSizeMB = file.size / (1024 * 1024)

    if (fileSizeMB > maxSizeMB) {
      return createTextbookResponse(false, undefined, `File size must be less than ${maxSizeMB}MB`)
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFileName = `${randomUUID()}_${file.name}`
    const tempPath = join('/tmp', tempFileName)

    try {
      await writeFile(tempPath, buffer)
    } catch (writeError) {
      console.error('Failed to write temp file:', writeError)
      return createTextbookResponse(false, undefined, 'Failed to process file')
    }

    // Create textbook record
    const supabase = await createClient()

    const newTextbook = {
      id: randomUUID(),
      file_name: file.name,
      title: file.name.replace('.pdf', ''),
      grade,
      subject,
      total_pages: 0, // Will be updated after processing
      file_size_mb: parseFloat(fileSizeMB.toFixed(2)),
      uploaded_at: new Date().toISOString(),
      status: 'pending' as const,
    }

    const { data: textbook, error } = await supabase
      .from('textbooks')
      .insert(newTextbook)
      .select()
      .single()

    // Clean up temp file
    try {
      await unlink(tempPath)
    } catch (unlinkError) {
      console.warn('Failed to clean up temp file:', unlinkError)
    }

    if (error) {
      console.error('Database error:', error)
      return createTextbookResponse(false, undefined, 'Failed to save textbook record')
    }

    return createTextbookResponse(true, textbook)

  } catch (error) {
    console.error('Upload error:', error)
    return createTextbookResponse(false, undefined, 'Upload failed due to an internal error')
  }
}

export async function getTextbooks(): Promise<{ success: boolean; data?: Textbook[]; error?: string }> {
  try {
    const userResponse = await getUser()
    if (!userResponse.success || !userResponse.data?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to fetch textbooks' }
    }

    return { success: true, data: textbooks || [] }

  } catch (error) {
    console.error('Fetch error:', error)
    return { success: false, error: 'Failed to fetch textbooks' }
  }
}

export async function getTextbook(id: string): Promise<{ success: boolean; data?: Textbook; error?: string }> {
  try {
    const userResponse = await getUser()
    if (!userResponse.success || !userResponse.data?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    const { data: textbook, error } = await supabase
      .from('textbooks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to fetch textbook' }
    }

    return { success: true, data: textbook }

  } catch (error) {
    console.error('Fetch error:', error)
    return { success: false, error: 'Failed to fetch textbook' }
  }
}

export async function deleteTextbook(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userResponse = await getUser()
    if (!userResponse.success || !userResponse.data?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('textbooks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to delete textbook' }
    }

    return { success: true }

  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete textbook' }
  }
}

export async function retryProcessing(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userResponse = await getUser()
    if (!userResponse.success || !userResponse.data?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // Update textbook status to 'pending' to retry processing
    const { error } = await supabase
      .from('textbooks')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to retry processing' }
    }

    return { success: true }

  } catch (error) {
    console.error('Retry processing error:', error)
    return { success: false, error: 'Failed to retry processing' }
  }
}