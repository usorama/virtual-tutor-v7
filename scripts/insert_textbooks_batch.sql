-- Batch Insert Textbooks into PingLearn Database
-- This inserts all processed textbooks in a simplified way

BEGIN;

-- Clean up any test data from today (keep existing data)
DELETE FROM public.textbooks
WHERE title LIKE 'Section %'
   OR title LIKE '%.pdf'
   OR LENGTH(title) < 3;

-- Insert Health and PE textbooks
INSERT INTO public.textbooks (file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at)
VALUES
('Health_PE_Football_Hockey.pdf', 'Health & PE - Team Sports (Football, Hockey, Basketball)', 10, 'Health and Physical Education', 50, 2.5, 'ready', NOW()),
('Health_PE_Yoga.pdf', 'Health & PE - Yoga for Healthy Living', 10, 'Health and Physical Education', 100, 4.2, 'ready', NOW()),
('Health_PE_Community_Health.pdf', 'Health & PE - Healthy Community Living', 10, 'Health and Physical Education', 25, 1.8, 'ready', NOW()),
('Health_PE_Adolescence.pdf', 'Health & PE - Growing up during Adolescence', 10, 'Health and Physical Education', 30, 2.1, 'ready', NOW()),
('Health_PE_Social_Health.pdf', 'Health & PE - Social Health', 10, 'Health and Physical Education', 35, 1.9, 'ready', NOW()),
('Health_PE_Dietary_Planning.pdf', 'Health & PE - Dietary Planning', 10, 'Health and Physical Education', 40, 2.3, 'ready', NOW()),
('Health_PE_Safety_Workplace.pdf', 'Health & PE - Safety at the Work Place', 10, 'Health and Physical Education', 20, 1.5, 'ready', NOW()),
('Health_PE_Physical_Education.pdf', 'Health & PE - What is Physical Education', 10, 'Health and Physical Education', 15, 1.2, 'ready', NOW())
;

-- Insert Science textbooks
INSERT INTO public.textbooks (file_name, title, grade, subject, total_pages, file_size_mb, status, processed_at)
VALUES
('Science_Magnetic_Effects.pdf', 'Science - Magnetic Effects of Electric Current', 10, 'Science', 25, 2.8, 'ready', NOW()),
('Science_Light_Reflection.pdf', 'Science - Light Reflection and Refraction', 10, 'Science', 40, 3.5, 'ready', NOW()),
('Science_Human_Eye.pdf', 'Science - The Human Eye and the Colourful World', 10, 'Science', 30, 2.9, 'ready', NOW()),
('Science_Our_Environment.pdf', 'Science - Our Environment', 10, 'Science', 20, 1.8, 'ready', NOW()),
('Science_How_Organisms_Reproduce.pdf', 'Science - How do Organisms Reproduce', 10, 'Science', 35, 3.2, 'ready', NOW()),
('Science_Chemical_Reactions.pdf', 'Science - Chemical Reactions and Equations', 10, 'Science', 45, 4.1, 'ready', NOW()),
('Science_Acids_Bases.pdf', 'Science - Acids, Bases and Salts', 10, 'Science', 38, 3.6, 'ready', NOW()),
('Science_Metals_NonMetals.pdf', 'Science - Metals and Non-metals', 10, 'Science', 42, 3.9, 'ready', NOW()),
('Science_Life_Processes.pdf', 'Science - Life Processes', 10, 'Science', 48, 4.5, 'ready', NOW()),
('Science_Control_Coordination.pdf', 'Science - Control and Coordination', 10, 'Science', 36, 3.3, 'ready', NOW()),
('Science_Natural_Resources.pdf', 'Science - Management of Natural Resources', 10, 'Science', 28, 2.6, 'ready', NOW()),
('Science_Sources_Energy.pdf', 'Science - Sources of Energy', 10, 'Science', 32, 3.0, 'ready', NOW())
;

-- Add sample chapters for a few key textbooks
DO $$
DECLARE
    health_yoga_id UUID;
    science_light_id UUID;
    science_env_id UUID;
    chapter_id UUID;
BEGIN
    -- Get textbook IDs
    SELECT id INTO health_yoga_id FROM public.textbooks WHERE title LIKE '%Yoga%' LIMIT 1;
    SELECT id INTO science_light_id FROM public.textbooks WHERE title LIKE '%Light Reflection%' LIMIT 1;
    SELECT id INTO science_env_id FROM public.textbooks WHERE title LIKE '%Our Environment%' LIMIT 1;

    -- Add chapters for Yoga textbook
    IF health_yoga_id IS NOT NULL THEN
        INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
        VALUES
        (health_yoga_id, 1, 'Introduction to Yoga', ARRAY['History of Yoga', 'Benefits of Yoga', 'Types of Yoga'], 1, 10),
        (health_yoga_id, 2, 'Basic Asanas', ARRAY['Standing Poses', 'Sitting Poses', 'Breathing Techniques'], 11, 25),
        (health_yoga_id, 3, 'Pranayama', ARRAY['Breathing Control', 'Energy Management', 'Meditation Basics'], 26, 40),
        (health_yoga_id, 4, 'Yoga for Daily Life', ARRAY['Morning Routine', 'Stress Management', 'Healthy Habits'], 41, 55)
        ;

        -- Add sample content chunks
        SELECT id INTO chapter_id FROM public.chapters WHERE textbook_id = health_yoga_id AND chapter_number = 1 LIMIT 1;
        IF chapter_id IS NOT NULL THEN
            INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
            VALUES
            (chapter_id, 0, 'Yoga is an ancient practice that originated in India over 5,000 years ago. It combines physical postures, breathing techniques, and meditation to promote physical and mental well-being. The word yoga comes from the Sanskrit word yuj, which means to unite or join.', 'text', 50, 1),
            (chapter_id, 1, 'Benefits of regular yoga practice include: improved flexibility, increased muscle strength and tone, improved respiration and energy, maintaining a balanced metabolism, weight reduction, cardio and circulatory health, improved athletic performance, and protection from injury.', 'text', 45, 2)
            ;
        END IF;
    END IF;

    -- Add chapters for Light & Reflection textbook
    IF science_light_id IS NOT NULL THEN
        INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
        VALUES
        (science_light_id, 1, 'Reflection of Light', ARRAY['Laws of Reflection', 'Plane Mirrors', 'Spherical Mirrors'], 1, 15),
        (science_light_id, 2, 'Refraction of Light', ARRAY['Laws of Refraction', 'Refractive Index', 'Lenses'], 16, 30),
        (science_light_id, 3, 'Optical Instruments', ARRAY['Microscope', 'Telescope', 'Human Eye'], 31, 40)
        ;

        -- Add sample content
        SELECT id INTO chapter_id FROM public.chapters WHERE textbook_id = science_light_id AND chapter_number = 1 LIMIT 1;
        IF chapter_id IS NOT NULL THEN
            INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
            VALUES
            (chapter_id, 0, 'Light is a form of energy that enables us to see objects. When light falls on an object, it is reflected, absorbed, or transmitted. Reflection occurs when light bounces off a surface. The laws of reflection state that the angle of incidence equals the angle of reflection.', 'text', 55, 1),
            (chapter_id, 1, 'Example: When you look in a mirror, you see your reflection because light from your face bounces off the mirror surface and travels to your eyes. The image appears to be behind the mirror at the same distance as you are in front of it.', 'example', 45, 3)
            ;
        END IF;
    END IF;

    -- Add chapters for Environment textbook
    IF science_env_id IS NOT NULL THEN
        INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
        VALUES
        (science_env_id, 1, 'Ecosystem', ARRAY['Food Chains', 'Food Webs', 'Energy Flow'], 1, 8),
        (science_env_id, 2, 'Environmental Problems', ARRAY['Pollution', 'Global Warming', 'Deforestation'], 9, 15),
        (science_env_id, 3, 'Conservation', ARRAY['Wildlife Protection', 'Sustainable Development', 'Renewable Resources'], 16, 20)
        ;

        -- Add sample content
        SELECT id INTO chapter_id FROM public.chapters WHERE textbook_id = science_env_id AND chapter_number = 1 LIMIT 1;
        IF chapter_id IS NOT NULL THEN
            INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
            VALUES
            (chapter_id, 0, 'An ecosystem consists of all living organisms in a particular area, along with the non-living components of their environment. Energy flows through ecosystems in food chains and food webs, starting with producers (plants) and moving through various levels of consumers.', 'text', 50, 1),
            (chapter_id, 1, 'Exercise: Draw a food chain for a pond ecosystem. Start with aquatic plants as producers, then add primary consumers (herbivorous fish), secondary consumers (carnivorous fish), and decomposers (bacteria).', 'exercise', 35, 5)
            ;
        END IF;
    END IF;

    RAISE NOTICE 'Successfully inserted textbooks with sample chapters';
END $$;

COMMIT;

-- Verification
SELECT
    subject,
    COUNT(DISTINCT t.id) as textbooks,
    COUNT(DISTINCT c.id) as chapters,
    COUNT(DISTINCT cc.id) as chunks
FROM public.textbooks t
LEFT JOIN public.chapters c ON c.textbook_id = t.id
LEFT JOIN public.content_chunks cc ON cc.chapter_id = c.id
WHERE t.status = 'ready'
  AND t.grade = 10
  AND subject IN ('Health and Physical Education', 'Science')
GROUP BY subject
ORDER BY subject;