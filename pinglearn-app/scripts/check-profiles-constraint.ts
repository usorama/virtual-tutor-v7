import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkConstraints() {
  // Check what subjects are available for grade 12
  const { data: grade12Books, error: booksError } = await supabase
    .from('textbooks')
    .select('*')
    .eq('grade', 12);
  
  console.log('=== Grade 12 Textbooks ===');
  console.log(JSON.stringify(grade12Books, null, 2));
  
  // Check if there are any grade 99 books
  const { data: grade99Books } = await supabase
    .from('textbooks')
    .select('*')
    .eq('grade', 99);
  
  console.log('\n=== Grade 99 Textbooks (NABH) ===');
  console.log(JSON.stringify(grade99Books, null, 2));
  
  // Check what curriculum data exists for grade 12 with Healthcare Administration
  const { data: curriculumData } = await supabase
    .from('curriculum_data')
    .select('*')
    .eq('grade', 12)
    .eq('subject', 'Healthcare Administration');
    
  console.log('\n=== Grade 12 Healthcare Administration Curriculum ===');
  console.log(JSON.stringify(curriculumData, null, 2));
}

checkConstraints();
