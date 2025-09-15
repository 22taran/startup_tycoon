-- Add uniqueness constraint to prevent students from being in multiple teams per course
-- This migration adds a constraint to ensure each student can only be in one team per course

-- First, let's clean up any existing duplicate memberships
-- (This is a one-time cleanup - remove if not needed)
WITH duplicate_memberships AS (
  SELECT 
    t1.id as team_id,
    t1.course_id,
    unnest(t1.members) as student_id,
    ROW_NUMBER() OVER (PARTITION BY t1.course_id, unnest(t1.members) ORDER BY t1.created_at) as rn
  FROM teams t1
  WHERE t1.course_id IS NOT NULL
    AND t1.members IS NOT NULL
    AND array_length(t1.members, 1) > 0
)
DELETE FROM teams 
WHERE id IN (
  SELECT team_id 
  FROM duplicate_memberships 
  WHERE rn > 1
);

-- Add a function to check for duplicate memberships
CREATE OR REPLACE FUNCTION check_team_membership_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any member in the new/updated team is already in another team for the same course
  IF NEW.course_id IS NOT NULL AND NEW.members IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 
      FROM teams t 
      WHERE t.course_id = NEW.course_id 
        AND t.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND t.members IS NOT NULL
        AND t.members && NEW.members  -- Check for array overlap
    ) THEN
      RAISE EXCEPTION 'Students cannot be in multiple teams for the same course';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS check_team_membership_uniqueness_insert ON teams;
CREATE TRIGGER check_team_membership_uniqueness_insert
  BEFORE INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION check_team_membership_uniqueness();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS check_team_membership_uniqueness_update ON teams;
CREATE TRIGGER check_team_membership_uniqueness_update
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION check_team_membership_uniqueness();

-- Add comment explaining the constraint
COMMENT ON FUNCTION check_team_membership_uniqueness() IS 'Ensures students cannot be in multiple teams for the same course';
