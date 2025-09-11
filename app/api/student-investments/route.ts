import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { processStudentInvestment, getStudentInvestments } from '@/lib/individual-evaluation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }
    
    // Get assignmentId from query parameters
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }
    
    const investments = await getStudentInvestments(session.user.id, assignmentId)
    
    return NextResponse.json({ success: true, data: investments })
    
  } catch (error) {
    console.error('Error fetching student investments:', error)
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
    
    const body = await request.json()
    const { assignmentId, teamId, tokens } = body
    
    if (!assignmentId || !teamId || tokens === undefined) {
      return NextResponse.json({ 
        error: 'Assignment ID, team ID, and tokens are required' 
      }, { status: 400 })
    }
    
    if (typeof tokens !== 'number' || tokens < 0) {
      return NextResponse.json({ 
        error: 'Tokens must be a positive number' 
      }, { status: 400 })
    }
    
    const investment = await processStudentInvestment(assignmentId, session.user.id, teamId, tokens)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Investment processed successfully',
      data: investment 
    })
    
  } catch (error) {
    console.error('Error processing student investment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process investment' 
      },
      { status: 500 }
    )
  }
}
