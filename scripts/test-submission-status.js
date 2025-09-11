#!/usr/bin/env node

/**
 * Test script to verify submission status is working correctly
 */

const fetch = require('node-fetch')

async function testSubmissionStatus() {
  console.log('🧪 Testing submission status fix...')
  
  try {
    // Test 1: Get assignments
    console.log('\n1. Testing assignments API...')
    const assignmentsResponse = await fetch('http://localhost:3000/api/assignments')
    const assignmentsData = await assignmentsResponse.json()
    
    if (assignmentsData.success && assignmentsData.data.length > 0) {
      console.log(`✅ Found ${assignmentsData.data.length} assignments`)
      
      // Test 2: Get teams for first assignment's course
      const firstAssignment = assignmentsData.data[0]
      console.log(`\n2. Testing teams for assignment: ${firstAssignment.title}`)
      
      const teamsResponse = await fetch(`http://localhost:3000/api/teams?courseId=${firstAssignment.courseId}`)
      const teamsData = await teamsResponse.json()
      
      if (teamsData.success && teamsData.data.length > 0) {
        console.log(`✅ Found ${teamsData.data.length} teams for this course`)
        
        // Test 3: Get submissions
        console.log('\n3. Testing submissions API...')
        const submissionsResponse = await fetch('http://localhost:3000/api/submissions')
        const submissionsData = await submissionsResponse.json()
        
        if (submissionsData.success) {
          console.log(`✅ Found ${submissionsData.data.length} submissions`)
          
          // Test 4: Check if migration is needed
          console.log('\n4. Checking if migration is needed...')
          const migrationResponse = await fetch('http://localhost:3000/api/migrate-teams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          const migrationData = await migrationResponse.json()
          
          if (migrationData.success) {
            console.log(`✅ Migration completed: ${migrationData.data.totalMembershipsCreated} memberships created`)
          } else {
            console.log(`⚠️ Migration failed: ${migrationData.error}`)
          }
        } else {
          console.log('❌ Failed to fetch submissions')
        }
      } else {
        console.log('❌ No teams found for this course')
      }
    } else {
      console.log('❌ No assignments found')
    }
    
    console.log('\n🎉 Test completed!')
    console.log('\nNext steps:')
    console.log('1. Login as different students')
    console.log('2. Check if they see different submission statuses')
    console.log('3. Submit assignments and verify status updates correctly')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testSubmissionStatus()
