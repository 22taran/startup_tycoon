import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getSimpleSupabaseClient } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { gradeIds, action } = body

    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      return NextResponse.json({ error: 'Grade IDs are required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const supabase = getSimpleSupabaseClient()

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'publish':
        updateData.status = 'published'
        updateData.reviewed_by = session.user.id
        updateData.reviewed_at = new Date().toISOString()
        updateData.published_at = new Date().toISOString()
        break
      
      case 'draft':
        updateData.status = 'draft'
        break
      
      case 'reset':
        // Reset to original values if they exist
        const { data: grades } = await supabase
          .from('grades')
          .select('id, original_grade, original_percentage')
          .in('id', gradeIds)

        const resetPromises = grades?.map(grade => {
          const resetData: any = {
            status: 'draft',
            manual_override: false,
            updated_at: new Date().toISOString()
          }

          if (grade.original_grade) {
            resetData.grade = grade.original_grade
          }
          if (grade.original_percentage) {
            resetData.percentage = grade.original_percentage
          }

          return supabase
            .from('grades')
            .update(resetData)
            .eq('id', grade.id)
        }) || []

        await Promise.all(resetPromises)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action !== 'reset') {
      const { error } = await supabase
        .from('grades')
        .update(updateData)
        .in('id', gradeIds)

      if (error) throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully ${action}d ${gradeIds.length} grade(s)`
    })
  } catch (error: any) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
