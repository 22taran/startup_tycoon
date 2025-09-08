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
    
    // Get all users with their team assignments
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role, team_id')
      .order('team_id')
    
    if (usersError) throw usersError
    
    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, members')
      .order('name')
    
    if (teamsError) throw teamsError
    
    // Get all submissions with team info
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
        submissions: submissions || []
      }
    })
  } catch (error) {
    console.error('Debug teams error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to debug teams' },
      { status: 500 }
    )
  }
}
