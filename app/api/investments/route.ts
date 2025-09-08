import { NextRequest, NextResponse } from 'next/server'
import { getInvestments, createInvestment } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { Investment } from '@/types'

export async function GET() {
  try {
    const investments = await getInvestments()
    return NextResponse.json({ success: true, data: investments })
  } catch (error) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investments' },
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
    
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }
    
    const user = session.user

    const body = await request.json()
    const { assignmentId, teamId, amount, comments, isIncomplete } = body

    if (!assignmentId || !teamId || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID, team ID, and amount are required' },
        { status: 400 }
      )
    }

    if (amount < 0 || amount > 50) {
      return NextResponse.json(
        { success: false, error: 'Investment amount must be between 0 and 50 tokens' },
        { status: 400 }
      )
    }

    // Check if user has already invested in this team for this assignment
    const existingInvestments = await getInvestments()
    const alreadyInvested = existingInvestments.some(inv => 
      inv.assignmentId === assignmentId && 
      inv.teamId === teamId && 
      inv.investorId === user.id
    )

    if (alreadyInvested) {
      return NextResponse.json(
        { success: false, error: 'You have already invested in this team for this assignment' },
        { status: 400 }
      )
    }

    // Check token limits (100 total per assignment)
    const assignmentInvestments = existingInvestments.filter(inv => 
      inv.assignmentId === assignmentId && inv.investorId === user.id
    )
    const usedTokens = assignmentInvestments.reduce((sum, inv) => sum + inv.amount, 0)
    
    if (usedTokens + amount > 100) {
      return NextResponse.json(
        { success: false, error: 'Investment would exceed 100 token limit for this assignment' },
        { status: 400 }
      )
    }

    // Find the submission for this team and assignment
    const { getSubmissions } = await import('@/lib/database')
    const submissions = await getSubmissions()
    const submission = submissions.find(sub => 
      sub.assignmentId === assignmentId && sub.teamId === teamId && sub.status === 'submitted'
    )

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'No submitted work found for this team and assignment' },
        { status: 400 }
      )
    }

    const newInvestment = await createInvestment({
      submission_id: submission.id,
      assignment_id: assignmentId,
      team_id: teamId,
      investor_id: user.id,
      amount: parseFloat(amount),
      is_incomplete: isIncomplete || false,
      comments: comments || ''
    })

    // Mark the evaluation assignment as complete (team-based)
    const { getEvaluationAssignmentsByEvaluatorTeam, getTeams } = await import('@/lib/database')
    
    // Find the investor's team
    const teams = await getTeams()
    const investorTeam = teams.find(team => 
      team.members && team.members.includes(user.id)
    )
    
    if (investorTeam) {
      const teamEvaluations = await getEvaluationAssignmentsByEvaluatorTeam(investorTeam.id)
      const evaluationToUpdate = teamEvaluations.find(evaluation => 
        evaluation.assignmentId === assignmentId && evaluation.teamId === teamId
      )
      
      if (evaluationToUpdate) {
        const { updateEvaluationAssignment } = await import('@/lib/database')
        await updateEvaluationAssignment(evaluationToUpdate.id, { isComplete: true })
        console.log('✅ Evaluation marked as complete:', evaluationToUpdate.id)
      }
    }

    // Trigger grade calculation for this assignment
    try {
      const { calculateGradesForAssignment } = await import('@/lib/database')
      await calculateGradesForAssignment(assignmentId)
      console.log('✅ Grades calculated for assignment:', assignmentId)
    } catch (gradeError) {
      console.error('⚠️ Grade calculation failed:', gradeError)
      // Don't fail the investment if grade calculation fails
    }

    return NextResponse.json({ success: true, data: newInvestment })
  } catch (error) {
    console.error('Error creating investment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create investment' },
      { status: 500 }
    )
  }
}