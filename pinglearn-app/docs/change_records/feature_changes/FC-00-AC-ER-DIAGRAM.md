# FC-00-AC Entity-Relationship Diagram

**Feature**: Textbook Multi-Chapter Collection Management System
**Integration**: FS-00-AD (Curriculum Data)
**Created**: 2025-10-03
**Status**: Design Phase

---

## 📊 COMPLETE ER DIAGRAM (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CURRICULUM_DATA (FS-00-AD)                       │
│                      📚 SINGLE SOURCE OF TRUTH                          │
├─────────────────────────────────────────────────────────────────────────┤
│ • id: UUID [PK]                                                         │
│ • grade: INTEGER (9-12)                                                 │
│ • subject: TEXT ('Mathematics', 'Science', etc.)                        │
│ • topics: TEXT[] (curriculum topics)                                    │
│ • created_at: TIMESTAMPTZ                                               │
│                                                                         │
│ UNIQUE: (grade, subject)                                                │
└───────────────┬─────────────────────────────────────────────────────────┘
                │
                │ 1:N (One curriculum → Many book series)
                │ FK: book_series.curriculum_id → curriculum_data.id
                │ ON DELETE RESTRICT (protects curriculum data)
                │
                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      BOOK_SERIES (FC-00-AC - ROOT)                      │
│                   📖 Series Container (e.g., NCERT Math)                │
├─────────────────────────────────────────────────────────────────────────┤
│ • id: UUID [PK]                                                         │
│ • series_name: TEXT ('NCERT Mathematics Series')                        │
│ • publisher: TEXT ('NCERT', 'RD Sharma')                                │
│ • curriculum_id: UUID [FK → curriculum_data.id] ✅ INTEGRATION          │
│ • description: TEXT (optional)                                          │
│ • created_at: TIMESTAMPTZ                                               │
│ • updated_at: TIMESTAMPTZ                                               │
│                                                                         │
│ UNIQUE: (series_name, publisher, curriculum_id)                         │
│ INDEX: curriculum_id, publisher, (series_name, publisher)               │
└───────────────┬─────────────────────────────────────────────────────────┘
                │
                │ 1:N (One series → Many books/volumes)
                │ FK: books.series_id → book_series.id
                │ ON DELETE CASCADE (delete books when series deleted)
                │
                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOOKS (FC-00-AC - LEVEL 2)                      │
│                  📘 Individual Volumes (e.g., Part 1)                   │
├─────────────────────────────────────────────────────────────────────────┤
│ • id: UUID [PK]                                                         │
│ • series_id: UUID [FK → book_series.id]                                 │
│ • volume_number: INTEGER (1, 2, 3...)                                   │
│ • volume_title: TEXT ('Class 10 Mathematics')                           │
│ • isbn: TEXT (optional)                                                 │
│ • edition: TEXT ('2024 Edition')                                        │
│ • publication_year: INTEGER                                             │
│ • authors: TEXT[] (array of author names)                               │
│ • total_pages: INTEGER                                                  │
│ • file_name: TEXT                                                       │
│ • file_size_mb: DECIMAL                                                 │
│ • uploaded_at: TIMESTAMPTZ                                              │
│ • processed_at: TIMESTAMPTZ                                             │
│ • status: TEXT ('pending'|'processing'|'ready'|'failed')                │
│ • error_message: TEXT                                                   │
│ • created_at: TIMESTAMPTZ                                               │
│ • updated_at: TIMESTAMPTZ                                               │
│                                                                         │
│ UNIQUE: (series_id, volume_number)                                      │
│ INDEX: (series_id, volume_number), status, processed_at                 │
└───────────────┬─────────────────────────────────────────────────────────┘
                │
                │ 1:N (One book → Many chapters)
                │ FK: book_chapters.book_id → books.id
                │ ON DELETE CASCADE (delete chapters when book deleted)
                │
                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    BOOK_CHAPTERS (FC-00-AC - LEVEL 3)                   │
│              📄 Individual Chapters (SOLVES CORE PROBLEM)               │
├─────────────────────────────────────────────────────────────────────────┤
│ • id: UUID [PK]                                                         │
│ • book_id: UUID [FK → books.id]                                         │
│ • chapter_number: INTEGER (1, 2, 3...)                                  │
│ • title: TEXT ('Real Numbers', 'Polynomials')                           │
│ • description: TEXT (optional)                                          │
│ • start_page: INTEGER                                                   │
│ • end_page: INTEGER                                                     │
│ • estimated_duration_minutes: INTEGER                                   │
│ • difficulty_level: TEXT ('beginner'|'intermediate'|'advanced')         │
│ • topics: TEXT[] (chapter topics)                                       │
│ • learning_objectives: TEXT[]                                           │
│ • created_at: TIMESTAMPTZ                                               │
│ • updated_at: TIMESTAMPTZ                                               │
│                                                                         │
│ UNIQUE: (book_id, chapter_number)                                       │
│ INDEX: (book_id, chapter_number), difficulty_level                      │
└───────────┬───────────────────────────────────────────────┬─────────────┘
            │                                               │
            │ N:M (Many chapters ↔ Many topics)             │
            │ Via CHAPTER_TOPICS mapping table              │
            │                                               │
            ↓                                               ↓
┌───────────────────────────────┐     ┌─────────────────────────────────┐
│   CHAPTER_TOPICS (MAPPING)    │     │   TOPIC_TAXONOMY (HIERARCHY)    │
│     N:M Relationship Table    │     │    📚 Standardized Topics       │
├───────────────────────────────┤     ├─────────────────────────────────┤
│ • id: UUID [PK]               │     │ • id: UUID [PK]                 │
│ • chapter_id: UUID [FK]       │     │ • topic_code: TEXT UNIQUE       │
│   → book_chapters.id          │     │   ('MATH.10.QUADRATIC')         │
│ • topic_id: UUID [FK]         │     │ • topic_name: TEXT              │
│   → topic_taxonomy.id         │     │   ('Quadratic Equations')       │
│ • coverage_percentage: DECIMAL│     │ • parent_topic_id: UUID [FK]    │
│   (0.00 to 100.00)            │     │   → topic_taxonomy.id           │
│ • learning_objectives: TEXT[] │     │   (self-referencing hierarchy)  │
│ • created_at: TIMESTAMPTZ     │     │ • grade: INTEGER (1-12)         │
│                               │     │ • subject: TEXT                 │
│ UNIQUE: (chapter_id, topic_id)│     │ • curriculum_standard: TEXT     │
│ INDEX: chapter_id, topic_id,  │     │   ('NCERT', 'CBSE', 'ICSE')     │
│        (topic_id, coverage %) │     │ • topic_level: INTEGER (1-4)    │
└───────────────────────────────┘     │   (depth in hierarchy)          │
                                      │ • description: TEXT             │
                                      │ • created_at: TIMESTAMPTZ       │
                                      │                                 │
                                      │ CHECK: parent_topic_id != id    │
                                      │ INDEX: (parent_topic_id,        │
                                      │         topic_level),           │
                                      │        (curriculum_standard,    │
                                      │         grade, subject),        │
                                      │        topic_code               │
                                      └─────────────────────────────────┘
```

---

## 🔗 RELATIONSHIP TYPES

### **1. curriculum_data → book_series** (1:N)

```
Relationship: One-to-Many
Cardinality: 1 curriculum → 0..* book series
Foreign Key: book_series.curriculum_id → curriculum_data.id
Delete Rule: ON DELETE RESTRICT (protect curriculum if series exist)

Example:
  curriculum_data: {id: 'c1', grade: 10, subject: 'Mathematics'}
      ↓
  book_series:
    - {id: 's1', series_name: 'NCERT Math', curriculum_id: 'c1'}
    - {id: 's2', series_name: 'RD Sharma', curriculum_id: 'c1'}
    - {id: 's3', series_name: 'RS Aggarwal', curriculum_id: 'c1'}
```

---

### **2. book_series → books** (1:N)

```
Relationship: One-to-Many
Cardinality: 1 series → 1..* books (volumes)
Foreign Key: books.series_id → book_series.id
Delete Rule: ON DELETE CASCADE (remove volumes when series deleted)

Example:
  book_series: {id: 's1', series_name: 'NCERT Mathematics'}
      ↓
  books:
    - {id: 'b1', series_id: 's1', volume_number: 1, title: 'Part 1'}
    - {id: 'b2', series_id: 's1', volume_number: 2, title: 'Part 2'}
```

---

### **3. books → book_chapters** (1:N)

```
Relationship: One-to-Many
Cardinality: 1 book → 1..* chapters
Foreign Key: book_chapters.book_id → books.id
Delete Rule: ON DELETE CASCADE (remove chapters when book deleted)

Example:
  books: {id: 'b1', volume_title: 'Class 10 Mathematics'}
      ↓
  book_chapters:
    - {id: 'ch1', book_id: 'b1', chapter_number: 1, title: 'Real Numbers'}
    - {id: 'ch2', book_id: 'b1', chapter_number: 2, title: 'Polynomials'}
    - {id: 'ch3', book_id: 'b1', chapter_number: 3, title: 'Linear Equations'}
```

---

### **4. book_chapters ↔ topic_taxonomy** (N:M)

```
Relationship: Many-to-Many (via chapter_topics)
Cardinality: * chapters ↔ * topics
Mapping Table: chapter_topics
Foreign Keys:
  - chapter_topics.chapter_id → book_chapters.id
  - chapter_topics.topic_id → topic_taxonomy.id
Delete Rule: ON DELETE CASCADE (remove mappings when chapter/topic deleted)

Example:
  book_chapters: {id: 'ch1', title: 'Quadratic Equations'}
      ↔
  chapter_topics:
    - {chapter_id: 'ch1', topic_id: 't1', coverage_percentage: 80}
    - {chapter_id: 'ch1', topic_id: 't2', coverage_percentage: 20}
      ↔
  topic_taxonomy:
    - {id: 't1', topic_code: 'MATH.10.QUADRATIC', topic_name: 'Quadratic Equations'}
    - {id: 't2', topic_code: 'MATH.10.FACTORIZATION', topic_name: 'Factorization'}
```

---

### **5. topic_taxonomy → topic_taxonomy** (SELF-REFERENCING)

```
Relationship: Self-Referencing Hierarchy (Tree Structure)
Cardinality: 1 parent → 0..* children
Foreign Key: topic_taxonomy.parent_topic_id → topic_taxonomy.id
Delete Rule: ON DELETE CASCADE (remove child topics when parent deleted)
Constraint: parent_topic_id != id (prevent self-reference)

Example (Hierarchical Topic Tree):
  MATH.10 (Level 1: Subject)
    ↓
  ├─ MATH.10.ALGEBRA (Level 2: Unit)
  │   ↓
  │   ├─ MATH.10.ALGEBRA.QUADRATIC (Level 3: Topic)
  │   └─ MATH.10.ALGEBRA.LINEAR (Level 3: Topic)
  │
  ├─ MATH.10.GEOMETRY (Level 2: Unit)
  │   ↓
  │   ├─ MATH.10.GEOMETRY.TRIANGLES (Level 3: Topic)
  │   └─ MATH.10.GEOMETRY.CIRCLES (Level 3: Topic)
  │
  └─ MATH.10.STATISTICS (Level 2: Unit)
      ↓
      └─ MATH.10.STATISTICS.PROBABILITY (Level 3: Topic)
```

---

## 🔍 DATA FLOW EXAMPLE

### **Complete Hierarchy Instance**

```
curriculum_data (FS-00-AD)
├── id: "c1"
├── grade: 10
├── subject: "Mathematics"
└── topics: ["Real Numbers", "Polynomials", ...]
     ↓ (curriculum_id FK)
     ↓
book_series (FC-00-AC)
├── id: "s1"
├── series_name: "NCERT Mathematics Series"
├── publisher: "NCERT"
└── curriculum_id: "c1" ✅ INTEGRATION POINT
     ↓ (series_id FK, CASCADE)
     ↓
books
├── id: "b1"
├── series_id: "s1"
├── volume_number: 1
├── volume_title: "Class 10 Mathematics - Part 1"
├── authors: ["R.D. Sharma", "S.K. Gupta"]
├── edition: "2024 Edition"
└── status: "ready"
     ↓ (book_id FK, CASCADE)
     ↓
book_chapters
├── id: "ch1"
├── book_id: "b1"
├── chapter_number: 1
├── title: "Real Numbers"
├── start_page: 1
├── end_page: 18
├── difficulty_level: "beginner"
└── topics: ["Real Numbers", "Irrational Numbers"]
     ↓ (chapter_id FK, CASCADE)
     ↓
chapter_topics (MAPPING)
├── chapter_id: "ch1"
├── topic_id: "t1"
└── coverage_percentage: 100.0
     ↓ (topic_id FK, CASCADE)
     ↓
topic_taxonomy
├── id: "t1"
├── topic_code: "MATH.10.REAL_NUMBERS"
├── topic_name: "Real Numbers"
├── parent_topic_id: "t_parent" (MATH.10)
├── grade: 10
├── subject: "Mathematics"
├── curriculum_standard: "NCERT"
└── topic_level: 2 (Unit level)
```

---

## 💻 QUERY EXAMPLES

### **Query 1: Get Complete Hierarchy with Curriculum**

```sql
SELECT
  -- Curriculum metadata
  c.grade,
  c.subject,

  -- Series information
  bs.series_name,
  bs.publisher,

  -- Book information
  b.volume_number,
  b.volume_title,
  b.edition,

  -- Chapter information
  bc.chapter_number,
  bc.title AS chapter_title,
  bc.difficulty_level

FROM book_series bs
JOIN curriculum_data c ON bs.curriculum_id = c.id
LEFT JOIN books b ON bs.id = b.series_id
LEFT JOIN book_chapters bc ON b.id = bc.book_id

WHERE c.grade = 10 AND c.subject = 'Mathematics'
ORDER BY bs.series_name, b.volume_number, bc.chapter_number;
```

**Result**:
```
grade | subject     | series_name     | publisher | volume_number | volume_title        | chapter_number | chapter_title
------|-------------|-----------------|-----------|---------------|---------------------|----------------|----------------
10    | Mathematics | NCERT Math      | NCERT     | 1             | Class 10 Math - P1  | 1              | Real Numbers
10    | Mathematics | NCERT Math      | NCERT     | 1             | Class 10 Math - P1  | 2              | Polynomials
10    | Mathematics | NCERT Math      | NCERT     | 1             | Class 10 Math - P1  | 3              | Linear Equations
```

---

### **Query 2: Get Chapters by Topic**

```sql
SELECT
  bc.chapter_number,
  bc.title AS chapter_title,
  b.volume_title,
  bs.series_name,
  tt.topic_name,
  ct.coverage_percentage

FROM book_chapters bc
JOIN chapter_topics ct ON bc.id = ct.chapter_id
JOIN topic_taxonomy tt ON ct.topic_id = tt.id
JOIN books b ON bc.book_id = b.id
JOIN book_series bs ON b.series_id = bs.id

WHERE tt.topic_code = 'MATH.10.QUADRATIC_EQUATIONS'
ORDER BY ct.coverage_percentage DESC;
```

**Result**: All chapters covering "Quadratic Equations" sorted by coverage.

---

### **Query 3: Get Topic Hierarchy**

```sql
WITH RECURSIVE topic_tree AS (
  -- Root topics (no parent)
  SELECT id, topic_code, topic_name, parent_topic_id, topic_level, 1 as depth
  FROM topic_taxonomy
  WHERE parent_topic_id IS NULL AND grade = 10 AND subject = 'Mathematics'

  UNION ALL

  -- Child topics (recursive)
  SELECT t.id, t.topic_code, t.topic_name, t.parent_topic_id, t.topic_level, tt.depth + 1
  FROM topic_taxonomy t
  JOIN topic_tree tt ON t.parent_topic_id = tt.id
)
SELECT topic_code, topic_name, topic_level, depth
FROM topic_tree
ORDER BY topic_code;
```

**Result**: Complete topic hierarchy tree for Grade 10 Mathematics.

---

## 🎯 KEY DESIGN DECISIONS

### **Decision 1: curriculum_id FK (NOT duplicate fields)**

**Rationale**: Maintain single source of truth for curriculum metadata.

**Benefits**:
- No data duplication
- Automatic consistency
- Easier updates (change once in curriculum_data)
- Referential integrity enforced by database

---

### **Decision 2: ON DELETE RESTRICT for curriculum_data**

**Rationale**: Prevent accidental deletion of curriculum if book series exist.

**Benefits**:
- Protects curriculum data
- Forces cleanup of dependent data first
- Prevents orphaned book series

---

### **Decision 3: ON DELETE CASCADE for books and chapters**

**Rationale**: Simplify cleanup - deleting a series should remove all volumes and chapters.

**Benefits**:
- Automatic cleanup
- No orphaned books or chapters
- Simplifies data management

---

### **Decision 4: Many-to-Many for chapters and topics**

**Rationale**: Chapters can cover multiple topics, topics can appear in multiple chapters.

**Benefits**:
- Flexible curriculum alignment
- Accurate coverage tracking
- Better search capabilities

---

### **Decision 5: Self-referencing topic hierarchy**

**Rationale**: Topics naturally form a tree structure (Subject → Unit → Topic → Subtopic).

**Benefits**:
- Unlimited depth (with safety limit of 10)
- Standard educational taxonomy support
- Recursive query support

---

## 📊 TABLE SIZE ESTIMATES

**Assumptions**:
- 10 curricula (Grade 9-12, 4 subjects each)
- 3 book series per curriculum (30 total)
- 2 volumes per series (60 books)
- 15 chapters per volume (900 chapters)
- 100 topics (hierarchical taxonomy)
- 2 topics per chapter on average (1,800 mappings)

**Estimated Rows**:
```
curriculum_data:    ~10 rows
book_series:        ~30 rows
books:              ~60 rows
book_chapters:      ~900 rows
topic_taxonomy:     ~100 rows
chapter_topics:     ~1,800 rows
-----------------------------------
TOTAL:              ~2,900 rows
```

**Storage**: < 5 MB for metadata (excluding PDF files)

---

**Document Status**: ✅ **DIAGRAM COMPLETE**
**Next**: Use this diagram for TypeScript interface design (AGENT B2)
