import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getSupabaseClient } from '@/lib/database'

// GET - Fetch platform settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('key, value, description')
      .order('key')

    if (error) {
      console.error('Error fetching platform settings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Convert array to object for easier access
    const settingsObject = settings?.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description
      }
      return acc
    }, {} as Record<string, { value: any; description: string }>) || {}

    return NextResponse.json({ success: true, data: settingsObject })
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('platform_settings')
      .update({ 
        value: value,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)

    if (error) {
      console.error('Error updating platform setting:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update setting' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Setting updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
