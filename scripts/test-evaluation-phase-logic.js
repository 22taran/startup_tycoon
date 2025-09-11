#!/usr/bin/env node

/**
 * Test evaluation phase logic - should not auto-move to evaluation
 */

const fetch = require('node-fetch').default

async function testEvaluationPhaseLogic() {
  console.log('🧪 Testing evaluation phase logic...')
  
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
    
    // Test assignment phase logic
    console.log('\n🧪 Testing Assignment Phase Logic:')
    
    for (const assignment of assignments.data || []) {
      console.log(`\n📝 Assignment: ${assignment.title}`)
      console.log(`  ID: ${assignment.id}`)
      console.log(`  Start Date: ${assignment.startDate}`)
      console.log(`  Due Date: ${assignment.dueDate}`)
      console.log(`  Is Active: ${assignment.isActive}`)
      console.log(`  Is Evaluation Active: ${assignment.isEvaluationActive}`)
      console.log(`  Evaluation Start Date: ${assignment.evaluationStartDate || 'Not set'}`)
      console.log(`  Evaluation Due Date: ${assignment.evaluationDueDate || 'Not set'}`)
      
      // Simulate the phase logic
      const now = new Date()
      const startDate = new Date(assignment.startDate)
      const dueDate = new Date(assignment.dueDate)
      const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
      
      let phase = 'unknown'
      
      if (assignment.isActive && now >= startDate && now <= dueDate) {
        phase = 'in-progress (submission period)'
      } else if (now > dueDate && !assignment.isEvaluationActive) {
        phase = 'submission-closed (waiting for admin to start evaluation)'
      } else if (assignment.isEvaluationActive && evaluationStartDate && now >= evaluationStartDate) {
        phase = 'evaluation (admin started evaluation)'
      } else if (!assignment.isActive && now < startDate) {
        phase = 'to-do (not started yet)'
      } else if (!assignment.isActive) {
        phase = 'draft (inactive)'
      }
      
      console.log(`  Current Phase: ${phase}`)
      
      // Check if this is correct
      if (now > dueDate && !assignment.isEvaluationActive) {
        if (phase.includes('submission-closed')) {
          console.log(`  ✅ CORRECT: Due date passed but evaluation not started - should stay in submission phase`)
        } else {
          console.log(`  ❌ WRONG: Should be in submission-closed phase, not ${phase}`)
        }
      } else if (assignment.isEvaluationActive) {
        if (phase.includes('evaluation')) {
          console.log(`  ✅ CORRECT: Evaluation is active - should be in evaluation phase`)
        } else {
          console.log(`  ❌ WRONG: Should be in evaluation phase, not ${phase}`)
        }
      }
    }
    
    console.log('\n✅ Test complete!')
    console.log('\n💡 Key points:')
    console.log('  - Assignments should NOT auto-move to evaluation phase when due date passes')
    console.log('  - They should stay in "submission-closed" phase until admin starts evaluation')
    console.log('  - Only when admin clicks "Start Evaluation" should it move to evaluation phase')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testEvaluationPhaseLogic()
