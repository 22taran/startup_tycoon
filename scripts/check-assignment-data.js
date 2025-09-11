#!/usr/bin/env node

/**
 * Check current assignment data to debug the issue
 */

const fetch = require('node-fetch').default

async function checkAssignmentData() {
  console.log('🔍 Checking current assignment data...')
  
  try {
    // Test 1: Check if we can fetch assignments
    console.log('\n📡 Fetching assignments...')
    const assignmentsResponse = await fetch('http://localhost:3000/api/assignments', {
      method: 'GET',
    })
    
    if (assignmentsResponse.status === 401) {
      console.log('✅ API requires authentication (expected)')
      console.log('\n💡 To debug this issue:')
      console.log('1. Open browser dev tools (F12)')
      console.log('2. Go to Admin Portal → Courses → Select Course')
      console.log('3. Look at the console logs for:')
      console.log('   - "🎯 EVALUATION CHECK: Assignment [name] has isEvaluationActive=true"')
      console.log('   - "📊 ASSIGNMENT STAGE: [name] -> evaluation"')
      console.log('4. If you see "isEvaluationActive: false", the distribution didn\'t work')
      console.log('5. If you see "isEvaluationActive: true" but stage is "draft", there\'s a logic bug')
      
      console.log('\n🔍 Expected behavior after clicking "Start Evaluation":')
      console.log('1. Modal opens with evaluation dates')
      console.log('2. You set dates and click "Set Deadline & Distribute"')
      console.log('3. Console shows: "🎯 Starting evaluation distribution..."')
      console.log('4. Console shows: "✅ Evaluation distribution successful"')
      console.log('5. Console shows: "🎯 EVALUATION CHECK: Assignment [name] has isEvaluationActive=true"')
      console.log('6. Console shows: "📊 ASSIGNMENT STAGE: [name] -> evaluation"')
      console.log('7. Kanban board shows assignment in "Evaluation" column')
      
      return
    }
    
    const assignmentsData = await assignmentsResponse.json()
    
    if (assignmentsData.success) {
      console.log('✅ Successfully fetched assignments')
      console.log('\n📊 Current assignments:')
      assignmentsData.data.forEach((assignment, index) => {
        console.log(`\n${index + 1}. ${assignment.title}`)
        console.log(`   ID: ${assignment.id}`)
        console.log(`   isActive: ${assignment.isActive}`)
        console.log(`   isEvaluationActive: ${assignment.isEvaluationActive}`)
        console.log(`   evaluationStartDate: ${assignment.evaluationStartDate || 'undefined'}`)
        console.log(`   evaluationDueDate: ${assignment.evaluationDueDate || 'undefined'}`)
        console.log(`   startDate: ${assignment.startDate}`)
        console.log(`   dueDate: ${assignment.dueDate}`)
      })
      
      // Check if any assignments have isEvaluationActive = true
      const evaluationActive = assignmentsData.data.filter(a => a.isEvaluationActive)
      if (evaluationActive.length > 0) {
        console.log('\n✅ Found assignments with isEvaluationActive=true:')
        evaluationActive.forEach(assignment => {
          console.log(`   - ${assignment.title} (${assignment.id})`)
        })
        console.log('\n💡 These should show in "Evaluation" phase in kanban board')
      } else {
        console.log('\n❌ No assignments found with isEvaluationActive=true')
        console.log('💡 This means the distribution didn\'t work or data wasn\'t saved')
      }
    } else {
      console.log('❌ Failed to fetch assignments:', assignmentsData.error)
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

checkAssignmentData()
