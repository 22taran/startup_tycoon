const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubmissionData() {
  console.log('🔍 Checking submission data...');
  
  const assignmentId = '667ab27f-86cd-4b8f-8751-b18d60dc0fdd';
  
  // Get submissions for this assignment
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      id,
      team_id,
      assignment_id,
      status,
      teams!inner(id, name, members)
    `)
    .eq('assignment_id', assignmentId);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📊 Submissions found:', submissions.length);
  submissions.forEach((sub, index) => {
    console.log(`  ${index + 1}. Submission ID: ${sub.id}, Team ID: ${sub.team_id}, Team Name: ${sub.teams?.name}, Members: ${sub.teams?.members?.length || 0}`);
  });
  
  // Check if team_id is null/undefined
  const nullTeamIds = submissions.filter(sub => !sub.team_id);
  if (nullTeamIds.length > 0) {
    console.log('\n❌ Found submissions with null team_id:', nullTeamIds.length);
    nullTeamIds.forEach(sub => {
      console.log(`  Submission ${sub.id}: team_id = ${sub.team_id}`);
    });
  } else {
    console.log('\n✅ All submissions have valid team_id');
  }
}

checkSubmissionData().catch(console.error);
