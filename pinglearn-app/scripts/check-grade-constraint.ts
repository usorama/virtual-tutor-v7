import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkConstraint() {
  // Try to get existing profiles to see what grades are used
  const { data, error } = await supabase
    .from('profiles')
    .select('grade')
    .order('grade');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const uniqueGrades = [...new Set(data.map(p => p.grade))];
  console.log('Existing grades in profiles:', uniqueGrades);
}

checkConstraint();
