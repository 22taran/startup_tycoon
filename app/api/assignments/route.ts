import { NextRequest, NextResponse } from 'next/server'
import { getAssignments, createAssignment, updateAssignment, updateAssignmentStatus } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { Assignment } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Update assignment statuses before fetching
    await updateAssignmentStatus()
    
    // Get courseId from query parameters
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    const assignments = await getAssignments(courseId)
    return NextResponse.json({ success: true, data: assignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
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
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const user = session.user

    const body = await request.json()
    const { title, description, startDate, dueDate, documentUrl, courseId } = body

    if (!title || !dueDate || !startDate || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Title, start date, due date, and course ID are required' },
        { status: 400 }
      )
    }

    // Check if assignment should be active based on start date and due date
    const now = new Date()
    const startDateTime = new Date(startDate)
    const dueDateTime = new Date(dueDate)
    const isActive = now >= startDateTime && now <= dueDateTime

    const newAssignment = await createAssignment({
      title,
      description: description || '',
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      documentUrl: documentUrl || null,
      isActive: isActive,
      courseId: courseId
    } as any)

    return NextResponse.json({ success: true, data: newAssignment })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, description, startDate, dueDate, documentUrl, evaluationStartDate, evaluationDueDate } = body

    if (!id || !title || !dueDate || !startDate) {
      return NextResponse.json(
        { success: false, error: 'ID, title, start date, and due date are required' },
        { status: 400 }
      )
    }

    // Check if assignment should be active based on start date and due date
    const now = new Date()
    const startDateTime = new Date(startDate)
    const dueDateTime = new Date(dueDate)
    const isActive = now >= startDateTime && now <= dueDateTime

    const updatedAssignment = await updateAssignment(id, {
      title,
      description: description || '',
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      documentUrl: documentUrl || null,
      isActive: isActive,
      evaluationStartDate: evaluationStartDate ? new Date(evaluationStartDate) : undefined,
      evaluationDueDate: evaluationDueDate ? new Date(evaluationDueDate) : undefined
    })

    return NextResponse.json({ success: true, data: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}