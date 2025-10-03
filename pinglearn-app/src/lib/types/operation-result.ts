/**
 * Operation Result Types for PingLearn
 *
 * Generic result wrapper for operations that can partially fail,
 * providing detailed success/failure tracking instead of silent failures.
 *
 * Created for: P1.3 - Fix Silent Failure SF-001 (Embedding Generation)
 */

/**
 * Generic operation result wrapper
 * @template T - The type of successful result data
 */
export interface OperationResult<T> {
  /** Whether the operation was successful overall */
  success: boolean;

  /** Operation-specific result data (present on success) */
  data?: T;

  /** High-level error message (present on failure) */
  error?: string;

  /** Individual item failures with reasons (for batch operations) */
  failedItems?: Array<{ id: string; reason: string }>;
}

/**
 * Result data for embedding generation operations
 */
export interface EmbeddingGenerationResult {
  /** ID of the textbook processed */
  textbookId: string;

  /** Total number of chunks attempted */
  totalChunks: number;

  /** Number of successful embeddings generated and stored */
  successfulEmbeddings: number;

  /** Number of failed embeddings */
  failedEmbeddings: number;

  /** IDs of chunks that failed to generate embeddings */
  failedChunkIds: string[];

  /** Success rate as a percentage (0-100) */
  successRate: number;
}
