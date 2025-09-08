-- Add evaluation deadline fields to assignments table
-- Run this in the Supabase SQL Editor

-- Add evaluation deadline columns to assignments table
ALTER TABLE assignments 
ADD COLUMN evaluation_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN evaluation_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_evaluation_active BOOLEAN DEFAULT false;

-- Add index for evaluation dates
CREATE INDEX idx_assignments_evaluation_dates ON assignments(evaluation_start_date, evaluation_due_date);

-- Update existing assignments to have evaluation periods (if any exist)
-- This sets evaluation to start 3 days after assignment due date and end 5 days after
UPDATE assignments 
SET 
  evaluation_start_date = due_date + INTERVAL '3 days',
  evaluation_due_date = due_date + INTERVAL '5 days'
WHERE evaluation_start_date IS NULL;

-- Add comment to explain the evaluation timeline
COMMENT ON COLUMN assignments.evaluation_start_date IS 'When evaluation phase starts (typically Saturday after assignment due date)';
COMMENT ON COLUMN assignments.evaluation_due_date IS 'When evaluation phase ends (typically Monday)';
COMMENT ON COLUMN assignments.is_evaluation_active IS 'Whether the evaluation phase is currently active';
