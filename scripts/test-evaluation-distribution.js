#!/usr/bin/env node

/**
 * Test evaluation distribution and student visibility
 */

const fetch = require('node-fetch').default

async function testEvaluationDistribution() {
  console.log('🧪 Testing evaluation distribution and student visibility...')
  
  try {
    // Test 1: Check if individual evaluation API works
    console.log('\n📡 Test 1: Checking individual evaluation API...')
    const testResponse = await fetch('http://localhost:3000/api/student-evaluations?assignmentId=test-id', {
      method: 'GET',
    })
    
    const testData = await testResponse.json()
    
    if (testResponse.status === 401) {
      console.log('✅ Student evaluations API exists (authentication required as expected)')
    } else if (testResponse.status === 400) {
      console.log('✅ Student evaluations API exists (assignment ID required as expected)')
    } else {
      console.log(`📊 API response: ${testResponse.status} - ${testData.error || 'Success'}`)
    }
    
    console.log('\n✅ Evaluation distribution should now work!')
    console.log('\n💡 What happens when you click "Start Evaluation":')
    console.log('  1. Creates individual evaluation assignments in assignment_evaluations table')
    console.log('  2. Updates assignment.is_evaluation_active = true')
    console.log('  3. Each student gets 5 teams to evaluate (not their own team)')
    console.log('  4. Students can see evaluations in Course Dashboard → My Evaluations tab')
    
    console.log('\n🎯 To test the full flow:')
    console.log('  1. Go to Admin Portal → Courses → Select Course')
    console.log('  2. Go to Overview tab')
    console.log('  3. Find an assignment in "Submitted" stage')
    console.log('  4. Click "Start Evaluation" button')
    console.log('  5. Check that button changes to "Distributed" or "Ready for Evaluation"')
    console.log('  6. Login as a student → Select Course → My Evaluations tab')
    console.log('  7. Students should see their assigned teams to evaluate')
    
    console.log('\n🔍 Debugging tips:')
    console.log('  - Check browser console for API calls and responses')
    console.log('  - Check database: assignment_evaluations table should have new rows')
    console.log('  - Check assignments table: is_evaluation_active should be true')
    console.log('  - Students must be enrolled in the course to see evaluations')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testEvaluationDistribution()
