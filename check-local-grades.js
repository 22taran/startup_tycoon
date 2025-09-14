const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLocalGrades() {
  try {
    console.log('🔍 Checking local grades...')
    
    // Get all grades
    const { data: grades, error } = await supabase
      .from('grades')
      .select(`
        *,
        teams:team_id (
          id,
          name,
          members
        ),
        assignments:assignment_id (
          id,
          title,
          course_id
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching grades:', error)
      return
    }
    
    console.log(`📊 Total grades in local database: ${grades.length}`)
    
    // Group by assignment
    const gradesByAssignment = grades.reduce((acc, grade) => {
      const assignmentId = grade.assignment_id
      if (!acc[assignmentId]) {
        acc[assignmentId] = []
      }
      acc[assignmentId].push(grade)
      return acc
    }, {})
    
    console.log('\n📋 Grades by assignment:')
    Object.keys(gradesByAssignment).forEach(assignmentId => {
      const assignmentGrades = gradesByAssignment[assignmentId]
      const assignment = assignmentGrades[0].assignments
      console.log(`\nAssignment: ${assignment?.title || 'Unknown'} (${assignmentId})`)
      console.log(`  Course ID: ${assignment?.course_id || 'Unknown'}`)
      console.log(`  Grades count: ${assignmentGrades.length}`)
      assignmentGrades.forEach(grade => {
        console.log(`    - Team: ${grade.teams?.name || 'Unknown'}, Status: ${grade.status || 'NULL'}, Grade: ${grade.grade}, Percentage: ${grade.percentage}%`)
      })
    })
    
    // Check for published vs draft grades
    const publishedGrades = grades.filter(g => g.status === 'published')
    const draftGrades = grades.filter(g => g.status === 'draft')
    const nullStatusGrades = grades.filter(g => !g.status)
    
    console.log('\n📊 Status breakdown:')
    console.log(`  Published: ${publishedGrades.length}`)
    console.log(`  Draft: ${draftGrades.length}`)
    console.log(`  NULL status: ${nullStatusGrades.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkLocalGrades()
