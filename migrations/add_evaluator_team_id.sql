-- Add evaluator_team_id column to evaluations table for team-based evaluations
ALTER TABLE public.evaluations 
ADD COLUMN evaluator_team_id uuid;

-- Add foreign key constraint for evaluator_team_id
ALTER TABLE public.evaluations 
ADD CONSTRAINT evaluations_evaluator_team_id_fkey 
FOREIGN KEY (evaluator_team_id) REFERENCES public.teams(id);

-- Add index for better performance
CREATE INDEX idx_evaluations_evaluator_team_id ON public.evaluations(evaluator_team_id);

-- Add index for combined queries
CREATE INDEX idx_evaluations_team_evaluator ON public.evaluations(evaluator_team_id, team_id);
