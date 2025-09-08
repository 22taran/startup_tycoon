import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getInvestmentsByUser } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Get current assignment ID from query params
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Get user's investments for this assignment
    const userInvestments = await getInvestmentsByUser(session.user.id)
    const assignmentInvestments = userInvestments.filter(inv => inv.assignment_id === assignmentId)
    
    // Calculate remaining tokens (100 total - used tokens)
    const usedTokens = assignmentInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const remainingTokens = Math.max(0, 100 - usedTokens)
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        remainingTokens,
        usedTokens,
        totalTokens: 100
      }
    })
  } catch (error) {
    console.error('Error fetching remaining tokens:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch remaining tokens' },
      { status: 500 }
    )
  }
}
