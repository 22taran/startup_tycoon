import { getSupabaseClient } from './database'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface EvaluationAssignment {
  assignment_id: string
  evaluator_student_id?: string
  evaluator_team_id?: string
  submission_id: string
  team_id?: string
  evaluation_status?: string
  due_at?: string
}

/**
 * Comprehensive validation for evaluation assignments
 */
export async function validateEvaluationAssignment(
  evaluation: EvaluationAssignment
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const supabase = getSupabaseClient()
    
    // 1. Basic field validation
    if (!evaluation.assignment_id) {
      errors.push('Assignment ID is required')
    }
    
    if (!evaluation.submission_id) {
      errors.push('Submission ID is required')
    }
    
    if (!evaluation.evaluator_student_id && !evaluation.evaluator_team_id) {
      errors.push('Either evaluator student ID or evaluator team ID must be provided')
    }
    
    if (evaluation.evaluator_student_id && evaluation.evaluator_team_id) {
      errors.push('Cannot specify both evaluator student ID and evaluator team ID')
    }
    
    // 2. Check if assignment exists and is valid
    if (evaluation.assignment_id) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('id, title, is_evaluation_active')
        .eq('id', evaluation.assignment_id)
        .single()
      
      if (assignmentError) {
        errors.push(`Assignment not found: ${assignmentError.message}`)
      } else if (!assignment.is_evaluation_active) {
        warnings.push('Assignment evaluation phase is not active')
      }
    }
    
    // 3. Check if submission exists and is submitted
    if (evaluation.submission_id) {
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('id, team_id, status, assignment_id')
        .eq('id', evaluation.submission_id)
        .single()
      
      if (submissionError) {
        errors.push(`Submission not found: ${submissionError.message}`)
      } else if (submission.status !== 'submitted') {
        errors.push('Can only evaluate submitted assignments')
      } else if (submission.assignment_id !== evaluation.assignment_id) {
        errors.push('Submission does not belong to the specified assignment')
      }
    }
    
    // 4. Validate individual evaluation (student evaluating)
    if (evaluation.evaluator_student_id) {
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', evaluation.evaluator_student_id)
        .single()
      
      if (studentError) {
        errors.push(`Student not found: ${studentError.message}`)
      } else if (student.role !== 'student') {
        errors.push('Only students can be assigned individual evaluations')
      }
      
      // Check for self-evaluation
      if (evaluation.submission_id) {
        const isSelfEvaluation = await checkIndividualSelfEvaluation(
          evaluation.evaluator_student_id,
          evaluation.submission_id
        )
        
        if (isSelfEvaluation) {
          errors.push('Self-evaluation not allowed: Student cannot evaluate their own team')
        }
      }
    }
    
    // 5. Validate team evaluation (team evaluating)
    if (evaluation.evaluator_team_id) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, members')
        .eq('id', evaluation.evaluator_team_id)
        .single()
      
      if (teamError) {
        errors.push(`Team not found: ${teamError.message}`)
      }
      
      // Check for team self-evaluation
      if (evaluation.team_id && evaluation.evaluator_team_id === evaluation.team_id) {
        errors.push('Self-evaluation not allowed: Team cannot evaluate itself')
      }
    }
    
    // 6. Check for duplicate evaluations
    if (evaluation.evaluator_student_id && evaluation.submission_id) {
      const { data: existing, error: duplicateError } = await supabase
        .from('assignment_evaluations')
        .select('id')
        .eq('evaluator_student_id', evaluation.evaluator_student_id)
        .eq('submission_id', evaluation.submission_id)
        .limit(1)
      
      if (duplicateError) {
        warnings.push(`Could not check for duplicates: ${duplicateError.message}`)
      } else if (existing && existing.length > 0) {
        errors.push('Student already has an evaluation assignment for this submission')
      }
    }
    
    // 7. Validate due date
    if (evaluation.due_at) {
      const dueDate = new Date(evaluation.due_at)
      const now = new Date()
      
      if (dueDate <= now) {
        warnings.push('Due date is in the past or today')
      }
      
      if (dueDate > new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('Due date is more than 30 days in the future')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    }
  }
}

/**
 * Check if a student is trying to evaluate their own team's submission
 */
async function checkIndividualSelfEvaluation(
  studentId: string,
  submissionId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        team_id,
        teams!inner(id, members)
      `)
      .eq('id', submissionId)
      .single()
    
    if (error || !data) {
      return false
    }
    
    // Type assertion to handle Supabase join structure
    const submission = data as {
      id: string
      team_id: string
      teams: Array<{
        id: string
        members: string[]
      }>
    }
    
    return submission.teams?.[0]?.members?.includes(studentId) || false
  } catch {
    return false
  }
}

/**
 * Validate multiple evaluation assignments in batch
 */
export async function validateEvaluationAssignments(
  evaluations: EvaluationAssignment[]
): Promise<{
  valid: EvaluationAssignment[]
  invalid: Array<{ evaluation: EvaluationAssignment; result: ValidationResult }>
}> {
  const valid: EvaluationAssignment[] = []
  const invalid: Array<{ evaluation: EvaluationAssignment; result: ValidationResult }> = []
  
  for (const evaluation of evaluations) {
    const result = await validateEvaluationAssignment(evaluation)
    
    if (result.isValid) {
      valid.push(evaluation)
    } else {
      invalid.push({ evaluation, result })
    }
  }
  
  return { valid, invalid }
}

/**
 * Check for existing self-evaluations in the database
 */
export async function findExistingSelfEvaluations(): Promise<{
  individual: Array<{ id: string; evaluator_id: string; team_id: string; submission_id: string }>
  team: Array<{ id: string; evaluator_team_id: string; team_id: string; submission_id: string }>
}> {
  try {
    const supabase = getSupabaseClient()
    
    // Find individual self-evaluations
    const { data: individualSelfEvals, error: individualError } = await supabase
      .from('assignment_evaluations')
      .select(`
        id,
        evaluator_student_id,
        submission_id,
        submissions!inner(
          team_id,
          teams!inner(id, members)
        )
      `)
      .not('evaluator_student_id', 'is', null)
    
    const individual = individualSelfEvals?.filter(evaluation => {
      const submission = Array.isArray(evaluation.submissions) ? evaluation.submissions[0] : evaluation.submissions
      return submission?.teams?.[0]?.members?.includes(evaluation.evaluator_student_id)
    }).map(evaluation => {
      const submission = Array.isArray(evaluation.submissions) ? evaluation.submissions[0] : evaluation.submissions
      return {
        id: evaluation.id,
        evaluator_id: evaluation.evaluator_student_id,
        team_id: submission?.teams?.[0]?.id,
        submission_id: evaluation.submission_id
      }
    }) || []
    
    // Find team self-evaluations
    const { data: teamSelfEvals, error: teamError } = await supabase
      .from('evaluations')
      .select('id, evaluator_team_id, team_id, submission_id')
      .eq('evaluator_team_id', 'team_id')
    
    const team = teamSelfEvals || []
    
    return { individual, team }
  } catch (error) {
    console.error('Error finding self-evaluations:', error)
    return { individual: [], team: [] }
  }
}

/**
 * Clean up existing self-evaluations
 */
export async function cleanupSelfEvaluations(): Promise<{
  deletedIndividual: number
  deletedTeam: number
  errors: string[]
}> {
  const errors: string[] = []
  let deletedIndividual = 0
  let deletedTeam = 0
  
  try {
    const supabase = getSupabaseClient()
    
    // Clean up individual self-evaluations
    const individualSelfEvals = await findExistingSelfEvaluations()
    
    if (individualSelfEvals.individual.length > 0) {
      const { error: deleteIndividualError } = await supabase
        .from('assignment_evaluations')
        .delete()
        .in('id', individualSelfEvals.individual.map(e => e.id))
      
      if (deleteIndividualError) {
        errors.push(`Failed to delete individual self-evaluations: ${deleteIndividualError.message}`)
      } else {
        deletedIndividual = individualSelfEvals.individual.length
      }
    }
    
    // Clean up team self-evaluations
    if (individualSelfEvals.team.length > 0) {
      const { error: deleteTeamError } = await supabase
        .from('evaluations')
        .delete()
        .in('id', individualSelfEvals.team.map(e => e.id))
      
      if (deleteTeamError) {
        errors.push(`Failed to delete team self-evaluations: ${deleteTeamError.message}`)
      } else {
        deletedTeam = individualSelfEvals.team.length
      }
    }
    
  } catch (error) {
    errors.push(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return { deletedIndividual, deletedTeam, errors }
}
