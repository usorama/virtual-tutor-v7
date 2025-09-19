-- Extend profiles table for wizard selections
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_topics JSONB DEFAULT '[]'::jsonb;

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
(12, 'English', ARRAY['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places', 'Poetry Section', 'The Tiger King', 'Journey to End of Earth', 'The Enemy', 'Should Wizard Hit Mommy', 'On the Face of It', 'Evans Tries an O-Level', 'Memories of Childhood', 'Writing Skills']);

-- Enable RLS on curriculum_data
ALTER TABLE public.curriculum_data ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read curriculum data
CREATE POLICY "Curriculum data is viewable by authenticated users" 
  ON public.curriculum_data
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX idx_curriculum_grade_subject ON public.curriculum_data(grade, subject);