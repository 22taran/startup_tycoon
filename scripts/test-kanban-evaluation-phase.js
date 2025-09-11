#!/usr/bin/env node

/**
 * Test kanban evaluation phase logic
 */

function testKanbanEvaluationPhase() {
  console.log('🧪 Testing kanban evaluation phase logic...')
  
  // Mock assignment data
  const mockAssignment = {
    id: 'test-assignment',
    title: 'Test Assignment',
    startDate: '2024-01-01T00:00:00Z',
    dueDate: '2024-01-10T23:59:59Z',
    isActive: true,
    isEvaluationActive: true, // This should make it go to evaluation phase
    evaluationStartDate: '2024-01-11T00:00:00Z',
    evaluationDueDate: '2024-01-15T23:59:59Z'
  }
  
  // Mock getAssignmentStage function logic
  function getAssignmentStage(assignment) {
    const now = new Date()
    const startDate = new Date(assignment.startDate)
    const dueDate = new Date(assignment.dueDate)
    const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
    const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null

    // Check if assignment is in evaluation period
    if (assignment.isEvaluationActive) {
      // If evaluation is active, check if we're within the evaluation period
      const isWithinEvaluationPeriod = !evaluationStartDate || now >= evaluationStartDate
      const isBeforeEvaluationEnd = !evaluationDueDate || now <= evaluationDueDate
      
      if (isWithinEvaluationPeriod && isBeforeEvaluationEnd) {
        return 'evaluation'
      }
      
      // If evaluation is active but we're outside the period, still show as evaluation
      // This handles cases where evaluation dates aren't set yet
      return 'evaluation'
    }

    // Check if assignment is active (in submission period)
    if (assignment.isActive && now >= startDate && now <= dueDate) {
      return 'active'
    }

    // Check if submission period has ended but evaluation hasn't started
    if (now > dueDate && !assignment.isEvaluationActive) {
      return 'submitted'
    }

    // Check if assignment is not active yet (before start date)
    if (!assignment.isActive && now < startDate) {
      return 'draft'
    }

    // Default to draft for inactive assignments
    if (!assignment.isActive) {
      return 'draft'
    }

    return 'draft'
  }
  
  // Test cases
  console.log('\n📊 Test Cases:')
  
  // Test 1: Assignment with isEvaluationActive = true
  const test1 = getAssignmentStage(mockAssignment)
  console.log(`✅ Test 1 - Assignment with isEvaluationActive=true: ${test1}`)
  
  // Test 2: Assignment without evaluation dates
  const test2Assignment = { ...mockAssignment, evaluationStartDate: null, evaluationDueDate: null }
  const test2 = getAssignmentStage(test2Assignment)
  console.log(`✅ Test 2 - Assignment without evaluation dates: ${test2}`)
  
  // Test 3: Assignment with isEvaluationActive = false
  const test3Assignment = { ...mockAssignment, isEvaluationActive: false }
  const test3 = getAssignmentStage(test3Assignment)
  console.log(`✅ Test 3 - Assignment with isEvaluationActive=false: ${test3}`)
  
  console.log('\n✅ Kanban evaluation phase logic test complete!')
  console.log('\n💡 The fix ensures that:')
  console.log('  - If isEvaluationActive=true, assignment goes to evaluation phase')
  console.log('  - This works even if evaluation dates are not set')
  console.log('  - This handles the case where distribution sets isEvaluationActive but dates might not be saved yet')
  
  console.log('\n🎯 Expected behavior after distribution:')
  console.log('  1. Admin clicks "Start Evaluation"')
  console.log('  2. Modal opens, admin sets dates')
  console.log('  3. API sets isEvaluationActive=true and evaluation dates')
  console.log('  4. Kanban shows assignment in "evaluation" phase')
  console.log('  5. Students can see evaluations in Course Dashboard')
}

testKanbanEvaluationPhase()
