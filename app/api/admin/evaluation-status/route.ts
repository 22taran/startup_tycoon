import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Admin/Instructor access required' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    // First get the course_id for this assignment
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('course_id')
      .eq('id', assignmentId)
      .single()
    
    if (assignmentError) throw assignmentError
    if (!assignmentData?.course_id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    
    // Get all students enrolled in the course
    const { data: courseData, error: courseError } = await supabase
      .from('course_enrollments')
      .select('user_id')
      .eq('course_id', assignmentData.course_id)
      .eq('role', 'student')
      .eq('status', 'active')
    
    if (courseError) throw courseError
    
    // Get user details separately
    const userIds = courseData.map(enrollment => enrollment.user_id)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)
    
    if (usersError) throw usersError
    
    // Create a map of user data for easy lookup
    const usersMap = (usersData || []).reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)
    
    // Get evaluation assignments for this assignment
    const { data: evaluations, error: evalError } = await supabase
      .from('assignment_evaluations')
      .select(`
        evaluator_student_id,
        evaluated_team_id,
        evaluation_status,
        completed_at
      `)
      .eq('assignment_id', assignmentId)
    
    if (evalError) throw evalError
    
    // Get investments for this assignment
    const { data: investments, error: invError } = await supabase
      .from('assignment_investments')
      .select(`
        investor_student_id,
        tokens_invested,
        invested_team_id
      `)
      .eq('assignment_id', assignmentId)
    
    if (invError) throw invError
    
    // Process the data to create status for each student
    const evaluationStatus = courseData.map((enrollment: any) => {
      const studentId = enrollment.user_id
      const userData = usersMap[studentId] || {}
      const studentName = userData.name || 'Unknown Student'
      const studentEmail = userData.email || 'No email'
      
      // Count investments for this student first
      const studentInvestments = investments.filter(i => i.investor_student_id === studentId)
      const completedInvestments = studentInvestments.length
      const totalInvestments = 3 // Students can invest in up to 3 teams
      const pendingInvestments = Math.max(0, totalInvestments - completedInvestments)
      const investmentProgress = Math.round((completedInvestments / totalInvestments) * 100)
      
      // Get teams this student invested in
      const investedTeamIds = studentInvestments.map(inv => inv.invested_team_id).filter(Boolean)
      
      // Count evaluations for this student - ONLY for teams they invested in
      // If no investments made yet, show 0/0 evaluations
      const studentEvaluations = investedTeamIds.length > 0 
        ? evaluations.filter(e => 
            e.evaluator_student_id === studentId && 
            investedTeamIds.includes(e.evaluated_team_id)
          )
        : []
      const completedEvaluations = studentEvaluations.filter(e => e.evaluation_status === 'completed').length
      const totalEvaluations = investedTeamIds.length // Only count invested teams
      const pendingEvaluations = totalEvaluations - completedEvaluations
      const evaluationProgress = totalEvaluations > 0 ? Math.round((completedEvaluations / totalEvaluations) * 100) : 0
      
      return {
        studentId,
        studentName,
        studentEmail,
        totalEvaluations,
        completedEvaluations,
        pendingEvaluations,
        totalInvestments,
        completedInvestments,
        pendingInvestments,
        evaluationProgress,
        investmentProgress
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      data: evaluationStatus 
    })
    
  } catch (error) {
    console.error('Error fetching evaluation status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluation status' },
      { status: 500 }
    )
  }
}
