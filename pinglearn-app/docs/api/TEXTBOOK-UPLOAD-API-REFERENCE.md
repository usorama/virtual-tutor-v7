# Textbook Upload API Reference

**Feature**: FC-00-AC (Book Hierarchy Integration)
**Version**: 1.0
**Last Updated**: September 19, 2025
**Status**: SPECIFICATION

---

## Table of Contents

1. [POST /api/textbooks/series](#post-apitextbooksseries)
2. [POST /api/textbooks/books](#post-apitextbooksbooks)
3. [POST /api/textbooks/chapters/bulk](#post-apitextbookschaptersbulk)
4. [POST /api/textbooks/upload](#post-apitextbooksupload)
5. [GET /api/textbooks/hierarchy](#get-apitextbookshierarchy)
6. [Common Types](#common-types)

---

## POST /api/textbooks/series

Create a new book series with curriculum_id Foreign Key integration.

### Endpoint

```
POST /api/textbooks/series
```

### Authentication

Required. User must be authenticated via Supabase Auth.

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body Schema

```typescript
interface CreateSeriesRequest {
  seriesName: string;      // Required, max 255 chars
  publisher: string;       // Required, max 255 chars
  curriculumId: string;    // Required, UUID FK to curriculum_data
  description?: string;    // Optional
}
```

#### Example Request

```json
{
  "seriesName": "NCERT Mathematics",
  "publisher": "NCERT",
  "curriculumId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "description": "Complete NCERT Mathematics series for CBSE curriculum"
}
```

### Response

#### Success Response (201 Created)

```typescript
interface CreateSeriesResponse {
  success: true;
  data: {
    seriesId: string;  // UUID of created series
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Example Success Response

```json
{
  "success": true,
  "data": {
    "seriesId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "metadata": {
    "timestamp": "2025-09-19T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Required Field

```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "seriesName is required",
    "timestamp": "2025-09-19T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### 400 Bad Request - Foreign Key Violation

```json
{
  "success": false,
  "error": {
    "code": "FOREIGN_KEY_VIOLATION",
    "message": "curriculum_id does not exist in curriculum_data table",
    "details": {
      "table": "book_series",
      "column": "curriculum_id",
      "reference": "curriculum_data.id"
    },
    "timestamp": "2025-09-19T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Please sign in to continue",
    "timestamp": "2025-09-19T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### 409 Conflict - Duplicate Series

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "A series with this name and publisher already exists for this curriculum",
    "details": {
      "constraint": "book_series_series_name_publisher_curriculum_id_key"
    },
    "timestamp": "2025-09-19T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Database Operations

```sql
-- Inserts record into book_series table
INSERT INTO public.book_series (
  id,
  series_name,
  publisher,
  curriculum_id,
  description,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  $1,  -- seriesName
  $2,  -- publisher
  $3,  -- curriculumId (FK validated)
  $4,  -- description
  NOW(),
  NOW()
)
RETURNING id;

-- FK constraint validates curriculum_id exists:
-- FOREIGN KEY (curriculum_id) REFERENCES public.curriculum_data(id) ON DELETE RESTRICT
```

### Rate Limiting

- **Limit**: 10 series creations per hour per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## POST /api/textbooks/books

Create a new book within an existing book series.

### Endpoint

```
POST /api/textbooks/books
```

### Authentication

Required. User must be authenticated via Supabase Auth.

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body Schema

```typescript
interface CreateBookRequest {
  seriesId: string;          // Required, UUID FK to book_series
  volumeNumber: number;      // Required, positive integer
  volumeTitle: string;       // Required, max 255 chars
  edition?: string;          // Optional
  authors: string[];         // Required, array of author names
  isbn?: string;             // Optional, ISBN format (10 or 13 digits)
  publicationYear?: number;  // Optional, 4-digit year
  totalPages?: number;       // Optional, positive integer
}
```

#### Example Request

```json
{
  "seriesId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "volumeNumber": 1,
  "volumeTitle": "Class 10 Mathematics",
  "edition": "2024",
  "authors": ["NCERT"],
  "isbn": "978-81-7450-XXX-X",
  "publicationYear": 2024,
  "totalPages": 325
}
```

### Response

#### Success Response (201 Created)

```typescript
interface CreateBookResponse {
  success: true;
  data: {
    bookId: string;  // UUID of created book
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Example Success Response

```json
{
  "success": true,
  "data": {
    "bookId": "b2c3d4e5-f6g7-8901-bcde-f12345678901"
  },
  "metadata": {
    "timestamp": "2025-09-19T10:31:00Z",
    "requestId": "req_def456"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid seriesId

```json
{
  "success": false,
  "error": {
    "code": "FOREIGN_KEY_VIOLATION",
    "message": "seriesId does not exist in book_series table",
    "details": {
      "table": "books",
      "column": "series_id",
      "reference": "book_series.id"
    },
    "timestamp": "2025-09-19T10:31:00Z",
    "requestId": "req_def456"
  }
}
```

#### 400 Bad Request - Invalid Volume Number

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "volumeNumber must be a positive integer",
    "details": {
      "field": "volumeNumber",
      "value": -1,
      "constraint": "CHECK (volume_number > 0)"
    },
    "timestamp": "2025-09-19T10:31:00Z",
    "requestId": "req_def456"
  }
}
```

#### 409 Conflict - Duplicate Volume

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "A book with this volume number already exists in this series",
    "details": {
      "constraint": "books_series_id_volume_number_key"
    },
    "timestamp": "2025-09-19T10:31:00Z",
    "requestId": "req_def456"
  }
}
```

### Database Operations

```sql
-- Inserts record into books table
INSERT INTO public.books (
  id,
  series_id,
  volume_number,
  volume_title,
  isbn,
  edition,
  publication_year,
  authors,
  total_pages,
  file_name,
  file_size_mb,
  uploaded_at,
  processed_at,
  status,
  error_message,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  $1,  -- seriesId (FK validated)
  $2,  -- volumeNumber
  $3,  -- volumeTitle
  $4,  -- isbn
  $5,  -- edition
  $6,  -- publicationYear
  $7,  -- authors (TEXT[] array)
  $8,  -- totalPages
  NULL,  -- file_name (set during upload)
  NULL,  -- file_size_mb (set during upload)
  NOW(),
  NULL,  -- processed_at (set after processing)
  'pending',  -- status
  NULL,  -- error_message
  NOW(),
  NOW()
)
RETURNING id;

-- FK constraint validates series_id exists:
-- FOREIGN KEY (series_id) REFERENCES public.book_series(id) ON DELETE CASCADE
```

---

## POST /api/textbooks/chapters/bulk

Create multiple chapters for a book in a single request.

### Endpoint

```
POST /api/textbooks/chapters/bulk
```

### Authentication

Required. User must be authenticated via Supabase Auth.

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body Schema

```typescript
interface CreateChaptersBulkRequest {
  bookId: string;  // Required, UUID FK to books
  chapters: ChapterInput[];  // Required, array of 1-50 chapters
}

interface ChapterInput {
  chapterNumber: number;  // Required, positive integer, unique per book
  title: string;          // Required, max 255 chars
  description?: string;   // Optional
  startPage?: number;     // Optional, positive integer
  endPage?: number;       // Optional, positive integer >= startPage
  estimatedDuration?: number;  // Optional, minutes, positive integer
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  topics?: string[];      // Optional, array of topic strings
  learningObjectives?: string[];  // Optional, array of objectives
  fileName?: string;      // Optional, PDF file name for this chapter
}
```

#### Example Request

```json
{
  "bookId": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Real Numbers",
      "description": "Introduction to real number system",
      "startPage": 1,
      "endPage": 18,
      "estimatedDuration": 60,
      "difficultyLevel": "intermediate",
      "topics": ["Number Systems", "Euclid's Division Algorithm"],
      "learningObjectives": [
        "Understand fundamental theorem of arithmetic",
        "Apply Euclid's division lemma"
      ],
      "fileName": "chapter-01-real-numbers.pdf"
    },
    {
      "chapterNumber": 2,
      "title": "Polynomials",
      "description": "Algebraic expressions and polynomial operations",
      "startPage": 19,
      "endPage": 35,
      "estimatedDuration": 75,
      "difficultyLevel": "intermediate",
      "topics": ["Algebra", "Polynomial Division"],
      "learningObjectives": [
        "Factor polynomials",
        "Apply remainder theorem"
      ],
      "fileName": "chapter-02-polynomials.pdf"
    }
  ]
}
```

### Response

#### Success Response (201 Created)

```typescript
interface CreateChaptersBulkResponse {
  success: true;
  data: {
    chapterIds: string[];  // Array of UUIDs for created chapters
    chaptersCreated: number;
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Example Success Response

```json
{
  "success": true,
  "data": {
    "chapterIds": [
      "c3d4e5f6-g7h8-9012-cdef-123456789012",
      "d4e5f6g7-h8i9-0123-defg-234567890123"
    ],
    "chaptersCreated": 2
  },
  "metadata": {
    "timestamp": "2025-09-19T10:32:00Z",
    "requestId": "req_ghi789"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid bookId

```json
{
  "success": false,
  "error": {
    "code": "FOREIGN_KEY_VIOLATION",
    "message": "bookId does not exist in books table",
    "details": {
      "table": "book_chapters",
      "column": "book_id",
      "reference": "books.id"
    },
    "timestamp": "2025-09-19T10:32:00Z",
    "requestId": "req_ghi789"
  }
}
```

#### 400 Bad Request - Invalid Page Range

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "endPage must be greater than or equal to startPage",
    "details": {
      "chapterNumber": 1,
      "startPage": 18,
      "endPage": 1,
      "constraint": "CHECK (end_page >= start_page)"
    },
    "timestamp": "2025-09-19T10:32:00Z",
    "requestId": "req_ghi789"
  }
}
```

#### 400 Bad Request - Too Many Chapters

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Maximum 50 chapters allowed per request",
    "details": {
      "provided": 75,
      "maximum": 50
    },
    "timestamp": "2025-09-19T10:32:00Z",
    "requestId": "req_ghi789"
  }
}
```

#### 409 Conflict - Duplicate Chapter Number

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "A chapter with this number already exists in this book",
    "details": {
      "chapterNumber": 1,
      "constraint": "book_chapters_book_id_chapter_number_key"
    },
    "timestamp": "2025-09-19T10:32:00Z",
    "requestId": "req_ghi789"
  }
}
```

### Database Operations

```sql
-- Bulk insert chapters using array_agg for efficiency
INSERT INTO public.book_chapters (
  id,
  book_id,
  chapter_number,
  title,
  description,
  start_page,
  end_page,
  estimated_duration_minutes,
  difficulty_level,
  topics,
  learning_objectives,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  $1,  -- bookId (FK validated)
  unnest($2::INTEGER[]),  -- chapterNumbers array
  unnest($3::TEXT[]),     -- titles array
  unnest($4::TEXT[]),     -- descriptions array
  unnest($5::INTEGER[]),  -- startPages array
  unnest($6::INTEGER[]),  -- endPages array
  unnest($7::INTEGER[]),  -- durations array
  unnest($8::TEXT[]),     -- difficultyLevels array
  unnest($9::TEXT[][]),   -- topics array (2D array)
  unnest($10::TEXT[][]),  -- objectives array (2D array)
  NOW(),
  NOW()
RETURNING id;

-- FK constraint validates book_id exists:
-- FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE
```

---

## POST /api/textbooks/upload

Upload PDF files for a book. Files are stored in Supabase Storage and linked to book record.

### Endpoint

```
POST /api/textbooks/upload
```

### Authentication

Required. User must be authenticated via Supabase Auth.

### Request

#### Headers

```http
Content-Type: multipart/form-data
```

#### Body Schema (Form Data)

```typescript
interface UploadFilesRequest {
  bookId: string;              // Required, UUID FK to books
  file_0: File;                // Required, PDF file (first file)
  file_1?: File;               // Optional, PDF file (second file)
  file_2?: File;               // Optional, PDF file (third file)
  // ... up to file_49 (max 50 files)
}
```

#### File Constraints

- **File Type**: PDF only (`application/pdf`)
- **Max File Size**: 50 MB per file
- **Max Files**: 50 files per request
- **Total Upload Size**: 500 MB per request
- **Filename**: Alphanumeric, hyphens, underscores only (auto-sanitized)

#### Example Request (JavaScript)

```javascript
const formData = new FormData();
formData.append('bookId', 'b2c3d4e5-f6g7-8901-bcde-f12345678901');

files.forEach((file, index) => {
  formData.append(`file_${index}`, file);
});

const response = await fetch('/api/textbooks/upload', {
  method: 'POST',
  body: formData  // NO Content-Type header (browser sets it automatically)
});
```

### Response

#### Success Response (200 OK)

```typescript
interface UploadFilesResponse {
  success: true;
  data: {
    filesUploaded: string[];  // Array of uploaded filenames
    uploadPaths: string[];    // Array of storage paths
    totalSize: number;        // Total bytes uploaded
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Example Success Response

```json
{
  "success": true,
  "data": {
    "filesUploaded": [
      "chapter-01-real-numbers.pdf",
      "chapter-02-polynomials.pdf"
    ],
    "uploadPaths": [
      "textbooks/b2c3d4e5-f6g7-8901-bcde-f12345678901/chapter-01-real-numbers.pdf",
      "textbooks/b2c3d4e5-f6g7-8901-bcde-f12345678901/chapter-02-polynomials.pdf"
    ],
    "totalSize": 45678901
  },
  "metadata": {
    "timestamp": "2025-09-19T10:33:00Z",
    "requestId": "req_jkl012"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid File Type

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only PDF files are allowed",
    "details": {
      "fileName": "document.docx",
      "providedType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "allowedTypes": ["application/pdf"]
    },
    "timestamp": "2025-09-19T10:33:00Z",
    "requestId": "req_jkl012"
  }
}
```

#### 400 Bad Request - File Too Large

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds maximum size of 50 MB",
    "details": {
      "fileName": "huge-textbook.pdf",
      "fileSize": 75000000,
      "maxSize": 52428800
    },
    "timestamp": "2025-09-19T10:33:00Z",
    "requestId": "req_jkl012"
  }
}
```

#### 429 Too Many Requests - Rate Limit

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Upload limit exceeded. Please try again in 45 minutes.",
    "details": {
      "resetIn": 2700,
      "resetAt": "2025-09-19T11:18:00Z",
      "limit": 10,
      "current": 15
    },
    "timestamp": "2025-09-19T10:33:00Z",
    "requestId": "req_jkl012"
  }
}
```

### Storage Operations

```typescript
// Files are stored in Supabase Storage bucket: 'textbooks'
// Path format: textbooks/{bookId}/{sanitized-filename}.pdf

// Example storage path:
// textbooks/b2c3d4e5-f6g7-8901-bcde-f12345678901/chapter-01-real-numbers.pdf

// Database update after successful upload:
UPDATE public.books
SET
  file_name = $1,        -- Primary file name (first uploaded file)
  file_size_mb = $2,     -- Total size in MB
  uploaded_at = NOW(),
  status = 'processing'  -- Triggers background processing
WHERE id = $3
RETURNING id;
```

---

## GET /api/textbooks/hierarchy

Retrieve all book series with complete hierarchy (books → chapters) for the authenticated user.

### Endpoint

```
GET /api/textbooks/hierarchy
```

### Authentication

Required. User must be authenticated via Supabase Auth.

### Request

#### Query Parameters

None required. Optionally:

```typescript
interface GetHierarchyQuery {
  include?: 'books' | 'chapters' | 'all';  // Default: 'all'
  seriesId?: string;  // Filter by specific series UUID
}
```

#### Example Request

```http
GET /api/textbooks/hierarchy
GET /api/textbooks/hierarchy?include=all
GET /api/textbooks/hierarchy?seriesId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Response

#### Success Response (200 OK)

```typescript
interface GetHierarchyResponse {
  success: true;
  data: BookSeriesWithHierarchy[];
  metadata: {
    timestamp: string;
    requestId: string;
    totalSeries: number;
  };
}

interface BookSeriesWithHierarchy {
  id: string;
  series_name: string;
  publisher: string;
  curriculum_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;

  // JOIN with curriculum_data (single source of truth)
  curriculum: {
    id: string;
    grade_level: string;  // e.g., "Class 10"
    subject_name: string;  // e.g., "Mathematics"
    board: string;  // e.g., "CBSE"
    curriculum_type: string;  // e.g., "K-12"
  };

  // Nested books array
  books: Array<{
    id: string;
    series_id: string;
    volume_number: number;
    volume_title: string | null;
    isbn: string | null;
    edition: string | null;
    publication_year: number | null;
    authors: string[];
    total_pages: number | null;
    file_name: string | null;
    file_size_mb: number | null;
    uploaded_at: string;
    processed_at: string | null;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    error_message: string | null;
    created_at: string;
    updated_at: string;

    // Nested chapters array
    chapters: Array<{
      id: string;
      book_id: string;
      chapter_number: number;
      title: string;
      description: string | null;
      start_page: number | null;
      end_page: number | null;
      estimated_duration_minutes: number | null;
      difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
      topics: string[];
      learning_objectives: string[];
      created_at: string;
      updated_at: string;
    }>;
  }>;
}
```

#### Example Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "series_name": "NCERT Mathematics",
      "publisher": "NCERT",
      "curriculum_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "description": "Complete NCERT Mathematics series",
      "created_at": "2025-09-19T10:30:00Z",
      "updated_at": "2025-09-19T10:30:00Z",
      "curriculum": {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "grade_level": "Class 10",
        "subject_name": "Mathematics",
        "board": "CBSE",
        "curriculum_type": "K-12"
      },
      "books": [
        {
          "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
          "series_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "volume_number": 1,
          "volume_title": "Class 10 Mathematics",
          "isbn": "978-81-7450-XXX-X",
          "edition": "2024",
          "publication_year": 2024,
          "authors": ["NCERT"],
          "total_pages": 325,
          "file_name": "class-10-mathematics.pdf",
          "file_size_mb": 45.6,
          "uploaded_at": "2025-09-19T10:33:00Z",
          "processed_at": "2025-09-19T10:35:00Z",
          "status": "ready",
          "error_message": null,
          "created_at": "2025-09-19T10:31:00Z",
          "updated_at": "2025-09-19T10:35:00Z",
          "chapters": [
            {
              "id": "c3d4e5f6-g7h8-9012-cdef-123456789012",
              "book_id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
              "chapter_number": 1,
              "title": "Real Numbers",
              "description": "Introduction to real number system",
              "start_page": 1,
              "end_page": 18,
              "estimated_duration_minutes": 60,
              "difficulty_level": "intermediate",
              "topics": ["Number Systems", "Euclid's Division Algorithm"],
              "learning_objectives": [
                "Understand fundamental theorem of arithmetic",
                "Apply Euclid's division lemma"
              ],
              "created_at": "2025-09-19T10:32:00Z",
              "updated_at": "2025-09-19T10:32:00Z"
            }
          ]
        }
      ]
    }
  ],
  "metadata": {
    "timestamp": "2025-09-19T10:40:00Z",
    "requestId": "req_mno345",
    "totalSeries": 1
  }
}
```

### Database Query

```sql
-- Fetches complete hierarchy with JOINs
SELECT
  bs.*,
  row_to_json(cd.*) AS curriculum,
  COALESCE(
    json_agg(
      json_build_object(
        'id', b.id,
        'series_id', b.series_id,
        'volume_number', b.volume_number,
        'volume_title', b.volume_title,
        -- ... all book fields
        'chapters', (
          SELECT COALESCE(json_agg(bc.*), '[]'::json)
          FROM book_chapters bc
          WHERE bc.book_id = b.id
          ORDER BY bc.chapter_number
        )
      )
    ) FILTER (WHERE b.id IS NOT NULL),
    '[]'::json
  ) AS books
FROM book_series bs
LEFT JOIN curriculum_data cd ON bs.curriculum_id = cd.id
LEFT JOIN books b ON b.series_id = bs.id
WHERE bs.user_id = $1  -- Authenticated user
GROUP BY bs.id, cd.id
ORDER BY bs.created_at DESC;
```

---

## Common Types

### Error Response

All error responses follow this structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}

type ErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'MISSING_REQUIRED_FIELD'
  | 'DATABASE_ERROR'
  | 'FILE_PROCESSING_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'FOREIGN_KEY_VIOLATION'
  | 'DUPLICATE_ENTRY'
  | 'FILE_TOO_LARGE'
  | 'INTERNAL_SERVER_ERROR';
```

### Status Enums

```typescript
type BookStatus = 'pending' | 'processing' | 'ready' | 'failed';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
```

### Rate Limit Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1695123600
X-Request-ID: req_abc123
```

---

## TypeScript Client Example

```typescript
import type {
  CreateSeriesRequest,
  CreateBookRequest,
  CreateChaptersBulkRequest,
  UploadFilesRequest
} from '@/types/api/textbook-upload';

class TextbookUploadClient {
  async createSeries(data: CreateSeriesRequest): Promise<string> {
    const response = await fetch('/api/textbooks/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const result = await response.json();
    return result.data.seriesId;
  }

  async createBook(data: CreateBookRequest): Promise<string> {
    const response = await fetch('/api/textbooks/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const result = await response.json();
    return result.data.bookId;
  }

  async createChapters(data: CreateChaptersBulkRequest): Promise<string[]> {
    const response = await fetch('/api/textbooks/chapters/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const result = await response.json();
    return result.data.chapterIds;
  }

  async uploadFiles(bookId: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    formData.append('bookId', bookId);

    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    const response = await fetch('/api/textbooks/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const result = await response.json();
    return result.data.filesUploaded;
  }
}
```

---

**Version**: 1.0
**Last Updated**: September 19, 2025
**Maintainer**: Agent A4-D3 (API Integration Guide & Examples)
