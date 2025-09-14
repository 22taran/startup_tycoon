const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkConstraint() {
  try {
    console.log('🔍 Checking grades table constraint...')
    
    // Try to insert a grade with an invalid status to see the exact error
    const { data: existingGrades } = await supabase
      .from('grades')
      .select('assignment_id, team_id, submission_id')
      .limit(1)
    
    if (!existingGrades || existingGrades.length === 0) {
      console.log('❌ No existing grades found to test with')
      return
    }
    
    const existingGrade = existingGrades[0]
    console.log('📊 Using existing grade data for test:', {
      assignment_id: existingGrade.assignment_id,
      team_id: existingGrade.team_id,
      submission_id: existingGrade.submission_id
    })
    
    // Test with invalid status
    console.log('🧪 Testing with invalid status "invalid_status"...')
    const { error: invalidError } = await supabase
      .from('grades')
      .insert({
        assignment_id: existingGrade.assignment_id,
        team_id: existingGrade.team_id,
        submission_id: existingGrade.submission_id,
        average_investment: 50,
        grade: 'high',
        percentage: 90,
        total_investments: 3,
        status: 'invalid_status'
      })
    
    if (invalidError) {
      console.log('✅ Constraint working - invalid status rejected:')
      console.log('Error:', invalidError.message)
    } else {
      console.log('❌ Constraint not working - invalid status accepted!')
    }
    
    // Test with valid status
    console.log('\n🧪 Testing with valid status "draft"...')
    const { error: validError } = await supabase
      .from('grades')
      .insert({
        assignment_id: existingGrade.assignment_id,
        team_id: existingGrade.team_id,
        submission_id: existingGrade.submission_id,
        average_investment: 50,
        grade: 'high',
        percentage: 90,
        total_investments: 3,
        status: 'draft'
      })
    
    if (validError) {
      console.log('❌ Valid status rejected:')
      console.log('Error:', validError.message)
    } else {
      console.log('✅ Valid status accepted')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkConstraint()
