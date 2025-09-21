/**
 * Display Formatter
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Formats content for display with proper styling and rendering
 */

import type { DisplayItem } from './buffer';
import { getMathRenderer } from '../math';

export interface FormatterOptions {
  includeTimestamp?: boolean;
  includeSpeaker?: boolean;
  includeConfidence?: boolean;
  maxWidth?: number;
  theme?: 'light' | 'dark';
}

export interface FormattedContent {
  html: string;
  text: string;
  metadata: {
    wordCount: number;
    estimatedReadTime: number; // in seconds
    hasSpecialContent: boolean;
  };
}

export class DisplayFormatter {
  private static readonly WORDS_PER_MINUTE = 200;
  private static readonly CONFIDENCE_THRESHOLD = 0.8;

  /**
   * Format a single display item for rendering
   */
  static formatItem(item: DisplayItem, options: FormatterOptions = {}): FormattedContent {
    const {
      includeTimestamp = true,
      includeSpeaker = true,
      includeConfidence = false,
      maxWidth = 0,
      theme = 'light'
    } = options;

    let html = '';
    const text = item.content;

    // Add speaker indicator
    if (includeSpeaker && item.speaker) {
      const speakerClass = `speaker-${item.speaker}`;
      html += `<div class="${speakerClass}">${this.formatSpeaker(item.speaker)}</div>`;
    }

    // Format content based on type
    switch (item.type) {
      case 'math':
        html += this.formatMathContent(item, theme);
        break;
      case 'code':
        html += this.formatCodeContent(item, theme);
        break;
      case 'diagram':
        html += this.formatDiagramContent(item, theme);
        break;
      case 'image':
        html += this.formatImageContent(item, theme);
        break;
      default:
        html += this.formatTextContent(item, theme);
    }

    // Add confidence indicator
    if (includeConfidence && item.confidence !== undefined) {
      html += this.formatConfidence(item.confidence);
    }

    // Add timestamp
    if (includeTimestamp) {
      html += this.formatTimestamp(item.timestamp, theme);
    }

    // Apply width constraints
    if (maxWidth > 0) {
      html = `<div style="max-width: ${maxWidth}px; word-wrap: break-word;">${html}</div>`;
    }

    // Calculate metadata
    const wordCount = this.countWords(text);
    const estimatedReadTime = Math.ceil(wordCount / (this.WORDS_PER_MINUTE / 60));
    const hasSpecialContent = item.type !== 'text' || (item.confidence !== undefined && item.confidence < this.CONFIDENCE_THRESHOLD);

    return {
      html,
      text,
      metadata: {
        wordCount,
        estimatedReadTime,
        hasSpecialContent
      }
    };
  }

  /**
   * Format multiple items as a conversation
   */
  static formatConversation(items: DisplayItem[], options: FormatterOptions = {}): FormattedContent {
    const formattedItems = items.map(item => this.formatItem(item, options));

    const html = formattedItems.map(item => `<div class="conversation-item">${item.html}</div>`).join('\n');
    const text = formattedItems.map(item => item.text).join('\n');

    const totalWordCount = formattedItems.reduce((sum, item) => sum + item.metadata.wordCount, 0);
    const totalReadTime = formattedItems.reduce((sum, item) => sum + item.metadata.estimatedReadTime, 0);
    const hasSpecialContent = formattedItems.some(item => item.metadata.hasSpecialContent);

    return {
      html: `<div class="conversation">${html}</div>`,
      text,
      metadata: {
        wordCount: totalWordCount,
        estimatedReadTime: totalReadTime,
        hasSpecialContent
      }
    };
  }

  private static formatSpeaker(speaker: string): string {
    const speakerMap: Record<string, string> = {
      'student': '👤 Student',
      'teacher': '👨‍🏫 Teacher',
      'ai': '🤖 AI Assistant'
    };
    return speakerMap[speaker] || '💬 Speaker';
  }

  private static formatMathContent(item: DisplayItem, theme: string): string {
    const mathRenderer = getMathRenderer();

    if (item.rendered) {
      return `<div class="math-content ${theme}">${item.rendered}</div>`;
    }

    try {
      const rendered = mathRenderer.renderMath(item.content);
      return `<div class="math-content ${theme}">${rendered}</div>`;
    } catch (error) {
      console.warn('Math rendering failed:', error);
      return `<div class="math-content-fallback ${theme}"><code>${item.content}</code></div>`;
    }
  }

  private static formatCodeContent(item: DisplayItem, theme: string): string {
    return `<pre class="code-content ${theme}"><code>${this.escapeHtml(item.content)}</code></pre>`;
  }

  private static formatDiagramContent(item: DisplayItem, theme: string): string {
    // For now, treat diagrams as code blocks
    // In the future, this could integrate with diagram rendering libraries
    return `<div class="diagram-content ${theme}"><pre>${this.escapeHtml(item.content)}</pre></div>`;
  }

  private static formatImageContent(item: DisplayItem, theme: string): string {
    // Handle image content - could be a URL or base64 data
    const isUrl = item.content.startsWith('http') || item.content.startsWith('data:image');

    if (isUrl) {
      return `<div class="image-content ${theme}"><img src="${item.content}" alt="Image content" style="max-width: 100%; height: auto;" /></div>`;
    } else {
      // Treat as image description or alt text
      return `<div class="image-description ${theme}">${this.escapeHtml(item.content)}</div>`;
    }
  }

  private static formatTextContent(item: DisplayItem, theme: string): string {
    return `<div class="text-content ${theme}">${this.escapeHtml(item.content)}</div>`;
  }

  private static formatConfidence(confidence: number): string {
    const percentage = Math.round(confidence * 100);
    const confidenceClass = confidence >= this.CONFIDENCE_THRESHOLD ? 'high-confidence' : 'low-confidence';

    return `<div class="confidence-indicator ${confidenceClass}" title="Confidence: ${percentage}%">
      <span class="confidence-bar" style="width: ${percentage}%"></span>
    </div>`;
  }

  private static formatTimestamp(timestamp: number, theme: string): string {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return `<div class="timestamp ${theme}" title="${date.toLocaleString()}">${timeString}</div>`;
  }

  private static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate CSS styles for the formatter
   */
  static generateCSS(): string {
    return `
      .conversation {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
      }

      .conversation-item {
        margin-bottom: 1rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: var(--item-bg, #f8f9fa);
      }

      .speaker-student { color: #0066cc; font-weight: 500; }
      .speaker-teacher { color: #228b22; font-weight: 500; }
      .speaker-ai { color: #6b46c1; font-weight: 500; }

      .math-content {
        margin: 0.5rem 0;
        text-align: center;
      }

      .math-content-fallback {
        font-family: 'Courier New', monospace;
        background-color: #f1f3f4;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
      }

      .code-content {
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 0.375rem;
        padding: 1rem;
        margin: 0.5rem 0;
        overflow-x: auto;
      }

      .code-content.dark {
        background-color: #0d1117;
        border-color: #30363d;
        color: #c9d1d9;
      }

      .diagram-content {
        border: 1px solid #d0d7de;
        border-radius: 0.375rem;
        padding: 1rem;
        margin: 0.5rem 0;
        background-color: #f6f8fa;
      }

      .image-content {
        text-align: center;
        margin: 0.5rem 0;
      }

      .image-description {
        font-style: italic;
        color: #6a737d;
        margin: 0.5rem 0;
        padding: 0.5rem;
        background-color: #f6f8fa;
        border-radius: 0.25rem;
      }

      .text-content {
        margin: 0.25rem 0;
      }

      .confidence-indicator {
        width: 3rem;
        height: 0.25rem;
        background-color: #e1e4e8;
        border-radius: 0.125rem;
        margin-top: 0.5rem;
        overflow: hidden;
      }

      .confidence-bar {
        height: 100%;
        background-color: #28a745;
        transition: width 0.3s ease;
      }

      .low-confidence .confidence-bar {
        background-color: #ffc107;
      }

      .timestamp {
        font-size: 0.75rem;
        color: #6a737d;
        margin-top: 0.5rem;
        text-align: right;
      }

      .timestamp.dark {
        color: #8b949e;
      }
    `;
  }
}