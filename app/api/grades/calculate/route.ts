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
    
    console.log(`🔄 Starting grading and interest calculation for assignment: ${assignmentId}`)
    
    // Step 1: Get all teams that have submissions for this assignment
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        team_id,
        teams!inner(id, name)
      `)
      .eq('assignment_id', assignmentId)
      .eq('status', 'submitted')
    
    if (submissionsError) throw submissionsError
    
    console.log(`📊 Found ${submissions.length} team submissions`)
    
    // Step 2: Calculate grades for each team
    const teamGrades = []
    
    for (const submission of submissions) {
      console.log(`🎯 Calculating grade for team: ${submission.teams?.[0]?.name || 'Unknown'}`)
      
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
        console.error(`❌ Error saving grade for team ${submission.teams?.[0]?.name || 'Unknown'}:`, gradeError)
        continue
      }
      
      teamGrades.push({
        teamId: submission.team_id,
        teamName: submission.teams?.[0]?.name || 'Unknown',
        tier: teamPerformance.tier,
        percentage: teamPerformance.grade,
        averageInvestment: teamPerformance.averageInvestment
      })
      
      console.log(`✅ Team ${submission.teams?.[0]?.name || 'Unknown'}: ${teamPerformance.tier} (${teamPerformance.grade}%)`)
    }
    
    // Step 3: Calculate interest for all students
    console.log(`💰 Calculating interest for all students...`)
    
    const { data: students, error: studentsError } = await supabase
      .from('course_enrollments')
      .select(`
        user_id,
        users!inner(id, name, email)
      `)
      .eq('course_id', (await supabase
        .from('assignments')
        .select('course_id')
        .eq('id', assignmentId)
        .single()
      ).data?.course_id)
      .eq('role', 'student')
      .eq('status', 'active')
    
    if (studentsError) throw studentsError
    
    const studentInterests = []
    
    for (const student of students) {
      console.log(`🎯 Calculating interest for student: ${student.users?.[0]?.name || 'Unknown'}`)
      
      const interest = await calculateStudentInterest(student.user_id, assignmentId)
      
      if (interest > 0) {
        // Store interest in the database
        const { error: interestError } = await supabase
          .from('student_interest_tracking')
          .upsert({
            student_id: student.user_id,
            assignment_id: assignmentId,
            interest_earned: interest,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'student_id,assignment_id'
          })
        
        if (interestError) {
          console.error(`❌ Error saving interest for student ${student.users?.[0]?.name || 'Unknown'}:`, interestError)
          continue
        }
        
        studentInterests.push({
          studentId: student.user_id,
          studentName: student.users?.[0]?.name || 'Unknown',
          interestEarned: interest
        })
        
        console.log(`✅ Student ${student.users?.[0]?.name || 'Unknown'}: +${interest} interest`)
      }
    }
    
    console.log(`🎉 Grading and interest calculation completed!`)
    
    return NextResponse.json({
      success: true,
      message: 'Grading and interest calculation completed successfully',
      data: {
        teamGrades,
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
