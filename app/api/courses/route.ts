import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for course creation
const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  code: z.string().min(1, 'Course code is required').max(20, 'Course code must be 20 characters or less'),
  semester: z.string().min(1, 'Semester is required'),
  year: z.number().int().min(2020).max(2030),
  instructorName: z.string().min(1, 'Instructor name is required'),
});

// GET /api/courses - Get courses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'instructor' or 'student'

    let query = supabase
      .from('courses')
      .select(`
        *,
        instructor:users!courses_instructor_id_fkey(name, email),
        enrollments:course_enrollments(
          user_id,
          role,
          status,
          user:users(name, email)
        )
      `)
      .eq('is_active', true);

    let courses = [];
    let error = null;

    if (role === 'instructor') {
      // Get courses where user is the instructor
      const { data, error: instructorError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(name, email),
          enrollments:course_enrollments(
            user_id,
            role,
            status,
            user:users(name, email)
          )
        `)
        .eq('is_active', true)
        .eq('instructor_id', session.user.id);
      courses = data || [];
      error = instructorError;
    } else if (role === 'student') {
      // Get courses where user is enrolled as a student
      const { data, error: studentError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(name, email),
          enrollments:course_enrollments(
            user_id,
            role,
            status,
            user:users(name, email)
          )
        `)
        .eq('is_active', true)
        .eq('enrollments.user_id', session.user.id)
        .eq('enrollments.role', 'student')
        .eq('enrollments.status', 'active');
      courses = data || [];
      error = studentError;
    } else {
      // Get all courses the user has access to (instructor or enrolled)
      // First get courses where user is instructor
      const { data: instructorCourses, error: instructorError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(name, email),
          enrollments:course_enrollments(
            user_id,
            role,
            status,
            user:users(name, email)
          )
        `)
        .eq('is_active', true)
        .eq('instructor_id', session.user.id);

      // Then get courses where user is enrolled
      const { data: enrolledCourses, error: enrolledError } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(name, email),
          enrollments:course_enrollments(
            user_id,
            role,
            status,
            user:users(name, email)
          )
        `)
        .eq('is_active', true)
        .eq('enrollments.user_id', session.user.id)
        .eq('enrollments.status', 'active');

      if (instructorError || enrolledError) {
        error = instructorError || enrolledError;
      } else {
        // Combine and deduplicate courses
        const allCourses = [...(instructorCourses || []), ...(enrolledCourses || [])];
        const uniqueCourses = allCourses.filter((course, index, self) => 
          index === self.findIndex(c => c.id === course.id)
        );
        courses = uniqueCourses;
      }
    }

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: courses || []
    });

  } catch (error) {
    console.error('Error in GET /api/courses:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can create courses
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can create courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createCourseSchema.safeParse(body);

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

    const { name, description, code, semester, year, instructorName } = validation.data;

    // Check if course code already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course code already exists' },
        { status: 400 }
      );
    }

    // Create the course
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        id: uuidv4(),
        name,
        description,
        code,
        semester,
        year,
        instructor_id: session.user.id,
        instructor_name: instructorName,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create course' },
        { status: 500 }
      );
    }

    // Automatically enroll the instructor in the course
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        id: uuidv4(),
        course_id: course.id,
        user_id: session.user.id,
        role: 'instructor',
        status: 'active',
        enrolled_at: new Date().toISOString()
      });

    if (enrollmentError) {
      console.error('Error enrolling instructor:', enrollmentError);
      // Don't fail the course creation if enrollment fails
    }

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/courses:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
