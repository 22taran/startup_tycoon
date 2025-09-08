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