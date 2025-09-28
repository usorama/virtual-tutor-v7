-- Insert All Processed Textbooks
-- Generated: 2025-09-28T10:55:41.833536

BEGIN;

-- Textbook: Magnetic Effects of
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - Magnetic Effects of.pdf',
    'Magnetic Effects of',
    10,
    'Class X Science NCERT',
    13,
    1.79,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: 1. (b) 2. (d) 3. (c) 4. (c)
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 01 - 1. (b) 2. (d) 3. (c) 4. (c).pdf',
    '1. (b) 2. (d) 3. (c) 4. (c)',
    10,
    'Class X Science NCERT',
    3,
    0.22,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: , how copper oxide reacts with hydrochloric acid.
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 02 - , how copper oxide reacts with hydrochloric acid..pdf',
    ', how copper oxide reacts with hydrochloric acid.',
    10,
    'Class X Science NCERT',
    21,
    2.12,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Our Environment
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - Our Environment.pdf',
    'Our Environment',
    10,
    'Class X Science NCERT',
    10,
    3.42,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: The pancreas secretes pancreatic juice which conta
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 04 - The pancreas secretes pancreatic juice which contains.pdf',
    'The pancreas secretes pancreatic juice which contains',
    10,
    'Class X Science NCERT',
    21,
    8.46,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: The Human Eye and
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - The Human Eye and.pdf',
    'The Human Eye and',
    10,
    'Class X Science NCERT',
    10,
    1.68,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: titled Sustainable
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 16 - titled Sustainable.pdf',
    'titled Sustainable',
    10,
    'Class X Science NCERT',
    12,
    1.17,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: 8CHAPTER
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - 8CHAPTER.pdf',
    '8CHAPTER',
    10,
    'Class X Science NCERT',
    6,
    16.87,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: From the data
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 02 - From the data.pdf',
    'From the data',
    10,
    'Class X Science NCERT',
    21,
    11.27,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: COOH), sodium hydroxide (NaOH), calcium
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 03 - COOH), sodium hydroxide (NaOH), calcium.pdf',
    'COOH), sodium hydroxide (NaOH), calcium',
    10,
    'Class X Science NCERT',
    20,
    2.88,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: 6CHAPTER
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - 6CHAPTER.pdf',
    '6CHAPTER',
    10,
    'Class X Science NCERT',
    13,
    1.62,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Light – Reflection and
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - Light – Reflection and.pdf',
    'Light – Reflection and',
    10,
    'Class X Science NCERT',
    27,
    1.91,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: How do Organisms
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - How do Organisms.pdf',
    'How do Organisms',
    10,
    'Class X Science NCERT',
    15,
    3.19,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: 11CHAPTER
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 00 - 11CHAPTER.pdf',
    '11CHAPTER',
    10,
    'Class X Science NCERT',
    24,
    1.87,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: (g) + 2O2 (g) → CO2 (g) + 2H2O (g) (1.17)
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Science NCERT - Ch 04 - (g) + 2O2 (g) → CO2 (g) + 2H2O (g) (1.17).pdf',
    '(g) + 2O2 (g) → CO2 (g) + 2H2O (g) (1.17)',
    10,
    'Class X Science NCERT',
    16,
    3.37,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: like Football, Hockey, Basketball, Cricket and Vol
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - like Football, Hockey, Basketball, Cricket and Volleyball..pdf',
    'like Football, Hockey, Basketball, Cricket and Volleyball.',
    10,
    'Class X Health and PE',
    22,
    2.89,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Health and Physical
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Health and Physical.pdf',
    'Health and Physical',
    10,
    'Class X Health and PE',
    12,
    0.95,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: HealtHy Community living
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - HealtHy Community living.pdf',
    'HealtHy Community living',
    10,
    'Class X Health and PE',
    12,
    2.40,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Table Tennis, Tennis, Swimming, Judo, Wrestling, e
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Table Tennis, Tennis, Swimming, Judo, Wrestling, etc. Track.pdf',
    'Table Tennis, Tennis, Swimming, Judo, Wrestling, etc. Track',
    10,
    'Class X Health and PE',
    17,
    5.43,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Yoga for HealtHY
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Yoga for HealtHY.pdf',
    'Yoga for HealtHY',
    10,
    'Class X Health and PE',
    32,
    3.40,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: It has been found that these asanas develop
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 09 - It has been found that these asanas develop.pdf',
    'It has been found that these asanas develop',
    10,
    'Class X Health and PE',
    12,
    1.68,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: What is Physical Education
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - What is Physical Education.pdf',
    'What is Physical Education',
    10,
    'Class X Health and PE',
    10,
    1.34,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Safety at the Work Place
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Safety at the Work Place.pdf',
    'Safety at the Work Place',
    10,
    'Class X Health and PE',
    12,
    2.04,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Table Tennis, Tennis, Swimming and Combative Sport
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Table Tennis, Tennis, Swimming and Combative Sports such.pdf',
    'Table Tennis, Tennis, Swimming and Combative Sports such',
    10,
    'Class X Health and PE',
    25,
    8.58,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Social HealtH
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Social HealtH.pdf',
    'Social HealtH',
    10,
    'Class X Health and PE',
    10,
    1.44,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: National Council of Educational Research and Train
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - National Council of Educational Research and Training.pdf',
    'National Council of Educational Research and Training',
    10,
    'Class X Health and PE',
    10,
    1.48,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: as, Basketball, Cricket, Football, Handball, Hocke
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - as, Basketball, Cricket, Football, Handball, Hockey, Kabaddi,.pdf',
    'as, Basketball, Cricket, Football, Handball, Hockey, Kabaddi,',
    10,
    'Class X Health and PE',
    34,
    6.70,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: GrowinG up durinG Adolescence
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - GrowinG up durinG Adolescence.pdf',
    'GrowinG up durinG Adolescence',
    10,
    'Class X Health and PE',
    12,
    1.51,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

-- Textbook: Dietary Planning
INSERT INTO public.textbooks (
    file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at
) VALUES (
    'Class X Health and PE - Ch 00 - Dietary Planning.pdf',
    'Dietary Planning',
    10,
    'Class X Health and PE',
    16,
    1.94,
    'ready',
    NOW()
) ON CONFLICT (file_name) DO NOTHING
RETURNING id INTO textbook_id;

COMMIT;
