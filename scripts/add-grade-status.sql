-- Add grade status and manual intervention fields to grades table
ALTER TABLE grades 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_grade VARCHAR(20),
ADD COLUMN IF NOT EXISTS original_percentage INTEGER,
ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;

-- Create index for grade status queries
CREATE INDEX IF NOT EXISTS idx_grades_status ON grades(status);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_status ON grades(assignment_id, status);

-- Update existing grades to have 'published' status (assuming they were already published)
UPDATE grades SET status = 'published', published_at = created_at WHERE status = 'draft';
