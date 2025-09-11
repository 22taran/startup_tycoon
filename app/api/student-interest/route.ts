import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getSimpleSupabaseClient } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify the student is accessing their own data
    if (session.user.id !== studentId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = getSimpleSupabaseClient()

    // Get all interest tracking records for this student
    const { data: interestRecords, error: interestError } = await supabase
      .from('student_interest_tracking')
      .select(`
        interest_earned,
        assignment_id,
        invested_team_id,
        team_performance_tier,
        tokens_invested
      `)
      .eq('student_id', studentId)

    if (interestError) throw interestError

    // Calculate totals
    const totalInterest = interestRecords?.reduce((sum, record) => sum + (record.interest_earned || 0), 0) || 0
    const bonusPercentage = Math.min(totalInterest / 100, 0.20) // Cap at 20%
    const assignmentsWithInterest = new Set(interestRecords?.map(r => r.assignment_id) || []).size

    // Get detailed breakdown by assignment
    const interestByAssignment = interestRecords?.reduce((acc, record) => {
      const assignmentId = record.assignment_id
      if (!acc[assignmentId]) {
        acc[assignmentId] = {
          assignmentId,
          totalInterest: 0,
          investments: []
        }
      }
      acc[assignmentId].totalInterest += record.interest_earned || 0
      acc[assignmentId].investments.push({
        teamId: record.invested_team_id,
        tokensInvested: record.tokens_invested,
        performanceTier: record.team_performance_tier,
        interestEarned: record.interest_earned
      })
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({
      success: true,
      data: {
        totalInterest,
        bonusPercentage,
        assignmentsWithInterest,
        interestByAssignment: Object.values(interestByAssignment)
      }
    })

  } catch (error) {
    console.error('Error fetching student interest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interest data' },
      { status: 500 }
    )
  }
}
