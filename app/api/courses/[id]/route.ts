import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for course updates
const updateCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required').optional(),
  description: z.string().optional(),
  code: z.string().min(1, 'Course code is required').max(20, 'Course code must be 20 characters or less').optional(),
  semester: z.string().min(1, 'Semester is required').optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  is_active: z.boolean().optional(),
});

// GET /api/courses/[id] - Get a specific course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // Get course with instructor and enrollment info
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!courses_instructor_id_fkey(name, email),
        enrollments:course_enrollments(
          user_id,
          role,
          status,
          enrolled_at,
          user:users(name, email)
        )
      `)
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this course
    const hasAccess = course.instructor_id === session.user.id || 
      course.enrollments.some((enrollment: any) => 
        enrollment.user_id === session.user.id && enrollment.status === 'active'
      );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Error in GET /api/courses/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const validation = updateCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    // Check if user is the instructor of this course
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('instructor_id, code')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.instructor_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the course instructor can update this course' },
        { status: 403 }
      );
    }

    // Check if course code is being changed and if it already exists
    if (validation.data.code && validation.data.code !== course.code) {
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', validation.data.code)
        .neq('id', courseId)
        .maybeSingle();

      if (existingCourse) {
        return NextResponse.json(
          { success: false, error: 'Course code already exists' },
          { status: 400 }
        );
      }
    }

    // Update the course
    const { data: updatedCourse, error } = await supabase
      .from('courses')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/courses/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete a course (soft delete by setting is_active to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // Check if user is the instructor of this course
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (fetchError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.instructor_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the course instructor can delete this course' },
        { status: 403 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('courses')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
