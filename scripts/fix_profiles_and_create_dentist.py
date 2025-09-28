#!/usr/bin/env python3
"""
Fix profile table structure and complete dentist user setup
"""

import psycopg2
from psycopg2 import sql
import json
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'db.thhqeoiubohpxxempfpi.supabase.co',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'wG4iamg3dfZwwnW4',
    'port': 5432
}

def fix_profile_table(conn):
    """Add missing columns to profiles table"""
    print("📊 Fixing profile table structure...")

    with conn.cursor() as cur:
        # Check existing columns
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'profiles'
            ORDER BY ordinal_position;
        """)
        existing_columns = [col[0] for col in cur.fetchall()]
        print(f"   Existing columns: {', '.join(existing_columns)}")

        # Add missing columns
        columns_to_add = [
            ("full_name", "TEXT"),
            ("avatar_url", "TEXT"),
            ("preferences", "JSONB DEFAULT '{}'::jsonb"),
            ("first_name", "TEXT"),
            ("last_name", "TEXT"),
            ("grade", "INTEGER DEFAULT 10"),
            ("preferred_subjects", "TEXT[]"),
            ("selected_topics", "TEXT[]")
        ]

        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                try:
                    cur.execute(f"""
                        ALTER TABLE public.profiles
                        ADD COLUMN IF NOT EXISTS {col_name} {col_type}
                    """)
                    print(f"   ✅ Added column: {col_name}")
                except Exception as e:
                    print(f"   ⚠️ Column {col_name} might already exist: {e}")

        conn.commit()
        print("✅ Profile table structure fixed!")

def get_or_create_dentist_user(conn):
    """Get existing dentist user or create new one"""
    print("\n👤 Checking for dentist user...")

    with conn.cursor() as cur:
        # Check if user exists in auth.users
        cur.execute("""
            SELECT id, email
            FROM auth.users
            WHERE email = 'dentist@dental.com'
            LIMIT 1;
        """)

        result = cur.fetchone()

        if result:
            user_id = result[0]
            print(f"   ✅ Found existing user: {user_id}")
            return user_id
        else:
            print("   ❌ User not found in auth.users")
            print("   ℹ️ Please create user via signup page first")
            return None

def setup_dentist_profile(conn, user_id):
    """Configure dentist profile with NABH preferences"""
    print("\n🦷 Setting up dentist profile...")

    with conn.cursor() as cur:
        # Get NABH textbook ID
        cur.execute("""
            SELECT id, title
            FROM public.textbooks
            WHERE title = 'NABH Dental Accreditation Standards Manual'
            LIMIT 1;
        """)

        textbook = cur.fetchone()
        if not textbook:
            print("   ❌ NABH textbook not found!")
            return False

        textbook_id, textbook_title = textbook
        print(f"   📚 Found NABH textbook: {textbook_title} (ID: {textbook_id})")

        # Prepare preferences
        preferences = {
            "grade": 0,
            "subject": "Healthcare Administration",
            "learning_style": "professional",
            "preferred_textbook_id": textbook_id,
            "preferred_textbook": textbook_title,
            "session_duration": 30,
            "difficulty_level": "advanced",
            "focus_areas": [
                "Patient Rights",
                "Clinical Standards",
                "Safety Protocols",
                "Quality Management",
                "Infection Control",
                "Risk Management"
            ],
            "voice_enabled": True,
            "show_math_equations": False,
            "language": "en",
            "theme": "professional",
            "learning_pace": "moderate",
            "notification_preferences": {
                "session_reminders": True,
                "progress_updates": True,
                "new_content_alerts": True
            }
        }

        # Update or insert profile
        cur.execute("""
            INSERT INTO public.profiles (
                id, email, full_name, first_name, last_name, grade,
                preferred_subjects, selected_topics, preferences,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                grade = EXCLUDED.grade,
                preferred_subjects = EXCLUDED.preferred_subjects,
                selected_topics = EXCLUDED.selected_topics,
                preferences = EXCLUDED.preferences,
                updated_at = NOW()
            RETURNING id;
        """, (
            user_id,
            'dentist@dental.com',
            'Dr. Dental Professional',
            'Dr. Dental',
            'Professional',
            0,  # Professional grade
            ['Healthcare', 'Administration'],
            [
                'NABH Accreditation Standards',
                'Patient Safety',
                'Quality Improvement',
                'Infection Control',
                'Clinical Protocols',
                'Patient Rights and Education',
                'Management of Medication',
                'Healthcare Quality Standards'
            ],
            json.dumps(preferences)
        ))

        conn.commit()
        print("   ✅ Profile configured successfully!")
        return textbook_id

def create_learning_session(conn, user_id, textbook_id):
    """Create initial learning session for dentist"""
    print("\n📖 Creating initial learning session...")

    with conn.cursor() as cur:
        session_data = {
            "textbook_id": textbook_id,
            "textbook_title": "NABH Dental Accreditation Standards Manual",
            "chapter_number": 1,
            "chapter_title": "Introduction to NABH Dental Accreditation Standards",
            "learning_objectives": [
                "Understand NABH accreditation process",
                "Learn about patient safety standards",
                "Review quality improvement requirements",
                "Understand documentation needs",
                "Learn about measurable elements",
                "Understand the intent of standards"
            ],
            "session_type": "professional_development",
            "estimated_duration": 30,
            "content_focus": [
                "NABH Overview",
                "Accreditation Process",
                "Quality Standards",
                "Patient Safety Goals"
            ]
        }

        cur.execute("""
            INSERT INTO public.learning_sessions (
                user_id, topic, subject, grade,
                started_at, status, session_data,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                NOW(), NOW()
            )
            RETURNING id;
        """, (
            user_id,
            'Introduction to NABH Standards',
            'Healthcare Administration',
            0,
            datetime.now().isoformat(),
            'scheduled',
            json.dumps(session_data)
        ))

        session_id = cur.fetchone()[0]
        conn.commit()
        print(f"   ✅ Learning session created: {session_id}")
        return session_id

def main():
    """Main function to fix profiles and setup dentist user"""
    print("=" * 60)
    print("🏥 FIXING PROFILES & SETTING UP DENTIST USER")
    print("=" * 60)

    try:
        # Connect to database
        print("\n🔌 Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        print("   ✅ Connected successfully!")

        # Fix profile table
        fix_profile_table(conn)

        # Get or check for dentist user
        user_id = get_or_create_dentist_user(conn)

        if not user_id:
            print("\n⚠️ User needs to be created first!")
            print("Please use the signup page at http://localhost:3006/signup-dentist")
            print("Then run this script again.")
            return

        # Setup profile
        textbook_id = setup_dentist_profile(conn, user_id)

        if textbook_id:
            # Create learning session
            session_id = create_learning_session(conn, user_id, textbook_id)

            # Summary
            print("\n" + "=" * 60)
            print("🎉 DENTIST USER SETUP COMPLETE!")
            print("=" * 60)
            print("\n📋 User Details:")
            print("   Email: dentist@dental.com")
            print("   Password: password123")
            print("   Name: Dr. Dental Professional")
            print(f"   User ID: {user_id}")

            print("\n📚 Configuration:")
            print("   Textbook: NABH Dental Accreditation Standards Manual")
            print("   Subject: Healthcare Administration")
            print("   Level: Professional")
            print(f"   Session ID: {session_id}")

            print("\n🚀 Next Steps:")
            print("   1. Login at: http://localhost:3006")
            print("   2. Use credentials above")
            print("   3. Navigate to classroom to start NABH learning session")

        conn.close()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()