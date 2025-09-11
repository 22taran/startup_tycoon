import { NextRequest, NextResponse } from 'next/server'
import { getSubmissions, createSubmission } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { Submission } from '@/types'

export async function GET() {
  try {
    const submissions = await getSubmissions()
    return NextResponse.json({ success: true, data: submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
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
    
    const user = session.user

    const body = await request.json()
    const { assignmentId, teamId, primaryLink, backupLink, title } = body

    if (!assignmentId || !teamId || !primaryLink) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID, team ID, and primary link are required' },
        { status: 400 }
      )
    }

    // Verify that the user is part of the team for this assignment
    const { getStudentAssignmentTeam } = await import('@/lib/per-assignment-teams')
    const studentTeam = await getStudentAssignmentTeam(user.id, assignmentId)
    
    // If no per-assignment team membership exists, fall back to course-level team check
    if (!studentTeam) {
      console.log(`⚠️ No per-assignment team found for student ${user.id} in assignment ${assignmentId}, falling back to course-level team check`)
      
      // Check if user is part of the team in course-level teams
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, members')
        .eq('id', teamId)
        .single()
      
      if (teamError || !team) {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        )
      }
      
      if (!team.members.includes(user.id)) {
        return NextResponse.json(
          { success: false, error: 'You are not a member of this team' },
          { status: 403 }
        )
      }
      
      console.log(`✅ Fallback: Student ${user.id} is member of course-level team ${teamId}`)
    } else if (studentTeam.teamId !== teamId) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this team for this assignment' },
        { status: 403 }
      )
    }

    const newSubmission = await createSubmission({
      assignment_id: assignmentId,
      team_id: teamId,
      primary_link: primaryLink,
      backup_link: backupLink || null,
      status: 'submitted'
    })

    return NextResponse.json({ success: true, data: newSubmission })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}