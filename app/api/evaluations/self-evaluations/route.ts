import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { findExistingSelfEvaluations, cleanupSelfEvaluations } from '@/lib/evaluation-validation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('🔍 Checking for self-evaluations...')
    const selfEvaluations = await findExistingSelfEvaluations()
    
    const totalSelfEvaluations = selfEvaluations.individual.length + selfEvaluations.team.length
    
    return NextResponse.json({
      success: true,
      data: {
        total: totalSelfEvaluations,
        individual: selfEvaluations.individual,
        team: selfEvaluations.team,
        summary: {
          individualCount: selfEvaluations.individual.length,
          teamCount: selfEvaluations.team.length,
          hasSelfEvaluations: totalSelfEvaluations > 0
        }
      }
    })
    
  } catch (error) {
    console.error('Error checking self-evaluations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check self-evaluations' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('🧹 Cleaning up self-evaluations...')
    const cleanupResult = await cleanupSelfEvaluations()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanupResult.deletedIndividual} individual and ${cleanupResult.deletedTeam} team self-evaluations`,
      data: {
        deletedIndividual: cleanupResult.deletedIndividual,
        deletedTeam: cleanupResult.deletedTeam,
        errors: cleanupResult.errors
      }
    })
    
  } catch (error) {
    console.error('Error cleaning up self-evaluations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clean up self-evaluations' 
      },
      { status: 500 }
    )
  }
}
