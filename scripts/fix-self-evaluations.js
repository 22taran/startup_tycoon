const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixSelfEvaluations() {
  console.log('🔍 Checking for existing self-evaluations...')
  
  try {
    // Get all evaluation assignments
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
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
      return evaluation.evaluator_team_id === evaluation.team_id
    })
    
    if (selfEvaluations.length === 0) {
      console.log('✅ No self-evaluations found')
      return
    }
    
    console.log(`❌ Found ${selfEvaluations.length} self-evaluations:`)
    selfEvaluations.forEach(evaluation => {
      console.log(`   - Evaluation ID: ${evaluation.id}`)
      console.log(`   - Evaluator team: ${evaluation.evaluator_team_id}`)
      console.log(`   - Evaluated team: ${evaluation.team_id}`)
      console.log(`   - Assignment: ${evaluation.assignment_id}`)
    })
    
    // Delete self-evaluations
    const selfEvaluationIds = selfEvaluations.map(e => e.id)
    
    console.log(`🗑️ Deleting ${selfEvaluationIds.length} self-evaluations...`)
    
    const { error: deleteError } = await supabase
      .from('evaluations')
      .delete()
      .in('id', selfEvaluationIds)
    
    if (deleteError) throw deleteError
    
    console.log(`✅ Successfully deleted ${selfEvaluationIds.length} self-evaluations`)
    
    // Check if there are any remaining self-evaluations
    const { data: remainingEvaluations, error: remainingError } = await supabase
      .from('evaluations')
      .select('id, evaluator_team_id, team_id')
    
    if (remainingError) throw remainingError
    
    const remainingSelfEvaluations = remainingEvaluations?.filter(evaluation => {
      return evaluation.evaluator_team_id === evaluation.team_id
    }) || []
    
    if (remainingSelfEvaluations.length > 0) {
      console.log(`⚠️ Warning: ${remainingSelfEvaluations.length} self-evaluations still remain`)
    } else {
      console.log('✅ All self-evaluations have been removed')
    }
    
  } catch (error) {
    console.error('❌ Error fixing self-evaluations:', error.message)
    process.exit(1)
  }
}

// Run the fix
fixSelfEvaluations()
  .then(() => {
    console.log('🎉 Self-evaluation fix completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  })

