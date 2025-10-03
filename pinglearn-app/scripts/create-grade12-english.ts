/**
 * Create Grade 12 English Content Script
 * Creates book series, books, and chapters for Grade 12 English
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createGrade12English() {
  console.log('📚 Creating Grade 12 English Content\n');
  console.log('='.repeat(70));

  // Check if already exists
  console.log('\n1. Checking if Grade 12 English series exists...');
  const { data: existingSeries } = await supabase
    .from('book_series')
    .select('*')
    .eq('grade', 12)
    .ilike('subject', '%english%')
    .single();

  if (existingSeries) {
    console.log('⚠️  Book series already exists:');
    console.log(`   ${existingSeries.series_name} by ${existingSeries.publisher}`);
    console.log('\nTo recreate, first delete the existing series.');
    return;
  }

  // Create book series
  console.log('\n2. Creating book series...');
  const { data: series, error: seriesError } = await supabase
    .from('book_series')
    .insert({
      series_name: 'NCERT English',
      publisher: 'NCERT',
      curriculum_standard: 'NCERT',
      grade: 12,
      subject: 'English',
      description: 'Official NCERT English textbook for Grade 12 CBSE curriculum',
    })
    .select()
    .single();

  if (seriesError) {
    console.error('❌ Error creating series:', seriesError.message);
    return;
  }

  console.log('✅ Book series created');
  console.log(`   ID: ${series.id}`);
  console.log(`   Name: ${series.series_name}`);

  // Create book (Flamingo - Part 1)
  console.log('\n3. Creating book: Flamingo...');
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
    console.error('❌ Error creating book:', bookError.message);
    return;
  }

  console.log('✅ Book created');
  console.log(`   ID: ${book.id}`);
  console.log(`   Title: ${book.volume_title}`);

  // Link to curriculum
  console.log('\n4. Linking to curriculum...');
  const { data: curriculum } = await supabase
    .from('curriculum_data')
    .select('id')
    .eq('grade', 12)
    .eq('subject', 'English')
    .single();

  if (curriculum) {
    const { error: mappingError } = await supabase
      .from('series_curriculum_mapping')
      .insert({
        series_id: series.id,
        curriculum_data_id: curriculum.id,
        coverage_percentage: 100,
        alignment_notes: 'Complete NCERT English Grade 12 CBSE curriculum alignment',
        verified_at: new Date().toISOString(),
        verified_by: 'System',
      });

    if (mappingError) {
      console.error('⚠️  Error creating curriculum mapping:', mappingError.message);
    } else {
      console.log('✅ Curriculum mapping created');
    }
  } else {
    console.log('⚠️  Curriculum data not found. Run: npx supabase db reset');
  }

  // Create chapters
  console.log('\n5. Creating chapters...');

  const chapters = [
    {
      number: 1,
      title: 'The Last Lesson',
      description: 'A story about the importance of language and identity',
      difficulty: 'intermediate',
      duration: 45,
      topics: ['The Last Lesson', 'Narrative Fiction'],
      objectives: [
        'Understand the historical context of the story',
        'Analyze the theme of linguistic identity',
        'Explore character motivations and emotions',
        'Improve reading comprehension and critical thinking',
      ],
    },
    {
      number: 2,
      title: 'Lost Spring',
      description: 'Stories of stolen childhood and lost dreams',
      difficulty: 'intermediate',
      duration: 50,
      topics: ['Lost Spring', 'Social Commentary'],
      objectives: [
        'Analyze social issues presented in the text',
        'Understand the impact of poverty on children',
        'Develop empathy through literature',
        'Practice critical analysis of non-fiction',
      ],
    },
    {
      number: 3,
      title: 'Deep Water',
      description: 'An autobiographical account of overcoming fear',
      difficulty: 'beginner',
      duration: 40,
      topics: ['Deep Water', 'Autobiography'],
      objectives: [
        'Understand the autobiographical genre',
        'Explore themes of fear and courage',
        'Analyze descriptive writing techniques',
        'Learn vocabulary related to swimming and emotions',
      ],
    },
    {
      number: 4,
      title: 'The Rattrap',
      description: 'A story about human nature and redemption',
      difficulty: 'intermediate',
      duration: 45,
      topics: ['The Rattrap', 'Moral Tales'],
      objectives: [
        'Analyze the metaphor of the rattrap',
        'Understand themes of kindness and redemption',
        'Explore character transformation',
        'Improve comprehension of symbolic literature',
      ],
    },
    {
      number: 5,
      title: 'Indigo',
      description: 'Gandhis fight for farmers rights in Champaran',
      difficulty: 'advanced',
      duration: 55,
      topics: ['Indigo', 'Historical Non-fiction'],
      objectives: [
        'Understand the historical significance of the Champaran movement',
        'Analyze Gandhis approach to social justice',
        'Learn about colonial India and peasant struggles',
        'Develop skills in reading historical accounts',
      ],
    },
  ];

  let createdCount = 0;

  for (const ch of chapters) {
    const { data: chapter, error: chError } = await supabase
      .from('book_chapters')
      .insert({
        book_id: book.id,
        chapter_number: ch.number,
        title: ch.title,
        description: ch.description,
        difficulty_level: ch.difficulty,
        estimated_duration_minutes: ch.duration,
        topics: ch.topics,
        learning_objectives: ch.objectives,
      })
      .select()
      .single();

    if (chError) {
      console.error(`❌ Error creating chapter ${ch.number}:`, chError.message);
    } else {
      console.log(`✅ Chapter ${ch.number}: ${ch.title}`);
      createdCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ GRADE 12 ENGLISH CONTENT CREATED\n');
  console.log('Summary:');
  console.log(`   Book Series: ${series.series_name}`);
  console.log(`   Publisher: ${series.publisher}`);
  console.log(`   Grade: ${series.grade}`);
  console.log(`   Subject: ${series.subject}`);
  console.log(`   Books: 1 (${book.volume_title})`);
  console.log(`   Chapters: ${createdCount}`);
  console.log('\nNext steps:');
  console.log('1. Verify with: npx tsx scripts/verify-database.ts');
  console.log('2. Test textbook selection in UI');
  console.log('3. Test chapter navigation');
  console.log('='.repeat(70));
}

createGrade12English()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed to create Grade 12 English content:', error);
    process.exit(1);
  });
