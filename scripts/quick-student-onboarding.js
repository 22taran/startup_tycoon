#!/usr/bin/env node

/**
 * Quick Student Onboarding Script
 * 
 * A simpler version for quick student creation
 * Usage: node scripts/quick-student-onboarding.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createStudent(name, email, courseId) {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Create user
    const hashedPassword = await bcrypt.hash('Student123!', 12);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email,
        name,
        password: hashedPassword,
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) throw userError;

    // Enroll in course if courseId provided
    if (courseId) {
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          id: uuidv4(),
          course_id: courseId,
          user_id: user.id,
          role: 'student',
          status: 'active',
          enrolled_at: new Date().toISOString()
        });

      if (enrollError) {
        console.log(`⚠️  User created but enrollment failed: ${enrollError.message}`);
      }
    }

    return { 
      success: true, 
      user: { 
        name: user.name, 
        email: user.email, 
        password: 'Student123!' 
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCourses() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, name, code')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return courses || [];
}

async function main() {
  console.log('🚀 Quick Student Onboarding\n');

  try {
    // Get courses
    const courses = await getCourses();
    if (courses.length === 0) {
      console.log('❌ No courses found. Create a course first.');
      return;
    }

    console.log('Available courses:');
    courses.forEach((course, i) => {
      console.log(`${i + 1}. ${course.name} (${course.code})`);
    });

    const courseChoice = await question('\nSelect course (number): ');
    const selectedCourse = courses[parseInt(courseChoice) - 1];
    
    if (!selectedCourse) {
      console.log('❌ Invalid course selection');
      return;
    }

    console.log(`\nSelected: ${selectedCourse.name}\n`);

    // Get number of students
    const count = await question('How many students to create? ');
    const studentCount = parseInt(count);

    if (isNaN(studentCount) || studentCount <= 0) {
      console.log('❌ Invalid number');
      return;
    }

    console.log(`\nCreating ${studentCount} students...\n`);

    const results = {
      successful: [],
      failed: []
    };

    // Create students
    for (let i = 1; i <= studentCount; i++) {
      const name = `Student ${i}`;
      const email = `student${i}@university.edu`; // Change this domain
      
      console.log(`Creating ${name}...`);
      
      const result = await createStudent(name, email, selectedCourse.id);
      
      if (result.success) {
        results.successful.push(result.user);
        console.log(`✅ Created: ${name} (${email})`);
      } else {
        results.failed.push({ name, email, error: result.error });
        console.log(`❌ Failed: ${name} - ${result.error}`);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    console.log('\n🎉 Onboarding Complete!');
    console.log('='.repeat(40));
    console.log(`✅ Created: ${results.successful.length} students`);
    console.log(`❌ Failed: ${results.failed.length} students`);
    
    if (results.successful.length > 0) {
      console.log('\n📋 Login credentials:');
      console.log('Email: student1@university.edu, student2@university.edu, etc.');
      console.log('Password: Student123!');
      console.log('\n💡 Students should change their password on first login');
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed students:');
      results.failed.forEach(student => {
        console.log(`   - ${student.name}: ${student.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
