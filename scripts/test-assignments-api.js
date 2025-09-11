#!/usr/bin/env node

/**
 * Test assignments API to see the exact response format
 */

const fetch = require('node-fetch').default

async function testAssignmentsAPI() {
  console.log('🔍 Testing assignments API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/assignments', {
      method: 'GET',
    })
    
    if (response.status === 401) {
      console.log('✅ API requires authentication (expected)')
      console.log('\n💡 To debug this issue:')
      console.log('1. Open browser dev tools (F12)')
      console.log('2. Go to Admin Portal → Courses → Select Course')
      console.log('3. Look at the Network tab for the assignments API call')
      console.log('4. Check if the response has isEvaluationActive field')
      console.log('5. Check if the data is being set correctly in the component')
      
      return
    }
    
    const data = await response.json()
    console.log('📊 API Response:', JSON.stringify(data, null, 2))
    
    if (data.success && data.data) {
      console.log('\n📋 Assignments data:')
      data.data.forEach((assignment, index) => {
        console.log(`\n${index + 1}. ${assignment.title}`)
        console.log(`   Raw data:`, JSON.stringify(assignment, null, 2))
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAssignmentsAPI()
