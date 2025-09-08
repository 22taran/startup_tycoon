import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Return admin data
    return NextResponse.json({
      success: true,
      data: {
        user: session.user,
        message: 'Welcome to the admin panel',
        features: [
          'Team Management',
          'Assignment Creation',
          'Evaluation Management',
          'Reports & Analytics',
          'Game Configuration'
        ]
      }
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Handle different admin actions
    switch (action) {
      case 'create-assignment':
        // Handle assignment creation
        return NextResponse.json({
          success: true,
          message: 'Assignment creation endpoint'
        })
      
      case 'manage-teams':
        // Handle team management
        return NextResponse.json({
          success: true,
          message: 'Team management endpoint'
        })
      
      case 'process-grades':
        // Handle grade processing
        return NextResponse.json({
          success: true,
          message: 'Grade processing endpoint'
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
