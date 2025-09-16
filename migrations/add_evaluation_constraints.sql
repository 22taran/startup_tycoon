-- Add comprehensive constraints and validation for evaluation assignments
-- This migration adds multiple layers of protection against self-evaluations

-- 1. Add check constraint to prevent self-evaluations in assignment_evaluations table
ALTER TABLE assignment_evaluations 
ADD CONSTRAINT check_no_self_evaluation 
CHECK (
  NOT EXISTS (
    SELECT 1 
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    WHERE s.id = assignment_evaluations.submission_id 
    AND t.members @> ARRAY[assignment_evaluations.evaluator_student_id]
  )
);

-- 2. Add check constraint for team-based evaluations in evaluations table
ALTER TABLE evaluations 
ADD CONSTRAINT check_no_team_self_evaluation 
CHECK (
  evaluator_team_id != team_id
);

-- 3. Create a function to validate evaluation assignments
CREATE OR REPLACE FUNCTION validate_evaluation_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for individual self-evaluations
  IF NEW.evaluator_student_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = NEW.submission_id 
      AND t.members @> ARRAY[NEW.evaluator_student_id]
    ) THEN
      RAISE EXCEPTION 'Self-evaluation not allowed: Student % cannot evaluate their own team', NEW.evaluator_student_id;
    END IF;
  END IF;
  
  -- Check for team self-evaluations
  IF NEW.evaluator_team_id IS NOT NULL AND NEW.team_id IS NOT NULL THEN
    IF NEW.evaluator_team_id = NEW.team_id THEN
      RAISE EXCEPTION 'Self-evaluation not allowed: Team % cannot evaluate itself', NEW.evaluator_team_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for assignment_evaluations table
DROP TRIGGER IF EXISTS trigger_validate_evaluation_assignment ON assignment_evaluations;
CREATE TRIGGER trigger_validate_evaluation_assignment
  BEFORE INSERT OR UPDATE ON assignment_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION validate_evaluation_assignment();

-- 5. Create trigger for evaluations table
DROP TRIGGER IF EXISTS trigger_validate_team_evaluation ON evaluations;
CREATE TRIGGER trigger_validate_team_evaluation
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION validate_evaluation_assignment();

-- 6. Add additional constraints for data integrity
ALTER TABLE assignment_evaluations 
ADD CONSTRAINT check_evaluation_dates 
CHECK (due_at > created_at);

ALTER TABLE assignment_evaluations 
ADD CONSTRAINT check_evaluation_status 
CHECK (evaluation_status IN ('assigned', 'in_progress', 'completed', 'overdue'));

-- 7. Create index for better performance on self-evaluation checks
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_members ON teams USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_assignment_evaluations_student ON assignment_evaluations(evaluator_student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_evaluations_submission ON assignment_evaluations(submission_id);

-- 8. Create a function to check for existing self-evaluations (for cleanup)
CREATE OR REPLACE FUNCTION find_self_evaluations()
RETURNS TABLE (
  evaluation_id UUID,
  evaluator_id UUID,
  team_id UUID,
  submission_id UUID,
  evaluation_type TEXT
) AS $$
BEGIN
  -- Find individual self-evaluations
  RETURN QUERY
  SELECT 
    ae.id as evaluation_id,
    ae.evaluator_student_id as evaluator_id,
    t.id as team_id,
    ae.submission_id,
    'individual' as evaluation_type
  FROM assignment_evaluations ae
  JOIN submissions s ON ae.submission_id = s.id
  JOIN teams t ON s.team_id = t.id
  WHERE t.members @> ARRAY[ae.evaluator_student_id];
  
  -- Find team self-evaluations
  UNION ALL
  SELECT 
    e.id as evaluation_id,
    NULL as evaluator_id,
    e.team_id,
    e.submission_id,
    'team' as evaluation_type
  FROM evaluations e
  WHERE e.evaluator_team_id = e.team_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create a function to clean up self-evaluations
CREATE OR REPLACE FUNCTION cleanup_self_evaluations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  self_eval RECORD;
BEGIN
  -- Delete individual self-evaluations
  FOR self_eval IN 
    SELECT id FROM assignment_evaluations ae
    JOIN submissions s ON ae.submission_id = s.id
    JOIN teams t ON s.team_id = t.id
    WHERE t.members @> ARRAY[ae.evaluator_student_id]
  LOOP
    DELETE FROM assignment_evaluations WHERE id = self_eval.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Delete team self-evaluations
  FOR self_eval IN 
    SELECT id FROM evaluations WHERE evaluator_team_id = team_id
  LOOP
    DELETE FROM evaluations WHERE id = self_eval.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Add comments for documentation
COMMENT ON CONSTRAINT check_no_self_evaluation ON assignment_evaluations IS 'Prevents students from evaluating their own team submissions';
COMMENT ON CONSTRAINT check_no_team_self_evaluation ON evaluations IS 'Prevents teams from evaluating themselves';
COMMENT ON FUNCTION validate_evaluation_assignment() IS 'Validates that evaluation assignments are not self-evaluations';
COMMENT ON FUNCTION find_self_evaluations() IS 'Finds existing self-evaluations in the database';
COMMENT ON FUNCTION cleanup_self_evaluations() IS 'Removes existing self-evaluations from the database';
