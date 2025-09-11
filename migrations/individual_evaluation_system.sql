-- Individual Evaluation System Migration
-- This migration implements the new individual student evaluation system

-- 1. Individual evaluation assignments table
CREATE TABLE IF NOT EXISTS assignment_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  evaluator_student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluated_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  evaluation_status VARCHAR(20) DEFAULT 'assigned' CHECK (evaluation_status IN ('assigned', 'completed', 'late', 'missed')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, evaluator_student_id, evaluated_team_id)
);

-- 2. Investment tracking with limits
CREATE TABLE IF NOT EXISTS assignment_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  investor_student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invested_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  tokens_invested INTEGER NOT NULL CHECK (tokens_invested >= 0 AND tokens_invested <= 50),
  investment_rank INTEGER CHECK (investment_rank >= 1 AND investment_rank <= 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, investor_student_id, invested_team_id)
);

-- 3. Interest tracking for bonus marks
CREATE TABLE IF NOT EXISTS student_interest_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  invested_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  tokens_invested INTEGER NOT NULL,
  team_performance_tier VARCHAR(20) CHECK (team_performance_tier IN ('high', 'median', 'low', 'incomplete')),
  interest_earned DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Assignment-specific team memberships
CREATE TABLE IF NOT EXISTS assignment_team_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 5. Track team changes for analytics
CREATE TABLE IF NOT EXISTS assignment_team_change_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_type VARCHAR(20) DEFAULT 'student_change' CHECK (change_type IN ('student_change', 'admin_override'))
);

-- 6. Update teams table to enforce 2-student limit
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS current_member_count INTEGER DEFAULT 0;

-- Add constraint to enforce team size limit (drop first if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_size_check') THEN
        ALTER TABLE teams DROP CONSTRAINT teams_size_check;
    END IF;
END $$;

ALTER TABLE teams 
ADD CONSTRAINT teams_size_check CHECK (current_member_count <= max_members);

-- 7. Update assignments table to track team locking
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS team_locking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS team_locked_at TIMESTAMP WITH TIME ZONE;

-- 8. Update evaluations table to support individual evaluations
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS evaluator_student_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(20) DEFAULT 'individual' CHECK (evaluation_type IN ('individual', 'team'));

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_evaluations_student ON assignment_evaluations(evaluator_student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_evaluations_assignment ON assignment_evaluations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_evaluations_team ON assignment_evaluations(evaluated_team_id);

CREATE INDEX IF NOT EXISTS idx_assignment_investments_student ON assignment_investments(investor_student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_investments_assignment ON assignment_investments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_investments_team ON assignment_investments(invested_team_id);

CREATE INDEX IF NOT EXISTS idx_assignment_team_memberships_student ON assignment_team_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_team_memberships_assignment ON assignment_team_memberships(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_team_memberships_team ON assignment_team_memberships(team_id);

-- 10. Add RLS policies for new tables
ALTER TABLE assignment_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_interest_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_team_change_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_evaluations
CREATE POLICY "Students can view their own evaluations" ON assignment_evaluations
  FOR SELECT USING (evaluator_student_id = auth.uid());

CREATE POLICY "Admins can view all evaluations" ON assignment_evaluations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS policies for assignment_investments
CREATE POLICY "Students can view their own investments" ON assignment_investments
  FOR SELECT USING (investor_student_id = auth.uid());

CREATE POLICY "Students can manage their own investments" ON assignment_investments
  FOR ALL USING (investor_student_id = auth.uid());

CREATE POLICY "Admins can view all investments" ON assignment_investments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS policies for assignment_team_memberships
CREATE POLICY "Students can view their own team memberships" ON assignment_team_memberships
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can manage their own team memberships" ON assignment_team_memberships
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins can view all team memberships" ON assignment_team_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS policies for student_interest_tracking
CREATE POLICY "Students can view their own interest tracking" ON student_interest_tracking
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all interest tracking" ON student_interest_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS policies for assignment_team_change_history
CREATE POLICY "Students can view their own team change history" ON assignment_team_change_history
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all team change history" ON assignment_team_change_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
