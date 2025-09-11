const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEvaluationStatusLogic() {
  console.log('🔍 Debugging evaluation status logic...');
  
  const assignmentId = '667ab27f-86cd-4b8f-8751-b18d60dc0fdd';
  
  // Get all students enrolled in the course
  const { data: courseData, error: courseError } = await supabase
    .from('course_enrollments')
    .select(`
      user_id,
      users!inner(id, name, email)
    `)
    .eq('course_id', (await supabase
      .from('assignments')
      .select('course_id')
      .eq('id', assignmentId)
      .single()
    ).data?.course_id)
    .eq('role', 'student')
    .eq('status', 'active');
  
  if (courseError) {
    console.error('❌ Course Error:', courseError);
    return;
  }
  
  console.log('👥 Students found:', courseData.length);
  
  // Get evaluation assignments for this assignment
  const { data: evaluations, error: evalError } = await supabase
    .from('assignment_evaluations')
    .select(`
      evaluator_student_id,
      evaluated_team_id,
      evaluation_status,
      completed_at
    `)
    .eq('assignment_id', assignmentId);
  
  if (evalError) {
    console.error('❌ Evaluation Error:', evalError);
    return;
  }
  
  console.log('📊 Total evaluations found:', evaluations.length);
  
  // Process the data to create status for each student
  const evaluationStatus = courseData.map((enrollment) => {
    const studentId = enrollment.user_id;
    const studentName = enrollment.users.name;
    const studentEmail = enrollment.users.email;
    
    // Count evaluations for this student
    const studentEvaluations = evaluations.filter(e => e.evaluator_student_id === studentId);
    const completedEvaluations = studentEvaluations.filter(e => e.evaluation_status === 'completed').length;
    const totalEvaluations = studentEvaluations.length;
    const pendingEvaluations = totalEvaluations - completedEvaluations;
    const evaluationProgress = totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0;
    
    console.log(`\n👤 Student: ${studentName} (${studentEmail})`);
    console.log(`  📊 Total evaluations: ${totalEvaluations}`);
    console.log(`  ✅ Completed: ${completedEvaluations}`);
    console.log(`  ⏳ Pending: ${pendingEvaluations}`);
    console.log(`  📈 Progress: ${evaluationProgress}%`);
    
    // Show evaluation details
    studentEvaluations.forEach((eval, index) => {
      console.log(`    ${index + 1}. Team: ${eval.evaluated_team_id}, Status: ${eval.evaluation_status}`);
    });
    
    return {
      studentId,
      studentName,
      studentEmail,
      totalEvaluations,
      completedEvaluations,
      pendingEvaluations,
      evaluationProgress
    };
  });
  
  console.log('\n📋 Summary:');
  const totalStudents = evaluationStatus.length;
  const studentsWith5Evaluations = evaluationStatus.filter(s => s.totalEvaluations === 5).length;
  const studentsWithCompletedEvaluations = evaluationStatus.filter(s => s.completedEvaluations > 0).length;
  
  console.log(`  Total students: ${totalStudents}`);
  console.log(`  Students with 5 evaluations: ${studentsWith5Evaluations}`);
  console.log(`  Students with completed evaluations: ${studentsWithCompletedEvaluations}`);
}

debugEvaluationStatusLogic().catch(console.error);
