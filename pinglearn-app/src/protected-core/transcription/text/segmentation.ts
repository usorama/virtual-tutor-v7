/**
 * Text Segmentation Service
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Enhanced text segmentation with math expression handling
 */

import { TextSegment, MathSegment } from '../../contracts/transcription.contract';

export class TextSegmentation {
  private readonly mathPatterns = [
    /\$\$([^$]+)\$\$/g, // Display math: $$...$$
    /\$([^$]+)\$/g,     // Inline math: $...$
    new RegExp('\\\\begin\\{equation\\}([\\s\\S]*?)\\\\end\\{equation\\}', 'g'), // LaTeX equations
    new RegExp('\\\\begin\\{align\\}([\\s\\S]*?)\\\\end\\{align\\}', 'g'),       // LaTeX align
    new RegExp('\\\\begin\\{matrix\\}([\\s\\S]*?)\\\\end\\{matrix\\}', 'g'),     // LaTeX matrices
  ];

  private readonly sentenceBoundaries = /[.!?]+\s*/g;
  private readonly speakerChangeIndicators = [
    /\b(student|teacher|system):\s*/gi,
    /\b(um|uh|well|so|now|okay|right)\b/gi,
  ];

  /**
   * Segment text into meaningful chunks
   */
  segmentText(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let currentIndex = 0;

    // First, identify and preserve math expressions
    const mathSegments = this.detectMathSegments(text);
    const mathRanges = mathSegments.map(seg => ({
      start: seg.startIndex,
      end: seg.endIndex,
    }));

    // Split text by sentences, avoiding math expressions
    const sentences = this.splitPreservingMath(text, mathRanges);

    for (const sentence of sentences) {
      if (sentence.trim().length === 0) continue;

      const startIndex = text.indexOf(sentence, currentIndex);
      const endIndex = startIndex + sentence.length;

      // Determine segment type
      const type = this.isCodeBlock(sentence) ? 'code' :
                   this.isDiagram(sentence) ? 'diagram' :
                   this.containsMath(sentence) ? 'math' : 'text';

      segments.push({
        text: sentence.trim(),
        type,
        startIndex,
        endIndex,
        confidence: this.calculateConfidence(sentence),
      });

      currentIndex = endIndex;
    }

    return segments;
  }

  /**
   * Detect math segments in text
   */
  detectMathSegments(text: string): MathSegment[] {
    const mathSegments: MathSegment[] = [];

    for (const pattern of this.mathPatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const latex = match[1] || match[0];
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        mathSegments.push({
          text: fullMatch,
          type: 'math',
          latex: latex.trim(),
          startIndex,
          endIndex,
          confidence: 0.95,
        });
      }
    }

    // Sort by start index
    return mathSegments.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * Detect speaker changes in text
   */
  detectSpeakerChanges(text: string): Array<{ index: number; speaker: string }> {
    const changes: Array<{ index: number; speaker: string }> = [];

    // Look for explicit speaker indicators
    const speakerPattern = /\b(student|teacher|system):\s*/gi;
    let match;

    while ((match = speakerPattern.exec(text)) !== null) {
      changes.push({
        index: match.index,
        speaker: match[1].toLowerCase(),
      });
    }

    return changes;
  }

  /**
   * Time alignment utilities for segments
   */
  alignSegments(segments: TextSegment[], totalDuration: number): TextSegment[] {
    if (segments.length === 0) return segments;

    const totalTextLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);
    let cumulativeLength = 0;

    return segments.map(segment => {
      const segmentRatio = segment.text.length / totalTextLength;
      const startTime = (cumulativeLength / totalTextLength) * totalDuration;
      const endTime = startTime + (segmentRatio * totalDuration);

      cumulativeLength += segment.text.length;

      return {
        ...segment,
        startIndex: Math.round(startTime),
        endIndex: Math.round(endTime),
      };
    });
  }

  /**
   * Split text preserving math expressions
   */
  private splitPreservingMath(text: string, mathRanges: Array<{ start: number; end: number }>): string[] {
    const sentences: string[] = [];
    let lastIndex = 0;

    // Simple sentence splitting for now
    const sentenceMatches = Array.from(text.matchAll(this.sentenceBoundaries));

    for (const match of sentenceMatches) {
      const endIndex = match.index! + match[0].length;

      // Check if this sentence boundary is inside a math expression
      const inMath = mathRanges.some(range =>
        match.index! >= range.start && match.index! <= range.end
      );

      if (!inMath) {
        const sentence = text.slice(lastIndex, endIndex);
        if (sentence.trim()) {
          sentences.push(sentence);
        }
        lastIndex = endIndex;
      }
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      if (remaining.trim()) {
        sentences.push(remaining);
      }
    }

    return sentences;
  }

  /**
   * Check if text contains math expressions
   */
  private containsMath(text: string): boolean {
    return this.mathPatterns.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    });
  }

  /**
   * Check if text is a code block
   */
  private isCodeBlock(text: string): boolean {
    return /```|`/.test(text) ||
           /^\s*(def|function|class|import|const|let|var)\b/i.test(text);
  }

  /**
   * Check if text describes a diagram
   */
  private isDiagram(text: string): boolean {
    const diagramKeywords = [
      'diagram', 'chart', 'graph', 'figure', 'draw', 'sketch',
      'visualize', 'plot', 'show', 'illustration'
    ];

    return diagramKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Calculate confidence score for a segment
   */
  private calculateConfidence(text: string): number {
    let confidence = 0.8; // Base confidence

    // Higher confidence for longer, well-formed sentences
    if (text.length > 20) confidence += 0.1;
    if (/^[A-Z]/.test(text)) confidence += 0.05; // Starts with capital
    if (/[.!?]$/.test(text)) confidence += 0.05; // Ends with punctuation

    // Lower confidence for very short or fragmented text
    if (text.length < 5) confidence -= 0.2;
    if (/\b(um|uh|er)\b/gi.test(text)) confidence -= 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }
}