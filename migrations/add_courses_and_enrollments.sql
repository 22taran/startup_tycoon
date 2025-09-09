-- Migration: Add Courses and Course Enrollments
-- This migration adds multi-course support to the Startup Tycoon application

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(20) NOT NULL UNIQUE, -- e.g., "CS101", "BUS200"
  semester VARCHAR(50) NOT NULL, -- e.g., "Fall 2024", "Spring 2025"
  year INTEGER NOT NULL,
  instructor_id UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'ta')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(course_id, user_id) -- Prevent duplicate enrollments
);

-- Add course_id to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- Add course_id to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_semester_year ON courses(semester, year);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_role ON course_enrollments(role);
CREATE INDEX IF NOT EXISTS idx_teams_course_id ON teams(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);

-- Add RLS policies for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Courses: Instructors can manage their own courses, students can view courses they're enrolled in
CREATE POLICY "Instructors can manage their courses" ON courses
  FOR ALL USING (
    instructor_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_id = courses.id 
      AND user_id = auth.uid() 
      AND role = 'instructor'
    )
  );

CREATE POLICY "Students can view enrolled courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_id = courses.id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- Course enrollments: Users can view their own enrollments, instructors can manage enrollments for their courses
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Instructors can manage enrollments for their courses" ON course_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_enrollments.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Update existing RLS policies to include course context
-- Note: This is a placeholder - you'll need to update existing policies based on your current setup
-- The existing policies should be modified to include course_id checks where appropriate

-- Create a default course for existing data (optional - for migration purposes)
-- You can uncomment this if you want to create a default course for existing assignments/teams
/*
INSERT INTO courses (name, description, code, semester, year, instructor_id, is_active)
SELECT 
  'Default Course',
  'Default course for existing data migration',
  'DEFAULT',
  'Fall 2024',
  2024,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  true
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'DEFAULT');

-- Update existing teams to belong to the default course
UPDATE teams 
SET course_id = (SELECT id FROM courses WHERE code = 'DEFAULT')
WHERE course_id IS NULL;

-- Update existing assignments to belong to the default course
UPDATE assignments 
SET course_id = (SELECT id FROM courses WHERE code = 'DEFAULT')
WHERE course_id IS NULL;
*/

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
