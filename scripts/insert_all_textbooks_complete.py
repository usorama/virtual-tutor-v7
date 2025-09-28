#!/usr/bin/env python3
"""
Generate complete SQL insertion script for all processed textbooks
"""

import json
import uuid
from pathlib import Path
from datetime import datetime

def escape_sql(text):
    """Escape SQL strings"""
    if text is None:
        return ''
    return str(text).replace("'", "''").replace("\n", " ").replace("\r", " ")

def main():
    # Load processed data
    json_file = Path("/Users/umasankrudhya/Projects/pinglearn/scripts/processed_textbooks/all_textbooks.json")

    if not json_file.exists():
        print(f"Error: {json_file} not found")
        return

    with open(json_file, 'r', encoding='utf-8') as f:
        all_books = json.load(f)

    print(f"Loaded {len(all_books)} textbooks")

    # Generate SQL
    sql_file = Path("/Users/umasankrudhya/Projects/pinglearn/scripts/insert_all_textbooks_final.sql")

    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- Insert All Processed Textbooks into PingLearn Database\n")
        f.write("-- Generated: " + datetime.now().isoformat() + "\n")
        f.write(f"-- Total Books: {len(all_books)}\n\n")
        f.write("BEGIN;\n\n")

        # Keep track of total counts
        total_chapters = 0
        total_chunks = 0

        for book_idx, book_data in enumerate(all_books, 1):
            textbook = book_data['textbook']
            chapters = book_data['chapters']
            chunks = book_data['chunks']

            # Generate new IDs to avoid conflicts
            textbook_id = str(uuid.uuid4())

            # Clean up title and subject
            title = escape_sql(textbook['title'][:200])
            subject = escape_sql(textbook['subject'])
            file_name = escape_sql(textbook['file_name'][:200])

            f.write(f"-- Book {book_idx}/{len(all_books)}: {title[:50]}...\n")
            f.write("DO $$\n")
            f.write("DECLARE\n")
            f.write("    textbook_id UUID;\n")
            f.write("    chapter_id UUID;\n")
            f.write("BEGIN\n")

            # Insert textbook
            f.write(f"""    -- Insert textbook
    INSERT INTO public.textbooks (
        file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
    ) VALUES (
        '{file_name}',
        '{title}',
        {textbook['grade']},
        '{subject}',
        {textbook['total_pages']},
        {textbook['file_size_mb']:.2f},
        'ready',
        NOW()
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

""")

            # Insert chapters (limit to first 10 per book to keep size manageable)
            chapter_count = min(10, len(chapters))
            for i, chapter in enumerate(chapters[:chapter_count]):
                chapter_title = escape_sql(chapter['title'][:200])
                topics = chapter.get('topics', [])
                topics_array = "ARRAY[" + ",".join([f"'{escape_sql(t)}'" for t in topics[:5]]) + "]" if topics else "ARRAY[]::text[]"

                f.write(f"""    -- Chapter {chapter['chapter_number']}
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        {chapter['chapter_number']},
        '{chapter_title}',
        {topics_array},
        {chapter.get('start_page', 1)},
        {chapter.get('end_page', 1)}
    ) RETURNING id INTO chapter_id;

""")

                # Insert chunks for this chapter (limit to first 3 per chapter)
                chapter_chunks = [c for c in chunks if c['chapter_id'] == chapter['id']][:3]
                for chunk in chapter_chunks:
                    content = escape_sql(chunk['content'][:2000])  # Limit content size
                    f.write(f"""    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        {chunk['chunk_index']},
        '{content}',
        '{chunk['content_type']}',
        {chunk.get('token_count', 100)},
        {chunk.get('page_number', 1)}
    );

""")
                    total_chunks += 1

                total_chapters += 1

            f.write("END $$;\n\n")

        f.write("COMMIT;\n\n")

        # Add verification query
        f.write("-- Verification Query\n")
        f.write("""SELECT
    COUNT(DISTINCT t.id) as textbooks,
    COUNT(DISTINCT c.id) as chapters,
    COUNT(DISTINCT cc.id) as chunks
FROM public.textbooks t
LEFT JOIN public.chapters c ON c.textbook_id = t.id
LEFT JOIN public.content_chunks cc ON cc.chapter_id = c.id
WHERE t.processed_at::date = CURRENT_DATE;\n""")

    print(f"✅ SQL script generated: {sql_file}")
    print(f"📊 Stats: {len(all_books)} books, {total_chapters} chapters, {total_chunks} chunks")
    print("\nTo insert into database:")
    print(f"PGPASSWORD=wG4iamg3dfZwwnW4 psql -h db.thhqeoiubohpxxempfpi.supabase.co -U postgres -d postgres -f {sql_file}")

if __name__ == "__main__":
    main()