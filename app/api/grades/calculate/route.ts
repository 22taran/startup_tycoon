import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { createClient } from '@supabase/supabase-js'
import { calculateTeamPerformance, calculateStudentInterest } from '@/lib/individual-evaluation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Admin/Instructor access required' }, { status: 403 })
    }
    
    const { assignmentId } = await request.json()
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    // Step 1: Get all teams that have submissions for this assignment
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        team_id
      `)
      .eq('assignment_id', assignmentId)
      .eq('status', 'submitted')
    
    if (submissionsError) throw submissionsError
    
    // Get team data separately
    const teamIds = Array.from(new Set(submissions.map(s => s.team_id)))
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', teamIds)
    
    if (teamsError) throw teamsError
    
    const teamsMap = (teams || []).reduce((acc, team) => {
      acc[team.id] = team
      return acc
    }, {} as Record<string, any>)
    
    // Step 2: Calculate grades for each team
    const teamGrades = []
    
    for (const submission of submissions) {
      const teamName = teamsMap[submission.team_id]?.name || 'Unknown'
      
      const teamPerformance = await calculateTeamPerformance(assignmentId, submission.team_id)
      
      // Store the grade in the database
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .upsert({
          assignment_id: assignmentId,
          team_id: submission.team_id,
          submission_id: submission.id,
          average_investment: teamPerformance.averageInvestment,
          grade: teamPerformance.tier,
          percentage: teamPerformance.grade,
          total_investments: 0, // This will be calculated separately if needed
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'assignment_id,team_id'
        })
        .select()
      
      if (gradeError) {
        console.error(`❌ Error saving grade for team ${teamName}:`, gradeError)
        continue
      }
      
      teamGrades.push({
        teamId: submission.team_id,
        teamName: teamName,
        tier: teamPerformance.tier,
        percentage: teamPerformance.grade,
        averageInvestment: teamPerformance.averageInvestment
      })
    }
    
    // Step 3: Calculate interest for all students
    
    // Get course ID first
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('course_id')
      .eq('id', assignmentId)
      .single()
    
    if (assignmentError) throw assignmentError
    
    const { data: students, error: studentsError } = await supabase
      .from('course_enrollments')
      .select('user_id')
      .eq('course_id', assignment.course_id)
      .eq('role', 'student')
      .eq('status', 'active')
    
    if (studentsError) throw studentsError
    
    // Get user data separately
    const userIds = students?.map(s => s.user_id) || []
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)
    
    if (usersError) throw usersError
    
    const usersMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)
    
    const studentInterests = []
    
    for (const student of students) {
      const userName = usersMap[student.user_id]?.name || 'Unknown'
      
      // Clear existing interest data for this student and assignment
      await supabase
        .from('student_interest_tracking')
        .delete()
        .eq('student_id', student.user_id)
        .eq('assignment_id', assignmentId)
      
      const interest = await calculateStudentInterest(student.user_id, assignmentId)
      
      if (interest > 0) {
        // Note: calculateStudentInterest already stores the interest in the database
        // so we don't need to store it again here
        
        studentInterests.push({
          studentId: student.user_id,
          studentName: userName,
          interestEarned: interest
        })
      }
    }
    
    // Calculate statistics
    const statistics = {
      totalTeams: teamGrades.length,
      highGrades: teamGrades.filter(g => g.tier === 'high').length,
      medianGrades: teamGrades.filter(g => g.tier === 'median').length,
      lowGrades: teamGrades.filter(g => g.tier === 'low').length,
      incompleteGrades: teamGrades.filter(g => g.tier === 'incomplete').length,
      averageInvestment: teamGrades.length > 0 ? teamGrades.reduce((sum, g) => sum + g.averageInvestment, 0) / teamGrades.length : 0,
      totalInvestments: teamGrades.reduce((sum, g) => sum + g.averageInvestment, 0)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Grading and interest calculation completed successfully',
      data: {
        grades: teamGrades,
        statistics: statistics,
        studentInterests,
        summary: {
          totalTeams: teamGrades.length,
          totalStudents: studentInterests.length,
          totalInterestEarned: studentInterests.reduce((sum, s) => sum + s.interestEarned, 0)
        }
      }
    })
    
  } catch (error) {
    console.error('Error calculating grades and interest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate grades and interest' },
      { status: 500 }
    )
  }
}
