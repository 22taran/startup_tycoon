import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { calculateGradesForAssignment } from '@/lib/database'

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
    
    // Trigger grade calculation
    await calculateGradesForAssignment(assignmentId)
    
    return NextResponse.json({
      success: true,
      message: `Grades calculated successfully for assignment ${assignmentId}`,
      data: { assignmentId }
    })
    
  } catch (error) {
    console.error('Error triggering evaluation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger evaluation',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
