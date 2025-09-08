-- Complete Startup Tycoon Database Setup
-- Run this in the Supabase SQL Editor

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
  team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  members TEXT[] NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  document_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  primary_link TEXT,
  backup_link TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'evaluated')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  evaluator_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investments table
CREATE TABLE investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id),
  investor_id UUID NOT NULL REFERENCES users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  amount INTEGER NOT NULL CHECK (amount >= 0 AND amount <= 50),
  is_incomplete BOOLEAN DEFAULT false,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grades table
CREATE TABLE grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  average_investment DECIMAL(10,2),
  grade VARCHAR(20) CHECK (grade IN ('high', 'median', 'low', 'incomplete')),
  percentage INTEGER CHECK (percentage >= 0 AND percentage <= 100),
  total_investments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_team_id ON submissions(team_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_assignment_id ON evaluations(assignment_id);
CREATE INDEX idx_investments_investor_id ON investments(investor_id);
CREATE INDEX idx_investments_assignment_id ON investments(assignment_id);
CREATE INDEX idx_grades_assignment_id ON grades(assignment_id);
CREATE INDEX idx_grades_team_id ON grades(team_id);

-- Set up RLS policies (simple, non-recursive)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations (can be restricted later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on assignments" ON assignments FOR ALL USING (true);
CREATE POLICY "Allow all operations on submissions" ON submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations on investments" ON investments FOR ALL USING (true);
CREATE POLICY "Allow all operations on grades" ON grades FOR ALL USING (true);
CREATE POLICY "Allow all operations on evaluations" ON evaluations FOR ALL USING (true);

-- Insert sample data
INSERT INTO users (email, name, role) VALUES 
('admin@startup.com', 'Admin User', 'admin'),
('student@startup.com', 'Student User', 'student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample team
INSERT INTO teams (name, description, members, created_by) VALUES 
('Sample Team', 'A sample team for testing', ARRAY['student@startup.com', 'member2@gmail.com'], 
 (SELECT id FROM users WHERE email = 'admin@startup.com'))
ON CONFLICT DO NOTHING;

-- Insert sample assignment
INSERT INTO assignments (title, description, start_date, due_date, is_active, created_by) VALUES 
('Sample Assignment', 'A sample assignment for testing', 
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', true,
 (SELECT id FROM users WHERE email = 'admin@startup.com'))
ON CONFLICT DO NOTHING;
