const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixGradesStatus() {
  try {
    console.log('🔍 Checking and fixing grades status...')
    
    // Get all grades to check their status
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
    
    if (gradesError) {
      console.error('❌ Error fetching grades:', gradesError)
      return
    }
    
    console.log(`📊 Found ${grades.length} grades`)
    
    // Check for invalid status values
    const invalidStatuses = grades.filter(grade => 
      !grade.status || 
      !['draft', 'pending_review', 'approved', 'published'].includes(grade.status)
    )
    
    if (invalidStatuses.length > 0) {
      console.log(`⚠️  Found ${invalidStatuses.length} grades with invalid status:`)
      invalidStatuses.forEach(grade => {
        console.log(`  - ID: ${grade.id}, Status: ${grade.status || 'NULL'}, Created: ${grade.created_at}`)
      })
      
      // Fix invalid statuses
      console.log('\n🔧 Fixing invalid statuses...')
      for (const grade of invalidStatuses) {
        const { error: updateError } = await supabase
          .from('grades')
          .update({ 
            status: 'published',
            published_at: grade.created_at
          })
          .eq('id', grade.id)
        
        if (updateError) {
          console.error(`❌ Error updating grade ${grade.id}:`, updateError)
        } else {
          console.log(`✅ Fixed grade ${grade.id}`)
        }
      }
    } else {
      console.log('✅ All grades have valid status values')
    }
    
    // Check for NULL status values
    const nullStatuses = grades.filter(grade => !grade.status)
    if (nullStatuses.length > 0) {
      console.log(`\n⚠️  Found ${nullStatuses.length} grades with NULL status`)
      console.log('🔧 Setting NULL statuses to published...')
      
      for (const grade of nullStatuses) {
        const { error: updateError } = await supabase
          .from('grades')
          .update({ 
            status: 'published',
            published_at: grade.created_at
          })
          .eq('id', grade.id)
        
        if (updateError) {
          console.error(`❌ Error updating grade ${grade.id}:`, updateError)
        } else {
          console.log(`✅ Fixed grade ${grade.id}`)
        }
      }
    }
    
    console.log('\n✅ Grade status fix completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixGradesStatus()
