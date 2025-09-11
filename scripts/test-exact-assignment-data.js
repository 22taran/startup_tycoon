#!/usr/bin/env node

/**
 * Test with exact assignment data from API
 */

function testExactAssignmentData() {
  console.log('🧪 Testing with exact assignment data from API...')
  
  // Exact data from API response
  const assignment = {
    "id": "667ab27f-86cd-4b8f-8751-b18d60dc0fdd",
    "title": "Test",
    "description": "",
    "startDate": "2025-09-10T06:06:00.000Z",
    "dueDate": "2025-09-10T06:14:00.000Z",
    "documentUrl": null,
    "isActive": false,
    "isEvaluationActive": true,
    "createdAt": "2025-09-10T04:56:05.871Z",
    "updatedAt": "2025-09-10T04:56:05.871Z",
    "courseId": "d419a107-7d3b-44ae-ac7a-2b47ac571cda"
  }
  
  // Convert to the format expected by the component
  const processedAssignment = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    startDate: new Date(assignment.startDate),
    dueDate: new Date(assignment.dueDate),
    documentUrl: assignment.documentUrl,
    isActive: assignment.isActive,
    isEvaluationActive: assignment.isEvaluationActive,
    evaluationStartDate: assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : undefined,
    evaluationDueDate: assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : undefined,
    createdAt: new Date(assignment.createdAt),
    updatedAt: new Date(assignment.updatedAt),
    courseId: assignment.courseId
  }
  
  console.log('📊 Processed assignment:', {
    id: processedAssignment.id,
    title: processedAssignment.title,
    isActive: processedAssignment.isActive,
    isEvaluationActive: processedAssignment.isEvaluationActive,
    evaluationStartDate: processedAssignment.evaluationStartDate,
    evaluationDueDate: processedAssignment.evaluationDueDate,
    startDate: processedAssignment.startDate.toISOString(),
    dueDate: processedAssignment.dueDate.toISOString()
  })
  
  // Test the getAssignmentStage logic
  function getAssignmentStage(assignment) {
    const now = new Date()
    const startDate = new Date(assignment.startDate)
    const dueDate = new Date(assignment.dueDate)
    const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
    const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null

    // Check if assignment has grades (indicating completion)
    const assignmentGrades = [] // Mock empty grades
    if (assignmentGrades.length > 0) {
      return 'completed'
    }

    // Check if assignment is completed (evaluation phase has ended)
    if (evaluationDueDate && now > evaluationDueDate && !assignment.isEvaluationActive) {
      return 'completed'
    }

    // Check if assignment is in evaluation period - THIS SHOULD BE CHECKED FIRST
    if (assignment.isEvaluationActive) {
      console.log(`🎯 EVALUATION CHECK: Assignment "${assignment.title}" has isEvaluationActive=true`)
      // If evaluation is active, check if we're within the evaluation period
      const isWithinEvaluationPeriod = !evaluationStartDate || now >= evaluationStartDate
      const isBeforeEvaluationEnd = !evaluationDueDate || now <= evaluationDueDate
      
      console.log(`🎯 EVALUATION CHECK: Period check - within: ${isWithinEvaluationPeriod}, before end: ${isBeforeEvaluationEnd}`)
      
      if (isWithinEvaluationPeriod && isBeforeEvaluationEnd) {
        console.log(`🎯 EVALUATION CHECK: Returning 'evaluation' (within period)`)
        return 'evaluation'
      }
      
      // If evaluation is active but we're outside the period, still show as evaluation
      // This handles cases where evaluation dates aren't set yet
      console.log(`🎯 EVALUATION CHECK: Returning 'evaluation' (active but outside period)`)
      return 'evaluation'
    }

    // Check if assignment is active (in submission period)
    if (assignment.isActive && now >= startDate && now <= dueDate) {
      console.log(`✅ Assignment ${assignment.title} -> active (submission period)`)
      return 'active'
    }

    // Check if submission period has ended but evaluation hasn't started
    if (now > dueDate && !assignment.isEvaluationActive) {
      console.log(`✅ Assignment ${assignment.title} -> submitted (submission ended, no evaluation)`)
      return 'submitted'
    }

    // Check if assignment is not active yet (before start date)
    if (!assignment.isActive && now < startDate) {
      console.log(`⚠️ Assignment ${assignment.title} -> draft (not started yet)`)
      return 'draft'
    }

    // Default to draft for inactive assignments
    if (!assignment.isActive) {
      console.log(`⚠️ Assignment ${assignment.title} -> draft (inactive)`)
      return 'draft'
    }

    console.log(`⚠️ Assignment ${assignment.title} -> draft (default fallback)`)
    return 'draft'
  }
  
  console.log('\n🧪 Testing getAssignmentStage with exact data...')
  const result = getAssignmentStage(processedAssignment)
  console.log(`\n🎯 Final result: ${result}`)
  
  if (result === 'evaluation') {
    console.log('✅ SUCCESS! Assignment correctly goes to evaluation phase')
  } else {
    console.log('❌ FAILED! Assignment should go to evaluation phase')
    console.log('💡 This suggests there might be a data mapping issue in the frontend')
  }
}

testExactAssignmentData()
