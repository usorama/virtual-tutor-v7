# Fix Database Issues - Action Plan
**Date**: 2025-10-03
**Problem**: Database schema exists but has NO DATA
**Impact**: User preferences, curriculum, and textbooks are unavailable

---

## 🚨 CRITICAL ISSUE SUMMARY

### What's Wrong
1. **All tables are EMPTY** (0 rows in every table)
2. **Curriculum data NOT loaded** (migration 002 data missing)
3. **Topic taxonomy NOT loaded** (migration 004 data missing)
4. **No test users** (cannot test preference saving)
5. **No Grade 12 English content** (cannot test textbook selection)

### Why This Happened
- Migrations may not have been applied to current database
- Database may have been reset without re-applying data
- Connected to wrong database instance
- Migrations failed silently

---

## ✅ STEP-BY-STEP FIX GUIDE

### Step 1: Verify Database Connection
```bash
# Check which database you're connected to
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app

# View current Supabase URL
cat .env.local | grep SUPABASE_URL
# Expected: https://thhqeoiubohpxxempfpi.supabase.co

# Test connection
npx supabase db diff --local
```

### Step 2: Check Migration Status
```bash
# See which migrations have been applied
npx supabase migration list

# Expected output:
# ✓ 001_initial_schema.sql
# ✓ 002_profiles_and_curriculum.sql
# ✓ 003_add_learning_purpose.sql
# ✓ 004_textbook_hierarchy_schema.sql
# ✓ 20241219_learning_sessions.sql
# ✓ 20241222_voice_sessions_and_transcripts.sql
```

### Step 3: Apply Missing Migrations

**Option A - Reset and Reapply All** (RECOMMENDED):
```bash
# WARNING: This will delete ALL data
# Backup first if needed
npx supabase db reset

# This will:
# 1. Drop all tables
# 2. Recreate from migrations
# 3. Apply all INSERT statements from migrations
# 4. Repopulate curriculum_data and topic_taxonomy
```

**Option B - Manual Data Population** (if reset is not an option):
```bash
# Apply only the data INSERT statements
npx supabase db execute --file supabase/migrations/002_profiles_and_curriculum.sql
npx supabase db execute --file supabase/migrations/004_textbook_hierarchy_schema.sql
```

### Step 4: Verify Data Loaded

Create verification script:
```bash
npx tsx scripts/verify-database.ts
```

**Create this file**: `/scripts/verify-database.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Verifying database data...\n');

  // Check curriculum_data
  const { data: curriculum, error: currError } = await supabase
    .from('curriculum_data')
    .select('*', { count: 'exact' });

  console.log('✓ curriculum_data:');
  console.log(`  Rows: ${curriculum?.length || 0}`);
  console.log(`  Expected: 8+ (Grade 9-12, multiple subjects)`);

  // Check topic_taxonomy
  const { data: topics, error: topicsError } = await supabase
    .from('topic_taxonomy')
    .select('*', { count: 'exact' });

  console.log('\n✓ topic_taxonomy:');
  console.log(`  Rows: ${topics?.length || 0}`);
  console.log(`  Expected: 30+ (Math & Science Grade 10)`);

  // Check Grade 12 English
  const { data: english, error: engError } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', 12)
    .eq('subject', 'English');

  console.log('\n✓ Grade 12 English curriculum:');
  if (english && english.length > 0) {
    console.log(`  ✅ Found! Topics: ${english[0].topics.length}`);
    console.log(`  Sample topics: ${english[0].topics.slice(0, 3).join(', ')}`);
  } else {
    console.log(`  ❌ NOT FOUND`);
  }

  // Check profiles
  const { data: profiles, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log('\n✓ User profiles:');
  console.log(`  Count: ${count || 0}`);
  console.log(`  Expected: At least 1 (test user)`);

  console.log('\n' + '='.repeat(50));
  if ((curriculum?.length || 0) >= 8 && (topics?.length || 0) >= 30) {
    console.log('✅ DATABASE IS READY');
  } else {
    console.log('❌ DATABASE NEEDS DATA POPULATION');
    console.log('   Run: npx supabase db reset');
  }
}

verify();
```

**Run verification**:
```bash
cd /Users/umasankrudhya/Projects/pinglearn/pinglearn-app
npx tsx scripts/verify-database.ts
```

**Expected output**:
```
✓ curriculum_data:
  Rows: 8
  Expected: 8+ (Grade 9-12, multiple subjects)

✓ topic_taxonomy:
  Rows: 32
  Expected: 30+ (Math & Science Grade 10)

✓ Grade 12 English curriculum:
  ✅ Found! Topics: 17
  Sample topics: The Last Lesson, Lost Spring, Deep Water

✓ User profiles:
  Count: 0
  Expected: At least 1 (test user)

==================================================
✅ DATABASE IS READY (except user profiles)
```

---

## 🎯 CREATE TEST DATA

### Create Test User Profile

**File**: `/scripts/create-test-user.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE'; // Use SECRET key for admin
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('Creating test user profile...\n');

  // First, create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'deethya@gmail.com',
    password: 'TestPassword123!',
    email_confirm: true, // Auto-confirm email
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  console.log('✓ Auth user created:', authData.user.id);

  // Then create profile (should auto-create via trigger, but let's ensure)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: 'deethya@gmail.com',
      first_name: 'Deethya',
      grade: 12,
      preferred_subjects: ['English', 'Mathematics'],
      learning_purpose: 'new_class',
      selected_topics: [],
    })
    .select()
    .single();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('✓ Profile created:\n', JSON.stringify(profile, null, 2));
  console.log('\n✅ Test user ready!');
  console.log('   Email: deethya@gmail.com');
  console.log('   Password: TestPassword123!');
}

createTestUser();
```

**Run**:
```bash
npx tsx scripts/create-test-user.ts
```

### Create Grade 12 English Book Series

**File**: `/scripts/create-grade12-english.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createGrade12English() {
  console.log('Creating Grade 12 English content...\n');

  // 1. Create book series
  const { data: series, error: seriesError } = await supabase
    .from('book_series')
    .insert({
      series_name: 'NCERT English',
      publisher: 'NCERT',
      curriculum_standard: 'NCERT',
      grade: 12,
      subject: 'English',
      description: 'Official NCERT English textbook for Grade 12 CBSE',
    })
    .select()
    .single();

  if (seriesError) {
    console.error('Error creating series:', seriesError);
    return;
  }

  console.log('✓ Book series created:', series.id);

  // 2. Create book (Flamingo - Part 1)
  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert({
      series_id: series.id,
      volume_number: 1,
      volume_title: 'Flamingo',
      edition: '2024',
      publication_year: 2024,
      authors: ['NCERT'],
      total_pages: 200,
      status: 'ready',
    })
    .select()
    .single();

  if (bookError) {
    console.error('Error creating book:', bookError);
    return;
  }

  console.log('✓ Book created:', book.id);

  // 3. Get curriculum data for linking
  const { data: curriculum, error: currError } = await supabase
    .from('curriculum_data')
    .select('id')
    .eq('grade', 12)
    .eq('subject', 'English')
    .single();

  if (curriculum) {
    // 4. Link series to curriculum
    const { error: mappingError } = await supabase
      .from('series_curriculum_mapping')
      .insert({
        series_id: series.id,
        curriculum_data_id: curriculum.id,
        coverage_percentage: 100,
        alignment_notes: 'Complete NCERT English Grade 12 alignment',
      });

    if (mappingError) {
      console.error('Error creating mapping:', mappingError);
    } else {
      console.log('✓ Curriculum mapping created');
    }
  }

  // 5. Create sample chapters
  const chapters = [
    { number: 1, title: 'The Last Lesson', difficulty: 'intermediate' },
    { number: 2, title: 'Lost Spring', difficulty: 'intermediate' },
    { number: 3, title: 'Deep Water', difficulty: 'intermediate' },
  ];

  for (const ch of chapters) {
    const { data: chapter, error: chError } = await supabase
      .from('book_chapters')
      .insert({
        book_id: book.id,
        chapter_number: ch.number,
        title: ch.title,
        difficulty_level: ch.difficulty,
        estimated_duration_minutes: 45,
        topics: [ch.title],
        learning_objectives: [
          `Understand the context of ${ch.title}`,
          `Analyze themes and characters`,
          `Improve reading comprehension`,
        ],
      })
      .select()
      .single();

    if (!chError) {
      console.log(`✓ Chapter ${ch.number} created: ${ch.title}`);
    }
  }

  console.log('\n✅ Grade 12 English content ready!');
}

createGrade12English();
```

**Run**:
```bash
npx tsx scripts/create-grade12-english.ts
```

---

## 🔍 VERIFY FIXES

### Final Verification Checklist

Run each query to verify:

```bash
# 1. Check curriculum data exists
npx supabase db execute --query "
SELECT grade, subject, array_length(topics, 1) as topic_count
FROM curriculum_data
ORDER BY grade, subject;
"
# Expected: 8+ rows

# 2. Check topic taxonomy exists
npx supabase db execute --query "
SELECT topic_level, count(*) as count
FROM topic_taxonomy
GROUP BY topic_level
ORDER BY topic_level;
"
# Expected: Level 1 (2), Level 2 (30+)

# 3. Verify Grade 12 English
npx supabase db execute --query "
SELECT * FROM curriculum_data
WHERE grade = 12 AND subject = 'English';
"
# Expected: 1 row with 17 topics

# 4. Verify book series
npx supabase db execute --query "
SELECT * FROM book_series
WHERE grade = 12 AND subject = 'English';
"
# Expected: 1 row (NCERT English)

# 5. Verify test user
npx supabase db execute --query "
SELECT email, grade, preferred_subjects, learning_purpose
FROM profiles
WHERE email = 'deethya@gmail.com';
"
# Expected: 1 row

# 6. Verify complete hierarchy
npx supabase db execute --query "
SELECT
  bs.series_name,
  COUNT(DISTINCT b.id) as num_books,
  COUNT(DISTINCT bc.id) as num_chapters
FROM book_series bs
LEFT JOIN books b ON b.series_id = bs.id
LEFT JOIN book_chapters bc ON bc.book_id = b.id
WHERE bs.grade = 12 AND bs.subject = 'English'
GROUP BY bs.id, bs.series_name;
"
# Expected: 1 series, 1 book, 3+ chapters
```

---

## 🎯 SUCCESS CRITERIA

After completing all steps, you should have:

- ✅ **8+ rows** in `curriculum_data` (Grade 9-12 subjects)
- ✅ **30+ rows** in `topic_taxonomy` (Math & Science topics)
- ✅ **1 user** in `profiles` (deethya@gmail.com, Grade 12)
- ✅ **1 book series** for Grade 12 English
- ✅ **1 book** (Flamingo) under that series
- ✅ **3+ chapters** under that book
- ✅ **1 mapping** linking series to curriculum

### Test User Preference Flow

**Manual test**:
1. Login as deethya@gmail.com / TestPassword123!
2. Go to preference/topic selection page
3. Should see:
   - Grade: 12 (pre-selected)
   - Subjects: English, Mathematics, etc.
   - Topics: The Last Lesson, Lost Spring, Deep Water, etc.
4. Select topics and save
5. Verify saved to `profiles.selected_topics`

**API test**:
```typescript
// Test saving preferences
const { data, error } = await supabase
  .from('profiles')
  .update({
    selected_topics: [
      {
        topic_id: 'some-uuid',
        topic_code: 'ENGLISH.12.THE_LAST_LESSON',
        topic_name: 'The Last Lesson',
        selected_at: new Date().toISOString(),
      }
    ]
  })
  .eq('email', 'deethya@gmail.com')
  .select()
  .single();

console.log('Saved preferences:', data);
```

---

## 🔄 ROLLBACK PLAN

If something goes wrong:

```bash
# Restore from backup (if you created one)
npx supabase db reset

# OR revert specific migration
npx supabase migration revert <migration-name>

# OR manually delete test data
npx supabase db execute --query "
DELETE FROM profiles WHERE email = 'deethya@gmail.com';
DELETE FROM book_series WHERE grade = 12 AND subject = 'English';
"
```

---

## 📊 MONITORING & VALIDATION

### Create Monitoring Query

**File**: `/scripts/monitor-database.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_publishable_MBeH4t2u_kMaAXPhPXAJvg_OZY1L2MY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function monitor() {
  console.log('📊 Database Health Check\n');
  console.log('='.repeat(50));

  const checks = [
    {
      name: 'Curriculum Data',
      table: 'curriculum_data',
      expected: 8,
      query: supabase.from('curriculum_data').select('*', { count: 'exact', head: true }),
    },
    {
      name: 'Topic Taxonomy',
      table: 'topic_taxonomy',
      expected: 30,
      query: supabase.from('topic_taxonomy').select('*', { count: 'exact', head: true }),
    },
    {
      name: 'User Profiles',
      table: 'profiles',
      expected: 1,
      query: supabase.from('profiles').select('*', { count: 'exact', head: true }),
    },
    {
      name: 'Book Series',
      table: 'book_series',
      expected: 1,
      query: supabase.from('book_series').select('*', { count: 'exact', head: true }),
    },
    {
      name: 'Books',
      table: 'books',
      expected: 1,
      query: supabase.from('books').select('*', { count: 'exact', head: true }),
    },
    {
      name: 'Chapters',
      table: 'book_chapters',
      expected: 3,
      query: supabase.from('book_chapters').select('*', { count: 'exact', head: true }),
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    const { count } = await check.query;
    const status = (count || 0) >= check.expected ? '✅' : '❌';
    const message = `${status} ${check.name}: ${count}/${check.expected}`;

    console.log(message);

    if ((count || 0) < check.expected) {
      allPassed = false;
    }
  }

  console.log('='.repeat(50));
  console.log(allPassed ? '\n✅ ALL CHECKS PASSED' : '\n❌ SOME CHECKS FAILED');
}

monitor();
```

**Run regularly**:
```bash
npx tsx scripts/monitor-database.ts
```

---

## 📝 SUMMARY

**Problem**: Empty database (migrations not applied or data lost)

**Solution**:
1. Reset database: `npx supabase db reset`
2. Create test user: Run `create-test-user.ts`
3. Create Grade 12 content: Run `create-grade12-english.ts`
4. Verify: Run `verify-database.ts`
5. Monitor: Run `monitor-database.ts`

**Expected Time**: 10-15 minutes

**Risk Level**: Low (only affects test environment)

**Success Rate**: High (if migrations are valid)

---

**Next Steps After Fix**:
1. Test user preference saving in UI
2. Test topic selection workflow
3. Test textbook selection
4. Test learning session creation
5. Verify data persists across sessions

**Documentation Updated**: ✅
**Scripts Created**: ✅
**Ready to Execute**: ✅
