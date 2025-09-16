import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { distributeEvaluationsToStudents } from '@/lib/individual-evaluation'
import { validateEvaluationAssignments, cleanupSelfEvaluations } from '@/lib/evaluation-validation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { id: assignmentId } = await params
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    // Get evaluation parameters from request body
    const body = await request.json().catch(() => ({}))
    const evaluationsPerStudent = body.evaluationsPerStudent || 5
    const evaluationStartDate = body.evaluationStartDate
    const evaluationDueDate = body.evaluationDueDate
    
    // Validate evaluation count
    if (evaluationsPerStudent < 1 || evaluationsPerStudent > 10) {
      return NextResponse.json({ 
        error: 'Invalid evaluation count',
        message: 'Evaluations per student must be between 1 and 10'
      }, { status: 400 })
    }
    
    // Validate evaluation dates
    if (!evaluationStartDate || !evaluationDueDate) {
      return NextResponse.json({ 
        error: 'Missing evaluation dates',
        message: 'Evaluation start and due dates are required'
      }, { status: 400 })
    }
    
    // Validate date logic
    const startDate = new Date(evaluationStartDate)
    const dueDate = new Date(evaluationDueDate)
    
    if (startDate >= dueDate) {
      return NextResponse.json({ 
        error: 'Invalid evaluation dates',
        message: 'Evaluation due date must be after start date'
      }, { status: 400 })
    }
    
    if (dueDate <= new Date()) {
      return NextResponse.json({ 
        error: 'Invalid evaluation dates',
        message: 'Evaluation due date must be in the future'
      }, { status: 400 })
    }
    
    // Clean up any existing self-evaluations before distribution
    console.log('🧹 Cleaning up existing self-evaluations...')
    const cleanupResult = await cleanupSelfEvaluations()
    if (cleanupResult.deletedIndividual > 0 || cleanupResult.deletedTeam > 0) {
      console.log(`✅ Cleaned up ${cleanupResult.deletedIndividual} individual and ${cleanupResult.deletedTeam} team self-evaluations`)
    }
    if (cleanupResult.errors.length > 0) {
      console.warn('⚠️ Cleanup warnings:', cleanupResult.errors)
    }
    
    // Distribute evaluations to individual students
    const evaluations = await distributeEvaluationsToStudents(
      assignmentId, 
      evaluationsPerStudent,
      evaluationStartDate,
      evaluationDueDate
    )
    
    // Validate all created evaluations
    console.log('🔍 Validating created evaluations...')
    const validationResult = await validateEvaluationAssignments(evaluations)
    
    if (validationResult.invalid.length > 0) {
      console.error('❌ Found invalid evaluations:', validationResult.invalid)
      return NextResponse.json({
        success: false,
        error: 'Some evaluations failed validation',
        details: validationResult.invalid.map(({ evaluation, result }) => ({
          evaluation,
          errors: result.errors,
          warnings: result.warnings
        }))
      }, { status: 400 })
    }
    
    console.log(`✅ All ${validationResult.valid.length} evaluations passed validation`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully distributed ${evaluations.length} individual evaluations`,
      data: {
        evaluationsCount: evaluations.length,
        evaluationsPerStudent
      }
    })
    
  } catch (error) {
    console.error('Error distributing individual evaluations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to distribute evaluations' 
      },
      { status: 500 }
    )
  }
}
