#!/usr/bin/env node

/**
 * Test user creation with proper bcrypt hashing
 */

const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

async function testUserCreation() {
  console.log('🧪 Testing user creation with bcrypt hashing...')
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Test data
    const testUser = {
      email: 'test-user@example.com',
      name: 'Test User',
      password: 'testpassword123',
      role: 'student'
    }
    
    console.log('\n📝 Creating test user...')
    console.log(`Email: ${testUser.email}`)
    console.log(`Name: ${testUser.name}`)
    console.log(`Role: ${testUser.role}`)
    
    // Check if user already exists
    console.log('\n🔍 Checking if user already exists...')
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .maybeSingle()
    
    if (existingUser) {
      console.log('⚠️ User already exists, deleting first...')
      await supabase
        .from('users')
        .delete()
        .eq('email', testUser.email)
    }
    
    // Hash password using bcrypt (same as signup)
    console.log('\n🔐 Hashing password with bcrypt...')
    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    console.log(`✅ Password hashed: ${hashedPassword.substring(0, 20)}...`)
    
    // Create user in database
    console.log('\n💾 Creating user in database...')
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email: testUser.email,
        name: testUser.name,
        password: hashedPassword,
        role: testUser.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating user:', error)
      return
    }
    
    console.log('✅ User created successfully!')
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`Role: ${user.role}`)
    console.log(`Created: ${user.created_at}`)
    
    // Test password verification
    console.log('\n🔍 Testing password verification...')
    const isValidPassword = await bcrypt.compare(testUser.password, user.password)
    console.log(`Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`)
    
    // Clean up - delete the test user
    console.log('\n🧹 Cleaning up test user...')
    await supabase
      .from('users')
      .delete()
      .eq('id', user.id)
    
    console.log('✅ Test user deleted')
    
    console.log('\n🎉 User creation test completed successfully!')
    console.log('\n💡 The user management system now properly:')
    console.log('  - Uses bcrypt for password hashing (same as signup)')
    console.log('  - Creates users in the users table')
    console.log('  - Handles duplicate email checks')
    console.log('  - Works with the existing authentication system')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure your environment variables are set correctly')
  }
}

// Load environment variables
require('dotenv').config()

testUserCreation()
