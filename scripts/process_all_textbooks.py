#!/usr/bin/env python3
"""
Process all textbooks (except Mathematics and NABH) for PingLearn
This script extracts content from PDFs and prepares them for database insertion
"""

import sys
import json
import uuid
import re
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import hashlib

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from pypdf import PdfReader
except ImportError:
    print("Error: pypdf not installed")
    sys.exit(1)


class TextbookProcessor:
    def __init__(self):
        self.processed_books = []
        self.base_dir = Path("/Users/umasankrudhya/Projects/pinglearn/text-books")
        self.output_dir = Path("/Users/umasankrudhya/Projects/pinglearn/scripts/processed_textbooks")
        self.output_dir.mkdir(exist_ok=True)

    def clean_filename(self, filename: str) -> Tuple[str, int, str]:
        """Extract subject, chapter number, and title from filename"""

        # Remove .pdf extension
        name = filename.replace('.pdf', '')

        # Default values
        subject = "General"
        chapter_num = 0
        title = name

        # Try to parse structured filenames
        # Pattern: Subject - Ch XX - Title
        pattern = r'^(.+?)\s*-\s*Ch\s*(\d+)\s*-\s*(.+)$'
        match = re.match(pattern, name)

        if match:
            subject = match.group(1).strip()
            chapter_num = int(match.group(2))
            title = match.group(3).strip()
        else:
            # Try to extract subject from path
            parts = filename.split('/')
            if len(parts) > 1:
                folder = parts[-2]
                if "Health" in folder:
                    subject = "Health and Physical Education"
                elif "Science" in folder:
                    subject = "Science"
                elif "English" in folder:
                    subject = "English"

            # Clean up title
            title = name.replace("Class X", "").replace("NCERT", "").strip()
            title = re.sub(r'\s+\(\d+\)$', '', title)  # Remove (2), (3) etc
            title = re.sub(r'\s+', ' ', title).strip()

            # Limit title length
            if len(title) > 100:
                title = title[:97] + "..."

        return subject, chapter_num, title

    def extract_grade(self, path: str) -> int:
        """Extract grade level from path or filename"""
        if "Class X" in path or "Grade 10" in path:
            return 10
        elif "Class IX" in path or "Grade 9" in path:
            return 9
        elif "Class XI" in path or "Grade 11" in path:
            return 11
        elif "Class XII" in path or "Grade 12" in path:
            return 12
        else:
            return 10  # Default to Grade 10

    def process_pdf(self, pdf_path: Path) -> Optional[Dict]:
        """Process a single PDF file"""

        print(f"📖 Processing: {pdf_path.name}")

        try:
            reader = PdfReader(str(pdf_path))
            num_pages = len(reader.pages)

            if num_pages == 0:
                print(f"  ⚠️  Empty PDF, skipping")
                return None

            # Extract text from first few pages to identify content
            sample_text = ""
            for i in range(min(3, num_pages)):
                try:
                    page_text = reader.pages[i].extract_text()
                    if page_text:
                        sample_text += page_text + "\n"
                except Exception:
                    continue

            if not sample_text:
                print(f"  ⚠️  No extractable text, skipping")
                return None

            # Parse filename for metadata
            subject, chapter_num, title = self.clean_filename(pdf_path.name)
            grade = self.extract_grade(str(pdf_path))

            # Generate unique ID based on file content
            file_hash = hashlib.md5(pdf_path.read_bytes()).hexdigest()[:8]
            textbook_id = str(uuid.uuid4())

            # Create textbook record
            textbook = {
                'id': textbook_id,
                'file_name': pdf_path.name[:200],  # Limit filename length
                'title': title[:200],  # Limit title length
                'grade': grade,
                'subject': subject,
                'total_pages': num_pages,
                'file_size_mb': pdf_path.stat().st_size / (1024 * 1024),
                'status': 'ready',
                'processed_at': datetime.now().isoformat(),
                'original_path': str(pdf_path)
            }

            # Extract chapters
            chapters = self.extract_chapters_smart(reader, sample_text, textbook_id)

            # Create content chunks for each chapter
            all_chunks = []
            for chapter in chapters:
                chunks = self.create_chunks(chapter)
                all_chunks.extend(chunks)

            print(f"  ✅ Processed: {len(chapters)} chapters, {len(all_chunks)} chunks")

            return {
                'textbook': textbook,
                'chapters': chapters,
                'chunks': all_chunks
            }

        except Exception as e:
            print(f"  ❌ Error processing {pdf_path.name}: {e}")
            return None

    def extract_chapters_smart(self, reader, sample_text: str, textbook_id: str) -> List[Dict]:
        """Smart chapter extraction based on content patterns"""

        chapters = []

        # Try to extract full text
        full_text = ""
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text:
                    full_text += f"\n--- Page {i+1} ---\n{text}"
            except Exception:
                continue

        if not full_text:
            # Fallback: create single chapter
            return [{
                'id': str(uuid.uuid4()),
                'textbook_id': textbook_id,
                'chapter_number': 1,
                'title': 'Complete Content',
                'topics': [],
                'start_page': 1,
                'end_page': len(reader.pages),
                'content': sample_text[:10000]  # Limit content size
            }]

        # Look for chapter patterns
        chapter_patterns = [
            r'Chapter\s+(\d+)[:\s]+([^\n]+)',
            r'Unit\s+(\d+)[:\s]+([^\n]+)',
            r'Lesson\s+(\d+)[:\s]+([^\n]+)',
            r'Section\s+(\d+)[:\s]+([^\n]+)',
            r'^(\d+)\.\s+([A-Z][^\n]+)',
            r'^Module\s+(\d+)[:\s]+([^\n]+)'
        ]

        lines = full_text.split('\n')
        current_chapter = None
        current_content = []
        chapter_count = 0

        for i, line in enumerate(lines):
            line_clean = line.strip()

            # Check if this is a chapter heading
            is_chapter = False
            for pattern in chapter_patterns:
                match = re.match(pattern, line_clean, re.IGNORECASE)
                if match:
                    # Save previous chapter if exists
                    if current_chapter and current_content:
                        current_chapter['content'] = '\n'.join(current_content[:500])  # Limit lines
                        chapters.append(current_chapter)

                    # Start new chapter
                    chapter_count += 1
                    current_chapter = {
                        'id': str(uuid.uuid4()),
                        'textbook_id': textbook_id,
                        'chapter_number': chapter_count,
                        'title': line_clean[:200],
                        'topics': [],
                        'start_page': (i // 50) + 1,  # Rough estimate
                        'end_page': (i // 50) + 1,
                        'content': ''
                    }
                    current_content = []
                    is_chapter = True
                    break

            if not is_chapter and current_chapter:
                current_content.append(line)
                current_chapter['end_page'] = (i // 50) + 1

        # Save last chapter
        if current_chapter and current_content:
            current_chapter['content'] = '\n'.join(current_content[:500])
            chapters.append(current_chapter)

        # If no chapters found, create logical sections
        if not chapters:
            # Split content into logical sections
            pages_per_chapter = max(1, len(reader.pages) // 5)
            for i in range(0, len(reader.pages), pages_per_chapter):
                chapter_num = (i // pages_per_chapter) + 1
                end_page = min(i + pages_per_chapter, len(reader.pages))

                chapter_content = ""
                for j in range(i, end_page):
                    try:
                        page_text = reader.pages[j].extract_text()
                        if page_text:
                            chapter_content += page_text + "\n"
                    except Exception:
                        continue

                chapters.append({
                    'id': str(uuid.uuid4()),
                    'textbook_id': textbook_id,
                    'chapter_number': chapter_num,
                    'title': f'Section {chapter_num}',
                    'topics': self.extract_topics(chapter_content),
                    'start_page': i + 1,
                    'end_page': end_page,
                    'content': chapter_content[:10000]  # Limit content
                })

        return chapters

    def extract_topics(self, content: str) -> List[str]:
        """Extract key topics from content"""
        topics = []

        # Common topic patterns
        topic_patterns = [
            r'Topic[:\s]+([^\n]+)',
            r'Learning Objective[:\s]+([^\n]+)',
            r'Key Concept[:\s]+([^\n]+)',
            r'^\d+\.\d+\s+([^\n]+)',
            r'•\s+([A-Z][^\n]+)',
        ]

        for pattern in topic_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                topic = match.group(1).strip()
                if 10 < len(topic) < 100 and topic not in topics:
                    topics.append(topic)
                    if len(topics) >= 10:
                        break

        return topics[:10]  # Max 10 topics

    def create_chunks(self, chapter: Dict) -> List[Dict]:
        """Create content chunks from chapter"""
        chunks = []

        content = chapter.get('content', '')
        if not content:
            return chunks

        # Split into paragraphs
        paragraphs = content.split('\n\n')

        current_chunk = ""
        chunk_index = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check chunk size (rough token estimate)
            if len(current_chunk) + len(para) > 3000:  # ~750 tokens
                if current_chunk:
                    chunks.append({
                        'id': str(uuid.uuid4()),
                        'chapter_id': chapter['id'],
                        'chunk_index': chunk_index,
                        'content': current_chunk[:5000],  # Limit chunk size
                        'content_type': self.detect_content_type(current_chunk),
                        'token_count': len(current_chunk) // 4,
                        'page_number': chapter['start_page']
                    })
                    chunk_index += 1
                current_chunk = para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para

        # Save last chunk
        if current_chunk:
            chunks.append({
                'id': str(uuid.uuid4()),
                'chapter_id': chapter['id'],
                'chunk_index': chunk_index,
                'content': current_chunk[:5000],
                'content_type': self.detect_content_type(current_chunk),
                'token_count': len(current_chunk) // 4,
                'page_number': chapter['end_page']
            })

        # Ensure at least one chunk per chapter
        if not chunks and content:
            chunks.append({
                'id': str(uuid.uuid4()),
                'chapter_id': chapter['id'],
                'chunk_index': 0,
                'content': content[:5000],
                'content_type': 'text',
                'token_count': len(content) // 4,
                'page_number': chapter['start_page']
            })

        return chunks

    def detect_content_type(self, text: str) -> str:
        """Detect content type"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['example', 'e.g.', 'for instance']):
            return 'example'
        elif any(word in text_lower for word in ['exercise', 'question', 'problem', 'solve']):
            return 'exercise'
        elif any(word in text_lower for word in ['summary', 'conclusion', 'recap']):
            return 'summary'
        else:
            return 'text'

    def process_all(self):
        """Process all textbooks"""

        # Find all PDFs
        pdf_files = []
        for pattern in ['*.pdf', '**/*.pdf']:
            for pdf_path in self.base_dir.glob(pattern):
                # Skip Mathematics and NABH
                if 'Mathematics' in str(pdf_path) or 'NABH' in str(pdf_path):
                    continue

                # Skip duplicates (files ending with (2), (3), etc)
                if re.search(r'\s+\(\d+\)\.pdf$', pdf_path.name):
                    continue

                pdf_files.append(pdf_path)

        print(f"🎯 Found {len(pdf_files)} PDFs to process")
        print("=" * 60)

        # Process each PDF
        for i, pdf_path in enumerate(pdf_files, 1):
            print(f"\n[{i}/{len(pdf_files)}] Processing {pdf_path.name[:60]}...")

            result = self.process_pdf(pdf_path)
            if result:
                self.processed_books.append(result)

                # Save individual JSON for this book
                safe_name = re.sub(r'[^\w\s-]', '_', pdf_path.stem)[:50]
                output_file = self.output_dir / f"{safe_name}.json"

                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)

        # Save combined results
        print("\n" + "=" * 60)
        print(f"✅ Successfully processed {len(self.processed_books)} textbooks")

        combined_file = self.output_dir / "all_textbooks.json"
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(self.processed_books, f, indent=2, ensure_ascii=False)

        print(f"💾 Saved to: {combined_file}")

        # Generate SQL insertion script
        self.generate_sql()

    def generate_sql(self):
        """Generate SQL insertion script"""

        sql_file = self.output_dir / "insert_all_textbooks.sql"

        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- Insert All Processed Textbooks\n")
            f.write("-- Generated: " + datetime.now().isoformat() + "\n\n")
            f.write("BEGIN;\n\n")

            for book_data in self.processed_books:
                textbook = book_data['textbook']

                # Textbook SQL
                f.write(f"-- Textbook: {textbook['title'][:50]}\n")
                f.write(f"""INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    '{self.escape_sql(textbook['file_name'])}',
    '{self.escape_sql(textbook['title'])}',
    {textbook['grade']},
    '{self.escape_sql(textbook['subject'])}',
    {textbook['total_pages']},
    {textbook['file_size_mb']:.2f},
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;\n\n""")

            f.write("COMMIT;\n")

        print(f"📝 SQL script: {sql_file}")

    def escape_sql(self, text: str) -> str:
        """Escape SQL strings"""
        return text.replace("'", "''").replace("\n", " ").replace("\r", " ")


def main():
    """Main entry point"""
    processor = TextbookProcessor()
    processor.process_all()


if __name__ == "__main__":
    main()