#!/usr/bin/env node

/**
 * Test current assignment status to see if isEvaluationActive is properly set
 */

const fetch = require('node-fetch').default

async function testCurrentAssignmentStatus() {
  console.log('🔍 Testing current assignment status...')
  
  try {
    const response = await fetch('http://localhost:3000/api/assignments', {
      method: 'GET',
    })
    
    if (response.status === 401) {
      console.log('✅ API requires authentication (expected)')
      console.log('\n💡 To debug this issue:')
      console.log('1. Open browser dev tools (F12)')
      console.log('2. Go to Admin Portal → Courses → Select Course')
      console.log('3. Click "Start Evaluation" on a submitted assignment')
      console.log('4. Check if the assignment moves to "Evaluation" phase in kanban')
      console.log('5. If not, check the browser console for any errors')
      
      console.log('\n🔍 Expected behavior:')
      console.log('1. Click "Start Evaluation" → Modal opens')
      console.log('2. Set evaluation dates → Click "Set Deadline & Distribute"')
      console.log('3. Assignment should move to "Evaluation" phase immediately')
      console.log('4. Students should see evaluations in Course Dashboard')
      
      return
    }
    
    const data = await response.json()
    
    if (data.success && data.data) {
      console.log('✅ Successfully fetched assignments')
      console.log('\n📊 Current assignments:')
      
      data.data.forEach((assignment, index) => {
        console.log(`\n${index + 1}. ${assignment.title}`)
        console.log(`   ID: ${assignment.id}`)
        console.log(`   isActive: ${assignment.isActive}`)
        console.log(`   isEvaluationActive: ${assignment.isEvaluationActive}`)
        console.log(`   evaluationStartDate: ${assignment.evaluationStartDate || 'undefined'}`)
        console.log(`   evaluationDueDate: ${assignment.evaluationDueDate || 'undefined'}`)
        
        // Test the kanban logic
        const now = new Date()
        const startDate = new Date(assignment.startDate)
        const dueDate = new Date(assignment.dueDate)
        const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
        const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null
        
        let stage = 'draft'
        
        // Check if assignment is in evaluation period - THIS SHOULD BE CHECKED FIRST
        if (assignment.isEvaluationActive) {
          const isWithinEvaluationPeriod = !evaluationStartDate || now >= evaluationStartDate
          const isBeforeEvaluationEnd = !evaluationDueDate || now <= evaluationDueDate
          
          if (isWithinEvaluationPeriod && isBeforeEvaluationEnd) {
            stage = 'evaluation'
          } else {
            stage = 'evaluation'
          }
        } else if (assignment.isActive && now >= startDate && now <= dueDate) {
          stage = 'active'
        } else if (now > dueDate && !assignment.isEvaluationActive) {
          stage = 'submitted'
        } else if (!assignment.isActive && now < startDate) {
          stage = 'draft'
        } else if (!assignment.isActive) {
          stage = 'draft'
        }
        
        console.log(`   Expected stage: ${stage}`)
        
        if (assignment.isEvaluationActive && stage !== 'evaluation') {
          console.log(`   ❌ ISSUE: isEvaluationActive=true but stage=${stage}`)
        } else if (assignment.isEvaluationActive && stage === 'evaluation') {
          console.log(`   ✅ CORRECT: isEvaluationActive=true and stage=evaluation`)
        }
      })
      
    } else {
      console.log('❌ Failed to fetch assignments:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCurrentAssignmentStatus()
