const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCurriculumData() {
  console.log('🔄 Starting curriculum data fix...');
  
  try {
    // First, check current data
    const { data: currentData, error: selectError } = await supabase
      .from('curriculum_data')
      .select('*')
      .order('grade', { ascending: true });
    
    if (selectError) {
      console.error('❌ Error reading current data:', selectError);
      return;
    }
    
    console.log('📊 Current curriculum_data entries:', currentData?.length || 0);
    if (currentData && currentData.length > 0) {
      console.log('📖 Sample current data:');
      currentData.forEach(item => {
        console.log(`  Grade ${item.grade} ${item.subject}: ${item.topics?.length || 0} topics`);
        if (item.topics && item.topics.length > 0) {
          console.log(`    First topic: "${item.topics[0]}"`);
        }
      });
    }
    
    // Delete all current data
    console.log('\n🗑️ Deleting corrupted data...');
    const { error: deleteError } = await supabase
      .from('curriculum_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (deleteError) {
      console.error('❌ Error deleting data:', deleteError);
      return;
    }
    console.log('✅ Deleted all existing curriculum data');
    
    // Insert correct CBSE curriculum data
    console.log('\n📚 Inserting correct CBSE curriculum...');
    const correctData = [
      // Grade 9
      {
        grade: 9,
        subject: 'Mathematics',
        topics: ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations', 'Euclidean Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas of Parallelograms', 'Circles', 'Constructions', 'Herons Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability']
      },
      {
        grade: 9,
        subject: 'Science',
        topics: ['Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill', 'Natural Resources', 'Improvement in Food Resources']
      },
      // Grade 10
      {
        grade: 10,
        subject: 'Mathematics',
        topics: ['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']
      },
      {
        grade: 10,
        subject: 'Science',
        topics: ['Chemical Reactions', 'Acids Bases and Salts', 'Metals and Non-metals', 'Carbon and Its Compounds', 'Periodic Classification', 'Life Processes', 'Control and Coordination', 'How Do Organisms Reproduce', 'Heredity and Evolution', 'Light Reflection', 'Light Refraction', 'Human Eye', 'Electricity', 'Magnetic Effects', 'Sources of Energy', 'Our Environment', 'Natural Resources Management']
      },
      // Grade 11
      {
        grade: 11,
        subject: 'Mathematics',
        topics: ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', '3D Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability']
      },
      {
        grade: 11,
        subject: 'Physics',
        topics: ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work Energy and Power', 'System of Particles', 'Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves']
      },
      {
        grade: 11,
        subject: 'Chemistry',
        topics: ['Basic Concepts', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Environmental Chemistry']
      },
      // Grade 12
      {
        grade: 12,
        subject: 'Mathematics',
        topics: ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Applications of Derivatives', 'Integrals', 'Applications of Integrals', 'Differential Equations', 'Vector Algebra', '3D Geometry', 'Linear Programming', 'Probability']
      },
      {
        grade: 12,
        subject: 'Physics',
        topics: ['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics', 'Communication Systems']
      },
      {
        grade: 12,
        subject: 'Chemistry',
        topics: ['Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles of Isolation', 'p-Block Elements', 'd and f Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols Phenols and Ethers', 'Aldehydes Ketones', 'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life']
      }
    ];
    
    const { data: insertedData, error: insertError } = await supabase
      .from('curriculum_data')
      .insert(correctData)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting correct data:', insertError);
      return;
    }
    
    console.log('✅ Successfully inserted correct curriculum data');
    console.log('📊 Inserted entries:', insertedData?.length || 0);
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('curriculum_data')
      .select('*')
      .eq('grade', 10)
      .eq('subject', 'Mathematics')
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }
    
    console.log('🎯 Grade 10 Mathematics topics:');
    if (verifyData && verifyData.topics) {
      verifyData.topics.forEach((topic, index) => {
        console.log(`  ${index + 1}. ${topic}`);
      });
    }
    
    console.log('\n🎉 Curriculum data fix completed successfully!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixCurriculumData();