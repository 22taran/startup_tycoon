const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicateEvaluations() {
  console.log('🔍 Checking for duplicate evaluations...');
  
  const assignmentId = '667ab27f-86cd-4b8f-8751-b18d60dc0fdd';
  
  // Get all evaluation assignments
  const { data: evaluations, error } = await supabase
    .from('assignment_evaluations')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('evaluator_student_id');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  // Group by student
  const studentEvaluations = evaluations.reduce((acc, eval) => {
    if (!acc[eval.evaluator_student_id]) {
      acc[eval.evaluator_student_id] = [];
    }
    acc[eval.evaluator_student_id].push(eval);
    return acc;
  }, {});
  
  console.log('📊 Evaluation count per student:');
  Object.entries(studentEvaluations).forEach(([studentId, evals]) => {
    const completed = evals.filter(e => e.evaluation_status === 'completed').length;
    const assigned = evals.filter(e => e.evaluation_status === 'assigned').length;
    console.log(`  Student ${studentId}: ${evals.length} total (${completed} completed, ${assigned} assigned)`);
  });
  
  // Check for duplicates (same student evaluating same team)
  console.log('\n🔍 Checking for duplicate team evaluations...');
  const duplicates = [];
  Object.entries(studentEvaluations).forEach(([studentId, evals]) => {
    const teamCounts = {};
    evals.forEach(eval => {
      const key = `${eval.team_id}`;
      teamCounts[key] = (teamCounts[key] || 0) + 1;
    });
    
    Object.entries(teamCounts).forEach(([teamId, count]) => {
      if (count > 1) {
        duplicates.push({ studentId, teamId, count });
      }
    });
  });
  
  if (duplicates.length > 0) {
    console.log('❌ Found duplicate evaluations:');
    duplicates.forEach(dup => {
      console.log(`  Student ${dup.studentId} evaluating team ${dup.teamId} ${dup.count} times`);
    });
  } else {
    console.log('✅ No duplicate evaluations found');
  }
}

checkDuplicateEvaluations().catch(console.error);
