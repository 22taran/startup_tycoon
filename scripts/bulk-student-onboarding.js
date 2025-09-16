#!/usr/bin/env node

/**
 * Bulk Student Onboarding Script
 * 
 * This script helps you onboard 80 students efficiently by:
 * 1. Creating user accounts for students
 * 2. Enrolling them in courses
 * 3. Generating login credentials
 * 4. Creating a CSV report for distribution
 * 
 * Usage:
 * node scripts/bulk-student-onboarding.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Default password for all students (they can change it later)
const DEFAULT_PASSWORD = 'Student123!';
const BATCH_SIZE = 10; // Process students in batches to avoid rate limits

/**
 * Generate student data
 * You can modify this function to load from a CSV file or database
 */
function generateStudentData() {
  const students = [];
  
  // Example: Generate 80 students with sample data
  // Replace this with your actual student data
  for (let i = 1; i <= 80; i++) {
    students.push({
      name: `Student ${i}`,
      email: `student${i}@university.edu`, // Change this to your domain
      studentId: `STU${String(i).padStart(3, '0')}`, // Optional student ID
      courseId: null, // Will be set when you specify the course
    });
  }
  
  return students;
}

/**
 * Load student data from CSV file
 * Expected CSV format: username,firstname,lastname,email,idnumber,course1,role1
 */
function loadStudentsFromCSV(filePath) {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const students = [];
    
    // Detect separator (tab or comma)
    const firstLine = lines[0];
    const isTabSeparated = firstLine.includes('\t');
    const separator = isTabSeparated ? '\t' : ',';
    
    console.log(`📄 Detected ${isTabSeparated ? 'tab' : 'comma'}-separated CSV format`);
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(separator).map(field => field.trim());
      
      if (columns.length >= 4) {
        const [username, firstname, lastname, email, idnumber, course1, role1] = columns;
        
        if (firstname && lastname && email) {
          students.push({
            name: `${firstname} ${lastname}`.trim(),
            email: email,
            studentId: idnumber || null,
            courseId: course1 || null,
            username: username || null,
            role: role1 || 'student'
          });
        }
      }
    }
    
    return students;
  } catch (error) {
    console.error('❌ Error loading CSV file:', error.message);
    return null;
  }
}

/**
 * Create a single user account
 */
async function createUser(student) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', student.email)
      .maybeSingle();

    if (existingUser) {
      return {
        success: false,
        error: 'User already exists',
        user: existingUser
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email: student.email,
        name: student.name,
        password: hashedPassword,
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        user: null
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: DEFAULT_PASSWORD
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      user: null
    };
  }
}

/**
 * Enroll user in a course
 */
async function enrollUserInCourse(userId, courseId) {
  try {
    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingEnrollment) {
      return {
        success: false,
        error: 'Already enrolled'
      };
    }

    // Create enrollment
    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        id: uuidv4(),
        course_id: courseId,
        user_id: userId,
        role: 'student',
        status: 'active',
        enrolled_at: new Date().toISOString()
      });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get available courses
 */
async function getCourses() {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, name, code')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return courses || [];
  } catch (error) {
    console.error('❌ Error fetching courses:', error.message);
    return [];
  }
}

/**
 * Process students in batches
 */
async function processBatch(students, courseId) {
  const results = {
    successful: [],
    failed: [],
    alreadyExists: []
  };

  for (const student of students) {
    console.log(`📝 Processing: ${student.name} (${student.email})`);
    
    // Create user
    const userResult = await createUser(student);
    
    if (userResult.success) {
      // Enroll in course if courseId is provided
      if (courseId) {
        const enrollmentResult = await enrollUserInCourse(userResult.user.id, courseId);
        if (!enrollmentResult.success && enrollmentResult.error !== 'Already enrolled') {
          console.log(`⚠️  User created but enrollment failed: ${enrollmentResult.error}`);
        }
      }
      
      results.successful.push({
        ...userResult.user,
        studentId: student.studentId
      });
      console.log(`✅ Created: ${student.name}`);
    } else if (userResult.error === 'User already exists') {
      results.alreadyExists.push({
        ...userResult.user,
        studentId: student.studentId
      });
      console.log(`ℹ️  Already exists: ${student.name}`);
    } else {
      results.failed.push({
        name: student.name,
        email: student.email,
        error: userResult.error
      });
      console.log(`❌ Failed: ${student.name} - ${userResult.error}`);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Generate CSV report
 */
function generateCSVReport(results, courseId) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `student-onboarding-report-${timestamp}.csv`;
  const filepath = path.join(process.cwd(), filename);
  
  let csvContent = 'Name,Email,Password,Student ID,Username,Status,Error\n';
  
  // Successful creations
  results.successful.forEach(student => {
    csvContent += `"${student.name}","${student.email}","${student.password}","${student.studentId || ''}","${student.username || ''}","Created",""\n`;
  });
  
  // Already existing
  results.alreadyExists.forEach(student => {
    csvContent += `"${student.name}","${student.email}","[EXISTING]","${student.studentId || ''}","${student.username || ''}","Already Exists",""\n`;
  });
  
  // Failed
  results.failed.forEach(student => {
    csvContent += `"${student.name}","${student.email}","","${student.studentId || ''}","${student.username || ''}","Failed","${student.error}"\n`;
  });
  
  fs.writeFileSync(filepath, csvContent);
  return filepath;
}

/**
 * Main onboarding function
 */
async function main() {
  console.log('🚀 Starting Bulk Student Onboarding Script\n');
  
  // Get available courses
  console.log('📚 Fetching available courses...');
  const courses = await getCourses();
  
  if (courses.length === 0) {
    console.log('❌ No courses found. Please create a course first.');
    return;
  }
  
  console.log('Available courses:');
  courses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.name} (${course.code}) - ID: ${course.id}`);
  });
  
  // For this script, we'll use the first course
  // You can modify this to prompt for course selection
  const selectedCourse = courses[0];
  console.log(`\n🎯 Using course: ${selectedCourse.name} (${selectedCourse.id})\n`);
  
  // Load student data
  console.log('👥 Loading student data...');
  let students;
  
  // Check if CSV file exists
  const csvPath = path.join(process.cwd(), 'students.csv');
  if (fs.existsSync(csvPath)) {
    console.log('📄 Found students.csv, loading from file...');
    students = loadStudentsFromCSV(csvPath);
    if (!students) {
      console.log('❌ Failed to load CSV, using generated data instead');
      students = generateStudentData();
    }
  } else {
    console.log('📝 No CSV file found, using generated sample data...');
    console.log('💡 To use your own data, create a students.csv file with columns: name,email,studentId,courseId');
    students = generateStudentData();
  }
  
  console.log(`📊 Found ${students.length} students to process\n`);
  
  // Process students in batches
  const allResults = {
    successful: [],
    failed: [],
    alreadyExists: []
  };
  
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)} (${batch.length} students)`);
    
    const batchResults = await processBatch(batch, selectedCourse.id);
    
    allResults.successful.push(...batchResults.successful);
    allResults.failed.push(...batchResults.failed);
    allResults.alreadyExists.push(...batchResults.alreadyExists);
    
    // Delay between batches
    if (i + BATCH_SIZE < students.length) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate report
  console.log('\n📊 Generating report...');
  const reportPath = generateCSVReport(allResults, selectedCourse.id);
  
  // Summary
  console.log('\n🎉 Onboarding Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successfully created: ${allResults.successful.length} students`);
  console.log(`ℹ️  Already existed: ${allResults.alreadyExists.length} students`);
  console.log(`❌ Failed: ${allResults.failed.length} students`);
  console.log(`📄 Report saved to: ${reportPath}`);
  
  if (allResults.failed.length > 0) {
    console.log('\n❌ Failed students:');
    allResults.failed.forEach(student => {
      console.log(`   - ${student.name} (${student.email}): ${student.error}`);
    });
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Share the CSV report with students');
  console.log('2. Students can login with their email and the default password');
  console.log('3. Students should change their password on first login');
  console.log('4. Check the admin dashboard to verify enrollments');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  createUser,
  enrollUserInCourse,
  generateStudentData,
  loadStudentsFromCSV
};
