/**
 * Tests for Domain-Specific Curriculum Tree Types
 *
 * Covers:
 * - Node type creation
 * - Type guards and discrimination
 * - Curriculum hierarchy
 * - Curriculum-specific queries
 * - Factory functions
 */

import { describe, it, expect } from 'vitest';
import {
  CurriculumNodeType,
  createTextbookNode,
  createChapterNode,
  createLessonNode,
  createTopicNode,
  createSubtopicNode,
  isTextbookNode,
  isChapterNode,
  isLessonNode,
  isTopicNode,
  isSubtopicNode,
  isCurriculumNode,
  findChapterByNumber,
  findLessonInChapter,
  findTopicInLesson,
  getAllLessons,
  getAllTopics,
  getTopicsInChapter,
  getCurriculumPath,
  getCurriculumStats,
  searchCurriculumByKeyword,
} from './tree-types';
import { unsafeCreateTextbookId, unsafeCreateChapterId, unsafeCreateLessonId, unsafeCreateTopicId } from './id-types';

// =============================================================================
// NODE TYPE CREATION TESTS
// =============================================================================

describe('Node Type Creation', () => {
  it('should create textbook node', () => {
    const textbookId = unsafeCreateTextbookId('textbook_ncert_math_10');
    const node = createTextbookNode(textbookId, {
      title: 'NCERT Mathematics Grade 10',
      subject: 'Mathematics',
      gradeLevel: 10,
    });

    expect(node.type).toBe(CurriculumNodeType.TEXTBOOK);
    expect(node.id).toBe(textbookId);
    expect(node.data.title).toBe('NCERT Mathematics Grade 10');
    expect(node.children).toHaveLength(0);
    expect(node.metadata.depth).toBe(0);
  });

  it('should create chapter node', () => {
    const chapterId = unsafeCreateChapterId('ch_1');
    const node = createChapterNode(chapterId, {
      title: 'Real Numbers',
      chapterNumber: 1,
      pageRangeStart: 1,
      pageRangeEnd: 20,
    });

    expect(node.type).toBe(CurriculumNodeType.CHAPTER);
    expect(node.id).toBe(chapterId);
    expect(node.data.chapterNumber).toBe(1);
    expect(node.metadata.depth).toBe(1);
    expect(node.metadata.index).toBe(0); // chapterNumber - 1
  });

  it('should create lesson node', () => {
    const lessonId = unsafeCreateLessonId('lesson_1_1');
    const node = createLessonNode(lessonId, {
      title: 'Introduction to Real Numbers',
      lessonNumber: 1,
      difficulty: 'beginner',
    });

    expect(node.type).toBe(CurriculumNodeType.LESSON);
    expect(node.id).toBe(lessonId);
    expect(node.data.difficulty).toBe('beginner');
    expect(node.metadata.depth).toBe(2);
  });

  it('should create topic node', () => {
    const topicId = unsafeCreateTopicId('topic_1_1_1');
    const node = createTopicNode(topicId, {
      title: 'Rational Numbers',
      topicNumber: 1,
      keywords: ['fractions', 'decimals'],
    });

    expect(node.type).toBe(CurriculumNodeType.TOPIC);
    expect(node.id).toBe(topicId);
    expect(node.data.keywords).toContain('fractions');
    expect(node.metadata.depth).toBe(3);
  });

  it('should create subtopic node', () => {
    const node = createSubtopicNode('subtopic_1', {
      title: 'Properties of Rational Numbers',
      subtopicNumber: 1,
      mathEquations: ['a/b', 'p/q'],
    });

    expect(node.type).toBe(CurriculumNodeType.SUBTOPIC);
    expect(node.data.mathEquations).toHaveLength(2);
    expect(node.children).toHaveLength(0); // Leaf node
    expect(node.metadata.depth).toBe(4);
  });
});

// =============================================================================
// TYPE GUARD TESTS
// =============================================================================

describe('Type Guards', () => {
  const textbookNode = createTextbookNode(
    unsafeCreateTextbookId('tb_1'),
    { title: 'Test', subject: 'Math', gradeLevel: 10 }
  );

  const chapterNode = createChapterNode(
    unsafeCreateChapterId('ch_1'),
    { title: 'Chapter 1', chapterNumber: 1, pageRangeStart: 1, pageRangeEnd: 10 }
  );

  const lessonNode = createLessonNode(
    unsafeCreateLessonId('lesson_1'),
    { title: 'Lesson 1', lessonNumber: 1 }
  );

  const topicNode = createTopicNode(
    unsafeCreateTopicId('topic_1'),
    { title: 'Topic 1', topicNumber: 1 }
  );

  const subtopicNode = createSubtopicNode(
    'subtopic_1',
    { title: 'Subtopic 1', subtopicNumber: 1 }
  );

  it('should discriminate textbook nodes', () => {
    expect(isTextbookNode(textbookNode)).toBe(true);
    expect(isTextbookNode(chapterNode)).toBe(false);
  });

  it('should discriminate chapter nodes', () => {
    expect(isChapterNode(chapterNode)).toBe(true);
    expect(isChapterNode(textbookNode)).toBe(false);
  });

  it('should discriminate lesson nodes', () => {
    expect(isLessonNode(lessonNode)).toBe(true);
    expect(isLessonNode(chapterNode)).toBe(false);
  });

  it('should discriminate topic nodes', () => {
    expect(isTopicNode(topicNode)).toBe(true);
    expect(isTopicNode(lessonNode)).toBe(false);
  });

  it('should discriminate subtopic nodes', () => {
    expect(isSubtopicNode(subtopicNode)).toBe(true);
    expect(isSubtopicNode(topicNode)).toBe(false);
  });

  it('should validate any curriculum node', () => {
    expect(isCurriculumNode(textbookNode)).toBe(true);
    expect(isCurriculumNode(chapterNode)).toBe(true);
    expect(isCurriculumNode(lessonNode)).toBe(true);
    expect(isCurriculumNode(topicNode)).toBe(true);
    expect(isCurriculumNode(subtopicNode)).toBe(true);

    expect(isCurriculumNode(null)).toBe(false);
    expect(isCurriculumNode({})).toBe(false);
  });
});

// =============================================================================
// CURRICULUM HIERARCHY TESTS
// =============================================================================

describe('Curriculum Hierarchy', () => {
  const buildCurriculumTree = () => {
    const subtopic1 = createSubtopicNode('st_1_1_1_1', {
      title: 'Subtopic 1.1.1.1',
      subtopicNumber: 1,
    });

    const topic1 = createTopicNode(
      unsafeCreateTopicId('topic_1_1_1'),
      {
        title: 'Rational Numbers',
        topicNumber: 1,
      },
      [subtopic1]
    );

    const lesson1 = createLessonNode(
      unsafeCreateLessonId('lesson_1_1'),
      {
        title: 'Introduction to Real Numbers',
        lessonNumber: 1,
      },
      [topic1]
    );

    const chapter1 = createChapterNode(
      unsafeCreateChapterId('ch_1'),
      {
        title: 'Real Numbers',
        chapterNumber: 1,
        pageRangeStart: 1,
        pageRangeEnd: 20,
      },
      [lesson1]
    );

    return createTextbookNode(
      unsafeCreateTextbookId('textbook_ncert_math_10'),
      {
        title: 'NCERT Mathematics Grade 10',
        subject: 'Mathematics',
        gradeLevel: 10,
      },
      [chapter1]
    );
  };

  it('should build complete curriculum hierarchy', () => {
    const textbook = buildCurriculumTree();

    expect(textbook.children).toHaveLength(1);
    expect(textbook.children[0].children).toHaveLength(1);
    expect(textbook.children[0].children[0].children).toHaveLength(1);
    expect(textbook.children[0].children[0].children[0].children).toHaveLength(1);
  });

  it('should maintain type safety at each level', () => {
    const textbook = buildCurriculumTree();

    // TypeScript should enforce correct child types
    const chapter = textbook.children[0];
    expect(isChapterNode(chapter)).toBe(true);

    const lesson = chapter.children[0];
    expect(isLessonNode(lesson)).toBe(true);

    const topic = lesson.children[0];
    expect(isTopicNode(topic)).toBe(true);

    const subtopic = topic.children[0];
    expect(isSubtopicNode(subtopic)).toBe(true);
  });

  it('should have correct depth at each level', () => {
    const textbook = buildCurriculumTree();

    expect(textbook.metadata.depth).toBe(0);
    expect(textbook.children[0].metadata.depth).toBe(1);
    expect(textbook.children[0].children[0].metadata.depth).toBe(2);
    expect(textbook.children[0].children[0].children[0].metadata.depth).toBe(3);
    expect(textbook.children[0].children[0].children[0].children[0].metadata.depth).toBe(4);
  });
});

// =============================================================================
// CURRICULUM QUERY TESTS
// =============================================================================

describe('Curriculum Queries', () => {
  const buildMultiChapterTree = () => {
    const lesson1_1 = createLessonNode(
      unsafeCreateLessonId('lesson_1_1'),
      { title: 'Lesson 1.1', lessonNumber: 1 }
    );

    const lesson1_2 = createLessonNode(
      unsafeCreateLessonId('lesson_1_2'),
      { title: 'Lesson 1.2', lessonNumber: 2 }
    );

    const topic1 = createTopicNode(
      unsafeCreateTopicId('topic_1'),
      { title: 'Topic about Fractions', topicNumber: 1 }
    );

    const lesson2_1 = createLessonNode(
      unsafeCreateLessonId('lesson_2_1'),
      { title: 'Lesson 2.1', lessonNumber: 1 },
      [topic1]
    );

    const chapter1 = createChapterNode(
      unsafeCreateChapterId('ch_1'),
      { title: 'Real Numbers', chapterNumber: 1, pageRangeStart: 1, pageRangeEnd: 20 },
      [lesson1_1, lesson1_2]
    );

    const chapter2 = createChapterNode(
      unsafeCreateChapterId('ch_2'),
      { title: 'Polynomials', chapterNumber: 2, pageRangeStart: 21, pageRangeEnd: 40 },
      [lesson2_1]
    );

    return createTextbookNode(
      unsafeCreateTextbookId('textbook_1'),
      { title: 'Mathematics', subject: 'Math', gradeLevel: 10 },
      [chapter1, chapter2]
    );
  };

  it('should find chapter by number', () => {
    const textbook = buildMultiChapterTree();
    const chapter = findChapterByNumber(textbook, 2);

    expect(chapter).not.toBeNull();
    expect(chapter!.data.title).toBe('Polynomials');
  });

  it('should find lesson in chapter', () => {
    const textbook = buildMultiChapterTree();
    const chapter = findChapterByNumber(textbook, 1)!;
    const lesson = findLessonInChapter(chapter, 2);

    expect(lesson).not.toBeNull();
    expect(lesson!.data.title).toBe('Lesson 1.2');
  });

  it('should find topic in lesson', () => {
    const textbook = buildMultiChapterTree();
    const chapter = findChapterByNumber(textbook, 2)!;
    const lesson = findLessonInChapter(chapter, 1)!;
    const topic = findTopicInLesson(lesson, 1);

    expect(topic).not.toBeNull();
    expect(topic!.data.title).toBe('Topic about Fractions');
  });

  it('should get all lessons', () => {
    const textbook = buildMultiChapterTree();
    const lessons = getAllLessons(textbook);

    expect(lessons).toHaveLength(3);
  });

  it('should get all topics', () => {
    const textbook = buildMultiChapterTree();
    const topics = getAllTopics(textbook);

    expect(topics).toHaveLength(1);
  });

  it('should get topics in chapter', () => {
    const textbook = buildMultiChapterTree();
    const chapter = findChapterByNumber(textbook, 2)!;
    const topics = getTopicsInChapter(chapter);

    expect(topics).toHaveLength(1);
    expect(topics[0].data.title).toBe('Topic about Fractions');
  });

  it('should get curriculum path', () => {
    const textbook = createTextbookNode(
      unsafeCreateTextbookId('tb_1'),
      { title: 'Mathematics', subject: 'Math', gradeLevel: 10 }
    );

    const chapter = createChapterNode(
      unsafeCreateChapterId('ch_1'),
      { title: 'Real Numbers', chapterNumber: 1, pageRangeStart: 1, pageRangeEnd: 10 }
    );

    const lesson = createLessonNode(
      unsafeCreateLessonId('lesson_1'),
      { title: 'Introduction', lessonNumber: 1 }
    );

    const topic = createTopicNode(
      unsafeCreateTopicId('topic_1'),
      { title: 'Rationals', topicNumber: 1 }
    );

    expect(getCurriculumPath(textbook)).toEqual(['Mathematics']);
    expect(getCurriculumPath(chapter)).toEqual(['Chapter 1: Real Numbers']);
    expect(getCurriculumPath(lesson)).toEqual(['Lesson 1: Introduction']);
    expect(getCurriculumPath(topic)).toEqual(['Topic 1: Rationals']);
  });

  it('should get curriculum statistics', () => {
    const textbook = buildMultiChapterTree();
    const stats = getCurriculumStats(textbook);

    expect(stats.chapters).toBe(2);
    expect(stats.lessons).toBe(3);
    expect(stats.topics).toBe(1);
    expect(stats.subtopics).toBe(0);
  });

  it('should search curriculum by keyword', () => {
    const textbook = buildMultiChapterTree();
    const results = searchCurriculumByKeyword(textbook, 'fractions');

    expect(results).toHaveLength(1);
    expect(isTopicNode(results[0])).toBe(true);
  });

  it('should search case-insensitively', () => {
    const textbook = buildMultiChapterTree();
    const results = searchCurriculumByKeyword(textbook, 'POLYNOMIALS');

    expect(results).toHaveLength(1);
    expect(isChapterNode(results[0])).toBe(true);
  });
});

// =============================================================================
// FACTORY FUNCTION TESTS
// =============================================================================

describe('Factory Functions', () => {
  it('should create textbook with chapters', () => {
    const chapter = createChapterNode(
      unsafeCreateChapterId('ch_1'),
      { title: 'Chapter 1', chapterNumber: 1, pageRangeStart: 1, pageRangeEnd: 10 }
    );

    const textbook = createTextbookNode(
      unsafeCreateTextbookId('tb_1'),
      { title: 'Textbook', subject: 'Math', gradeLevel: 10 },
      [chapter]
    );

    expect(textbook.children).toHaveLength(1);
    expect(textbook.metadata.childCount).toBe(1);
    expect(textbook.metadata.hasChildren).toBe(true);
  });

  it('should set correct indices based on numbers', () => {
    const chapter3 = createChapterNode(
      unsafeCreateChapterId('ch_3'),
      { title: 'Chapter 3', chapterNumber: 3, pageRangeStart: 1, pageRangeEnd: 10 }
    );

    expect(chapter3.metadata.index).toBe(2); // chapterNumber - 1
  });

  it('should create timestamped metadata', () => {
    const node = createTextbookNode(
      unsafeCreateTextbookId('tb_1'),
      { title: 'Test', subject: 'Math', gradeLevel: 10 }
    );

    expect(node.metadata.createdAt).toBeDefined();
    expect(node.metadata.updatedAt).toBeDefined();
    expect(typeof node.metadata.createdAt).toBe('string');
  });

  it('should allow custom metadata', () => {
    const node = createChapterNode(
      unsafeCreateChapterId('ch_1'),
      { title: 'Chapter 1', chapterNumber: 1, pageRangeStart: 1, pageRangeEnd: 10 },
      [],
      { customField: 'custom value' }
    );

    expect((node.metadata as { customField?: string }).customField).toBe('custom value');
  });
});