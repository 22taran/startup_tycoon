import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/database'

// GET - Check if signup is enabled
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: setting, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'signup_enabled')
      .single()

    if (error) {
      console.error('Error fetching signup setting:', error)
      // Default to enabled if there's an error
      return NextResponse.json({ enabled: true })
    }

    // Handle JSONB value - it could be a boolean or string
    const enabled = setting?.value === true || setting?.value === 'true' || setting?.value === '"true"'
    return NextResponse.json({ enabled })
  } catch (error) {
    console.error('Error in GET /api/settings/signup-enabled:', error)
    // Default to enabled if there's an error
    return NextResponse.json({ enabled: true })
  }
}
