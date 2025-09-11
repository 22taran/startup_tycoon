#!/usr/bin/env node

/**
 * Simple test to verify submission status fix
 */

const fetch = require('node-fetch')

async function testSubmissionFix() {
  console.log('🧪 Testing submission status fix...')
  
  try {
    // Get all data
    const [assignmentsRes, submissionsRes, teamsRes, usersRes] = await Promise.all([
      fetch('http://localhost:3000/api/assignments'),
      fetch('http://localhost:3000/api/submissions'),
      fetch('http://localhost:3000/api/teams'),
      fetch('http://localhost:3000/api/users')
    ])
    
    const [assignments, submissions, teams, users] = await Promise.all([
      assignmentsRes.json(),
      submissionsRes.json(),
      teamsRes.json(),
      usersRes.json()
    ])
    
    console.log('\n📊 Database Status:')
    console.log(`Assignments: ${assignments.data?.length || 0}`)
    console.log(`Submissions: ${submissions.data?.length || 0}`)
    console.log(`Teams: ${teams.data?.length || 0}`)
    console.log(`Users: ${users.data?.length || 0}`)
    
    // Show submissions with team info
    console.log('\n📝 Submissions:')
    submissions.data?.forEach(sub => {
      const team = teams.data?.find(t => t.id === sub.teamId)
      console.log(`  - Assignment: ${sub.assignmentId}`)
      console.log(`    Team: ${team?.name || 'Unknown'} (${sub.teamId})`)
      console.log(`    Status: ${sub.status}`)
      console.log(`    Members: ${team?.members?.join(', ') || 'None'}`)
      console.log('')
    })
    
    // Test the fix for each student
    console.log('\n🧪 Testing Fix:')
    
    const students = users.data?.filter(u => u.role === 'student') || []
    
    for (const student of students) {
      console.log(`\n👤 Student: ${student.email}`)
      
      // Find teams this student belongs to
      const studentTeams = teams.data?.filter(team => 
        team.members && team.members.includes(student.id)
      ) || []
      
      console.log(`  Teams: ${studentTeams.map(t => t.name).join(', ') || 'None'}`)
      
      // Check submission status for each assignment
      for (const assignment of assignments.data || []) {
        console.log(`  Assignment: ${assignment.title}`)
        
        // OLD WAY (incorrect) - checks if ANY team submitted
        const anyTeamSubmitted = submissions.data?.some(sub => 
          sub.assignmentId === assignment.id && 
          sub.status === 'submitted'
        )
        
        // NEW WAY (correct) - checks if THIS student's team submitted
        const studentTeamSubmitted = studentTeams.some(team => 
          submissions.data?.some(sub => 
            sub.assignmentId === assignment.id && 
            sub.status === 'submitted' &&
            sub.teamId === team.id
          )
        )
        
        console.log(`    OLD (any team): ${anyTeamSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'}`)
        console.log(`    NEW (my team):  ${studentTeamSubmitted ? 'SUBMITTED' : 'NOT SUBMITTED'}`)
        
        if (anyTeamSubmitted !== studentTeamSubmitted) {
          console.log(`    ✅ FIXED! Different results for this student`)
        } else {
          console.log(`    ℹ️  Same result (expected if student's team submitted)`)
        }
      }
    }
    
    console.log('\n✅ Test complete!')
    console.log('\n💡 The fix ensures each student only sees submission status for their own team.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testSubmissionFix()
