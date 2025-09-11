#!/usr/bin/env node

/**
 * Debug script to check submission status logic
 */

const fetch = require('node-fetch').default

async function debugSubmissionStatus() {
  console.log('🔍 Debugging submission status...')
  
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
    
    console.log('\n📊 Database Data:')
    console.log(`Assignments: ${assignments.data?.length || 0}`)
    console.log(`Submissions: ${submissions.data?.length || 0}`)
    console.log(`Teams: ${teams.data?.length || 0}`)
    console.log(`Users: ${users.data?.length || 0}`)
    
    // Show submissions
    console.log('\n📝 Submissions:')
    submissions.data?.forEach(sub => {
      console.log(`  - Assignment: ${sub.assignmentId}, Team: ${sub.teamId}, Status: ${sub.status}`)
    })
    
    // Show teams
    console.log('\n👥 Teams:')
    teams.data?.forEach(team => {
      console.log(`  - Team: ${team.id} (${team.name}), Members: ${team.members?.join(', ') || 'None'}`)
    })
    
    // Show users
    console.log('\n👤 Users:')
    users.data?.forEach(user => {
      console.log(`  - User: ${user.id} (${user.email}), Role: ${user.role}`)
    })
    
    // Test submission status for each student
    console.log('\n🧪 Testing submission status for each student:')
    
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
        
        for (const team of studentTeams) {
          const submission = submissions.data?.find(sub => 
            sub.assignmentId === assignment.id && 
            sub.status === 'submitted' &&
            sub.teamId === team.id
          )
          
          console.log(`    Team ${team.name}: ${submission ? 'SUBMITTED' : 'NOT SUBMITTED'}`)
          if (submission) {
            console.log(`      Submission ID: ${submission.id}`)
          }
        }
      }
    }
    
    console.log('\n✅ Debug complete!')
    console.log('\nIf you see "SUBMITTED" for multiple teams, that means the issue is in the UI logic.')
    console.log('If you see "NOT SUBMITTED" for all teams, that means the submissions table is correct.')
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

debugSubmissionStatus()
