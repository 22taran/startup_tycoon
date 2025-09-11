import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { createClient } from '@supabase/supabase-js'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: submissionId } = await params
    const body = await request.json()
    const { assignmentId, teamId, title, primaryLink, backupLink, status } = body

    if (!assignmentId || !teamId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and Team ID are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify that the user is part of the team for this assignment
    const { getStudentAssignmentTeam } = await import('@/lib/per-assignment-teams')
    const studentTeam = await getStudentAssignmentTeam(session.user.id, assignmentId)

    // If no per-assignment team membership exists, fall back to course-level team check
    if (!studentTeam) {
      console.log(`⚠️ No per-assignment team found for student ${session.user.id} in assignment ${assignmentId}, falling back to course-level team check`)

      // Check if user is part of the team in course-level teams
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

      if (!team.members.includes(session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'You are not a member of this team' },
          { status: 403 }
        )
      }

      console.log(`✅ Fallback: Student ${session.user.id} is member of course-level team ${teamId}`)
    } else if (studentTeam.teamId !== teamId) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this team for this assignment' },
        { status: 403 }
      )
    }

    // Update the submission
    const { data, error } = await supabase
      .from('submissions')
      .update({
        assignment_id: assignmentId,
        team_id: teamId,
        primary_link: primaryLink,
        backup_link: backupLink,
        status: status || 'submitted',
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        assignmentId: data.assignment_id,
        teamId: data.team_id,
        title: title,
        primaryLink: data.primary_link,
        backupLink: data.backup_link,
        status: data.status,
        submittedAt: data.submitted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })

  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
