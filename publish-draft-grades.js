const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function publishDraftGrades() {
  try {
    console.log('🔍 Checking for draft grades...')
    
    // Get all draft grades
    const { data: draftGrades, error: fetchError } = await supabase
      .from('grades')
      .select(`
        *,
        teams:team_id (
          id,
          name
        ),
        assignments:assignment_id (
          id,
          title
        )
      `)
      .eq('status', 'draft')
    
    if (fetchError) {
      console.error('❌ Error fetching draft grades:', fetchError)
      return
    }
    
    if (!draftGrades || draftGrades.length === 0) {
      console.log('✅ No draft grades found - all grades are already published!')
      return
    }
    
    console.log(`📊 Found ${draftGrades.length} draft grades:`)
    draftGrades.forEach(grade => {
      console.log(`  - Assignment: ${grade.assignments?.title || 'Unknown'}, Team: ${grade.teams?.name || 'Unknown'}, Grade: ${grade.grade}`)
    })
    
    console.log('\n🔄 Publishing draft grades...')
    
    // Update all draft grades to published
    const { error: updateError } = await supabase
      .from('grades')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('status', 'draft')
    
    if (updateError) {
      console.error('❌ Error updating grades:', updateError)
      return
    }
    
    console.log('✅ Successfully published all draft grades!')
    console.log('🎉 Students should now be able to see all their grades in the portal.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

publishDraftGrades()
