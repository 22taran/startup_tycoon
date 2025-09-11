import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { changeStudentTeam, canStudentChangeTeams } from '@/lib/per-assignment-teams'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }
    
    const body = await request.json()
    const { assignmentId, newTeamId, reason } = body
    
    if (!assignmentId || !newTeamId) {
      return NextResponse.json({ 
        error: 'Assignment ID and new team ID are required' 
      }, { status: 400 })
    }
    
    // Check if student can change teams
    const canChange = await canStudentChangeTeams(session.user.id, assignmentId)
    
    if (!canChange.canChange) {
      return NextResponse.json({ 
        error: canChange.reason 
      }, { status: 400 })
    }
    
    const result = await changeStudentTeam(assignmentId, session.user.id, newTeamId, reason)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Team changed successfully',
      data: result 
    })
    
  } catch (error) {
    console.error('Error changing team:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to change team' 
      },
      { status: 500 }
    )
  }
}
