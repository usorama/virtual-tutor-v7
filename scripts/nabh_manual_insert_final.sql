-- NABH Dental Accreditation Standards Manual
-- Database Insertion Script for PingLearn
-- This script inserts the NABH manual into the textbooks system

BEGIN;

-- Step 1: Clean up any existing NABH manual data
DELETE FROM public.textbooks
WHERE title = 'NABH Dental Accreditation Standards Manual';

-- Step 2: Insert the textbook record
INSERT INTO public.textbooks (
    file_name,
    title,
    grade,
    subject,
    total_pages,
    file_size_mb,
    status,
    processed_at,
    uploaded_at
) VALUES (
    'Dental-Accreditation-Standards NABH MANUAL.pdf',
    'NABH Dental Accreditation Standards Manual',
    0, -- Professional level
    'Healthcare Administration',
    66,
    0.24,
    'ready',
    NOW(),
    NOW()
);

-- Get the textbook ID for reference
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Get the textbook ID we just inserted
    SELECT id INTO textbook_id
    FROM public.textbooks
    WHERE title = 'NABH Dental Accreditation Standards Manual'
    LIMIT 1;

    -- Insert key chapters
    -- Chapter 1: Introduction to NABH Standards
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        1,
        'Introduction to NABH Dental Accreditation Standards',
        ARRAY['NABH Overview', 'Accreditation Process', 'Quality Standards', 'Patient Safety'],
        1,
        5
    ) RETURNING id INTO chapter_id;

    -- Insert content chunks for Chapter 1
    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'The National Accreditation Board for Hospitals & Healthcare Providers (NABH) is a constituent board of Quality Council of India, set up to establish and operate accreditation programme for healthcare organizations. NABH dental accreditation standards are designed to ensure quality and patient safety in dental practices.',
        'text',
        50,
        1
    ),
    (
        chapter_id,
        1,
        'Key objectives of NABH dental accreditation include:
1. Continuous quality improvement in dental services
2. Patient safety and rights protection
3. Standardization of dental care processes
4. Evidence-based dental practice
5. Risk management in dental procedures',
        'text',
        45,
        2
    );

    -- Chapter 2: Patient Rights and Education
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        2,
        'Patient Rights and Education',
        ARRAY['Patient Rights', 'Informed Consent', 'Patient Education', 'Communication'],
        6,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Standard: The organization respects patient rights and involves them in their care.
Intent: To ensure that patients are aware of their rights and responsibilities, and are involved in decision-making regarding their dental treatment.
Measurable Elements:
- Patients are informed about their rights in a language they understand
- Informed consent is obtained before any procedure
- Patient privacy and confidentiality are maintained',
        'text',
        75,
        6
    );

    -- Chapter 3: Access, Assessment and Continuity of Care
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        3,
        'Access, Assessment and Continuity of Care',
        ARRAY['Patient Assessment', 'Treatment Planning', 'Continuity of Care', 'Referral System'],
        13,
        20
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Standard AAC.1: The organization has defined and displays the services that it provides.
Objective: To ensure transparency in service offerings and help patients make informed choices.
Elements:
- List of dental services is prominently displayed
- Fee structure is transparent and communicated
- Emergency dental services availability is clearly indicated',
        'text',
        60,
        13
    ),
    (
        chapter_id,
        1,
        'Standard AAC.2: Patients are assessed by qualified dental professionals.
Intent: Comprehensive dental assessment forms the foundation of appropriate treatment planning.
Assessment includes:
- Medical and dental history
- Clinical examination
- Radiographic evaluation when indicated
- Risk assessment for dental diseases',
        'text',
        55,
        14
    );

    -- Chapter 4: Care of Patients
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        4,
        'Care of Patients',
        ARRAY['Clinical Protocols', 'Treatment Standards', 'Pain Management', 'Emergency Care'],
        21,
        30
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Standard COP.1: Dental care is provided by qualified professionals following established protocols.
Key Requirements:
- Evidence-based treatment protocols are followed
- Proper case documentation is maintained
- Treatment outcomes are monitored
- Complications are managed appropriately',
        'text',
        50,
        21
    );

    -- Chapter 5: Management of Medication
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        5,
        'Management of Medication',
        ARRAY['Drug Storage', 'Prescription Practices', 'Medication Safety', 'Adverse Drug Reactions'],
        31,
        38
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Standard MOM.1: Medication management ensures safe storage, prescription, and administration.
Requirements:
- Medications are stored under appropriate conditions
- Prescription writing follows standard format
- High-risk medications are identified and managed
- Adverse drug reactions are documented and reported',
        'text',
        55,
        31
    );

    -- Chapter 6: Patient Safety and Quality Improvement
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        6,
        'Patient Safety and Quality Improvement',
        ARRAY['Patient Safety Goals', 'Incident Reporting', 'Quality Indicators', 'Risk Management'],
        39,
        48
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Patient Safety Goals for Dental Practice:
1. Correct patient, correct procedure, correct site
2. Effective communication during patient handovers
3. Safe use of high-alert medications
4. Reduce healthcare-associated infections
5. Reduce patient harm from falls
6. Safe clinical handover',
        'text',
        50,
        39
    ),
    (
        chapter_id,
        1,
        'Quality Improvement Process:
- Regular clinical audits
- Patient satisfaction surveys
- Outcome monitoring
- Benchmarking with best practices
- Implementation of improvement initiatives
- Regular review and assessment',
        'text',
        40,
        40
    );

    -- Chapter 7: Prevention and Control of Infections
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        7,
        'Prevention and Control of Infections',
        ARRAY['Infection Control', 'Sterilization', 'Waste Management', 'Hand Hygiene'],
        49,
        56
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Standard PCI.1: The organization has an infection control program.
Key Components:
- Written infection control policies and procedures
- Designated infection control officer
- Staff training on infection control practices
- Monitoring of infection control compliance
- Management of occupational exposures',
        'text',
        55,
        49
    ),
    (
        chapter_id,
        1,
        'Sterilization and Disinfection Protocols:
- Classification of instruments (critical, semi-critical, non-critical)
- Appropriate sterilization methods for each category
- Monitoring of sterilization processes
- Proper storage of sterilized instruments
- Documentation of sterilization cycles',
        'text',
        50,
        50
    );

    -- Chapter 8: Responsibilities of Management
    INSERT INTO public.chapters (textbook_id, chapter_number, title, topics, start_page, end_page)
    VALUES (
        textbook_id,
        8,
        'Responsibilities of Management',
        ARRAY['Leadership', 'Governance', 'Resource Management', 'Organizational Ethics'],
        57,
        66
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (chapter_id, chunk_index, content, content_type, token_count, page_number)
    VALUES
    (
        chapter_id,
        0,
        'Management Responsibilities:
- Establish organizational mission and vision
- Ensure compliance with legal and regulatory requirements
- Provide adequate resources for quality dental care
- Foster culture of continuous quality improvement
- Ensure staff competency and training
- Monitor organizational performance',
        'text',
        50,
        57
    );

    RAISE NOTICE 'Successfully inserted NABH Manual with % chapters', 8;
END $$;

COMMIT;

-- Verification Query
SELECT
    t.title as textbook,
    t.status,
    COUNT(DISTINCT c.id) as chapters,
    COUNT(DISTINCT cc.id) as content_chunks
FROM public.textbooks t
LEFT JOIN public.chapters c ON c.textbook_id = t.id
LEFT JOIN public.content_chunks cc ON cc.chapter_id = c.id
WHERE t.title = 'NABH Dental Accreditation Standards Manual'
GROUP BY t.id, t.title, t.status;