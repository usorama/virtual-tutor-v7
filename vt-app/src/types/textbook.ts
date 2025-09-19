export interface Textbook {
  id: string
  file_name: string
  title: string
  grade: number
  subject: string
  total_pages?: number
  file_size_mb?: number
  uploaded_at: string
  processed_at?: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  error_message?: string
}

export interface Chapter {
  id: string
  textbook_id: string
  chapter_number: number
  title: string
  topics: string[]
  start_page?: number
  end_page?: number
}

export interface ContentChunk {
  id: string
  chapter_id: string
  chunk_index: number
  content: string
  content_type: 'text' | 'example' | 'exercise' | 'summary'
  page_number?: number
  token_count?: number
}

export interface TextbookUploadResponse {
  data: Textbook | null
  error: string | null
}

export interface ProcessingProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message?: string
}