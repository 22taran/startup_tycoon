import { NextRequest, NextResponse } from 'next/server'
import { getAssignmentById, updateAssignment, deleteAssignment } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    const assignment = await getAssignmentById(id)
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    const body = await request.json()
    const { 
      title, 
      description, 
      startDate, 
      dueDate, 
      documentUrl, 
      isActive,
      evaluationStartDate,
      evaluationDueDate,
      isEvaluationActive
    } = body

    // Build update data object with only provided fields
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (isActive !== undefined) updateData.isActive = isActive
    if (evaluationStartDate !== undefined) updateData.evaluationStartDate = new Date(evaluationStartDate)
    if (evaluationDueDate !== undefined) updateData.evaluationDueDate = new Date(evaluationDueDate)
    if (isEvaluationActive !== undefined) updateData.isEvaluationActive = isEvaluationActive

    const updatedAssignment = await updateAssignment(id, updateData)
    
    return NextResponse.json({ success: true, data: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    await deleteAssignment(id)
    
    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
