import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { 
  createAssignmentTeam, 
  getAssignmentTeams, 
  getAvailableTeamsForAssignment,
  getStudentAssignmentTeam,
  canStudentChangeTeams
} from '@/lib/per-assignment-teams'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const type = searchParams.get('type') // 'all', 'available', 'my-team'
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    if (type === 'all') {
      // Get all teams for assignment (admin/instructor view)
      if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
        return NextResponse.json({ error: 'Admin/Instructor access required' }, { status: 403 })
      }
      
      const teams = await getAssignmentTeams(assignmentId)
      return NextResponse.json({ success: true, data: teams })
    }
    
    if (type === 'available') {
      // Get available teams for joining
      const teams = await getAvailableTeamsForAssignment(assignmentId)
      return NextResponse.json({ success: true, data: teams })
    }
    
    if (type === 'my-team') {
      // Get student's current team
      if (session.user.role !== 'student') {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 })
      }
      
      const team = await getStudentAssignmentTeam(session.user.id, assignmentId)
      return NextResponse.json({ success: true, data: team })
    }
    
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    
  } catch (error) {
    console.error('Error fetching assignment teams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

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
    const { assignmentId, teamName, studentIds, description } = body
    
    if (!assignmentId || !teamName || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ 
        error: 'Assignment ID, team name, and student IDs are required' 
      }, { status: 400 })
    }
    
    if (studentIds.length < 1 || studentIds.length > 2) {
      return NextResponse.json({ 
        error: 'Teams must have 1-2 students' 
      }, { status: 400 })
    }
    
    // Ensure current user is included in the team
    if (!studentIds.includes(session.user.id)) {
      return NextResponse.json({ 
        error: 'You must include yourself in the team' 
      }, { status: 400 })
    }
    
    const result = await createAssignmentTeam(assignmentId, teamName, studentIds, description)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Team created successfully',
      data: result 
    })
    
  } catch (error) {
    console.error('Error creating assignment team:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create team' 
      },
      { status: 500 }
    )
  }
}
