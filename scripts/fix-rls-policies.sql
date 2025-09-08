-- Fix RLS policies to prevent infinite recursion
-- This script should be run in the Supabase SQL editor

-- First, disable RLS temporarily to fix the policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Teams can view their own data" ON teams;
DROP POLICY IF EXISTS "Teams can update their own data" ON teams;
DROP POLICY IF EXISTS "Teams can insert their own data" ON teams;
DROP POLICY IF EXISTS "Assignments are viewable by all" ON assignments;
DROP POLICY IF EXISTS "Submissions are viewable by all" ON submissions;
DROP POLICY IF EXISTS "Investments are viewable by all" ON investments;
DROP POLICY IF EXISTS "Grades are viewable by all" ON grades;
DROP POLICY IF EXISTS "Evaluations are viewable by all" ON evaluations;

-- Create simple, non-recursive policies
-- Users table - allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true);

-- Teams table - allow all operations
CREATE POLICY "Allow all operations on teams" ON teams
  FOR ALL USING (true);

-- Assignments table - allow all operations
CREATE POLICY "Allow all operations on assignments" ON assignments
  FOR ALL USING (true);

-- Submissions table - allow all operations
CREATE POLICY "Allow all operations on submissions" ON submissions
  FOR ALL USING (true);

-- Investments table - allow all operations
CREATE POLICY "Allow all operations on investments" ON investments
  FOR ALL USING (true);

-- Grades table - allow all operations
CREATE POLICY "Allow all operations on grades" ON grades
  FOR ALL USING (true);

-- Evaluations table - allow all operations
CREATE POLICY "Allow all operations on evaluations" ON evaluations
  FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
