import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { lockTeamsForAssignment } from '@/lib/per-assignment-teams'

export async function POST(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Admin/Instructor access required' }, { status: 403 })
    }
    
    const { assignmentId } = await request.json()
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    await lockTeamsForAssignment(assignmentId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teams locked successfully for this assignment' 
    })
    
  } catch (error) {
    console.error('Error locking teams:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to lock teams' 
      },
      { status: 500 }
    )
  }
}
