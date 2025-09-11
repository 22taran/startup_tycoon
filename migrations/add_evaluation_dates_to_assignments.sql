-- Add evaluation date columns to assignments table
-- This migration adds evaluation_start_date and evaluation_due_date columns

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS evaluation_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evaluation_due_date TIMESTAMP WITH TIME ZONE;

-- Add index for evaluation dates
CREATE INDEX IF NOT EXISTS idx_assignments_evaluation_dates ON assignments(evaluation_start_date, evaluation_due_date);
