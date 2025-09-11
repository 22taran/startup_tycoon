const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvaluations() {
  console.log('🔍 Checking evaluation data...');
  
  const assignmentId = '667ab27f-86cd-4b8f-8751-b18d60dc0fdd';
  
  // Get all assignment_evaluations for the current assignment
  const { data: evaluations, error } = await supabase
    .from('assignment_evaluations')
    .select('*')
    .eq('assignment_id', assignmentId);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📊 Total evaluations found:', evaluations.length);
  console.log('📋 Evaluation details:');
  evaluations.forEach((eval, index) => {
    console.log(`  ${index + 1}. Student: ${eval.evaluator_student_id}, Status: ${eval.evaluation_status}, Completed: ${eval.completed_at}`);
  });
  
  // Group by status
  const statusCounts = evaluations.reduce((acc, eval) => {
    acc[eval.evaluation_status] = (acc[eval.evaluation_status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📈 Status breakdown:', statusCounts);
  
  // Check investments too
  console.log('\n💰 Checking investment data...');
  const { data: investments, error: invError } = await supabase
    .from('assignment_investments')
    .select('*')
    .eq('assignment_id', assignmentId);
  
  if (invError) {
    console.error('❌ Investment Error:', invError);
    return;
  }
  
  console.log('📊 Total investments found:', investments.length);
  investments.forEach((inv, index) => {
    console.log(`  ${index + 1}. Investor: ${inv.investor_student_id}, Tokens: ${inv.tokens_invested}, Team: ${inv.team_id}`);
  });
}

checkEvaluations().catch(console.error);
