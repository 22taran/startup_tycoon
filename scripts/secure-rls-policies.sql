-- Secure RLS Policies for Startup Tycoon
-- This script creates proper Row Level Security policies
-- Run this in the Supabase SQL editor

-- First, drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on teams" ON teams;
DROP POLICY IF EXISTS "Allow all operations on assignments" ON assignments;
DROP POLICY IF EXISTS "Allow all operations on submissions" ON submissions;
DROP POLICY IF EXISTS "Allow all operations on investments" ON investments;
DROP POLICY IF EXISTS "Allow all operations on grades" ON grades;
DROP POLICY IF EXISTS "Allow all operations on evaluations" ON evaluations;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Teams table policies
CREATE POLICY "Users can view teams they belong to" ON teams
  FOR SELECT USING (
    auth.uid()::text = ANY(members) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (
    auth.uid()::text = ANY(members) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Team members can update their teams" ON teams
  FOR UPDATE USING (
    auth.uid()::text = ANY(members) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Assignments table policies
CREATE POLICY "All authenticated users can view assignments" ON assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update assignments" ON assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Submissions table policies
CREATE POLICY "Users can view submissions from their teams" ON submissions
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE auth.uid()::text = ANY(members)
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Team members can create submissions" ON submissions
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM teams 
      WHERE auth.uid()::text = ANY(members)
    )
  );

CREATE POLICY "Team members can update their submissions" ON submissions
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE auth.uid()::text = ANY(members)
    )
  );

-- Investments table policies
CREATE POLICY "Users can view their own investments" ON investments
  FOR SELECT USING (
    investor_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Students can create investments" ON investments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'student'
    ) AND
    investor_id = auth.uid()::text
  );

CREATE POLICY "Users can update their own investments" ON investments
  FOR UPDATE USING (
    investor_id = auth.uid()::text
  );

-- Grades table policies
CREATE POLICY "Users can view grades for their teams" ON grades
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE auth.uid()::text = ANY(members)
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create grades" ON grades
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Evaluations table policies
CREATE POLICY "Users can view evaluations assigned to them" ON evaluations
  FOR SELECT USING (
    evaluator_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create evaluations" ON evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Evaluators can update their evaluations" ON evaluations
  FOR UPDATE USING (
    evaluator_id = auth.uid()::text
  );

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_teams_members ON teams USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_grades_team_id ON grades(team_id);
