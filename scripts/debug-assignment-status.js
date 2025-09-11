#!/usr/bin/env node

/**
 * Debug assignment status after distribution
 */

const fetch = require('node-fetch').default

async function debugAssignmentStatus() {
  console.log('🔍 Debugging assignment status after distribution...')
  
  try {
    // Test 1: Check if we can fetch assignments
    console.log('\n📡 Test 1: Fetching assignments...')
    const assignmentsResponse = await fetch('http://localhost:3000/api/assignments', {
      method: 'GET',
    })
    
    if (assignmentsResponse.status === 401) {
      console.log('✅ API requires authentication (expected)')
      console.log('💡 To debug:')
      console.log('  1. Open browser dev tools')
      console.log('  2. Go to Admin Portal → Courses → Select Course')
      console.log('  3. Click "Start Evaluation" on a submitted assignment')
      console.log('  4. Check console logs for assignment stage calculation')
      console.log('  5. Look for logs like: "🔍 Assignment [name] stage calculation:"')
      console.log('  6. Check if isEvaluationActive is true or false')
      
      console.log('\n🔍 Expected console output after distribution:')
      console.log('  ✅ Assignment [name] has isEvaluationActive=true, checking evaluation period...')
      console.log('  ✅ Assignment [name] -> evaluation (active but outside period)')
      
      console.log('\n❌ If you see this instead:')
      console.log('  ⚠️ Assignment [name] -> draft (inactive)')
      console.log('  Then isEvaluationActive is false or not set')
      
      return
    }
    
    const assignmentsData = await assignmentsResponse.json()
    
    if (assignmentsData.success) {
      console.log('✅ Successfully fetched assignments')
      console.log('📊 Assignments:', assignmentsData.data.map(a => ({
        id: a.id,
        title: a.title,
        isActive: a.isActive,
        isEvaluationActive: a.isEvaluationActive,
        evaluationStartDate: a.evaluationStartDate,
        evaluationDueDate: a.evaluationDueDate
      })))
    } else {
      console.log('❌ Failed to fetch assignments:', assignmentsData.error)
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

debugAssignmentStatus()
