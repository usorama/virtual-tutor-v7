-- Fix corrupted curriculum data
DELETE FROM public.curriculum_data;

-- Re-insert correct CBSE curriculum data
INSERT INTO public.curriculum_data (grade, subject, topics) VALUES
-- Grade 9
(9, 'Mathematics', ARRAY['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations', 'Euclidean Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas of Parallelograms', 'Circles', 'Constructions', 'Herons Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability']),
(9, 'Science', ARRAY['Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill', 'Natural Resources', 'Improvement in Food Resources']),

-- Grade 10
(10, 'Mathematics', ARRAY['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']),
(10, 'Science', ARRAY['Chemical Reactions', 'Acids Bases and Salts', 'Metals and Non-metals', 'Carbon and Its Compounds', 'Periodic Classification', 'Life Processes', 'Control and Coordination', 'How Do Organisms Reproduce', 'Heredity and Evolution', 'Light Reflection', 'Light Refraction', 'Human Eye', 'Electricity', 'Magnetic Effects', 'Sources of Energy', 'Our Environment', 'Natural Resources Management']),

-- Grade 11
(11, 'Mathematics', ARRAY['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', '3D Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability']),
(11, 'Physics', ARRAY['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work Energy and Power', 'System of Particles', 'Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves']),
(11, 'Chemistry', ARRAY['Basic Concepts', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Environmental Chemistry']),

-- Grade 12
(12, 'Mathematics', ARRAY['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Applications of Integrals', 'Differential Equations', 'Vector Algebra', '3D Geometry', 'Linear Programming', 'Probability']),
(12, 'Physics', ARRAY['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics', 'Communication Systems']),
(12, 'Chemistry', ARRAY['Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles of Isolation', 'p-Block Elements', 'd and f Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols Phenols and Ethers', 'Aldehydes Ketones', 'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life']);