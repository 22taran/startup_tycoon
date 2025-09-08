import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getEvaluationAssignmentsByEvaluatorTeam, getTeams } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }
    
    // Use user ID directly from session (best practice)
    if (!session.user.id) {
      return NextResponse.json({ success: true, data: [] })
    }
    
    // Find which team the student belongs to
    const teams = await getTeams()
    const studentTeam = teams.find(team => 
      team.members && team.members.includes(session.user.id)
    )
    
    if (!studentTeam) {
      console.log(`🔍 API: Student ${session.user.id} is not in any team`)
      return NextResponse.json({ success: true, data: [] })
    }
    
    console.log(`🔍 API: Fetching evaluations for team ${studentTeam.id} (${studentTeam.name})`)
    const evaluations = await getEvaluationAssignmentsByEvaluatorTeam(studentTeam.id)
    console.log(`🔍 API: Returning ${evaluations.length} evaluations for team ${studentTeam.id}`)
    
    return NextResponse.json({ success: true, data: evaluations })
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}
