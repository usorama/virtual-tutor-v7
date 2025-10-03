# RAG Implementation Roadmap
**Based on Agent 7A Analysis** | 2025-10-03

---

## Phase 1: Database Infrastructure (Days 1-3)

### Task 1.1: Create pgvector Migration ✅
**File**: `pinglearn-app/supabase/migrations/006_enable_pgvector.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to existing content_chunks table
ALTER TABLE public.content_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(768),
  ADD COLUMN IF NOT EXISTS has_embedding BOOLEAN DEFAULT FALSE;

-- Add metadata for embedding tracking
ALTER TABLE public.content_chunks
  ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'text-embedding-004',
  ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;

-- Create vector similarity search index (HNSW for speed)
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding
  ON public.content_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_content_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_grade int DEFAULT NULL,
  filter_subject text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  content_type text,
  page_number int,
  chapter_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.content,
    cc.content_type,
    cc.page_number,
    cc.chapter_id,
    1 - (cc.embedding <=> query_embedding) as similarity
  FROM content_chunks cc
  INNER JOIN chapters c ON cc.chapter_id = c.id
  INNER JOIN textbooks t ON c.textbook_id = t.id
  WHERE
    cc.has_embedding = true
    AND (filter_grade IS NULL OR t.grade = filter_grade)
    AND (filter_subject IS NULL OR t.subject = filter_subject)
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create hybrid search function (vector + keyword)
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_embedding vector(768),
  query_text text,
  match_count int DEFAULT 5,
  filter_grade int DEFAULT NULL,
  filter_subject text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  keyword_rank float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT
      cc.id,
      cc.content,
      1 - (cc.embedding <=> query_embedding) as similarity
    FROM content_chunks cc
    INNER JOIN chapters c ON cc.chapter_id = c.id
    INNER JOIN textbooks t ON c.textbook_id = t.id
    WHERE
      cc.has_embedding = true
      AND (filter_grade IS NULL OR t.grade = filter_grade)
      AND (filter_subject IS NULL OR t.subject = filter_subject)
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      cc.id,
      ts_rank(to_tsvector('english', cc.content), plainto_tsquery('english', query_text)) as rank
    FROM content_chunks cc
    INNER JOIN chapters c ON cc.chapter_id = c.id
    INNER JOIN textbooks t ON c.textbook_id = t.id
    WHERE
      to_tsvector('english', cc.content) @@ plainto_tsquery('english', query_text)
      AND (filter_grade IS NULL OR t.grade = filter_grade)
      AND (filter_subject IS NULL OR t.subject = filter_subject)
  )
  SELECT
    vs.id,
    vs.content,
    vs.similarity,
    COALESCE(ks.rank, 0) as keyword_rank,
    (vs.similarity * 0.7 + COALESCE(ks.rank, 0) * 0.3) as combined_score
  FROM vector_search vs
  LEFT JOIN keyword_search ks ON vs.id = ks.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_textbooks_grade_subject ON public.textbooks(grade, subject);
CREATE INDEX IF NOT EXISTS idx_content_chunks_has_embedding ON public.content_chunks(has_embedding) WHERE has_embedding = true;

-- Create full-text search index for hybrid search
CREATE INDEX IF NOT EXISTS idx_content_chunks_fulltext ON public.content_chunks USING gin(to_tsvector('english', content));

COMMENT ON EXTENSION vector IS 'pgvector extension for storing and searching embeddings';
COMMENT ON COLUMN content_chunks.embedding IS 'Vector embedding (768 dimensions) from Google text-embedding-004 model';
COMMENT ON FUNCTION match_content_chunks IS 'Semantic similarity search using cosine distance';
COMMENT ON FUNCTION hybrid_search_chunks IS 'Hybrid search combining vector similarity and keyword matching';
```

**Run Migration**:
```bash
cd pinglearn-app
# Backup first
pg_dump -h <supabase-host> -U postgres > backup_before_pgvector.sql

# Apply migration via Supabase dashboard or CLI
supabase db push
```

**Verification**:
```sql
-- Check extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'content_chunks' AND column_name IN ('embedding', 'has_embedding');

-- Check function
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('match_content_chunks', 'hybrid_search_chunks');
```

---

### Task 1.2: Fix SF-001 Silent Failures ⚠️
**File**: `pinglearn-app/src/lib/embeddings/generator.ts`

**Changes Required** (Lines 92-169):

```typescript
// Add result tracking interface
interface EmbeddingResult {
  chunkId: string;
  success: boolean;
  error?: string;
  embedding?: number[];
}

interface EmbeddingStatus {
  totalChunks: number;
  successfulEmbeddings: number;
  failedEmbeddings: number;
  errors: Array<{ chunkId: string; error: string }>;
  startedAt: string;
  completedAt?: string;
}

/**
 * Generate and store embeddings for textbook content chunks
 * ENHANCED: Comprehensive error tracking and reporting
 */
async generateTextbookEmbeddings(textbookId: string): Promise<EmbeddingStatus> {
  const supabase = await createClient();

  const status: EmbeddingStatus = {
    totalChunks: 0,
    successfulEmbeddings: 0,
    failedEmbeddings: 0,
    errors: [],
    startedAt: new Date().toISOString()
  };

  try {
    console.log(`🔄 Generating embeddings for textbook ${textbookId}...`);

    // Fetch content chunks for this textbook
    const { data: chunks, error: fetchError } = await supabase
      .from('content_chunks')
      .select('*')
      .eq('textbook_id', textbookId)
      .order('sequence_number', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch content chunks: ${fetchError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      console.log(`ℹ️ No content chunks found for textbook ${textbookId}`);
      status.completedAt = new Date().toISOString();
      return status;
    }

    status.totalChunks = chunks.length;
    console.log(`📝 Processing ${chunks.length} content chunks...`);

    const results: EmbeddingResult[] = [];

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk.content);

        // Store embedding in the database
        const { error: updateError } = await supabase
          .from('content_chunks')
          .update({
            embedding: embedding,
            has_embedding: true,
            embedding_model: 'text-embedding-004',
            embedding_generated_at: new Date().toISOString()
          })
          .eq('id', chunk.id);

        if (updateError) {
          // DATABASE UPDATE FAILED
          console.error(`❌ Failed to store embedding for chunk ${chunk.id}:`, updateError);
          results.push({
            chunkId: chunk.id,
            success: false,
            error: `Database update failed: ${updateError.message}`
          });
          status.failedEmbeddings++;
          status.errors.push({
            chunkId: chunk.id,
            error: updateError.message
          });
        } else {
          // SUCCESS
          console.log(`✅ Generated embedding for chunk ${chunk.id}`);
          results.push({
            chunkId: chunk.id,
            success: true,
            embedding
          });
          status.successfulEmbeddings++;
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (chunkError) {
        // EMBEDDING GENERATION FAILED
        const errorMessage = chunkError instanceof Error ? chunkError.message : 'Unknown error';
        console.error(`❌ Failed to generate embedding for chunk ${chunk.id}:`, errorMessage);
        results.push({
          chunkId: chunk.id,
          success: false,
          error: `Generation failed: ${errorMessage}`
        });
        status.failedEmbeddings++;
        status.errors.push({
          chunkId: chunk.id,
          error: errorMessage
        });
      }
    }

    status.completedAt = new Date().toISOString();

    // Update textbook status with detailed results
    const processingStatus = status.failedEmbeddings === 0
      ? 'embeddings_complete'
      : status.successfulEmbeddings === 0
        ? 'embedding_failed'
        : 'embedding_partial';

    await supabase
      .from('textbooks')
      .update({
        has_embeddings: status.successfulEmbeddings > 0,
        processing_status: processingStatus,
        embedding_status: status,
        error_message: status.failedEmbeddings > 0
          ? `${status.failedEmbeddings} chunks failed to generate embeddings`
          : null
      })
      .eq('id', textbookId);

    // Log final summary
    console.log(`\n📊 Embedding Generation Summary for textbook ${textbookId}:`);
    console.log(`   Total chunks: ${status.totalChunks}`);
    console.log(`   ✅ Successful: ${status.successfulEmbeddings}`);
    console.log(`   ❌ Failed: ${status.failedEmbeddings}`);
    console.log(`   Success rate: ${((status.successfulEmbeddings / status.totalChunks) * 100).toFixed(1)}%`);

    if (status.failedEmbeddings > 0) {
      console.error(`\n⚠️ WARNING: ${status.failedEmbeddings} embeddings failed. See error details above.`);
      console.error('First 3 errors:', status.errors.slice(0, 3));
    }

    // If ALL failed, throw error
    if (status.successfulEmbeddings === 0 && status.totalChunks > 0) {
      throw new Error(
        `All ${status.totalChunks} embeddings failed. First error: ${status.errors[0]?.error}`
      );
    }

    return status;

  } catch (error) {
    console.error(`💥 Critical error in generateTextbookEmbeddings:`, error);

    // Update textbook to indicate complete failure
    await supabase
      .from('textbooks')
      .update({
        processing_status: 'embedding_failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        embedding_status: {
          ...status,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', textbookId);

    throw error;
  }
}
```

**Also Update** `textbooks` table schema:
```sql
-- Add embedding_status column to track detailed status
ALTER TABLE public.textbooks
  ADD COLUMN IF NOT EXISTS embedding_status JSONB;

COMMENT ON COLUMN textbooks.embedding_status IS 'Detailed embedding generation status with success/failure counts';
```

---

### Task 1.3: Test Embedding Storage 🧪
**File**: `pinglearn-app/src/tests/embeddings/generator.test.ts` (NEW)

```typescript
import { EmbeddingGenerator } from '@/lib/embeddings/generator';
import { createClient } from '@/lib/supabase/server';

describe('Embedding Generator with pgvector', () => {
  let generator: EmbeddingGenerator;
  let supabase: any;

  beforeAll(async () => {
    generator = new EmbeddingGenerator();
    supabase = await createClient();
  });

  it('should generate 768-dimensional embedding', async () => {
    const embedding = await generator.generateEmbedding('Test content for embedding');

    expect(embedding).toBeInstanceOf(Array);
    expect(embedding.length).toBe(768); // text-embedding-004 dimension
    expect(typeof embedding[0]).toBe('number');
  });

  it('should store embedding in database', async () => {
    // Create test chunk
    const { data: testChunk, error: insertError } = await supabase
      .from('content_chunks')
      .insert({
        content: 'Test content for storage',
        chunk_index: 999,
        chapter_id: 'test-chapter-id'
      })
      .select()
      .single();

    expect(insertError).toBeNull();

    // Generate and store embedding
    const embedding = await generator.generateEmbedding(testChunk.content);

    const { error: updateError } = await supabase
      .from('content_chunks')
      .update({
        embedding: embedding,
        has_embedding: true,
        embedding_model: 'text-embedding-004'
      })
      .eq('id', testChunk.id);

    expect(updateError).toBeNull();

    // Verify storage
    const { data: verifyChunk, error: verifyError } = await supabase
      .from('content_chunks')
      .select('embedding, has_embedding, embedding_model')
      .eq('id', testChunk.id)
      .single();

    expect(verifyError).toBeNull();
    expect(verifyChunk.has_embedding).toBe(true);
    expect(verifyChunk.embedding_model).toBe('text-embedding-004');
    expect(verifyChunk.embedding).toHaveLength(768);

    // Cleanup
    await supabase.from('content_chunks').delete().eq('id', testChunk.id);
  });

  it('should perform vector similarity search', async () => {
    // Create test chunks with embeddings
    const testContent = [
      'Quadratic equations are polynomial equations of degree 2',
      'The formula for solving quadratic equations is x = (-b ± √(b²-4ac)) / 2a',
      'Linear equations have degree 1'
    ];

    const testChunkIds: string[] = [];

    for (let i = 0; i < testContent.length; i++) {
      const embedding = await generator.generateEmbedding(testContent[i]);

      const { data: chunk, error } = await supabase
        .from('content_chunks')
        .insert({
          content: testContent[i],
          chunk_index: 1000 + i,
          chapter_id: 'test-chapter-id',
          embedding: embedding,
          has_embedding: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      testChunkIds.push(chunk.id);
    }

    // Search for similar content
    const queryEmbedding = await generator.generateEmbedding('How to solve quadratic equations?');

    const { data: searchResults, error: searchError } = await supabase
      .rpc('match_content_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 2
      });

    expect(searchError).toBeNull();
    expect(searchResults).toHaveLength(2);
    expect(searchResults[0].content).toContain('quadratic');
    expect(searchResults[0].similarity).toBeGreaterThan(0.6);

    // Cleanup
    await supabase.from('content_chunks').delete().in('id', testChunkIds);
  });
});
```

---

## Phase 2: RAG Core Services (Days 4-7)

### Task 2.1: Query Embedding Service 🔍
**File**: `pinglearn-app/src/lib/rag/query-embedder.ts` (NEW)

```typescript
import { EmbeddingGenerator } from '@/lib/embeddings/generator';

/**
 * Query Embedding Service
 * Generates embeddings for search queries
 */
export class QueryEmbedder {
  private generator: EmbeddingGenerator;
  private cache: Map<string, number[]>;

  constructor() {
    this.generator = new EmbeddingGenerator();
    this.cache = new Map();
  }

  /**
   * Generate embedding for query with caching
   */
  async embedQuery(query: string): Promise<number[]> {
    // Normalize query for cache key
    const normalizedQuery = query.toLowerCase().trim();

    // Check cache
    const cached = this.cache.get(normalizedQuery);
    if (cached) {
      console.log('🎯 Query embedding cache hit');
      return cached;
    }

    // Generate embedding
    console.log('🔄 Generating query embedding...');
    const embedding = await this.generator.generateEmbedding(query);

    // Cache for future use (limit cache size)
    if (this.cache.size > 100) {
      // Clear oldest entries
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(normalizedQuery, embedding);

    return embedding;
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const queryEmbedder = new QueryEmbedder();
```

---

### Task 2.2: Semantic Search Service 🔎
**File**: `pinglearn-app/src/lib/rag/semantic-search.ts` (NEW)

```typescript
import { createClient } from '@/lib/supabase/server';
import { queryEmbedder } from './query-embedder';

export interface SearchFilters {
  grade?: number;
  subject?: string;
  topic?: string;
  chapterId?: string;
  contentType?: string[];
}

export interface SearchResult {
  id: string;
  content: string;
  contentType: string;
  pageNumber?: number;
  chapterId: string;
  similarity: float;
  metadata?: {
    chapterTitle?: string;
    textbookTitle?: string;
    topics?: string[];
  };
}

export interface SearchOptions {
  matchThreshold?: number;
  matchCount?: number;
  useHybrid?: boolean;
}

/**
 * Semantic Search Service
 * Performs vector similarity search on textbook content
 */
export class SemanticSearchService {
  /**
   * Search for relevant content chunks
   */
  async search(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const supabase = await createClient();

    const {
      matchThreshold = 0.7,
      matchCount = 5,
      useHybrid = false
    } = options;

    // Generate query embedding
    const queryEmbedding = await queryEmbedder.embedQuery(query);

    // Choose search function
    const searchFunction = useHybrid ? 'hybrid_search_chunks' : 'match_content_chunks';

    // Execute search
    const { data: results, error } = await supabase.rpc(searchFunction, {
      query_embedding: queryEmbedding,
      query_text: useHybrid ? query : undefined,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_grade: filters.grade,
      filter_subject: filters.subject
    });

    if (error) {
      console.error('Semantic search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!results || results.length === 0) {
      console.log('No relevant content found');
      return [];
    }

    // Enrich results with metadata
    const enrichedResults: SearchResult[] = await this.enrichResults(results, supabase);

    console.log(`✅ Found ${enrichedResults.length} relevant chunks (similarity > ${matchThreshold})`);

    return enrichedResults;
  }

  /**
   * Enrich search results with chapter/textbook metadata
   */
  private async enrichResults(
    results: any[],
    supabase: any
  ): Promise<SearchResult[]> {
    const chapterIds = [...new Set(results.map(r => r.chapter_id))];

    // Fetch chapter and textbook info
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        topics,
        textbooks (
          id,
          title,
          grade,
          subject
        )
      `)
      .in('id', chapterIds);

    if (error) {
      console.error('Error enriching results:', error);
      return results;
    }

    // Create lookup map
    const chapterMap = new Map(chapters.map((c: any) => [c.id, c]));

    // Enrich results
    return results.map(result => {
      const chapter = chapterMap.get(result.chapter_id);

      return {
        id: result.id,
        content: result.content,
        contentType: result.content_type,
        pageNumber: result.page_number,
        chapterId: result.chapter_id,
        similarity: result.similarity,
        metadata: chapter ? {
          chapterTitle: chapter.title,
          textbookTitle: chapter.textbooks?.title,
          topics: chapter.topics
        } : undefined
      };
    });
  }

  /**
   * Search with automatic fallback to lower threshold
   */
  async searchWithFallback(
    query: string,
    filters: SearchFilters = {},
    initialThreshold: number = 0.75
  ): Promise<SearchResult[]> {
    let results = await this.search(query, filters, {
      matchThreshold: initialThreshold,
      matchCount: 5
    });

    // If no results, try lower threshold
    if (results.length === 0 && initialThreshold > 0.5) {
      console.log('⚠️ No results at high threshold, trying lower threshold...');
      results = await this.search(query, filters, {
        matchThreshold: 0.6,
        matchCount: 5
      });
    }

    // If still no results, try hybrid search
    if (results.length === 0) {
      console.log('⚠️ No results with vector search, trying hybrid search...');
      results = await this.search(query, filters, {
        matchThreshold: 0.5,
        matchCount: 5,
        useHybrid: true
      });
    }

    return results;
  }
}

// Export singleton
export const semanticSearch = new SemanticSearchService();
```

---

### Task 2.3: Context Builder Service 📝
**File**: `pinglearn-app/src/lib/rag/context-builder.ts` (NEW)

```typescript
import { semanticSearch, type SearchFilters, type SearchResult } from './semantic-search';

export interface RAGContext {
  context: string;
  sources: SearchResult[];
  summary: string;
  relevantTopics: string[];
}

/**
 * Context Builder Service
 * Builds RAG context from search results
 */
export class ContextBuilder {
  /**
   * Build RAG context for AI prompt
   */
  async buildContext(
    query: string,
    filters: SearchFilters = {},
    options: { maxTokens?: number; includeMetadata?: boolean } = {}
  ): Promise<RAGContext> {
    const { maxTokens = 2000, includeMetadata = true } = options;

    // Search for relevant chunks
    const searchResults = await semanticSearch.searchWithFallback(query, filters);

    if (searchResults.length === 0) {
      return {
        context: 'No relevant textbook content found.',
        sources: [],
        summary: 'Unable to find curriculum-aligned content for this query.',
        relevantTopics: []
      };
    }

    // Build context string
    let context = 'RELEVANT TEXTBOOK CONTENT:\n\n';
    let tokenCount = 0;
    const includedSources: SearchResult[] = [];
    const topics = new Set<string>();

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];

      // Estimate tokens (rough: 1 token ≈ 4 chars)
      const estimatedTokens = Math.ceil(result.content.length / 4);

      // Check if adding this would exceed limit
      if (tokenCount + estimatedTokens > maxTokens && i > 0) {
        break;
      }

      // Add source
      context += `[Source ${i + 1}`;

      if (includeMetadata && result.metadata) {
        context += ` - ${result.metadata.chapterTitle}`;
        if (result.pageNumber) {
          context += `, p.${result.pageNumber}`;
        }
        context += ` (Similarity: ${(result.similarity * 100).toFixed(0)}%)`;

        // Collect topics
        result.metadata.topics?.forEach(topic => topics.add(topic));
      }

      context += `]:\n${result.content}\n\n`;

      includedSources.push(result);
      tokenCount += estimatedTokens;
    }

    // Build summary
    const summary = this.buildSummary(includedSources);

    return {
      context,
      sources: includedSources,
      summary,
      relevantTopics: Array.from(topics)
    };
  }

  /**
   * Build summary of retrieved content
   */
  private buildSummary(sources: SearchResult[]): string {
    if (sources.length === 0) {
      return 'No content retrieved.';
    }

    const uniqueChapters = new Set(sources.map(s => s.metadata?.chapterTitle).filter(Boolean));
    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;

    return `Retrieved ${sources.length} relevant content chunk${sources.length > 1 ? 's' : ''} from ${uniqueChapters.size} chapter${uniqueChapters.size > 1 ? 's' : ''} (Average relevance: ${(avgSimilarity * 100).toFixed(0)}%)`;
  }

  /**
   * Build context specifically for notes generation
   */
  async buildNotesContext(
    transcriptSegment: string,
    sessionContext: { grade: number; subject: string; topic: string }
  ): Promise<string> {
    const ragContext = await this.buildContext(transcriptSegment, {
      grade: sessionContext.grade,
      subject: sessionContext.subject
    }, {
      maxTokens: 1000,
      includeMetadata: false
    });

    if (ragContext.sources.length === 0) {
      return '';
    }

    // Format for notes enrichment
    return `\n\n--- TEXTBOOK REFERENCE ---\n${ragContext.context}--- END REFERENCE ---\n`;
  }
}

// Export singleton
export const contextBuilder = new ContextBuilder();
```

---

## Phase 3: Python Agent Integration (Days 8-10)

### Task 3.1: Create RAG API Endpoints 🌐
**File**: `pinglearn-app/src/app/api/rag/search/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { contextBuilder } from '@/lib/rag/context-builder';

export async function POST(request: NextRequest) {
  try {
    const { query, grade, subject, topic, maxTokens } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Build RAG context
    const ragContext = await contextBuilder.buildContext(
      query,
      { grade, subject, topic },
      { maxTokens: maxTokens || 2000 }
    );

    return NextResponse.json({
      success: true,
      context: ragContext.context,
      sources: ragContext.sources,
      summary: ragContext.summary,
      relevantTopics: ragContext.relevantTopics
    });

  } catch (error) {
    console.error('RAG search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

---

### Task 3.2: Python RAG Service 🐍
**File**: `livekit-agent/rag_service.py` (NEW)

```python
import aiohttp
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class RAGService:
    """Service for fetching RAG context from Next.js API"""

    def __init__(self, api_base_url: str = "http://localhost:3006"):
        self.api_base_url = api_base_url
        self.cache: Dict[str, str] = {}

    async def fetch_context(
        self,
        query: str,
        grade: str,
        subject: str,
        topic: str,
        max_tokens: int = 2000
    ) -> Optional[str]:
        """Fetch RAG context for a query"""

        # Check cache
        cache_key = f"{query}:{grade}:{subject}:{topic}"
        if cache_key in self.cache:
            logger.info("RAG cache hit")
            return self.cache[cache_key]

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_base_url}/api/rag/search",
                    json={
                        "query": query,
                        "grade": grade,
                        "subject": subject,
                        "topic": topic,
                        "maxTokens": max_tokens
                    },
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get("success"):
                            context = data.get("context", "")

                            # Cache result
                            if len(self.cache) > 50:
                                # Clear oldest
                                self.cache.pop(next(iter(self.cache)))
                            self.cache[cache_key] = context

                            logger.info(f"✅ RAG context fetched: {len(context)} chars")
                            return context
                        else:
                            logger.error(f"RAG API error: {data.get('error')}")
                    else:
                        logger.error(f"RAG API HTTP error: {response.status}")

        except Exception as e:
            logger.error(f"RAG fetch error: {e}")

        return None

    def clear_cache(self):
        """Clear RAG cache"""
        self.cache.clear()

# Global instance
rag_service = RAGService()
```

---

### Task 3.3: Integrate RAG with Agent 🤖
**File**: `livekit-agent/agent.py`

**Modification** (around line 42):

```python
from rag_service import rag_service  # Add import

# PC-015: Dynamic tutor prompt with RAG context
async def create_tutor_prompt_with_rag(
    grade: str,
    subject: str,
    topic: str,
    student_query: Optional[str] = None
) -> str:
    """
    Generate dynamic system prompt with RAG-retrieved textbook content
    """

    base_prompt = f"""
You are a friendly and patient NCERT tutor for {grade} students in India, specializing in {subject}.

Your teaching approach:
- Use simple, clear explanations suitable for {grade} level students
- Reference the NCERT textbook content provided below
- Encourage and motivate students when they make progress
- Ask clarifying questions to check understanding
- Break down complex problems into smaller steps
- Use real-world examples that Indian students can relate to
- Be patient with mistakes and use them as learning opportunities

Important guidelines:
- Stay focused on {subject} topics, especially {topic}
- Keep responses concise and age-appropriate for {grade} students
- If asked about non-educational topics, politely redirect to learning
- Speak naturally and conversationally, as if tutoring in person
- Use encouraging phrases like "Great question!" or "You're on the right track!"

Current session focus: {topic} from {grade} {subject}
"""

    # Fetch RAG context if student has asked a question
    if student_query:
        rag_context = await rag_service.fetch_context(
            query=student_query,
            grade=grade,
            subject=subject,
            topic=topic,
            max_tokens=1500
        )

        if rag_context:
            base_prompt += f"""

{rag_context}

IMPORTANT: Use the textbook content above to answer accurately. Do not make up information.
If the answer is in the textbook content, cite it. If not, be honest that you need to find that information.
"""
        else:
            logger.warning("No RAG context retrieved, using base prompt only")

    base_prompt += """

Remember to make learning enjoyable and build the student's confidence!
"""

    return base_prompt


# In entrypoint function (around line 467):
@session.on("user_input_transcribed")
def on_user_transcribed(event):
    """Capture user's transcribed speech and fetch RAG context"""
    logger.info(f"[FC-001] User said: {event.transcript[:100]}...")

    async def _publish_and_enrich():
        # Publish transcript
        await publish_transcript(ctx.room, "student", event.transcript)

        # Fetch RAG context for next response
        rag_context = await rag_service.fetch_context(
            query=event.transcript,
            grade=grade,
            subject=subject,
            topic=topic
        )

        if rag_context:
            # Update agent instructions with context
            updated_instructions = await create_tutor_prompt_with_rag(
                grade=grade,
                subject=subject,
                topic=topic,
                student_query=event.transcript
            )

            # Inject into next response
            # Note: Gemini Live API doesn't support mid-session instruction updates
            # So we'll include context in the conversation history instead
            logger.info("✅ RAG context prepared for next response")

    asyncio.create_task(_publish_and_enrich())
```

---

## Phase 4: Testing & Validation (Days 11-13)

### Task 4.1: E2E RAG Test 🧪
**File**: `pinglearn-app/src/tests/e2e/rag-flow.test.ts` (NEW)

```typescript
import { EmbeddingGenerator } from '@/lib/embeddings/generator';
import { semanticSearch } from '@/lib/rag/semantic-search';
import { contextBuilder } from '@/lib/rag/context-builder';
import { createClient } from '@/lib/supabase/server';

describe('RAG E2E Flow', () => {
  const testTextbookId = 'test-ncert-math-10';
  const testChapterContent = [
    {
      content: 'A quadratic equation is a second-degree polynomial equation in a single variable x with a ≠ 0. The standard form is ax² + bx + c = 0.',
      topics: ['Quadratic Equations', 'Polynomials']
    },
    {
      content: 'The discriminant D = b² - 4ac determines the nature of roots. If D > 0, the equation has two distinct real roots.',
      topics: ['Quadratic Equations', 'Discriminant']
    },
    {
      content: 'The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. This formula can be used to solve any quadratic equation.',
      topics: ['Quadratic Equations', 'Quadratic Formula']
    }
  ];

  beforeAll(async () => {
    // Setup: Create test textbook and generate embeddings
    const supabase = await createClient();
    const generator = new EmbeddingGenerator();

    // Create test textbook
    await supabase.from('textbooks').insert({
      id: testTextbookId,
      title: 'NCERT Mathematics Grade 10 - Test',
      grade: 10,
      subject: 'Mathematics',
      status: 'ready'
    });

    // Create test chapter
    const { data: chapter } = await supabase
      .from('chapters')
      .insert({
        textbook_id: testTextbookId,
        chapter_number: 4,
        title: 'Quadratic Equations',
        topics: ['Quadratic Equations']
      })
      .select()
      .single();

    // Create and embed test chunks
    for (let i = 0; i < testChapterContent.length; i++) {
      const embedding = await generator.generateEmbedding(testChapterContent[i].content);

      await supabase.from('content_chunks').insert({
        chapter_id: chapter.id,
        chunk_index: i,
        content: testChapterContent[i].content,
        embedding: embedding,
        has_embedding: true,
        content_type: 'text'
      });
    }
  });

  afterAll(async () => {
    // Cleanup
    const supabase = await createClient();
    await supabase.from('textbooks').delete().eq('id', testTextbookId);
  });

  it('should retrieve relevant content for query', async () => {
    const results = await semanticSearch.search(
      'How do you solve quadratic equations?',
      { grade: 10, subject: 'Mathematics' },
      { matchThreshold: 0.6 }
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain('quadratic');
    expect(results[0].similarity).toBeGreaterThan(0.6);
  });

  it('should build RAG context from search results', async () => {
    const ragContext = await contextBuilder.buildContext(
      'What is the quadratic formula?',
      { grade: 10, subject: 'Mathematics' }
    );

    expect(ragContext.sources.length).toBeGreaterThan(0);
    expect(ragContext.context).toContain('quadratic formula');
    expect(ragContext.context).toContain('[Source');
    expect(ragContext.relevantTopics).toContain('Quadratic Equations');
  });

  it('should handle queries with no results gracefully', async () => {
    const ragContext = await contextBuilder.buildContext(
      'Explain quantum mechanics',
      { grade: 10, subject: 'Mathematics' }
    );

    expect(ragContext.sources).toHaveLength(0);
    expect(ragContext.summary).toContain('Unable to find');
  });
});
```

---

## Verification Checklist

### Phase 1 Verification ✅
- [ ] pgvector extension installed (`SELECT * FROM pg_extension WHERE extname = 'vector'`)
- [ ] `embedding` column exists in `content_chunks`
- [ ] HNSW index created on embedding column
- [ ] `match_content_chunks` function exists and works
- [ ] Test embedding storage succeeds
- [ ] Silent failures are now tracked and reported
- [ ] Error accumulation works correctly

### Phase 2 Verification ✅
- [ ] Query embedder generates 768-dim vectors
- [ ] Query embedding caching works
- [ ] Semantic search returns relevant results
- [ ] Search with fallback works
- [ ] Context builder produces valid context
- [ ] Token limits are respected
- [ ] All unit tests pass

### Phase 3 Verification ✅
- [ ] RAG API endpoint returns context
- [ ] Python RAG service fetches context successfully
- [ ] Agent integration includes RAG context in prompts
- [ ] Cache prevents redundant API calls
- [ ] Error handling works correctly

### Phase 4 Verification ✅
- [ ] E2E test passes with real textbook
- [ ] Notes generation includes RAG enrichment
- [ ] Agent responses reference actual textbook content
- [ ] Performance meets targets (<300ms RAG overhead)
- [ ] User-facing features work correctly

---

## Success Metrics

**Before RAG**:
- Embeddings: Generated but not stored (schema mismatch)
- Search: Not possible
- Notes: Pattern matching only
- Agent: Prompt-based instructions, no actual content

**After RAG**:
- ✅ Embeddings: Generated and stored in pgvector
- ✅ Search: <100ms vector similarity search
- ✅ Notes: Pattern matching + RAG enrichment
- ✅ Agent: Dynamic context with real textbook content
- ✅ Accuracy: Curriculum-validated responses

**Performance Targets**:
- Embedding generation: ~300ms/chunk
- Vector search: <100ms
- Context building: <200ms
- Total RAG overhead: <300ms (acceptable)

---

## Rollback Plan

If something goes wrong:

```bash
# Rollback pgvector migration
cd pinglearn-app
supabase db reset

# Restore from backup
psql -h <host> -U postgres -d <db> < backup_before_pgvector.sql

# Disable RAG in agent
export ENABLE_RAG=false
```

---

## Next Steps After Completion

1. **Monitor Performance**:
   - Track RAG latency
   - Monitor cache hit rates
   - Measure search relevance

2. **Optimize as Needed**:
   - Tune similarity thresholds
   - Adjust chunking strategy
   - Optimize indexes

3. **Expand Content**:
   - Upload more textbooks
   - Generate embeddings for all content
   - Validate retrieval quality

4. **Enhance Features**:
   - Add multi-query retrieval
   - Implement parent-child chunking
   - Add re-ranking

---

**Ready to Begin**: ✅
**Estimated Time**: 13 days (2-3 weeks)
**Difficulty**: Medium-High
**Impact**: HIGH - Enables curriculum-accurate AI tutoring

**Questions?** Ask Agent 7A for clarification on any step!
