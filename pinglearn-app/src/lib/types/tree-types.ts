/**
 * Domain-Specific Tree Types for Curriculum Hierarchy
 *
 * This module provides curriculum-specific recursive types building on the generic
 * tree types, with proper type safety for the educational content hierarchy:
 * Textbook → Chapter → Lesson → Topic → Subtopic
 *
 * Key Features:
 * - Discriminated union for type-safe node types
 * - Branded IDs from TS-011
 * - Type-safe parent-child relationships
 * - Integration with database types
 * - Curriculum-specific query operations
 *
 * Builds on:
 * - TS-010: Type guards
 * - TS-011: Branded types for IDs
 * - TS-013: Discriminated unions
 * - TS-014: Generic recursive types
 *
 * @module tree-types
 */

import type { TreeNode, TreeNodeMetadata } from './recursive';
import type { TextbookId, ChapterId, LessonId, TopicId } from './id-types';
import type { Textbook, BookChapter, CurriculumData } from '../../types/database';

// =============================================================================
// CURRICULUM NODE TYPE ENUM
// =============================================================================

/**
 * Enum for curriculum node types
 */
export enum CurriculumNodeType {
  TEXTBOOK = 'textbook',
  CHAPTER = 'chapter',
  LESSON = 'lesson',
  TOPIC = 'topic',
  SUBTOPIC = 'subtopic',
}

// =============================================================================
// NODE DATA TYPES
// =============================================================================

/**
 * Textbook data
 */
export interface TextbookData {
  readonly title: string;
  readonly subject: string;
  readonly gradeLevel: number;
  readonly description?: string;
  readonly publisher?: string;
  readonly isbn?: string;
  readonly totalPages?: number;
}

/**
 * Chapter data
 */
export interface ChapterData {
  readonly title: string;
  readonly chapterNumber: number;
  readonly summary?: string;
  readonly pageRangeStart: number;
  readonly pageRangeEnd: number;
  readonly learningObjectives?: readonly string[];
}

/**
 * Lesson data
 */
export interface LessonData {
  readonly title: string;
  readonly lessonNumber: number;
  readonly summary?: string;
  readonly estimatedDuration?: number;
  readonly difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly prerequisites?: readonly string[];
}

/**
 * Topic data
 */
export interface TopicData {
  readonly title: string;
  readonly topicNumber: number;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly examples?: readonly string[];
}

/**
 * Subtopic data
 */
export interface SubtopicData {
  readonly title: string;
  readonly subtopicNumber: number;
  readonly content?: string;
  readonly mathEquations?: readonly string[];
}

// =============================================================================
// CURRICULUM NODE TYPES (Discriminated Union)
// =============================================================================

/**
 * Textbook node (root of curriculum tree)
 */
export interface TextbookNode {
  readonly type: CurriculumNodeType.TEXTBOOK;
  readonly id: TextbookId;
  readonly data: TextbookData;
  readonly children: readonly ChapterNode[];
  readonly metadata: TreeNodeMetadata;
}

/**
 * Chapter node (contains lessons)
 */
export interface ChapterNode {
  readonly type: CurriculumNodeType.CHAPTER;
  readonly id: ChapterId;
  readonly data: ChapterData;
  readonly children: readonly LessonNode[];
  readonly metadata: TreeNodeMetadata;
}

/**
 * Lesson node (contains topics)
 */
export interface LessonNode {
  readonly type: CurriculumNodeType.LESSON;
  readonly id: LessonId;
  readonly data: LessonData;
  readonly children: readonly TopicNode[];
  readonly metadata: TreeNodeMetadata;
}

/**
 * Topic node (contains subtopics)
 */
export interface TopicNode {
  readonly type: CurriculumNodeType.TOPIC;
  readonly id: TopicId;
  readonly data: TopicData;
  readonly children: readonly SubtopicNode[];
  readonly metadata: TreeNodeMetadata;
}

/**
 * Subtopic node (leaf node)
 */
export interface SubtopicNode {
  readonly type: CurriculumNodeType.SUBTOPIC;
  readonly id: string; // Generic ID for subtopics
  readonly data: SubtopicData;
  readonly children: readonly never[]; // Leaf node - no children
  readonly metadata: TreeNodeMetadata;
}

/**
 * Discriminated union of all curriculum node types
 */
export type CurriculumNode =
  | TextbookNode
  | ChapterNode
  | LessonNode
  | TopicNode
  | SubtopicNode;

/**
 * Complete curriculum tree type
 */
export interface CurriculumTree {
  readonly root: TextbookNode;
  readonly metadata: {
    readonly totalNodes: number;
    readonly maxDepth: number;
    readonly totalChapters: number;
    readonly totalLessons: number;
    readonly totalTopics: number;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for TextbookNode
 */
export function isTextbookNode(node: CurriculumNode): node is TextbookNode {
  return node.type === CurriculumNodeType.TEXTBOOK;
}

/**
 * Type guard for ChapterNode
 */
export function isChapterNode(node: CurriculumNode): node is ChapterNode {
  return node.type === CurriculumNodeType.CHAPTER;
}

/**
 * Type guard for LessonNode
 */
export function isLessonNode(node: CurriculumNode): node is LessonNode {
  return node.type === CurriculumNodeType.LESSON;
}

/**
 * Type guard for TopicNode
 */
export function isTopicNode(node: CurriculumNode): node is TopicNode {
  return node.type === CurriculumNodeType.TOPIC;
}

/**
 * Type guard for SubtopicNode
 */
export function isSubtopicNode(node: CurriculumNode): node is SubtopicNode {
  return node.type === CurriculumNodeType.SUBTOPIC;
}

/**
 * Type guard for any curriculum node
 */
export function isCurriculumNode(value: unknown): value is CurriculumNode {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const node = value as Record<string, unknown>;

  return (
    'type' in node &&
    typeof node.type === 'string' &&
    Object.values(CurriculumNodeType).includes(node.type as CurriculumNodeType) &&
    'id' in node &&
    'data' in node &&
    'children' in node &&
    Array.isArray(node.children) &&
    'metadata' in node
  );
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates a textbook node
 */
export function createTextbookNode(
  id: TextbookId,
  data: TextbookData,
  children: readonly ChapterNode[] = [],
  metadata?: Partial<TreeNodeMetadata>
): TextbookNode {
  return {
    type: CurriculumNodeType.TEXTBOOK,
    id,
    data,
    children,
    metadata: {
      depth: 0,
      index: 0,
      hasChildren: children.length > 0,
      childCount: children.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a chapter node
 */
export function createChapterNode(
  id: ChapterId,
  data: ChapterData,
  children: readonly LessonNode[] = [],
  metadata?: Partial<TreeNodeMetadata>
): ChapterNode {
  return {
    type: CurriculumNodeType.CHAPTER,
    id,
    data,
    children,
    metadata: {
      depth: 1,
      index: data.chapterNumber - 1,
      hasChildren: children.length > 0,
      childCount: children.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a lesson node
 */
export function createLessonNode(
  id: LessonId,
  data: LessonData,
  children: readonly TopicNode[] = [],
  metadata?: Partial<TreeNodeMetadata>
): LessonNode {
  return {
    type: CurriculumNodeType.LESSON,
    id,
    data,
    children,
    metadata: {
      depth: 2,
      index: data.lessonNumber - 1,
      hasChildren: children.length > 0,
      childCount: children.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a topic node
 */
export function createTopicNode(
  id: TopicId,
  data: TopicData,
  children: readonly SubtopicNode[] = [],
  metadata?: Partial<TreeNodeMetadata>
): TopicNode {
  return {
    type: CurriculumNodeType.TOPIC,
    id,
    data,
    children,
    metadata: {
      depth: 3,
      index: data.topicNumber - 1,
      hasChildren: children.length > 0,
      childCount: children.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}

/**
 * Creates a subtopic node
 */
export function createSubtopicNode(
  id: string,
  data: SubtopicData,
  metadata?: Partial<TreeNodeMetadata>
): SubtopicNode {
  const emptyChildren: readonly never[] = [] as const;

  return {
    type: CurriculumNodeType.SUBTOPIC,
    id,
    data,
    children: emptyChildren,
    metadata: {
      depth: 4,
      index: data.subtopicNumber - 1,
      hasChildren: false,
      childCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata,
    },
  };
}

// =============================================================================
// CURRICULUM-SPECIFIC QUERY OPERATIONS
// =============================================================================

/**
 * Finds a chapter by its number
 */
export function findChapterByNumber(
  textbook: TextbookNode,
  chapterNumber: number
): ChapterNode | null {
  return textbook.children.find(ch => ch.data.chapterNumber === chapterNumber) ?? null;
}

/**
 * Finds a lesson within a chapter
 */
export function findLessonInChapter(
  chapter: ChapterNode,
  lessonNumber: number
): LessonNode | null {
  return chapter.children.find(lesson => lesson.data.lessonNumber === lessonNumber) ?? null;
}

/**
 * Finds a topic within a lesson
 */
export function findTopicInLesson(
  lesson: LessonNode,
  topicNumber: number
): TopicNode | null {
  return lesson.children.find(topic => topic.data.topicNumber === topicNumber) ?? null;
}

/**
 * Gets all lessons in a textbook (flat list)
 */
export function getAllLessons(textbook: TextbookNode): LessonNode[] {
  return textbook.children.flatMap(chapter => chapter.children);
}

/**
 * Gets all topics in a textbook (flat list)
 */
export function getAllTopics(textbook: TextbookNode): TopicNode[] {
  return textbook.children.flatMap(chapter =>
    chapter.children.flatMap(lesson => lesson.children)
  );
}

/**
 * Gets all topics in a chapter
 */
export function getTopicsInChapter(chapter: ChapterNode): TopicNode[] {
  return chapter.children.flatMap(lesson => lesson.children);
}

/**
 * Gets curriculum path as array of titles
 */
export function getCurriculumPath(node: CurriculumNode): string[] {
  const path: string[] = [];

  if (isTextbookNode(node)) {
    path.push(node.data.title);
  } else if (isChapterNode(node)) {
    path.push(`Chapter ${node.data.chapterNumber}: ${node.data.title}`);
  } else if (isLessonNode(node)) {
    path.push(`Lesson ${node.data.lessonNumber}: ${node.data.title}`);
  } else if (isTopicNode(node)) {
    path.push(`Topic ${node.data.topicNumber}: ${node.data.title}`);
  } else if (isSubtopicNode(node)) {
    path.push(node.data.title);
  }

  return path;
}

/**
 * Gets total count of each node type in textbook
 */
export function getCurriculumStats(textbook: TextbookNode): {
  chapters: number;
  lessons: number;
  topics: number;
  subtopics: number;
} {
  let lessons = 0;
  let topics = 0;
  let subtopics = 0;

  for (const chapter of textbook.children) {
    lessons += chapter.children.length;

    for (const lesson of chapter.children) {
      topics += lesson.children.length;

      for (const topic of lesson.children) {
        subtopics += topic.children.length;
      }
    }
  }

  return {
    chapters: textbook.children.length,
    lessons,
    topics,
    subtopics,
  };
}

/**
 * Finds nodes by keyword search in titles
 */
export function searchCurriculumByKeyword(
  textbook: TextbookNode,
  keyword: string
): CurriculumNode[] {
  const results: CurriculumNode[] = [];
  const lowerKeyword = keyword.toLowerCase();

  // Search chapters
  for (const chapter of textbook.children) {
    if (chapter.data.title.toLowerCase().includes(lowerKeyword)) {
      results.push(chapter);
    }

    // Search lessons
    for (const lesson of chapter.children) {
      if (lesson.data.title.toLowerCase().includes(lowerKeyword)) {
        results.push(lesson);
      }

      // Search topics
      for (const topic of lesson.children) {
        if (topic.data.title.toLowerCase().includes(lowerKeyword)) {
          results.push(topic);
        }

        // Search subtopics
        for (const subtopic of topic.children) {
          if (subtopic.data.title.toLowerCase().includes(lowerKeyword)) {
            results.push(subtopic);
          }
        }
      }
    }
  }

  return results;
}

// =============================================================================
// DATABASE INTEGRATION
// =============================================================================

/**
 * Converts database Textbook to TextbookNode (without children)
 */
export function textbookFromDatabase(textbook: Textbook): Omit<TextbookData, 'children'> {
  return {
    title: textbook.title,
    subject: textbook.subject,
    gradeLevel: textbook.grade_level,
    description: textbook.enhanced_metadata.description,
    publisher: textbook.enhanced_metadata.publisher,
    isbn: textbook.enhanced_metadata.isbn,
    totalPages: textbook.total_pages ?? undefined,
  };
}

/**
 * Converts database BookChapter to ChapterNode data (without children)
 */
export function chapterFromDatabase(chapter: BookChapter): Omit<ChapterData, 'children'> {
  return {
    title: chapter.title,
    chapterNumber: chapter.chapter_number,
    summary: chapter.content_summary ?? undefined,
    pageRangeStart: chapter.page_range_start,
    pageRangeEnd: chapter.page_range_end,
    learningObjectives: undefined, // Would come from curriculum_data if available
  };
}

/**
 * Converts database CurriculumData to lesson/topic data
 */
export function curriculumDataToLessonData(curriculum: CurriculumData): LessonData {
  return {
    title: curriculum.chapter_title,
    lessonNumber: curriculum.chapter_number,
    summary: undefined,
    estimatedDuration: curriculum.estimated_hours * 60, // Convert hours to minutes
    difficulty: curriculum.difficulty_level,
    prerequisites: curriculum.prerequisites,
  };
}

/**
 * Creates a curriculum tree structure (placeholder for future implementation)
 *
 * @remarks
 * Full implementation would query database and build complete tree.
 * This is a type-safe placeholder showing the expected structure.
 */
export function createCurriculumTreeFromDatabase(
  textbook: Textbook,
  chapters: BookChapter[],
  curriculumData: CurriculumData[]
): CurriculumTree {
  // This is a simplified placeholder implementation
  // Real implementation would:
  // 1. Create textbook node from database textbook
  // 2. Create chapter nodes from book_chapters
  // 3. Create lesson/topic nodes from curriculum_data
  // 4. Build hierarchical structure
  // 5. Calculate statistics

  const textbookData = textbookFromDatabase(textbook);
  const chapterNodes: ChapterNode[] = []; // Chapters would be built from database here

  const textbookNode = createTextbookNode(
    textbook.id as TextbookId,
    textbookData,
    chapterNodes
  );

  const stats = getCurriculumStats(textbookNode);

  return {
    root: textbookNode,
    metadata: {
      totalNodes: 1 + stats.chapters + stats.lessons + stats.topics + stats.subtopics,
      maxDepth: 4, // Textbook → Chapter → Lesson → Topic → Subtopic
      totalChapters: stats.chapters,
      totalLessons: stats.lessons,
      totalTopics: stats.topics,
      createdAt: textbook.created_at,
      updatedAt: textbook.updated_at,
    },
  };
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Extract node data type from node type
 */
export type NodeDataType<T extends CurriculumNode> = T extends TextbookNode
  ? TextbookData
  : T extends ChapterNode
  ? ChapterData
  : T extends LessonNode
  ? LessonData
  : T extends TopicNode
  ? TopicData
  : T extends SubtopicNode
  ? SubtopicData
  : never;

/**
 * Extract children type from node type
 */
export type NodeChildrenType<T extends CurriculumNode> = T extends TextbookNode
  ? ChapterNode
  : T extends ChapterNode
  ? LessonNode
  : T extends LessonNode
  ? TopicNode
  : T extends TopicNode
  ? SubtopicNode
  : never;

/**
 * Curriculum navigation path
 */
export interface CurriculumPath {
  readonly textbookId: TextbookId;
  readonly chapterId?: ChapterId;
  readonly lessonId?: LessonId;
  readonly topicId?: TopicId;
  readonly subtopicId?: string;
}

/**
 * Curriculum progress tracking
 */
export interface CurriculumProgress {
  readonly path: CurriculumPath;
  readonly completedAt?: string;
  readonly masteryLevel?: number; // 0-100
  readonly timeSpent?: number; // minutes
  readonly attempts?: number;
}