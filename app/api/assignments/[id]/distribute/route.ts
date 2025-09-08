import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { distributeAssignments, isAssignmentDistributed } from '@/lib/database'

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
    
    // Get evaluation count from request body
    const body = await request.json().catch(() => ({}))
    const evaluationsPerStudent = body.evaluationsPerStudent || 5
    
    // Validate evaluation count
    if (evaluationsPerStudent < 1 || evaluationsPerStudent > 10) {
      return NextResponse.json({ 
        error: 'Invalid evaluation count',
        message: 'Evaluations per student must be between 1 and 10'
      }, { status: 400 })
    }
    
    // Check if assignment is already distributed
    const alreadyDistributed = await isAssignmentDistributed(assignmentId)
    if (alreadyDistributed) {
      return NextResponse.json({ 
        error: 'Assignment has already been distributed',
        message: 'This assignment has already been distributed to students for evaluation.'
      }, { status: 400 })
    }
    
    // Distribute assignments
    const evaluations = await distributeAssignments(assignmentId, evaluationsPerStudent)
    
    return NextResponse.json({
      success: true,
      message: `Successfully distributed assignment to ${evaluations.length} evaluation assignments`,
      data: {
        assignmentId,
        totalEvaluations: evaluations.length,
        evaluationsPerStudent
      }
    })
    
  } catch (error) {
    console.error('Error distributing assignments:', error)
    return NextResponse.json(
      { 
        error: 'Failed to distribute assignments',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(
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
    
    // Check if assignment is distributed
    const isDistributed = await isAssignmentDistributed(assignmentId)
    
    return NextResponse.json({
      success: true,
      data: {
        assignmentId,
        isDistributed
      }
    })
    
  } catch (error) {
    console.error('Error checking assignment distribution:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check assignment distribution',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
