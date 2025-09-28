-- Insert All Processed Textbooks into PingLearn Database
-- Generated: 2025-09-28T10:56:45.652751
-- Total Books: 29

BEGIN;

-- Book 1/29: Magnetic Effects of...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Why does a compass needle get deflected when brought near',
        ARRAY[]::text[],
        2,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a bar magnet? Activity 12.2Activity 12.2Activity 12.2Activity 12.2Activity 12.2 /square6Fix a sheet of white paper on a drawing board using some adhesive material. /square6Place a bar magnet in the centre of it. /square6Sprinkle some iron filings uniformly around the bar magnet (Fig. 12.2). A salt-sprinkler may be used for this purpose. /square6Now tap the board gently. /square6What do you observe?  Figure 12.2Figure 12.2Figure 12.2Figure 12.2Figure 12.2 Iron filings near the bar magnet align themselves along the field lines. The iron filings arrange themselves in a pattern as shown Fig. 12.2.  Why do the iron filings arrange in such a pattern? What does this pattern demonstrate?  The magnet exerts its influence in the region surrounding it.  Therefore the iron filings experience a force.  The force thus exerted makes iron filings to arrange in a pattern. The region surrounding a magnet, in which the force of the magnet can be detected, is said to have a magnetic field.  The lines along which the iron filings align themselves represent magnetic field lines. Are there other ways of obtaining magnetic field lines around a bar magnet?  Yes, you can yourself draw the field lines of a bar magnet. Activity 12.3Activity 12.3Activity 12.3Activity 12.3Activity 12.3 /square6Take a small compass and a bar magnet. /square6Place the magnet on a sheet of white paper fixed on a drawing board, using some adhesive material. /square6Mark the boundary of the magnet. /square6Place the compass near the north pole of the magnet. How does it behave? The south pole of the needle points towards the north pole of the magnet. The north pole of the compass is directed away from the north pole of the magnet. 2024-25',
        'text',
        429,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 3 --- Magnetic Effects of Electric Current 197 Magnetic field is a quantity that has both direction and magnitude. The direction of the magnetic field is taken to be the direction in which a north pole of the compass needle moves inside it.  Therefore it is taken by convention that the field lines emerge from north pole and merge at the south pole (note the arrows marked on the field lines in Fig. 12.4). Inside the magnet, the direction of field lines is from its south pole to its north pole. Thus the magnetic field lines are closed curves. The relative strength of the magnetic field is shown by the degree of closeness of the field lines. The field is stronger, that is, the force acting on the pole of another magnet placed is greater where the field lines are crowded (see Fig. 12.4). No two field-lines are found to cross each other. If they did, it would mean that at the point of intersection, the compass needle would point towards two directions, which is not possible. 12.2 12.212.2 12.212.2 MA MAMA MAMAGNETIC FIELD DUE TO A CURRENTGNETIC FIELD DUE TO A CURRENTGNETIC FIELD DUE TO A CURRENTGNETIC FIELD DUE TO A CURRENTGNETIC FIELD DUE TO A CURRENT --- --C CC CCARRYING ARRYINGARRYING ARRYINGARRYING CONDUCTORCONDUCTORCONDUCTORCONDUCTORCONDUCTOR In Activity 12.1, we have seen that an electric current through a metallic conductor produces a magnetic field around it. In order to find the direction of the field produced let us repeat the activity in the following way  – Figure 12.3Figure 12.3Figure 12.3Figure 12.3Figure 12.3 Drawing a magnetic field line with the help of a compass needle /square6Mark the position of two ends of the needle. /square6Now move the needle to a new position such that its south pole occupies the position previously occupied by its north pole. /square6In this way, proceed step by step till you reach the south pole of the magnet as shown in Fig. 12.3. /square6Join the points marked on the paper by a smooth curve.  This curve represents a ',
        'text',
        619,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 4 --- Science198 12.2.1 Magnetic Field due to a Current through a Straight Conductor What determines the pattern of the magnetic field generated by a current through a conductor? Does the pattern depend on the shape of the conductor? We shall investigate this with an activity. We shall first consider the patter n of the magnetic field ar ound a straight conductor carrying current. Activity 12.4Activity 12.4Activity 12.4Activity 12.4Activity 12.4 /square6Take a long straight copper wire, two or three cells of 1.5 V each, and a plug key. Connect all of them in series as shown in Fig. 12.5 (a). /square6Place the straight wire parallel to and over a compass needle. /square6Plug the key in the circuit. /square6Observe the direction of deflection of the north pole of the needle. If the current flows from north to south, as shown in Fig. 12.5 (a), the north pole of the compass needle would move towards the east. /square6Replace the cell connections in the circuit as shown in Fig. 12.5 (b). This would result in the change of the direction of current through the copper wire, that is, from south to north. /square6Observe the change in the dir ection of deflection of the needle. Y ou will see that now the needle moves in opposite direction, that is, towards the west [Fig. 12.5 (b)]. It means that the direction of magnetic field produced by the electric current is also reversed. Figure 12.5Figure 12.5Figure 12.5Figure 12.5Figure 12.5 A simple electric circuit in which a straight copper wire is placed parallel to and over a compass needle. The deflection in the needle becomes opposite when the direction of the current is reversed. (a) (b) Activity 12.5Activity 12.5Activity 12.5Activity 12.5Activity 12.5 /square6Take a battery (12 V), a variable resistance (or a rheostat), an ammeter (0–5 A), a plug key, connecting wires and a long straight thick copper wire. /square6Insert the thick wire through the centre, normal to the plane of a rectangular cardboard.  Take care that',
        'text',
        515,
        2
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '3. Why don’t two magnetic field lines intersect each other?',
        ARRAY[]::text[],
        6,
        7
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2024-25  --- Page 7 --- Magnetic Effects of Electric Current 201 We know that the magnetic field pr oduced by a curr ent-carrying wire at a given point depends directly on the current passing through it. Therefore, if there is a circular coil having n turns, the field produced is n times as large as that produced by a single turn. This is because the current in each circular turn has the same direction, and the field due to each turn then just adds up. Activity 12.6Activity 12.6Activity 12.6Activity 12.6Activity 12.6 /square6Take a rectangular cardboard having two holes. Insert a circular coil having large number of turns through them, normal to the plane of the cardboard. /square6Connect the ends of the coil in series with a battery, a key and a rheostat, as shown in Fig. 12.9. /square6Sprinkle iron filings uniformly on the cardboard. /square6Plug the key. /square6Tap the cardboard gently a few times. Note the pattern of the iron filings that emerges on the cardboard. Figure 12.9Figure 12.9Figure 12.9Figure 12.9Figure 12.9 Magnetic field produced by a current- carrying circular coil. 12.2.4 Magnetic Field due to a Current in a Solenoid A coil of many circular turns of insulated copper wire wrapped closely in the shape of a cylinder is called a solenoid. The pattern of the magnetic field lines around a current-carrying solenoid is shown in Fig. 12.10. Compare the pattern of the field with the magnetic field around a bar magnet (Fig. 12.4). Do they look similar? Yes, they ar e similar. In fact, one end of the solenoid behaves as a magnetic north pole, while the other behaves as the south pole. The field lines inside the solenoid are in the form of parallel straight lines. This indicates that the magnetic field is the same at all points inside the solenoid. That is, the field is uniform inside the solenoid. A strong magnetic field produced inside a solenoid can be used to magnetise a piece of magnetic material, like soft iron, when placed inside the coil (Fig. 12.11).',
        'exercise',
        589,
        7
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. Consider a circular loop of wire lying in',
        ARRAY[]::text[],
        7,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the plane of the table. Let the current pass through the loop clockwise. Apply the right-hand rule to find out the direction of the magnetic field inside and outside the loop.',
        'text',
        43,
        8
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. The magnetic field in a given region is',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'uniform. Draw a diagram to represent it. 2024-25  --- Page 8 --- Science202 12.3 12.312.3 12.312.3 FORCE ON A CURRENTFORCE ON A CURRENTFORCE ON A CURRENTFORCE ON A CURRENTFORCE ON A CURRENT --- --C CC CCARRYING CONDUCTORARRYING CONDUCTORARRYING CONDUCTORARRYING CONDUCTORARRYING CONDUCTOR IN A MAGNETIC FIELDIN A MAGNETIC FIELDIN A MAGNETIC FIELDIN A MAGNETIC FIELDIN A MAGNETIC FIELD We have lear nt that an electric current flowing through a conductor produces a magnetic field. The field so produced exerts a force on a magnet placed in the vicinity of the conductor. French scientist Andre Marie Ampere (1775–1836) suggested that the magnet must also exert an equal and opposite force on the current-carrying conductor. The force due to a magnetic field acting on a current-carrying conductor can be demonstrated through the following activity.',
        'text',
        212,
        8
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '3. Choose the correct option.',
        ARRAY[]::text[],
        8,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'The magnetic field inside a long straight solenoid-carrying current (a) is zero. (b) decreases as we move towards its end. (c) increases as we move towards its end. (d) is the same at all points. Activity 12.7Activity 12.7Activity 12.7Activity 12.7Activity 12.7 /square6Take a small aluminium rod AB (of about 5 cm). Using two connecting wires suspend it horizontally from a stand, as shown in Fig. 12.12. /square6Place a strong horse-shoe magnet in such a way that the rod lies between the two poles with the magnetic field directed upwards. For this put the north pole of the magnet vertically below and south pole vertically above the aluminium rod (Fig. 12.12). /square6Connect the aluminium rod in series with a battery, a key and a rheostat. /square6Now pass a current through the aluminium rod from end B to end A. /square6What do you observe? It is observed that the rod is displaced towards the left. You will notice that the r od gets displaced. /square6Reverse the direction of current flowing through the rod and observe the direction of its displacement. It is now towards the right. Why does the rod get displaced? Figure 12.12Figure 12.12Figure 12.12Figure 12.12Figure 12.12 A current-carrying rod, AB, experiences a force perpendicular to its length and the magnetic field. Support for the magnet is not shown here, for simplicity. The displacement of the rod in the above activity suggests that a force is exerted on the current-carrying aluminium rod when it is placed in a magnetic field. It also suggests that the direction of force is also reversed when the direction of current through the conductor is reversed. Now change the direction of field to vertically downwards by interchanging the two poles of the magnet. It is once again observed that 2024-25',
        'text',
        444,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 9 --- Magnetic Effects of Electric Current 203 the direction of force acting on the current-carrying rod gets reversed. It shows that the direction of the force on the conductor depends upon the direction of current and the direction of the magnetic field. Experiments have shown that the displacement of the rod is largest (or the magnitude of the force is the highest) when the direction of current is at right angles to the direction of the magnetic field. In such a condition we can use a simple rule to find the direction of the force on the conductor. In Activity 12.7, we considered the direction of the current and that of the magnetic field perpendicular to each other and found that the force is perpendicular to both of them. The three directions can be illustrated through a simple rule, called Fleming’s left-hand rule. According to this rule, stretch the thumb, forefinger and middle finger of your left hand such that they are mutually perpendicular (Fig. 12.13). If the first finger points in the direction of magnetic field and the second finger in the direction of current, then the thumb will point in the direction of motion or the force acting on the conductor. Devices that use current-carrying conductors and magnetic fields include electric motor, electric generator, loudspeakers, micr ophones and measuring instruments. Example 12.2 An electron enters a magnetic field at right angles to it, as shown in Fig. 12.14. The direction of force acting on the electron will be (a) to the right. (b) to the left. (c) out of the page. (d) into the page. Solution Answer is option (d). The direction of force is perpendicular to the direction of magnetic field and current as given by Fleming’s left hand rule. Recall that the direction of current is taken opposite to the direction of motion of electrons. The force is therefore directed into the page. Figure 12.13Figure 12.13Figure 12.13Figure 12.13Figure 12.13 Fleming’s left-hand rule Figure 12.14Figure 12.14Figure 12.1',
        'example',
        509,
        10
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '1. Which of the following property of a proton can change while it moves',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'freely in a magnetic field? (Ther e may be mor e than one corr ect answer.) (a) mass (b) speed (c) velocity (d) momentum 2024-25  --- Page 10 --- Science204 12.4 DOMESTIC ELECTRIC CIRCUITS12.4 DOMESTIC ELECTRIC CIRCUITS12.4 DOMESTIC ELECTRIC CIRCUITS12.4 DOMESTIC ELECTRIC CIRCUITS12.4 DOMESTIC ELECTRIC CIRCUITS In our homes, we receive supply of electric power through a main supply (also called mains), either supported through overhead electric poles or by underground cables. One of the wires in this supply, usually with red insulation cover, is called live wire (or positive). Another wire, with black insulation, is called neutral wire (or negative). In our country, the potential difference between the two is 220 V. At the meter-board in the house, these wires pass into an electricity meter through a main fuse. Through the main switch they are connected to the line wires in the house. These wires supply electricity to separate circuits within the house. Often, two separate circuits are used, one of 15 A current rating for appliances with higher power ratings such as geysers, air coolers, etc. The other circuit is of 5 A current rating for bulbs, fans, etc. The earth wire, which has insulation of green colour, is usually connected to a metal plate deep in the earth near the house. This is used as a safety measure, especially for those appliances that have a metallic body, for example, electric pr ess, toaster, table fan, refrigerator, etc. The metallic body is connected to the earth wire, which provides a low-resistance conducting path for the current. Thus, it ensures that any leakage of current to the metallic body of the appliance keeps its potential to that of the earth, and the user may not get a severe electric shock.',
        'example',
        438,
        10
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '2. In Activity 12.7, how do we think the displacement of rod AB will be',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'affected if (i) current in rod AB is increased; (ii) a stronger horse-shoe magnet is used; and (iii) length of the rod AB is increased?',
        'text',
        33,
        10
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '3. A positively-charged particle (alpha-particle) projected towards west is',
        ARRAY[]::text[],
        10,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'deflected towards north by a magnetic field. The direction of magnetic field is (a) towards south (b) towards east (c) downward (d) upward Magnetism in medicine An electric current always produces a magnetic field. Even weak ion currents that travel along the nerve cells in our body produce magnetic fields. When we touch something, our nerves carry an electric impulse to the muscles we need to use. This impulse produces a temporary magnetic field. These fields are very weak and are about one-billionth of the earth’s magnetic field. Two main organs in the human body where the magnetic field produced is significant, are the heart and the brain. The magnetic field inside the body forms the basis of obtaining the images of different body parts. This is done using a technique called Magnetic Resonance Imaging (MRI). Analysis of these images helps in medical diagnosis. Magnetism has, thus, got important uses in medicine. More to Know! 2024-25  --- Page 11 --- Magnetic Effects of Electric Current 205 Figure 12.15Figure 12.15Figure 12.15Figure 12.15Figure 12.15  A schematic diagram of one of the common domestic circuits QUESTIONS ? Figure 12.15 gives a schematic diagram of one of the common domestic circuits. In each separate circuit, different appliances can be connected across the live and neutral wires. Each appliance has a separate switch to ‘ON’/‘OFF’ the flow of current through it. In order that each appliance has equal potential difference, they are connected parallel to each other. Electric fuse is an important component of all domestic circuits. We have already studied the principle and working of a fuse in the previous chapter (see Section 11.7). A fuse in a circuit prevents damage to the appliances and the circuit due to overloading. Overloading can occur when the live wire and the neutral wire come into direct contact. (This occurs when the insulation of wires is damaged or there is a fault in the appliance.) In such a situation, the current in the circuit abrup',
        'exercise',
        612,
        11
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '1. Name two safety measures commonly used in electric circuits and',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'appliances.',
        'text',
        2,
        11
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '2. An electric oven of 2 kW power rating is operated in a domestic electric',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'circuit (220 V) that has a current rating of 5 A. What result do you expect? Explain.',
        'text',
        21,
        11
    );

END $$;

-- Book 2/29: 1. (b) 2. (d) 3. (c) 4. (c)...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '9. Yes',
        ARRAY[]::text[],
        1,
        1
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '10. 16.7 cm from the lens on the other side; 3.3 cm, reduced; real, inverted. 11. 30 cm 12. 6.0 cm, behind the mirror; virtual, erect',
        'text',
        33,
        1
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '13. m = 1 indicates that image formed by a plane mirror is of the same size as the object.',
        ARRAY[]::text[],
        1,
        1
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Further, the positive sign of m indicates that the image is virtual and erect. 14. 8.6 cm, behind the mirror; virtual, erect; 2.2 cm, reduced. 15. 54 cm on the object side; 14 cm, magnified; real, inverted. 16. –0.50 m; concave lens 17. + 0.67 m; converging lens 2024-25  --- Page 2 --- Answers 219 Chapter 10 1. (b) 2. (d) 3. (c) 4. (c) 5. (i) –0.18 m; (ii) +0.67 m',
        'text',
        91,
        1
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '7. Convex lens; +3.0 D',
        ARRAY[]::text[],
        1,
        1
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Chapter 11 1. (d) 2.  (b) 3.  (d) 4.  (c)',
        'text',
        10,
        1
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '5. Parallel 6. 122.7 m; ¼ times',
        ARRAY[]::text[],
        1,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '7. 3.33 Ω 8. 4.8 kΩ 9. 0.67 A 10. 4 resistors 12. 110 bulbs 13. 9.2 A, 4.6 A, 18.3 A 14. (i) 8 W; (ii) 8 W 15. 0.73 A 16. 250 W TV set in 1 hour 17. 1100 W 18. (b) High resistivity of alloys (d) inversely. Chapter 12 1. (d) 2. (c) 3. (a) True (b) False',
        'text',
        63,
        2
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '6. vertically downwards',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '7. (i) Right-hand thumb rule, (ii) Fleming’s left-hand rule Chapter 13 1. (a), (c), (d) 2.   (b) 3.   (d) 2024-25  --- Page 3 --- Science220 NOTES 2024-25',
        'text',
        38,
        2
    );

END $$;

-- Book 3/29: , how copper oxide reacts with hydrochloric acid....
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Give an example of a metal which',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) is a liquid at room temperature. (ii) can be easily cut with a knife. (iii) is the best conductor of heat. (iv) is a poor conductor of heat.',
        'text',
        36,
        4
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Explain the meanings of malleable and ductile.',
        ARRAY[]::text[],
        4,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '3.2 CHEMIC3.2 CHEMIC3.2 CHEMIC3.2 CHEMIC3.2 CHEMIC AL PROPERTIES OF METAL PROPERTIES OF METAL PROPERTIES OF METAL PROPERTIES OF METAL PROPERTIES OF MET ALS ALSALSALSALS We will learn about the chemical properties of metals in the following Sections 3.2.1 to 3.2.4. For this, collect the samples of following metals – aluminium, copper, iron, lead, magnesium, zinc and sodium.  Most non-metals produce acidic oxides when dissolve in water. On the other hand, most metals, give rise to basic oxides. You will be learning more about these metal oxides in the next section. 2024-25  --- Page 5 --- Metals and Non-metals 41 3.2.1 What happens when Metals are bur nt in Air? You have seen in Activity 3.8 that magnesium burns in air with a dazzling white flame. Do all metals react in the same manner? Let us check by performing the following Activity. Activity 3.9Activity 3.9Activity 3.9Activity 3.9Activity 3.9 CAUTION: The following activity needs the teacher’s assistance. It would be better if students wear eye protection. /square6Hold any of the samples taken above with a pair of tongs and try burning over a flame. Repeat with the other metal samples. /square6Collect the product if formed. /square6Let the products and the metal surface cool down. /square6Which metals burn easily? /square6What flame colour did you observe when the metal burnt? /square6How does the metal surface appear after burning? /square6Arrange the metals in the decreasing order of their reactivity towards oxygen. /square6Are the products soluble in water? Almost all metals combine with oxygen to form metal oxides. Metal  +  Oxygen →  Metal oxide  For example, when copper is heated in air, it combines with oxygen to form copper(II) oxide, a black oxide. 2Cu  +  O2  →   2CuO (Copper)      (Copper(II) oxide) Similarly, aluminium forms aluminium oxide. 4Al + 3O2 →  2Al2O3 (Aluminium) (Aluminium oxide) Recall from Chapter 2, how copper oxide reacts with hydrochloric acid. We have learnt that metal oxides are basic',
        'example',
        657,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 6 --- Science42 We have observed in Activity 3.9 that all metals do not r eact with oxygen at the same rate. Different metals show different reactivities towards oxygen. Metals such as potassium and sodium react so vigorously that they catch fire if kept in the open. Hence, to protect them and to prevent accidental fires, they are kept immersed in kerosene oil. At ordinary temperature, the surfaces of metals such as magnesium, aluminium, zinc, lead, etc., are covered with a thin layer of oxide. The protective oxide layer prevents the metal from further oxidation. Iron does not burn on heating but iron filings burn vigorously when sprinkled in the flame of the burner. Copper does not burn, but the hot metal is coated with a black coloured layer of copper(II) oxide. Silver and gold do not react with oxygen even at high temperatures. Do You Know? Anodising is a process of forming a thick oxide layer of aluminium. Aluminium develops a thin oxide layer when exposed to air. This aluminium oxide coat makes it resistant to further corrosion.  The resistance can be improved further by making the oxide layer thicker.  During anodising, a clean aluminium article is made the anode and is electrolysed with dilute sulphuric acid. The oxygen gas evolved at the anode reacts with aluminium to make a thicker protective oxide layer.  This oxide layer can be dyed easily to give aluminium articles an attractive finish. After performing Activity 3.9, you must have observed that sodium is the most reactive of the samples of metals taken here. The reaction of magnesium is less vigorous implying that it is not as reactive as sodium. But burning in oxygen does not help us to decide about the reactivity of zinc, iron, copper or lead. Let us see some more reactions to arrive at a conclusion about the order of reactivity of these metals. 3.2.2 What happens when Metals react with Water? Activity 3.10Activity 3.10Activity 3.10Activity 3.10Activity 3.10 CAUTION: This Activity needs the te',
        'summary',
        694,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 7 --- Metals and Non-metals 43 Metals react with water and produce a metal oxide and hydrogen gas. Metal oxides that are soluble in water dissolve in it to further form metal hydroxide. But all metals do not react with water. Metal + Water → Metal oxide + Hydrogen Metal oxide + Water → Metal hydroxide Metals like potassium and sodium react violently with cold water. In case of sodium and potassium, the reaction is so violent and exothermic that the evolved hydrogen immediately catches fire. 2K(s)   + 2H2O(l) →  2KOH(aq)  +  H2(g) + heat energy 2Na(s) + 2H2O(l) →  2NaOH(aq) + H2(g) + heat energy The reaction of calcium with water is less violent. The heat evolved is not sufficient for the hydrogen to catch fire. Ca(s) + 2H2O(l) →  Ca(OH)2(aq) + H2(g) Calcium starts floating because the bubbles of hydrogen gas formed stick to the surface of the metal. Magnesium does not react with cold water. It reacts with hot water to form magnesium hydroxide and hydrogen. It also starts floating due to the bubbles of hydrogen gas sticking to its surface. Metals like aluminium, iron and zinc do not react either with cold or hot water. But they react with steam to form the metal oxide and hydrogen. 2Al(s) + 3H2O(g) →  Al2O3(s) + 3H2(g) 3Fe(s) + 4H2O(g) →  Fe3O4(s) + 4H2(g) Metals such as lead, copper, silver and gold do not react with water at all. 3.2.3 What happens when Metals react with Acids? You have alr eady learnt that metals react with acids to give a salt and hydrogen gas. Figure 3.3Figure 3.3Figure 3.3Figure 3.3Figure 3.3  Action of steam on a metal 2024-25',
        'exercise',
        396,
        4
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '2. Write equations for the r eactions of',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) iron with steam (ii) calcium and potassium with water',
        'text',
        14,
        8
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '3. Samples of four metals A, B, C and D were taken and added to the',
        ARRAY[]::text[],
        8,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'following solution one by one. The results obtained have been tabulated as follows. 3.3 HOW DO MET3.3 HOW DO MET3.3 HOW DO MET3.3 HOW DO MET3.3 HOW DO MET ALS AND NON-METALS AND NON-METALS AND NON-METALS AND NON-METALS AND NON-MET ALS REA ALS REAALS REAALS REAALS REA CT? CT?CT? CT?CT? In the above activities, you saw the reactions of metals with a number of reagents. Why do metals react in this manner? Let us recall what we learnt about the electronic configuration of elements in Class IX. W e learnt that noble gases, which have a completely filled valence shell, show little chemical activity. We, therefore, explain the reactivity of elements as a tendency to attain a completely filled valence shell. Let us have a look at the electronic configuration of noble gases and some metals and non-metals. We can see from Table 3.3 that a sodium atom has one electron in its outermost shell. If it loses the electron from its M shell then its L shell now becomes the outermost shell and that has a stable octet. The nucleus of this atom still has 11 protons but the number of electrons has become 10, so there is a net positive charge giving us a sodium cation Na+. On the other hand chlorine has seven electrons in its outermost shell Use the Table above to answer the following questions about metals A, B, C and D. (i) Which is the most reactive metal? (ii) What would you observe if B is added to a solution of Copper(II) sulphate? (iii) Arrange the metals A, B, C and D in the order of decreasing reactivity.',
        'exercise',
        378,
        9
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '4. Which gas is produced when dilute hydrochloric acid is added to a',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'reactive metal? W rite the chemical r eaction when ir on reacts with dilute H2SO4.',
        'text',
        20,
        9
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '5. What would you observe when zinc is added to a solution of iron(II)',
        ARRAY[]::text[],
        9,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'sulphate? W rite the chemical r eaction that takes place. Metal Iron(II) sulphate Copper(II) sulphate Zinc sulphate Silver nitrate A No reaction Displacement B Displacement No reaction C No reaction No reaction No reaction Displacement D No reaction No reaction No reaction No reaction 2024-25  --- Page 11 --- Metals and Non-metals 47 and it requires one more electron to complete its octet. If sodium and chlorine were to react, the electron lost by sodium could be taken up by chlorine. After gaining an electron, the chlorine atom gets a unit negative charge, because its nucleus has 17 protons and there are 18 electrons in its K, L and M shells.  This gives us a chloride anion C1–. So both these elements can have a give-and-take relation between them as follows (Fig. 3.5). Na Na + e 2,8,1 2,8 + (Sodi um cation) → – Cl +e Cl 2,8,7 2,8,8 (Chloride anion) – –→ Figure 3.5Figure 3.5Figure 3.5Figure 3.5Figure 3.5  Formation of sodium chloride Sodium and chloride ions, being oppositely charged, attract each other and are held by strong electrostatic forces of attraction to exist as sodium chloride (NaCl). It should be noted that sodium chloride does not exist as molecules but aggregates of oppositely charged ions. Let us see the formation of one more ionic compound, magnesium chloride (Fig. 3.6). Table 3.3 Electronic configurations of some elements Type of Element Atomic Number of element number electrons in shells K L M N Noble gases Helium (He) 2 2 Neon (Ne) 10 2 8 Argon (Ar) 18 2 8 8 Metals Sodium (Na) 11 2 8 1 Magnesium (Mg) 12 2 8 2 Aluminium (Al) 13 2 8 3 Potassium (K) 19 2 8 8 1 Calcium (Ca) 20 2 8 8 2 Non-metals Nitrogen (N) 7 2 5 Oxygen (O) 8 2 6 Fluorine (F) 9 2 7 Phosphorus (P) 15 2 8 5 Sulphur (S) 16 2 8 6 Chlorine (Cl) 17 2 8 7 2024-25',
        'text',
        442,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 12 --- Science48 Mg Mg e 2+ (Magnesium cation)  →  + 2 2 8 2 2 8 – , , , Cl +e Cl 2,8,7 2,8,8 (Chloride anion) – – →  Figure 3.6Figure 3.6Figure 3.6Figure 3.6Figure 3.6  Formation of magnesium chloride The compounds formed in this manner by the transfer of electrons from a metal to a non-metal are known as ionic compounds or electrovalent compounds. Can you name the cation and anion present in MgCl2? 3.3.1 Properties of Ionic Compounds To learn about the properties of ionic compounds, let us perform the following Activity: Activity 3.13Activity 3.13Activity 3.13Activity 3.13Activity 3.13 /square6Take samples of sodium chloride, potassium iodide, barium chloride or any other salt from the science laboratory. /square6What is the physical state of these salts? /square6Take a small amount of a sample on a metal spatula and heat directly on the flame (Fig. 3.7). Repeat with other samples. /square6What did you observe? Did the samples impart any colour to the flame? Do these compounds melt? /square6Try to dissolve the samples in water , petrol and ker osene. Are they soluble? /square6Make a circuit as shown in Fig. 3.8 and insert the electrodes into a solution of one salt. What did you observe? Test the other salt samples too in this manner . /square6What is your inference about the nature of these compounds? Figure 3.7Figure 3.7Figure 3.7Figure 3.7Figure 3.7 Heating a salt sample on a spatula Figure 3.8Figure 3.8Figure 3.8Figure 3.8Figure 3.8 Testing the conductivity of a salt solution Table 3.4 Melting and boiling points of some ionic compounds Ionic Melting point Boiling point compound (K) (K) NaCl 1074 1686 LiCl 887 1600 CaCl2 1045 1900 CaO 2850 3120 MgCl2 981 1685 2024-25',
        'exercise',
        428,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 13 --- Metals and Non-metals 49 You may have observed the following general pr operties for ionic compounds— (i) Physical nature: Ionic compounds are solids and are somewhat hard because of the strong force of attraction between the positive and negative ions. These compounds are generally brittle and break into pieces when pressure is applied. (ii) Melting and Boiling points : Ionic compounds have high melting and boiling points (see Table 3.4). This is because a considerable amount of ener gy is r equired to br eak the str ong inter -ionic attraction. (iii) Solubility : Electrovalent compounds are generally soluble in water and insoluble in solvents such as kerosene, petrol, etc. (iv) Conduction of Electricity : The conduction of electricity through a solution involves the movement of charged particles. A solution of an ionic compound in water contains ions, which move to the opposite electrodes when electricity is passed through the solution. Ionic compounds in the solid state do not conduct electricity because movement of ions in the solid is not possible due to their rigid structure. But ionic compounds conduct electricity in the molten state. This is possible in the molten state since the elecrostatic forces of attraction between the oppositely charged ions are overcome due to the heat. Thus, the ions move freely and conduct electricity. QUESTIONS ? 1.          (i) Write the electr on-dot structur es for sodium, oxygen and magnesium. (ii) Show the formation of Na2O and MgO by the transfer of  electrons. (iii) What are the ions present in these compounds?',
        'exercise',
        398,
        12
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '2. Why do ionic compounds have high melting points?',
        ARRAY[]::text[],
        12,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '3.4 3.43.43.43.4 OCCURRENCE OF METOCCURRENCE OF METOCCURRENCE OF METOCCURRENCE OF METOCCURRENCE OF MET ALS ALSALS ALSALS The earth’s crust is the major source of metals. Seawater also contains some soluble salts such as sodium chloride, magnesium chloride, etc. The elements or compounds, which occur naturally in the earth’s crust, are known as minerals. At some places, minerals contain a very high percentage of a particular metal and the metal can be profitably extracted from it. These minerals are called ores. 3.4.1 Extraction of Metals You have lear nt about the r eactivity series of metals. Having this knowledge, you can easily understand how a metal is extracted from its ore. Some metals are found in the earth’s crust in the free state. Some are found in the form of their compounds. The metals at the bottom of the activity series are the least reactive. They are often found in a free 2024-25  --- Page 14 --- Science50 state. For example, gold, silver, platinum and copper are found in the free state. Copper and silver are also found in the combined state as their sulphide or oxide ores. The metals at the top of the activity series (K, Na, Ca, Mg and Al) are so reactive that they are never found in nature as free elements. The metals in the middle of the activity series (Zn, Fe, Pb, etc.) are moderately reactive. They are found in the earth’s crust mainly as oxides, sulphides or carbonates. You will find that the ores of many metals are oxides. This is because oxygen is a very reactive element and is very abundant on the earth. Thus on the basis of reactivity, we can group the metals into the following three categories (Fig. 3.9) – (i) Metals of low reactivity; (ii) Metals of medium reactivity; (iii) Metals of high reactivity. Different techniques are to be used for obtaining the metals falling in each category. K Na Ca Mg Al Zn Fe Pb Cu Ag Au Reduction using carbon Found in native state Electrolysis Figure 3.9Figure 3.9Figure 3.9Figure 3.9Figure 3.9 Activity seri',
        'example',
        641,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 15 --- Metals and Non-metals 51 used for removing the gangue from the ore are based on the differences between the physical or chemical properties of the gangue and the ore. Different separation techniques are  accordingly employed. 3.4.3 Extracting Metals Low in the Activity Series Metals low in the activity series are very unreactive. The oxides of these metals can be  reduced to metals by heating alone. For example, cinnabar (HgS) is an ore of mercury. When it is heated in air, it is first converted into mercuric oxide (HgO). Mercuric oxide is then reduced to mercury on further heating. 2HgS(s) + 3O (g) 2HgO(s) + 2SO (g)2 2 Heat →   2HgO(s) 2Hg(l) + O (g) 2 Heat →   Similarly, copper which is found as Cu2S in nature can be obtained from its ore by just heating in air. 2Cu S + 3O (g) 2Cu O(s) + 2SO (g) 2Cu O + Cu S  2 2 2 2 2 2 Heat Heat  →     →    6Cu(s) + SO (g)2 3.4.4 Extracting Metals in the Middle of the Activity Series The metals in the middle of the activity series such as iron, zinc, lead, copper, are moderately reactive. These are usually present as sulphides or carbonates in nature. It is easier to obtain a metal from its oxide, as compared to its sulphides and carbonates. Therefore, prior to reduction, the metal sulphides and carbonates must be converted into metal oxides. The sulphide ores are converted into oxides by heating strongly in the presence of excess air. This process is known as roasting. The carbonate ores are changed into oxides by heating strongly in limited air. This process is known as calcination. The chemical reaction that takes place during roasting and calcination of zinc ores can be shown as follows – Roasting 2ZnS(s) + 3O (g) 2ZnO(s) + 2SO (g)2 2 Heat →    Calcination ZnCO (s) ZnO(s) + CO (g)3 2 Heat →   The metal oxides are then reduced to the corresponding metals by using suitable reducing agents such as carbon. For example, when zinc oxide is heated with carbon, it is reduced to metallic zinc.',
        'example',
        602,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 16 --- Science52 agents because they can displace metals of lower reactivity from their compounds. For example, when manganese dioxide is heated with aluminium powder, the following reaction takes place – 3MnO2(s) + 4Al(s) →  3Mn(l) + 2Al2O3(s) + Heat Can you identify the substances that are getting oxidised and reduced? These displacement reactions are highly exothermic. The amount of heat evolved is so large that the metals are produced in the molten state. In fact, the reaction of iron(III) oxide (Fe2O3) with aluminium is used to join railway tracks or cracked machine parts. This reaction is known as the thermit reaction. Fe2O3(s) + 2Al(s) →  2Fe(l) + Al2O3(s) + Heat 3.4.5 Extracting Metals towards the T op of the Activity Series The metals high up in the reactivity series are very reactive. They cannot be obtained from their compounds by heating with carbon. For example, carbon cannot reduce the oxides of sodium, magnesium, calcium, aluminium, etc., to the respective metals. This is because these metals have more affinity for oxygen than carbon. These metals are obtained by electrolytic reduction. For example, sodium, magnesium and calcium are obtained by the electrolysis of their molten chlorides. The metals are deposited at the cathode (the negatively charged electrode), whereas, chlorine is liberated at the anode (the positively charged electrode). The reactions are – At cathode Na+ + e– → Na At anode       2Cl– → Cl2 + 2e– Similarly, aluminium is obtained by the electrolytic reduction of aluminium oxide. 3.4.6 Refining of Metals The metals produced by various reduction processes described above are not very pure. They contain impurities, which must be removed to obtain pure metals. The most widely used method for refining impure metals is electrolytic refining. Electrolytic Refining: Electrolytic Refining: Electrolytic Refining: Electrolytic Refining: Electrolytic Refining: Many metals, such as copper, zinc, tin, nickel, silver, gold, etc., are refi',
        'example',
        693,
        12
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '1. Define the following terms.',
        ARRAY[]::text[],
        15,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Mineral (ii)  Ore (iii)  Gangue',
        'text',
        8,
        15
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '3. What chemical process is used for obtaining a metal from its oxide?',
        ARRAY[]::text[],
        15,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Activity 3.14Activity 3.14Activity 3.14Activity 3.14Activity 3.14 /square6Take three test tubes and place clean iron nails in each of them. /square6Label these test tubes A, B and C. Pour some water in test tube A and cork it. /square6Pour boiled distilled water in test tube B, add about 1 mL of oil and cork it. The oil will float on water and prevent the air from dissolving in the water. /square6Put some anhydrous calcium chloride in test tube C and cork it. Anhydrous calcium chloride will absorb the moisture, if any, from the air. Leave these test tubes for a few days and then observe (Fig. 3.13). Figure 3.13Figure 3.13Figure 3.13Figure 3.13Figure 3.13 Investigating the conditions under which iron rusts. In tube A, both air and water are present. In tube B, there is no air dissolved in the water. In tube C, the air is dry. You will observe that iron nails rust in test tube A, but they do not rust in test tubes B and C. In the test tube A, the nails are exposed to both air and water. In the test tube B, the nails are exposed to only water, and the nails in test tube C ar e exposed to dry air . What does this tell us about the conditions under which iron articles rust? QUESTIONS ? 3.5 CORROSION3.5 CORROSION3.5 CORROSION3.5 CORROSION3.5 CORROSION You have learnt the following about corrosion in Chapter 1 – /square6Silver articles  become black after some time when exposed to air. This is because it reacts with sulphur in the air to form a coating of silver sulphide. /square6Copper reacts with moist carbon dioxide in the air and slowly loses its shiny brown surface and gains a green coat. This green substance is basic copper carbonate. /square6Iron when exposed to moist air for a long time acquires a coating of a brown flaky substance called rust. Let us find ou t the conditions under which iron rusts. A B C 2024-25',
        'exercise',
        461,
        15
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 18 --- Science54 Do You Know? Pure gold, known as 24 carat gold, is very soft. It is, therefore, not suitable for making jewellery. It is alloyed with either silver or copper to make it hard. Generally, in India, 22 carat gold is used for making ornaments. It means that 22 parts of pure gold is alloyed with 2 parts of either copper or silver. If one of the metals is mercury, then the alloy is known as an amalgam. The electrical conductivity and melting point of an alloy is less than that of pure metals. For example, brass, an alloy of copper and zinc (Cu and Zn), and bronze, an alloy of copper and tin (Cu and Sn), are not good conductors of electricity whereas copper is used for making electrical circuits. Solder, an alloy of lead and tin (Pb and Sn), has a low melting point and is used for welding electrical wires together. 3.5.1 Prevention of Corrosion The rusting of iron can be prevented by painting, oiling, greasing, galvanising, chrome plating, anodising or making alloys. Galvanisation is a method of protecting steel and iron from rusting by coating them with a thin layer of zinc. The galvanised article is protected against rusting even if the zinc coating is broken. Can you reason this out? Alloying is a very good method of improving the properties of a metal. We can get the desired properties by this method. For example, iron is the most widely used metal. But it is never used in its pure state. This is because pure iron is very soft and stretches easily when hot. But, if it is mixed with a small amount of carbon (about 0.05 %), it becomes hard and strong. When iron is mixed with nickel and chromium, we get stainless steel, which is hard and does not rust. Thus, if iron is mixed with some other substance, its properties change. In fact, the properties of any metal can be changed if it is mixed with some other substance. The substance added may be a metal or a non-metal. An alloy is a homogeneous mixture of two or more metals, or a metal and a non- me',
        'example',
        672,
        17
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '3. What are alloys?',
        ARRAY[]::text[],
        17,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'QUESTIONS ?',
        'exercise',
        2,
        17
    );

END $$;

-- Book 4/29: Our Environment...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. What are trophic levels? Give an example of a food chain and state the',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'different trophic levels in it.',
        'text',
        7,
        4
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. What is the role of decomposers in the ecosystem?',
        ARRAY[]::text[],
        4,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '13.213.213.2 13.213.2 HOW DO OUR ACTIVITIES AFFECT THEHOW DO OUR ACTIVITIES AFFECT THEHOW DO OUR ACTIVITIES AFFECT THEHOW DO OUR ACTIVITIES AFFECT THEHOW DO OUR ACTIVITIES AFFECT THE ENVIRONMENT?ENVIRONMENT?ENVIRONMENT?ENVIRONMENT?ENVIRONMENT? We are an integral part of the environment. Changes in the environment affect us and our activities change the environment around us. We have already seen in Class IX how our activities pollute the environment. In this chapter, we shall be looking at two of the environmental problems in detail, that is, depletion of the ozone layer and waste disposal. 13.2.1 Ozone Layer and How it is Getting Depleted Ozone (O3) is a molecule formed by three atoms of oxygen. While O 2, which we normally refer to as oxygen, is essential for all aerobic forms of life. Ozone, is a deadly poison. However , at the higher levels of the atmosphere, ozone performs an essential function. It shields the surface of the earth from ultraviolet (UV) radiation from the Sun. This radiation /square6Newspaper reports about pesticide levels in ready-made food items are often seen these days and some states have banned these products. Debate in groups the need for such bans. /square6What do you think would be the source of pesticides in these food items? Could pesticides get into our bodies from this source through other food products too? /square6Discuss what methods could be applied to reduce our intake of pesticides. 2024-25',
        'exercise',
        363,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 6 --- Our Environment 213 Activity 13.5Activity 13.5Activity 13.5Activity 13.5Activity 13.5 Activity 13.4Activity 13.4Activity 13.4Activity 13.4Activity 13.4 is highly damaging to organisms, for example, it is known to cause skin cancer in human beings. Ozone at the higher levels of the atmosphere is a product of UV radiation acting on oxygen (O 2) molecule. The higher energy UV radiations split apart some moleculer oxygen (O2) into free oxygen (O) atoms. These atoms then combine with the molecular oxygen to form ozone as shown— O O+O2 UV →  O O O2 3 Ozone) + → ( The amount of ozone in the atmosphere began to drop sharply in the 1980s. This decrease has been linked to synthetic chemicals like chlorofluorocarbons (CFCs) which are used as refrigerants and in fire extinguishers. In 1987, the United Nations Environment Programme (UNEP) succeeded in forging an agreement to freeze CFC production at 1986 levels. It is now mandatory for all the manufacturing companies to make CFC-free refrigerators throughout the world. /square6Collect waste material from your homes. This could include all the waste generated during a day, like kitchen waste (spoilt food, vegetable peels, used tea leaves, milk packets and empty cartons), waste paper, empty medicine bottles/strips/bubble packs, old and torn clothes and br oken footwear. /square6Bury this material in a pit in the school garden or if there is no space available, you can collect the material in an old bucket/ flower pot and cover with at least 15 cm of soil. /square6Keep this material moist and observe at 15-day intervals. /square6What are the materials that remain unchanged over long periods of time? /square6What are the materials which change their form and structure over time? /square6Of these materials that are changed, which ones change the fastest? /square6Find out from the library, internet or newspaper reports, which chemicals are responsible for the depletion of the ozone layer . /square6Find out if the reg',
        'example',
        614,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 7 --- Science214 We have seen in the chapter on ‘Life Processes’ that the food we eat is digested by various enzymes in our body. Have you ever wondered why the same enzyme does not break-down everything we eat? Enzymes are specific in their action, specific enzymes are needed for the break-down of a particular substance. That is why we will not get any energy if we try to eat coal! Because of this, many human-made materials like plastics will not be broken down by the action of bacteria or other saprophytes. These materials will be acted upon by physical processes like heat and pressure, but under the ambient conditions found in our environment, these persist for a long time. Substances that are broken down by biological processes are said to be biodegradable. How many of the substances you buried were biodegradable? Substances that are not broken down in this manner are said to be non-biodegradable. These substances may be inert and simply persist in the environment for a long time or may harm the various members of the eco-system. Activity 13.6Activity 13.6Activity 13.6Activity 13.6Activity 13.6 /square6Use the library or internet to find out more about biodegradable and non-biodegradable substances. /square6How long are various non-biodegradable substances expected to last in our environment? /square6These days, new types of plastics which are said to be biodegradable are available. Find out more about such materials and whether they do or do not harm the environment.',
        'text',
        376,
        6
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '2. Give any two ways in which biodegradable substances would affect the',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'environment.',
        'text',
        3,
        6
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '3. Give any two ways in which non-biodegradable substances would affect',
        ARRAY[]::text[],
        6,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the environment. QUESTIONS ? Visit any town or city, and we are sure to find heaps of garbage all over the place. Visit any place of tourist interest and we are sure to find the place littered with empty food wrappers. In the earlier classes we have talked about this problem of dealing with the garbage that we generate. Let us now look at the problem a bit more deeply. 2024-25  --- Page 8 --- Our Environment 215 Activity 13.7Activity 13.7Activity 13.7Activity 13.7Activity 13.7 /square6Find out what happens to the waste generated at home. Is there a system in place to collect this waste? /square6Find out how the local body ( panchayat, municipal corporation, resident welfare association) deals with the waste. Are there mechanisms in place to treat the biodegradable and non- biodegradable wastes separately? /square6Calculate how much waste is generated at home in a day. /square6How much of this waste is biodegradable? /square6Calculate how much waste is generated in the classroom in a day. /square6How much of this waste is biodegradable? /square6Suggest ways of dealing with this waste. Improvements in our life-style have resulted in greater amounts of waste material generation. Changes in attitude also have a role to play, with more and more things we use becoming disposable. Changes in packaging have resulted in much of our waste becoming non- biodegradable. What do you think will be the impact of these on our environment? Activity 13.8Activity 13.8Activity 13.8Activity 13.8Activity 13.8 /square6Find out how the sewage in your locality is treated. Are there mechanisms in place to ensure that local water bodies are not polluted by untreated sewage. /square6Find out how the local industries in your locality treat their wastes. Are there mechanisms in place to ensure that the soil and water are not polluted by this waste? Disposable cups in trains If you ask your parents, they will probably remember a time when tea in trains was served in plastic glasses which had to be',
        'exercise',
        652,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 9 --- Science216 Activity 13.9Activity 13.9Activity 13.9Activity 13.9Activity 13.9 /square6Search the internet or library to find out what hazardous materials have to be dealt with while disposing of electronic items. How would these materials affect the environment? /square6Find out how plastics are recycled. Does the recycling process have any impact on the environment? QUESTIONS ?',
        'exercise',
        98,
        8
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '2. How can you help in reducing the problem of waste disposal? Give',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'any two methods. What you have learnt /square6The various components of an ecosystem are interdependent. /square6The producers make the energy from sunlight available to the rest of the ecosystem. /square6There is a loss of energy as we go from one trophic level to the next, this limits the number of trophic levels in a food-chain. /square6Human activities have an impact on the environment. /square6The use of chemicals like CFCs has endangered the ozone layer. Since the ozone layer protects against the ultraviolet radiation from the Sun, this could damage the environment. /square6The waste we generate may be biodegradable or non-biodegradable. /square6The disposal of the waste we generate is causing serious environmental problems. EXERCISES',
        'exercise',
        187,
        8
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '1. Which of the following groups contain only biodegradable items?',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) Grass, flowers and leather (b) Grass, wood and plastic (c) Fruit-peels, cake and lime-juice (d) Cake, wood and grass',
        'text',
        30,
        8
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '2. Which of the following constitute a food-chain?',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) Grass, wheat and mango (b) Grass, goat and human 2024-25  --- Page 10 --- Our Environment 217 (c) Goat, cow and elephant (d) Grass, fish and goat',
        'text',
        37,
        8
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '3. Which of the following are environment-friendly practices?',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) Carrying cloth-bags to put purchases in while shopping (b) Switching off unnecessary lights and fans (c) Walking to school instead of getting your mother to drop you on her scooter (d) All of the above',
        'text',
        51,
        8
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '5. Will the impact of removing all the organisms in a trophic level be different for',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'different trophic levels? Can the organisms of any trophic level be removed without causing any damage to the ecosystem?',
        'text',
        30,
        8
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '6. What is biological magnification? Will the levels of this magnification be different at',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'different levels of the ecosystem?',
        'text',
        8,
        9
    );

END $$;

-- Book 5/29: The pancreas secretes pancreatic juice which conta...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Why is diffusion insufficient to meet the oxygen requirements of multi-',
        ARRAY[]::text[],
        3,
        3
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'cellular organisms like humans?',
        'text',
        7,
        3
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. What processes would you consider essential for maintaining life?',
        ARRAY[]::text[],
        3,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '5.2 NUTRITION5.2 NUTRITION5.2 NUTRITION5.2 NUTRITION5.2 NUTRITION When we walk or ride a bicycle, we are using up energy. Even when we are not doing any apparent activity, energy is needed to maintain a state of order in our body. We also need materials from outside in order to grow, develop, synthesise protein and other substances needed in the body. This source of energy and materials is the food we eat. How do living things get their food? The general requirement for energy and materials is common in all organisms, but it is fulfilled in different ways. Some organisms use simple food material obtained from inorganic sources in the form of carbon dioxide and water . These or ganisms, the autotr ophs, include gr een plants and some bacteria. Other organisms utilise complex substances. These complex substances have to be broken down into simpler ones before they can be used for the upkeep and growth of the body. To achieve this, organisms use bio-catalysts called enzymes. Thus, the heterotrophs survival depends directly or indirectly on autotrophs. Heterotrophic organisms include animals and fungi. 5.2.1 Autotrophic Nutrition Carbon and energy requirements of the autotrophic organism are fulfilled by photosynthesis. It is the process by which autotrophs take in substances from the outside and convert them into stored forms of energy. This material is taken in the form of carbon dioxide and water which is converted into carbohydrates in the presence of sunlight and chlorophyll. Carbohydrates are utilised for providing energy to the plant. We will study how this takes place in the next section. The carbohydrates which are not used immediately are stored in the form of starch, which serves as the internal energy reserve to be used as and when required by the plant. A somewhat similar situation is seen in us where some of the energy derived from the food we eat is stored in our body in the form of glycogen. 2024-25',
        'text',
        486,
        3
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- Science82 Let us now see what actually happens during the process of photosynthesis. The following events occur during this process – Figure 5.2Figure 5.2Figure 5.2Figure 5.2Figure 5.2 Variegated leaf (a) before and (b) after starch test Figure 5.1Figure 5.1Figure 5.1Figure 5.1Figure 5.1 Cross-section of a leaf Activity 5.1Activity 5.1Activity 5.1Activity 5.1Activity 5.1 /square6Take a potted plant with variegated leaves – for example, money plant or crotons. /square6Keep the plant in a dark room for three days so that all the starch gets used up. /square6Now keep the plant in sunlight for about six hours. /square6Pluck a leaf from the plant. Mark the green areas in it and trace them on a sheet of paper . /square6Dip the leaf in boiling water for a few minutes. /square6After this, immerse it in a beaker containing alcohol. /square6Carefully place the above beaker in a water -bath and heat till the alcohol begins to boil. /square6What happens to the colour of the leaf? What is the colour of the solution? /square6Now dip the leaf in a dilute solution of iodine for a few minutes. /square6Take out the leaf and rinse off the iodine solution. /square6Observe the colour of the leaf and compare this with the tracing of the leaf done in the beginning (Fig. 5.2). /square6What can you conclude about the presence of starch in various areas of the leaf? (i) Absorption of light energy by chlorophyll. (ii) Conversion of light energy to chemical energy and splitting of water molecules into hydrogen and oxygen. (iii) Reduction of carbon dioxide to carbohydrates. These steps need not take place one after the other immediately. For example, desert plants take up carbon dioxide at night and prepare an intermediate which is acted upon by the energy absorbed by the chlorophyll during the day. Let us see how each of the components of the above reaction are necessary for photosynthesis. If you carefully observe a cross-section of a leaf under the microscope (shown in Fig. 5.',
        'example',
        559,
        3
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 5 --- Life Processes 83 Now, let us study how the plant obtains carbon dioxide. In Class IX, we had talked about stomata (Fig. 5.3) which are tiny pores present on the surface of the leaves. Massive amounts of gaseous exchange takes place in the leaves through these pores for the purpose of photosynthesis. But it is important to note here that exchange of gases occurs across the surface of stems, roots and leaves as well. Since large amounts of water can also be lost through these stomata, the plant closes these pores when it does not need carbon dioxide for photosynthesis. The opening and closing of the pore is a function of the guard cells. The guard cells swell when water flows into them, causing the stomatal pore to open. Similarly the pore closes if the guard cells shrink. /square6Take two healthy potted plants which are nearly the same size. /square6Keep them in a dark room for three days. /square6Now place each plant on separate glass plates. Place a watch-glass containing potassium hydroxide by the side of one of the plants. The potassium hydroxide is used to absorb carbon dioxide. /square6Cover both plants with separate bell-jars as shown in Fig. 5.4. /square6Use vaseline to seal the bottom of the jars to the glass plates so that the set-up is air -tight. /square6Keep the plants in sunlight for about two hours. /square6Pluck a leaf from each plant and check for the presence of starch as in the above activity. /square6Do both the leaves show the presence of the same amount of starch? /square6What can you conclude from this activity? Figure 5.3 Figure 5.3 Figure 5.3 Figure 5.3 Figure 5.3 (a) Open and (b) closed stomatal pore Activity 5.2Activity 5.2Activity 5.2Activity 5.2Activity 5.2 Based on the two activities performed above, can we design an experiment to demonstrate that sunlight is essential for photosynthesis? So far, we have talked about how autotr ophs meet their ener gy requirements. But they also need other raw materials for building their',
        'text',
        598,
        3
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. What are the differences between autotrophic nutrition and heterotrophic',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'nutrition?',
        'text',
        2,
        9
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '5. How is the small intestine designed to absorb digested food?',
        ARRAY[]::text[],
        9,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Tube Test tube containing lime waterLime water Rubber tube (a) (b) Pichkari QUESTIONS ? Activity 5.5Activity 5.5Activity 5.5Activity 5.5Activity 5.5 /square6Take some fruit juice or sugar solution and add some yeast to this. Take this mixture in a test tube fitted with a one-holed cork. /square6Fit the cork with a bent glass tube. Dip the free end of the glass tube into a test tube containing fr eshly prepared lime water . /square6What change is observed in the lime water and how long does it take for this change to occur? /square6What does this tell us about the products of fermentation? We have discussed nutrition in or ganisms in the last section. The food material taken in during the process of nutrition is used in cells to provide energy for various life processes. Diverse organisms do this in different ways – some use oxygen to break-down glucose completely into carbon dioxide and water, some use other pathways that do not involve oxygen (Fig. 5.8). In all cases, the first step is the break-down of glucose, a six-carbon molecule, into a three-carbon molecule called pyruvate. This pr ocess takes place in the cytoplasm. Further , the pyruvate may be converted into ethanol and carbon dioxide. This process takes place in yeast during fermentation. Since this process takes place in the absence of air (oxygen), it is called anaerobic respiration. Break- down of pyruvate using oxygen takes place in the mitochondria. This Figure 5.7Figure 5.7Figure 5.7Figure 5.7Figure 5.7 (a) Air being passed into lime water with a pichkari/ syringe, (b) air being exhaled into lime water 2024-25',
        'exercise',
        400,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 10 --- Science88 process breaks up the three-carbon pyruvate molecule to give three molecules of carbon dioxide. The other pr oduct is water . Since this process takes place in the presence of air (oxygen), it is called aerobic respiration. The release of energy in this aerobic process is a lot greater than in the anaerobic process. Sometimes, when there is a lack of oxygen in our muscle cells, another pathway for the break-down of pyruvate is taken. Here the pyruvate is converted into lactic acid which is also a three-carbon molecule. This build-up of lactic acid in our muscles during sudden activity causes cramps. Figure 5.8Figure 5.8Figure 5.8Figure 5.8Figure 5.8  Break-down of glucose by various pathways The energy released during cellular respiration is immediately used to synthesise a molecule called ATP which is used to fuel all other activities in the cell. In these processes, ATP is broken down giving rise to a fixed amount of energy which can drive the endothermic reactions taking place in the cell. ATP ATP is the energy currency for most cellular processes. The energy released during the process of respiration is used to make an ATP molecule from ADP and inorganic phosphate. Endothermic processes in the cell then use this ATP to drive the reactions. When the terminal phosphate linkage in A TP is broken using water, the energy equivalent to 30.5 kJ/mol is released. Think of how a battery can provide energy for many different kinds of uses. It can be used to obtain mechanical energy, light energy, electrical energy and so on. Similarly, ATP can be used in the cells for the contraction of muscles, protein synthesis, conduction of nervous impulses and many other activities. Since the aerobic respiration pathway depends on oxygen, aerobic organisms need to ensure that there is sufficient intake of oxygen. We have seen that plants exchange gases through stomata, and the large inter-cellular spaces ensure that all cells are in contact with air. Carbon d',
        'text',
        522,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 11 --- Life Processes 89 cells, or away from them and out into the air. The direction of diffusion depends upon the environmental conditions and the requirements of the plant. At night, when there is no photosynthesis occurring, CO 2 elimination is the major exchange activity going on. During the day, CO2 generated during respiration is used up for photosynthesis, hence there is no CO2 release. Instead, oxygen release is the major event at this time. Animals have evolved different organs for the uptake of oxygen from the environment and for getting rid of the carbon dioxide produced. Terrestrial animals can breathe the oxygen in the atmosphere, but animals that live in water need to use the oxygen dissolved in water. Activity 5.6Activity 5.6Activity 5.6Activity 5.6Activity 5.6 /square6Observe fish in an aquarium. They open and close their mouths and the gill-slits (or the operculum which covers the gill-slits) behind their eyes also open and close. Are the timings of the opening and closing of the mouth and gill-slits coordinated in some manner? /square6Count the number of times the fish opens and closes its mouth in a minute. /square6Compare this to the number of times you breathe in and out in a minute. Since the amount of dissolved oxygen is fairly low compared to the amount of oxygen in the air, the rate of br eathing in aquatic organisms is much faster than that seen in terrestrial organisms. Fishes take in water through their mouths and force it past the gills where the dissolved oxygen is taken up by blood. Terrestrial organisms use the oxygen in the atmosphere for respiration. This oxygen is absorbed by different organs in different animals. All these organs have a structure that increases the surface area which is in contact with the oxygen-rich atmosphere. Since the exchange of oxygen and carbon dioxide has to take place across this surface, this surface is very fine and delicate. In order to protect this surface, it is usually placed within the b',
        'exercise',
        766,
        9
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '1. What advantage over an aquatic organism does a terrestrial organism',
        ARRAY[]::text[],
        13,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'have with regard to obtaining oxygen for respiration?',
        'text',
        13,
        13
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '2. What are the different ways in which glucose is oxidised to provide',
        ARRAY[]::text[],
        13,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'energy in various organisms?',
        'text',
        7,
        13
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '4. How are the lungs designed in human beings to maximise the area for',
        ARRAY[]::text[],
        13,
        18
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'exchange of gases? Activity 5.7Activity 5.7Activity 5.7Activity 5.7Activity 5.7 /square6Visit a health centre in your locality and find out what is the normal range of haemoglobin content in human beings. /square6Is it the same for children and adults? /square6Is there any difference in the haemoglobin levels for men and women? /square6Visit a veterinary clinic in your locality. Find out what is the normal range of haemoglobin content in an animal like the buffalo or cow. /square6Is this content different in calves, male and female animals? /square6Compare the difference seen in male and female human beings and animals. /square6How would the difference, if any, be explained? We have seen in previous sections that blood transports food, oxygen and waste materials in our bodies. In Class IX, we learnt about blood being a fluid connective tissue. Blood consists of a fluid medium called plasma in which the cells are suspended. Plasma transports food, carbon dioxide and nitrogenous wastes in dissolved form. Oxygen is carried by the red blood corpuscles. Many other substances like salts, are also transported by the blood. We thus need a pumping organ to push blood around the body, a network of tubes to reach all the tissues and a system in place to ensure that this network can be repaired if damaged. 2024-25',
        'exercise',
        330,
        13
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 14 --- Science92 The heart is a muscular organ which is as big as our fist (Fig. 5.10). Because both oxygen and carbon dioxide have to be transported by the blood, the heart has different chambers to prevent the oxygen-rich blood from mixing with the blood containing carbon dioxide. The carbon dioxide-rich blood has to reach the lungs for the carbon dioxide to be removed, and the oxygenated blood from the lungs has to be brought back to the heart. This oxygen-rich blood is then pumped to the rest of the body. We can follow this pr ocess step by step (Fig. 5.11). Oxygen-rich blood from the lungs comes to the thin-walled upper chamber of the heart on the left, the left atrium. The left atrium relaxes when it is collecting this blood. It then contracts, while the next chamber, the left ventricle, relaxes, so that the blood is transferred to it. When the muscular left ventricle contracts in its turn, the blood is pumped out to the body. De-oxygenated blood comes from the body to the upper chamber on the right, the right atrium, as it relaxes. As the right atrium contracts, the corresponding lower chamber, the right ventricle, dilates. This transfers blood to the right ventricle, which in turn pumps it to the lungs for oxygenation. Since ventricles have to pump blood into various organs, they have thicker muscular walls than the atria do. Valves ensure that blood does not flow backwards when the atria or ventricles contract. Oxygen enters the blood in the lungs The separation of the right side and the left side of the heart is useful to keep oxygenated and de- oxygenated blood from mixing. Such separation allows a highly efficient supply of oxygen to the body. This is useful in animals that have high energy needs, such as birds and mammals, which constantly use energy to maintain their body temperature. In animals that do not use energy for this purpose, the body temperature depends on the temperature in the environment. Such animals, like amphibians or  many re',
        'text',
        694,
        13
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 15 --- Life Processes 93 More to Know! Blood pressure is measured with an instrument called sphygmomanometer. High blood pressure is also called hypertension and is caused by the constriction of arterioles, which results in increased resistance to blood flow. It can lead to the rupture of an artery and internal bleeding. Blood pressure The force that blood exerts against the wall of a vessel is called blood pressure. This pressure is much greater in arteries than in veins. The pressure of blood inside the artery during ventricular systole (contraction) is called systolic pressure and pressure in artery during ventricular diastole (relaxation) is called diastolic pressure. The normal systolic pressure is about 120 mm of Hg and diastolic pressure is 80 mm of Hg. The tubes – blood vessels Arteries are the vessels which carry blood away from the heart to various organs of the body. Since the blood emerges from the heart under high pressure, the arteries have thick, elastic walls. Veins collect the blood from different organs and bring it back to the heart. They do not need thick walls because the blood is no longer under pressure, instead they have valves that ensure that the blood flows only in one direction. On reaching an organ or tissue, the artery divides into smaller and smaller vessels to bring the blood in contact with all the individual cells. The smallest vessels have walls which are one-cell thick and are called capillaries. Exchange of material between the blood and surrounding cells takes place across this thin wall. The capillaries then join together to form veins that convey the blood away from the organ or tissue. Maintenance by platelets What happens if this system of tubes develops a leak? Think about situations when we are injured and start bleeding. Naturally the loss of blood from the system has to be minimised. In addition, leakage would lead to a loss of pressure which would reduce the efficiency of the 2024-25',
        'text',
        493,
        13
    );

    -- Chapter 14
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        14,
        '1. What are the components of the transport system in human beings?',
        ARRAY[]::text[],
        18,
        18
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'What are the functions of these components?',
        'text',
        10,
        18
    );

    -- Chapter 15
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        15,
        '2. Why is it necessary to separate oxygenated and deoxygenated blood in',
        ARRAY[]::text[],
        18,
        18
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'mammals and birds?',
        'text',
        4,
        18
    );

    -- Chapter 16
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        16,
        '3. What are the components of the transport system in highly organised',
        ARRAY[]::text[],
        18,
        18
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'plants?',
        'text',
        1,
        18
    );

END $$;

-- Book 6/29: The Human Eye and...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. A person with a myopic eye cannot see objects beyond 1.2 m distinctly.',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'What should be the type of the corrective lens used to restore proper vision?',
        'text',
        19,
        4
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. What is the far point and near point of the human eye with normal',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'vision?',
        'text',
        1,
        4
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. A student has difficulty reading the blackboard while sitting in the last',
        ARRAY[]::text[],
        4,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'row. What could be the defect the child is suffering from? How can it be corrected? 2024-25  --- Page 5 --- The Human Eye and the Colourful World 165 10.3 REFRACTION OF LIGHT THROUGH A PRISM10.3 REFRACTION OF LIGHT THROUGH A PRISM10.3 REFRACTION OF LIGHT THROUGH A PRISM10.3 REFRACTION OF LIGHT THROUGH A PRISM10.3 REFRACTION OF LIGHT THROUGH A PRISM You have learnt how light gets r efracted thr ough a rectangular glass slab. For parallel refracting surfaces, as in a glass slab, the emergent ray is parallel to the incident ray.  However, it is slightly displaced laterally. How would light get refracted through a transparent prism? Consider a triangular glass prism. It has two triangular bases and three rectangular lateral surfaces. These surfaces are inclined to each other. The angle between its two lateral faces is called the angle of the prism. Let us now do an activity to study the refraction of light through a triangular glass prism. /square6Eyes must be removed within 4-6 hours after death. Inform the nearest eye bank immediately. /square6The eye bank team will remove the eyes at the home of the deceased or at a hospital. /square6Eye removal takes only 10-15 minutes. It is a simple process and does not lead to any disfigurement. /square6Persons who were infected with or died because of AIDS, Hepatitis B or C, rabies, acute leukaemia, tetanus, cholera, meningitis or encephalitis cannot donate eyes. An eye bank collects, evaluates and distributes the donated eyes. All eyes donated are evaluated using strict medical standards. Those donated eyes found unsuitable for transplantation are used for valuable research and medical education. The identities of both the donor and the recipient remain confidential. One pair of eyes gives vision to up to FOUR CORNEAL BLIND PEOPLE. Activity 10.1Activity 10.1Activity 10.1Activity 10.1Activity 10.1 /square6Fix a sheet of white paper on a drawing board using drawing pins. /square6Place a glass prism on it in such a way that it res',
        'text',
        749,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 6 --- Science166 Activity 10.2Activity 10.2Activity 10.2Activity 10.2Activity 10.2 /square6Take a thick sheet of cardboard and make a small hole or narrow slit in its middle. /square6Allow sunlight to fall on the narrow slit. This gives a narrow beam of white light. /square6Now, take a glass prism and allow the light from the slit to fall on one of its faces as shown in Fig. 10.5. /square6Turn the prism slowly until the light that comes out of it appears on a nearby screen. /square6What do you observe? Y ou will find a beautiful band of colours. Why does this happen? Here PE is the incident ray, EF is the refracted ray and FS is the emergent ray. You may note that a ray of light is entering fr om air to glass at the first surface AB. The light ray on refraction has bent towards the normal. At the second surface AC, the light ray has entered from glass to air. Hence it has bent away from normal. Compare the angle of incidence and the angle of refraction at each refracting surface of the prism. Is this similar to the kind of bending that occurs in a glass slab? The peculiar shape of the prism makes the emergent ray bend at an angle to the direction of the incident ray. This angle is called the angle of deviation. In this case ∠ D is the angle of deviation. Mark the angle of deviation in the above activity and measure it. 10.4 DISPERSION OF WHITE LIGHT BY A GL10.4 DISPERSION OF WHITE LIGHT BY A GL10.4 DISPERSION OF WHITE LIGHT BY A GL10.4 DISPERSION OF WHITE LIGHT BY A GL10.4 DISPERSION OF WHITE LIGHT BY A GL ASS PRISM ASS PRISMASS PRISM ASS PRISMASS PRISM You must have seen and appreciated the spectacular colours in a rainbow. How could the white light of the Sun give us various colours of the rainbow? Before we take up this question, we shall first go back to the refraction of light through a prism. The inclined refracting surfaces of a glass prism show exciting phenomenon.  Let us find it out through an activity. PE – Incident ray ∠ i – Angle of incidence E',
        'exercise',
        563,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 7 --- The Human Eye and the Colourful World 167 The prism has probably split the incident white light into a band of colours.  Note the colours that appear at the two ends of the colour band. What is the sequence of colours that you see on the screen? The various colours seen are Violet, Indigo, Blue, Green, Yellow, Orange and Red, as shown in Fig. 10.5. The acronym VIBGYOR will help you to remember the sequence of colours. The band of the coloured components of a light beam is called its spectrum. You might not be able to see all the colours separately. Yet something makes each colour distinct from the other. The splitting of light into its component colours is called dispersion. You have seen that white light is dispersed into its seven-colour components by a prism. Why do we get these colours? Different colours of light bend through different angles with respect to the incident ray, as they pass through a prism. The red light bends the least while the violet the most. Thus the rays of each colour emerge along different paths and thus become distinct. It is the band of distinct colours that we see in a spectrum. Isaac Newton was the first to use a glass prism to obtain the spectrum of sunlight. He tried to split the colours of the spectrum of white light further by using another similar prism. However, he could not get any mor e colours. He then placed a second identical prism in an inverted position with respect to the first prism, as shown in Fig. 10.6. This allowed all the colours of the spectrum to pass through the second prism. He found a beam of white light emerging from the other side of the second prism. This observation gave Newton the idea that the sunlight is made up of seven colours. Any light that gives a spectrum similar to that of sunlight is often referred to as white light. A rainbow is a natural spectrum appearing in the sky after a rain shower (Fig. 10.7). It is caused by dispersion of sunlight by tiny water droplets, present in the atm',
        'text',
        727,
        4
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. The human eye can focus on objects at different distances by adjusting the focal',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'length of the eye lens. This is due to  (a) presbyopia. (b) accommodation. (c) near-sightedness. (d) far-sightedness.',
        'text',
        29,
        10
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. The human eye forms the image of an object at  its',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) cornea. (b)  iris. (c)  pupil. (d)  retina.',
        'text',
        11,
        10
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '3. The least distance of distinct vision for a young adult with normal vision is about',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) 25 m. (b)  2.5 cm. (c)  25 cm. (d)  2.5 m.',
        'text',
        11,
        10
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '4. The change in focal length of an eye lens is caused by the action of the',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) pupil. (b)  retina. (c) ciliary muscles. (d)  iris.',
        'text',
        13,
        10
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '5. A person needs a lens of power –5.5 dioptres for correcting his distant vision. For',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'correcting his near vision he needs a lens of power +1.5 dioptre. What is the focal length of the lens required for correcting (i) distant vision, and (ii) near vision?',
        'text',
        42,
        10
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '6. The far point of a myopic person is 80 cm in front of the eye. What is the nature and',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'power of the lens required to correct the problem?',
        'exercise',
        12,
        10
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '7. Make a diagram to show how hypermetropia is corrected. The near point of a',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'hypermetropic eye is 1 m. What is the power of the lens required to correct this defect? Assume that the near point of the normal eye is 25 cm.',
        'text',
        35,
        10
    );

END $$;

-- Book 7/29: titled Sustainable...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        'Chapter 13 Our Environment 208',
        ARRAY[]::text[],
        7,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Answers 218-219 CONTENTS 2024-25  --- Page 12 --- (xii) WE, THE PEOPLE OF INDIA, [SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC] JUSTICE, LIBERTY EQUALITY FRATERNITY IN OUR CONSTITUENT ASSEMBLY HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION. having solemnly resolved to constitute India into a and to secure to all its citizens : social, economic and political; of thought, expression, belief, faith and worship; of status and of opportunity; and to promote among them all assuring the dignity of the individual and the [unity and integrity of the Nation]; this twenty-sixth day of November, 1949 do 1 2',
        'exercise',
        154,
        8
    );

    -- Chapter 14
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        14,
        '1. Subs. by the Constitution (Forty-second Amendment) Act, 1976, Sec.2,',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'for "Sovereign Democratic Republic" (w.e.f. 3.1.1977)',
        'text',
        13,
        8
    );

    -- Chapter 15
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        15,
        '2. Subs. by the Constitution (Forty-second Amendment) Act, 1976, Sec.2,',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'for "Unity of the Nation" (w.e.f. 3.1.1977) THE CONSTITUTION OF INDIA PREAMBLE 2024-25',
        'text',
        21,
        8
    );

END $$;

-- Book 8/29: 8CHAPTER...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. If a trait A exists in 10% of a population of an asexually reproducing',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'species and a trait B exists in 60% of the same population, which trait is likely to have arisen earlier?',
        'text',
        26,
        2
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. How does the creation of variations in a species promote survival?',
        ARRAY[]::text[],
        2,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Activity 8.1Activity 8.1Activity 8.1Activity 8.1Activity 8.1 /square6Observe the ears of all the students in the class. Prepare a list of students having free or attached earlobes and calculate the percentage of students having each (Fig. 8.2). Find out about the earlobes of the parents of each student in the class. Correlate the earlobe type of each student with that of their parents. Based on this evidence, suggest a possible rule for the inheritance of earlobe types. 8.2.2 Rules for the Inheritance of T raits  – –– –– Mendel’s Contributions The rules for inheritance of such traits in human beings are related to the fact that both the father and the mother contribute practically equal amounts of genetic material to the child. This means that each trait can be influenced by both paternal and maternal DNA. Thus, for each trait there will be two versions in each child. What will, then, the trait seen in the child be? Mendel (see box) worked out the main rules of such inheritance, and it is interesting to look at some of his experiments from more than a century ago. Figure 8.2Figure 8.2Figure 8.2Figure 8.2Figure 8.2 (a) Free and (b) attached earlobes. The lowest part of the ear , called the earlobe, is closely attached to the side of the head in some of us, and not in others. Free and attached earlobes are two variants found in human populations. different kinds of advantages. Bacteria that can withstand heat will survive better in a heat wave, as we have discussed earlier. Selection of variants by environmental factors forms the basis for evolutionary processes, as we will discuss in later sections. (a) (b) 2024-25',
        'text',
        410,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- Heredity 131 x RR yy (round, green) rr YY (wrinkled, yellow) Ry  rY Rr Yy (round, yellow) F1 x Rr Yy F1 Rr Yy F1 315 round, yellow 108 round, green 101 wrinkled, yellow 32 wrinkled, green 9 3 3 1 556 seeds 16 Figure 9.5 Independent inheritance of two separate traits, shape and colour of seeds RY Ry rY ry RY Ry rY ry RRYY RRYy RrYY RrYy RRYy RRyy RrYy Rryy RrYY RrYy rrYY rrYy RrYy Rryy rrYy rryy F2 Figure 8.5Figure 8.5Figure 8.5Figure 8.5Figure 8.5 Independent inheritance of two separate traits, shape and colour of seeds What happens when pea plants showing two different characteristics, rather than just one, are bred with each other? What do the progeny of a tall plant with round seeds and a short plant with wrinkled-seeds look like? They are all tall and have round seeds. Tallness and round seeds are thus dominant traits. But what happens when these F1 progeny are used to generate F2 progeny by self-pollination? A Mendelian experiment will find that some F2 progeny are tall plants with round seeds, and some were short plants with wrinkled seeds.  However, there would also be some F2 progeny that showed new combinations. Some of them would be tall, but have wrinkled seeds, while others would be short, but have round seeds. You can see as to how new combinations of traits are formed in F2 offspring when factors controlling for seed shape and seed colour recombine to form zygote leading to form F2 offspring (Fig. 8.5). Thus, the tall/short trait and the round seed/wrinkled seed trait are independently inherited. 8.2.3 How do these Traits get Expressed? How does the mechanism of heredity work? Cellular DNA is the information source for making proteins in the cell. A section of DNA that provides information for one protein is called the gene for that protein. How do proteins control the characteristics that we are discussing here? Let us take the example of tallness as a characteristic. We know that plants have hormones that can trigger growth. Plant heig',
        'example',
        862,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 5 --- Science132 inherited. This is explained by the fact that each gene set is present, not as a single long thread of DNA, but as separate independent pieces, each called a chromosome. Thus, each cell will have two copies of each chromosome, one each from the male and female parents. Every germ- cell will take one chromosome from each pair and these may be of either maternal or paternal origin. When two germ cells combine, they will restore the normal number of chromosomes in the progeny, ensuring the stability of the DNA of the species. Such a mechanism of inheritance explains the results of the Mendel experiments, and is used by all sexually reproducing organisms. But asexually reproducing organisms also follow similar rules of inheritance. Can we work out how their inheritance might work? 8.2.4 Sex Determination We have discussed the idea that the two sexes participating in sexual reproduction must be somewhat different from each other for a number of reasons. How is the sex of a newborn individual determined? Different species use very different strategies for this. Some rely entirely on environmental cues. Thus, in some animals like a few reptiles, the temperature at which fertilised eggs are kept determines whether the animals developing in the eggs will be male or female. In other animals, such as snails, individuals can change sex, indicating that sex is not genetically determined. However, in human beings, the sex of the individual is largely genetically determined. In other words, the genes inherited from our parents decide whether we will be boys or girls. But so far, we have assumed that similar gene sets ar e inherited from both parents. If that is the case, how can genetic inheritance determine sex? The explanation lies in the fact that all human chromosomes are not paired. Most human chromosomes have a maternal and a paternal copy, and we have 22 such pairs. But one pair, called the sex chromosomes, is odd in not always being a per fect pai',
        'exercise',
        701,
        6
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '1. How do Mendel’s experiments show that traits may be dominant or',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'recessive?',
        'text',
        2,
        6
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '2. How do Mendel’s experiments show that traits are inherited',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'independently?',
        'text',
        3,
        6
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '3. A man with blood group A marries a woman with blood group O and',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'their daughter has blood group O. Is this information enough to tell you which of the traits – blood group A or O – is dominant? Why or why not?',
        'text',
        36,
        6
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '4. How is the sex of the child determined in human beings?',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'What you have learnt /square6Variations arising during the process of reproduction can be inherited. /square6These variations may lead to increased survival of the individuals. /square6Sexually reproducing individuals have two copies of genes for the same trait. If the copies are not identical, the trait that gets expressed is called the dominant trait and the other is called the recessive trait. /square6Traits in one individual may be inherited separately, giving rise to new combinations of traits in the offspring of sexual reproduction. /square6Sex is determined by different factors in various species. In human beings, the sex of the child depends on whether the paternal chromosome is X (for girls) or Y (for boys). EXERCISES',
        'exercise',
        184,
        6
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '1. A Mendelian experiment consisted of breeding tall pea plants bearing violet flowers',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'with short pea plants bearing white flowers. The progeny all bore violet flowers, but almost half of them were short. This suggests that the genetic make-up of the tall parent can be depicted as (a) TTWW (b) TTww (c) TtWW (d) TtWw',
        'text',
        57,
        6
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '2. A study found that children with light-coloured eyes are likely to have parents',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'with light-coloured eyes. On this basis, can we say anything about whether the light eye colour trait is dominant or recessive? Why or why not?',
        'text',
        35,
        6
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '4. How is the equal genetic contribution of male and female parents ensured in',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the progeny? 2024-25',
        'text',
        5,
        6
    );

END $$;

-- Book 9/29: From the data...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. What would be the electron dot structure of carbon dioxide which has',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the formula CO 2?',
        'text',
        4,
        4
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. What would be the electron dot structure of a molecule of sulphur which',
        ARRAY[]::text[],
        4,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'is made up of eight atoms of sulphur? (Hint –  The eight atoms of sulphur are joined together in the form of a ring.) Figure 4.5Figure 4.5Figure 4.5Figure 4.5Figure 4.5 Electron dot structure for methane points of these compounds. Since the electrons are shared between atoms and no charged particles are formed, such covalent compounds are generally poor conductors of electricity. Allotropes of carbon The element carbon occurs in different forms in nature with widely varying physical properties. Both diamond and graphite are formed by carbon atoms, the difference lies in the manner in which the carbon atoms are bonded to one another. In diamond, each carbon atom is bonded to four other carbon atoms forming a rigid three-dimensional structure. In graphite, each carbon atom is bonded to three other carbon atoms in the same plane giving a hexagonal array. One of these bonds is a double-bond, and thus the valency of carbon is satisfied. Graphite structure is formed by the hexagonal arrays being placed in layers one above the other. More to Know! The structure of graphite 2024-25',
        'text',
        272,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 5 --- Science62 4.2 VERSATILE NATURE OF CARBON We have seen the for mation of covalent bonds by the sharing of electrons in various elements and compounds. We have also seen the structure of a simple carbon compound, methane. In the beginning of the Chapter, we saw how many things we use contain carbon. In fact, we ourselves are made up of carbon compounds. The numbers of carbon compounds whose formulae are known to chemists was recently estimated to be in million s! This outnumbers by a large margin the compounds formed by all the other elements put together. Why is it that this property is seen in carbon and no other element? The nature of the covalent bond enables carbon to form a large number of compounds. Two factors noticed in the case of carbon ar e – (i) Carbon has the unique ability to form bonds with other atoms of carbon, giving rise to large molecules. This property is called catenation. These compounds may have long chains of carbon, branched chains of carbon or even carbon atoms arranged in rings. In addition, carbon atoms may be linked by single, double or triple bonds. Compounds of carbon, which are linked by only single bonds between the carbon atoms are called saturated compounds. Compounds of carbon having double or triple bonds between their carbon atoms are called unsaturated compounds. No other element exhibits the property of catenation to the extent seen in carbon compounds. Silicon forms compounds with hydrogen which have chains of upto seven or eight atoms, but these compounds are very reactive. The carbon-carbon bond is very strong and hence stable. This gives us the large number of compounds with many carbon atoms linked to each other. (ii) Since carbon has a valency of four, it is capable of bonding with four other atoms of carbon or atoms of some other mono-valent element. Compounds of carbon are formed with oxygen, hydrogen, nitrogen, sulphur, chlorine and many other elements giving rise to compounds with specific properties w',
        'text',
        604,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 6 --- Carbon and its Compounds 63 Organic compounds The two characteristic features seen in carbon, that is, tetravalency and catenation, put together give rise to a large number of compounds. Many have the same non-carbon atom or group of atoms attached to different carbon chains. These compounds were initially extracted from natural substances and it was thought that these carbon compounds or organic compounds could only be formed within a living system. That is, it was postulated that a ‘vital force’ was necessary for their synthesis. Friedrich Wöhler disproved this in 1828 by preparing urea from ammonium cyanate. But carbon compounds, except for carbides, oxides of carbon, carbonate and hydrogencarbonate salts continue to be studied under organic chemistry. 4.2.1 Saturated and Unsaturated Carbon Compounds4.2.1 Saturated and Unsaturated Carbon Compounds4.2.1 Saturated and Unsaturated Carbon Compounds4.2.1 Saturated and Unsaturated Carbon Compounds4.2.1 Saturated and Unsaturated Carbon Compounds We have already seen the structur e of methane. Another compound formed between carbon and hydrogen is ethane with a formula of C2H6. In order to arrive at the structure of simple carbon compounds, the first step is to link the carbon atoms together with a single bond (Fig. 4.6a) and then use the hydrogen atoms to satisfy the remaining valencies of carbon (Fig. 4.6b). For example, the structure of ethane is arrived in the following steps – C—C Step 1 Figure 4.6 Figure 4.6 Figure 4.6 Figure 4.6 Figure 4.6 (a) Carbon atoms linked together with a single bond Three valencies of each carbon atom remain unsatisfied, so each is bonded to three hydrogen atoms giving: Step 2 Figure 4.6 Figure 4.6 Figure 4.6 Figure 4.6 Figure 4.6 (b)     Each carbon atom bonded to three hydrogen atoms The electron dot structure of ethane is shown in Fig. 4.6(c). Can you draw the structure of propane, which has the molecular formula C3H8 in a similar manner? You will see that the valencies o',
        'example',
        676,
        4
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '4. Carboxylic acid',
        ARRAY[]::text[],
        9,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2024-25  --- Page 10 --- Carbon and its Compounds 67 unit? Do you see any relation between the number of carbon and hydrogen atoms in these compounds? The general formula for alkenes can be written as CnH2n, where n = 2, 3, 4. Can you similarly generate the general formula for alkanes and alkynes? As the molecular mass increases in any homologous series, a gradation in physical properties is seen. This is because the melting and boiling points increase with increasing molecular mass. Other physical properties such as solubility in a particular solvent also show a similar gradation. But the chemical properties, which are determined solely by the functional group, remain similar in a homologous series. Activity 4.2Activity 4.2Activity 4.2Activity 4.2Activity 4.2 4.2.5 Nomenclature of Carbon Compounds The names of compounds in a homologous series are based on the name of the basic carbon chain modified by a “prefix” “phrase before” or “suffix” “phrase after” indicating the nature of the functional group. For example, the names of the alcohols taken in Activity 4.2 are methanol, ethanol, propanol and butanol. Naming a carbon compound can be done by the following method – (i) Identify the number of carbon atoms in the compound. A compound having three carbon atoms would have the name propane. (ii) In case a functional group is present, it is indicated in the name of the compound with either a prefix or a suffix (as given in Table 4.4). (iii) If the name of the functional group is to be given as a suffix, and the suffix of the functional group begins with a vowel a, e, i, o, u, then the name of the carbon chain is modified by deleting the final ‘e’ and adding the appropriate suffix. For example, a three-carbon chain with a ketone group would be named in the following manner – Propane – ‘e’ = propan + ‘one’ = propanone. (iv) If the carbon chain is unsaturated, then the final ‘ane’ in the name of the carbon chain is substituted by ‘ene’ or ‘yne’ as given in Table 4.4. For e',
        'example',
        661,
        10
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '2. What are the two properties of carbon which lead to the huge number',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'of carbon compounds we see around us?',
        'text',
        9,
        10
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '3. What will be the formula and electron dot structure of cyclopentane?',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Table 4.4 Nomenclature of organic compounds Class of Prefix/Suffix Example compounds',
        'example',
        21,
        10
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '1. Halo alkane Prefix-chloro, Chloropropane',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Bromopropane',
        'text',
        3,
        10
    );

    -- Chapter 15
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        15,
        '7. Alkynes Suffix - yne Propyne',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2024-25  --- Page 12 --- Carbon and its Compounds 69 ?',
        'text',
        13,
        10
    );

    -- Chapter 16
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        16,
        '4. Draw the structures for the following compounds.',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Ethanoic acid (ii) Bromopentane * (iii) Butanone (iv) Hexanal. *Are structural isomers possible for bromopentane?',
        'text',
        29,
        10
    );

    -- Chapter 17
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        17,
        '5. How would you name the following compounds?',
        ARRAY[]::text[],
        10,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) CH3—CH 2—Br (ii)    (iii) 4.3 CHEMICAL PROPERTIES OF CARBON COMPOUNDS In this section we will be studying about some of the chemical properties of carbon compounds. Since most of the fuels we use are either carbon or its compounds, we shall first study combustion. 4.3.1 Combustion4.3.1 Combustion4.3.1 Combustion4.3.1 Combustion4.3.1 Combustion Carbon, in all its allotropic forms, burns in oxygen to give carbon dioxide along with the release of heat and light. Most carbon compounds also release a large amount of heat and light on burning. These are the oxidation reactions that you learnt about in the first Chapter – (i) C + O2 →  CO2 + heat and light (ii) CH4 + O2 →  CO2 + H2O + heat and light (iii) CH3CH2OH + O2 →  CO2 + H2O + heat and light Balance the latter two reactions like you learnt in the first Chapter. Activity 4.3Activity 4.3Activity 4.3Activity 4.3Activity 4.3 CAUTION: This Activity needs the teacher’s assistance. /square6Take some carbon compounds (naphthalene, camphor, alcohol) one by one on a spatula and bur n them. /square6Observe the nature of the flame and note whether smoke is produced. /square6Place a metal plate above the flame. Is there a deposition on the plate in case of any of the compounds? Activity 4.4Activity 4.4Activity 4.4Activity 4.4Activity 4.4 /square6Light a bunsen burner and adjust the air hole at the base to get different types of flames/presence of smoke. /square6When do you get a yellow, sooty flame? /square6When do you get a blue flame? Saturated hydrocarbons will generally give a clean flame while unsaturated carbon compounds will give a yellow flame with lots of black smoke. This results in a sooty deposit on the metal plate in Activity 4.3. However, limiting the supply of air results in incomplete combustion of even saturated hydrocarbons giving a sooty flame. The gas/kerosene stove used at home has inlets for air so that a sufficiently oxygen-rich 2024-25',
        'text',
        483,
        10
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 13 --- Science70 mixture is burnt to give a clean blue flame. If you observe the bottoms of cooking vessels getting blackened, it means that the air holes are blocked and fuel is getting wasted. Fuels such as coal and petroleum have some amount of nitrogen and sulphur in them. Their combustion results in the formation of oxides of sulphur and nitrogen which are major pollutants in the environment. Do You Know? Why do substances burn with or without a flame? Have you ever observed either a coal or a wood fire? If not, the next time you get a chance, take close note of what happens when the wood or coal starts to burn. You have seen above that a candle or the LPG in the gas stove burns with a flame. However, you will observe the coal or charcoal in an ‘angithi’ sometimes just glows red and gives out heat without a flame. This is because a flame is only produced when gaseous substances burn. When wood or charcoal is ignited, the volatile substances present vapourise and burn with a flame in the beginning. A luminous flame is seen when the atoms of the gaseous substance are heated and start to glow. The colour produced by each element is a characteristic property of that element. Try and heat a copper wire in the flame of a gas stove and observe its colour. You have seen that incomplete combustion gives soot which is carbon. On this basis, what will you attribute the yellow colour of a candle flame to? Formation of coal and petroleum Coal and petroleum have been formed from biomass which has been subjected to various biological and geological processes. Coal is the remains of trees, ferns, and other plants that lived millions of years ago. These were crushed into the earth, perhaps by earthquakes or volcanic eruptions. They were pressed down by layers of earth and rock. They slowly decayed into coal. Oil and gas are the remains of millions of tiny plants and animals that lived in the sea. When they died, their bodies sank to the sea bed and were covered by silt',
        'text',
        755,
        10
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 14 --- Carbon and its Compounds 71 We see that some substances are capable of adding oxygen to others. These substances are known as oxidising agents. Alkaline potassium permanganate or acidified potassium dichromate are oxidising alcohols to acids, that is, adding oxygen to the starting material. Hence they are known as oxidising agents. 4.3.3 Addition Reaction Unsaturated hydrocarbons add hydrogen in the presence of catalysts such as palladium or nickel to give saturated hydrocarbons. Catalysts are substances that cause a reaction to occur or proceed at a different rate without the reaction itself being affected. This reaction is commonly used in the hydrogenation of vegetable oils using a nickel catalyst. Vegetable oils generally have long unsaturated carbon chains while animal fats have saturated carbon chains. You must have seen advertisements stating that some vegetable oils are ‘healthy’. Animal fats generally contain saturated fatty acids which are said to be harmful for health. Oils containing unsaturated fatty acids should be chosen for cooking. 4.3.4 Substitution Reaction Saturated hydrocarbons are fairly unreactive and are inert in the presence of most reagents. However, in the presence of sunlight, chlorine is added to hydrocarbons in a very fast reaction. Chlorine can replace the hydrogen atoms one by one. It is called a substitution reaction because one type of atom or a group of atoms takes the place of another . A number of products are usually formed with the higher homologues of alkanes. CH4 + Cl2 →  CH3Cl + HCl (in the presence of sunlight) ? QUESTIONS',
        'exercise',
        401,
        13
    );

    -- Chapter 19
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        19,
        '2. A mixture of oxygen and ethyne is burnt for welding. Can you tell why',
        ARRAY[]::text[],
        13,
        16
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a mixture of ethyne and air is not used? 4.4 SOME IMPORT ANT C ARBON COMPOUNDS – ETHANOL AND ETHANOIC ACID Many carbon compounds are invaluable to us. But here we shall study the properties of two commercially important compounds – ethanol and ethanoic acid. 2024-25',
        'text',
        66,
        13
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 15 --- Science72 4.4.1 Properties of Ethanol Ethanol is a liquid at room temperature (refer to Table 4.1 for the melting and boiling points of ethanol). Ethanol is commonly called alcohol and is the active ingredient of all alcoholic drinks. In addition, because it is a good solvent, it is also used in medicines such as tincture iodine, cough syrups, and many tonics. Ethanol is also soluble in water in all proportions. Consumption of small quantities of dilute ethanol causes drunkenness. Even though this practice is condemned, it is a socially widespread practice. However, intake of even a small quantity of pure ethanol (called absolute alcohol) can be lethal. Also, long-term consumption of alcohol leads to many health problems. Reactions of EthanolReactions of EthanolReactions of EthanolReactions of EthanolReactions of Ethanol (i) Reaction with sodium – Activity 4.6Activity 4.6Activity 4.6Activity 4.6Activity 4.6 Teacher’s demonstration  – /square6Drop a small piece of sodium, about the size of a couple of grains of rice, into ethanol (absolute alcohol). /square6What do you observe? /square6How will you test the gas evolved? 2Na + 2CH3CH2OH →  2CH3CH2O– Na+ + H2  (Sodium ethoxide) Alcohols react with sodium leading to the evolution of hydrogen. With ethanol, the other product is sodium ethoxide. Can you recall which other substances produce hydrogen on reacting with metals? (ii) Reaction to give unsaturated hydrocarbon: Heating ethanol at 443 K with excess concentrated sulphuric acid results in the dehydration of ethanol to give ethene – CH CH OH CH  = CH  + H O3 2 2 2 2 Ho t Conc. H SO2 4 −  →    The concentrated sulphuric acid can be regarded as a dehydrating agent which removes water from ethanol. How do alcohols affect living beings? When large quantities of ethanol are consumed, it tends to slow metabolic processes and to depress the central nervous system. This results in lack of coordination, mental confusion, drowsiness, lowering of the normal',
        'exercise',
        708,
        13
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 16 --- Carbon and its Compounds 73 4.4.2 Properties of Ethanoic Acid Ethanoic acid is commonly called acetic acid and belongs to a group of acids called carboxylic acids. 5-8% solution of acetic acid in water is called vinegar and is used widely as a preservative in pickles. The melting point of pure ethanoic acid is 290 K and hence it often freezes during winter in cold climates. This gave rise to its name glacial acetic acid. The group of organic compounds called carboxylic acids are obviously characterised by their acidic nature. However, unlike mineral acids like HCl, which are completely ionised, carboxylic acids are weak acids. Activity 4.7Activity 4.7Activity 4.7Activity 4.7Activity 4.7 n Compare the pH of dilute acetic acid and dilute hydrochloric acid using both litmus paper and universal indicator. n Are both acids indicated by the litmus test? n Does the universal indicator show them as equally strong acids? Activity 4.8Activity 4.8Activity 4.8Activity 4.8Activity 4.8 n Take 1 mL ethanol (absolute alcohol) and 1 mL glacial acetic acid along with a few drops of concentrated sulphuric acid in a test tube. n Warm in a water-bath for at least five minutes as shown in Fig. 4.11. n Pour into a beaker containing 20-50 mL of water and smell the resulting mixture. Reactions of ethanoic acid:Reactions of ethanoic acid:Reactions of ethanoic acid:Reactions of ethanoic acid:Reactions of ethanoic acid: (i) Esterification reaction: Esters are most commonly formed by reaction of an acid and an alcohol. Ethanoic acid reacts with absolute ethanol in the presence of an acid catalyst to give an ester – CH COOH CH CH OH CH C C CH CH H O3 3 2 3 2 3 2 Acid O (E − + − − − − − + 11 t thanoic acid)            (Ethanol)                               (Ester) O Generally, esters are sweet-smelling substances. These are used in making perfumes and as flavouring agents. On treating with sodium hydroxide, which is an alkali, the ester is converted back to  alcohol and sodium sa',
        'text',
        679,
        13
    );

END $$;

-- Book 10/29: COOH), sodium hydroxide (NaOH), calcium...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. You have been pr ovided with thr ee test tubes. One of them contains',
        ARRAY[]::text[],
        1,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'distilled water and the other two contain an acidic solution and a basic solution, r espectively. If you ar e given only r ed litmus paper , how will you identify the contents of each test tube? /square6Collect the following solutions from the science laboratory– hydrochloric acid (HCl),  sulphuric acid (H2SO4), nitric acid (HNO3), acetic acid (CH 3COOH), sodium hydroxide (NaOH), calcium hydroxide [Ca(OH) 2], potassium hydroxide (KOH), magnesium hydroxide [Mg(OH)2], and ammonium hydroxide (NH 4OH). /square6Put a drop of each of the above solutions on a watch-glass one by one and test with a drop of the indicators shown in Table 2.1. /square6What change in colour did you observe with red litmus, blue litmus, phenolphthalein and methyl orange solutions for each of the solutions taken? /square6Tabulate your observations in Table 2.1. Table 2.1 Sample Red Blue Phenolph- Methyl solution litmus litmus -thalein      orange solution solution solution solution Activity 2.2Activity 2.2Activity 2.2Activity 2.2Activity 2.2 /square6Take some finely chopped onions in a plastic bag along with some strips of clean cloth. T ie up the bag tightly and leave over night in the fridge. The cloth strips can now be used to test for acids and bases. /square6Take two of these cloth strips and check their odour . /square6Keep them on a clean surface and put a few drops of dilute HCl solution on one strip and a few drops of dilute NaOH solution on the other. 2024-25',
        'text',
        365,
        1
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 3 --- Acids, Bases and Salts 19 Which of these – vanilla, onion and clove, can be used as olfactory indicators on the basis of your observations? Let us do some more activities to understand the chemical properties of acids and bases. 2.1.2 How do Acids and Bases React with Metals? /square6Rinse both cloth strips with water and again check their odour . /square6Note your observations. /square6Now take some dilute vanilla essence and clove oil and check their odour. /square6Take some dilute HCl solution in one test tube and dilute NaOH solution in another . Add a few dr ops of dilute vanilla essence to both test tubes and shake well. Check the odour once again and record changes in odour , if any. /square6Similarly, test the change in the odour of clove oil with dilute HCl and dilute NaOH solutions and record your observations. Activity 2.3Activity 2.3Activity 2.3Activity 2.3Activity 2.3 CAUTION: This activity needs the teacher’s assistance. /square6Set the apparatus as shown in Fig. 2.1. /square6Take about 5 mL of dilute sulphuric acid in a test tube and add a few pieces of zinc granules to it. /square6What do you observe on the surface of zinc granules? /square6Pass the gas being evolved through the soap solution. /square6Why are bubbles  formed in the soap solution? /square6Take a burning candle near a gas filled bubble. /square6What do you observe? /square6Repeat this Activity with some more acids like HCl, HNO 3 and CH3COOH. /square6Are the observations in all the cases the same or different? Figure 2.1Figure 2.1Figure 2.1Figure 2.1Figure 2.1 Reaction of zinc granules with dilute sulphuric acid and testing hydrogen gas by burning 2024-25',
        'text',
        419,
        1
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 4 --- Science20  Note that the metal in the above reactions displaces hydrogen atoms from the acids as hydrogen gas and forms a compound called a salt. Thus, the reaction of a metal with an acid can be summarised as – Acid + Metal →  Salt + Hydrogen gas Can you now write the equations for the reactions you have observed? Activity 2.4Activity 2.4Activity 2.4Activity 2.4Activity 2.4 The reactions occurring in the above Activity are written as – Test tube A: Na CO HCl(aq) Cl(aq) H O(l) + CO2 3 2 2(s) N a (g)+ → +2 2 Test tube B: NaHCO HCl(aq) Cl(aq) H O(l) + CO3 2 2(s) Na (g)+ → + On passing the carbon dioxide gas evolved through lime water, Ca(OH) CO H O(l)2 2 2(aq) (g) CaCO s 3+ → +( ) (Lime water) (White precipitate) /square6Place a few pieces of granulated zinc metal in a test tube. /square6Add 2 mL of sodium hydroxide solution and warm the contents of the test tube. /square6Repeat the rest of the steps as in Activity 2.3 and record your observations. The reaction that takes place can be written as follows. 2NaOH(aq) + Zn(s) →  Na2ZnO2(s) + H2(g)       (Sodium zincate) You find again that hydr ogen is formed in the reaction. However, such reactions are not possible with all metals. 2.1.3 How do Metal Carbonates and Metal Hydrogencarbonates React with Acids? Activity 2.5Activity 2.5Activity 2.5Activity 2.5Activity 2.5 /square6Take two test tubes, label them as A and B. /square6Take about 0.5 g of sodium carbonate (Na2CO3) in test tube A and about 0.5 g of sodium hydrogencarbonate (NaHCO3) in test tube B. /square6Add about 2 mL of dilute HCl to both the test tubes. /square6What do you observe? /square6Pass the gas produced in each case through lime water (calcium hydroxide solution) as shown in Fig. 2.2 and record your observations. Figure 2.2Figure 2.2Figure 2.2Figure 2.2Figure 2.2 Passing carbon dioxide gas through calcium hydroxide solution 2024-25',
        'text',
        472,
        1
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '1. Why should curd and sour substances not be kept in brass and copper',
        ARRAY[]::text[],
        5,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'vessels?',
        'text',
        2,
        5
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '2. Which gas is usually liberated when an acid reacts with a metal?',
        ARRAY[]::text[],
        5,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Illustrate with an example. How will you test for the presence of this gas?',
        'example',
        18,
        5
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '3. Metal compound A reacts with dilute hydrochloric acid to produce',
        ARRAY[]::text[],
        5,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'effervescence. The gas evolved extinguishes a bur ning candle. W rite a balanced chemical equation for the reaction if one of the compounds formed is calcium chloride. 2.2 WHA2.2 WHA2.2 WHA2.2 WHA2.2 WHA T DO ALL ACIDS AND ALL BASES HAT DO ALL ACIDS AND ALL BASES HAT DO ALL ACIDS AND ALL BASES HAT DO ALL ACIDS AND ALL BASES HAT DO ALL ACIDS AND ALL BASES HA VE IN VE INVE IN VE INVE IN COMMON?COMMON?COMMON?COMMON?COMMON? In Section 2.1 we have seen that all acids have similar chemical properties. What leads to this similarity in properties? We saw in Activity 2.3 that all acids generate hydrogen gas on reacting with metals, so hydrogen seems to be common to all acids. Let us perform an Activity to investigate whether all compounds containing hydrogen are acidic. Activity 2.8Activity 2.8Activity 2.8Activity 2.8Activity 2.8 /square6Take solutions of glucose, alcohol, hydrochloric acid, sulphuric acid, etc. /square6Fix two nails on a cork, and place the cork in a 100 mL beaker . /square6Connect the nails to the two terminals of a 6 volt battery through a bulb and a switch, as shown in Fig. 2.3. /square6Now pour some dilute HCl in the beaker and switch on the current. /square6Repeat with dilute sulphuric acid. /square6What do you observe? /square6Repeat the experiment separately with glucose and alcohol solutions. What do you observe now? /square6Does the bulb glow in all cases? Figure 2.3Figure 2.3Figure 2.3Figure 2.3Figure 2.3 Acid solution in water conducts electricity 2024-25',
        'text',
        374,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 7 --- Acids, Bases and Salts 23 The bulb will start glowing in the case of acids, as shown in Fig. 2.3. But you will observe that glucose and alcohol solutions do not conduct electricity. Glowing of the bulb indicates that there is a flow of electric current through the solution. The electric current is carried through the acidic solution by ions. Acids contain H+ ion as cation and anion such as Cl–  in HCl, N O3 –  in HNO3, SO2– 4  in H2SO4, CH3COO– in CH3COOH. Since the cation present in acids is H+, this suggests that acids produce hydrogen ions, H+(aq), in solution, which are responsible for their acidic properties. Repeat the same Activity using alkalis such as sodium hydroxide, calcium hydroxide, etc. What can you conclude from the results of this Activity? 2.2.1 What Happens to an Acid or a Base in a Water Solution? Do acids produce ions only in aqueous solution? Let us test this. Activity 2.9Activity 2.9Activity 2.9Activity 2.9Activity 2.9 /square6Take about 1g solid NaCl in a clean and dry test tube and set up the apparatus as shown in Fig. 2.4. /square6Add some concentrated sulphuric acid to the test tube. /square6What do you observe? Is there a gas coming out of the delivery tube? /square6Test the gas evolved successively with dry and wet blue litmus paper . /square6In which case does the litmus paper change colour? /square6On the basis of the above Activity, what do you infer about the acidic character of: (i) dry HCl gas (ii) HCl solution? Figure 2.4 Figure 2.4 Figure 2.4 Figure 2.4 Figure 2.4 Preparation of HCl gas This experiment suggests that hydrogen ions in HCl are produced in the presence of water. The separation of H+ ion from HCl molecules cannot occur in the absence of water. HCl + H2O →  H3O+ + Cl– Hydrogen ions cannot exist alone, but they exist after combining with water molecules. Thus hydrogen ions must always be shown as H+(aq) or hydronium ion (H3O+). H+ + H2O →  H3O+ We have seen that acids give H3O+ or H+(aq) ion in water. Let',
        'exercise',
        567,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 8 --- Science24 KOH(s) K (aq)+OH (aq)H O2 + →  – Mg(OH)2(s) H O2 →   Mg2+(aq)+2OH– (aq) Bases generate hydroxide (OH– ) ions in water. Bases which are soluble in water are called alkalis. Do You Know? All bases do not dissolve in water. An alkali is a base that dissolves in water. They are soapy to touch, bitter and corrosive. Never taste or touch them as they may cause harm. Which of the bases in the Table 2.1 are alkalis? Now as we have identified that all acids generate H +(aq) and all bases generate OH – (aq), we can view the neutralisation reaction as follows – Acid + Base → Salt + Water H  X + M  OH →  MX + HOH H+(aq) + OH –  (aq) →  H2O(l) Let us see what is involved when water is mixed with an acid or a base. Activity 2.10Activity 2.10Activity 2.10Activity 2.10Activity 2.10 /square6Take 10 mL water in a beaker . /square6Add a few drops of concentrated H 2SO4 to it and swirl the beaker slowly. /square6Touch the base of the beaker . /square6Is there a change in temperature? /square6Is this an exothermic or endothermic process? /square6Repeat the above Activity with sodium hydroxide pellets and record your observations.Figure 2.5Figure 2.5Figure 2.5Figure 2.5Figure 2.5 Warning sign displayed on containers containing concentrated acids and bases The process of dissolving an acid or a base in water is a highly exothermic one. Care must be taken while mixing concentrated nitric acid or sulphuric acid with water. The acid must always be added slowly to water with constant stirring. If water is added to a concentrated acid, the heat generated may cause the mixture to splash out and cause burns. The glass container may also break due to excessive local heating. Look out for the warning sign (shown in Fig. 2.5) on the can of concentrated sulphuric acid and on the bottle of sodium hydroxide pellets. Mixing an acid or base with water results in decrease in the concentration of ions (H3O+/OH– ) per unit volume. Such a process is called dilution and the a',
        'exercise',
        511,
        5
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. Why do HCl, HNO 3, etc., show acidic characters in aqueous solutions',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'while solutions of compounds like alcohol and glucose do not show acidic character?',
        'text',
        20,
        8
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '4. While diluting an acid, why is it recommended that the acid should be',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'added to water and not water to the acid?',
        'text',
        10,
        8
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '5. How is the concentration of hydronium ions (H 3O+) affected when a',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'solution of an acid is diluted?',
        'text',
        7,
        8
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '6. How is the concentration of hydroxide ions (O H',
        ARRAY[]::text[],
        8,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '– ) affected when excess base is dissolved in a solution of sodium hydroxide? Figure 2.6Figure 2.6Figure 2.6Figure 2.6Figure 2.6  Variation of pH with the change in concentration of  H+(aq) and OH– (aq) ions 2024-25  --- Page 10 --- Science26 Activity 2.11Activity 2.11Activity 2.11Activity 2.11Activity 2.11 /square6Test the pH values of solutions given in Table 2.2. /square6Record your observations. /square6What is the nature of each substance on the basis of your observations? Figure 2.7 Figure 2.7 Figure 2.7 Figure 2.7 Figure 2.7 pH of some common substances shown on a pH paper (colours are only a rough guide) The strength of acids and bases depends on the number of H+ ions and OH– ions produced, respectively. If we take hydrochloric acid and acetic acid of the same concentration, say one molar, then these produce different amounts of hydrogen ions. Acids that give rise to more H+ ions are said to be strong acids, and acids that give less H+ ions are said to be weak acids. Can you now say what weak and strong bases are? 2.3.1 Impor2.3.1 Impor2.3.1 Impor2.3.1 Impor2.3.1 Impor tance of pH in Evertance of pH in Evertance of pH in Evertance of pH in Evertance of pH in Ever yday Life yday Lifeyday Lifeyday Lifeyday Life Are plants and animals pH sensitive? Our body works within the pH range of 7.0 to 7.8. Living organisms can survive only in a narrow range of pH change. When pH of rain water is less than 5.6, it is called acid rain. When acid rain flows into the rivers, it lowers the pH of the river water. The survival of aquatic life in such rivers becomes difficult. Table 2.2  S. Solution Colour of Approx- Nature of No. pH paper -imate substance pH value 1 Saliva (before meal) 2 Saliva (after meal) 3 Lemon juice 4 Colourless aerated drink 5 Carrot juice 6 Coffee 7 Tomato juice 8 Tap water 9 1M NaOH 10 1M HCl 2024-25',
        'exercise',
        461,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 11 --- Acids, Bases and Salts 27 What is the pH of the soil in your backyard? Plants require a specific pH range for their healthy growth. To find out the pH required for the healthy growth of a plant, you can collect the soil from various places and check the pH in the manner described below in Activity 2.12. Also, you can note down which plants are growing in the region from which you have collected the soil. Acids in other planets The atmosphere of venus is made up of thick white and yellowish clouds of sulphuric acid. Do you think life can exist on this planet? Activity 2.12Activity 2.12Activity 2.12Activity 2.12Activity 2.12 /square6Put about 2 g soil in a test tube and add 5 mL water to it. /square6Shake the contents of the test tube. /square6Filter the contents and collect the filtrate in a test tube. /square6Check the pH of this filtrate with the help of universal indicator paper . /square6What can you conclude about the ideal soil pH for the growth of plants in your region? pH in our digestive system It is very interesting to note that our stomach produces hydrochloric acid. It helps in the digestion of food without harming the stomach. During indigestion the stomach produces too much acid and this causes pain and irritation. To get rid of this pain, people use bases called antacids. One such remedy must have been suggested by you at the beginning of this Chapter. These antacids neutralise the excess acid. Magnesium hydroxide (Milk of magnesia), a mild base, is often used for this purpose. pH change as the cause of tooth decay Tooth decay starts when the pH of the mouth is lower than 5.5. Tooth enamel, made up of calcium hydroxyapatite (a crystalline form of calcium phosphate) is the hardest substance in the body. It does not dissolve in water, but is corroded when the pH in the mouth is below 5.5. Bacteria present in the mouth produce acids by degradation of sugar and food particles remaining in the mouth after eating. The best way to prevent this',
        'exercise',
        622,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 12 --- Science28 2.4 MORE ABOUT SAL2.4 MORE ABOUT SAL2.4 MORE ABOUT SAL2.4 MORE ABOUT SAL2.4 MORE ABOUT SAL TS TSTSTSTS In the previous sections we have seen the formation of salts during various reactions. Let us understand more about their preparation, properties and uses. 2.4.1 Family of Salts Activity 2.13Activity 2.13Activity 2.13Activity 2.13Activity 2.13 /square6Write the chemical for mulae of the salts given below. Potassium sulphate, sodium sulphate, calcium sulphate, magnesium sulphate, copper sulphate, sodium chloride, sodium nitrate, sodium carbonate and ammonium chloride. Nature provides neutralisation options Nettle is a herbaceous plant which grows in the wild. Its leaves have stinging hair, which cause painful stings when touched accidentally. This is due to the methanoic acid secreted by them. A traditional remedy is rubbing the area with the leaf of the dock plant, which often grows beside the nettle in the wild. Can you guess the nature of the dock plant? So next time you know what to look out for if you accidentally touch a nettle plant while trekking. Are you aware of any other effective traditional remedies for such stings? Table 2.3 Some naturally occurring acids Natural source Acid Natural source Acid Vinegar Acetic acid Sour milk (Curd) Lactic acid Orange Citric acid Lemon Citric acid Tamarind Tartaric acid Ant sting Methanoic acid Tomato Oxalic acid Nettle sting Methanoic acid QUESTIONS',
        'exercise',
        361,
        11
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '1. You have two solutions, A and B. The pH of solution A is 6 and pH of',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'solution B is 8. Which solution has more hydrogen ion concentration? Which of this is acidic and which one is basic?',
        'text',
        29,
        11
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '2. What effect does the concentration of H +(aq) ions have on the nature of the',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'solution?',
        'text',
        2,
        11
    );

END $$;

-- Book 11/29: 6CHAPTER...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '5. What is the role of the brain in reflex action?',
        ARRAY[]::text[],
        5,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '6.2 COORDINA6.2 COORDINA6.2 COORDINA6.2 COORDINA6.2 COORDINA TION IN PLTION IN PLTION IN PLTION IN PLTION IN PL ANTSANTSANTS ANTSANTS Animals have a nervous system for controlling and coordinating the activities of the body. But plants have neither a nervous system nor muscles. So, how do they respond to stimuli? When we touch the leaves of a chhui-mui  (the ‘sensitive’ or ‘touch-me-not’ plant of the Mimosa family), they begin to fold up and droop. When a seed germinates, the root goes down, the stem comes up into the air. What happens? Firstly, the leaves of the sensitive plant move very quickly in response to touch. 2024-25  --- Page 7 --- Science106 There is no growth involved in this movement. On the other hand, the directional movement of a seedling is caused by growth. If it is prevented from growing, it will not show any movement. So plants show two different types of movement – one dependent on growth and the other independent of growth. 6.2.1 Immediate Response to Stimulus Let us think about the first kind of movement, such as that of the sensitive plant. Since no growth is involved, the plant must actually move its leaves in response to touch. But there is no nervous tissue, nor any muscle tissue. How does the plant detect the touch, and how do the leaves move in response? Figure 6.4Figure 6.4Figure 6.4Figure 6.4Figure 6.4  The sensitive plant If we think about where exactly the plant is touched, and what part of the plant actually moves, it is apparent that movement happens at a point different from the point of touch. So, information that a touch has occurred must be communicated. The plants also use electrical-chemical means to convey this information from cell to cell, but unlike in animals, there is no specialised tissue in plants for the conduction of information. Finally, again as in animals, some cells must change shape in order for movement to happen. Instead of the specialised proteins found in animal muscle cells, plant cells change shape by cha',
        'example',
        687,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 8 --- Control and Coordination 107 Environmental triggers such as light, or gravity will change the directions that plant parts grow in. These directional, or tropic, movements can be either towards the stimulus, or away from it. So, in two different kinds of phototropic movement, shoots respond by bending towards light while roots respond by bending away from it. How does this help the plant? Plants show tropism in response to other stimuli as well. The roots of a plant always grow downwards while the shoots usually grow upwards and away from the earth. This upward and downward growth of shoots and roots, respectively, in response to the pull of earth or gravity is, obviously, geotropism (Fig. 6.6). If ‘hydro’ means water and ‘chemo’ refers to chemicals, what would ‘hydrotropism’ and ‘chemotropism’ mean? Can we think of examples of these kinds of directional growth movements? One example of chemotropism is the growth of pollen tubes towards ovules, about which we will learn more when we examine the reproductive processes of living organisms. Let us now once again think about how information is communicated in the bodies of multicellular organisms. The movement of the sensitive plant in response to touch is very quick. The movement of sunflowers in response to day or night, on the other hand, is quite slow. Growth-related movement of plants will be even slower. Even in animal bodies, there are carefully controlled directions to growth. Our arms and fingers grow in certain directions, not haphazardly. So controlled movements can be either slow or fast. If fast responses to stimuli are to be made, information transfer must happen very quickly. For this, the medium of transmission must be able to move rapidly. Activity 6.2Activity 6.2Activity 6.2Activity 6.2Activity 6.2 /square6Fill a conical flask with water . /square6Cover the neck of the flask with a wire mesh. /square6Keep two or three freshly germinated bean seeds on the wire mesh. /square6Take a cardboar',
        'example',
        697,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 9 --- Science108 Electrical impulses are an excellent means for this. But there are limitations to the use of electrical impulses. Firstly, they will reach only those cells that are connected by nervous tissue, not each and every cell in the animal body. Secondly, once an electrical impulse is generated in a cell and transmitted, the cell will take some time to reset its mechanisms before it can generate and transmit a new impulse. In other words, cells cannot continually create and transmit electrical impulses. It is thus no wonder that most multicellular organisms use another means of communication between cells, namely, chemical communication. If, instead of generating an electrical impulse, stimulated cells release a chemical compound, this compound would diffuse all around the original cell. If other cells around have the means to detect this compound using special molecules on their surfaces, then they would be able to recognise information, and even transmit it. This will be slower, of course, but it can potentially reach all cells of the body, regardless of nervous connections, and it can be done steadily and persistently. These compounds, or hormones used by multicellular organisms for control and coordination show a great deal of diversity, as we would expect. Different plant hormones help to coordinate growth, development and responses to the environment. They are synthesised at places away from where they act and simply diffuse to the area of action. Let us take an example that we have worked with earlier [Activity 6.2]. When growing plants detect light, a hormone called auxin, synthesised at the shoot tip, helps the cells to grow longer. When light is coming from one side of the plant, auxin diffuses towards the shady side of the shoot. This concentration of auxin stimulates the cells to grow longer on the side of the shoot which is away from light. Thus, the plant appears to bend towards light. Another example of plant hormones are gibberellin',
        'example',
        612,
        8
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '2. How is the movement of leaves of the sensitive plant different from the',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'movement of a shoot towards light?',
        'text',
        8,
        8
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '5. Design an experiment to demonstrate hydrotropism.',
        ARRAY[]::text[],
        8,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2024-25',
        'text',
        1,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 10 --- Control and Coordination 109 6.3 HORMONES IN ANIMALS6.3 HORMONES IN ANIMALS6.3 HORMONES IN ANIMALS6.3 HORMONES IN ANIMALS6.3 HORMONES IN ANIMALS How are such chemical, or hormonal, means of information transmission used in animals? What do some animals, for instance squirrels, experience when they are in a scary situation? Their bodies have to prepare for either fighting or running away. Both are very complicated activities that will use a great deal of energy in controlled ways. Many different tissue types will be used and their activities integrated together in these actions. However, the two alternate activities, fighting or running, are also quite different! So here is a situation in which some common preparations can be usefully made in the body. These preparations should ideally make it easier to do either activity in the near future. How would this be achieved? If the body design in the squirrel relied only on electrical impulses via nerve cells, the range of tissues instructed to prepare for the coming activity would be limited. On the other hand, if a chemical signal were to be sent as well, it would reach all cells of the body and provide the wide- ranging changes needed. This is done in many animals, including human beings, using a hormone called adrenaline that is secreted from the adrenal glands. Look at Fig. 6.7 to locate these glands. Adrenaline is secreted directly into the blood and carried to different parts of the body. The target organs or the specific tissues on which it acts include the heart. As a result, the heart beats faster, resulting in supply of more oxygen to our muscles. The blood to the digestive system and skin is reduced due to contraction of muscles around small arteries in these organs. This diverts the blood to our skeletal muscles. The breathing rate also increases because of the contractions of the diaphragm and the rib muscles. All these responses together enable the animal body to be ready to deal with the sit',
        'example',
        773,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 11 --- Science110 Let us examine some examples to understand how hormones help in coordinated growth. We have all seen salt packets which say ‘iodised salt’ or ‘enriched with iodine’. Why is it important for us to have iodised salt in our diet? Iodine is necessary for the thyroid gland to make thyroxin hormone. Thyroxin regulates carbohydrate, protein and fat metabolism in the body so as to provide the best balance for growth. Iodine is essential for the synthesis of thyroxin. In case iodine is deficient in our diet, there is a possibility that we might suffer from goitre. One of the symptoms in this disease is a swollen neck. Can you correlate this with the position of the thyroid gland in Fig. 6.7? Sometimes we come across people who are either very short (dwarfs) or extremely tall (giants). Have you ever wondered how this happens? Growth hormone is one of the hormones secreted by the pituitary. As its name indicates, growth hormone regulates growth and development of the body. If there is a deficiency of this hormone in childhood, it leads to dwarfism. You must have noticed many dramatic changes in your appearance as well as that of your friends as you approached 10–12 years of age. These changes associated with puberty are because of the secretion of testosterone in males and oestrogen in females. Do you know anyone in your family or friends who has been advised by the doctor to take less sugar in their diet because they are suffering from diabetes? As a treatment, they might be taking injections of insulin. This is a hormone which is produced by the pancreas and helps in regulating blood sugar levels. If it is not secreted in proper amounts, the sugar level in the blood rises causing many harmful effects. Figure 6.7 Endocrine glands in human beings (a) male, (b) female (a) (b) Do You Know? Hypothalamus plays an important role in the release of many hormones. For example, when the level of growth hormone is low, the hypothalamus releases growth hormone ',
        'example',
        708,
        11
    );

    -- Chapter 14
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        14,
        '4. Why are some patients of diabetes treated by giving injections of insulin?',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'What you have learnt ? /square6Control and coordination are the functions of the nervous system and hormones in our bodies. /square6The responses of the nervous system can be classified as reflex action, voluntary action or involuntary action. /square6The nervous system uses electrical impulses to transmit messages. /square6The nervous system gets information from our sense organs and acts through our muscles. /square6Chemical coordination is seen in both plants and animals. /square6Hormones produced in one part of an organism move to another part to achieve the desired effect. /square6A feedback mechanism regulates the action of the hormones. S.No. Hormone Endocrine Gland Functions',
        'text',
        172,
        11
    );

    -- Chapter 19
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        19,
        '5. Ovaries Development of female sex organs,',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'regulates menstrual cycle, etc.',
        'text',
        7,
        11
    );

    -- Chapter 21
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        21,
        '7. Releasing Stimulates pituitary gland to release',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'hormones hormones 2024-25  --- Page 13 --- Science112 EXERCISES',
        'exercise',
        15,
        11
    );

    -- Chapter 22
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        22,
        '1. Which of the following is a plant hormone?',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) Insulin (b) Thyroxin (c) Oestrogen (d) Cytokinin.',
        'text',
        13,
        11
    );

    -- Chapter 23
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        23,
        '2. The gap between two neurons is called a',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) dendrite. (b) synapse. (c) axon. (d) impulse.',
        'text',
        12,
        12
    );

    -- Chapter 24
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        24,
        '3. The brain is responsible for',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) thinking. (b) regulating the heart beat. (c) balancing the body. (d) all of the above.',
        'text',
        22,
        12
    );

    -- Chapter 25
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        25,
        '4. What is the function of receptors in our body? Think of situations where receptors',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'do not work properly. What problems are likely to arise?',
        'exercise',
        14,
        12
    );

END $$;

-- Book 12/29: Light – Reflection and...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. The radius of curvature of a spherical mirror is 20 cm.  What is its focal',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'length?',
        'text',
        1,
        8
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. Why do we pr efer a convex mirr or as a r ear-view mirr or in vehicles?',
        ARRAY[]::text[],
        8,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '9.2.3 Sign Convention for Reflection by Spherical Mirrors While dealing with the reflection of light by spherical mirrors, we shall follow a set of sign conventions called the New Cartesian Sign Convention. In this convention, the pole (P) of the mirror is taken as the origin (Fig. 9.9).  The principal axis of the mirror is taken as the x-axis (X’X) of the coordinate system. The conventions are as follows – (i) The object is always placed to the left of the mirror. This implies that the light from the object falls on the mirror from the left-hand side. (ii) All distances parallel to the principal axis are measured from the pole of the mirror. (iii) All the distances measured to the right of the origin (along + x-axis) are taken as positive while those measured to the left of the origin (along – x-axis) are taken as negative. (iv) Distances measured perpendicular to and above the principal axis (along + y-axis) are taken as positive. (v) Distances measured perpendicular to and below the principal axis (along –y-axis) are taken as negative. 2024-25',
        'text',
        265,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 10 --- Light – Reflection and Refraction 143 The New Cartesian Sign Convention described above is illustrated in Fig.9.9 for your reference. These sign conventions are applied to obtain the mirror formula and solve related numerical problems. 9.2.4  Mirror Formula and  Magnification In a spherical mirror , the distance of the object from its pole is called the object distance (u).  The distance of the image from the pole of the mirror is called the image distance ( v). You alr eady know that the distance of the principal focus from the pole is called the focal length ( f). There is a relationship between these three quantities given by the mirr or for mula which is expressed as 1 1 1 v u f+ = (9.1) This formula is valid in all situations for all spherical mirrors for all positions of the object. You must use the New Cartesian Sign Convention while substituting numerical values for u, v, f, and R in the mirror formula for solving problems. Magnification Magnification produced by a spherical mirror gives the relative extent to which the image of an object is magnified with respect to the object size. It is expressed as the ratio of the height of the image to the height of the object. It is usually represented by the letter m. If h is the height of the object and h′ is the height of the image, then the magnification m produced by a spherical mirror is given by m =  Height of the image ( ) Height of the object ( ) ′h h m = ′h h (9.2) The magnification m is also related to the object distance ( u) and image distance (v).  It can be expressed as: Magnification (m)  = ′ = −h h v u (9.3) You may note that the height of the object is taken to be positive as the object is usually placed above the principal axis.  The height of the image should be taken as positive for virtual images.  However, it is to be taken as negative for real images. A negative sign in the value of the magnification indicates that the image is real. A positive sign in the value of the magnifica',
        'exercise',
        539,
        8
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 11 --- Science144 Example 9.1 A convex mirror used for rear-view on an automobile has a radius of curvature of 3.00 m. If a bus is located at 5.00 m from this mirror, find the position, nature and size of the image. Solution Radius of curvature,R = + 3.00 m; Object-distance, u = – 5.00 m; Image-distance, v = ? Height of the image, h′ = ? Focal length, f = R/2 = + 3.00 m 2 = + 1.50 m (as the principal focus of        a convex mirror is behind the mirror) Since  1 1 1+ =v u f or,  1 1 1 v f u= −  = +  1 1.50   –  1 ( 5.00)−   =  1 1.50 +  1 5.00    = 5.00 1.50 7.50 + v =  7.50 6.50 +  = + 1.15 m The image is 1.15 m at the back of the mirror. Magnification, m = ''h v h u= − =  –  1.15 m 5.00 m−  = + 0.23 The image is virtual, erect and smaller in size by a factor of 0.23. Example 9.2 An object, 4.0 cm in size, is placed at 25.0 cm in front of a concave mirror of focal length 15.0 cm. At what distance from the mirror should a screen be placed in order to obtain a sharp image? Find the nature and the size of the image. Solution Object-size, h =  + 4.0 cm; Object-distance, u = – 25.0 cm; Focal length, f = –15.0 cm; Image-distance,   v = ? Image-size, h ′ = ? From Eq. (10.1): 1 1 1 v u f+ = or,  1 1 1 v f u= − = 1 1 1 1 15.0 25.0 15.0 25.0− = − +− − 2024-25  --- Page 12 --- Light – Reflection and Refraction 145 or,  1 5.0 3.0 2.0 75.0 75.0v − + −= =   or, v = – 37.5 cm The screen should be placed at 37.5 cm in front of the mirror. The image is real. Also, magnification, m = ''h v h u= − or, h′ = – v h u  =  ( 37.5cm) ( 4.0cm) ( 25.0 cm) − +− − Height of the image, h′ = – 6.0 cm The image is inverted and enlarged. QUESTIONS ?',
        'example',
        413,
        11
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. Find the focal length of a convex mirror whose radius of curvature is',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '32 cm.',
        'text',
        1,
        11
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. A concave mirror produces three times magnified (enlarged) real image',
        ARRAY[]::text[],
        11,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'of an object placed at 10 cm in front of it. Where is the image located? 9.3 REFRACTION OF LIGHT9.3 REFRACTION OF LIGHT9.3 REFRACTION OF LIGHT9.3 REFRACTION OF LIGHT9.3 REFRACTION OF LIGHT Light seems to travel along straight-line paths in a transparent medium. What happens when light enters from one transparent medium to another? Does it still move along a straight-line path or change its direction? We shall recall some of our day-to-day experiences. You might have observed that the bottom of a tank or a pond containing water appears to be raised. Similarly, when a thick glass slab is placed over some printed matter, the letters appear raised when viewed through the glass slab. Why does it happen? Have you seen a pencil partly immersed in water in a glass tumbler? It appears to be displaced at the interface of air and water. You might have observed that a lemon kept in water in a glass tumbler appears to be bigger than its actual size, when viewed from the sides. How can you account for such experiences? Let us consider the case of the apparent displacement of a pencil, partly immersed in water. The light reaching you from the portion of the pencil inside water seems to come from a different direction, compared to the part above water. This makes the pencil appear to be displaced at the interface. For similar reasons, the letters appear to be raised, when seen through a glass slab placed over it. Does a pencil appear to be displaced to the same extent, if instead of water, we use liquids like kerosene or turpentine? Will the letters appear to rise to the same height if we replace a glass slab with a transparent plastic slab? You will find that the extent of the ef fect is different for different pair of media. These observations indicate that light does not 2024-25',
        'text',
        449,
        11
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 13 --- Science146 travel in the same direction in all media. It appears that when travelling obliquely from one medium to another, the direction of propagation of light in the second medium changes. This phenomenon is known as refraction of light. Let us understand this phenomenon further by doing a few activities. Activity 9.7Activity 9.7Activity 9.7Activity 9.7Activity 9.7 /square6Place a coin at the bottom of a bucket filled with water . /square6With your eye to a side above water , try to pick up the coin in one go. Did you succeed in picking up the coin? /square6Repeat the Activity. Why did you not succeed in doing it in one go? /square6Ask your friends to do this.  Compare your experience with theirs. Activity 9.8Activity 9.8Activity 9.8Activity 9.8Activity 9.8 /square6Place a large shallow bowl on a Table and put a coin in it. /square6Move away slowly from the bowl.  Stop when the coin just disappears from your sight. /square6Ask a friend to pour water gently into the bowl without disturbing the coin. /square6Keep looking for the coin from your position. Does the coin becomes visible again from your position?  How could this happen? The coin becomes visible again on pouring water into the bowl. The coin appears slightly raised above its actual position due to refraction of light. Activity 9.9Activity 9.9Activity 9.9Activity 9.9Activity 9.9 /square6Draw a thick straight line in ink, over a sheet of white paper placed on a Table. /square6Place a glass slab over the line in such a way that one of its edges makes an angle with the line. /square6Look at the portion of the line under the slab from the sides. What do you observe? Does the line under the glass slab appear to be bent at the edges? /square6Next, place the glass slab such that it is normal to the line. What do you observe now? Does the part of the line under the glass slab appear bent? /square6Look at the line from the top of the glass slab. Does the part of the line, beneath the slab, appear t',
        'text',
        547,
        11
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 14 --- Light – Reflection and Refraction 147 In this Activity, you will note, the light ray has changed its direction at points O and O′. Note that both the points O and O′ lie on surfaces separating two transparent media. Draw a perpendicular NN’ to AB at O and another perpendicular MM′ to CD at O′. The light ray at point O has entered from a rarer medium to a denser medium, that is, from air to glass. Note that the light ray has bent towards the normal. At O ′, the light ray has entered from glass to air , that is, fr om a denser medium to a rarer medium.  The light here has bent away from the normal. Compare the angle of incidence with the angle of refraction at both refracting surfaces AB and CD. In Fig. 9.10, a ray EO is obliquely incident on surface AB, called incident ray. OO ′ is the refracted ray and O′ H is the emergent ray. Y ou may observe that the emergent ray is parallel to the direction of the incident ray. Why does it happen so? The extent of bending of the ray of light at the opposite parallel faces AB (air-glass interface) and CD (glass-air interface) of the rectangular glass slab is equal and opposite. This is why the ray emerges parallel to the incident ray. However, the light ray is shifted sidewar d slightly. What happens when a light ray is incident normally to the interface of two media? Try and find out. Now you are familiar with the refraction of light. Refraction is due to change in the speed of light as it enters from one transparent medium to another.  Experiments show that refraction of light occurs according to certain laws. Activity 9.10Activity 9.10Activity 9.10Activity 9.10Activity 9.10 /square6Fix a sheet of white paper on a drawing board using drawing pins. /square6Place a rectangular glass slab over the sheet in the middle. /square6Draw the outline of the slab with a pencil. Let us name the outline as ABCD. /square6Take four identical pins. /square6Fix two pins, say E and F , vertically such that the line joining the pin',
        'text',
        668,
        11
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '1. A ray of light travelling in air enters obliquely into water . Does the light',
        ARRAY[]::text[],
        17,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'ray bend towards the normal or away from the normal? Why?',
        'text',
        14,
        17
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '2. Light enters from air to glass having refractive index 1.50. What is the',
        ARRAY[]::text[],
        17,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'speed of light in the glass? The speed of light in vacuum is 3 × 10 8 m s–1.',
        'text',
        19,
        17
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '3. Find out, from Table 9.3, the medium having highest optical density.',
        ARRAY[]::text[],
        17,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Also find the medium with lowest optical density.',
        'text',
        12,
        17
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '4. You ar e given ker osene, turpentine and water . In which of these does',
        ARRAY[]::text[],
        17,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the light travel fastest? Use the information given in Table 9.3.',
        'text',
        16,
        17
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '5. The refractive index of diamond is 2.42. What is the meaning of this',
        ARRAY[]::text[],
        17,
        24
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'statement? (a) Figure 9.12Figure 9.12Figure 9.12Figure 9.12Figure 9.12 (a) Converging action of a convex lens, (b) diverging action of a concave lens (b) 2024-25',
        'text',
        40,
        17
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 18 --- Light – Reflection and Refraction 151 usually represented by the letter O. A ray of light through the optical centre of a lens passes without suffering any deviation. The effective diameter of the circular outline of a spherical lens is called its aperture. We shall confine our discussion in this Chapter to such lenses whose aperture is much less than its radius of curvature and the two centres of curvatures are equidistant from the optical centre O. Such lenses are called thin lenses with small apertures. What happens when parallel rays of light are incident on a lens?  Let us do an Activity to understand this. Activity 9.11Activity 9.11Activity 9.11Activity 9.11Activity 9.11 CAUTION: Do not look at the Sun directly or through a lens while doing this Activity or otherwise. Y ou may damage your eyes if you do so. /square6Hold a convex lens in your hand. Direct it towards the Sun. /square6Focus the light fr om the Sun on a sheet of paper . Obtain a sharp bright image of the Sun. /square6Hold the paper and the lens in the same position for a while.  Keep observing the paper. What happened? Why? Recall your experience in Activity 9.2. The paper begins to burn producing smoke. It may even catch fire after a while.  Why does this happen? The light from the Sun constitutes parallel rays of light.  These rays were converged by the lens at the sharp bright spot formed on the paper.  In fact, the bright spot you got on the paper is a real image of the Sun. The concentration of the sunlight at a point generated heat.  This caused the paper to burn. Now, we shall consider rays of light parallel to the principal axis of a lens.  What happens when you pass such rays of light through a lens? This is illustrated for a convex lens in Fig.9.12 (a) and for a concave lens in Fig.9.12 (b). Observe Fig.9.12 (a) carefully. Several rays of light parallel to the principal axis are falling on a convex lens. These rays, after refraction from the lens, are converging to a poin',
        'text',
        772,
        17
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 19 --- Science152 9.3.4 Image Formation by Lenses Lenses form images by refracting light. How do lenses form images? What is their nature? Let us study this for a convex lens first. Activity 9.12Activity 9.12Activity 9.12Activity 9.12Activity 9.12 /square6Take a convex lens.  Find its approximate focal length in a way described in Activity 9.11. /square6Draw five parallel straight lines, using chalk, on a long Table such that the distance between the successive lines is equal to the focal length of the lens. /square6Place the lens on a lens stand.  Place it on the central line such that the optical centre of the lens lies just over the line. /square6The two lines on either side of the lens correspond to F and 2F of the lens respectively.  Mark them with appropriate letters such as 2F1, F1, F2 and 2F2, respectively. /square6Place a burning candle, far beyond 2F 1 to the left. Obtain a clear sharp image on a screen on the opposite side of the lens. /square6Note down the nature, position and relative size of the image. /square6Repeat this Activity by placing object just behind 2F 1, between F 1 and 2F 1 at F 1, between F 1 and O. Note down and tabulate your observations. The nature, position and relative size of the image formed by convex lens for various positions of the object is summarised in Table 9.4. Let us now do an Activity to study the nature, position and relative size of the image formed by a concave lens. Table 9.4 Nature, position and relative size of the image formed by a convex lens for various positions of the object Position of the Position of Relative size of Nature of object the image  the image the image At infinity At focus F2 Highly diminished, Real and inverted point-sized Beyond 2F1 Between F2  and 2F 2 Diminished Real and inverted At 2F1 At 2F2 Same size Real and inverted Between F1 and 2F1 Beyond 2F2 Enlarged Real and inverted At focus F1 At infinity Infinitely large or Real and inverted highly enlarged Between focus F 1 On the same s',
        'text',
        521,
        17
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '2. A convex lens forms a real and inverted image of a needle at a distance',
        ARRAY[]::text[],
        24,
        24
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'of 50 cm from it.  Where is the needle placed in front of the convex lens if the image is equal to the size of the object? Also, find the power of the lens.',
        'text',
        39,
        24
    );

END $$;

-- Book 13/29: How do Organisms...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Why is variation beneficial to the species but not necessarily',
        ARRAY[]::text[],
        2,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'for the individual? 2024-25  --- Page 3 --- How do Organisms Reproduce? 115 Figure 7.1(a)Figure 7.1(a)Figure 7.1(a)Figure 7.1(a)Figure 7.1(a)  Binary fission in Amoeba Activity 7.2Activity 7.2Activity 7.2Activity 7.2Activity 7.2 7.2 MODES OF REPRODUCTION USED BY SINGLE7.2 MODES OF REPRODUCTION USED BY SINGLE7.2 MODES OF REPRODUCTION USED BY SINGLE7.2 MODES OF REPRODUCTION USED BY SINGLE7.2 MODES OF REPRODUCTION USED BY SINGLE ORGANISMSORGANISMSORGANISMSORGANISMSORGANISMS Activity 7.1Activity 7.1Activity 7.1Activity 7.1Activity 7.1 /square6Dissolve about 10 gm of sugar in 100 mL of water . /square6Take 20 mL of this solution in a test tube and add a pinch of yeast granules to it. /square6Put a cotton plug on the mouth of the test tube and keep it in a warm place. /square6After 1 or 2 hours, put a small drop of yeast culture from the test tube on a slide and cover it with a coverslip. /square6Observe the slide under a microscope. /square6Wet a slice of br ead, and keep it in a cool, moist and dark place. /square6Observe the surface of the slice with a magnifying glass. /square6Record your observations for a week. Compare and contrast the ways in which yeast grows in the first case, and how mould grows in the second. Having discussed the context in which reproductive processes work, let us now examine how different organisms actually reproduce. The modes by which various organisms reproduce depend on the body design of the organisms. 7.2.1 Fission For unicellular organisms, cell division, or fission, leads to the creation of new individuals. Many different patterns of fission have been observed. Many bacteria and protozoa simply split into two equal halves during cell division. In organisms such as Amoeba, the splitting of the two cells during division can take place in any plane. Activity 7.3Activity 7.3Activity 7.3Activity 7.3Activity 7.3 /square6Observe a permanent slide of Amoeba under a microscope. /square6Similarly observe another permanent slide of Amoeba showin',
        'exercise',
        636,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- Science116 these structures. Other single-celled organisms, such as the malarial parasite, Plasmodium , divide into many daughter cells simultaneously by multiple fission. Yeast, on the other hand, can put out small buds that separate and grow further, as we saw in Activity 7.1. 7.2.2 Fragmentation Figure 7.2Figure 7.2Figure 7.2Figure 7.2Figure 7.2 Multiple fission in Plasmodium Activity 7.4Activity 7.4Activity 7.4Activity 7.4Activity 7.4 /square6Collect water from a lake or pond that appears dark green and contains filamentous structures. /square6Put one or two filaments on a slide. /square6Put a drop of glycerine on these filaments and cover it with a coverslip. /square6Observe the slide under a microscope. /square6Can you identify different tissues in the Spirogyra filaments? In multi-cellular organisms with relatively simple body organisation, simple reproductive methods can still work. Spirogyra, for example, simply breaks up into smaller pieces upon maturation. These pieces or fragments grow into new individuals. Can we work out the reason for this, based on what we saw in Activity 7.4? This is not true for all multi-cellular organisms. They cannot simply divide cell-by-cell. The reason is that many multi-cellular organisms, as we have seen, are not simply a random collection of cells. Specialised cells are organised as tissues, and tissues are organised into organs, which then have to be placed at definite positions in the body. In such a carefully organised situation, cell-by-cell division would be impractical. Multi-cellular organisms, therefore, need to use more complex ways of reproduction. A basic strategy used in multi-cellular organisms is that different cell types perform different specialised functions. Following this general pattern, reproduction in such organisms is also the function of a specific cell type. How is reproduction to be achieved from a single cell type, if the organism itself consists of many cell types? The answer is t',
        'example',
        706,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 5 --- How do Organisms Reproduce? 117 Figure 7.3 Figure 7.3 Figure 7.3 Figure 7.3 Figure 7.3 Regeneration in Planaria take place in an organised sequence referred to as development. However , regeneration is not the same as reproduction, since most organisms would not normally depend on being cut up to be able to reproduce. 7.2.4 Budding Organisms such as Hydra use regenerative cells for reproduction in the process of budding. In Hydra, a bud develops as an outgrowth due to repeated cell division at one specific site (Fig. 7.4). These buds develop into tiny individuals and when fully mature, detach from the parent body and become new independent individuals. Figure 7.4Figure 7.4Figure 7.4Figure 7.4Figure 7.4  Budding in Hydra 7.2.5 Vegetative Propagation There are many plants in which parts like the root, stem and leaves develop into new plants under appropriate conditions. Unlike in most animals, plants can indeed use such a mode for reproduction. This property of vegetative propagation is used in methods such as layering or grafting to grow many plants like sugarcane, roses, or grapes for agricultural purposes. Plants raised by vegetative propagation can bear flowers and fruits earlier than those produced from seeds. Such methods also make possible the propagation of plants such as banana, orange, rose and jasmine that have lost the capacity to produce seeds. Another advantage of vegetative propagation is that all plants produced are genetically similar enough to the parent plant to have all its characteristics. 2024-25',
        'text',
        389,
        2
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '3. Can you think of reasons why more complex organisms cannot give',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'rise to new individuals through regeneration?',
        'text',
        11,
        6
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '4. Why is vegetative propagation practised for growing some types of',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'plants?',
        'text',
        1,
        6
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '5. Why is DNA copying an essential part of the process of reproduction?',
        ARRAY[]::text[],
        6,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '7.3 SEXUAL REPRODUCTION7.3 SEXUAL REPRODUCTION7.3 SEXUAL REPRODUCTION7.3 SEXUAL REPRODUCTION7.3 SEXUAL REPRODUCTION We are also familiar with modes of r eproduction that depend on the involvement of two individuals before a new generation can be created. Bulls alone cannot produce new calves, nor can hens alone produce new chicks. In such cases, both sexes, males and females, are needed to produce new generations. What is the significance of this sexual mode of reproduction? Are there any limitations of the asexual mode of reproduction, which we have been discussing above? 7.3.1 Why the Sexual Mode of Reproduction? The creation of two new cells from one involves copying of the DNA as well as of the cellular apparatus. The DNA copying mechanism, as we have noted, cannot be absolutely accurate, and the resultant errors are a source of variations in populations of organisms. Every individual organism cannot be protected by variations, but in a population, variations are useful for ensuring the survival of the species. It would therefore make sense if organisms came up with reproductive modes that allowed more and more variation to be generated. While DNA-copying mechanisms are not absolutely accurate, they are precise enough to make the generation of variation a fairly slow process. If the DNA copying mechanisms were to be less accurate, many of the resultant DNA copies would not be able to work with the cellular apparatus, and would die. So how can the process of making variants be speeded up? Each new variation is made in a DNA copy that already has variations accumulated from previous generations. Thus, two different individuals in a population would have quite different patterns of accumulated variations. Since all of these variations are in living individuals, it is assured that they do not have any really bad effects. Combining variations from two or more individuals would thus create new combinations of variants. Each combination would be novel, since it would i',
        'text',
        515,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 8 --- Science120 reproduction incorporates such a process of combining DNA from two different individuals during reproduction. But this creates a major difficulty. If each new generation is to be the combination of the DNA copies from two pre-existing individuals, then each new generation will end up having twice the amount of DNA that the previous generation had. This is likely to mess up the control of the cellular apparatus by the DNA. How many ways can we think of for solving this difficulty? We have seen earlier that as organisms become mor e complex, the specialisation of tissue increases. One solution that many multi-cellular organisms have found for the problem mentioned above is to have special lineages of cells in specialised organs in which only half the number of chromosomes and half the amount of DNA as compared to the non- reproductive body cells. This is achieved by a process of cell division called meiosis. Thus, when these germ-cells from two individuals combine during sexual reproduction to form a new individual, it results in re- establishment of the number of chromosomes and the DNA content in the new generation. If the zygote is to grow and develop into an organism which has highly specialised tissues and organs, then it has to have sufficient stores of energy for doing this. In very simple organisms, it is seen that the two germ-cells are not very different from one another, or may even be similar. But as the body designs become more complex, the germ-cells also specialise. One germ-cell is large and contains the food-stores while the other is smaller and likely to be motile. Conventionally, the motile germ- cell is called the male gamete and the germ-cell containing the stored food is called the female gamete. We shall see in the next few sections how the need to create these two different types of gametes give rise to differences in the male and female reproductive organs and, in some cases, differences in the bodies of the male and ',
        'exercise',
        735,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 9 --- How do Organisms Reproduce? 121 Figure 7.8Figure 7.8Figure 7.8Figure 7.8Figure 7.8 Germination of pollen on stigma The swollen bottom part is the ovary, middle elongated part is the style and the terminal part which may be sticky is the stigma. The ovary contains ovules and each ovule has an egg cell. The male germ-cell produced by pollen grain fuses with the female gamete present in the ovule. This fusion of the germ-cells or fertilisation gives us the zygote which is capable of growing into a new plant. Thus the pollen needs to be transferred from the stamen to the stigma. If this transfer of pollen occurs in the same flower , it is referred to as self-pollination. On the other hand, if the pollen is transferred fr om one flower to another , it is known as cr oss- pollination. This transfer of pollen from one flower to another is achieved by agents like wind, water or animals. After the pollen lands on a suitable stigma, it has to reach the female germ-cells which are in the ovary. For this, a tube grows out of the pollen grain and travels through the style to reach the ovary. After fertilisation, the zygote divides several times to form an embryo within the ovule. The ovule develops a tough coat and is gradually converted into a seed. The ovary grows rapidly and ripens to form a fruit. Meanwhile, the petals, sepals, stamens, style and stigma may shrivel and fall off. Have you ever observed any flower part still persisting in the fruit? Try and work out the advantages of seed-formation for the plant. The seed contains the future plant or embryo which develops into a seedling under appropriate conditions. This process is known as germination. Activity 7.7Activity 7.7Activity 7.7Activity 7.7Activity 7.7 /square6Soak a few seeds of Bengal gram ( chana) and keep them overnight. /square6Drain the excess water and cover the seeds with a wet cloth and leave them for a day. Make sure that the seeds do not become dry. /square6Cut open the seeds carefully and',
        'text',
        706,
        6
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '5. If a woman is using a copper -T, will it help in pr otecting her fr om',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'sexually transmitted diseases? 2024-25  --- Page 15 --- How do Organisms Reproduce? 127 EXERCISES',
        'exercise',
        24,
        14
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '1. Asexual reproduction takes place through budding in',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) Amoeba. (b) Yeast. (c) Plasmodium. (d) Leishmania.',
        'text',
        13,
        14
    );

    -- Chapter 14
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        14,
        '2. Which of the following is not a part of the female reproductive system in human',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'beings? (a) Ovary (b) Uterus (c) Vas deferens (d) Fallopian tube',
        'text',
        16,
        14
    );

    -- Chapter 15
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        15,
        '3. The anther contains',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) sepals. (b) ovules. (c) pistil. (d) pollen grains.',
        'text',
        13,
        14
    );

    -- Chapter 21
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        21,
        '9. How are the modes for reproduction different in unicellular and',
        ARRAY[]::text[],
        15,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'multicellular organisms?',
        'text',
        6,
        15
    );

    -- Chapter 23
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        23,
        '11. What could be the reasons for adopting contraceptive methods?',
        ARRAY[]::text[],
        15,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2024-25',
        'text',
        1,
        15
    );

END $$;

-- Book 14/29: 11CHAPTER...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Calculate the number of electrons constituting one coulomb of charge.',
        ARRAY[]::text[],
        2,
        3
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2024-25  --- Page 3 --- Electricity 173 11.2 ELECTRIC POTENTIAL AND POTENTIAL DIFFERENCE11.2 ELECTRIC POTENTIAL AND POTENTIAL DIFFERENCE11.2 ELECTRIC POTENTIAL AND POTENTIAL DIFFERENCE11.2 ELECTRIC POTENTIAL AND POTENTIAL DIFFERENCE11.2 ELECTRIC POTENTIAL AND POTENTIAL DIFFERENCE What makes the electric charge to flow? Let us consider the analogy of flow of water. Charges do not flow in a copper wire by themselves, just as water in a perfectly horizontal tube does not flow. If one end of the tube is connected to a tank of water kept at a higher level, such that there is a pressure difference between the two ends of the tube, water flows out of the other end of the tube. For flow of charges in a conducting metallic wire, the gravity, of course, has no role to play; the electrons move only if there is a difference of electric pressure – called the potential difference – along the conductor. This difference of potential may be produced by a battery, consisting of one or more electric cells. The chemical action within a cell generates the potential difference across the terminals of the cell, even when no current is drawn from it. When the cell is connected to a conducting circuit element, the potential difference sets the charges in motion in the conductor and produces an electric current. In order to maintain the current in a given electric circuit, the cell has to expend its chemical energy stored in it. We define the electric potential difference between two points in an electric circuit carrying some current as the work done to move a unit charge from one point to the other – Potential differ ence (V) between two points = Work done (W)/Charge (Q) V = W/Q (11.2) The SI unit of electric potential difference is volt (V), named after Alessandro Volta (1745– 1827), an Italian physicist. One volt is the potential difference between two points in a current carrying conductor when 1 joule of work is done to move a charge of 1 coulomb from one point to the other. Therefore,',
        'example',
        640,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- Science174 W = VQ = 12 V × 2 C = 24 J. QUESTIONS ? 11.3 CIRCUIT DIAGRAM11.3 CIRCUIT DIAGRAM11.3 CIRCUIT DIAGRAM11.3 CIRCUIT DIAGRAM11.3 CIRCUIT DIAGRAM We know that an electric circuit, as shown in Fig. 11.1, comprises a cell (or a battery), a plug key, electrical component(s), and connecting wires. It is often convenient to draw a schematic diagram, in which different components of the circuit are represented by the symbols conveniently used. Conventional symbols  used to represent some of the most commonly used electrical components are given in Table 11.1. Table 11.1 Symbols of some commonly used components in circuit diagrams Sl. Components Symbols No. 1 An electric cell 2 A battery or a combination of cells 3 Plug key or switch (open) 4 Plug key or switch (closed) 5 A wire joint 6 Wires crossing without joining',
        'exercise',
        210,
        3
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '1. Name a device that helps to maintain a potential difference across a',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'conductor .',
        'text',
        2,
        4
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '2. What is meant by saying that the potential difference between two points',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'is 1 V?',
        'text',
        1,
        4
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '3. How much energy is given to each coulomb of charge passing through a',
        ARRAY[]::text[],
        4,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '6 V battery? 2024-25  --- Page 5 --- Electricity 175 11.4 OHM’S LA11.4 OHM’S LA11.4 OHM’S LA11.4 OHM’S LA11.4 OHM’S LA W WW WW Is there a relationship between the potential difference across a conductor and the current through it? Let us explore with an Activity. Activity 11.1Activity 11.1Activity 11.1Activity 11.1Activity 11.1 /square6Set up a circuit as shown in Fig. 11.2, consisting of a nichrome wire XY of length, say 0.5 m, an ammeter , a voltmeter and four cells of 1.5 V each. (Nichrome is an alloy of nickel, chromium, manganese, and iron metals.) /square6First use only one cell as the source in the circuit. Note the reading in the ammeter I, for the current and reading of the voltmeter V for the potential difference across the nichrome wire XY in the circuit. Tabulate them in the Table given. /square6Next connect two cells in the circuit and note the respective readings of the ammeter and voltmeter for the values of current through the nichrome wire and potential difference across the nichrome wire. /square6Repeat the above steps using three cells and then four cells in the circuit separately. /square6Calculate the ratio of V to I for each pair of potential difference V and current I. S. Number of cells Current through Potential difference V/I No. used in the the nichrome across the (volt/ampere) circuit wire, I nichrome (ampere) wire, V (volt) 1 1 2 2 3 3 4 4 /square6Plot a graph between V and I, and observe the nature of the graph. 7 Electric bulb  or     8 A resistor of resistance R 9 Variable r esistance or r heostat  or  10 Ammeter 11 Voltmeter Figure 11.2Figure 11.2Figure 11.2Figure 11.2Figure 11.2  Electric circuit for studying Ohm’s law 2024-25',
        'text',
        421,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 6 --- Science176 Figure 11.3Figure 11.3Figure 11.3Figure 11.3Figure 11.3 V–I graph for a nichrome wire. A straight line plot shows that as the current through a wire increases, the potential difference across the wire increases linearly – this is Ohm’s law. Activity 11.2Activity 11.2Activity 11.2Activity 11.2Activity 11.2 /square6Take a nichrome wire, a torch bulb, a 10 W bulb and an ammeter (0 – 5 A range), a plug key and some connecting wires. /square6Set up the circuit by connecting four dry cells of 1.5 V each in series with the ammeter leaving a gap XY in the circuit, as shown in Fig. 11.4. In this Activity, you will find that approximately the same value for V/I is obtained in each case. Thus the V–I graph is a straight line that passes through the origin of the graph, as shown in Fig. 11.3. Thus,  V/I is a constant ratio. In 1827, a German physicist Georg Simon Ohm (1787–1854) found out the relationship between the current I, flowing in a metallic wire and the potential difference across its terminals. The potential difference, V, across the ends of a given metallic wire in an electric circuit is directly proportional to the current flowing through it,  provided its temperature remains the same. This is called Ohm’s law. In other words – V ∝  I (11.4) or V/I = constant = R or V = IR (11.5) In Eq. (11.4), R is a constant for the given metallic wire at a given temperature and is called its resistance. It is the property of a conductor to resist the flow of charges  through it. Its SI unit is ohm, represented by the Greek letter Ω . According to Ohm’s law, R = V/I (11.6) If the potential difference across the two ends of a conductor is 1 V and the current through it is 1 A, then the resistance R, of the conductor is 1 Ω . That is, 1 ohm =  1 volt 1 ampere Also from Eq. (11.5) we get I = V/R (11.7) It is obvious from Eq. (11.7) that the current through a resistor is inversely proportional to its resistance. If the resistance is doubled the current gets h',
        'text',
        605,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 7 --- Electricity 177 In this Activity we observe that the current is different for different components. Why do they differ? Certain components offer an easy path for the flow of electric current while the others resist the flow. We know that motion of electrons in an electric circuit constitutes an electric current. The electrons, however, are not completely free to move within a conductor. They are restrained by the attraction of the atoms among which they move. Thus, motion of electrons through a conductor is retarded by its resistance. A component of a given size that offers a low resistance is a good conductor. A conductor having some appreciable resistance is called a resistor. A component of identical size that offers a higher resistance is a poor conductor. An insulator of the same size offers even higher resistance. 11.5 FA11.5 FA11.5 FA 11.5 FA11.5 FA CTORS ON WHICH THE RESISTCTORS ON WHICH THE RESISTCTORS ON WHICH THE RESISTCTORS ON WHICH THE RESISTCTORS ON WHICH THE RESIST ANCE OF AANCE OF AANCE OF AANCE OF AANCE OF A CONDUCTOR DEPENDSCONDUCTOR DEPENDSCONDUCTOR DEPENDSCONDUCTOR DEPENDSCONDUCTOR DEPENDS Figure 11.4Figure 11.4Figure 11.4Figure 11.4Figure 11.4 /square6Complete the cir cuit by connecting the nichr ome wir e in the gap XY . Plug the key. Note down the ammeter reading. Take out the key from the plug. [Note:  Always take out the key from the plug after measuring the current through the circuit. ] /square6Replace the nichrome wire with the torch bulb in the circuit and find the current through it by measuring the r eading of the ammeter . /square6Now repeat the above step with the 10 W bulb in the gap XY . /square6Are the ammeter readings different for different components connected in the gap XY? What do the above observations indicate? /square6You may r epeat this Activity by keeping any material component in the gap. Observe the ammeter readings in each case. Analyse the observations. Activity 11.3Activity 11.3Activity 11.3Activity ',
        'text',
        546,
        4
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '1. On what factors does the resistance of a',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'conductor depend?',
        'text',
        4,
        9
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '2. Will current flow more easily through a thick',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'wire or a thin wire of the same material, when connected to the same source? Why?',
        'text',
        20,
        9
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '3. Let the resistance of an electrical component',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'remains constant while the potential difference across the two ends of the component decreases to half of its former value. What change will occur in the current through it?',
        'text',
        43,
        9
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '4. Why are coils of electric toasters and electric',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'irons made of an alloy rather than a pure metal?',
        'text',
        12,
        9
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '5. Use the data in Table 11.2 to answer the',
        ARRAY[]::text[],
        9,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'following – (a) Which among iron and mercury is a better conductor? (b) Which material is the best conductor? 11.6 RESIST11.6 RESIST11.6 RESIST11.6 RESIST11.6 RESIST ANCE OF A SYSTEM OF RESISTORSANCE OF A SYSTEM OF RESISTORSANCE OF A SYSTEM OF RESISTORSANCE OF A SYSTEM OF RESISTORSANCE OF A SYSTEM OF RESISTORS In preceding sections, we learnt about some simple electric circuits. We have noticed how the current through a conductor depends upon its resistance and the potential difference across its ends. In various electrical gadgets, we often use resistors in various combinations. We now therefore intend to see how Ohm’s law can be applied to combinations of resistors. There are two methods of joining the resistors together. Figure 11.6 shows an electric circuit in which three resistors having resistances R1, R2 and R3, respectively, are joined end to end. Here the resistors are said to be connected in series. Figure 11.6Figure 11.6Figure 11.6Figure 11.6Figure 11.6  Resistors in series 2024-25  --- Page 12 --- Science182 Figure 11.7Figure 11.7Figure 11.7Figure 11.7Figure 11.7  Resistors in parallel You will observe that the value of the current in the ammeter is the same, independent of its position in the electric circuit. It means that in a series combination of resistors the current is the same in every part of the circuit or the same current through each resistor. Activity 11.4Activity 11.4Activity 11.4Activity 11.4Activity 11.4 /square6Join three resistors of different values in series. Connect them with a battery, an ammeter and a plug key, as shown in Fig. 11.6. You may use the r esistors of values like 1 Ω , 2 Ω , 3 Ω  etc., and a battery of 6 V for performing this Activity. /square6Plug the key. Note the ammeter reading. /square6Change the position of ammeter to anywhere in between the resistors. Note the ammeter reading each time. /square6Do you find any change in the value of current through the ammeter? 11.6.1 Resistors in Series What happens to the value',
        'text',
        594,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 13 --- Electricity 183 Activity 11.5Activity 11.5Activity 11.5Activity 11.5Activity 11.5 /square6In Activity 11.4, insert a voltmeter across the ends X and Y of the series combination of three resistors, as shown in Fig. 11.6. /square6Plug the key in the circuit and note the voltmeter reading. It gives the potential difference across the series combination of resistors. Let it be V. Now measure the potential difference across the two terminals of the battery. Compare the two values. /square6Take out the plug key and disconnect the voltmeter . Now insert the voltmeter acr oss the ends X and P of the first r esistor, as shown in Fig. 11.8. Figure 11.8Figure 11.8Figure 11.8Figure 11.8Figure 11.8 /square6Plug the key and measure the potential difference across the first resistor. Let it be V1. /square6Similarly, measure the potential difference across the other two resistors, separately. Let these values be V2 and V 3, respectively. /square6Deduce a relationship between V, V1, V2 and V3. You will observe that the potential difference V is equal to the sum of potential differences V1, V2, and V3. That is the total potential difference across a combination of resistors in series is equal to the sum of potential difference across the individual resistors. That is, V = V1 + V2  + V3 (11.11) In the electric circuit shown in Fig. 11.8, let I be the current through the circuit. The current through each resistor is also I. It is possible to replace the three resistors joined in series by an equivalent single resistor of resistance  R, such that the potential difference V across it, and the current I through the circuit remains the same. Applying the Ohm’s law to the entire circuit, we have V = I R (11.12) 2024-25',
        'text',
        434,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 14 --- Science184 On applying Ohm’s law to the three resistors separately, we further have V1 = I R1 [11.13(a)] V2 = I R2 [11.13(b)] and V3 = I R3 [11.13(c)] From Eq. (11.11), I R = I R1 + I R2 + I R3 or Rs = R1 +R2 + R3 (11.14) We can conclude that when several resistors are joined in series, the resistance of the combination R s equals the sum of their individual resistances, R1, R2, R3, and is thus greater than any individual resistance. Example 11.7 An electric lamp, whose resistance is 20 Ω , and a conductor of 4 Ω resistance are connected to a 6 V battery (Fig. 11.9). Calculate (a) the total resistance of the circuit, (b) the current through the circuit, and (c) the potential difference across the electric lamp and conductor. Solution The resistance of electric lamp, R1 = 20 Ω , The resistance of the conductor connected in series, R2 = 4 Ω . Then the total resistance in the circuit R = R1 + R2 Rs = 20 Ω  + 4 Ω = 24 Ω . The total potential difference across the two terminals of the battery V = 6 V. Now by Ohm’s law, the current through the circuit is given by I = V/Rs = 6 V/24 Ω = 0.25 A. Figure 11.9Figure 11.9Figure 11.9Figure 11.9Figure 11.9  An electric lamp connected in series with a resistor of 4 Ω  to a 6 V battery 2024-25  --- Page 15 --- Electricity 185 Applying Ohm’s law to the electric lamp and conductor separately, we get potential difference across the electric lamp, V1 = 20 Ω ×  0.25 A = 5 V; and, that across the conductor, V2  =  4 Ω  ×  0.25 A          =  1 V. Suppose that we like to replace the series combination of electric lamp and conductor by a single and equivalent resistor. Its resistance must be such that a potential difference of 6 V across the battery terminals will cause a current of 0.25 A in the circuit. The resistance R of this equivalent resistor would be R = V/I = 6 V/ 0.25 A = 24 Ω . This is the total resistance of the series circuit; it is equal to the sum of the two resistances. QUESTIONS ?',
        'example',
        492,
        12
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '1. Draw a schematic diagram of a circuit consisting of a battery of three',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'cells of 2 V each, a 5 Ω  resistor, an 8 Ω  resistor, and a 12 Ω  resistor, and a plug key, all connected in series.',
        'text',
        29,
        12
    );

END $$;

-- Book 15/29: (g) + 2O2 (g) → CO2 (g) + 2H2O (g) (1.17)...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Write the balanced equation for the following chemical r eactions.',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Hydrogen + Chlorine →  Hydrogen chloride (ii) Barium chloride + Aluminium sulphate →   Barium sulphate +      Aluminium chloride (iii) Sodium + Water  →  Sodium hydroxide + Hydr ogen',
        'text',
        46,
        6
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Write a balanced chemical equation with state symbols for the',
        ARRAY[]::text[],
        6,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'following reactions. (i) Solutions of barium chloride and sodium sulphate in water react to give insoluble barium sulphate and the solution of sodium chloride. (ii) Sodium hydroxide solution (in water) reacts with hydrochloric acid solution (in water) to produce sodium chloride solution and water. ? 2024-25  --- Page 7 --- Chemical Reactions and Equations 7 Let us discuss some more examples of combination reactions. (i) Burning of coal C(s) + O2(g)  →  CO2(g) (1.15) (ii) Formation of water from H2(g) and O2(g) 2H2(g) + O2(g) →  2H2O(l) (1.16) In simple language we can say that when two or more substances (elements or compounds) combine to form a single product, the reactions are called combination reactions. In Activity 1.4, we also observed that a large amount of heat is evolved. This makes the reaction mixture warm. Reactions in which heat is released along with the formation of products are called exothermic chemical reactions. Other examples of exothermic reactions are – (i) Burning of natural gas CH4(g) + 2O2 (g) →  CO2 (g) + 2H2O (g) (1.17) (ii) Do you know that respiration is an exothermic process? We all know that we need ener gy to stay alive. We get this energy from the food we eat. During digestion, food is broken down into simpler substances. For example, rice, potatoes and bread contain carbohydrates. These carbohydrates are broken down to form glucose. This glucose combines with oxygen in the cells of our body and provides energy. The special name of this reaction is respiration, the process of which you will study in Chapter 6. C6H12O6(aq) + 6O2(aq) →  6CO2(aq) + 6H2O(l) + energy (1.18) (Glucose) (iii) The decomposition of vegetable matter into compost is also an example of an exothermic reaction. Identify the type of the reaction taking place in Activity 1.1, where heat is given out along with the formation of a single product. Do You Know? A solution of slaked lime produced by the reaction 1.13 is used for whitewashing walls. Calcium hydroxide react',
        'example',
        594,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 8 --- Science8 88 88 Figure 1.5 Heating of lead nitrate and emission of nitrogen dioxide Figure 1.4 Correct way of heating the boiling tube containing crystals of ferrous sulphate and of smelling the odour Activity 1.6Activity 1.6Activity 1.6Activity 1.6Activity 1.6 n Take about 2 g lead nitrate powder in a boiling tube. n Hold the boiling tube with a pair of tongs and heat it over a flame, as shown in Fig. 1.5. n What do you observe? Note down the change, if any. You will observe the emission of brown fumes. These fumes are of nitrogen dioxide (NO 2). The reaction that takes place is – Activity 1.5Activity 1.5Activity 1.5Activity 1.5Activity 1.5 n Take about 2 g ferrous sulphate crystals in a dry boiling tube. n Note the colour of the ferrous sulphate crystals. n Heat the boiling tube over the  flame  of a burner or spirit lamp as shown in Fig. 1.4. n Observe the colour of the crystals after heating. Have you noticed that the green colour of the ferrous sulphate crystals has changed? You can also smell the characteristic odour of burning sulphur. 2FeSO4(s)  Heat →   Fe2O3(s)  +  SO2(g)  + SO3(g) (1.19) (Ferrous sulphate)   (Ferric oxide) In this reaction you can observe that a single reactant breaks down to give simpler products. This is a decomposition reaction. Ferrous sulphate crystals (FeSO4. 7H2O) lose water when heated and the colour of the crystals changes. It then decomposes to ferric oxide (Fe 2O3), sulphur dioxide (SO2) and sulphur trioxide (SO3). Ferric oxide is a solid, while SO2 and SO3 are gases. Decomposition of calcium carbonate to calcium oxide and carbon dioxide on heating is an important decomposition reaction used in various industries. Calcium oxide is called lime or quick lime. It has many uses – one is in the manufacture of cement. When a decomposition reaction is carried out by heating, it is called thermal decomposition. CaCO3(s)  Heat →   CaO(s)    +   CO2(g) (1.20) (Limestone)    (Quick lime) Another example of a thermal ',
        'example',
        521,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 9 --- Chemical Reactions and Equations 9 9999 Activity 1.7Activity 1.7Activity 1.7Activity 1.7Activity 1.7 Activity 1.8Activity 1.8Activity 1.8Activity 1.8Activity 1.8 n Take about 2 g silver chloride in a china dish. n What is its colour? n Place this china dish in sunlight for some time (Fig. 1.7). n Observe the colour of the silver chloride after some time. Figure 1.7 Silver chloride turns grey in sunlight to form silver metal You will see that white silver chloride turns grey in sunlight. This is due to the decomposition of silver chloride into silver and chlorine by light. 2AgCl(s)  Sunlight → 2Ag(s) + Cl2(g) (1.22) n Take a plastic mug. Drill two holes at its base and fit rubber stoppers in these holes. Insert carbon electrodes in these rubber stoppers as shown in Fig. 1.6. n Connect these electrodes to a 6 volt battery. n Fill the mug with water such that the electrodes are immersed. Add a few drops of dilute sulphuric acid to the water. n Take two test tubes filled with water and invert them over the two carbon electrodes. n Switch on the current and leave the apparatus undisturbed for some time. n You will observe the formation of bubbles at both the electrodes. These bubbles displace water in the test tubes. n Is the volume of the gas collected the same in both the test tubes? n Once the test tubes are filled with the respective gases, remove them carefully. n Test these gases one by one by bringing a burning candle close to the mouth of the test tubes. CAUTION: This step must be performed carefully by the teacher. n What happens in each case? n Which gas is present in each test tube? Figure 1.6 Electrolysis of water 2Pb(NO3)2(s) Heat →  2PbO(s) + 4NO2(g)  +  O2(g) (1.21) (Lead nitrate)       (Lead oxide) (Nitrogen      (Oxygen) dioxide) Let us perform some more decomposition reactions as given in Activities 1.7 and 1.8. 2024-25  --- Page 10 --- Science10 1010 1010 Figure 1.8 (a) Iron nails dipped in copper sulphate solution ? QUESTIONS',
        'exercise',
        499,
        10
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '1. A solution of a substance ‘X’ is used for whitewashing.',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Name the substance ‘X’ and write its formula. (ii) Write the reaction of the substance ‘X’ named in (i) above with water.',
        'text',
        31,
        10
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '2. Why is the amount of gas collected in one of the test tubes in Activity',
        ARRAY[]::text[],
        10,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '1.7 double of the amount collected in the other? Name this gas. 1.2.3  Displacement Reaction Activity 1.9Activity 1.9Activity 1.9Activity 1.9Activity 1.9 n Take three iron nails and clean them by rubbing with sand paper. n Take two test tubes marked as (A) and (B). In each test tube, take about 10 mL copper sulphate solution. n Tie two iron nails with a thread and immerse them carefully in the copper sulphate solution in test tube B for about 20 minutes [Fig. 1.8 (a)]. Keep one iron nail aside for comparison. n After 20 minutes, take out the iron nails from the copper sulphate solution. n Compare the intensity of the blue colour of copper sulphate solutions in test tubes (A) and (B) [Fig. 1.8 (b)]. n Also, compare the colour of the iron nails dipped in the copper sulphate solution with the one kept aside [Fig. 1.8 (b)]. Take about 2 g barium hydroxide in a test tube. Add 1 g of ammonium chloride and mix with the help of a glass rod. Touch the bottom of the test tube with your palm. What do you feel? Is this an exothermic or endothermic reaction? Carry out the following Activity Silver bromide also behaves in the same way. 2AgBr(s) Sunlight → 2Ag(s) + Br2(g) (1.23) The above reactions are used in black and white photography. What form of energy is causing these decomposition reactions? We have seen that the decomposition reactions require energy either in the form of heat, light or electricity for breaking down the reactants. Reactions in which energy is absorbed are known as endothermic reactions. 2024-25',
        'text',
        383,
        10
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 11 --- Chemical Reactions and Equations 11 Why does the iron nail become brownish in colour and the blue colour of copper sulphate solution fades? The following chemical reaction takes place in this Activity– Fe(s) + CuSO4(aq) → FeSO4(aq)    +   Cu(s) (1.24)         (Copper sulphate) (Iron sulphate) In this reaction, iron has displaced or removed another element, copper, fr om copper sulphate solution. This r eaction is known as displacement reaction. Other examples of displacement reactions are Zn(s) + CuSO4(aq)  → ZnSO4(aq)   +     Cu(s) (1.25)      (Copper sulphate) (Zinc sulphate) Pb(s) + CuCl2(aq)   → PbCl2(aq)     +     Cu(s) (1.26)       (Copper chloride) (Lead chloride) Zinc and lead are more reactive elements than copper. They displace copper from its compounds. 1.2.4 Double Displacement Reaction Activity 1.10Activity 1.10Activity 1.10Activity 1.10Activity 1.10 /square6Take about 3 mL of sodium sulphate solution in a test tube. /square6In another test tube, take about 3 mL of barium chloride solution. /square6Mix the two solutions (Fig. 1.9). /square6What do you observe? Figure 1.9Figure 1.9Figure 1.9Figure 1.9Figure 1.9 Formation of barium sulphate and sodium chloride You will observe that a white substance, which is insoluble in water, is formed. This insoluble substance formed is known as a precipitate. Any reaction that produces a precipitate can be called a precipitation reaction. Na2SO4(aq) + BaCl2(aq) →  BaSO4(s) + 2NaCl(aq) (1.27) (Sodium (Barium (Barium (Sodium sulphate) chloride) sulphate) chloride) Figure 1.8 Figure 1.8 Figure 1.8 Figure 1.8 Figure 1.8 (b) Iron nails and copper sulphate solutions compared before and after the experiment 2024-25',
        'example',
        425,
        10
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 12 --- Science12 1.2.5 Oxidation and Reduction Activity 1.11Activity 1.11Activity 1.11Activity 1.11Activity 1.11 /square6Heat a china dish containing about 1 g copper powder (Fig. 1.10). /square6What do you observe? Figure 1.10Figure 1.10Figure 1.10Figure 1.10Figure 1.10 Oxidation of copper to copper oxide The surface of copper powder becomes coated with black copper(II) oxide. Why has this black substance formed? This is because oxygen is added to copper and copper oxide is formed. 2Cu + O2   Heat →  2CuO (1.28) If hydrogen gas is passed over this heated material (CuO), the black coating on the surface turns brown as the reverse reaction takes place and copper is obtained. CuO +H Cu+H O2 2 Hea t →   (1.29) If a substance gains oxygen during a reaction, it is said to be oxidised. If a substance loses oxygen during a reaction, it is said to be reduced. During this reaction (1.29), the copper(II) oxide is losing oxygen and is being reduced. The hydrogen is gaining oxygen and is being oxidised. In other words, one reactant gets oxidised while the other gets reduced during a reaction. Such reactions are called oxidation-reduction reactions or redox reactions. (1.30) Some other examples of redox reactions are: ZnO + C → + Zn CO (1.31) MnO HCl MnCl H O Cl2 2 2 24 2+ → + + (1.32) Recall Activity 1.2Recall Activity 1.2Recall Activity 1.2Recall Activity 1.2Recall Activity 1.2 , where you have mixed the solutions of lead(II) nitrate and potassium iodide. (i) What was the colour of the precipitate formed? Can you name the compound precipitated? (ii) Write the balanced chemical equation for this reaction. (iii) Is this also a double displacement reaction? What causes this? The  white precipitate of BaSO4 is formed by the reaction of  2– 4SO  and Ba2+. The other product formed is sodium chloride which remains in the solution. Such reactions in which there is an exchange of ions between the reactants are called double displacement reactions. 2024-25  --- Page 13 ',
        'example',
        599,
        12
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '1. Why does the colour of copper sulphate solution change when',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'an iron nail is dipped in it?',
        'text',
        7,
        12
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '2. Give an example of a double displacement reaction other than',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the one given in Activity 1.10.',
        'text',
        7,
        12
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '3. Identify the substances that are oxidised and the substances',
        ARRAY[]::text[],
        12,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'that are reduced in the following reactions. (i) 4Na(s) + O 2(g) →  2Na2O(s) (ii) CuO(s) + H2(g) →  Cu(s) + H2O(l) 1.3 1.31.3 1.31.3 HA HAHA HAHAVE YOU OBSERVED THE EFFECTS OF OVE YOU OBSERVED THE EFFECTS OF OVE YOU OBSERVED THE EFFECTS OF OVE YOU OBSERVED THE EFFECTS OF OVE YOU OBSERVED THE EFFECTS OF O XID XIDXID XIDXIDA AAAATION TIONTION TIONTION REA REAREA REAREA CTIONS IN EVERYDCTIONS IN EVERYDCTIONS IN EVERYDCTIONS IN EVERYDCTIONS IN EVERYD A AA AAY LIFE? Y LIFE?Y LIFE? Y LIFE?Y LIFE? 1.3.1 Corrosion You must have observed that iron articles are shiny when new, but get coated with a reddish brown powder when left for some time. This process is commonly known as rusting of iron. Some other metals also get tarnished in this manner. Have you noticed the colour of the coating formed on copper and silver? When a metal is attacked by substances around it such as moisture, acids, etc., it is said to corrode and this process is called corrosion. The black coating on silver and the green coating on copper are other examples of corrosion. Corrosion causes damage to car bodies, bridges, iron railings, ships and to all objects made of metals, specially those of iron. Corrosion of iron is a serious problem. Every year an enormous amount of money is spent to replace damaged iron. You will learn more about corrosion in Chapter 3. 1.3.2 Rancidity Have you ever tasted or smelt the fat/oil containing food materials left for a long time? When fats and oils are oxidised, they become rancid and their smell and taste change. Usually substances which prevent oxidation (antioxidants) are added to foods containing fats and oil. Keeping food in air tight containers helps to slow down oxidation. Do you know that chips manufacturers usually flush bags of chips with gas such as nitrogen to prevent the chips from getting oxidised ? Recall Activity 1.1Recall Activity 1.1Recall Activity 1.1Recall Activity 1.1Recall Activity 1.1 ,     where a magnesium ribbon burns with a dazzling flame in ai',
        'example',
        532,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 14 --- Science14 What you have learnt /square6A complete chemical equation represents the reactants, products and their physical states symbolically. /square6A chemical equation is balanced so that the numbers of atoms of each type involved in a chemical reaction are the same on the reactant and product sides of the equation. Equations must always be balanced. /square6In a combination reaction two or more substances combine to form a new single substance. /square6Decomposition reactions are opposite to combination reactions. In a decomposition reaction, a single substance decomposes to give two or more substances. /square6Reactions in which heat is given out along with the products are called exothermic reactions. /square6Reactions in which energy is absorbed are known as endothermic reactions. /square6When an element displaces another element from its compound, a displacement reaction occurs. /square6Two different atoms or groups of atoms (ions) are exchanged in double displacement reactions. /square6Precipitation reactions produce insoluble salts. /square6Reactions also involve the gain or loss of oxygen or hydrogen by substances. Oxidation is the gain of oxygen or loss of hydrogen. Reduction is the loss of oxygen or gain of hydrogen. EXERCISES',
        'exercise',
        318,
        14
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '1. Which of the statements about the reaction below are incorrect?',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2PbO(s) + C(s) →  2Pb(s) + CO2(g) (a) Lead is getting reduced. (b) Carbon dioxide is getting oxidised. (c) Carbon is getting oxidised. (d) Lead oxide is getting reduced. (i) (a) and (b) (ii) (a) and (c) (iii) (a), (b) and (c) (iv) all',
        'text',
        58,
        14
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '2. Fe2O3 + 2Al →  Al2O3 + 2Fe',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'The above reaction is an example of a (a) combination reaction. (b) double displacement reaction. 2024-25  --- Page 15 --- Chemical Reactions and Equations 15 (c) decomposition reaction. (d) displacement reaction.',
        'example',
        53,
        14
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '3. What happens when dilute hydr ochloric acid is added to ir on fillings? Tick the',
        ARRAY[]::text[],
        14,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'correct answer. (a) Hydrogen gas and iron chloride are produced. (b) Chlorine gas and iron hydroxide are produced. (c) No reaction takes place. (d) Iron salt and water are produced.',
        'text',
        45,
        14
    );

END $$;

-- Book 16/29: like Football, Hockey, Basketball, Cricket and Vol...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Giving kho to side: To chase a defender',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Two steps kho (proximity and distal step)  (ii) Advance kho: Running ahead of defender and  dropping kho.  (iii) Deceptive kho: To deceive defender by different  body movements.',
        'text',
        45,
        11
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Pole turning: To turn the pole in continuation of',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'attack   (i) Pole turning from 8th square (from sitting position).  (ii) 4 up turn: Turning pole by taking four steps.  (iii) 5 up turn: Turning pole by taking five steps.  (iv) Running pole turning: Pole turning without giving  Kho.',
        'text',
        58,
        11
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Covering on cross lane: To cover the defender on cross',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'lane.  (i) Quadruped  (ii) Biped  (iii) Rush Through  (iv) Combination Chap-7.indd   120 8/24/2020   11:41:03 AM 2024-25  --- Page 11 --- Team Games and sporTs II 121',
        'text',
        41,
        11
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. Pole dive: Taking support of pole and touching the',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'defender.  (i) Running pole dive  (ii) Pole dive from 8th square (Sitting)  (iii) Judgment kho and pole dive  (iv) Running flat dive  (v) Steady dive  (vi) Side dive',
        'text',
        41,
        11
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '5. Tapping',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Shoulder tap: Touching the shoulder of defender.  (ii) Heel tap: Touching the heel of defender. Defensive skills',
        'text',
        29,
        11
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '1. Chain game: Defender takes entry behind the sitting',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'chaser and runs in a zig-zag path by making the  attacker give kho from behind.  (i) Six Single up  (ii) Two five six up  (iii) Two three six up  (iv) Three four five six up  (v) One four five six up  (vi) One four seven one',
        'text',
        56,
        11
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '2. Ring game: Defender runs in the shape of a ring (oval',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'shape) by making use of four squares. In front ring  defender faces the attacker. In back ring defender  shows his back and plays ring game.  (i) Short ring - Defender stands close to the centre  lane.  (ii) Medium ring - Defender stands almost half the  way from the centre lane.  (iii) Long ring - Defender stands away from the central  lane but.',
        'text',
        87,
        12
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '4. Dodging: To deceive the attacker, different body dodge',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'is used. Shoulder dodge, Foot dodge, combining both  skills of defence, 3-ring defence.',
        'text',
        21,
        12
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '5. Avoiding the pole: The defender stands between last',
        ARRAY[]::text[],
        12,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'square and pole without reaching pole. Palti By showing his back, the defender deceives the attacker and  turns in the opposite direction to the direction in which he was   running. Chap-7.indd   121 8/24/2020   11:41:03 AM 2024-25  --- Page 12 --- HealtH and PHysical education - class X 122 Judo Judo is a popular martial art, combative and  Olympic sport. In the term judo, ‘ju’ means  ‘gentle’ and ‘do’ means ‘the way or path’.   Judo was developed in Japan in the late 19th  century by using the principles of balance and  leverage adapted from jujutsu. Its most prominent  feature is its competitive element, where the  objective is to either throw or putdown one’s  opponent to the ground, immobilise or otherwise  subdue one’s opponent with a grappling maneuver,  or force an opponent to submit by joint locking or  by executing a stranglehold or choke. Strikes and  thrusts by hands and feet as well as self-defense  are a part of judo. Many are trained in Judo either  for participation in competition or self-defense. History The history of judo starts with Japanese jujutsu. It was  created by Professor Jigoro Kano and he believed that the  techniques could be practiced as a competitive sport if the  more dangerous techniques were omitted. By 1910 Judo was  a recognised sport that could be safely engaged in and in  1911 it was adopted as a part of Japan’s educational system.  In the same year, the Kodokan Judo Instructors’ Training  Department, Kodokan Black Belt Association and Japan  Athletic Association were formed. World War II saw a different  development of Judo. Instead of being used for sport, Judo was  being taught as a combat skill. Those selected for commando  and special services training often achieved a high standard  of expertise. When Japan hosted the 1964 Olympics, Judo  was given its first opportunity as an event. Of the 16 medals  awarded for Judo, Japan won three gold medals, and one  silver medal. Judo was no longer a Japanese sport but had  develope',
        'text',
        731,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 13 --- Team Games and sporTs II 123 Rules Officials There are three officials who preside over a judo match. There  is one referee who walks around inside the contest area and  conducts the match. There are two judges who sit diagonally  across the mat from one another, each in a corner. The two  judges assist the referee and indicate when the contestant  goes outside of the contest area. The referee is in charge  of awarding points and accessing penalties and uses hand  gestures to signal his decision. However, if a judge disagrees  with a call, then the three officials take a vote and the decision  is decided by a majority vote. In addition to the Judge and  Referees there are also scorekeepers and timers. There is  usually a scoreboard, which displays points and penalties  and it can either be electronic or manual. Medical personnel  are also on hand in the event of injury to a contestant.  Contestants The two contestants, who are known as Judokas, compete for  5 minutes for men and 4 minutes for women. One contestant  wears white uniform and the other a blue uniform.  Uniforms The judokas wear loose-fitting judo uniforms called judogi,  consisting of pants, a jacket and a belt. Judogi is made up  of loose-fitting pants, a jacket and a belt that is tied around  the waist. The jacket and pants are made of cotton. They  are either blue or white and they are made so a rival should  be able to get a grip on either one of them so as to be able  to make a judo throw. One judoka will wear white the other  blue. The belt is three meters long and it is wrapped around  the waist twice. The color of the belt signifies the rank the  combatant has reached.  Competition area The entire competition area in judo is 46 to 53 feet square   (14 to 16 meters). This area is made up of foam mats  commonly referred to as tatami mats and the individual  mats are 6.5 feet by 3.281 feet wide (2 meters long, a 1-meter  wide). Inside the competition area is a contest area, which  i',
        'text',
        613,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 14 --- HealtH and PHysical education - class X 124 In the middle of the contest area are two pieces of tape,  one blue and one white 13.1 feet apart (4-meters). These two  pieces of tape mark the place where the judoka will stand  when they begin and end each bout. Contest A random draw, in the same weight category, is used to  determine which contestants will be fighting each other. In  the Olympic Games there are two pools, and each pool has  its own single-elimination tournament. The two pool winners  will compete for the gold medal, with the loser of this contest  winning the silver medal. In each pool, the competitors who  lose to a pool winner are then entered into a repechage round  which is also a single-elimination tournament. The winners of  the repechage pools will be the winners of the bronze medals. To win the contest a Judoka must score an Ippon a score  that equals 10 points by using successful Judo techniques.  If neither of the Judokas is able to score an Ippon or 10  points by the end of the match, the winner will be the Judoka  who has scored the most points. In the event of a tie, for the  first time at the 2004 Olympic Games, the “Golden Score”  rule was used. If there is no winner after the five-minute  period has ended, the referee announces the beginning of  “Golden Score”. This will extend the match for an extra five- minute period and the contestant who scores the first point  is declared the winner of the match. Judo penalties Two types of penalties may be awarded. One is shido and  another is hansoku. After two shido are given, the third  shido becomes hansoku-make and the victory is given to the  opponent. This is an indirect hansoku-make and does not  result in expulsion from the tournament.  Wrestling Considered as one of the most ancient and oldest sport in the  world, wrestling has also been equally popular in India. It is  a form of combat sport involving grappling type techniques  such as clinch, fighting, throws, take dow',
        'example',
        644,
        12
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '1. There are two  Olympic styles of wrestling, Freestyle',
        ARRAY[]::text[],
        17,
        17
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'and Greco-Roman. With one key exception, the rules  of the two styles are identical:  • In Greco-Roman, a wrestler may not attack  his opponent’s legs, nor use his own legs to  trip, lift or execute other moves.  • In freestyle, both the arms and legs may be  used to execute holds or to defend against  attack.',
        'text',
        77,
        17
    );

END $$;

-- Book 17/29: Health and Physical...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        'Chapter 1 Physical Education:',
        ARRAY[]::text[],
        7,
        7
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Relation with other Subjects .............................1 - 10',
        'text',
        16,
        7
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        'Chapter 2 Effects of Physical Activities',
        ARRAY[]::text[],
        7,
        7
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'on Human Body ..............................................11 - 22',
        'text',
        16,
        7
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        'Chapter 3 Growth and Development',
        ARRAY[]::text[],
        7,
        7
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'during Adolescence .........................................23 - 34',
        'text',
        16,
        7
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        'Chapter 9 Dietary Considerations',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'and Food Quality ........................................165 - 180',
        'text',
        16,
        8
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        'Chapter 13 Agencies and Awards Promoting',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Health, Sports and Yoga .............................215 - 223 Prelims_X.indd   11 8/24/2020   1:15:11 PM 2024-25  --- Page 12 --- lisT oF useFul websiTes Note: Please refer to the home websites of the recognised federations  of the various sports for updated information about rules and  regulations.  • https://www.ioc.org  • https://www.arisf.sports  • https://www.iaaf.org (Athletics)  • https://www.BWFBadminton.org (Badminton)  • https://www.fiba.basketball (Basketball)  • https://www.fifa.com (Football)  • https://www. gymnastics.sports (Gymnastics)  • https://www.IHF.info (Handball)  • https://www.Fih.ch (Hockey)  • https://www.ijf.org (Judo)  • https://www.fina.org (Swimming)  • https://www.ittf.com (Table Tennis)  • https://www.itftennis.com (Tennis)  • https://www.fivb.com (Volleyball)  • https://www.unitedworldwrestling.org (Wrestling)  • https://www.mohfw.gov.in  • https://main.mohfw.gov.in/sites/default/files/schooladvisory. pdf Note: For updation of every game and sport, you can consult or  refer to rule books of various sport’s federations. Prelims_X.indd   12 8/24/2020   1:15:11 PM 2024-25',
        'text',
        279,
        8
    );

END $$;

-- Book 18/29: HealtHy Community living...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. A slum in an urban area (Fig 11.3)',
        ARRAY[]::text[],
        1,
        3
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'A village Mawlynnong Village in East Khasi Hills District of Meghalaya  was declared as Asia’s cleanest village in 2003 by Discover  HealtHy Community  living 11 Chap-11.indd   193 8/24/2020   11:46:07 AM 2024-25  --- Page 2 --- HealtH and PHysical education - class X 194 India Magazine. It is about 75 km away from Shillong,   the capital of Meghalaya. Most of the houses in this village  are beautifully decorated with flowers and plants. As per  the Census of 2011, the total population of Mawlynnong  is 414. The main occupation of the villagers is agriculture,  but it has also been an age old tradition of ensuring that  the surrounding environment is clean. In fact cleanliness is  a collective effort and this practice is ingrained in the people  since their childhood. The people voluntarily sweep the roads  and lanes, water the plants in public areas and clean the  drains. A dustbin made out of bamboo is found all along  the village. Everyone makes it a point that dirt and waste  are not thrown anywhere. All the waste from the dustbin is  collected and kept in a pit, which the villagers use as manure.  Trees are planted to restore and maintain nature’s balance.  Mawlynnong’s fame as the cleanest village in Asia, is drawing  a lot of domestic as well as international tourists, as a result of  which tourism is also an important source of employment for  the local youths. Besides, there are many interesting sights  to see such as the famous living root bridge in the nearby  village of Riwai, which is a fascinating example of indigenous  methods of conservation and sustainability. Local youths are  available as enthusiastic and informative guides. Fig. 11.1: Mawlynnong Village A township in an urban area Fig. 11.2: A modern township Chap-11.indd   194 8/24/2020   11:46:07 AM 2024-25',
        'example',
        452,
        1
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 3 --- HealtHy Community living 195 This picture is of a modern township derived from an  advertisement in a national newspaper. Many times,  catchy slogans such as ‘Get away from noise, pollution,  congestion and a cramped life’ are used by builders to sell  their apartments. People are assured a safe and healthy  environment with not only the basic amenities, but  also other features, such as, shopping arcades, clubs,  gymnasiums, gardens, clinics, food market, lots of open  space, etc. A slum in an urban area Fig. 11.3: A slum area These pictures characterise life in a slum area in big cities.  As you can see in the picture, people live in overcrowded  houses surrounded by stagnant water which is a potential  breeding ground for mosquitoes. We also find railway tracks  adjacent to the houses which is dangerous for children and  adults too. In addition, we find heaps of garbage scattered  around the houses. Activity 11.2 You may conduct a survey in your neighborhood and collect  information on the following —  • Make a list of some of the basic amenities and community  resources that are collectively shared by members of your  community.   • Make a list of  some of the community resources that are not  available in your locality.   • On the basis of your observations and survey, complete the  following table — Features appropriate or  necessary for healthy  community living Features not appropriate  or necessary for healthy  community living',
        'text',
        368,
        3
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '1. Water supply',
        ARRAY[]::text[],
        3,
        3
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2. .................................. 3. .................................. 4. .................................. 5. ..................................',
        'text',
        37,
        3
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. Open drains',
        ARRAY[]::text[],
        3,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '2. .................................. 3. .................................. 4. .................................. 5. .................................. Activity 11.1 After observing the  pictures, discuss the  following —  • Do you think  Mawlynnong Village is  a successful example  of healthy community  living? Give reasons for  your answers.  • Do you think modern  townships as depicted  in Fig 11.2, can offer its  inhabitants a safe and  healthy environment,  as assured by the  builders?   • The pictures shown  in Fig 11.3, does not  reflect signs of healthy  community living. Do  you agree? Give reasons  for your answers.  Chap-11.indd   195 8/24/2020   11:46:07 AM 2024-25',
        'example',
        171,
        3
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- HealtH and PHysical education - class X 196 These activities will enable you to understand various features of  healthy community living. Through these activities, you may have  observed that in a community, a group of people live in a particular  local area. Secondly, they share common facilities, which differ from  place to place. In some areas, people have access to facilities, such  as, water supply, sanitation, garbage disposal facilities, health  care services, recreational facilities, community centre, schools,  transportation, etc., but in some places people do not have access to  even the most basic amenities.  A community is said to be healthy when its members  continuously work together to maintain, improve and expand  the available natural resources and avoid their wastage.   The healthy community only be develped when its members  recognise their roles and responsibilities. They strive to  inculcate values and attitudes of cooperation, mutual  respect, tolerance, kindness, etc. The role of Panchayati Raj,  civil societies and other government institutions is also very  important to promote healthy living. Important features of healthy community living Maintaining cleanliness of our home and surroundings is  an essential feature of healthy community living. Healthy  community is one in which all residents have access to  quality education, safe and healthy homes, adequate  employment, transportation, physical activity and  nutrition. Living in overcrowded and unhygienic places  with excessive noise and pollution, may lead to various  forms of illnesses, diseases and stress. For instance, lack  of adequate space, poor ventilation in rooms and toxic  fumes in the air, increase the risk of air borne diseases.  Access to basic amenities such as regular water supply,  safe drinking water and sanitation, is important for  healthy community living. In the previous classes (Classes  VII to IX), it has been learnt that open and unattended  garbage ',
        'example',
        707,
        3
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 5 --- HealtHy Community living 197 To ensure these basic amenities, the role of the local  government or panchayats is very important. They are required  to ensure rules and regulations for safety measures, cleanliness,  ensure equal access of public amenities to all members,  promote adoption of waste management practices, and help  ecological restoration and conservation. However, we cannot  depend solely on the government to take the initiative. The  quality of life in a community also depends on how the members  of the community work to improve on available resources  and ensure that the government provides for these facilities.  You might have seen this logo before. This is  the logo of the Swachh Bharat Abhiyan . You  must have also seen some of the television  advertisements through which the government  advertises the importance and necessity of  staying clean and keeping our environment  clean. In this Clean India campaign — known  popularly as the Swachh Bharat Abhiyan ,  the vision of a Clean and hygienic India, once  seen by Mahatma Gandhi, can happen only if  members of every community cooperate and  accept individual and collective responsibility  of keeping themselves, their homes and their  surroundings clean. In order to work collectively, members of a community  need to develop values of co-operation, kindness, respect,  gratitude, joy, peace and selflessness. These attributes are  important in fostering the principles of collective work and  in nurturing healthy social relationships. The example  of Mawlynnong village shows that high income alone  is not the only criterion for healthy living. Cooperative  action, responsibility and positive values can also help in  improving the quality of life, and healthy living conditions  for one and all. Prevention  of Coronavirus : soCial  DistanCing anD Dealing  witH stigma Prevention through social distancing Social Distancing: Deliberately increasing the physical space  between people to avoid sp',
        'example',
        580,
        3
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '1. Which of the following is the most important criterion for healthy',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'community living?   a) Cooperative action    b) Kindness    c) Harmony    d) Safety measures',
        'text',
        23,
        10
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '2. Community participation is essential for ________________.',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a) ecological restoration    b) public hygiene and health    c) social harmony   d) All of the above  II. State whether True or false   a) Maintenance of public hygiene is the sole responsibility of the  government.   b) Community health and individual health are closely interlinked   c) Camping is the only means for developing values of cooperative  living   d) Overcrowding increases the risk to air borne diseases   e) Interpersonal relationships are as important as our physical  environment. III. Answer the following Questions',
        'exercise',
        133,
        10
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '1. What is your vision of a healthy community? Give at least 3',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'examples.',
        'example',
        2,
        10
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '2. A camping trip has been arranged by your school. Two girls from',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'your community are not allowed to go for the trip. What are  the points you would highlight to convince the parents on the  importance of camping trip for girls.',
        'text',
        40,
        10
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '3. Arrange a collage of pictures showing various activities in a',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Camping Trip.',
        'text',
        3,
        10
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '4. Give two suggestions for keeping your community healthy,',
        ARRAY[]::text[],
        10,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'both at the individual and collective level, based on the points  enumerated below.    For example,   Record your suggestions regarding cleanliness drive within the  community. The first one has been done for you.   I will ensure that, I do not throw litter around.   We will ensure that, there are no open garbage dumps in the  community. Chap-11.indd   203 8/24/2020   11:46:15 AM 2024-25  --- Page 12 --- HealtH and PHysical education - class X 204  a) Record your suggestions regarding rules and regulations within  the community for safety measures.    I will ensure that ____________________________________________ .    We will ensure that __________________________________________.  b) Record your suggestions for ensuring equal access of public  amenities to all members.   I will ensure that  ____________________________________________ .   We will ensure that  __________________________________________.  c) Record your suggestions for adopting effective waste management  practices.   I will ensure that  ____________________________________________ .   We will ensure that  __________________________________________.  d) Record your suggestions for ecological restoration and  conservation within your community.   I will ensure that  ____________________________________________ .   We will ensure that  __________________________________________.  e) Record your suggestions for ensuring kindness and consideration  to the aged and differently abled.   I will ensure that  ____________________________________________ .   We will ensure that  __________________________________________.  f) Record your suggestions for counseling provisions for the youth,  recreational facilities, etc.   I will arrange for  _____________________________________________.   We will arrange for  __________________________________________ .',
        'example',
        460,
        11
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '10. Imagine that you have been asked to prepare an activity schedule',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'for a day in a camping trip. First write down the location of the  camping site and objectives of the camping trip and include other  details in the following table.   Location of camping site  _____________________________________ .   Objectives of the camping trip  ________________________________. Table : Schedule for a camping trip Time Activities Equipment  Required No. of  participants No. of  Teachers/  Instructors Expected  Outcome Budget Chap-11.indd   204 8/24/2020   11:46:16 AM 2024-25',
        'text',
        125,
        12
    );

END $$;

-- Book 19/29: Table Tennis, Tennis, Swimming, Judo, Wrestling, e...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Long jump: The long jump is one of the oldest field',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'events. The take-off has to be made from a 20 cm  wide board one meter away from a pit.  Athletes  sprint along a length of track to a take off board and  a sandpit. If any part of the runner’s foot goes past  the takeoff board, the jumper is considered for a foul  and does not receive score for that round. Distance  is measured from the end of the takeoff board to the  nearest mark made by the jumper on the pit.  Best  eight competitors have a maximum of six rounds.  Professional long jumpers typically have strong  acceleration and sprinting abilities. However, athletes  must also have a consistent stride to allow them to  take off near the board while still maintaining their  maximum speed. Fig. 4.11: Long jump',
        'text',
        180,
        9
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Triple jump: Similar to the long jump, the triple jump',
        ARRAY[]::text[],
        9,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'takes place on a field heading towards a sandpit.  This event is termed as the “hop-step and jump.”  The event begins like a long jump, with competitor  dashing down the runway and leaping from a takeoff  board they first hop then take a step and then jump  into the pit. The event is scored identically to the   long jump. Chap-4.indd   43 8/24/2020   11:37:25 AM 2024-25  --- Page 10 --- HealtH and PHysical education - class X 44 Hop phaseS tep phase Jump phase Fig. 4.12: Triple jump',
        'text',
        121,
        10
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. High jump: In high jump event, competitors combined',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'speed, to generate lift, with jumping technique.  Jumpers may approach the bar from either-side,  and land on a large, generally inflated cushion. In  between, they must clear the 4-meter-long bar  without knocking it off its supports. The bar will  originally be set at a low height, at which competitors  may choose to jump, or pass to another height. The  bar is raised to a predetermined height after each  round. Each competitor who either clears or passes  a height advances to the next round.  They are  ranked according to the height they clear. An athlete  is allowed a maximum of three trials of each height.  Competitors are eliminated after missing (failing) three  consecutive jumps in a particular height. Athletes  have a short run up and then take off from near one  foot to jump over a horizontal bar and fall back onto  a cushioned landing area. Jumping technique has  played a significant part in the history of the event.  The modern technique of high jump as shown in the  figure is known as “Fosbury Flop”. Fig. 4.13: High jump',
        'text',
        262,
        10
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. Pole vault: Each vaulter sprints down the runway with',
        ARRAY[]::text[],
        10,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a fiberglass or carbon fiber pole and plants the pole  into the vaulting box. This box is specifically made of  Activity 4.8 Practice and measure  separately hop step and  jump Activity 4.9 In case of tie in high jump  practice how to break it. Chap-4.indd   44 8/24/2020   11:37:32 AM 2024-25  --- Page 11 --- IndIvIdual Games and sports I 45 fiberglass or carbon fiber.  The atheletes then push  themselves over the crossbar and land onto the mattress. Fig. 4.14: Pole vault The rules require that athletes do not move their hands  along the pole.  As per technique, they begin clearing the bar  with their feet first in a position so that the stomach faces  the bar. As with high jumping, vaulters may touch the bar,  as long as it doesn’t fall. Round-by-round scoring rules are  the same as for the high jump. Throwing events There are four major throwing events: Shot Put (putting  the shot), Discus, Javelin and Hammer Throw. These are   detailed below. Fig. 4.15: Shot Put',
        'text',
        244,
        11
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. Shot Put: In putting the shot event the athletes put a',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'metal ball through the air for maximum distance. For  male athletes, the metal ball weights 7.26 kg and for  female athletes the weight is 4 kg. The athlete must  stay in a circle of 2.135 m (7 ft) diameter until the shot  has landed after throw. The put must be made from the  shoulder with one arm only, and the shot must not be  brought behind the shoulder. In shot put the athlete  holds the shot close to their neck in one hand. Then  they move in straight line or spin around for gaining  Chap-4.indd   45 8/24/2020   11:37:35 AM 2024-25  --- Page 12 --- HealtH and PHysical education - class X 46 Activity 4.11  • What are the lengths  of Javelin for men and  women?  • What are the weights  of Javelin for men and  women? momentum and finally putting the shot in a pushing  manner in the direction of the purified landing area.',
        'text',
        208,
        11
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. Discus: In the discus event the athlete stands inside',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a throwing circle of 2.5 mt (8’–2½”) diameter. As per  technique he/she turns around one and a half times  and throws the disc as far as he or she can.  The disc  is a round plate made of wood and metal and weighs  2 Kg for men and 1 Kg for women.  When throwing  the discus, the athlete must remain in circle. The feet  of the athlete cannot leave this area before the discus  lands.  Even afterwards the athlete must leave the  circle from rear half of the circle.  Otherwise it is a  fault and the throw will not be counted. The athlete  will spin around to gain momentum, speed and then  releases the disc in the proper direction. The athlete  that throws it furthest from the front part of the circle  (and within the legal area) wins the event. Fig. 4.16: Discus throw Fig. 4.17: Javelin throw',
        'text',
        199,
        12
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '3. Javelin: The javelin is something like a spear. The',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'official javelin size for women is 2.2 to 2.3 meters  long and weights 600 grams. The weight of javelin  for men is 800 grams and 2.6 to 2.7 meters long.   Activity 4.10 What is the weight of  discuss for men and  women? Chap-4.indd   46 8/24/2020   11:37:37 AM 2024-25  --- Page 13 --- IndIvIdual Games and sports I 47 The javelin must be thrown in a specific way for it to be a  legal throw. The athlete has to hold the javelin by its grip,  throw the javelin overhand and cannot turn the back to  the target when throwing. When throwing the javelin,  the athlete runs down a runway to gain momentum and  then must throw the javelin prior to crossing a line. The  athlete cannot go over the line until the javelin lands. To  avoid foul, the athlete must have a really good balance at  the end of the throw. The athlete must leave the runway  from behind the extended lines of the throwing arc. Fig. 4.18: Hammer throw',
        'text',
        229,
        12
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '4. Hammer Throw: The hammer throw doesn’t actually',
        ARRAY[]::text[],
        12,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'involve throwing a hammer like you would think.  In this throwing event the athletes throw a heavy  ball (7.265 Kg for men and 4 Kg for women) that is  attached to a handle with a long (4 feet) wire.  Like the  discus and the shot put, the athlete must stay in a  circle until the hammer lands. They spin several times  to gain momentum prior to releasing the hammer.  Balance is important due to the force generated by  having the heavy ball at the end of the long wire. Rules for field events In general, most field events allow an athlete to take their  attempt individually, under the same conditions as the  other athletes. Each attempt is measured to determine who  achieved the longest distance or maximum height.  • Horizontal jumps (long jump and triple jump) must be  initiated from behind a line. In the case of throws, that  line is an arc or inside a circle. Crossing the line while  initiating the attempt will invalidate the attempt. It will  be considered as a foul. Chap-4.indd   47 8/24/2020   11:37:39 AM 2024-25',
        'text',
        257,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 14 --- HealtH and PHysical education - class X 48  • All landings must occur inside the area called safe.  For the jumps, it is a sand filled pit, for throws it is a  defined sector.  • A throw landing on the line, on the edge of sector, is   a foul.   • Assuming a proper attempt, officials will then measure  the distance from the closest landing point back to the  line.   • Whenever a record (or potential record) occurs, that  measurement is taken (again) using a steel tape and  observed by at least three officials (plus usually the  meet referee).   • The leading 8 competitors in jumps (Long Jump and  Triple Jump only) and throws will get three more  attempts in addition to the 3 attempts they already  have taken.    • In vertical jumps (High Jump and Pole Vault), set the  bar at a particular height.  • The competitor must clear the bar without knocking it  off the stands that are holding the bar (flat).  • Three failures in a row will end the competitor’s  participation in the event.   • The competitor has the option to PASS their attempt.  • A pass could be used to save energy and avoid taking a  jump. However, that would not improve their position  in the standings.   • After all competitors have cleared, passed or failed their  attempts at a height, the bar height will be raised.  • The height of the bar raised is predetermined before the  competition. Though when one competitor remains,  that competitor may choose their own selected height  for the remaining attempts. A record is kept of each  attempt by each competitor.   • After all competitors have taken their attempts, the one  who jumps the highest height is the winner. The bar  does not shift to a lower height except to break a tie  for first place or a qualifying position. If those critical  positions are still tied after applying the tiebreakers,  all tied competitors will take a fourth jump at the last  height.   • If they still miss, the bar will go down one increment  where they will again',
        'text',
        583,
        12
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 15 --- IndIvIdual Games and sports I 49 Activity 4.13 Given below the names of various events in one column. You have  to identify the category of events each of these belongs to. Tick off  in the appropriate column before the sports event. The category of  one is marked as an example. Changes Categories of Sports Events Running Jumping Throwing Pole Vault Middle and Long Distance  Run Long and High Jump Shot Put Hurdle Race Javelin Sprints Triple Jump Discus Relays Hammer Some Athletic World Records: Men (As on 01.06.2019) Sr  No. Events Time/  distance Men Country Date 1. 100 m 9.58 sec Usain Bolt Jamaica 16 Aug.  2009 2. 200 m 19.19 sec Usain Bolt Jamaica 20 Aug.  2009 3. 400 m 43.03 sec Wayde Van  Niekerk RSA 14 Aug.  2016 4. 800 m 1:40.91 David  Rudisha Ken 9 Aug.  2012 5. 1500 m 3:26:00 Hicham El  Guerrouj Morocco 14 July  1998',
        'example',
        213,
        15
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '6. Long',
        ARRAY[]::text[],
        15,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Jump 8.95 m Mike Powel USA 30 Aug.  1991',
        'text',
        10,
        15
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '7. Triple',
        ARRAY[]::text[],
        15,
        15
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Jump 18.29 m Jonathan  Edwards Great  Britain 7 Aug.  1995',
        'text',
        14,
        15
    );

END $$;

-- Book 20/29: Yoga for HealtHY...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Interlock the fingers and turn the palms upward.',
        ARRAY[]::text[],
        7,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Activity 8.6 Shreya is an outgoing and  independent girl. She does  not like to be dictated by  her parents. Her parents  are worried as they think  that she has been wasting  her time and energy on  futile, trivial and useless  things. One day, her  parents asked her to  study while she wanted  to finish the novel which  she was reading.  At this,  Shreya lost her temper  and started shouting at  her parents. Questions  • Was Shreya’s behaviour  towards her parents  appropriate?   • Were her attitude and  thinking responsible for  this kind of behaviour?  • Suggest how she  should have behaved. Chap-8_New.indd   138 8/24/2020   11:42:31 AM 2024-25  --- Page 7 --- Yoga for HealtHY living 139',
        'exercise',
        175,
        8
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. Exhaling, bend from the waist towards the right side.',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Maintain this position comfortably for 5 ‑10 seconds  in the beginning.',
        'text',
        17,
        8
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '6. Repeat it from the left side as well.',
        ARRAY[]::text[],
        8,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Fig. 8.1: Hastottanasana Remember the following points Dos Don’ts  • Bend from the waist only.  • Stretch the arms up as much  as possible.  • Avoid bending forward. Benefits  • It relaxes the whole body.  • It relieves pain in the neck, shoulders and arms.   • It is beneficial for increasing the height of growing  children.  • It increases flexibility of the spine. Limitation  • This asana should not be performed in case of hernia,  abdominal inflammation. Padahastasana Padahastasana consists of three words: pada, hasta and  asana. In Sanskrit pada means ‘feet’, hasta means ‘arms’  and asana means ‘posture’. In this asana, the hands are  brought near the feet, hence it is called Padahastasana.   It strengthens the organs located in the abdominal area and  improves  their functioning.  Fig. 8.2: Padahastasana  Chap-8_New.indd   139 8/24/2020   11:42:33 AM 2024-25  --- Page 8 --- HealtH and PHysical education - class X 140 Let us perform Padahastasana by following the steps given  below.',
        'text',
        250,
        9
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '1. Stand erect, keep both feet together with hands beside',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the body. Balance weight of the body on the sole of  the feet.',
        'text',
        15,
        9
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '2. Inhaling, raise both arms above the head and stretch',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'them up.',
        'text',
        2,
        9
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '3. While exhaling, bend forward from the waist. Place',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the palms on the floor beside the feet or touch the feet  with palms.',
        'text',
        17,
        9
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '5. To come back,  slowly come to the standing position',
        ARRAY[]::text[],
        9,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'keeping your arms up over the head. Then slowly  bring the arms down to the starting position. Remember the following points Dos Don’ts  • Keep the legs straight.  • Keep the arms straight and bring them  down along the head while bending down  from the waist.   • Do not bend the knees. Benefits  • It improves digestion.   • Liver and spleen are activated by this asana.  • Abdominal muscles are toned by this asana.   • It improves circulation of blood to the head and upper  region of the body.  • It increases the flexibility of the legs’ muscles. Limitations  • In case of severe backache and high blood pressure one  should avoid this asana. Trikonasana Trikonasana is made of two  words— trikona and asana.  Trikona in Sanskrit means  ‘triangle’. In this asana, the  body assumes the shape  of a triangle, hence it is  named Trikonasana. This  asana helps to manage  stress by strengthening the  abdominal organs and the  muscles in legs, trunk and  buttocks. Fig. 8.3: Trikonasana Chap-8_New.indd   140 8/24/2020   11:42:35 AM 2024-25  --- Page 9 --- Yoga for HealtHY living 141 Let us perform Trikonasana by following the steps given  below.',
        'text',
        287,
        10
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '1. Stand erect with legs together, hands by the side of',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the thighs.',
        'text',
        2,
        10
    );

    -- Chapter 14
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        14,
        '3. Raise the arms sideways and bring them to shoulder',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'level, parallel to the floor, so that they are in one  straight line.',
        'text',
        17,
        10
    );

    -- Chapter 16
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        16,
        '5. Bend from the waist to the right side, taking care not',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'to bend the body forward.',
        'text',
        6,
        10
    );

END $$;

-- Book 21/29: It has been found that these asanas develop...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Give one example to show that organ systems work in unison.',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'You may mention two or more organ systems to support your  point.',
        'text',
        16,
        11
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Ravi is a good athlete. Give one permanent effect of being an atlete',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'on of systems his muscular system, and respiratory system.  3. “Physical activities are necessary for developing a healthy  body and healthy mind.” Give two examples in support of this  statement.',
        'example',
        49,
        11
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '4. Complete the sentence —',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'The respiratory system gets positively affected by undertaking  yoga exercises regularly because __________________.',
        'exercise',
        29,
        11
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '5. Mention two changes that take place in each of the circulatory',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'and respiratory systems due to regular physical activities.',
        'text',
        14,
        11
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '6. Some of your friends avoid physical activity. Other friends are',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'always eager to participate in physical activities. Prepare a health  profile of your friends who indulge in games and yoga regularly.  Indicate what physical activities they undertake regularly. What  is the time duration?  How do those who are physically active  get motivation to play some games or exercise regularly? Present  your findings in class and allow your peers in the classroom to  add to the profiles you prepared. Chap-2.indd   22 8/24/2020   1:09:29 PM 2024-25',
        'exercise',
        119,
        12
    );

END $$;

-- Book 22/29: What is Physical Education...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. What is Coronavirus?',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Covid 19 is the infectious disease caused by the recently discovered coronavirus. This  new virus and disease were unknown before the outbreak began in Wuhan, China, in  December 2019. That is why it is called the Novel (new) Coronavirus (NCoV).',
        'text',
        61,
        4
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. What are the symptoms?',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'The most common symptoms of Coronavirus are fever, cough and difficulty in breathing.  Some patients may have aches and pains, nasal congestion, runny nose, sore throat or  diarrhea. These symptoms are usually mild and begin gradually. Some people become  infected but don’t develop any symptoms and dont’t feel unwell. Most people (about  80%) recover from the disease without needing special treatment. People with fever  cough and difficulty in breathing should seek medical attention immediately.',
        'text',
        125,
        4
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. How does Coronavirus spread?',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'People can catch Coronavirus from others who have the virus. The disease can  spread from person to person through small droplets from the nose or mouth which  are spread when a person with Coronavirus coughs or exhales. These droplets land  on objects and surfaces around the person. Other people then catch Coronavirus  by first touching these objects or surfaces, then touching their eyes, nose or mouth.  People can also catch Coronavirus if they breathe in from a person with Coronavirus  who coughs out or exhales droplets. This is why it is important to stay more than   1 meter away from a person who is sick.',
        'text',
        154,
        4
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. How to prevent Coronavirus?',
        ARRAY[]::text[],
        4,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Wash your hands with soap  water regularly. Throw used tissues into  closed bins immediately after  use. If soap and water is not  available, use hand sanitiser  with at least 60 per cent alcohol. Cover your nose and mouth  with handkerchief/tissue while  sneezing and coughing. Wash hands before touching  eyes, nose and mouth. Avoid mass gathering and  crowded places. For more information, refer to —  https://www.mohfw.gov.in/pdf/FacilitatorGuideCOVID19_27%20March.pdf Chap-1.indd   4 8/28/2020   4:45:57 PM 2024-25',
        'text',
        129,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 5 --- Physical Education: RElationshiP with othER subjEcts 5 Contents related to Yoga also form a part of this area.  Common Yogic Practices are Yama and Niyama, Asana ,  Pranayama, Pratyahara, Bandha Mudra, Shatkarma/Kriya,  Meditation. It includes Ahara (Food), Vihara (Relaxation),  Achara (Conduct), Vichara (Thinking), Vyavahara (Behaviour). Theories of training are also included in this subject area.  These are principles  and characteristics of sports training,  methods of sports training, training load, warming up,  cooling down, aerobic and anaerobic activities, calisthenics  and rhythmic exercises, specific training program for  development of various motor qualities, techniques, tactics  and talent identification. It is also important to understand  the difference between play, games and sports. Play, GamEs and sPort Though these terms are used interchangeably, these are  actually different.  Play Play is spontaneous. It is usually a creative activity but has  its own limitation and space. One plays voluntarily for fun  and pleasure. Play, however, is a broad area which includes  both games and sports. The distinctive features of play are  that they are free, separate, uncertain, governed by self rules  and creative. Games Generally the word games and sports are used together.   A game is an activity involving more players, defined by a goal  that the players tries to reach, and some set rules to play.  By masses, games are played primarily for entertainment  or enjoyment. The difference of purpose differentiates sport  from game, combined with the notion of individual or team  skill. Games are also played on the basis of a set of rules.   A game is defined as a goal that the players try to achieve. A  person who participates in a game is known as a player.  Sport A sport is a physical activity carried out under an agreed set  of rules, for competition or self-enjoyment or a combination  of these.  Sport are the kind of activities in which similar ',
        'example',
        666,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 6 --- HealtH and PHysical education - class X 6 rElationshi P of hEalth and Physical   Education  With othEr disciPlinEs of  KnoWlEdGE Health and Physical Education (HPE) classes provide space  for exploring new ideas related to personal and community  health. These ideas might then be used by students in various  other fields of learning, such as, arts, science, civics and  citizenship, communication, design, creativity and technology  and languages (english, hindi and other regional languages),  humanities (e.g. history, geography, economics, etc.),  information and communication technology and psychology. Art Health and physical education teachers can incorporate  activities related to performing arts, drawing, painting,  dance, drama, media, music and visual communication into  their programs. These involve both fine motor skills and  whole body movement including rhythmic movement. As  body movements are part of both arts practice and health  and physical education, these promote health knowledge,  understanding of the body and lead to physical fitness and  enhancing of creative skills at the same time.  Science The human body is a common concern of both science and  health and physical education. In science, students study the  human body from the cellular level to the systems level, with  a focus on anatomy and physiology. In health and physical  education learning is focused on the requirements for good  health and the promotion of a healthy body. Students gain  an understanding of the role of physical and yogic activities  in ensuring good health and can link the functioning of the  musculo-skeletal, digestive, endocrine and nervous systems  studied in science, for the promotion of the physical, social,  mental and emotional health of individuals within a society.  Students consider it their personal responsibilities to discuss  and adopt health issues, both in relation to their own safety  and well-being, as well as to the safety and well-being of',
        'example',
        614,
        4
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. What is the contribution of science subjects to physical education?',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '3. “Although physical education uses content from several  disciplines, it is fast emerging as a discipline.” Write two  arguments favouring this statement.   (a) _______________________    (b) _______________________',
        'text',
        54,
        11
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '4. Who is a physically fit person?',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'II. Short Answer Questions',
        'exercise',
        6,
        11
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '1. Should physical education and sports be an integral part of',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'learning? Justify your answer. Give at least three reasons.  2. “All sports can be games, but not all games can be sports” Give at  least two arguments for or against the statement.   (a) _______________________    (b) _______________________ assEssmEnt Chap-1.indd   10 8/28/2020   4:45:57 PM 2024-25',
        'text',
        75,
        12
    );

END $$;

-- Book 23/29: Safety at the Work Place...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '6. Rodenticides',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '• Concentrate on work and avoid talking.  • Switch off electricity if the machine is not in use.  • Keep extra or spare parts carefully in proper places so  that they do not fall on any one.   • Avoid touching the moving parts of any machine.   This may tear-off the skin or cause burn due to heat. Certain safety equipment and gadgets are used in various areas —  • Helmets  • Spectacles  • Gloves  • Apron  • Insulating Boots  • Face Mask Handling insecticides  Insecticides are chemicals or herbs to kill or drive away  household and agriculture pests like rats, cockroaches, etc.   While they are safe to use if proper instructions are followed  but carelessness may cause serious accidents. Common insecticides are —',
        'text',
        180,
        2
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '2. tablets kept in grain containers to control grain',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'insects.',
        'text',
        2,
        2
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '3. naphthalene balls – used in cupboards and drawers',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'to preserve clothes from clothes moth.  Certain dos and don’ts for safety while using insecticides  are —',
        'text',
        26,
        2
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '3. insecticide tablets in grain containers',
        ARRAY[]::text[],
        2,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Household insecticides  • Spray cans should be kept away from children and  destroyed after use.  • Keep the nozzle of the insecticide container away from  children.  • Container used for spray need to be shaken well  before use otherwise the liquid content may spoil  your hand.  • One should read the information brochure attached  with container and avoid frequent use of sprays.  • One should not keep the  windows and doors closed for  long after the spray. Activity 10.1  • Enlist and paste  pictures of the safety  equipment’s  or gadgets  of any five sports of  your choice.  • Name the tablets kept  in grain containers to  control grain insect.  • Enlist five household  insecticides. Chap-10.indd   182 8/24/2020   11:45:08 AM 2024-25  --- Page 3 --- Safety MeaSureS for HealtHy living 183  • If accidently sprayed on your body parts, immediately  wash with plenty of water and soap.  • If pesticide is accidently sprayed on your clothes,   remove them immediately.  • Do not use if any member of your family suffers from  allergy and asthma. Agriculture insecticide In addition to the precautions mentioned above, remember  to —  • cover your body parts with a dress used for this  purpose. Wash this thoroughly after every scheduled  spray and do not use it if not washed and dried. It can  cause serious insecticide poisoning.  • cover your eyes and face with spectacles and mask.  • take a bath as soon as possible after the spray. Insecticide tablets in grain containers  • Always use the tablets after tying in a cloth piece.   • Wash hands with soap and water as soon as you touch  the tablets.  • Keep the tablets out of reach of children.  • Remove the tablets before boiling rice or giving wheat  for grinding.  • Shift the patient to the hospital if a tablet is ingested  accidently. Handling electricity and electric gadgets Electricity is a boon for modern civilisation.  However, if  due care is not taken while handling electricity and electric  gadgets, it may prove fatal.',
        'text',
        679,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- HealtH and PHysical education - class X 184  • Never try to repair the gadgets yourselves, if you are  not trained.  • Always switch the electric supply off before and after  using the gadgets.  • Never be in close proximity with electric wires, fire and  water. Always use dry sand in case of fire to douse it.  • Always get the servicing of the electrical gadgets done  as per schedule.  • Use government approved (ISI mark), electrical gadgets   and fittings. firSt aid You must have met with certain emergency situations  when you needed urgent medical treatment but it was not   available immediately. You might have seen someone  helping a person by providing first aid and then in reaching   the hospital.  What is First Aid? First aid is the immediate and essential temporary care  given to a wounded, injured or sick person, in an emergency  situation to reduce the suffering of the patient, prevent  further complication of injury or sickness before availing  professional medical assistance. Priorities of First Aid Remember the following priorities before giving first aid —',
        'text',
        275,
        4
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '1. Maintain ABC',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a) Airway: Clear the airway if blocked  b) Breathing: Check breathing and give artificial  respiration if necessary.  c) Circulation: Give chest compressions if heart has  stopped',
        'text',
        44,
        4
    );

    -- Chapter 19
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        19,
        '7. Transfer the patient to the nearest health centre',
        ARRAY[]::text[],
        4,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'When is First Aid required? There are many conditions where first aid is required. You  have studied a few in Class IX. Activity 10.2  • Discuss with your  classmates the need of  first aid.  • List the most essential  items in a First Aid Box  and draw a diagram. Do You Know? C-A-B means —  • compression  • airways  • breathing It helps to perform CPR. Chap-10.indd   184 8/24/2020   11:45:08 AM 2024-25  --- Page 5 --- Safety MeaSureS for HealtHy living 185 The can be following situations may arise where you  might need to provide first aid — The person is unconscious and not breathing Here CPR (Cardio Pulmonary Resuscitation) is required. It  is a life saving measure used when the heart and breathing  has stopped. Starting CPR within three minutes of heart stoppage is  very important or else brain will be damaged. Cardio Pulmonary Resuscitation (CPR): Circulation is  maintained by chest compressions. Draw a line between the  two nipples and keep the heel of the hand over the centre  of this line. Place the other hand over it and give chest  compressions pressing down the breast bone 1.5 to 2 inches. Fig. 10.1: Giving chest compressions The ratio of chest compressions to breathing should be  30:2 (i.e. 30 chest compressions and 2 artificial breaths per  minute) as we have to provide a heart rate of approximately  100 beats per minute. Open the airway: The  airway is cleared by finger   sweep if required. Any foreign  body, secretion, food, broken  teeth or tongue falling back are  removed. The airway is kept open by  tilting the head backwards and  lifting the chin upwards. Fig. 10.2: Head tilt  and chin lift Do You Know?  • CPR (Cardio Pulmonary  Resuscitation) must  be given soon after  breathing has stopped.  • If you are untrained  then give CPR only  through hands for  100-120 per minute  and continue until  signs of movements  or medical help has  arrived. Activity 10.3 Observe the activity  perform by teacher  and do activity under  the supervision of the  te',
        'text',
        536,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 6 --- HealtH and PHysical education - class X 186 Breathing: Breathing is artificially conducted by mouth  to mouth technique. Keep your handkerchief over the mouth  of the unconscious person. Pinch the nose of the person with  one hand while tilting the head backwards and lifting the  chin upwards. Continue CPR till either the person is revived or medical  help arrives. The person is unconscious and  breathing Place the unconscious casualty in recovery position as  explained in Fig. 10.4.  • Extend the arm nearest up alongside the person’s head.   • Bring the other arm across the person’s chest and place  the back of the hand against the cheek.   • Grasp the leg just above the knee and pull it up so that  the foot is flat on the ground.   • Roll the person far enough for the face to be angled  forward.   • Position the elbow and knee to help stabilise the head  and body Medicine S and their effectS on individual S Medicines are chemicals and biochemical substances which  are used to prevent, cure or correct deficiency disorders in the   body. Many substances have been used as medicines since  ages in one or the other form, but modern times have seen a  tremendous growth in terms of types and usage of medicines.   While medicines are used to treat diseases and can be life  saving, they can harm the body if not used correctly. Medicines are used in the form of injections, tablets,  syrups, creams, lotions, solutions, drops, powder, sprays  and straps. Medicines affect us in many ways.  Some of the common  ways are —  • Analgesics — reducing pain and in fever.  • Antibodies — killing or weakening microbes and infections.  • Lotions — in burns and allergies, for soothing effect.  • Supplements — correcting deficiencies due to vitamins,  nutrients.  • Antipsychotic drugs — modifying the body’s response,  psychological disorders.  • Vaccines and inoculations and immunisation —  Protecting and preventing.  • Hormones — supporting physiological functions.  • Herba',
        'text',
        621,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 7 --- Safety MeaSureS for HealtHy living 187 mechanism of action of the medicine or if taken more than  the recommended dose. Thus, it is important to take the  medicines only under medical supervision. Precautions while taking medicines Medicines need to be used in the required dose so that they  should not only have the desired effect but also prevent  undesired side effects. Some of the precautions while taking  medicines are —  • Take medicines only if prescribed by a doctor. Self  medication may be dangerous.  • Take the recommended dose of the medicine and at  the prescribed interval. Only then there will be desired  effects. One should never adjust the dose oneself.  • Do not minimise or exceed the dose and frequency of  taking the medicine. This can cause undesirable effects  • Adult dose of medicines should not be given to children.  There are special forms and doses of medicines for  children. Keep all medicines out of reach of children.  Ingestion by them may cause emergency.  • Store the medicines away from extreme temperature  and sunlight.  • Always check the expiry date of medicines before  consumption.  • Use a  full cup of water and drink standing upright  while swallowing a tablet.  • Do not take any medicine on an empty stomach unless  prescribed by the doctor.  • Keep a list of medicines one is allergic to. Always tell  the doctor about such medicine(s).   • Always visit the doctor if one experiences any unusual  symptom while taking the prescribed medicines.  • It is important that the medicine should be taken  regularly for the entire period and duration as prescribed  by the doctor. Otherwise the disease due to infections  can return.  SubStance (drug) abuSe  In an effort to establish their identity and desire for  experimentation, adolescents often try out new things.  Also they are more amenable to external influences, such   as, the media and peers. This makes them more vulnerable  to substance misuse, especially when they do not h',
        'text',
        592,
        4
    );

    -- Chapter 20
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        20,
        '1. State three precautions one should take while working with a',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'machine.',
        'text',
        2,
        12
    );

    -- Chapter 21
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        21,
        '2. While opening a bottle containing liquid insecticide, the liquid fell',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'on your clothes. How can you prevent its harmful effects on you?',
        'text',
        16,
        12
    );

    -- Chapter 22
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        22,
        '3. Electrical gadgets are used in all households. What are the',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'requirements of these gadgets which will prevent you from getting  an electric shock?',
        'text',
        21,
        12
    );

    -- Chapter 23
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        23,
        '4. What do you understand by First Aid? What are the priorities you',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'should keep in mind before administering first aid?',
        'text',
        12,
        12
    );

END $$;

-- Book 24/29: Table Tennis, Tennis, Swimming and Combative Sport...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Grip: Holding grip of a badminton racket is the',
        ARRAY[]::text[],
        4,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'foundation of playing this game. Holding the racket  wrongly will reduce the power and accuracy of the  stroke. The shots will be limited. A player needs to  learn how to change grip quickly during games. Below  are the two basic types of badminton grips.  Forehand grip  • This grip is used to hit shots on the forehand side of the  body and around the head shots.   • In this a player holds the racket head in the non-playing  hand, keeping the handle points towards the body. The  face of the racket perpendicular to the floor.   • The player places the playing hand on the handle  just like shaking hands with it, it is like a V shape in  between thumb and index finger.   • For flexibility, the racket handle rest loosely in the fingers.   • In order to increase control and accuracy while serving  and hitting from the forecourt and mid court, the grip  is shortened and placed nearer to the shaft. Angle 1 Angle 2 Angle 3 Fig. 5.2: Forehand grip Chap-5.indd   55 8/24/2020   11:38:29 AM 2024-25  --- Page 5 --- HealtH and PHysical education - class X 56 Backhand grip  • While playing backhand grip, shots is hit from   backhand (left) side of player’s body.   • The player holds the racket in the same way as it was  held in forehand grip.   • The player turns the racket anti-clockwise so that the  V shape moves leftwards.   • The player places the thumb against the back of the  handle for greater leverage and power.   • The other techniques are the same as in forehand grip. Angle 1 Angle 3 Angle 2 Fig. 5.3: Backhand grip',
        'text',
        383,
        5
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Service: There are basically three types of serves —',
        ARRAY[]::text[],
        5,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'high, low and flat. High service is the most basic of  all strokes. One needs to learn this first when one  starts playing the game. You need to concentrate on  the following three broad points while delivering the  high service.  • Stance: To deliver the high service, the player has  to take a position about two feet from the short  service line and about six inches from the centre  line.   The player has to make sure not to touch the  centre line as it will be called a touch fault. The  player has to stand comfortably with both feet  spread apart and parallel to each other and take  the initial serving position. At this stage, the full  weight of the body is on the back foot.   • Point of Contact: As one starts the forward  movement of the racket, slowly start shifting the  weight from the back foot to the front foot. The  player then drops the shuttle and hit it high and  Chap-5.indd   56 8/24/2020   11:38:34 AM 2024-25  --- Page 6 --- IndIvIdual Games and sports II 57 back to the baseline. The player must make sure  that the point of contact is always below the waist.  • Follow-through: Once the service is delivered, the  player continues to swing the racket right across  the left shoulder (or right shoulder if the player is  left-handed). This is called the follow through.',
        'text',
        324,
        5
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Return of Service: This stroke plays a crucial part in',
        ARRAY[]::text[],
        5,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'a rally because good return of serve allows a player to  dictate terms and control a rally till the point is won.  However weak return of serve will allow the opponent  to go on the offensive. While receiving the serve to hit  the shuttle, normally players stand in the centre of the  court with the left foot forward and place the weight  of the body more on the front foot. It will help the  player to receive all types of serves i.e. high, low and  flick. In fact, players are advised to take the stance  closer to the short service because in high serve the  shuttle remains in the air for a longer duration. On  a high serve, a player has the choice of playing an  attacking clear, drop shot, smash or a half smash.  Similarly, on a low serve, a player can flick, push or  lift the shuttle to the baseline. It is important to try  to meet the shuttle as close to the net as possible so  that the receiver has more options available to choose   the shots.  Gymnastics Gymnastics is a sport that involves physical movements  in a sequence. It requires physical strength, balance,  coordination, endurance, flexibility and body control. It  often involves dance moves, flips, twists, jumps and other  moves. It helps children to develop physical coordination and  motor skills, proper use of balance develop a good sense of  precision and timing. It can be performed as a way to stay fit  or specifically to compete in events locally, nationally as well  as internationally.  History Gymnastics was developed for fitness and beauty practices  by the ancient Greeks. It included skills for mounting  and dismounting a horse, and circus performance skills.   The Greeks used gymnastics as military training. However,  in the late eighteenth and early nineteenth century, the  German physical educators created exercises for boys  and young men on apparatus. Their design is considered  as modern gymnastics. The Federation of International  Gymnastics was founded in 1881. By the end of the  Chap-5.i',
        'exercise',
        710,
        6
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '1. Events for men',
        ARRAY[]::text[],
        7,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Floor Exercise: For this event a 12×12 square  spring floor is required. A series of tumbling  passes are performed to demonstrate flexibility,  strength, and balance. The gymnast must also  show strength skills, including circles, scales, and  press handstands. Men’s floor routines usually  have four passes that will total between 50–70  seconds and are performed without music. As per  rules, male gymnasts touch each corner of the  floor at least once during their routine.  (ii) Pommel Horse: A typical pommel horse exercise  involves both single leg and double leg skills.  Single leg skills are generally found in the form of  scissors, often done on the pommels. Double leg  skill, however, is the main staple of this event.  The gymnast swings both legs in a circular motion  (clockwise or counterclockwise depending on  preference) and performs such skills on all parts  of the apparatus. Gymnasts will often include  variations on a typical circling skill by turning or  by straddling their legs.  This makes the exercises  of gymnast more challenging. A gymnast performs  a dismount, either by swinging his body over the  horse or landing after a handstand.  (iii) Still Rings: The rings are attached to a wire cable  from a point to 5.75 meters from the floor, and  adjusted in height so, that the gymnast has room  to hang freely and swing. The gymnast performs a  Fig. 5.4: Pommel horse Fig. 5.5: Vault Chap-5.indd   58 8/24/2020   11:38:35 AM 2024-25  --- Page 8 --- IndIvIdual Games and sports II 59 nineteenth century, men’s gymnastics competition was  popular enough to be included in the first “Modern” Olympic  Games in 1896 and women gymnasts were included in  Olympic Games in 1986. The first world cup in gymnastics  was organised in 1975. Forms of gymnastics The major forms of gymnastics are: Artistic gymnastics,  Rhythmic gymnastics, Trampolining, Tumbling and Acrobatic  Gymnastics. Artistic gymnastics Artistic gymnastics is usually divided into Men’s and Women’s  ',
        'exercise',
        565,
        8
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. Events for men',
        ARRAY[]::text[],
        8,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Floor Exercise: For this event a 12×12 square  spring floor is required. A series of tumbling  passes are performed to demonstrate flexibility,  strength, and balance. The gymnast must also  show strength skills, including circles, scales, and  press handstands. Men’s floor routines usually  have four passes that will total between 50–70  seconds and are performed without music. As per  rules, male gymnasts touch each corner of the  floor at least once during their routine.  (ii) Pommel Horse: A typical pommel horse exercise  involves both single leg and double leg skills.  Single leg skills are generally found in the form of  scissors, often done on the pommels. Double leg  skill, however, is the main staple of this event.  The gymnast swings both legs in a circular motion  (clockwise or counterclockwise depending on  preference) and performs such skills on all parts  of the apparatus. Gymnasts will often include  variations on a typical circling skill by turning or  by straddling their legs.  This makes the exercises  of gymnast more challenging. A gymnast performs  a dismount, either by swinging his body over the  horse or landing after a handstand.  (iii) Still Rings: The rings are attached to a wire cable  from a point to 5.75 meters from the floor, and  adjusted in height so, that the gymnast has room  to hang freely and swing. The gymnast performs a  Fig. 5.4: Pommel horse Fig. 5.5: Vault routine demonstrating balance, strength, power,  and dynamic motion while preventing the rings  themselves from swinging. At least one static  strength move is required, but some gymnast  includes two or three strenghts. A routine should  have a dismount at the end of routine.  (iv) Vault: In this, the gymnasts sprint down a runway,  which is a maximum of 25 meters in length, before  hurdling onto a spring board. The body position is  maintained while “punching” (blocking using only a  shoulder movement) the vaulting board. The  gymnast then rotates to a standing positio',
        'exercise',
        761,
        9
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. Events for women',
        ARRAY[]::text[],
        9,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(i) Floor Exercise: The floor event occurs on a carpeted  12m × 12m square, usually consisting of hard foam  over a layer of plywood, which is supported by  springs or foam blocks generally called a “spring”  floor. Female gymnasts perform a choreographed  routine of 50 to 70 seconds in this event. The  routine should consist of tumbling lines, series of  jumps, dance elements, acrobatic skills, and turns. Fig. 5.6: Parallel bars Chap-5.indd   59 8/24/2020   11:38:36 AM 2024-25  --- Page 9 --- HealtH and PHysical education - class X 60  (ii) Vault: In the vaulting events gymnasts sprint  down a 25 meters (82 ft) runway, jump onto or  perform a round off entry onto a beat board or  spring board, land momentarily, inverted on the  hands on the vaulting horse or vaulting table.  Then they spring off this platform to a two footed  landing. Every gymnast starts at a different point  on the vault runway depending on her height and  strength. The post flight segment may include one  or more multiple somersaults, and/or twisting  movements. In vaults with round-off entries,  gymnasts “round-off” so that hands are on the  runway while the feet land on the springboard.  From the round-off position the gymnast travels  backwards as in a back handspring so that the  hands land on the vaulting platform (horse).   She then blocks off the vaulting platform into  various twisting and somersaulting combinations.  (iii) Uneven Bars: On the uneven bars (also known as  asymmetric bars), the gymnast performs a routine  on two horizontal bars set at different heights. The  height is generally fixed, but the width may be  adjusted. Gymnasts perform swinging, circling,  transitional, and release moves, as well as moves  that pass through the handstand. Usually in higher  levels of gymnastics, leather grips are worn to ensure  that the gymnast maintains a grip on the bar, and  to protect the hands from blisters and tears.   (iv) Balance Beam: The gymnast performs a  choreographed routine fr',
        'exercise',
        586,
        10
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '3. Rhythmic gymnastics',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Only women compete in rhythmic gymnastics,  although there is a new version of this discipline  for men being pioneered in Japan. This combines  elements of ballet, gymnastics, dance and apparatus  manipulation. The sport involves the performance of  five separate routines with the use of five apparatus  – Ball, Ribbon, Hoop, Clubs, Rope on a floor area,  with a much greater emphasis on the aesthetic rather  than the acrobatic.  Fig. 5.7: Uneven bars Fig. 5.8: Balance beam Chap-5.indd   60 8/24/2020   11:38:37 AM 2024-25  --- Page 10 --- IndIvIdual Games and sports II 61',
        'text',
        144,
        10
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '4. Acrobatic gymnastics',
        ARRAY[]::text[],
        10,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Acrobatic gymnastics is one of the oldest  forms of organised physical activities,   and today it is being reorganised, revitalised by  changes and renewed interest. The International  Federation of Sports Acrobatics (IFSA) was founded  in Moscow in 1973. United States Sports Acrobatics  (USSA) was founded in 1975.  It was merged with  International Gymnastics federation (FIG) in 1999.  Sports Acrobatics was demonstration sports at the  2000 Olympics in Sydney. Now, it is an accepted  competitive sport. It is  very effective for the  development of physical fitness and graceful posture.   Acrobatic gymnastics is a group gymnastic discipline  for both men and women. Acrobats in groups of two,  three and four perform routines with the heads,  hands and feet of their partners. They may, subject to  regulations (e.g. instrumental), pick their own music.',
        'example',
        215,
        11
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '5. Tumbling and trampolining',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Tumbling, also known as power tumbling, is a  gymnastics sporting discipline which combines skills  of artistic gymnastics with those of trampolining. It  is sometimes practiced on a 25-meter-long spring  track, competitors both male and female, perform two  passes, each containing eight skills, along the track. taBle tennis Table Tennis is also known as Ping-Pong, in which two or  four players participate using table-tennis rackets on a plain  hard surface called Table, which is divided by a net. History The game of Table Tennis probably descended from the  game of ‘Royal Tennis’, which was played in the medieval  era (12th century A.D.) Table Tennis was probably played  with improvised equipment in England during the last  quarter of 19th century. Evidence show that David Foster  in England patented an action game of Tennis on Table in',
        'text',
        212,
        11
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '1890. One year later John Jaques came out with a game',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'called Gossima. In 1900, a celluloid ball was introduced by  Jaques and the name was given as ‘Ping-Pong’. Table Tennis  is controlled by ITTF (International Table Tennis Federation)  which was founded in 1926 with headquarters in Berlin. It  was introduced in Olympics in 1988 in Seoul, South Korea.  First World Championship of Table-Tennis was held in  London in 1926. TTFI (Table-Tennis Federation of India) was  formed in 1926 in Calcutta, now known as Kolkata. Chap-5.indd   61 8/24/2020   11:38:37 AM 2024-25  --- Page 11 --- HealtH and PHysical education - class X 62 9 ft 6 Inch Net Height 5 ft2.5 ft Fig. 5.9: Table tennis Rules  • Table Tennis table is 9 ft. (2.74 meter) long, 5 ft.  (1.525 meter) wide and 2.5 ft.(76 centimeter) high.  • Net is 6 inches (15 centimeter) high from the table.   • A game of Table Tennis is played up to 11 points.  • A player or the pair who first scores 11 points wins  unless both players or pairs score 10 points then the  game is won by the player or pairs who gains 2 point  lead.  • If a player causes the table to move while the ball is in  play, player loses a point.  • A player shall score a point if the opponent’s free hand  touches the playing surface or the net assembly. Fundamental techniques',
        'text',
        313,
        12
    );

END $$;

-- Book 25/29: Social HealtH...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. State situations that made Ravi think his grandfather',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'was alienating others.',
        'text',
        5,
        2
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Say yes or no',
        ARRAY[]::text[],
        2,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(a) Do you agree that physical, mental and social health  are interrelated?    (b) Living with others harmoniously  requires a person  to be socially healthy. State the reason for your  choice. Activity 12.2  • You are in a tricky situation. Your best friend had a fight with  another friend and you have seen that your best friend is at  fault. You are asked to intervene to  bring back peace. Will you  announce that the cause of the fight was your best friend?  This may become a source of annoyance to your best friend  but if you did, that is Justice.  • If you help, the two boys become friends again, that is  fraternity.Chap-12.indd   206 8/24/2020   11:46:39 AM 2024-25  --- Page 3 --- Social HealtH 207  • Your friend Arun noticed that food was being distributed free  of charge on the footpath. A boy wearing tattered dirty clothes  was repeatedly being sent to the end of the queue. Arun held  the boy’s hand and insisted that the boy be given the food  packet then and there and not at the end. Arun believed in  Equality of opportunity for all.  • If you listen carefully to others opinions on a subject even  if they do not match yours and try to understand others’  viewpoints, you believe in liberty. Read the preamble to the constitution of India given at the  beginning of all NCERT text books. It is reprinted here for  you. (photocopy of preamble of constitution). Fig. 12.1: Preamble to the Constitution of India Chap-12.indd   207 8/24/2020   11:46:39 AM 2024-25',
        'text',
        371,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- HealtH and PHysical education - class X 208 Everyone is a member of a social group and everyone  is part of their peer group, family and kin, community,  city, region and country, as well as the physical and  biological environment. Would you agree that the country’s  constitution provides for Justice, Liberty, Equality and  Fraternity which should be adopted in life for living happily  and having consideration for all others in the group? Let us  understand these four terms of our constitution which are  directly related to “social health of a person or a country”,  and then try to define social health. In other words, if one is  socially healthy, than will be able to develop interpersonal  relations, through maintaining equality, fraternity and  justice. Let us now try and define social health. Definition  of ‘social health’ Social health may be defined as the ability to form satisfying  interpersonal relationships with others.  One who is able to  make positive relationships and acquires the ability to adapt  in different social situations and act appropriately as per  the situation concerned, and can be called a socially healthy  person.  Need for developing social health Primitive humans were hunter-gatherers, who lived in small  groups or clusters and spent their lives at individual levels.  Around 10,000 years ago, they moved near rivers to grow  their own food and began to live together. With the passage  of time, they started to live in a society and developed a  language for interaction with each other. As ‘human society’  progressed, an individual became part of many social groups  for example a member of a peer group, a family and kin, a class  in school, a native of a region and a citizen of one’s country.  Social changes occur from time to time and many societies  lay down norms and values for group living. Urbanisation  has brought about many changes which are different from  traditional rural societies. Social attributes, of people how',
        'example',
        612,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 5 --- Social HealtH 209 Role of teacher training institutes and other  organisations School teachers need a degree, diploma or certificates from a  teacher training institute. There are a number of organisation  concerned with school education. The syllabus of teacher  training courses should include the topics of important  issues for children of which health should be one.  Organisations such as NCERT, SCERT, DIET should  periodically organise workshops, publish journals and  provide inservice training programmes on health issues  including social health. Role of schools in promoting social health Schools have a very significant role to play in the promotion  of health and safety of children. They spend a lot of time  in school in early years. School environment forms ideal  setting for acquiring knowledge of healthy choices of food. It  is in school that they participate in physical activity through  sports, games, yoga, gymnastics, exercise and gain benefits  of each. School helps children to learn social skills which  assist in establishing lifelong healthy behavior. Children  learn team spirit and training in rules and regulations of  social wellbeing just as in the defense services, which are  inbuilt in training of defense service personnel, so they work  together as a team to protect our nation. In order to promote social health, the school should  have a positive environment where children mingle with  teachers, peer group and non-teaching staff without fear and  apprehensions. Teacher have a significant role in this regard. Role of teachers It is well known that teachers are the mentors and therefore,  the teacher training institutes should make training in  leadership and mentorship a part of teacher training. Also well  known saying that ‘example in better than precept’ Students  easily learn to be socially healthy if the teacher herself or  himself sets an example rather than lecture on social health.  A good teacher ensures that students grow',
        'example',
        642,
        5
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '3. Teachers should train students in learning life skills',
        ARRAY[]::text[],
        5,
        7
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'like —   a) empathy and self awareness  b) effective communication so that they develop  healthy Interpersonal relationships  c) problem-solving and decision-making to learn to  be stress free  d) creative and critical thinking  e) coping with stress and emotion. The above are absolutely essential for developing social  skills in order to be socially healthy. Social skills help a student to have a desirable self image  and self esteem and also self confidence. This makes children  acquire ability to live harmoniously in the society. Role of technology in building social health Technology has made communication convenient through  Mobiles, Skype, Facebook, Twitter, Instagram and E-mail  messages. Knowledge about different media can help to  develop the skills to access the appropriate media for  accurate information on a specific topic or issues. More  so, because media brings awareness, and provides access  to global knowledge and learning. But refrain from using  mobiles and viewing the T.V. for long periods as that tends  to be counter-productive and reduce interaction time with  others. This makes us socially withdrawn. Although media is  a source of information, all of it may not be true or reliable.  It is advisable to seek guidenes from a trusted adult while  accessing media and internet. Moreover, there is a need to  understand about real and fake news or information as these  affects our attitude and behavior. Role of students in building habits of social health Social health comes from social skills. A few important  guidelines for promoting social skills are outlined below.  (i) Building self awareness is an important skill: Practice  self-care by developing habits of cleanliness and  hygiene, keeping away from substance abuse,  engaging in physical activity and regularly consuming  a balanced diet.  (ii) Do not be blameful and judgmental: Remember when  you point a finger at others, three fingers of yours  point towards you. Hence indulge in knowing yours',
        'exercise',
        562,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 7 --- Social HealtH 211 child that if they were hit, they would feel the same  pain. That is empathy for others and leads to self   awareness.  (iii) Learn to identify your own mistakes: There is no harm  in saying sorry for a mistake and rectifying it. People  will have faith in you if you did so.  (iv) Make an effort to reconnect with old relationships and  friendships: The socially healthy person makes an  effort to contact and meet old friends, to remember  enjoyable periods of childhood which can be a good  way to beat stress and spend leisure time.   (v) Appreciate yourself and others: But never let your ego  rule your behaviour which can sometimes drive you  to lose a relationship.  (vi) Try and be respectful, positive and supportive towards  the needy, the physically and mentally challenged, the  downtrodden and those belonging to faith and cultures  other than yours. Lend an ear to others opinion. It  teaches tolerance. Tolerance and appreciation are  virtues in socially healthy individuals.  Role of family in inculcating social skills in young  family members The importance of family in inculcating social skills among,  children is paramount. Guardians or parents are the prime  teachers and caretakers who feed them healthy food and are  also their play mates. They have to be aware themselves to  be role model and make children appreciate as they grow.   The benefits of enjoying nutritious food and being aware  of a balanced diet is of paramount importance. Watching  of television for longer duration is bad for students.  Parents themselves have to be cautious in what they do  in front of children and how long they are in front of the  TV. However, at the same time good TV programmes are  an avenue for learning. Encourage them to indulge in  physical activity to build their muscles and bones. Fit body  and fitness depends primarily on proper diet and healthy  body and mind. The parents and elder family members  need to guide them in social skills. ',
        'text',
        623,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 8 --- HealtH and PHysical education - class X 212 What aRe life skills ? These are —  • Empathy: Is the ability to understand another’s feelings  in a particular situation.  • Self Awareness: Is the recognition of one’s character,  strengths, areas of growth, beliefs and values.  • Effective Communication: Is having skills of  communication that facilitate interaction with people  in positive ways.  • Interpersonal Relationships: Building relationships of  friendship and goodwill with all others.  • Problem solving: Is the ability to resolve challenges.  • Decision Making: Is the quality of analyzing problem to  find and act to reach an appropriate solution.  • Creative thinking: Is the ability to do something in a  novel manner.  • Critical Thinking: Is the capacity to analyse multiple  perspectives and objectively evaluate the same.  • Coping with Stress and emotional distress: These refer  to management and regulation of one’s emotions and  moments of stress. All these life skills help to develop desirable social health  and live happily in a society.',
        'exercise',
        269,
        7
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '1. The teacher needs to play an active role in discouraging',
        ARRAY[]::text[],
        7,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'her students from engaging in socially unhealthy  practices such as vindictive attitudes, selfishness,  jealousy and culture of hatred. For this, teacher has  to sacrifice time and energy. It is however, necessary  for a teacher and school authorities to understand  that more than finishing the syllabus and passing  exams, it is the teacher’s responsibility to build good  human beings. Home has a large role to play but  it has been the mission of teachers to contribute  towards grooming students into socially healthy  adults',
        'text',
        132,
        8
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '2. Another role of a teacher in inculcating ‘social health’',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'is to have a friendly, stress-free atmosphere in class.  This can happen if students are engaged in ‘group  activities’, especially activities for ‘experiential  learning’. Members of groups are reshuffled from  time to time for team activities so that students  may understand that it takes all kinds of people to  make the world and the socially healthy groups can  live in harmony despite differing in opinions. Group  activities build team spirit and remove boredom.  Chap-12.indd   212 8/24/2020   11:46:40 AM 2024-25  --- Page 9 --- Social HealtH 213 iDeas foR PRomoting  social health of  stuDents',
        'text',
        151,
        8
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '1. If there is a canteen, permit sale of healthy food',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'like fruits or fruit juices. School authorities should  be aware as to what is being sold for consumption  immediately outside school and permit only those  selling healthy eatables or low fat and healthy  snacks.',
        'text',
        53,
        8
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '3. Provide for examination and treatment of students',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'with poor health conditions, bad teeth and weak  vision. Organise health checks for them.',
        'text',
        22,
        8
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '4. Organise variety of co-curricular activities, and ensure',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'participation of maximum number of students, and  training them leadership as well as team spirit.',
        'text',
        24,
        8
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '5. Organise interclass sport and games competitions',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'and finally, a sport day and prize distribution for  encouragement.',
        'text',
        16,
        8
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '6. Include a games period every working day in the time',
        ARRAY[]::text[],
        8,
        8
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'table.',
        'text',
        1,
        8
    );

END $$;

-- Book 26/29: National Council of Educational Research and Train...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. National Institute of Education (NIE) undertakes',
        ARRAY[]::text[],
        1,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'research and development activities related to  pedagogical aspects of curriculum, instructional  materials and supplementary materials. It prepares  national curricular policy documents, develops  database and various types of materials and organises  in-service training for different target groups. Agencies And AwArds  Promoting HeAltH,  sPorts And YogA 13 Activity 13.1 Where is the headquarter  of NCERT located? Chap-13.indd   215 8/24/2020   12:27:35 PM 2024-25  --- Page 2 --- HealtH and PHysical education - class X 216 Do You Know? CBSE has started  competitive sports for all  private schools affiliated  to CBSE since 1988-89. Activity 13.2 Find out how many  clusters are taking part is  CBSE competitive sport.',
        'text',
        181,
        2
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Central Institute of Educational Technology CIET',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'is concerned with development of educational  technology, design and production of media software.  It holds programmes to build competencies of media  personnel and need-based researches. It evaluates  activities undertaken and studies carried out to assess  the effectiveness of materials and programmes.',
        'text',
        76,
        2
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Pandit Sunderlal Sharma Central Institute of',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Vocational Education (PSSCIVE) is located at Bhopal  and organises research, development, training and  extension programmes related to Work education and  Vocational education.',
        'text',
        44,
        2
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. Regional Institutes of Education (RIEs) are located at',
        ARRAY[]::text[],
        2,
        2
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Ajmer, Bhopal, Bhubaneswar and Mysore. The RIEs  cater to the needs of school education and teacher  education (pre-service and in-service education)  including those teachers educators in the States and  UTs under their respective jurisdictions. Besides  these, yet another regional institute, known as North- Eastern Regional Institute of Education (NERIE) is  located at Shillong.',
        'text',
        95,
        2
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '5. NCERT: Role in Health and Physical Education NCERT',
        ARRAY[]::text[],
        2,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'as an apex body includes functioning of Health and  Physical Education like all other subject areas. The  National Curriculum Framework (NCF-2005) prepared  by NCERT considers health and physical education a  compulsory subject from Class I to X and optional  subject at Classes XI and XII. As a follow up of NCF- 2005, NCERT has prepared syllabus on health and  physical education which has been approved by the  National Steering Committee set by the Government  of India. Health and Physical Education components  have also been included in the pre-service training  courses running at each RIE’s. It contributes to  the policy formulation process of the Central and  State governments related to Health and Physical  Education. CBSE Central Board of Secondary Education (CBSE) is the first  board of education that was set up in 1921 under jurisdiction  of Rajputana, Central India and Gwalior. Government of  India decided to set up a Joint Board in 1929 and it was  named as the ‘Board of High School and Intermediate  Education. Later in 1952, the constitution of the Board was  amended and it was named as ‘Central Board of Secondary  Education’. In 1962 the Board was reconstituted once again  with the objectives: (i) to serve the educational institutions  Chap-13.indd   216 8/24/2020   12:27:35 PM 2024-25',
        'text',
        329,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 3 --- Agencies And AwArd Promoting HeAltH, sPorts And YogA 217 more effectively (ii) to be responsive to the educational  needs of those students whose parents were employed in  the Central Government and had frequently transferable  jobs. The major functions of the CBSE have been to develop  curriculum for all the subjects at the secondary and higher  secondary levels, to conduct evaluation and examination  activities, to organise teacher training workshops, to develop  resource materials for teachers and students, to publish  some text books for secondary and senior secondary classes  and to monitor various academic projects. The CBSE has  been preparing syllabi on Health and Physical Education,  conducting competitive sport activities for schools affiliated  to it and promoting the transaction of Health and Physical  Education at secondary and higher secondary levels. It has  also been ensuring that the Comprehensive and Continuous  Evaluation (CCE) is focused on health and physical education  activities.  School education agencies in states We have found that there are government agencies at the  state level for preparing curriculam, training teachers and  other functionaries and evaluating the performance of  students. There is a State Council of Educational Research  and Training (SCERT) in almost all the major States. This  institution is responsible for preparation of syllabi and  textbooks for all the classes at primary and upper primary  stages. In some of the States and Union Territories, the State  Institutes of Education (SIE) or the Directorates of Education  perform these roles. All these institutions at the state level  perform these roles for the subject area of Health and Physical  Education also. Then there are State Boards of Education,  that are responsible for preparation of Syllabi and textbooks  and evaluation of students of all classes at secondary and  higher secondary stages. These institutions also conduct  in-service teacher tra',
        'text',
        735,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 4 --- HealtH and PHysical education - class X 218 The main objective to establish SAI was to upgrade the skills  of the budding sport talents in India. In order to attain this  objective 23 training centers spread over the entire  country  are functioning.  Through various schemes formulated for sub-junior,  junior and senior levels, it ensures that the enthusiasm  for sport is widened among different age groups of people.  SAI has also provided competitive exposures to the talented  sportpersons. Some of the SAI schemes formulated for the  promotion of sport in India include National Sport Talent  Contest. The Sport Projects Development Area and the Sport  Hostel Scheme. Besides, the Army Boys Sport Company  (ABSC) in association with the Indian Army authorities is also  run by SAI. SAI provides facilities like sport equipment for  the trainees, kit, stipend as well as coaches. Currently, there  are eight ABSCs all over India. Another scheme proposed by  SAI is called SAI Training Centers (STC). This Scheme has  been successful to a great extent, in fulfilling SAI’s objective  of spotting and nurturing sport talents. Another ambicious  schemes run by SAI are - Special Area Games (SAG), and  Centre of excellence (COX), producing high level National/ International sport. NSNIS After independence, on May 7, 1961 the National Institute  of Sport (NIS) was set up by the Government of India for  the development of sport at the Motibagh Palace of the then  Maharaja of Patiala. With the objective of developing sport  in the country on scientific lines and to train the coaches  in different sport disciplines. On January 23, 1973, it was  renamed as Netaji Subhas National Institute of Sport (NSNIS).  Presently, NSNIS Patiala is Asia’s one of the best Sport  Institute and is popularly known as the “Mecca” of Indian  Sport. It has produced coaches of high caliber and significantly  contributed in rendering their expertise and assistance in the  preparation of the nati',
        'text',
        716,
        2
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '5. Kaivalyadham Shriram Mahadevji Yoga Samiti,',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Lonavala, Pune',
        'text',
        3,
        6
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '7.  Swami Vivekananda Yoga Anusandhan Samsthana',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(SVYASA), Bengaluru',
        'text',
        4,
        6
    );

    -- Chapter 15
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        15,
        '10. Uttarakhand University of Sanskrit and Yogic',
        ARRAY[]::text[],
        6,
        6
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Sciences, Haridwar Additional information about above Yoga institutions  could be obtained from their respective websites. Chap-13.indd   219 8/24/2020   12:27:35 PM 2024-25  --- Page 6 --- HealtH and PHysical education - class X 220 AwArds in sport Sport awards in India are presented by the Government of  India to honour the players who have performed very well in  their field of sport. It is bestowed to various sport personalities  in different fields for their accomplishments and outstanding  performances and to enhance the enthusiasm of players and  recognise their skills and achievements. All the 7 awards are  given to the proud recipient on National Sport Day every year  i.e. 29 August to mark and celebrate the birthday of hockey  Maestro Major Dhyanchand. These awards include the   Trophy Rajiv Gandhi Khel Ratna Award, Arjuna Award, the  Maulana Abul Kalam Azad (MAKA) Award, the, the  Dronacharya Awards and the Dhyan Chand Award. Very  recently the sport category also has been added in the list of  areas for which Bharat Ratna is conferred. Rajiv Gandhi Khel Ratna Award The Rajiv Gandhi Khel Ratna award  was instituted in the year 1991-',
        'text',
        290,
        6
    );

    -- Chapter 16
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        16,
        '92. It is India’s highest honour',
        ARRAY[]::text[],
        6,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'given for achievement in sport.   The words “Khel Ratna” literally mean  “Sport Gem” in Hindi. The award is  named after the late Rajiv Gandhi,  former Prime Minister of India. It  carries a medal, a scroll of honour  and a cash component of ` 7,50,000.  The Khel Ratna was devised to be an  overarching honour, conferred for  outstanding sporting performance,  whether by an individual or a team,  across all sporting disciplines in a  given year.  Dronacharya Award Dronacharya Award was instituted in  1985 to honour eminent coaches who have  done ‘outstanding and meritorious’ work  consistently with a singularity of purpose for  raising the standards of sportpersons to highest  performance in National and International  events. As the best sportperson award is  named Arjuna Award, it is appropriate that the  coaching award is named after Dronacharya,  as he was the Guru of Arjuna. The award  comprises a plaque (bronze statuette of  Dronacharya), a scroll of honour and a cash  prize of ` 5,00,000 (Rupees five lakh). Fig. 13.1: Rajiv Gandhi  Khel Ratna Fig. 13.2: Dronacharya  award Activity 13.5 Gather information  regarding  the benefits  you can get from different  institutions/agencies  working in the areas of  games and sport, health  and physical education  and sport training from  different sources, such as  by discussing with your  teachers, sport teachers,  and relevant publications  or through internet.  Identify the types of help  you can get from each one  of them to promote your  abilities in games and  sport. Chap-13.indd   220 8/24/2020   12:27:36 PM 2024-25',
        'text',
        398,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 7 --- Agencies And AwArd Promoting HeAltH, sPorts And YogA 221 Arjuna Award  The Arjuna Award was instituted in 1961 by the Government  of India to recognise outstanding achievement in games  and sport. The award carries a cash prize of ` 500,000 a  bronze statuette of Arjuna and a scroll. Over the years the  scope of the award has been expanded and a large number  of sportpersons who belonged to the pre-Arjuna Award  era were also included in the list. Further, the number of  disciplines for which the award is given was increased to  include indigenous games and the differently abled category. The Government has recently revised the scheme for the  Arjuna Award. According to the revised guidelines, to be  eligible for the Award, a sportperson should not only have  had good performance consistently for the previous three  years at the international level with excellence for the year  for which the Award is recommended, but should also have  shown qualities of leadership, sportpersonship and a sense  of discipline. From the year 2001, the award is given only in disciplines  falling under the following categories:  • Olympic Games/Asian Games/Commonwealth Games / World Cup/World Championship Disciplines and Cricket  • Indigenous Games  • Sport for the Physically Challenged Dhyan Chand Award The Dhyan Chand Award is a Life Time Achievement given to  the veteran sportpersons of India for their achievements in  their respective fields of sport. It is named after Dhyan Chand  the legendary Indian hockey player. This is a new award  instituted by the Government of India in the year 2002. The  award carries a cash prize of ` 5,00,000/- (Rupees five lakh),  a statuette and scroll of honour. The main objective of the  award is to bestow honour on those sportpersons who have  contributed a lot to their respective sport by their performance  and who still continue to contribute to the promotion of sport  after their retirement from the active sporting career. Maulana A',
        'text',
        661,
        6
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 8 --- HealtH and PHysical education - class X 222 Rashtriya Khel Protsahan Puraskar The RKPP award was instituted in 2009 by the Govt. of  India to recognise the contribution in sport by entities other  than sport persons and coaches. The objective of the award  is to encourage and promote corporate involvement in the  promotion and development of sport. The award carries a  citation and a trophy in each categories, like',
        'text',
        108,
        9
    );

    -- Chapter 17
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        17,
        '1. The community sport identification and nurturing of',
        ARRAY[]::text[],
        9,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'budding young talent',
        'text',
        5,
        9
    );

END $$;

-- Book 27/29: as, Basketball, Cricket, Football, Handball, Hocke...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1951. After that it started being organised annually.',
        ARRAY[]::text[],
        2,
        5
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Basketball court measurements Fig. 6.2: Basketball court, a basket and a basketball 28m 15m 1.575m 0.90m Sideline Throw-in line 8.325m ThreePointLine 0.15m 6.75mNo-chargeSemi-Circle 3.6m CentreCircle Endline Centre line Restricted Area Endline Sideline Basketball is played on a rectangular court, which should  be an indoor wooden court or an outdoor concrete court  having two side lines and two end lines. The dimensions  of basketball court is 28 x15 meters. The court is divided  18 inch wide Diameter Chap-6.indd   78 8/24/2020   11:39:23 AM 2024-25  --- Page 3 --- Team Games and sporTs I 79 into two sections, called half-courts, by the mid-court line,  which is where the game starts with a jump ball. A jump  ball is when a referee throws the ball up at center circle to  determine which team gets possession. Two players from  opposing teams jump up to tap the ball out of the circle in  order to gain control over the ball take the game forward. The  basketball posts are located at the opposite ends of the court. Rules Duration of a Match (Total 4 Quarters) Play Rest Play Half time Play Rest Play 10 min 2 min 10 min 15 min 10 min 2 min 10 min  • The duration of the game of each quarter is ten  minutes with 2 minutes rest between 1st and 2nd  quarter and 3rd and 4th quarter, also 15 minutes  rest between 2nd and 3rd quarter. Extra time period  is of about 5 minutes. Teams exchange the side after  half time. The clock is stopped while the play is not  active. Therefore, it takes longer time to complete the  game than the allotted time.  • A team must consist of twelve (12) members. But  only five players from each team may be on the court  at one time. Substitutions are unlimited but can only  be done when the play is stopped.   • The team with the ball, attempting to score in  their basket is ‘on offense’, the team that prevents  opposite team from scoring is ‘on defence’. The ball is  moved in two ways: either dribbling or by passing to  teammates. If the ball goes ou',
        'text',
        746,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 4 --- HealtH and PHysical education - class X 80 Players who are fouled either get ball possession or  are awarded one or two free throws and one point  is awarded for successfully converting a free throw,  which is attempted from a line 15 feet (4.6 m) from  the basket. Each player is allowed 5 personal fouls  before they are disqualified from the game. At this  point they no longer remain a part of the game.  • Two points are awarded when a basket is scored  during the game but three points are awarded when  a basket is scored from outside the 6.25 mtrs line.  Fundamental skills We are well aware that, to play any game one has to learn  some skills. Similarly to play basketball game a player  should learn the following fundamental skills.  Dribbling It is important to penetrate to score a basket, move the  ball across the court, get away from the defenders, and  find a good passing lane. There are different types of  dribbling —   • basic dribble  • low dribbling  • high dribble  • behind the back  • crossover dribble   • change-of-pace  • between the legs dribble Passing A good offensive attack requires accurate passing from  players. It helps find an open man, to find a good shooter  or to get away from a defender. There are several types of  passes used in basketball, either one hand or both hand  pass —  • Overhead   • Chest   • Push   • Baseball   • Off-the-dribble   • Bounce   • Shoulder   • Hook  Fig. 6.3: Dribbling Chap-6.indd   80 8/24/2020   11:39:24 AM 2024-25  --- Page 5 --- Team Games and sporTs I 81 Fig. 6.4: Passing 18 inch wide Diameter Shooting Fig. 6.5: Shooting The objective of the game is to win by scoring maximum  points. Therefore, improving the team’s shooting is  important to win a game. Shooting with either one hand  or both hands is done in the following ways —  • Jump shot   • Dunk shot  • Free throw   • Layup  • Three-point shot   • Hook shot Chap-6.indd   81 8/24/2020   11:39:25 AM 2024-25',
        'text',
        490,
        2
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 6 --- HealtH and PHysical education - class X 82 Defence Fig. 6.6: Defence The game of basketball allows a variety of defences to be  deployed in an effort to disrupt and combat offensive  plays. Here are examples of the three basic categories of  team defences. In addition, each category comprises of an  assortment of different variations.  • Man to man defence: Man-to-man defences match  up the defenders against specific offensive players.  Defenders are usually assigned to be matched up with  offensive players by size and ability.  • Zone Defence: In Zone defence, defenders are assigned  to guard specific areas on the court. Zones are named  or designated by their player alignments.  • Combined Defence: A third type of defence that can be  deployed is the combination defence. With combina- tion defences, some of the players are assigned to play  man-to-man while the rest of the defenders play zone.  Combination defences are usually deployed in an effort  to stop or neutralise great individual offensive players.  Rebounding The objective of rebounding is to successfully gain possession  of the basketball after a missed field point or free throw, as it  rebounds from the ring or backboard. This plays a major role  in the game, as most possessions end when a team misses  a shot. There are two categories of rebounds: offensive  rebounds, in which the ball is recovered by the offensive side  and does not change possession, and defensive rebounds,  in which the defending team gains possession of the loose  ball. The majority of rebounds are defensive, as the team  on defence tends to be in better position to recover missed  shots. Chap-6.indd   82 8/24/2020   11:39:26 AM 2024-25  --- Page 7 --- Team Games and sporTs I 83 Fig. 6.7: Rebounding Arjun awardees S.No. Name of Player Year',
        'example',
        454,
        5
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '6. Prashanti Singh 2017',
        ARRAY[]::text[],
        5,
        14
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'CriCket Introduction Cricket is a bat and ball game played between two teams  on a field, at the centre of which is a rectangular pitch. One  team bats, trying to defend the wicket and scoring as many  runs as possible. The other team bowls and fields, trying to  dismiss the batsmen and thus limiting the runs scored by  the batting team. A run is scored by the striking batsman  hitting the ball with his bat, running to the opposite end  of the pitch and touching the crease there without being  dismissed. The teams switch between batting and fielding at  the end of an inning. Chap-6.indd   83 8/24/2020   11:39:26 AM 2024-25  --- Page 8 --- HealtH and PHysical education - class X 84 History The game of cricket, as it is played today, has its origin in the  south eastern part of England. Cricket became a generally  adopted sport in the second half of the seventeenth century.  The Hambeldon club which was founded in about 1750’s  had played a significant part in the evolution of the game.  It was superseded by the Marylebone Cricket Club (M.C.C)  with its headquarters at Lords, London. Cricket became  an international game with the formation of the Imperial  Cricket Conference (I.C.C) in 1909. The name of Imperial  Cricket Conference was changed to International Cricket  Conference (later, Council) to enable countries outside the  common wealth to become its members. The first Limited  Over International cricket match was played in 1971 at  Melbourne. The governing International Cricket Council (ICC)  saw its potential and staged the first limited over Cricket  World Cup in 1975. The first edition of limited over Cricket  world cup won by West Indies.  In the 21st century, a new limited over form, Twenty 20,  has made an immediate impact. The first T-20 international  match took place on August 5 2004, between the women’s  teams of England and New Zealand. The first T-20  international match between men’s teams was played on  February 17 2005, between Australia and New ',
        'text',
        702,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 9 --- Team Games and sporTs I 85 Ways to score runs The aim of the batsmen is to score runs. One of the main  cricket rules for batsmen to score runs is that they must  run to the pitch at each other’s end (from one end to the  other), hence score one run. Cricket rules state that, they  may run multiple runs per shot. As well as while running  they can also score runs by hitting boundaries. A batsman  hits a boundary and scores 4 or 6 runs. A four and six both  are scored by hitting the ball. If it crosses the boundary  after touching the ground it is considered as four and if  the ball crosses boundary before touching the ground it is  considered as six. Cricket rules also state that once a 4 or 6  has been scored any runs physically scored by the batsman  by running between the wickets are null and void.  Other ways runs can be scored according to the cricket  rules include no balls, wide balls, byes and leg byes. Cricket  rules state that all runs scored by these methods are awarded  to the batting team but not the individual batters.  • A No Ball can be declared for many reasons: If the  heel of the bowler’s front foot lands on or in front of  the popping crease or if the bowler’s back foot touches  then outside the return crease the ball is declared no  ball. If the bowler bowls the ball from the wrong place,  the ball is declared dangerous (often happens when  bowled at the batsmen’s body on the full), bounces  more than twice or rolls before reaching the batsman  or if fielders are standing in illegal positions. The  batsman can hit a No ball and score runs off it but  cannot be out from a No ball except if they are run  out, hit the ball twice, handle the ball or obstruct the  field. The batsman gains any runs scored off the no  ball for his shot while the team also gains one run for  the no ball itself.  • A Wide Ball will be declared if the umpire thinks the  batsman did not have a reasonable opportunity to  score off the delivery. However if the',
        'text',
        666,
        5
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 10 --- HealtH and PHysical education - class X 86  • A Leg Bye  is where runs are scored by hitting the  batsman, but not the bat and the ball is not a no ball  or wide. However no runs can be scored if the striking  batsman didn’t attempt to play a shot or if he was  avoiding the ball. Types of ‘out’ in cricket Ways batsmen can be given ‘Out’ according to cricket rules: There are a number of different ways a batsman can be given  out in the game of cricket. When a bowler gets a batsman  out it is said that the bowler gets a ‘wicket’. Following are the  different ways, a batsman can be given out according to the  rules of cricket: Fig. 6.9: Bowled  • Bowled – Cricket rules state that if the ball is bowled  and hits the striking batsman’s wickets the batsman is  given out (as long as at least one bail is removed by the  ball). It does not matter whether the ball has touched  the batsman’s bat, gloves, body or any other part of  the batsman. However, the ball is not allowed to have  touched another player or umpire before hitting the  wickets.  • Caught – Cricket rules state that if a batsman while  playing the ball, either it touches his bat, hand or glove  holding the bat then the batsman can be caught out.  This is done by the fielders, wicket keeper or bowler  catching the ball on the full (before it bounces). If this  is done then cricket rules state the batsman is out.  • Leg before Wicket (LBW) – If the ball is bowled and  hits the .batsman first without touching the bat, then  an LBW decision is possible. However for the umpire to  give this out he must first look at some of the factors  stated in the cricket rules. The first thing the umpire  Chap-6.indd   86 8/24/2020   11:39:28 AM 2024-25',
        'text',
        433,
        5
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '1. Sachin Tendulkar 2013',
        ARRAY[]::text[],
        14,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'FootBall  Football has been a very popular game all over the world  since ages. Also commonly known as soccer, it is a game  that involves kicking a ball with the foot to score a point.  It is played between two teams with a spherical ball on a  rectangular field of grass or green artificial turf. There is a  goal post at each end of the rectangular field and errected  at the middle of base line. Points are scored by moving the  ball to an opposing team’s end of the field and putting it  between two goal posts. Players are required to move the ball  by kicking, dribbling, carrying, and passing. The team that  scores more points than the other by the end of the match  wins the game. History According to FIFA (Federation International de Football  Association), the “very earliest form of the game was played  in china during the second and third centuries. The game  was later developed in England and the rules of football were  formulated in India, football began its journey when the  British rulers brought it with them and in no time it became  popular in the masses. The first recorded game here took place  between the ‘Calcutta Club of Civilians’ and the ‘Gentlemen  of Barrackpore’ in 1854. The first ever football club in India,  the ‘Calcutta Football Club’ was founded in 1872. The first  football association, “the Indian Football Association” (IFA)  was established in Calcutta in 1893, though there was no  Indian on its board till 1930s. It was later, replaced by All India  Football Federation (AIFF). The Durand Cup Tournament is  the oldest in India and the one of the oldest in the world, was  started in Shimla in 1888. The decade of 1951 to 1962 is  known as the golden era in the history of Indian football, as  the country put up commendable performances in a number  of international competitions. India won gold medals in 1951  and 1962 Asian Games, held at New Delhi and Jakarta. 68-70 cm Circumference of football Fig. 6.14: Specifications of  football Chap-6.ind',
        'text',
        703,
        14
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 19 --- Team Games and sporTs I 95 Goal post Distance between the posts is 7.32 meter whereas the height  of the goal post is 2.44 meter. Rules According to the official rules of football guide, the players  need to execute the game in a fair and accepted manner. The  football match is played in two halves of 45 minutes each.  There are several rules in the game of football regarding the  field, players, penalties, offence and defence.  Start and restart of play A coin toss takes place before the game starts, the winner of  the toss will get the choice of choosing the end to attack. At  the kick-off, all players from each side must be in their own  halves of the field. The kick-off takes place on the centre spot  in the centre circle. The player who kicks off cannot touch it  again until another player has made contact. Punishment for offences If the player persistently offends during a match, the referee  can choose to take action. First the Yellow Card as a caution  is shown to a player. Any offence after the second one leads  to Red card. If they showed a red card to a player it means  that player is expelled from the match. A straight red card (no  previous caution) can be shown for extreme offences, such  as, serious foul play, violent conduct, spitting, deliberately  handling the ball to prevent a goal, a professional foul (denying  a goal scoring opportunity) and insulting language and/or  gestures. Free kicks Whenever a free kick is taken, the players on the opposite  side must be at least 10 yards away from the ball until it  is kicked. If this rule is not adhered to, the kick is retaken.  There are two types of free kicks awarded, depending on the  nature of the offence: (i) Direct Free Kick — allows the team  to take a direct shot at the opponent`s goal. (ii) Indirect Free  Kick — a direct strike on goal is not permitted. It means a  second player has to touch the ball after the kick is taken to  score a goal. Penalty kick A penalty kick is awarde',
        'text',
        597,
        14
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 20 --- HealtH and PHysical education - class X 96 player has taken the kick, that player cannot strike the ball  again without another player touching the ball. Throw-in A throw-in is awarded when the whole ball crosses the touch  line (conceded by the team who last touched the ball). It  is delivered on the field of play with both hands and from  behind and over the player’s head. Otherwise it is deemed to  be a foul throw and a throw-in is given to the opposition. It  cannot go directly to the goalkeeper’s hands (if on the same  team). A goal cannot be scored directly from a throw-in. Corner kick A corner kick is awarded once the whole ball crosses the goal  line of the opposition, after touching one of their players.  A kick is taken from the corner of whichever side the ball  travelled over the field. Opponents must be 10 yards from  the corner arc and the kicker cannot touch the ball a second  time without having touched by any other player. Fundamental skills Receiving Receiving a ball on the ground is different than receiving a  ball in air. Keep your eye on the ball, select the foot to receive  the ball, don’t stop the ball, prepare it for new action or move,  shot, dribble, pass. Passing Passing involves giving the ball to partners. Perfect decision  making is required before a perfect pass. Before pass,   see the target, approach the ball, and look at the ball holding  the head steady. Strike the correct area of the ball with  lacked ankle, make sure of follow through and transfer of  weight forward. Shooting Shooting uses the same elements as used in passing, the  difference is that the ball is to be passed to the goal keeper to  convert the score for the team. Player should look up to see  the position of goal keeper, choosing the area to shoot the  ball while make a proper contact with the ball with proper  follow through. Trapping It is a method of gaining control of the ball. Trapping uses  the feet, thigh, or chest to bring the ball to the g',
        'text',
        513,
        14
    );

    -- Chapter 11
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        11,
        '3. How does playing basketball help us in the improvement of our',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'health?',
        'text',
        1,
        26
    );

    -- Chapter 14
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        14,
        '6. How can you improve your performance in the game of basketball?',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'II. Fill in the Blanks',
        'text',
        5,
        26
    );

    -- Chapter 19
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        19,
        '5. Duration of team time out is _____________ .',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'III. State whether True or False',
        'text',
        8,
        26
    );

    -- Chapter 24
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        24,
        '5. After five fouls player has to leave the court.',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'IV. Assess your Performance by the following Activities',
        'text',
        13,
        26
    );

    -- Chapter 27
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        27,
        '3. Shooting Test: Shooting for 30 seconds from under the basket',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'position CriCket  I. Answer the following Questions',
        'exercise',
        12,
        26
    );

    -- Chapter 29
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        29,
        '2. What has been the impact of Twenty20 form of cricket on Test',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'Matches? Chap-6.indd   107 8/24/2020   11:39:45 AM 2024-25  --- Page 32 --- HealtH and PHysical education - class X 108  II. Fill in the Blanks',
        'text',
        35,
        26
    );

    -- Chapter 30
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        30,
        '1. Cricket became an international game with the formation of',
        ARRAY[]::text[],
        26,
        26
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the  _____________  in 1909.',
        'text',
        7,
        26
    );

END $$;

-- Book 28/29: GrowinG up durinG Adolescence...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Increase in height',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'and weight',
        'text',
        2,
        4
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '4. Growth of hair on',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'private parts',
        'text',
        3,
        4
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '5. Widening of',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'shoulders',
        'text',
        2,
        4
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '7. Development of',
        ARRAY[]::text[],
        4,
        4
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'breasts',
        'text',
        1,
        4
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '8. Sweat and oil glands',
        ARRAY[]::text[],
        4,
        9
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'become active wet dreAms Wet dreams are a normal and natural physiological process  which starts during adolescence among boys. It usually  occurs during sleep. Wet dreams is a discharge of semen  (seminal fluid) containing sperms. Many adolescent boys are  usually not aware of this phenomenon and get worried when  they face this situation first time. Semen is the fluid formed by glands associated with male  reproductive system. Semen carries mature sperms formed  in the testes. Read the following case studies which confirm the  uniqueness of every individual with regard to time of  occurrence of changes during adolescence. CASE 1: My father calls me ‘Sher’ Rakesh and Dibang, students of Class IX, are walking home  together from school. Rakesh begins to tease Dibang, saying  that he speaks in a girl’s voice. He also laughs at the fact  that Dibang has got no hair on his upper lip. “Look at me,”  Rakesh says, “I am a real man. My voice is strong and my  face is manly - I have so much facial hair. My father calls me  sher.” Dibang wonders what is wrong with him. He recalls  that his mother still calls him ‘my sweet boy’. He decides  to go home and ask his mother why he is so different from  Rakesh and whether something is wrong with him. Points for Discussion  a) What do you think Dibang felt with Rakesh’s remarks?  b) Do you think that there is something wrong with  Dibang? Why? Chap-3.indd   26 8/24/2020   4:15:39 PM 2024-25',
        'text',
        362,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 5 --- Growth and development durinG adolescence 27  c) What should Dibang’s mother tell him?  d) Do you think it is important to prepare children  regarding the  changes likely to occur in them? Why? CASE 2: Each one is unique Pooja, Sujatha, Abida and Radha are good friends. All of  them are 13 years old and love to spend time with one  another. They have so much to talk about, a new film, a  new dress, home work, the boys in the class and just about  everything. Yesterday, Radha seemed uncomfortable. She was  having her periods and was concerned about staining her  uniform. Last month, Sujatha’s family had organised a big  celebration in her honour as she had started her periods.  Pooja recalled that three months ago, Abida had started her  periods in school and had to borrow a sanitary napkin from  her older cousin. Except Pooja, all her friends have started  their periods. Is there something wrong with her? Points for Discussion  a) What do you think Pooja felt when she realised that  she is the only one who had not started her periods?  b) Do you think there is something wrong with Pooja?  c) If Pooja came to you for advice, what would you tell  her as a peer?  d) Do you think it is important to prepare children  regarding the changes likely to occur in them? Why? CASE 3: Puberty in boys Suresh heard from someone that wet dream (nocturnal  emission) causes weakness. When Naresh who is Suresh’s  best friend first experienced wet dream, he confided in  Suresh. Suresh encouraged Naresh to visit the nearest  Health Centre to have a discussion about wet dream with  the doctor. Points for Discussion  a) Do you think something is wrong with Naresh?  b) According to you, the advice given by Suresh is  correct or not?  c) What are the myths associated with wet dream?  d) What advice was given by the doctor to Naresh?  • Adolescence is a period of physical and emotional  changes which are triggered by a set of hormones.  These changes are part of growing up.  • ',
        'text',
        528,
        4
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 6 --- HealtH and PHysical education - class X 28  • You should not compare your physical changes with  others – the pace at which changes take place differ  from person to person.  • It is natural to feel awkward or conscious of the changes  that occur but try to support each other by accepting  these as part of a natural process and don’t let these  decrease your self-confidence.  • If you have any doubts or concerns about changes that  are occurring to you reach out to a trusted adult or  you can talk to a counsellor in the adolescent friendly  Health Clinic near where you live.  • Many young boys due to feeling of shame visit quacks  and waste lot of time and money. It is best to visit the  doctor or the health centre. One can discuss the myths  related to growing up with a trusted person (teacher,  parents, friends).  • There is a myth that wet dream causes weakness among  the males because semen is lost from the body. However  it is not so, semen and sperms are continuously made  in the testes and semen lost during wet dream gets  replaced very soon. menstru Ation The first menstruation is termed as menarche. In India, age  of menarche is 12-13 years but may vary from individual to  individual. Menstruation generally stops between the age of  45 and 55 years and is termed as menopause. Menopausal age  varies in different individuals. Age of menarche has decreased  due to various lifestyle changes. Menstruation hygiene and  cleanliness is very important. Points to remember —  • Regular bath and washing self properly are important  for avoiding infections, especially during menstruation.  • Change undergarment regularly (at least once a day)  and avoid synthetic cloth.  • During menstruation, cloth, cloth pads or napkins should  be changed after every four to six hours to avoid infection.  • One can also use sanitary napkins to manage  menstrual hygiene. Many girls and women also make  sanitary napkins at home with old cloth and cotton. If  one makes a s',
        'text',
        615,
        4
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '2. Do you think the adverse consequence of teenage marriage',
        ARRAY[]::text[],
        9,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'was greater on Sangeeta than on Rahul? Give reasons for your  answer. 3.  What would you have done, if you were in Rahul or Sangeeta’s  situation? Chap-3.indd   30 8/24/2020   4:15:39 PM 2024-25  --- Page 9 --- Growth and development durinG adolescence 31 VitAl stAtistics  And Functions  oF the Body As you grow in years, you grow in size with increased length  and circumference of body parts till you are a full-fledged  adult of age 19. While you must maintain hygiene of all  external parts, the internal organs also have to function  normally. You know that certain vital functions of the body  for enjoying good health are maintenance of blood pressure,  pulse rate, respiratory rate, etc. Some ways of assessing  the vital functions and statistics of human beings are   given below.  Blood pressure (BP) and its measurement Pressure exerted  by blood on the  wall of the arteries  is called blood  pressure. When  the heart  contracts, blood  surges through  aorta, BP is  highest (Systolic  Pressure)  pressure  of blood on the arterial wall recorded when ventricles relax is  lowest (Diastolic Pressure). The pressure wave  along the arteries with  each heartbeat can be  felt at the pulse. Blood  pressure is measured  by the instrument  called “Sphygmoma- nometer”. Diastolic  and Systolic pressure  is measured and in a  normal healthy young  adult it is 110/75,  which means 110  mm Hg systolic and  75 mm Hg diastolic.  Sphygmomanometer  consists of cuff with  an inflatable bladder which is wrapped around a person’s up- per arm and a rubber bulb inflates the bladder. An attached  device indicates the blood pressure. There is now a digital de - vice which is also used for measuring the BP. BP increases  with age to about 130/90mm Hg. Abnormally high BP is called  hypertension.  Fig. 3.1: Checking blood pressure Fig. 3.3: Sphygmomanometer Activity 3.4 Measuring mid-arm  Circumference Biceps is the muscle of   mid arm. Place the beginning of the  tapes in the middle of the  bic',
        'text',
        572,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        1,
        '--- Page 10 --- HealtH and PHysical education - class X 32 Calculate your Body Mass Index (BMI) BMI can be calculated by adopting the following formula.  Divide your weight by square of your height. BMI = weight (kg) height (m) 2  • If you measured your weight in kg then measure height  in meters.   • Normal BMI Range = 18 to 25.  • Overweight = more than 25 and less then 29.  • Obese = more than 30. Examination of conjunction  The conjunction is a transparent membrane over the eye.   A smooth shiny moist conjunction is normal. If red or thick or  covered by a secretion or foreign body, it requires immediate  medical attention or consultation of a eye doctor.  Tongue examination Nutritional deficiencies, infections, dysfunction of nerves or  even cancer can be detected by examining the tongue. Some key characteristic features of a tongue in normal  condition can be noted by physical examination. These are —  (i) Colour: Pink red on both upper and lower surface. On  lower surface blood vessels may be seen.  (ii) Texture: Rough on upper surface due to presence of  papillae or taste buds. Hair, farrows or ulceration  indicates dysfunction.  (iii) Size: If not swollen, tongue will fit comfortably inside  the mouth. The tongue can be examined by the  following steps —  • Make tip of tongue touch roof of mouth to inspect  ventral surface.  • When protruded out, colour and texture can be  noted for any deviation.  • Use gauze to hold protruded tongue (wearing  gloves) between tongue and index figure and fill  the fender areas. Examining nail bed Nail bed also needs direct physical examination. Nail plate  surface discolouration, abnormal cuticle, nail fold or nail  shape require inspection. Loss of nails and lesions around  nails, need medical attention. Activity 3.6 At the exit gate of Nehru  Place Metro Station in  New Delhi, there is a  provision for measuring  height and weight and  also to calculate BMI for  10 rupees. Find out where  else measurement of BMI  is avail',
        'text',
        667,
        9
    );

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        2,
        '--- Page 11 --- Growth and development durinG adolescence 33 Pharmacology and its impact on the body Pharmacology deals with biological effects of drugs. Drugs  are chemical substances used for healing, curing diseases,  slowing them or preventing diseases. Effects Therapeutic desired actions for cure are —  • Stimulating or inhibited cell function   • Blocking biochemical of tissues  • Anti histamicric  (anti allergic)  • Laxative (reasoning constipation) Unwanted effects Side effects are —  • Dry mouth or dangerous effects on tissues  • Damage or toxicity or excessive bleeding  are some  effects of drugs used as medicine  Prevention Never buy medicines over the counter (OTC) without Doctor’s  prescription with dosage and instruction written.  • Unusual responses are reasons for harmful effects of  drugs   • Medication error or overdose Chap-3.indd   33 8/24/2020   4:15:40 PM 2024-25  --- Page 12 --- HealtH and PHysical education - class X  34 Assessment  I. Fill in the Blanks',
        'text',
        248,
        13
    );

    -- Chapter 12
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        12,
        '3. Five changes occuring in boys and girls during adolescence are',
        ARRAY[]::text[],
        13,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '____________, ___________, ______________, _____________ and  ____________.  II. Choose the Correct Option',
        'text',
        26,
        13
    );

    -- Chapter 13
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        13,
        '1. Proper hygiene should be practised during adolescence.',
        ARRAY[]::text[],
        13,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        '(Yes/No/Don’t know)',
        'text',
        4,
        13
    );

    -- Chapter 15
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        15,
        '3. Government is supporting schemes for promoting menstrual',
        ARRAY[]::text[],
        13,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'hygiene among adolescent girls. (Yes/No/Don’t know)',
        'text',
        12,
        13
    );

    -- Chapter 16
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        16,
        '4. The adolescents begin to be extremely conscious of their physical',
        ARRAY[]::text[],
        13,
        13
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'appearance once secondary sexual characteristics begin to  develop. (Yes/No/Don’t know)',
        'text',
        21,
        13
    );

END $$;

-- Book 29/29: Dietary Planning...
DO $$
DECLARE
    textbook_id UUID;
    chapter_id UUID;
BEGIN
    -- Insert textbook
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
    ) ON CONFLICT (file_name) DO UPDATE SET
        title = EXCLUDED.title,
        status = 'ready',
        processed_at = NOW()
    RETURNING id INTO textbook_id;

    -- Chapter 1
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        1,
        '1. Perishable which remain fresh and edible for few',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'hours to 1-2 days only, e.g., milk, meat, green leafy  vegetables.',
        'example',
        16,
        10
    );

    -- Chapter 2
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        2,
        '2. Semi-perishable which remain fresh and edible for',
        ARRAY[]::text[],
        10,
        10
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'about a week (5-7 days) e.g., some vegetables and  fruits.',
        'example',
        14,
        10
    );

    -- Chapter 3
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        3,
        '3. Non-perishable which remain fresh and edible for',
        ARRAY[]::text[],
        10,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'more than a month, e.g., grains, sugar, oil, pulses. Food is precious and is not available in unlimited quantity.  So food should not be wasted rather protected from spoilage.  Proper storage of food decreases food spoilage and various  Fig. 9.5: ISI Activity 9.5  • Collect five perishable  food items and  leave them at room  temperature. Also  store the same five  food items in the  refrigerator. Record the  changes in food items  kept in both places  and assess them in  terms of food quality.    • Write five semi- perishable and five  non-perishable food  items you regularly  use in your diet.  • Government of India  has developed five  booklets on food  safety. Search on the  portal (www.snfportal. in) and record 10  points to prevent food  spoilage which can be  followed in day-to-day  life.  Chap-9.indd   172 8/24/2020   11:43:37 AM 2024-25  --- Page 9 --- Dietary ConsiDerations anD FooD Quality 173 treatments can also be given for this, food preservation is  one of them.  Food preservation Food preservation is the process of treating and handling food  to stop or slow down spoilage and extend shelf life of food.  It works on the principles of reducing the moisture content,  preventing the growth of micro organisms causing spoilage  and controlling enzymatic activity. The techniques are —',
        'example',
        328,
        11
    );

    -- Chapter 4
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        4,
        '1. Heat treatment: Application of  heat helps in preserving',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'food by destroying the harmful microorganisms. For  example, Pasteurisation of milk and sterilisation of  bottles.',
        'example',
        28,
        11
    );

    -- Chapter 5
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        5,
        '2. Refrigeration and freezing: Low temperature limit',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'the enzymatic and microbial activities keeping the  food safe for longer duration.',
        'text',
        20,
        11
    );

    -- Chapter 6
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        6,
        '3. Drying or dehydration: This technique is based on',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'reducing or removing the moisture content of food as  microbes cannot grow in the absence of water.',
        'text',
        24,
        11
    );

    -- Chapter 7
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        7,
        '4. Addition of preservatives: Preservatives are natural',
        ARRAY[]::text[],
        11,
        11
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'or chemical ingredients which selectively control  the growth of microorganisms and enzymes in food  and restrict spoilage. Jams and jellies are preserved  by sugar and pickles by salt, spices and oil. Acid  medium also restrict the growth of bacteria. Chemical  preservatives like sodium benzoate or Potassium Meta  bisulphite (KMS) are used in ketchups and squashes.  Preservatives are used in very small quantity. Use  above the prescribed limit is harmful and punishable  under law.',
        'text',
        121,
        11
    );

    -- Chapter 8
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        8,
        '5. Preservation by Radiation: Radiations are emissions',
        ARRAY[]::text[],
        11,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'of intense energy capable of penetrating tissues. When  food is exposed to specific form of radiation (gamma  rays from Cobalt 60) under controlled conditions it  increases their shelf life and is referred as irradiated  food. Items like fruits, potatoes, onions, spices, herbs  and some ready-to-eat foods can be preserved in this  way. But this technique is not suitable for milk and  milk products. The safety of irradiated foods is under  debate. Consumers can choose or avoid irradiated  foods by identifying its symbol on the label. This mark  has been approved by Food safety and Standards  Regulations Authority of India (2015).  Food adulteration   Food adulteration is an unhealthy and illegal practice of  adding the low grade ingredient(s) in the original food or  Activity 9.6  • Choose three  preserved foods  prepared at your home  and another three from  the market. Identify  the method of food  preservation in each  and the preservative  used, if any. Classify  the preservative as  natural or chemical.  • Identify one  preservative for each:  lemon pickle, guava  jelly, frozen peas,  pineapple squash and  bread. Chap-9.indd   173 8/24/2020   11:43:37 AM 2024-25  --- Page 10 --- HealtH and PHysical education - class X 174 deleting the vital component. It is usually done intentionally  to increase the profits. It makes the food unsafe to eat;  degrades the food quality and is injurious to health. Under Food Safety Standards Act (2006) adulterated  food is now termed as substandard food, unsafe food or food  containing extraneous matter. The helpline where an individual  can lodge complaint is —  http://nationalconsumerhelpline.in/foodSafety.aspx The following criteria designate any food as adulterated  or unsafe and the person responsible for any of these is  punishable under law —',
        'text',
        453,
        12
    );

    -- Chapter 9
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        9,
        '1. The article itself, or its package thereof, is composed,',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'whether wholly or in part, of poisonous or deleterious  substances.',
        'text',
        16,
        12
    );

    -- Chapter 10
    INSERT INTO public.chapters (
        textbook_id, chapter_number, title, topics, start_page, end_page
    ) VALUES (
        textbook_id,
        10,
        '2. The article consists of, wholly or in part, any filthy,',
        ARRAY[]::text[],
        12,
        12
    ) RETURNING id INTO chapter_id;

    INSERT INTO public.content_chunks (
        chapter_id, chunk_index, content, content_type, token_count, page_number
    ) VALUES (
        chapter_id,
        0,
        'putrid, rotten, decomposed or diseased animal  substance or vegetable substance.',
        'text',
        20,
        12
    );

END $$;

COMMIT;

-- Verification Query
SELECT
    COUNT(DISTINCT t.id) as textbooks,
    COUNT(DISTINCT c.id) as chapters,
    COUNT(DISTINCT cc.id) as chunks
FROM public.textbooks t
LEFT JOIN public.chapters c ON c.textbook_id = t.id
LEFT JOIN public.content_chunks cc ON cc.chapter_id = c.id
WHERE t.processed_at::date = CURRENT_DATE;
