const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateConstraint() {
  try {
    console.log('🔧 Updating grades status constraint...')
    
    console.log('📝 Please run this SQL in your Supabase SQL Editor:')
    console.log(`
-- Drop the existing constraint
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_status_check;

-- Add the simplified constraint with only draft and published
ALTER TABLE grades 
ADD CONSTRAINT grades_status_check 
CHECK (status IN ('draft', 'published'));

-- Update any existing 'approved' grades to 'published'
UPDATE grades SET status = 'published' WHERE status = 'approved';

-- Verify the constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'grades_status_check';
    `)
    
    console.log('\n✅ After running this SQL:')
    console.log('- Only draft and published statuses will be allowed')
    console.log('- Any existing approved grades will be converted to published')
    console.log('- The workflow will be simplified to draft → published')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateConstraint()
