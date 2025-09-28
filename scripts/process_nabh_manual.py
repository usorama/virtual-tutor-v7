#!/usr/bin/env python3
"""
Process NABH Dental Accreditation Standards Manual for PingLearn
This script extracts content from the NABH PDF and stores it in the database
for the AI teacher to use.
"""

import sys
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import re

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from pypdf import PdfReader
except ImportError:
    print("Error: pypdf not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    from pypdf import PdfReader


class NABHProcessor:
    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        self.textbook_id = str(uuid.uuid4())
        self.reader = None
        self.text_content = []
        self.chapters = []
        self.content_chunks = []

    def extract_text(self) -> str:
        """Extract text from PDF"""
        print(f"📖 Reading PDF: {self.pdf_path}")
        self.reader = PdfReader(str(self.pdf_path))

        full_text = ""
        for i, page in enumerate(self.reader.pages):
            try:
                text = page.extract_text()
                if text:
                    self.text_content.append({
                        'page': i + 1,
                        'text': text
                    })
                    full_text += text + "\n"
            except Exception as e:
                print(f"⚠️  Error reading page {i+1}: {e}")
                continue

        print(f"✅ Extracted text from {len(self.reader.pages)} pages")
        return full_text

    def identify_chapters(self, text: str) -> List[Dict]:
        """Identify chapters/sections in NABH manual"""
        chapters = []

        # NABH manual specific patterns
        patterns = [
            r'(?:Chapter|Section|Part)\s+(\d+)[:\s]+([^\n]+)',
            r'(\d+)\.\s+([A-Z][^\n]+)',
            r'^([A-Z]{2,}[A-Z\s]+)$',  # All caps headings
        ]

        lines = text.split('\n')
        current_chapter = None
        current_content = []
        chapter_num = 0

        for i, line in enumerate(lines):
            line_clean = line.strip()
            if not line_clean:
                continue

            # Check if this is a chapter/section heading
            is_chapter = False
            chapter_title = ""

            # Check for standard headings in NABH manual
            if any(keyword in line_clean for keyword in ['Standard', 'Objective', 'Intent', 'Elements']):
                is_chapter = True
                chapter_title = line_clean
                chapter_num += 1

            # Check patterns
            for pattern in patterns:
                match = re.match(pattern, line_clean)
                if match:
                    is_chapter = True
                    chapter_title = line_clean
                    chapter_num += 1
                    break

            if is_chapter and chapter_title:
                # Save previous chapter
                if current_chapter:
                    current_chapter['content'] = '\n'.join(current_content)
                    current_chapter['topics'] = self.extract_topics(current_chapter['content'])
                    chapters.append(current_chapter)

                # Start new chapter
                current_chapter = {
                    'number': chapter_num,
                    'title': chapter_title[:200],  # Limit title length
                    'content': '',
                    'topics': [],
                    'start_page': (i // 40) + 1,  # Rough page estimation
                    'end_page': (i // 40) + 1
                }
                current_content = []
            elif current_chapter:
                current_content.append(line)
                current_chapter['end_page'] = (i // 40) + 1

        # Save last chapter
        if current_chapter:
            current_chapter['content'] = '\n'.join(current_content)
            current_chapter['topics'] = self.extract_topics(current_chapter['content'])
            chapters.append(current_chapter)

        # If no chapters identified, create one for the entire content
        if not chapters:
            chapters.append({
                'number': 1,
                'title': 'NABH Dental Accreditation Standards',
                'content': text,
                'topics': self.extract_topics(text),
                'start_page': 1,
                'end_page': len(self.reader.pages) if self.reader else 1
            })

        print(f"✅ Identified {len(chapters)} chapters/sections")
        self.chapters = chapters
        return chapters

    def extract_topics(self, content: str) -> List[str]:
        """Extract key topics from content"""
        topics = []

        # NABH specific topic patterns
        topic_patterns = [
            r'Standard\s+([A-Z]+\d+)',
            r'Intent:\s+([^\n]+)',
            r'Objective\s+(\d+[:\s]+[^\n]+)',
            r'(\w+\s+Management)',
            r'(\w+\s+Safety)',
            r'(Patient\s+\w+)',
            r'(Clinical\s+\w+)',
            r'(Quality\s+\w+)',
        ]

        for pattern in topic_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                topic = match.group(1).strip()
                if 10 < len(topic) < 100 and topic not in topics:
                    topics.append(topic)

        return topics[:20]  # Limit to 20 topics per chapter

    def chunk_content(self, text: str, max_tokens: int = 1000) -> List[Dict]:
        """Chunk content for optimal AI processing"""
        chunks = []

        # Split by paragraphs
        paragraphs = text.split('\n\n')

        current_chunk = ""
        current_type = "text"
        chunk_index = 0

        for para in paragraphs:
            para_clean = para.strip()
            if not para_clean:
                continue

            # Detect content type
            content_type = self.detect_content_type(para_clean)

            # Estimate tokens (rough: 1 token ≈ 4 chars)
            para_tokens = len(para_clean) // 4
            current_tokens = len(current_chunk) // 4

            if current_tokens + para_tokens > max_tokens and current_chunk:
                # Save current chunk
                chunks.append({
                    'index': chunk_index,
                    'content': current_chunk.strip(),
                    'type': current_type,
                    'token_count': current_tokens
                })
                chunk_index += 1
                current_chunk = para_clean
                current_type = content_type
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para_clean
                else:
                    current_chunk = para_clean

                if content_type != 'text' and current_type == 'text':
                    current_type = content_type

        # Save last chunk
        if current_chunk:
            chunks.append({
                'index': chunk_index,
                'content': current_chunk.strip(),
                'type': current_type,
                'token_count': len(current_chunk) // 4
            })

        return chunks

    def detect_content_type(self, text: str) -> str:
        """Detect type of content for NABH manual"""
        text_lower = text.lower()

        if any(word in text_lower for word in ['standard', 'requirement', 'shall', 'must']):
            return 'standard'
        elif any(word in text_lower for word in ['example', 'e.g.', 'for instance', 'such as']):
            return 'example'
        elif any(word in text_lower for word in ['intent', 'purpose', 'objective', 'goal']):
            return 'objective'
        elif any(word in text_lower for word in ['measurable element', 'assessment', 'evaluation']):
            return 'assessment'
        else:
            return 'text'

    def prepare_database_records(self) -> Dict:
        """Prepare records for database insertion"""

        # Textbook record
        textbook = {
            'id': self.textbook_id,
            'file_name': self.pdf_path.name,
            'title': 'NABH Dental Accreditation Standards Manual',
            'grade': 0,  # Professional level, not grade-specific
            'subject': 'Healthcare Administration',
            'total_pages': len(self.reader.pages) if self.reader else 0,
            'file_size_mb': self.pdf_path.stat().st_size / (1024 * 1024),
            'status': 'ready',
            'processed_at': datetime.now().isoformat()
        }

        # Chapter records
        chapter_records = []
        chunk_records = []

        for chapter in self.chapters:
            chapter_id = str(uuid.uuid4())

            chapter_records.append({
                'id': chapter_id,
                'textbook_id': self.textbook_id,
                'chapter_number': chapter['number'],
                'title': chapter['title'],
                'topics': chapter['topics'],
                'start_page': chapter['start_page'],
                'end_page': chapter['end_page']
            })

            # Chunk the chapter content
            chunks = self.chunk_content(chapter['content'])

            for chunk in chunks:
                chunk_records.append({
                    'id': str(uuid.uuid4()),
                    'chapter_id': chapter_id,
                    'chunk_index': chunk['index'],
                    'content': chunk['content'],
                    'content_type': chunk['type'] if chunk['type'] in ['text', 'example', 'exercise', 'summary'] else 'text',
                    'token_count': chunk['token_count'],
                    'page_number': chapter['start_page'] + (chunk['index'] * (chapter['end_page'] - chapter['start_page']) // len(chunks))
                })

        print(f"📊 Prepared records:")
        print(f"  - 1 textbook")
        print(f"  - {len(chapter_records)} chapters")
        print(f"  - {len(chunk_records)} content chunks")

        return {
            'textbook': textbook,
            'chapters': chapter_records,
            'chunks': chunk_records
        }

    def export_to_json(self, output_path: Optional[str] = None) -> str:
        """Export processed data to JSON for database insertion"""
        if not output_path:
            output_path = self.pdf_path.with_suffix('.json')

        data = self.prepare_database_records()

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"💾 Exported data to: {output_path}")
        return str(output_path)

    def process(self) -> Dict:
        """Main processing pipeline"""
        print("🚀 Starting NABH Manual Processing")
        print("-" * 50)

        # Extract text
        full_text = self.extract_text()

        # Identify chapters
        self.identify_chapters(full_text)

        # Prepare database records
        records = self.prepare_database_records()

        # Export to JSON
        json_path = self.export_to_json()

        print("-" * 50)
        print("✅ Processing complete!")
        print(f"📄 JSON output: {json_path}")
        print("\nNext steps:")
        print("1. Review the generated JSON file")
        print("2. Use the insert_to_database.py script to load into Supabase")

        return records


def main():
    """Main entry point"""
    pdf_path = "/Users/umasankrudhya/Projects/pinglearn/text-books/NABH-manual/Dental-Accreditation-Standards NABH MANUAL.pdf"

    if not Path(pdf_path).exists():
        print(f"❌ Error: PDF not found at {pdf_path}")
        sys.exit(1)

    processor = NABHProcessor(pdf_path)
    processor.process()


if __name__ == "__main__":
    main()