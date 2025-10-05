# Textbook Upload User Guide

**Version**: 1.0
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Date**: September 19, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Upload Process](#step-by-step-upload-process)
4. [Understanding the Workflow](#understanding-the-workflow)
5. [File Requirements](#file-requirements)
6. [Curriculum Selection Guide](#curriculum-selection-guide)
7. [Common Scenarios](#common-scenarios)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

The PingLearn textbook upload system allows you to organize and upload educational content with proper curriculum alignment. The system uses a **multi-step wizard** to collect metadata about your textbook before uploading files.

### Key Features

- **Curriculum Integration**: Automatically link textbooks to existing curricula (Class 10 Math, Class 12 English, etc.)
- **Hierarchical Organization**: Series → Book → Chapters structure
- **Smart Validation**: Real-time validation prevents common errors
- **Bulk Upload**: Upload multiple PDF files at once
- **Type-Safe**: Built with TypeScript for data integrity

### What Gets Created

When you complete an upload, the system creates:

1. **Book Series** - Top-level container (e.g., "NCERT Mathematics Series")
2. **Book** - Individual volume within the series (e.g., "Class 10 Mathematics - 2024 Edition")
3. **Chapters** - Individual chapters within the book
4. **Files** - PDF files stored and linked to chapters

---

## Prerequisites

Before uploading textbooks, ensure you have:

- [ ] **PDF Files**: One or more PDF files of your textbook chapters
- [ ] **Textbook Metadata**: Series name, publisher, edition, authors
- [ ] **Chapter Information**: Chapter titles and page numbers
- [ ] **Curriculum Knowledge**: Which curriculum this textbook belongs to

### File Size Limits

- **Maximum files per upload**: 50 files
- **Maximum file size**: 100MB per file
- **Supported formats**: PDF only

---

## Step-by-Step Upload Process

### Phase 1: File Upload

1. **Navigate to Upload Page**
   - Go to `/textbooks/upload` in your browser
   - You'll see a drag-and-drop upload zone

2. **Select PDF Files**
   - **Option A**: Drag and drop PDF files into the upload zone
   - **Option B**: Click "Browse Files" and select PDFs from your computer

3. **File Validation**
   - System filters to PDF files only
   - Non-PDF files are automatically ignored
   - You'll see a warning if non-PDF files were filtered out

**What Happens**: Files are held in memory (not uploaded yet) while you provide metadata.

---

### Phase 2: Book Series Information

After selecting files, you'll see the **Book Series** step:

#### Required Fields

1. **Series Name** (Required)
   - The name of the book series
   - **Examples**:
     - "NCERT Mathematics Series"
     - "RD Sharma Complete Mathematics"
     - "NABH Standards Manual"

2. **Publisher** (Required)
   - Select from dropdown
   - **Common Publishers**:
     - NCERT
     - CBSE
     - RD Sharma
     - S. Chand
     - Oxford University Press
     - Pearson Education
     - Other

3. **Curriculum** (Required)
   - Select the curriculum this series belongs to
   - **Format**: "Grade Level · Subject · Board (Type)"
   - **Examples**:
     - "Class 10 · Mathematics · CBSE (academic)"
     - "Class 12 · English · NCERT (academic)"
     - "Healthcare · NABH Standards · Generic (professional)"

#### Optional Fields

4. **Description** (Optional)
   - Add context about the book series
   - **Example**: "Complete mathematics series for CBSE Class 10, aligned with latest NCERT syllabus"

#### Smart Curriculum Matching

The system automatically loads available curricula from the database. If you don't see your curriculum:

1. Contact administrator to add new curriculum
2. Or use the closest matching curriculum and note in description

**Example**:
```
Series Name: NCERT Mathematics Series
Publisher: NCERT
Curriculum: Class 10 · Mathematics · CBSE (academic)
Description: Official NCERT textbook for Class 10 CBSE Mathematics
```

---

### Phase 3: Book Details

After series information, provide details about the specific book/volume:

#### Required Fields

1. **Volume Number** (Required)
   - The volume number within the series (usually 1)
   - **Examples**: 1, 2, 3

2. **Volume Title** (Required)
   - The title of this specific book
   - **Examples**:
     - "Class 10 Mathematics"
     - "Class 12 English Core - Part 1"
     - "NABH Standards 5th Edition"

3. **Edition** (Required)
   - The edition or version
   - **Examples**:
     - "2024 Edition"
     - "Revised 2023"
     - "5th Edition"

4. **Authors** (Required)
   - Add at least one author
   - Click "Add Author" to add multiple authors
   - **Examples**:
     - "NCERT Team"
     - "Dr. R.D. Sharma"
     - "National Accreditation Board"

#### Optional Fields

5. **ISBN** (Optional)
   - The book's ISBN number
   - **Example**: "978-81-7450-678-5"

6. **Publication Year** (Optional)
   - The year of publication
   - **Example**: 2024

**Example**:
```
Volume Number: 1
Volume Title: Class 10 Mathematics
Edition: 2024 Edition
Authors: NCERT Team
ISBN: 978-81-7450-678-5
Publication Year: 2024
```

---

### Phase 4: Chapter Organization

Define the chapter structure within your book:

#### Adding Chapters

For each chapter, provide:

1. **Chapter Number** (Required)
   - Sequential number (1, 2, 3, etc.)

2. **Chapter Title** (Required)
   - The chapter's title
   - **Examples**:
     - "Real Numbers"
     - "Polynomials"
     - "Linear Equations in Two Variables"

3. **Start Page** (Optional)
   - First page of chapter
   - **Example**: 1, 15, 42

4. **End Page** (Optional)
   - Last page of chapter
   - **Example**: 14, 41, 68

5. **File Name** (Optional)
   - Which uploaded PDF contains this chapter
   - Auto-suggested if file names match chapter pattern

#### Chapter Management

- **Add Chapter**: Click "Add Chapter" button
- **Remove Chapter**: Click "Remove" next to unwanted chapter
- **Reorder Chapters**: Drag and drop to reorder (if available)
- **Validation**: System ensures at least one chapter is defined

**Example**:
```
Chapter 1: Real Numbers (Pages 1-14, File: ch1_real_numbers.pdf)
Chapter 2: Polynomials (Pages 15-41, File: ch2_polynomials.pdf)
Chapter 3: Linear Equations (Pages 42-68, File: ch3_linear_equations.pdf)
```

---

### Phase 5: Curriculum Alignment (Optional)

This step is **optional** and allows you to map chapters to curriculum topics:

#### When to Use

- For detailed curriculum tracking
- When chapters align with specific learning objectives
- For advanced analytics and reporting

#### What to Provide

1. **Topic Mappings**
   - Map each chapter to curriculum topics
   - **Example**: Chapter 1 → "Number Systems", "Real Numbers"

2. **Coverage Percentage**
   - How much of each topic is covered
   - **Example**: "Real Numbers" = 80%, "Rational Numbers" = 20%

3. **Learning Objectives**
   - Specific objectives for each chapter-topic mapping

**Most users can skip this step** - basic curriculum linking is already done in Step 2.

---

### Phase 6: Review and Submit

After completing all steps:

1. **Review Summary**
   - System shows summary of all entered data
   - Verify accuracy before submitting

2. **Submit Upload**
   - Click "Submit" or "Create Book Series"
   - System processes your upload:
     - Creates book series record
     - Creates book record
     - Creates chapter records
     - Uploads PDF files
     - Links everything together

3. **Processing**
   - You'll see a progress indicator
   - **Please wait** - do not refresh the page
   - Typical upload time: 30 seconds - 2 minutes

4. **Completion**
   - Success message appears
   - Options to:
     - View uploaded textbook in library
     - Upload another textbook

---

## Understanding the Workflow

### Hierarchy Concept

```
Book Series (NCERT Mathematics Series)
└── Book (Class 10 Mathematics - 2024 Edition)
    ├── Chapter 1: Real Numbers
    ├── Chapter 2: Polynomials
    └── Chapter 3: Linear Equations
```

### Why This Structure?

1. **Organization**: Keeps related books together
2. **Curriculum Alignment**: Links to official curricula
3. **Reusability**: Multiple books can belong to same series
4. **Scalability**: Easy to add new volumes/editions

### Data Flow

```
User Uploads PDFs
    ↓
Wizard Collects Metadata
    ↓
System Creates:
  1. Book Series (with curriculum_id FK)
  2. Book (with series_id FK)
  3. Chapters (with book_id FK)
  4. Files (linked to chapters)
    ↓
Success - Content Available in Library
```

---

## File Requirements

### Supported Formats

- **PDF**: Only format currently supported
- **Version**: PDF 1.4 or higher recommended

### File Naming Conventions

While not required, following naming conventions helps:

**Good Examples**:
```
ch1_real_numbers.pdf
ch2_polynomials.pdf
ch3_linear_equations.pdf
```

**Also Acceptable**:
```
Chapter_1.pdf
Chapter_2.pdf
Real_Numbers.pdf
```

### File Size Best Practices

- **Optimize PDFs**: Use PDF compression tools
- **Split Large Files**: If chapter exceeds 100MB, split into sections
- **Quality vs. Size**: Balance readability with file size

---

## Curriculum Selection Guide

### Understanding Curriculum Format

Curriculum entries follow this pattern:
```
[Grade Level] · [Subject] · [Board] ([Type])
```

### Common Curricula

#### Academic (K-12)

| Display | Grade | Subject | Board |
|---------|-------|---------|-------|
| Class 10 · Mathematics · CBSE (academic) | Class 10 | Mathematics | CBSE |
| Class 12 · English · NCERT (academic) | Class 12 | English | NCERT |
| Class 9 · Science · ICSE (academic) | Class 9 | Science | ICSE |

#### Professional

| Display | Grade | Subject | Board |
|---------|-------|---------|-------|
| Healthcare · NABH Standards · Generic (professional) | Healthcare | NABH Standards | Generic |
| Engineering · Technical Standards · IEEE (professional) | Engineering | Technical | IEEE |

### What If My Curriculum Isn't Listed?

1. **Check Similar**: Use closest matching curriculum
2. **Note in Description**: Explain the actual curriculum
3. **Request Addition**: Contact administrator to add new curriculum
4. **Generic Option**: Use "Generic" board for custom content

---

## Common Scenarios

### Scenario 1: Uploading NCERT Class 10 Math

**Goal**: Upload NCERT Mathematics textbook for Class 10

**Steps**:
1. Upload PDF files for all chapters
2. Series Information:
   - Series Name: "NCERT Mathematics Series"
   - Publisher: "NCERT"
   - Curriculum: "Class 10 · Mathematics · CBSE (academic)"
3. Book Details:
   - Volume: 1
   - Title: "Class 10 Mathematics"
   - Edition: "2024 Edition"
   - Authors: ["NCERT Team"]
4. Chapters:
   - Chapter 1: Real Numbers
   - Chapter 2: Polynomials
   - (etc.)

**Result**: Textbook linked to existing CBSE Class 10 Mathematics curriculum.

---

### Scenario 2: Uploading Multi-Volume Series

**Goal**: Upload RD Sharma Class 12 Math (2 volumes)

**First Upload (Volume 1)**:
1. Upload PDFs for Volume 1 chapters
2. Series Information:
   - Series Name: "RD Sharma Complete Mathematics"
   - Publisher: "Dhanpat Rai Publications"
   - Curriculum: "Class 12 · Mathematics · CBSE (academic)"
3. Book Details:
   - Volume: 1
   - Title: "Class 12 Mathematics - Part 1"
   - Edition: "2024 Edition"
4. Chapters for Volume 1

**Second Upload (Volume 2)**:
1. Upload PDFs for Volume 2 chapters
2. Series Information:
   - **Use SAME series name**: "RD Sharma Complete Mathematics"
   - Publisher: "Dhanpat Rai Publications"
   - Curriculum: "Class 12 · Mathematics · CBSE (academic)"
3. Book Details:
   - Volume: **2** (different from first)
   - Title: "Class 12 Mathematics - Part 2"
   - Edition: "2024 Edition"
4. Chapters for Volume 2

**Result**: Two books in same series, both linked to same curriculum.

---

### Scenario 3: Uploading Professional Content

**Goal**: Upload NABH accreditation standards manual

**Steps**:
1. Upload PDF files
2. Series Information:
   - Series Name: "NABH Accreditation Standards"
   - Publisher: "National Accreditation Board"
   - Curriculum: "Healthcare · NABH Standards · Generic (professional)"
3. Book Details:
   - Volume: 1
   - Title: "NABH Standards 5th Edition"
   - Edition: "5th Edition - 2023"
   - Authors: ["NABH Team"]
4. Chapters:
   - Chapter 1: Introduction to NABH
   - Chapter 2: Patient Care Standards
   - (etc.)

**Result**: Professional content properly categorized and linked.

---

## Troubleshooting

### Problem: Curriculum Options Not Loading

**Symptoms**:
- Curriculum dropdown shows loading spinner indefinitely
- Error message: "Failed to load curriculum options"

**Solutions**:
1. **Refresh Page**: Press F5 or refresh browser
2. **Check Internet**: Ensure stable connection
3. **Clear Cache**: Clear browser cache and reload
4. **Contact Support**: If persists, report to administrator

---

### Problem: "Series Name Already Exists" Error

**Symptoms**:
- Error when creating series
- Message: "Book series with this name already exists"

**Solutions**:
1. **Use Existing Series**: If intentional (e.g., adding volume 2), ensure **exact same name**
2. **Rename Series**: If new series, use different name (e.g., add edition year)
3. **Check Database**: Administrator can check existing series

---

### Problem: PDF Files Not Uploading

**Symptoms**:
- Upload seems stuck
- Files don't appear in file list

**Solutions**:
1. **Check File Size**: Ensure each file < 100MB
2. **Check File Format**: Only PDF files accepted
3. **Check File Count**: Maximum 50 files per upload
4. **Compress PDFs**: Use PDF compression tool
5. **Try Smaller Batch**: Upload fewer files at once

---

### Problem: Chapter Validation Fails

**Symptoms**:
- Cannot proceed to next step
- Error: "At least one chapter is required"

**Solutions**:
1. **Add Chapter**: Click "Add Chapter" button
2. **Fill Required Fields**: Ensure chapter number and title are provided
3. **Check Duplicates**: Ensure no duplicate chapter numbers

---

### Problem: Upload Fails During Processing

**Symptoms**:
- Processing indicator stops
- Error message appears
- Redirected back to wizard

**Solutions**:
1. **Check Data**: Review all entered information
2. **Try Again**: Wizard retains your data - fix errors and resubmit
3. **Check Server Logs**: Administrator can check backend errors
4. **Reduce File Size**: Try uploading fewer/smaller files

---

## FAQ

### Q: Can I upload the same textbook twice?

**A**: Only if using different series names or volumes. The system prevents duplicate series with same name/curriculum.

---

### Q: Can I edit textbook metadata after upload?

**A**: Currently, metadata editing is limited. Contact administrator for corrections.

---

### Q: What happens if I cancel mid-upload?

**A**: All data is discarded. You'll need to start over. No partial uploads are saved.

---

### Q: Can I upload non-PDF files?

**A**: No, only PDF format is currently supported. Convert other formats (Word, EPUB, etc.) to PDF first.

---

### Q: How do I upload textbooks in languages other than English?

**A**: The system supports Unicode. You can enter titles, descriptions, and chapter names in any language.

---

### Q: What if my textbook doesn't have clear chapter divisions?

**A**: Create logical divisions (e.g., by topic or section) and use those as "chapters" in the system.

---

### Q: Can I upload the same PDF to multiple chapters?

**A**: Yes, you can use the same file for multiple chapters by specifying different page ranges.

---

### Q: What if I make a mistake in curriculum selection?

**A**: Contact administrator. Curriculum linkage can only be changed in database directly.

---

### Q: How long are uploaded files stored?

**A**: Files are stored permanently unless explicitly deleted by administrator.

---

### Q: Can students access uploaded textbooks immediately?

**A**: Yes, once upload completes successfully, content is available in the library.

---

## Next Steps

After successful upload:

1. **View in Library**: Check your textbook appears correctly in `/textbooks/library`
2. **Verify Chapters**: Ensure all chapters are listed properly
3. **Test Access**: Try accessing a chapter to verify PDF rendering
4. **Upload More**: Return to upload page for additional textbooks

---

## Support

For additional help:

- **Technical Issues**: Contact system administrator
- **Content Questions**: Contact curriculum team
- **Feature Requests**: Submit via feedback form

---

**Document Version**: 1.0
**Last Updated**: September 19, 2025
**Feature**: FC-00-AC (Book Hierarchy Integration)
**Maintained By**: PingLearn Development Team
