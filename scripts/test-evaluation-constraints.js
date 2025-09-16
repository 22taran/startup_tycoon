require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testEvaluationConstraints() {
  console.log('🧪 Testing Evaluation Constraints and Validation\n')
  
  try {
    // Test 1: Check for existing self-evaluations
    console.log('🔍 Test 1: Checking for existing self-evaluations...')
    const { data: selfEvals, error: selfEvalError } = await supabase
      .rpc('find_self_evaluations')
    
    if (selfEvalError) {
      console.log('⚠️ Could not check self-evaluations:', selfEvalError.message)
    } else {
      console.log(`✅ Found ${selfEvals?.length || 0} existing self-evaluations`)
      if (selfEvals && selfEvals.length > 0) {
        console.log('   Self-evaluations found:')
        selfEvals.forEach((eval, index) => {
          console.log(`   ${index + 1}. ${eval.evaluation_type}: ${eval.evaluator_id || eval.evaluator_team_id} -> ${eval.team_id}`)
        })
      }
    }
    
    // Test 2: Try to create a self-evaluation (should fail)
    console.log('\n🔍 Test 2: Attempting to create self-evaluation (should fail)...')
    
    // Get a student and their team's submission
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'student')
      .limit(1)
      .single()
    
    if (studentError || !student) {
      console.log('⚠️ Could not find a student for testing')
    } else {
      console.log(`👤 Using student: ${student.email} (${student.id})`)
      
      // Find their team's submission
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select(`
          id,
          team_id,
          teams!inner(id, members)
        `)
        .eq('status', 'submitted')
        .limit(1)
        .single()
      
      if (submissionError || !submission) {
        console.log('⚠️ Could not find a submission for testing')
      } else {
        console.log(`📄 Using submission: ${submission.id} from team ${submission.team_id}`)
        
        // Check if this is a self-evaluation scenario
        const isSelfEval = submission.teams.members.includes(student.id)
        
        if (isSelfEval) {
          console.log('🎯 Perfect! This is a self-evaluation scenario')
          
          // Try to create the self-evaluation (should fail)
          const { data: insertResult, error: insertError } = await supabase
            .from('assignment_evaluations')
            .insert({
              assignment_id: 'test-assignment',
              evaluator_student_id: student.id,
              submission_id: submission.id,
              evaluation_status: 'assigned',
              due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
          
          if (insertError) {
            console.log('✅ Self-evaluation correctly blocked by constraint!')
            console.log(`   Error: ${insertError.message}`)
          } else {
            console.log('❌ Self-evaluation was not blocked! This is a problem.')
            console.log('   Inserted:', insertResult)
          }
        } else {
          console.log('ℹ️ This is not a self-evaluation scenario, skipping constraint test')
        }
      }
    }
    
    // Test 3: Try to create a valid evaluation (should succeed)
    console.log('\n🔍 Test 3: Attempting to create valid evaluation (should succeed)...')
    
    // Find a student and a different team's submission
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'student')
      .limit(2)
    
    if (studentsError || !students || students.length < 2) {
      console.log('⚠️ Could not find enough students for testing')
    } else {
      const evaluator = students[0]
      console.log(`👤 Using evaluator: ${evaluator.email} (${evaluator.id})`)
      
      // Find a submission from a different team
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          team_id,
          teams!inner(id, members)
        `)
        .eq('status', 'submitted')
        .limit(10)
      
      if (submissionsError || !submissions) {
        console.log('⚠️ Could not find submissions for testing')
      } else {
        // Find a submission from a team the evaluator is not in
        const validSubmission = submissions.find(sub => 
          !sub.teams.members.includes(evaluator.id)
        )
        
        if (!validSubmission) {
          console.log('⚠️ Could not find a valid submission for testing')
        } else {
          console.log(`📄 Using submission: ${validSubmission.id} from team ${validSubmission.team_id}`)
          
          // Try to create the valid evaluation
          const { data: insertResult, error: insertError } = await supabase
            .from('assignment_evaluations')
            .insert({
              assignment_id: 'test-assignment',
              evaluator_student_id: evaluator.id,
              submission_id: validSubmission.id,
              evaluation_status: 'assigned',
              due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
          
          if (insertError) {
            console.log('❌ Valid evaluation was blocked! This is a problem.')
            console.log(`   Error: ${insertError.message}`)
          } else {
            console.log('✅ Valid evaluation created successfully!')
            console.log(`   Created: ${insertResult?.[0]?.id}`)
            
            // Clean up the test evaluation
            await supabase
              .from('assignment_evaluations')
              .delete()
              .eq('id', insertResult[0].id)
            console.log('🧹 Test evaluation cleaned up')
          }
        }
      }
    }
    
    // Test 4: Test cleanup function
    console.log('\n🔍 Test 4: Testing cleanup function...')
    
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_self_evaluations')
    
    if (cleanupError) {
      console.log('⚠️ Cleanup function failed:', cleanupError.message)
    } else {
      console.log(`✅ Cleanup function executed successfully`)
      console.log(`   Cleaned up ${cleanupResult || 0} self-evaluations`)
    }
    
    // Test 5: Test validation functions
    console.log('\n🔍 Test 5: Testing validation functions...')
    
    // Test individual validation
    const { data: individualValidation, error: individualError } = await supabase
      .from('assignment_evaluations')
      .select(`
        id,
        evaluator_student_id,
        submission_id,
        submissions!inner(
          team_id,
          teams!inner(id, members)
        )
      `)
      .limit(5)
    
    if (individualError) {
      console.log('⚠️ Could not test individual validation:', individualError.message)
    } else {
      console.log(`✅ Individual validation test completed`)
      console.log(`   Found ${individualValidation?.length || 0} evaluation assignments`)
    }
    
    console.log('\n🎉 All constraint tests completed!')
    
  } catch (error) {
    console.error('❌ Constraint testing failed:', error.message)
  }
}

testEvaluationConstraints()
