#!/usr/bin/env python3
"""
Insert processed NABH manual data into Supabase database
"""

import json
import sys
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import os

# Supabase credentials (from .creds)
SUPABASE_URL = "https://thhqeoiubohpxxempfpi.supabase.co"
# Using service role key for admin operations (bypasses RLS)
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaHFlb2l1Ym9ocHh4ZW1wZnBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDcyMjYwMCwiZXhwIjoyMDUwMjk4NjAwfQ.jrKc5Xz0a0K7cVNYPhZi_4fPGq5TpVdCk3H94K5Xqzc"

try:
    from supabase import create_client, Client
except ImportError:
    print("Installing supabase-py...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase"])
    from supabase import create_client, Client


class NABHDatabaseInserter:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.json_path = Path("/Users/umasankrudhya/Projects/pinglearn/text-books/NABH-manual/Dental-Accreditation-Standards NABH MANUAL.json")

    def load_json_data(self) -> Dict:
        """Load the processed JSON data"""
        if not self.json_path.exists():
            raise FileNotFoundError(f"JSON file not found: {self.json_path}")

        with open(self.json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"📄 Loaded JSON data from: {self.json_path}")
        print(f"  - Textbook: {data['textbook']['title']}")
        print(f"  - Chapters: {len(data['chapters'])}")
        print(f"  - Content chunks: {len(data['chunks'])}")

        return data

    def insert_textbook(self, textbook_data: Dict) -> str:
        """Insert textbook record"""
        try:
            # Check if textbook already exists
            existing = self.supabase.table('textbooks').select('id').eq('file_name', textbook_data['file_name']).execute()

            if existing.data:
                print(f"⚠️  Textbook already exists with ID: {existing.data[0]['id']}")
                print("  Deleting existing textbook and related data...")

                # Delete existing textbook (cascade will handle related records)
                self.supabase.table('textbooks').delete().eq('id', existing.data[0]['id']).execute()
                print("  ✅ Deleted existing textbook")

            # Insert new textbook
            result = self.supabase.table('textbooks').insert(textbook_data).execute()

            if result.data:
                textbook_id = result.data[0]['id']
                print(f"✅ Inserted textbook with ID: {textbook_id}")
                return textbook_id
            else:
                raise Exception("Failed to insert textbook")

        except Exception as e:
            print(f"❌ Error inserting textbook: {e}")
            raise

    def insert_chapters(self, chapters: List[Dict]) -> Dict[str, str]:
        """Insert chapter records and return mapping of old to new IDs"""
        chapter_id_map = {}

        try:
            print(f"📚 Inserting {len(chapters)} chapters...")

            for i, chapter in enumerate(chapters, 1):
                old_id = chapter['id']

                # Insert chapter
                result = self.supabase.table('chapters').insert(chapter).execute()

                if result.data:
                    new_id = result.data[0]['id']
                    chapter_id_map[old_id] = new_id
                    print(f"  ✅ Chapter {i}/{len(chapters)}: {chapter['title'][:50]}...")
                else:
                    print(f"  ⚠️  Failed to insert chapter {i}")

            print(f"✅ Successfully inserted {len(chapter_id_map)} chapters")
            return chapter_id_map

        except Exception as e:
            print(f"❌ Error inserting chapters: {e}")
            raise

    def insert_chunks(self, chunks: List[Dict], chapter_id_map: Dict[str, str]):
        """Insert content chunks with updated chapter IDs"""
        try:
            print(f"📄 Inserting {len(chunks)} content chunks...")

            # Update chapter IDs in chunks
            updated_chunks = []
            for chunk in chunks:
                if chunk['chapter_id'] in chapter_id_map:
                    chunk_copy = chunk.copy()
                    chunk_copy['chapter_id'] = chapter_id_map[chunk['chapter_id']]
                    updated_chunks.append(chunk_copy)

            # Batch insert in groups of 50
            batch_size = 50
            for i in range(0, len(updated_chunks), batch_size):
                batch = updated_chunks[i:i+batch_size]
                result = self.supabase.table('content_chunks').insert(batch).execute()

                if result.data:
                    print(f"  ✅ Inserted batch {i//batch_size + 1}/{(len(updated_chunks)-1)//batch_size + 1}")
                else:
                    print(f"  ⚠️  Failed to insert batch {i//batch_size + 1}")

            print(f"✅ Successfully inserted content chunks")

        except Exception as e:
            print(f"❌ Error inserting chunks: {e}")
            raise

    def verify_insertion(self, textbook_id: str):
        """Verify that the data was inserted correctly"""
        try:
            print("\n🔍 Verifying insertion...")

            # Check textbook
            textbook = self.supabase.table('textbooks').select('*').eq('id', textbook_id).execute()
            if textbook.data:
                print(f"  ✅ Textbook found: {textbook.data[0]['title']}")

            # Count chapters
            chapters = self.supabase.table('chapters').select('id').eq('textbook_id', textbook_id).execute()
            print(f"  ✅ Chapters count: {len(chapters.data)}")

            # Count chunks (sample from first chapter)
            if chapters.data:
                chunks = self.supabase.table('content_chunks').select('id').eq('chapter_id', chapters.data[0]['id']).execute()
                print(f"  ✅ Sample chunks count (first chapter): {len(chunks.data)}")

            print("\n✅ Data successfully loaded into database!")

        except Exception as e:
            print(f"❌ Error verifying insertion: {e}")

    def run(self):
        """Main insertion process"""
        print("🚀 Starting database insertion process")
        print("-" * 50)

        try:
            # Load JSON data
            data = self.load_json_data()

            # Insert textbook
            print("\n📗 Inserting textbook...")
            textbook_id = self.insert_textbook(data['textbook'])

            # Update chapter records with correct textbook_id
            for chapter in data['chapters']:
                chapter['textbook_id'] = textbook_id

            # Insert chapters
            print("\n📚 Inserting chapters...")
            chapter_id_map = self.insert_chapters(data['chapters'])

            # Insert content chunks
            print("\n📄 Inserting content chunks...")
            self.insert_chunks(data['chunks'], chapter_id_map)

            # Verify insertion
            self.verify_insertion(textbook_id)

            print("-" * 50)
            print("🎉 NABH Manual successfully loaded into database!")
            print(f"📖 Textbook ID: {textbook_id}")
            print("\n✨ The AI teacher can now use this content for teaching!")

        except Exception as e:
            print(f"\n❌ Failed to complete insertion: {e}")
            sys.exit(1)


def main():
    """Main entry point"""
    inserter = NABHDatabaseInserter()
    inserter.run()


if __name__ == "__main__":
    main()