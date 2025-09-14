const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixConstraint() {
  try {
    console.log('🔧 Fixing grades status constraint...')
    
    // First, let's check what the current constraint allows
    console.log('📝 Please run this SQL in your Supabase SQL Editor to fix the constraint:')
    console.log(`
-- Drop the existing constraint
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_status_check;

-- Add the correct constraint with all valid status values
ALTER TABLE grades 
ADD CONSTRAINT grades_status_check 
CHECK (status IN ('draft', 'pending_review', 'approved', 'published'));

-- Verify the constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'grades_status_check';
    `)
    
    console.log('\n🔍 After running the SQL, test with this script again...')
    
    // Test the constraint after the fix
    console.log('\n🧪 Testing constraint with valid status values...')
    
    const testStatuses = ['draft', 'pending_review', 'approved', 'published']
    
    for (const status of testStatuses) {
      console.log(`Testing status: ${status}`)
      
      // Try to update an existing grade with this status
      const { data: existingGrade } = await supabase
        .from('grades')
        .select('id')
        .limit(1)
        .single()
      
      if (existingGrade) {
        const { error } = await supabase
          .from('grades')
          .update({ status })
          .eq('id', existingGrade.id)
        
        if (error) {
          console.log(`❌ Status '${status}' failed:`, error.message)
        } else {
          console.log(`✅ Status '${status}' works`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixConstraint()
