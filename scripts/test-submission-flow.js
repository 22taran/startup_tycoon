#!/usr/bin/env node

/**
 * Test submission flow to verify UI updates
 */

const fetch = require('node-fetch').default

async function testSubmissionFlow() {
  console.log('🧪 Testing submission flow...')
  
  try {
    // First, let's see the current state
    console.log('\n📊 Current state:')
    const [assignmentsRes, submissionsRes, teamsRes] = await Promise.all([
      fetch('http://localhost:3000/api/assignments'),
      fetch('http://localhost:3000/api/submissions'),
      fetch('http://localhost:3000/api/teams')
    ])
    
    const [assignments, submissions, teams] = await Promise.all([
      assignmentsRes.json(),
      submissionsRes.json(),
      teamsRes.json()
    ])
    
    console.log(`Assignments: ${assignments.data?.length || 0}`)
    console.log(`Submissions: ${submissions.data?.length || 0}`)
    console.log(`Teams: ${teams.data?.length || 0}`)
    
    // Show current submissions
    console.log('\n📝 Current submissions:')
    submissions.data?.forEach(sub => {
      const team = teams.data?.find(t => t.id === sub.teamId)
      console.log(`  - Assignment: ${sub.assignmentId}`)
      console.log(`    Team: ${team?.name || 'Unknown'} (${sub.teamId})`)
      console.log(`    Status: ${sub.status}`)
      console.log(`    Submitted at: ${sub.submittedAt}`)
    })
    
    // Test creating a new submission
    console.log('\n🧪 Testing new submission...')
    
    const assignmentId = assignments.data?.[0]?.id
    const teamId = teams.data?.[0]?.id
    
    if (!assignmentId || !teamId) {
      console.log('❌ No assignment or team found for testing')
      return
    }
    
    console.log(`Using assignment: ${assignmentId}`)
    console.log(`Using team: ${teamId}`)
    
    // Create a test submission
    const testSubmission = {
      assignmentId,
      teamId,
      title: 'Test Submission',
      primaryLink: 'https://test.com',
      backupLink: 'https://backup.com',
      status: 'submitted'
    }
    
    console.log('Creating submission:', testSubmission)
    
    const response = await fetch('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSubmission),
    })
    
    const result = await response.json()
    console.log('Submission result:', result)
    
    if (result.success) {
      console.log('✅ Submission created successfully!')
      
      // Check if the submission appears in the list
      console.log('\n🔄 Checking updated submissions...')
      const updatedSubmissionsRes = await fetch('http://localhost:3000/api/submissions')
      const updatedSubmissions = await updatedSubmissionsRes.json()
      
      console.log(`Updated submissions count: ${updatedSubmissions.data?.length || 0}`)
      
      // Show the new submission
      const newSubmission = updatedSubmissions.data?.find(sub => sub.id === result.data.id)
      if (newSubmission) {
        console.log('✅ New submission found in API response:', {
          id: newSubmission.id,
          assignmentId: newSubmission.assignmentId,
          teamId: newSubmission.teamId,
          status: newSubmission.status
        })
      } else {
        console.log('❌ New submission not found in API response')
      }
    } else {
      console.log('❌ Submission failed:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testSubmissionFlow()
