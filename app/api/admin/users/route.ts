import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getAllUsers, updateUserRole } from '@/lib/database'

export async function GET() {
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

    const users = await getAllUsers()
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
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
    const { action, userId, role } = body

    if (!action || !userId) {
      return NextResponse.json(
        { success: false, error: 'Action and userId are required' },
        { status: 400 }
      )
    }

    let result = false

    switch (action) {
      case 'update-role':
        if (!role) {
          return NextResponse.json(
            { success: false, error: 'Role is required for update-role action' },
            { status: 400 }
          )
        }
        result = await updateUserRole(userId, role)
        break
      
      case 'add-admin':
        result = await updateUserRole(userId, 'admin')
        break
      
      case 'remove-admin':
        result = await updateUserRole(userId, 'student')
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: `User ${action === 'add-admin' ? 'added as admin' : 'removed from admin'}` 
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error managing users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to manage users' },
      { status: 500 }
    )
  }
}
