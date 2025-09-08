import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { autoCompleteAssignments } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const completedAssignments = await autoCompleteAssignments()

    return NextResponse.json({
      success: true,
      message: `Auto-completed ${completedAssignments.length} assignments`,
      data: {
        completedCount: completedAssignments.length,
        completedAssignments: completedAssignments.map(a => ({
          id: a.id,
          title: a.title,
          evaluationDueDate: a.evaluation_due_date
        }))
      }
    })
  } catch (error) {
    console.error('Error auto-completing assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to auto-complete assignments' },
      { status: 500 }
    )
  }
}
