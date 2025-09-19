#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function safeMigration() {
  console.log('🔍 Checking existing tables and applying safe migrations...\n')
  
  // Check what tables exist
  const requiredTables = {
    'profiles': false,
    'textbooks': false,
    'chapters': false,
    'content_chunks': false,
    'curriculum_data': false
  }
  
  // Check each table
  for (const table of Object.keys(requiredTables)) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (!error) {
        requiredTables[table as keyof typeof requiredTables] = true
        console.log(`✅ Table '${table}' exists`)
      } else {
        console.log(`❌ Table '${table}' not found: ${error.message}`)
      }
    } catch (err) {
      console.log(`❌ Table '${table}' check failed`)
    }
  }

  console.log('\n📋 Migration Plan:\n')

  // Generate SQL only for missing tables
  let migrationSQL = ''
  
  if (!requiredTables.profiles) {
    console.log('• Will create: profiles table')
    migrationSQL += `
-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 12),
  preferred_subjects TEXT[],
  selected_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);
`
  }

  if (!requiredTables.textbooks) {
    console.log('• Will create: textbooks table')
    migrationSQL += `
-- Create textbooks table
CREATE TABLE IF NOT EXISTS public.textbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  title TEXT NOT NULL,
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  total_pages INTEGER,
  file_size_mb DECIMAL(10,2),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT
);

ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Textbooks are viewable by all authenticated users" ON public.textbooks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage textbooks" ON public.textbooks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_textbook_grade_subject ON public.textbooks(grade, subject);
CREATE INDEX IF NOT EXISTS idx_textbook_status ON public.textbooks(status);
`
  }

  if (!requiredTables.chapters) {
    console.log('• Will create: chapters table')
    migrationSQL += `
-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  topics TEXT[],
  start_page INTEGER,
  end_page INTEGER,
  UNIQUE (textbook_id, chapter_number)
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters are viewable by all authenticated users" ON public.chapters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_textbook_chapters ON public.chapters(textbook_id);
`
  }

  if (!requiredTables.content_chunks) {
    console.log('• Will create: content_chunks table')
    migrationSQL += `
-- Create content chunks table
CREATE TABLE IF NOT EXISTS public.content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'example', 'exercise', 'summary')),
  page_number INTEGER,
  token_count INTEGER
);

ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content chunks are viewable by all authenticated users" ON public.content_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_chapter_chunks ON public.content_chunks(chapter_id);
`
  }

  if (!requiredTables.curriculum_data) {
    console.log('• Will create: curriculum_data table with CBSE data')
    migrationSQL += `
-- Create curriculum data table
CREATE TABLE IF NOT EXISTS public.curriculum_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade >= 9 AND grade <= 12),
  subject TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grade, subject)
);

-- Insert CBSE curriculum data
INSERT INTO public.curriculum_data (grade, subject, topics) VALUES
-- Grade 9
(9, 'Mathematics', ARRAY['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations', 'Euclidean Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas of Parallelograms', 'Circles', 'Constructions', 'Herons Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability']),
(9, 'Science', ARRAY['Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill', 'Natural Resources', 'Improvement in Food Resources']),
(9, 'English', ARRAY['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Packing', 'Reach for the Top', 'The Bond of Love', 'Kathmandu', 'Grammar and Writing']),
(9, 'Social Science', ARRAY['The French Revolution', 'Socialism in Europe', 'Nazism and Hitler', 'Forest Society', 'Pastoralists', 'India Size and Location', 'Physical Features', 'Drainage', 'Climate', 'Natural Vegetation', 'Population', 'Democracy', 'Constitutional Design', 'Electoral Politics', 'Working of Institutions']),

-- Grade 10
(10, 'Mathematics', ARRAY['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']),
(10, 'Science', ARRAY['Chemical Reactions', 'Acids Bases and Salts', 'Metals and Non-metals', 'Carbon and Its Compounds', 'Periodic Classification', 'Life Processes', 'Control and Coordination', 'How Do Organisms Reproduce', 'Heredity and Evolution', 'Light Reflection', 'Light Refraction', 'Human Eye', 'Electricity', 'Magnetic Effects', 'Sources of Energy', 'Our Environment', 'Natural Resources Management']),
(10, 'English', ARRAY['A Letter to God', 'Nelson Mandela', 'Two Stories About Flying', 'From the Diary of Anne Frank', 'The Hundred Dresses', 'Glimpses of India', 'Mijbil the Otter', 'Madam Rides the Bus', 'The Sermon at Benares', 'The Proposal', 'Grammar and Writing']),
(10, 'Social Science', ARRAY['Rise of Nationalism', 'Nationalism in India', 'Making of Global World', 'Age of Industrialization', 'Print Culture', 'Resources and Development', 'Forest and Wildlife', 'Water Resources', 'Agriculture', 'Minerals and Energy', 'Manufacturing Industries', 'Life Lines of Economy', 'Power Sharing', 'Federalism', 'Democracy and Diversity']),

-- Grade 11
(11, 'Mathematics', ARRAY['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', '3D Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability']),
(11, 'Physics', ARRAY['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work Energy and Power', 'System of Particles', 'Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves']),
(11, 'Chemistry', ARRAY['Basic Concepts', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Environmental Chemistry']),
(11, 'Biology', ARRAY['Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Plants', 'Anatomy of Plants', 'Structural Organization in Animals', 'Cell Unit of Life', 'Biomolecules', 'Cell Cycle', 'Transport in Plants', 'Mineral Nutrition', 'Photosynthesis', 'Respiration', 'Plant Growth', 'Digestion and Absorption', 'Breathing and Exchange', 'Body Fluids', 'Excretory Products', 'Locomotion', 'Neural Control', 'Chemical Coordination']),
(11, 'English', ARRAY['The Portrait of a Lady', 'Were Not Afraid to Die', 'Discovering Tut', 'Landscape of the Soul', 'The Ailing Planet', 'The Browning Version', 'The Adventure', 'Silk Road', 'Poetry Section', 'Writing Skills', 'Grammar']),

-- Grade 12
(12, 'Mathematics', ARRAY['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Applications of Integrals', 'Differential Equations', 'Vector Algebra', '3D Geometry', 'Linear Programming', 'Probability']),
(12, 'Physics', ARRAY['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics', 'Communication Systems']),
(12, 'Chemistry', ARRAY['Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles of Isolation', 'p-Block Elements', 'd and f Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols Phenols and Ethers', 'Aldehydes Ketones', 'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life']),
(12, 'Biology', ARRAY['Reproduction in Organisms', 'Sexual Reproduction in Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Strategies for Enhancement', 'Microbes in Human Welfare', 'Biotechnology Principles', 'Biotechnology Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity', 'Environmental Issues']),
(12, 'English', ARRAY['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places', 'Poetry Section', 'The Tiger King', 'Journey to End of Earth', 'The Enemy', 'Should Wizard Hit Mommy', 'On the Face of It', 'Evans Tries an O-Level', 'Memories of Childhood', 'Writing Skills'])
ON CONFLICT (grade, subject) DO NOTHING;

ALTER TABLE public.curriculum_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curriculum data is viewable by authenticated users" 
  ON public.curriculum_data
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_curriculum_grade_subject ON public.curriculum_data(grade, subject);
`
  }

  if (migrationSQL) {
    console.log('\n📝 Migration SQL to run:\n')
    console.log('='.repeat(50))
    console.log(migrationSQL)
    console.log('='.repeat(50))
    console.log(`
⚠️  To apply these migrations:

1. Go to: https://supabase.com/dashboard/project/${supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]}/sql/new
2. Copy and paste the SQL above
3. Click "Run" to execute

This will ONLY create the missing tables and won't affect existing ones.
`)
  } else {
    console.log('✅ All required tables already exist! No migration needed.')
  }
}

safeMigration()