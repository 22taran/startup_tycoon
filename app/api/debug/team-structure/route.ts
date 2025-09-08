import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('email')
    
    if (usersError) throw usersError
    
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, members, description')
      .order('name')
    
    if (teamsError) throw teamsError
    
    // Get all submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, assignment_id, team_id, status, submitted_at')
      .order('team_id')
    
    if (submissionsError) throw submissionsError
    
    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        teams: teams || [],
        submissions: submissions || [],
        summary: {
          totalUsers: users?.length || 0,
          totalStudents: users?.filter(u => u.role === 'student').length || 0,
          totalTeams: teams?.length || 0,
          totalSubmissions: submissions?.length || 0,
          studentsInTeams: teams?.reduce((count, team) => count + (team.members?.length || 0), 0) || 0
        }
      }
    })
  } catch (error) {
    console.error('Debug team structure error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to debug team structure' },
      { status: 500 }
    )
  }
}
