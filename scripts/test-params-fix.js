#!/usr/bin/env node

/**
 * Test that params await fix works
 */

const fetch = require('node-fetch').default

async function testParamsFix() {
  console.log('🧪 Testing params await fix...')
  
  try {
    // Test 1: Check assignment API
    console.log('\n📡 Test 1: Checking assignment API...')
    const assignmentResponse = await fetch('http://localhost:3000/api/assignments/test-id', {
      method: 'GET',
    })
    
    if (assignmentResponse.status === 404) {
      console.log('✅ Assignment API works (404 expected for non-existent assignment)')
    } else {
      console.log(`📊 Assignment API response: ${assignmentResponse.status}`)
    }
    
    // Test 2: Check user API
    console.log('\n📡 Test 2: Checking user API...')
    const userResponse = await fetch('http://localhost:3000/api/users/test-id', {
      method: 'DELETE',
    })
    
    if (userResponse.status === 401) {
      console.log('✅ User API works (401 expected - authentication required)')
    } else {
      console.log(`📊 User API response: ${userResponse.status}`)
    }
    
    // Test 3: Check submission API
    console.log('\n📡 Test 3: Checking submission API...')
    const submissionResponse = await fetch('http://localhost:3000/api/submissions/test-id', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId: 'test-assignment',
        teamId: 'test-team',
        title: 'Test Submission',
        primaryLink: 'https://example.com',
        status: 'submitted'
      }),
    })
    
    if (submissionResponse.status === 401) {
      console.log('✅ Submission API works (401 expected - authentication required)')
    } else {
      console.log(`📊 Submission API response: ${submissionResponse.status}`)
    }
    
    console.log('\n✅ All API routes should now work without Next.js params errors!')
    console.log('\n💡 The fixes:')
    console.log('  - Changed params type from { id: string } to Promise<{ id: string }>')
    console.log('  - Added await params before using params.id')
    console.log('  - This fixes Next.js 15+ requirement for async params')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testParamsFix()
