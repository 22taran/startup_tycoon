import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, createUser } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'

export async function GET() {
  try {
    const users = await getAllUsers()
    console.log('Users API - Fetched users:', users.map(u => ({ email: u.email, role: u.role })))
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role = 'student' } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Create user (password hashing handled by Supabase Auth)
    const user = await createUser({
      email,
      name,
      role
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
