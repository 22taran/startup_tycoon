const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGradeInsert() {
  try {
    console.log('🧪 Testing grade insert with different status values...')
    
    // Test with valid status values
    const testGrades = [
      {
        assignment_id: 'test-assignment-1',
        team_id: 'test-team-1',
        submission_id: 'test-submission-1',
        average_investment: 50,
        grade: 'high',
        percentage: 90,
        total_investments: 3,
        status: 'draft'
      },
      {
        assignment_id: 'test-assignment-2',
        team_id: 'test-team-2',
        submission_id: 'test-submission-2',
        average_investment: 30,
        grade: 'median',
        percentage: 70,
        total_investments: 2,
        status: 'published'
      }
    ]
    
    console.log('📝 Testing insert with valid status values...')
    console.log('Test grades:', testGrades.map(g => ({ status: g.status })))
    
    // Try to insert test grades
    const { data, error } = await supabase
      .from('grades')
      .insert(testGrades)
      .select()
    
    if (error) {
      console.error('❌ Error inserting test grades:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ Test grades inserted successfully:', data)
      
      // Clean up test data
      console.log('🧹 Cleaning up test data...')
      const { error: deleteError } = await supabase
        .from('grades')
        .delete()
        .in('assignment_id', ['test-assignment-1', 'test-assignment-2'])
      
      if (deleteError) {
        console.error('❌ Error cleaning up test data:', deleteError)
      } else {
        console.log('✅ Test data cleaned up')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testGradeInsert()
