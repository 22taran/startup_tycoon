-- Migration: Add instructor_name to courses table
-- This migration adds instructor_name field to store the instructor's display name

-- Add instructor_name column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);

-- Update existing courses with instructor names from users table
UPDATE courses 
SET instructor_name = u.name 
FROM users u 
WHERE courses.instructor_id = u.id 
AND courses.instructor_name IS NULL;

-- Make instructor_name NOT NULL after updating existing records
ALTER TABLE courses ALTER COLUMN instructor_name SET NOT NULL;
