-- Smart Learning Notes Extension Migration
-- Extends existing session_analytics.metrics JSONB field to support Smart Notes storage
-- Date: 2025-09-27

-- Update session_analytics table to ensure notes support
ALTER TABLE public.session_analytics
ADD COLUMN IF NOT EXISTS notes_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes_word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes_concept_count INTEGER DEFAULT 0;

-- Create index for notes queries
CREATE INDEX IF NOT EXISTS idx_session_analytics_notes_generated
ON public.session_analytics(notes_generated) WHERE notes_generated = TRUE;

-- Create index for JSONB metrics queries (specifically for notes)
CREATE INDEX IF NOT EXISTS idx_session_analytics_metrics_notes
ON public.session_analytics USING GIN ((metrics->'smartNotes'));

-- Update trigger function to handle notes metadata
CREATE OR REPLACE FUNCTION update_session_analytics_notes_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- If metrics contains smartNotes, update metadata fields
    IF NEW.metrics ? 'smartNotes' THEN
        -- Extract notes data for metadata
        NEW.notes_generated := TRUE;

        -- Count concepts from keyConcepts array
        NEW.notes_concept_count := COALESCE(
            jsonb_array_length(NEW.metrics->'smartNotes'->'keyConcepts'), 0
        );

        -- Estimate word count from all text content
        NEW.notes_word_count := COALESCE(
            -- Count words in summary array
            (SELECT SUM(LENGTH(value::text) - LENGTH(REPLACE(value::text, ' ', '')) + 1)
             FROM jsonb_array_elements_text(NEW.metrics->'smartNotes'->'summary')) +
            -- Count words in concepts
            (SELECT SUM(LENGTH(value->>'content') - LENGTH(REPLACE(value->>'content', ' ', '')) + 1)
             FROM jsonb_array_elements(NEW.metrics->'smartNotes'->'keyConcepts')) +
            -- Count words in examples
            (SELECT SUM(LENGTH(value->>'content') - LENGTH(REPLACE(value->>'content', ' ', '')) + 1)
             FROM jsonb_array_elements(NEW.metrics->'smartNotes'->'examples')),
        0);
    END IF;

    -- Update the updated_at timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic notes metadata updates
DROP TRIGGER IF EXISTS trigger_update_session_analytics_notes_metadata ON public.session_analytics;
CREATE TRIGGER trigger_update_session_analytics_notes_metadata
    BEFORE INSERT OR UPDATE ON public.session_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_session_analytics_notes_metadata();

-- Example Smart Notes JSON structure for reference:
/*
Smart Notes will be stored in metrics JSONB field with this structure:

{
  "smartNotes": {
    "keyConcepts": [
      {
        "id": "uuid",
        "content": "Quadratic equation",
        "type": "definition|formula|tip",
        "latex": "ax^2 + bx + c = 0",
        "timestamp": "2025-09-27T10:30:00Z"
      }
    ],
    "examples": [
      {
        "id": "uuid",
        "content": "Example 1: Solve x² + 5x + 6 = 0",
        "type": "example",
        "steps": [
          "Identify: a=1, b=5, c=6",
          "Calculate: D = 25 - 24 = 1",
          "Result: x = -2, -3"
        ],
        "latex": "x^2 + 5x + 6 = 0",
        "timestamp": "2025-09-27T10:31:00Z"
      }
    ],
    "summary": [
      "Identified quadratic equation forms",
      "Learned discriminant formula",
      "Practiced finding roots systematically"
    ],
    "metadata": {
      "generatedAt": "2025-09-27T10:35:00Z",
      "version": "1.0",
      "totalConcepts": 5,
      "totalExamples": 3,
      "wordCount": 127
    }
  }
}
*/

-- Grant necessary permissions (if needed)
-- Note: RLS policies from main migration already cover this table

COMMENT ON COLUMN public.session_analytics.notes_generated IS 'Whether Smart Notes have been generated for this session';
COMMENT ON COLUMN public.session_analytics.notes_word_count IS 'Total word count of generated notes';
COMMENT ON COLUMN public.session_analytics.notes_concept_count IS 'Number of key concepts captured in notes';