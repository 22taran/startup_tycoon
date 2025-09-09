import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for enrollment
const enrollmentSchema = z.object({
  userEmails: z.array(z.string().email()).min(1, 'At least one email is required'),
  role: z.enum(['student', 'instructor', 'ta']),
});

// GET /api/courses/[id]/enrollments - Get enrollments for a course
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

    // Check if user has access to this course (instructor or enrolled)
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

    const isInstructor = course.instructor_id === session.user.id;
    
    if (!isInstructor) {
      // Check if user is enrolled in the course
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!enrollment) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get all enrollments for the course
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollments || []
    });

  } catch (error) {
    console.error('Error in GET /api/courses/[id]/enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/enrollments - Enroll users in a course
export async function POST(
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
    const validation = enrollmentSchema.safeParse(body);

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

    const { userEmails, role } = validation.data;

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
        { success: false, error: 'Only the course instructor can enroll users' },
        { status: 403 }
      );
    }

    // Get user IDs for the provided emails
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('email', userEmails);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const foundEmails = users?.map(user => user.email) || [];
    const notFoundEmails = userEmails.filter(email => !foundEmails.includes(email));

    if (notFoundEmails.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Some users not found',
          details: `Users not found: ${notFoundEmails.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Check for existing enrollments
    const { data: existingEnrollments, error: existingError } = await supabase
      .from('course_enrollments')
      .select('user_id, status')
      .eq('course_id', courseId)
      .in('user_id', users?.map(user => user.id) || []);

    if (existingError) {
      console.error('Error checking existing enrollments:', existingError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing enrollments' },
        { status: 500 }
      );
    }

    const existingUserIds = existingEnrollments?.map(e => e.user_id) || [];
    const newUsers = users?.filter(user => !existingUserIds.includes(user.id)) || [];
    const alreadyEnrolledUsers = users?.filter(user => existingUserIds.includes(user.id)) || [];

    if (newUsers.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'All users are already enrolled in this course',
          details: `Already enrolled: ${alreadyEnrolledUsers.map(u => u.email).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Create new enrollments
    const enrollmentsToCreate = newUsers.map(user => ({
      id: uuidv4(),
      course_id: courseId,
      user_id: user.id,
      role,
      status: 'active',
      enrolled_at: new Date().toISOString()
    }));

    const { data: newEnrollments, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert(enrollmentsToCreate)
      .select(`
        *,
        user:users(name, email)
      `);

    if (enrollmentError) {
      console.error('Error creating enrollments:', enrollmentError);
      return NextResponse.json(
        { success: false, error: 'Failed to enroll users' },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      data: {
        enrolled: newEnrollments || [],
        alreadyEnrolled: alreadyEnrolledUsers.map(user => ({
          email: user.email,
          name: user.name
        })),
        notFound: notFoundEmails
      },
      message: `Successfully enrolled ${newUsers.length} user(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in POST /api/courses/[id]/enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
