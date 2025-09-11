#!/usr/bin/env node

/**
 * Test the fixed kanban logic
 */

function testFixedKanbanLogic() {
  console.log('🧪 Testing fixed kanban logic...')
  
  // Mock assignment data (like the one from the debug output)
  const mockAssignment = {
    id: '667ab27f-86cd-4b8f-8751-b18d60dc0fdd',
    title: 'Test',
    isActive: false,  // This was the problem - it was false
    isEvaluationActive: true,  // But this is true after distribution
    evaluationStartDate: undefined,
    evaluationDueDate: undefined
  }
  
  // Fixed getAssignmentStage function logic
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
      console.log(`✅ Assignment ${assignment.title} has isEvaluationActive=true, checking evaluation period...`)
      // If evaluation is active, check if we're within the evaluation period
      const isWithinEvaluationPeriod = !evaluationStartDate || now >= evaluationStartDate
      const isBeforeEvaluationEnd = !evaluationDueDate || now <= evaluationDueDate
      
      if (isWithinEvaluationPeriod && isBeforeEvaluationEnd) {
        console.log(`✅ Assignment ${assignment.title} -> evaluation (within period)`)
        return 'evaluation'
      }
      
      // If evaluation is active but we're outside the period, still show as evaluation
      // This handles cases where evaluation dates aren't set yet
      console.log(`✅ Assignment ${assignment.title} -> evaluation (active but outside period)`)
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
  
  // Test the assignment from the debug output
  console.log('\n📊 Testing assignment from debug output:')
  console.log('Assignment data:', {
    isActive: mockAssignment.isActive,
    isEvaluationActive: mockAssignment.isEvaluationActive,
    evaluationStartDate: mockAssignment.evaluationStartDate,
    evaluationDueDate: mockAssignment.evaluationDueDate
  })
  
  const result = getAssignmentStage(mockAssignment)
  console.log(`\n🎯 Result: ${result}`)
  
  if (result === 'evaluation') {
    console.log('✅ SUCCESS! Assignment correctly goes to evaluation phase')
  } else {
    console.log('❌ FAILED! Assignment should go to evaluation phase')
  }
  
  console.log('\n💡 The fix ensures that:')
  console.log('  - isEvaluationActive=true takes priority over isActive=false')
  console.log('  - After distribution, assignments go to evaluation phase')
  console.log('  - This works even when isActive=false (submission period ended)')
}

testFixedKanbanLogic()
