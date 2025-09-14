import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getAllGradesWithTeams, getGradesByAssignment, getGradesByCourse } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const courseId = searchParams.get('courseId')

    let grades
    if (assignmentId) {
      // Get grades for specific assignment
      grades = await getGradesByAssignment(assignmentId)
    } else if (courseId) {
      // Get grades for specific course
      grades = await getGradesByCourse(courseId)
    } else {
      // Get all grades
      grades = await getAllGradesWithTeams()
    }

    // Filter grades based on user role
    if (session.user.role !== 'admin') {
      // For students, only show published grades
      grades = grades.filter(grade => grade.status === 'published')
    }
    // For admins, show all grades regardless of status

    // Transform database fields to frontend format
    const transformedGrades = grades.map(grade => ({
      id: grade.id,
      assignmentId: grade.assignment_id,
      teamId: grade.team_id,
      submissionId: grade.submission_id,
      averageInvestment: grade.average_investment,
      grade: grade.grade,
      percentage: grade.percentage,
      totalInvestments: grade.total_investments,
      createdAt: grade.created_at,
      updatedAt: grade.updated_at,
      // Include related data if present
      team: grade.teams,
      assignment: grade.assignments
    }))

    return NextResponse.json({ 
      success: true, 
      data: transformedGrades 
    })
  } catch (error: any) {
    console.error('Error fetching grades:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch grades' 
    }, { status: 500 })
  }
}