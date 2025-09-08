-- Test Data for Startup Tycoon Evaluation System
-- Run this in the Supabase SQL Editor

-- Clear existing data (optional - be careful in production!)
-- DELETE FROM investments;
-- DELETE FROM evaluations;
-- DELETE FROM submissions;
-- DELETE FROM assignments;
-- DELETE FROM teams;
-- DELETE FROM users WHERE role != 'admin';

-- Insert test users
INSERT INTO users (email, name, role) VALUES 
('admin@startup.com', 'Admin User', 'admin'),
('student1@startup.com', 'Alice Johnson', 'student'),
('student2@startup.com', 'Bob Smith', 'student'),
('student3@startup.com', 'Carol Davis', 'student'),
('student4@startup.com', 'David Wilson', 'student'),
('student5@startup.com', 'Eva Brown', 'student'),
('student6@startup.com', 'Frank Miller', 'student'),
('student7@startup.com', 'Grace Lee', 'student'),
('student8@startup.com', 'Henry Taylor', 'student'),
('student9@startup.com', 'Ivy Chen', 'student'),
('student10@startup.com', 'Jack Anderson', 'student');

-- Get user IDs for reference
-- (These will be used in subsequent inserts)

-- Insert test teams
INSERT INTO teams (name, description, members, created_by) VALUES 
('Team Alpha', 'Innovative solutions for modern problems', 
 ARRAY['student1@startup.com', 'student2@startup.com'],
 (SELECT id FROM users WHERE email = 'admin@startup.com')),
('Team Beta', 'Data-driven approach to business challenges', 
 ARRAY['student3@startup.com', 'student4@startup.com'],
 (SELECT id FROM users WHERE email = 'admin@startup.com')),
('Team Gamma', 'Creative design and user experience focus', 
 ARRAY['student5@startup.com', 'student6@startup.com'],
 (SELECT id FROM users WHERE email = 'admin@startup.com')),
('Team Delta', 'Technical excellence and performance optimization', 
 ARRAY['student7@startup.com', 'student8@startup.com'],
 (SELECT id FROM users WHERE email = 'admin@startup.com')),
('Team Epsilon', 'Sustainability and environmental solutions', 
 ARRAY['student9@startup.com', 'student10@startup.com'],
 (SELECT id FROM users WHERE email = 'admin@startup.com'));

-- Insert test assignments
INSERT INTO assignments (title, description, start_date, due_date, is_active, created_by) VALUES 
('Assignment 1: Market Research & Analysis', 
 'Conduct comprehensive market research for a new product idea. Analyze target audience, competitors, and market opportunities.',
 '2024-01-15T09:00:00Z', '2024-01-22T23:59:59Z', true,
 (SELECT id FROM users WHERE email = 'admin@startup.com')),
('Assignment 2: Product Design & Prototyping', 
 'Design a minimum viable product (MVP) based on your market research. Create wireframes, user flows, and a basic prototype.',
 '2024-01-29T09:00:00Z', '2024-02-05T23:59:59Z', true,
 (SELECT id FROM users WHERE email = 'admin@startup.com')),
('Assignment 3: Business Model & Strategy', 
 'Develop a comprehensive business model including revenue streams, cost structure, and go-to-market strategy.',
 '2024-02-12T09:00:00Z', '2024-02-19T23:59:59Z', true,
 (SELECT id FROM users WHERE email = 'admin@startup.com'));

-- Insert test submissions (for Assignment 1)
INSERT INTO submissions (assignment_id, team_id, primary_link, backup_link, status, submitted_at) VALUES 
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Alpha'),
 'https://docs.google.com/presentation/d/1abc123',
 'https://drive.google.com/file/d/1xyz789',
 'submitted', '2024-01-21T15:30:00Z'),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Beta'),
 'https://www.figma.com/file/2def456',
 'https://miro.com/app/board/2ghi012',
 'submitted', '2024-01-21T18:45:00Z'),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Gamma'),
 'https://docs.google.com/document/d/3jkl345',
 'https://notion.so/3mno678',
 'submitted', '2024-01-22T10:15:00Z'),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Delta'),
 'https://www.canva.com/design/4pqr901',
 'https://prezi.com/p/4stu234',
 'submitted', '2024-01-22T14:20:00Z'),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'),
 'https://docs.google.com/spreadsheets/d/5vwx567',
 'https://airtable.com/shr/5yza890',
 'submitted', '2024-01-22T16:30:00Z');

-- Insert evaluation assignments (distribute assignments to students)
-- Each student evaluates 5 different submissions
INSERT INTO evaluations (assignment_id, evaluator_id, submission_id, team_id, is_complete) VALUES 
-- Alice Johnson (student1@startup.com) evaluates 5 submissions
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM teams WHERE name = 'Team Beta'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM teams WHERE name = 'Team Gamma'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM teams WHERE name = 'Team Delta'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM teams WHERE name = 'Team Alpha'), false),

-- Bob Smith (student2@startup.com) evaluates 5 submissions
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM teams WHERE name = 'Team Alpha'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM teams WHERE name = 'Team Gamma'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM teams WHERE name = 'Team Delta'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM teams WHERE name = 'Team Beta'), true),

-- Carol Davis (student3@startup.com) evaluates 5 submissions
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM teams WHERE name = 'Team Alpha'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM teams WHERE name = 'Team Beta'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM teams WHERE name = 'Team Delta'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM teams WHERE name = 'Team Gamma'), false),

-- David Wilson (student4@startup.com) evaluates 5 submissions
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM teams WHERE name = 'Team Alpha'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM teams WHERE name = 'Team Beta'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM teams WHERE name = 'Team Gamma'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM teams WHERE name = 'Team Delta'), true),

-- Eva Brown (student5@startup.com) evaluates 5 submissions
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM teams WHERE name = 'Team Alpha'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM teams WHERE name = 'Team Beta'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM teams WHERE name = 'Team Gamma'), false),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM teams WHERE name = 'Team Delta'), true),
((SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 (SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'), false)
;

-- Insert sample investments (for completed evaluations)
INSERT INTO investments (submission_id, assignment_id, team_id, investor_id, amount, is_incomplete, comments) VALUES 
-- Alice Johnson's investments
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Gamma'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 35, false, 'Great work! Very innovative approach.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'),
 (SELECT id FROM users WHERE email = 'student1@startup.com'),
 42, false, 'Excellent presentation and clear structure.'),

-- Bob Smith's investments
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Alpha'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 28, false, 'Good analysis, but could use more data.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Delta'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 45, false, 'Interesting concept, needs more technical details.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'),
 (SELECT id FROM users WHERE email = 'student2@startup.com'),
 0, true, 'Marked as incomplete - missing key sections.'),

-- Carol Davis's investments
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Beta'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 38, false, 'Well-researched and comprehensive.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Epsilon')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Epsilon'),
 (SELECT id FROM users WHERE email = 'student3@startup.com'),
 33, false, 'Good start, but needs more depth.'),

-- David Wilson's investments
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Alpha')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Alpha'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 41, false, 'Creative solution to the problem.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Gamma')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Gamma'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 29, false, 'Solid foundation, room for improvement.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Delta'),
 (SELECT id FROM users WHERE email = 'student4@startup.com'),
 47, false, 'Outstanding work! Very thorough analysis.'),

-- Eva Brown's investments
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Beta')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Beta'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 36, false, 'Great market insights and competitive analysis.'),
((SELECT id FROM submissions WHERE team_id = (SELECT id FROM teams WHERE name = 'Team Delta')),
 (SELECT id FROM assignments WHERE title = 'Assignment 1: Market Research & Analysis'),
 (SELECT id FROM teams WHERE name = 'Team Delta'),
 (SELECT id FROM users WHERE email = 'student5@startup.com'),
 44, false, 'Excellent data visualization and clear conclusions.')
;

-- Display summary
SELECT 
  'Data Summary' as info,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM teams) as total_teams,
  (SELECT COUNT(*) FROM assignments) as total_assignments,
  (SELECT COUNT(*) FROM submissions) as total_submissions,
  (SELECT COUNT(*) FROM evaluations) as total_evaluations,
  (SELECT COUNT(*) FROM investments) as total_investments;
