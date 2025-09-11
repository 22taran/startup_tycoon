#!/usr/bin/env node

/**
 * Test kanban board submission status display
 */

const fetch = require('node-fetch').default

async function testKanbanSubmissionStatus() {
  console.log('🧪 Testing kanban board submission status...')
  
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
    
    // Show submissions
    console.log('\n📝 Submissions:')
    submissions.data?.forEach(sub => {
      const team = teams.data?.find(t => t.id === sub.teamId)
      console.log(`  - Assignment: ${sub.assignmentId}`)
      console.log(`    Team: ${team?.name || 'Unknown'} (${sub.teamId})`)
      console.log(`    Status: ${sub.status}`)
      console.log(`    Members: ${team?.members?.join(', ') || 'None'}`)
    })
    
    // Test submission status for each student
    console.log('\n🧪 Testing kanban submission status:')
    
    const students = users.data?.filter(u => u.role === 'student') || []
    
    for (const student of students) {
      console.log(`\n👤 Student: ${student.email} (${student.id})`)
      
      // Find teams this student belongs to
      const studentTeams = teams.data?.filter(team => 
        team.members && team.members.includes(student.id)
      ) || []
      
      console.log(`  Teams: ${studentTeams.map(t => t.name).join(', ') || 'None'}`)
      
      // Check submission status for each assignment
      for (const assignment of assignments.data || []) {
        console.log(`  Assignment: ${assignment.title} (${assignment.id})`)
        
        // Simulate the kanban board logic
        const isSubmitted = studentTeams.some(team => 
          submissions.data?.some(sub => 
            sub.assignmentId === assignment.id && 
            sub.status === 'submitted' &&
            sub.teamId === team.id
          )
        )
        
        console.log(`    Kanban Status: ${isSubmitted ? 'SUBMITTED ✅' : 'NOT SUBMITTED ❌'}`)
        
        if (isSubmitted) {
          const submission = submissions.data?.find(sub => 
            sub.assignmentId === assignment.id && 
            sub.status === 'submitted' &&
            studentTeams.some(team => team.id === sub.teamId)
          )
          console.log(`      Submission ID: ${submission?.id}`)
        }
      }
    }
    
    console.log('\n✅ Test complete!')
    console.log('\n💡 If you see "SUBMITTED ✅" for students who have submitted, the kanban board should work correctly.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testKanbanSubmissionStatus()
