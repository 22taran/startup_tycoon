const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function calculateStudentInterest(studentId, assignmentId) {
  console.log(`🎯 Calculating interest for student: ${studentId}`);
  
  // Get student investments
  const { data: investments, error: invError } = await supabase
    .from('assignment_investments')
    .select('invested_team_id, tokens_invested')
    .eq('investor_student_id', studentId)
    .eq('assignment_id', assignmentId);
  
  if (invError) throw invError;
  
  let totalInterest = 0;
  
  for (const investment of investments || []) {
    // Get team performance (grades)
    const { data: grade, error: gradeError } = await supabase
      .from('grades')
      .select('grade, percentage')
      .eq('assignment_id', assignmentId)
      .eq('team_id', investment.invested_team_id)
      .single();
    
    if (gradeError) {
      console.warn(`⚠️ No grade found for team ${investment.invested_team_id}:`, gradeError.message);
      continue;
    }
    
    // Calculate interest based on team performance
    let interestRate = 0;
    switch (grade.grade) {
      case 'high':
        interestRate = 0.2; // 20% interest
        break;
      case 'median':
        interestRate = 0.1; // 10% interest
        break;
      case 'low':
        interestRate = 0.05; // 5% interest
        break;
      case 'incomplete':
        interestRate = 0; // No interest
        break;
    }
    
    const interest = investment.tokens_invested * interestRate;
    totalInterest += interest;
    
    // Clear existing interest for this student/assignment/team combination first
    await supabase
      .from('student_interest_tracking')
      .delete()
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .eq('invested_team_id', investment.invested_team_id);
    
    // Store interest earned
    const { error: storeError } = await supabase
      .from('student_interest_tracking')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        invested_team_id: investment.invested_team_id,
        tokens_invested: investment.tokens_invested,
        team_performance_tier: grade.grade,
        interest_earned: interest
      });
    
    if (storeError) {
      console.error(`❌ Error storing interest:`, storeError);
    } else {
      console.log(`✅ Team ${investment.invested_team_id}: ${investment.tokens_invested} tokens → ${interest} interest (${grade.grade} tier)`);
    }
  }
  
  return totalInterest;
}

async function calculateAllInterest() {
  console.log('🔄 Calculating interest for all assignments...');
  
  // Get all assignments
  const { data: assignments } = await supabase.from('assignments').select('id, title');
  console.log(`📚 Found ${assignments?.length || 0} assignments`);
  
  for (const assignment of assignments || []) {
    console.log(`\n🎯 Processing assignment: ${assignment.title} (${assignment.id})`);
    
    // Get all students who invested in this assignment
    const { data: investments } = await supabase
      .from('assignment_investments')
      .select('investor_student_id')
      .eq('assignment_id', assignment.id);
    
    if (investments && investments.length > 0) {
      const uniqueStudentIds = Array.from(new Set(investments.map(inv => inv.investor_student_id)));
      console.log(`💰 Found ${uniqueStudentIds.length} students who invested`);
      
      for (const studentId of uniqueStudentIds) {
        try {
          const interest = await calculateStudentInterest(studentId, assignment.id);
          console.log(`✅ Student ${studentId}: Total interest = ${interest}`);
        } catch (error) {
          console.error(`❌ Error calculating interest for student ${studentId}:`, error.message);
        }
      }
    } else {
      console.log('⚠️ No investments found for this assignment');
    }
  }
  
  console.log('\n🎉 Interest calculation completed!');
  
  // Show summary
  const { data: totalInterest } = await supabase
    .from('student_interest_tracking')
    .select('interest_earned');
  
  const total = totalInterest?.reduce((sum, record) => sum + (record.interest_earned || 0), 0) || 0;
  console.log(`\n📊 Total interest across all students: ${total}`);
}

calculateAllInterest().catch(console.error);
