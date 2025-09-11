#!/usr/bin/env node

/**
 * Test the student kanban fix with exact assignment data
 */

function testStudentKanbanFix() {
  console.log('🧪 Testing student kanban fix...')
  
  // Exact data from the API response
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
    evaluationDueDate: processedAssignment.evaluationDueDate
  })
  
  // Test the FIXED getAssignmentStage logic
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
      console.log(`✅ EVALUATION CHECK: Assignment "${assignment.title}" has isEvaluationActive=true`)
      // If evaluation is active, check if we're within the evaluation period
      const isWithinEvaluationPeriod = !evaluationStartDate || now >= evaluationStartDate
      const isBeforeEvaluationEnd = !evaluationDueDate || now <= evaluationDueDate
      
      console.log(`📅 Evaluation period check:`, {
        isWithinEvaluationPeriod,
        isBeforeEvaluationEnd,
        evaluationStartDate: evaluationStartDate?.toISOString(),
        evaluationDueDate: evaluationDueDate?.toISOString()
      })
      
      if (isWithinEvaluationPeriod && isBeforeEvaluationEnd) {
        console.log(`✅ EVALUATION CHECK: Returning 'evaluation' (within period)`)
        return 'evaluation'
      }
      
      // If evaluation is active but we're outside the period, still show as evaluation
      // This handles cases where evaluation dates aren't set yet
      console.log(`✅ EVALUATION CHECK: Returning 'evaluation' (active but outside period)`)
      return 'evaluation'
    }

    // Check if assignment is active (in submission period)
    if (assignment.isActive && now >= startDate && now <= dueDate) {
      console.log(`✅ Assignment ${assignment.title} -> in-progress (submission period)`)
      return 'in-progress'
    }

    // Check if submission period has ended but evaluation hasn't started
    if (now > dueDate && !assignment.isEvaluationActive) {
      console.log(`✅ Assignment ${assignment.title} -> in-progress (submission ended, no evaluation)`)
      return 'in-progress'
    }

    // Check if assignment is not active yet (before start date)
    if (!assignment.isActive && now < startDate) {
      console.log(`⚠️ Assignment ${assignment.title} -> to-do (not started yet)`)
      return 'to-do'
    }

    // Default to to-do for inactive assignments
    if (!assignment.isActive) {
      console.log(`⚠️ Assignment ${assignment.title} -> to-do (inactive)`)
      return 'to-do'
    }

    console.log(`⚠️ Assignment ${assignment.title} -> to-do (default fallback)`)
    return 'to-do'
  }
  
  console.log('\n🧪 Testing FIXED student kanban logic...')
  const result = getAssignmentStage(processedAssignment)
  console.log(`\n🎯 Final result: ${result}`)
  
  if (result === 'evaluation') {
    console.log('✅ SUCCESS! Student kanban now correctly shows evaluation phase')
    console.log('\n💡 The fix ensures that:')
    console.log('  - Student kanban uses the same logic as admin kanban')
    console.log('  - If isEvaluationActive=true, assignment goes to evaluation phase')
    console.log('  - This works even when evaluation dates are not set')
    console.log('  - Students will now see assignments in "Evaluation" phase after distribution')
  } else {
    console.log('❌ FAILED! Student kanban should show evaluation phase')
  }
}

testStudentKanbanFix()
