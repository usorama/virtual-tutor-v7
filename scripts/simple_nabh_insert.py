#!/usr/bin/env python3
"""
Simple NABH manual insertion - minimal approach
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Load JSON data
json_path = Path("/Users/umasankrudhya/Projects/pinglearn/text-books/NABH-manual/Dental-Accreditation-Standards NABH MANUAL.json")

if not json_path.exists():
    print(f"❌ JSON file not found: {json_path}")
    sys.exit(1)

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print("📄 Loaded JSON data successfully")
print(f"  - Textbook: {data['textbook']['title']}")
print(f"  - Chapters: {len(data['chapters'])}")
print(f"  - Content chunks: {len(data['chunks'])}")

# Since direct Supabase connection seems to have issues, let's prepare SQL statements
# that can be executed via the app or other means

print("\n📝 Generating SQL statements for manual insertion...")

# Generate SQL for textbook
textbook = data['textbook']
textbook_sql = f"""
-- Insert NABH Textbook
INSERT INTO public.textbooks (
    id, file_name, title, grade, subject,
    total_pages, file_size_mb, status, processed_at
) VALUES (
    '{textbook['id']}',
    '{textbook['file_name'].replace("'", "''")}',
    '{textbook['title'].replace("'", "''")}',
    {textbook['grade']},
    '{textbook['subject']}',
    {textbook['total_pages']},
    {textbook['file_size_mb']:.2f},
    'ready',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    processed_at = EXCLUDED.processed_at;
"""

# Save SQL to file
sql_file = Path("/Users/umasankrudhya/Projects/pinglearn/scripts/nabh_insert.sql")

with open(sql_file, 'w', encoding='utf-8') as f:
    f.write("-- NABH Manual Database Insertion SQL\n")
    f.write("-- Generated: " + datetime.now().isoformat() + "\n\n")
    f.write("BEGIN;\n\n")

    # Textbook
    f.write(textbook_sql)
    f.write("\n\n")

    # Chapters
    f.write("-- Insert Chapters\n")
    for chapter in data['chapters'][:10]:  # Limit to first 10 for testing
        chapter_sql = f"""
INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '{chapter['id']}',
    '{chapter['textbook_id']}',
    {chapter['chapter_number']},
    '{chapter['title'].replace("'", "''")}',
    ARRAY{chapter['topics']!r},
    {chapter['start_page']},
    {chapter['end_page']}
);
"""
        f.write(chapter_sql)

    f.write("\n\n")

    # Content chunks (sample)
    f.write("-- Insert Content Chunks (first 20)\n")
    for chunk in data['chunks'][:20]:  # Limit to first 20 for testing
        content_escaped = chunk['content'].replace("'", "''").replace("\n", "\\n")
        if len(content_escaped) > 5000:  # Truncate very long content
            content_escaped = content_escaped[:5000] + "..."

        chunk_sql = f"""
INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '{chunk['id']}',
    '{chunk['chapter_id']}',
    {chunk['chunk_index']},
    '{content_escaped}',
    '{chunk['content_type']}',
    {chunk.get('token_count', 0)},
    {chunk.get('page_number', 1)}
);
"""
        f.write(chunk_sql)

    f.write("\n\nCOMMIT;\n")

print(f"✅ SQL file generated: {sql_file}")
print("\nNext steps:")
print("1. Review the SQL file")
print("2. Execute it via Supabase dashboard or pgAdmin")
print("3. Or use the app's existing textbook upload mechanism")

# Alternative: Create a simplified JSON for app upload
simplified_json = {
    "file_name": textbook['file_name'],
    "title": textbook['title'],
    "grade": textbook['grade'],
    "subject": textbook['subject'],
    "chapters": []
}

for chapter in data['chapters'][:10]:
    chapter_simple = {
        "number": chapter['chapter_number'],
        "title": chapter['title'],
        "content": "",
        "topics": chapter['topics'][:5]  # Limit topics
    }

    # Combine first few chunks as chapter content
    chapter_chunks = [c for c in data['chunks'] if c['chapter_id'] == chapter['id']][:3]
    if chapter_chunks:
        chapter_simple['content'] = "\n\n".join([c['content'][:500] for c in chapter_chunks])

    simplified_json['chapters'].append(chapter_simple)

simplified_path = Path("/Users/umasankrudhya/Projects/pinglearn/scripts/nabh_simplified.json")
with open(simplified_path, 'w', encoding='utf-8') as f:
    json.dump(simplified_json, f, indent=2)

print(f"\n📋 Simplified JSON for app upload: {simplified_path}")
print("\n✅ Processing complete!")