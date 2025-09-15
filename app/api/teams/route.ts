import { NextRequest, NextResponse } from 'next/server'
import { getTeams, createTeam, updateTeam, deleteTeam } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { Team } from '@/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    console.log('🔄 Fetching teams from database...', courseId ? `for course: ${courseId}` : 'all teams')
    
    if (courseId) {
      // Fetch teams for specific course
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error fetching teams for course:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch teams for course' },
          { status: 500 }
        )
      }
      
      console.log('📊 Teams for course:', teams)
      return NextResponse.json({ success: true, data: teams })
    } else {
      // Fetch all teams (backward compatibility)
      const teams = await getTeams()
      console.log('📊 All teams from database:', teams)
      return NextResponse.json({ success: true, data: teams })
    }
  } catch (error) {
    console.error('❌ Error fetching teams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
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
    
    const user = session.user

    const body = await request.json()
    const { name, members, description, courseId } = body

    if (!name || !members) {
      return NextResponse.json(
        { success: false, error: 'Name and members are required' },
        { status: 400 }
      )
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Convert email addresses to user IDs
    const memberEmails = Array.isArray(members) ? members : [members]
    const memberUserIds: string[] = []
    
    for (const email of memberEmails) {
      if (email.trim()) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.trim())
          .single()
        
        if (user) {
          memberUserIds.push(user.id)
        } else {
          console.warn(`⚠️ User not found for email: ${email}`)
        }
      }
    }
    
    console.log('🔄 Creating team with data:', { name, memberEmails, memberUserIds, description, courseId, created_by: user.id })
    const newTeam = await createTeam({
      name,
      members: memberUserIds,
      description: description || '',
      courseId: courseId
    } as any)
    console.log('✅ Team created successfully:', newTeam)

    return NextResponse.json({ success: true, data: newTeam })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create team' 
      },
      { status: 400 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, members, description } = body

    if (!id || !name || !members) {
      return NextResponse.json(
        { success: false, error: 'ID, name and members are required' },
        { status: 400 }
      )
    }

    // Convert email addresses to user IDs
    const memberEmails = Array.isArray(members) ? members : [members]
    const memberUserIds: string[] = []
    
    for (const email of memberEmails) {
      if (email.trim()) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.trim())
          .single()
        
        if (user) {
          memberUserIds.push(user.id)
        } else {
          console.warn(`⚠️ User not found for email: ${email}`)
        }
      }
    }
    
    console.log('🔄 Updating team with data:', { id, name, memberEmails, memberUserIds, description })
    const updatedTeam = await updateTeam(id, {
      name,
      members: memberUserIds,
      description: description || ''
    })
    console.log('✅ Team updated successfully:', updatedTeam)

    return NextResponse.json({ success: true, data: updatedTeam })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update team' 
      },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Deleting team with ID:', id)
    await deleteTeam(id)
    console.log('✅ Team deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}