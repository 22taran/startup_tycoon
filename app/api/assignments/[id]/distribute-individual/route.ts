import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { distributeEvaluationsToStudents } from '@/lib/individual-evaluation'

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
    
    // Distribute evaluations to individual students
    const evaluations = await distributeEvaluationsToStudents(
      assignmentId, 
      evaluationsPerStudent,
      evaluationStartDate,
      evaluationDueDate
    )
    
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
