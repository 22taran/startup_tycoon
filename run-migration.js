const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🔄 Running grade status migration...')
    
    // First, let's check if the status column already exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'grades')
      .eq('column_name', 'status')
    
    if (columnError) {
      console.log('Could not check columns, proceeding with migration...')
    } else if (columns && columns.length > 0) {
      console.log('✅ Status column already exists, skipping migration')
      return
    }
    
    console.log('⚠️  Manual migration required:')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('-- Add grade status and manual intervention fields to grades table')
    console.log('ALTER TABLE grades ')
    console.log('ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'draft\' CHECK (status IN (\'draft\', \'pending_review\', \'approved\', \'published\')),')
    console.log('ADD COLUMN IF NOT EXISTS admin_notes TEXT,')
    console.log('ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),')
    console.log('ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,')
    console.log('ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,')
    console.log('ADD COLUMN IF NOT EXISTS original_grade VARCHAR(20),')
    console.log('ADD COLUMN IF NOT EXISTS original_percentage INTEGER,')
    console.log('ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;')
    console.log('')
    console.log('-- Create indexes for efficient queries')
    console.log('CREATE INDEX IF NOT EXISTS idx_grades_status ON grades(status);')
    console.log('CREATE INDEX IF NOT EXISTS idx_grades_assignment_status ON grades(assignment_id, status);')
    console.log('')
    console.log('-- Update existing grades to have published status')
    console.log('UPDATE grades SET status = \'published\', published_at = created_at WHERE status IS NULL;')
    console.log('')
    console.log('After running the SQL, the manual intervention system will be ready!')
    
  } catch (error) {
    console.error('❌ Migration check failed:', error)
  }
}

runMigration()