import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://iieevwcwjkxdqmuzixjb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZWV2d2N3amt4ZHFtdXppeGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEyMTQxMjksImV4cCI6MjAzNjc5MDEyOX0.5sbYGDm8DSkjJxkMHsVWi3gEx1_-yQqzFiRkwer1vzI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addQuizQuestions() {
  try {
    // First login as admin
    console.log('Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    console.log('Logged in successfully');
    
    // Get the user's site_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('site_id')
      .eq('id', authData.user.id)
      .single();
    
    const siteId = profile?.site_id || 1; // Default to site 1
    console.log('Using site_id:', siteId);
    
    // Sample questions
    const questions = [
      {
        question_text: 'What should you check first in a safety inspection?',
        options: ['PPE availability', 'Kitchen menu', 'Visitor log', 'Weather forecast'],
        correct_index: 0
      },
      {
        question_text: 'Hand hygiene should last at least how many seconds?',
        options: ['5 seconds', '10 seconds', '20 seconds', '40 seconds'],
        correct_index: 2
      },
      {
        question_text: 'Which waste goes into a sharps bin?',
        options: ['Used needles', 'Food scraps', 'Paper towels', 'Plastic bottles'],
        correct_index: 0
      },
      {
        question_text: 'When should you report a near-miss incident?',
        options: ['End of the week', 'Immediately', 'During monthly review', 'Never'],
        correct_index: 1
      },
      {
        question_text: 'Which is NOT a fire class?',
        options: ['Class A', 'Class B', 'Class D', 'Class H'],
        correct_index: 3
      },
      {
        question_text: 'What is the correct method to lift a heavy box?',
        options: ['Back bent, legs straight', 'Back straight, bend knees', 'Twist the spine', 'Hold with fingertips'],
        correct_index: 1
      },
      {
        question_text: 'A spill kit is used to handle?',
        options: ['Electrical faults', 'Chemical spills', 'Printer jams', 'Lost property'],
        correct_index: 1
      },
      {
        question_text: 'PAT testing refers to?',
        options: ['Patient testing', 'Portable Appliance Testing', 'Public Area Testing', 'Pressure and Temperature'],
        correct_index: 1
      },
      {
        question_text: 'What temperature should hot food be kept at?',
        options: ['Above 45°C', 'Above 55°C', 'Above 63°C', 'Above 75°C'],
        correct_index: 2
      },
      {
        question_text: 'How often should fire alarms be tested?',
        options: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        correct_index: 1
      },
      {
        question_text: 'What color is a CO2 fire extinguisher?',
        options: ['Red', 'Black', 'Blue', 'Cream'],
        correct_index: 1
      },
      {
        question_text: 'COSHH stands for?',
        options: ['Control of Substances Hazardous to Health', 'Committee of Safety and Health Hazards', 'Certificate of Safe Handling and Hygiene', 'Central Office for Safety and Health'],
        correct_index: 0
      },
      {
        question_text: 'What is the minimum rest break for a 6-hour shift?',
        options: ['10 minutes', '20 minutes', '30 minutes', '45 minutes'],
        correct_index: 1
      },
      {
        question_text: 'Which PPE protects against airborne particles?',
        options: ['Safety glasses', 'FFP3 mask', 'Latex gloves', 'Steel toe boots'],
        correct_index: 1
      },
      {
        question_text: 'What is the first step in risk assessment?',
        options: ['Control measures', 'Identify hazards', 'Training staff', 'Document findings'],
        correct_index: 1
      }
    ];
    
    // Insert questions and options
    for (const q of questions) {
      console.log(`\nAdding question: "${q.question_text}"`);
      
      // Insert question
      const { data: questionData, error: qError } = await supabase
        .from('quiz_questions')
        .insert({
          site_id: siteId,
          question_text: q.question_text,
          category: 'Health & Safety',
          difficulty: 'medium',
          is_active: true
        })
        .select()
        .single();
      
      if (qError) {
        console.error('Error inserting question:', qError);
        continue;
      }
      
      console.log(`  Question added with ID: ${questionData.id}`);
      
      // Insert options for this question
      const optionsToInsert = q.options.map((text, index) => ({
        question_id: questionData.id,
        option_order: index,
        option_text: text,
        is_correct: index === q.correct_index
      }));
      
      const { error: optError } = await supabase
        .from('quiz_options')
        .insert(optionsToInsert);
      
      if (optError) {
        console.error('Error inserting options:', optError);
      } else {
        console.log(`  Added ${q.options.length} options`);
      }
    }
    
    // Check how many questions we have now
    const { data: count } = await supabase
      .from('quiz_questions')
      .select('id', { count: 'exact' })
      .eq('site_id', siteId)
      .eq('is_active', true);
    
    console.log(`\n✅ Total active questions for site ${siteId}: ${count?.length || 0}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addQuizQuestions();