import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getSimpleSupabaseClient } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }
    
    const supabase = getSimpleSupabaseClient()
    
    // Get all assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (assignmentsError) throw assignmentsError
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('name')
    
    if (usersError) throw usersError
    
    const usersMap = (users || []).reduce((acc: Record<string, any>, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)
    
    // Get all grades
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        *,
        teams!inner(id, name, members),
        assignments!inner(id, title, course_id)
      `)
      .order('created_at', { ascending: false })
    
    if (gradesError) throw gradesError
    
    // Get all interest records
    const { data: interestRecords, error: interestError } = await supabase
      .from('student_interest_tracking')
      .select(`
        *,
        teams!inner(id, name),
        assignments!inner(id, title)
      `)
      .order('created_at', { ascending: false })
    
    if (interestError) throw interestError
    
    // Get all investments
    const { data: investments, error: investmentsError } = await supabase
      .from('assignment_investments')
      .select(`
        *,
        teams!inner(id, name),
        assignments!inner(id, title)
      `)
      .order('created_at', { ascending: false })
    
    if (investmentsError) throw investmentsError
    
    // Process data for report
    const reportData = {
      summary: {
        assignments: assignments?.length || 0,
        grades: grades?.length || 0,
        interestRecords: interestRecords?.length || 0,
        investments: investments?.length || 0,
        users: users?.length || 0,
        totalInterest: interestRecords?.reduce((sum, record) => sum + (record.interest_earned || 0), 0) || 0,
        totalInvestments: investments?.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0) || 0,
        averageGrade: grades?.reduce((sum, grade) => sum + (grade.percentage || 0), 0) / (grades?.length || 1) || 0
      },
      assignments: (assignments || []).map(assignment => {
        const assignmentGrades = grades?.filter(g => g.assignment_id === assignment.id) || []
        const assignmentInterest = interestRecords?.filter(i => i.assignment_id === assignment.id) || []
        const assignmentInvestments = investments?.filter(i => i.assignment_id === assignment.id) || []
        
        // Group interest by student
        const interestByStudent: Record<string, any> = assignmentInterest.reduce((acc, record) => {
          if (!acc[record.student_id]) {
            acc[record.student_id] = {
              student: usersMap[record.student_id] || { name: 'Unknown', email: 'Unknown' },
              records: [],
              totalInterest: 0
            }
          }
          acc[record.student_id].records.push(record)
          acc[record.student_id].totalInterest += record.interest_earned || 0
          return acc
        }, {})
        
        return {
          id: assignment.id,
          title: assignment.title,
          courseId: assignment.course_id,
          dueDate: assignment.dueDate,
          status: assignment.status,
          isEvaluationActive: assignment.isEvaluationActive,
          grades: assignmentGrades.map(grade => ({
            id: grade.id,
            teamId: grade.team_id,
            teamName: grade.teams?.name || 'Unknown',
            teamMembers: grade.teams?.members?.map((memberId: string) => usersMap[memberId]?.name || 'Unknown').join(', ') || 'No members',
            score: grade.percentage || 0,
            averageInvestment: grade.average_investment || 0,
            totalInvestments: grade.total_investments || 0,
            performanceTier: grade.grade || 'Unknown',
            createdAt: grade.created_at
          })),
          interestDistribution: Object.values(interestByStudent).map((studentData: any) => ({
            studentId: studentData.student.id,
            studentName: studentData.student.name,
            studentEmail: studentData.student.email,
            totalInterest: studentData.totalInterest,
            bonusPotential: Math.min(studentData.totalInterest / 100, 0.20) * 100,
            investments: studentData.records.map((record: any) => ({
              teamId: record.invested_team_id,
              teamName: record.teams?.name || 'Unknown',
              tokensInvested: record.tokens_invested,
              interestEarned: record.interest_earned,
              performanceTier: record.team_performance_tier
            }))
          })),
          investmentSummary: {
            totalTokensInvested: assignmentInvestments.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0),
            averageInvestment: assignmentInvestments.length > 0 ? assignmentInvestments.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0) / assignmentInvestments.length : 0,
            numberOfInvestments: assignmentInvestments.length
          }
        }
      }),
      topPerformers: (() => {
        const allStudentInterest: Record<string, any> = {}
        for (const assignment of assignments || []) {
          const assignmentInterest = interestRecords?.filter(i => i.assignment_id === assignment.id) || []
          assignmentInterest.forEach(record => {
            if (!allStudentInterest[record.student_id]) {
              allStudentInterest[record.student_id] = {
                student: usersMap[record.student_id] || { name: 'Unknown', email: 'Unknown' },
                totalInterest: 0
              }
            }
            allStudentInterest[record.student_id].totalInterest += record.interest_earned || 0
          })
        }
        return Object.values(allStudentInterest)
          .sort((a, b) => b.totalInterest - a.totalInterest)
          .slice(0, 10)
      })()
    }
    
    return NextResponse.json({ 
      success: true, 
      data: reportData 
    })
    
  } catch (error) {
    console.error('Error generating report data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate report data' },
      { status: 500 }
    )
  }
}
