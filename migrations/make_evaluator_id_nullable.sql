-- Make evaluator_id column nullable since we're moving to team-based evaluations
ALTER TABLE public.evaluations 
ALTER COLUMN evaluator_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN public.evaluations.evaluator_id IS 'Individual evaluator ID (nullable for team-based evaluations)';
COMMENT ON COLUMN public.evaluations.evaluator_team_id IS 'Team evaluator ID (primary field for team-based evaluations)';
