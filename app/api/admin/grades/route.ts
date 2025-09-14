import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getSimpleSupabaseClient } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = getSimpleSupabaseClient()

    // Get grades with team information
    const { data: grades, error } = await supabase
      .from('grades')
      .select(`
        *,
        teams!inner(id, name, members),
        assignments!inner(id, title)
      `)
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform to frontend format
    const transformedGrades = grades?.map(grade => ({
      id: grade.id,
      assignmentId: grade.assignment_id,
      teamId: grade.team_id,
      submissionId: grade.submission_id,
      averageInvestment: grade.average_investment,
      grade: grade.grade,
      percentage: grade.percentage,
      totalInvestments: grade.total_investments,
      status: grade.status || 'draft',
      adminNotes: grade.admin_notes,
      reviewedBy: grade.reviewed_by,
      reviewedAt: grade.reviewed_at,
      publishedAt: grade.published_at,
      originalGrade: grade.original_grade,
      originalPercentage: grade.original_percentage,
      manualOverride: grade.manual_override || false,
      team: grade.teams,
      assignment: grade.assignments
    })) || []

    return NextResponse.json({ 
      success: true, 
      data: transformedGrades 
    })
  } catch (error: any) {
    console.error('Error fetching grades:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id, 
      grade, 
      percentage, 
      adminNotes, 
      status, 
      manualOverride 
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Grade ID is required' }, { status: 400 })
    }

    const supabase = getSimpleSupabaseClient()

    // Get current grade to preserve original values if not already set
    const { data: currentGrade } = await supabase
      .from('grades')
      .select('original_grade, original_percentage')
      .eq('id', id)
      .single()

    const updateData: any = {
      grade,
      percentage,
      admin_notes: adminNotes,
      status,
      manual_override: manualOverride,
      updated_at: new Date().toISOString()
    }

    // Set original values if this is the first manual override
    if (manualOverride && !currentGrade?.original_grade) {
      updateData.original_grade = currentGrade?.grade
      updateData.original_percentage = currentGrade?.percentage
    }

    // Set review information
    if (status === 'approved' || status === 'published') {
      updateData.reviewed_by = session.user.id
      updateData.reviewed_at = new Date().toISOString()
    }

    // Set published date
    if (status === 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('grades')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        grade: data.grade,
        percentage: data.percentage,
        status: data.status,
        adminNotes: data.admin_notes,
        manualOverride: data.manual_override,
        reviewedBy: data.reviewed_by,
        reviewedAt: data.reviewed_at,
        publishedAt: data.published_at
      }
    })
  } catch (error: any) {
    console.error('Error updating grade:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update grade' },
      { status: 500 }
    )
  }
}
