const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSelfEvaluations() {
  console.log('🔍 Checking for existing self-evaluations...')
  
  try {
    // Get all evaluation assignments
    const { data: evaluations, error: evalError } = await supabase
      .from('assignment_evaluations')
      .select(`
        *,
        submissions:submission_id(
          team_id,
          teams:team_id(id, name, members)
        )
      `)
    
    if (evalError) throw evalError
    
    console.log(`📊 Found ${evaluations?.length || 0} evaluation assignments`)
    
    if (!evaluations || evaluations.length === 0) {
      console.log('✅ No evaluations found')
      return
    }
    
    // Check for self-evaluations
    const selfEvaluations = evaluations.filter(evaluation => {
      const submission = evaluation.submissions
      return submission?.teams?.members?.includes(evaluation.evaluator_student_id)
    })
    
    if (selfEvaluations.length > 0) {
      console.error(`❌ FOUND ${selfEvaluations.length} SELF-EVALUATIONS!`)
      console.error('')
      
      selfEvaluations.forEach((evaluation, index) => {
        console.error(`${index + 1}. Student ${evaluation.evaluator_student_id} evaluating team ${evaluation.evaluated_team_id}`)
        console.error(`   - Assignment: ${evaluation.assignment_id}`)
        console.error(`   - Submission: ${evaluation.submission_id}`)
        console.error(`   - Team members: ${evaluation.submissions?.teams?.members?.join(', ')}`)
        console.error(`   - Status: ${evaluation.evaluation_status}`)
        console.error('')
      })
      
      // Optionally delete these self-evaluations
      console.log('🗑️  Deleting self-evaluations...')
      const deleteIds = selfEvaluations.map(evaluation => evaluation.id)
      
      const { error: deleteError } = await supabase
        .from('assignment_evaluations')
        .delete()
        .in('id', deleteIds)
      
      if (deleteError) {
        console.error('❌ Error deleting self-evaluations:', deleteError)
      } else {
        console.log(`✅ Deleted ${selfEvaluations.length} self-evaluations`)
      }
    } else {
      console.log('✅ No self-evaluations found')
    }
    
  } catch (error) {
    console.error('❌ Error checking self-evaluations:', error)
  }
}

checkSelfEvaluations()
