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
  userEmails: z.array(z.string().email()).optional(),
  userIds: z.array(z.string().uuid()).optional(),
  role: z.enum(['student', 'instructor', 'ta']),
}).refine(
  (data) => data.userEmails?.length || data.userIds?.length,
  {
    message: "Either userEmails or userIds must be provided",
    path: ["userEmails", "userIds"],
  }
);

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

    const { userEmails, userIds, role } = validation.data;

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

    let users: any[] = [];
    let notFoundEmails: string[] = [];

    if (userEmails && userEmails.length > 0) {
      // Get user IDs for the provided emails
      const { data: usersByEmail, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('email', userEmails);

      if (usersError) {
        console.error('Error fetching users by email:', usersError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      users = usersByEmail || [];
      const foundEmails = users.map(user => user.email);
      notFoundEmails = userEmails.filter(email => !foundEmails.includes(email));

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
    } else if (userIds && userIds.length > 0) {
      // Get users by provided IDs
      const { data: usersById, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users by ID:', usersError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      users = usersById || [];
      const foundIds = users.map(user => user.id);
      const notFoundIds = userIds.filter(id => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Some users not found',
            details: `User IDs not found: ${notFoundIds.join(', ')}`
          },
          { status: 400 }
        );
      }
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
        notFound: userEmails ? notFoundEmails : []
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

// DELETE /api/courses/[id]/enrollments - Remove user from course
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
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this course (instructor or admin)
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

    // Check if user is instructor or admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const isInstructor = course.instructor_id === session.user.email;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to remove users from this course' },
        { status: 403 }
      );
    }

    // Remove the enrollment
    const { error: deleteError } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing enrollment:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove user from course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User removed from course successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]/enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
