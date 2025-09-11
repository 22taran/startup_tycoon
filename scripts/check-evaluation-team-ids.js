const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvaluationTeamIds() {
  console.log('🔍 Checking evaluation team IDs...');
  
  const assignmentId = '667ab27f-86cd-4b8f-8751-b18d60dc0fdd';
  
  // Get evaluation assignments with team info
  const { data: evaluations, error } = await supabase
    .from('assignment_evaluations')
    .select(`
      id,
      evaluator_student_id,
      evaluated_team_id,
      submission_id,
      evaluation_status,
      teams!inner(id, name)
    `)
    .eq('assignment_id', assignmentId)
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📊 Sample evaluation records:');
  evaluations.forEach((eval, index) => {
    console.log(`  ${index + 1}. Evaluator: ${eval.evaluator_student_id}, Team ID: ${eval.evaluated_team_id}, Team Name: ${eval.teams?.name || 'NULL'}, Status: ${eval.evaluation_status}`);
  });
  
  // Check for null team IDs
  const nullTeamIds = evaluations.filter(eval => !eval.evaluated_team_id);
  console.log(`\n❌ Evaluations with null team_id: ${nullTeamIds.length}`);
  
  if (nullTeamIds.length > 0) {
    console.log('These evaluations have null team_id:');
    nullTeamIds.forEach(eval => {
      console.log(`  Evaluation ${eval.id}: team_id = ${eval.evaluated_team_id}`);
    });
  }
}

checkEvaluationTeamIds().catch(console.error);
