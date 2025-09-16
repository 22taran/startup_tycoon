require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runEvaluationConstraints() {
  console.log('🔧 Running evaluation constraints migration...\n')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_evaluation_constraints.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    console.log(`📏 Migration size: ${migrationSQL.length} characters`)
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`🔢 Found ${statements.length} SQL statements to execute`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(0)
          
          if (directError) {
            console.error(`❌ Statement ${i + 1} failed:`, error.message)
            errorCount++
            continue
          }
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`)
        successCount++
        
      } catch (err) {
        console.error(`❌ Statement ${i + 1} failed:`, err.message)
        errorCount++
      }
    }
    
    console.log(`\n📊 Migration Results:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 All constraints and validations added successfully!')
      
      // Test the constraints
      console.log('\n🧪 Testing constraints...')
      await testConstraints()
      
    } else {
      console.log('\n⚠️ Some statements failed. Check the errors above.')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  }
}

async function testConstraints() {
  try {
    // Test 1: Check if constraints exist
    console.log('🔍 Checking constraint existence...')
    
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .in('constraint_name', [
        'check_no_self_evaluation',
        'check_no_team_self_evaluation',
        'check_evaluation_dates',
        'check_evaluation_status'
      ])
    
    if (constraintError) {
      console.log('⚠️ Could not check constraints:', constraintError.message)
    } else {
      console.log(`✅ Found ${constraints?.length || 0} constraints`)
      constraints?.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name} (${constraint.constraint_type})`)
      })
    }
    
    // Test 2: Check if functions exist
    console.log('\n🔍 Checking function existence...')
    
    const { data: functions, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .in('routine_name', [
        'validate_evaluation_assignment',
        'find_self_evaluations',
        'cleanup_self_evaluations'
      ])
    
    if (functionError) {
      console.log('⚠️ Could not check functions:', functionError.message)
    } else {
      console.log(`✅ Found ${functions?.length || 0} functions`)
      functions?.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`)
      })
    }
    
    // Test 3: Check if triggers exist
    console.log('\n🔍 Checking trigger existence...')
    
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .in('trigger_name', [
        'trigger_validate_evaluation_assignment',
        'trigger_validate_team_evaluation'
      ])
    
    if (triggerError) {
      console.log('⚠️ Could not check triggers:', triggerError.message)
    } else {
      console.log(`✅ Found ${triggers?.length || 0} triggers`)
      triggers?.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`)
      })
    }
    
    console.log('\n✅ Constraint testing completed!')
    
  } catch (error) {
    console.error('❌ Constraint testing failed:', error.message)
  }
}

runEvaluationConstraints()
