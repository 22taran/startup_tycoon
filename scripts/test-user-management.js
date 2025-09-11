#!/usr/bin/env node

/**
 * Test user management system
 */

const fetch = require('node-fetch').default

async function testUserManagement() {
  console.log('🧪 Testing user management system...')
  
  try {
    // Test 1: Get all users
    console.log('\n📊 Test 1: Fetching all users...')
    const usersResponse = await fetch('http://localhost:3000/api/admin/users')
    const usersData = await usersResponse.json()
    
    if (usersData.success) {
      console.log(`✅ Successfully fetched ${usersData.data.length} users`)
      usersData.data.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
      })
    } else {
      console.log(`❌ Failed to fetch users: ${usersData.error}`)
    }
    
    // Test 2: Create a new user
    console.log('\n📝 Test 2: Creating a new user...')
    const newUser = {
      email: 'test-student@example.com',
      name: 'Test Student',
      password: 'testpassword123',
      role: 'student'
    }
    
    const createResponse = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    })
    
    const createData = await createResponse.json()
    
    if (createData.success) {
      console.log(`✅ Successfully created user: ${createData.data.name}`)
      const userId = createData.data.id
      
      // Test 3: Update user role
      console.log('\n🔄 Test 3: Updating user role...')
      const updateResponse = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-role',
          userId: userId,
          role: 'instructor'
        }),
      })
      
      const updateData = await updateResponse.json()
      
      if (updateData.success) {
        console.log(`✅ Successfully updated user role to instructor`)
      } else {
        console.log(`❌ Failed to update user role: ${updateData.error}`)
      }
      
      // Test 4: Delete user
      console.log('\n🗑️ Test 4: Deleting user...')
      const deleteResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
      })
      
      const deleteData = await deleteResponse.json()
      
      if (deleteData.success) {
        console.log(`✅ Successfully deleted user`)
      } else {
        console.log(`❌ Failed to delete user: ${deleteData.error}`)
      }
      
    } else {
      console.log(`❌ Failed to create user: ${createData.error}`)
    }
    
    console.log('\n✅ User management test complete!')
    console.log('\n💡 The admin portal should now have a full user management interface with:')
    console.log('  - User listing with search and filters')
    console.log('  - Create new users')
    console.log('  - Update user roles')
    console.log('  - Delete users')
    console.log('  - Role-based access control')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('💡 Make sure the development server is running: npm run dev')
  }
}

testUserManagement()
