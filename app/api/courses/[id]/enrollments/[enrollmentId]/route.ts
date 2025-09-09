import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for enrollment updates
const updateEnrollmentSchema = z.object({
  role: z.enum(['student', 'instructor', 'ta']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// PUT /api/courses/[id]/enrollments/[enrollmentId] - Update an enrollment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId, enrollmentId } = await params;
    const body = await request.json();
    const validation = updateEnrollmentSchema.safeParse(body);

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
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.instructor_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the course instructor can update enrollments' },
        { status: 403 }
      );
    }

    // Check if enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Update the enrollment
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('course_enrollments')
      .update(validation.data)
      .eq('id', enrollmentId)
      .select(`
        *,
        user:users(name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedEnrollment,
      message: 'Enrollment updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/courses/[id]/enrollments/[enrollmentId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id]/enrollments/[enrollmentId] - Remove an enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId, enrollmentId } = await params;

    // Check if user is the instructor of this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.instructor_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the course instructor can remove enrollments' },
        { status: 403 }
      );
    }

    // Check if enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to inactive
    const { error: updateError } = await supabase
      .from('course_enrollments')
      .update({ status: 'inactive' })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Error removing enrollment:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/enrollments/[enrollmentId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
