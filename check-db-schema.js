const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...')
    
    // Try to fetch a sample grade to see what columns exist
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
    
    if (gradesError) {
      console.error('❌ Error fetching grades:', gradesError)
      
      if (gradesError.message.includes('status')) {
        console.log('\n⚠️  Status column issue detected!')
        console.log('The error suggests the status column constraint is causing issues.')
        console.log('\n📝 Please run this SQL in your Supabase SQL Editor:')
        console.log(`
-- First, drop the constraint if it exists
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_status_check;

-- Add the status column with proper constraint
ALTER TABLE grades 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- Add the constraint
ALTER TABLE grades 
ADD CONSTRAINT grades_status_check 
CHECK (status IN ('draft', 'pending_review', 'approved', 'published'));

-- Add other columns
ALTER TABLE grades 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_grade VARCHAR(20),
ADD COLUMN IF NOT EXISTS original_percentage INTEGER,
ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grades_status ON grades(status);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_status ON grades(assignment_id, status);

-- Update existing grades
UPDATE grades SET status = 'published', published_at = created_at WHERE status IS NULL;
        `)
        return
      }
    }
    
    if (grades && grades.length > 0) {
      console.log('✅ Grades table accessible')
      console.log('📊 Sample grade columns:')
      const sampleGrade = grades[0]
      Object.keys(sampleGrade).forEach(key => {
        console.log(`  - ${key}: ${sampleGrade[key]}`)
      })
      
      // Check if status column exists
      if ('status' in sampleGrade) {
        console.log(`\n✅ Status column exists with value: ${sampleGrade.status}`)
      } else {
        console.log('\n❌ Status column missing!')
        console.log('\n📝 Please run the migration SQL in your Supabase SQL Editor')
      }
    } else {
      console.log('📋 No grades found in table')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDatabaseSchema()