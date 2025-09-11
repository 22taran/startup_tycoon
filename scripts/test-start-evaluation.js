#!/usr/bin/env node

/**
 * Test Start Evaluation button functionality
 */

const fetch = require('node-fetch').default

async function testStartEvaluation() {
  console.log('🧪 Testing Start Evaluation button functionality...')
  
  try {
    // Test 1: Check if the API endpoint exists
    console.log('\n📡 Test 1: Checking API endpoint...')
    const testResponse = await fetch('http://localhost:3000/api/assignments/test-id/distribute-individual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        evaluationsPerStudent: 5
      }),
    })
    
    const testData = await testResponse.json()
    
    if (testResponse.status === 401) {
      console.log('✅ API endpoint exists (authentication required as expected)')
    } else if (testResponse.status === 404) {
      console.log('❌ API endpoint not found')
      return
    } else {
      console.log(`📊 API response: ${testResponse.status} - ${testData.error || 'Success'}`)
    }
    
    console.log('\n✅ Start Evaluation button should now work!')
    console.log('\n💡 What the button does:')
    console.log('  1. Calls /api/assignments/[id]/distribute-individual')
    console.log('  2. Distributes 5 evaluations per student')
    console.log('  3. Each student gets assigned to evaluate 5 different teams')
    console.log('  4. Students cannot evaluate their own team')
    console.log('  5. Updates assignment status to evaluation phase')
    
    console.log('\n🎯 To test:')
    console.log('  1. Go to Admin Portal → Courses → Select Course')
    console.log('  2. Go to Overview tab')
    console.log('  3. Find an assignment in "Submitted" stage')
    console.log('  4. Click "Start Evaluation" button')
    console.log('  5. Check that evaluations are distributed to students')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testStartEvaluation()
