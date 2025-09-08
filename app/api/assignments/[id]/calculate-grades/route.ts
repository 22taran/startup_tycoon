import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { calculateGradesForAssignment, getGradeStatistics } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id: assignmentId } = await params
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    console.log('🎯 Admin calculating grades for assignment:', assignmentId)

    // Calculate grades for the assignment
    const grades = await calculateGradesForAssignment(assignmentId)
    
    // Get statistics
    const statistics = await getGradeStatistics(assignmentId)

    return NextResponse.json({ 
      success: true, 
      data: { 
        grades,
        statistics,
        totalGrades: grades.length
      } 
    })
  } catch (error: any) {
    console.error('Error calculating grades:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to calculate grades' 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id: assignmentId } = await params
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Get grade statistics for the assignment
    const statistics = await getGradeStatistics(assignmentId)

    return NextResponse.json({ 
      success: true, 
      data: { statistics } 
    })
  } catch (error: any) {
    console.error('Error fetching grade statistics:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch grade statistics' 
    }, { status: 500 })
  }
}
