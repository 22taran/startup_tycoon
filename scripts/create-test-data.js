#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test data
const testUsers = [
  { email: 'admin@startup.com', name: 'Admin User', role: 'admin' },
  { email: 'student1@startup.com', name: 'Alice Johnson', role: 'student' },
  { email: 'student2@startup.com', name: 'Bob Smith', role: 'student' },
  { email: 'student3@startup.com', name: 'Carol Davis', role: 'student' },
  { email: 'student4@startup.com', name: 'David Wilson', role: 'student' },
  { email: 'student5@startup.com', name: 'Eva Brown', role: 'student' },
  { email: 'student6@startup.com', name: 'Frank Miller', role: 'student' },
  { email: 'student7@startup.com', name: 'Grace Lee', role: 'student' },
  { email: 'student8@startup.com', name: 'Henry Taylor', role: 'student' },
  { email: 'student9@startup.com', name: 'Ivy Chen', role: 'student' },
  { email: 'student10@startup.com', name: 'Jack Anderson', role: 'student' }
]

const testTeams = [
  { name: 'Team Alpha', description: 'Innovative solutions for modern problems', members: ['student1@startup.com', 'student2@startup.com'] },
  { name: 'Team Beta', description: 'Data-driven approach to business challenges', members: ['student3@startup.com', 'student4@startup.com'] },
  { name: 'Team Gamma', description: 'Creative design and user experience focus', members: ['student5@startup.com', 'student6@startup.com'] },
  { name: 'Team Delta', description: 'Technical excellence and performance optimization', members: ['student7@startup.com', 'student8@startup.com'] },
  { name: 'Team Epsilon', description: 'Sustainability and environmental solutions', members: ['student9@startup.com', 'student10@startup.com'] }
]

const testAssignments = [
  {
    title: 'Assignment 1: Market Research & Analysis',
    description: 'Conduct comprehensive market research for a new product idea. Analyze target audience, competitors, and market opportunities.',
    startDate: new Date('2024-01-15T09:00:00Z'),
    dueDate: new Date('2024-01-22T23:59:59Z'),
    documentUrl: null,
    isActive: true
  },
  {
    title: 'Assignment 2: Product Design & Prototyping',
    description: 'Design a minimum viable product (MVP) based on your market research. Create wireframes, user flows, and a basic prototype.',
    startDate: new Date('2024-01-29T09:00:00Z'),
    dueDate: new Date('2024-02-05T23:59:59Z'),
    documentUrl: null,
    isActive: true
  },
  {
    title: 'Assignment 3: Business Model & Strategy',
    description: 'Develop a comprehensive business model including revenue streams, cost structure, and go-to-market strategy.',
    startDate: new Date('2024-02-12T09:00:00Z'),
    dueDate: new Date('2024-02-19T23:59:59Z'),
    documentUrl: null,
    isActive: true
  }
]

const testSubmissions = [
  {
    assignmentId: 1, // Will be replaced with actual ID
    teamId: 1, // Will be replaced with actual ID
    primaryLink: 'https://docs.google.com/presentation/d/1abc123',
    backupLink: 'https://drive.google.com/file/d/1xyz789',
    status: 'submitted',
    submittedAt: new Date('2024-01-21T15:30:00Z')
  },
  {
    assignmentId: 1,
    teamId: 2,
    primaryLink: 'https://www.figma.com/file/2def456',
    backupLink: 'https://miro.com/app/board/2ghi012',
    status: 'submitted',
    submittedAt: new Date('2024-01-21T18:45:00Z')
  },
  {
    assignmentId: 1,
    teamId: 3,
    primaryLink: 'https://docs.google.com/document/d/3jkl345',
    backupLink: 'https://notion.so/3mno678',
    status: 'submitted',
    submittedAt: new Date('2024-01-22T10:15:00Z')
  },
  {
    assignmentId: 1,
    teamId: 4,
    primaryLink: 'https://www.canva.com/design/4pqr901',
    backupLink: 'https://prezi.com/p/4stu234',
    status: 'submitted',
    submittedAt: new Date('2024-01-22T14:20:00Z')
  },
  {
    assignmentId: 1,
    teamId: 5,
    primaryLink: 'https://docs.google.com/spreadsheets/d/5vwx567',
    backupLink: 'https://airtable.com/shr/5yza890',
    status: 'submitted',
    submittedAt: new Date('2024-01-22T16:30:00Z')
  }
]

async function createTestData() {
  console.log('🚀 Creating test data for Startup Tycoon...')
  
  try {
    // 1. Create users
    console.log('👥 Creating users...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'email' })
      .select()
    
    if (usersError) throw usersError
    console.log(`✅ Created ${users.length} users`)
    
    // 2. Create teams
    console.log('🏢 Creating teams...')
    const teamsWithCreator = testTeams.map(team => ({
      ...team,
      created_by: users.find(u => u.role === 'admin')?.id
    }))
    
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .upsert(teamsWithCreator, { onConflict: 'name' })
      .select()
    
    if (teamsError) throw teamsError
    console.log(`✅ Created ${teams.length} teams`)
    
    // 3. Create assignments
    console.log('📝 Creating assignments...')
    const assignmentsWithCreator = testAssignments.map(assignment => ({
      ...assignment,
      created_by: users.find(u => u.role === 'admin')?.id
    }))
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .upsert(assignmentsWithCreator, { onConflict: 'title' })
      .select()
    
    if (assignmentsError) throw assignmentsError
    console.log(`✅ Created ${assignments.length} assignments`)
    
    // 4. Create submissions
    console.log('📤 Creating submissions...')
    const submissionsWithIds = testSubmissions.map(submission => ({
      ...submission,
      assignment_id: assignments[0].id, // Use first assignment
      team_id: teams[submission.teamId - 1].id // Map team index to actual team ID
    }))
    
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .upsert(submissionsWithIds, { onConflict: 'assignment_id,team_id' })
      .select()
    
    if (submissionsError) throw submissionsError
    console.log(`✅ Created ${submissions.length} submissions`)
    
    // 5. Create evaluation assignments (distribute assignments to students)
    console.log('🎯 Creating evaluation assignments...')
    const studentUsers = users.filter(u => u.role === 'student')
    const evaluationAssignments = []
    
    // Each student evaluates 5 different submissions
    for (const student of studentUsers) {
      // Shuffle submissions and take first 5
      const shuffledSubmissions = [...submissions].sort(() => Math.random() - 0.5)
      const assignedSubmissions = shuffledSubmissions.slice(0, 5)
      
      for (const submission of assignedSubmissions) {
        evaluationAssignments.push({
          assignment_id: assignments[0].id,
          evaluator_id: student.id,
          submission_id: submission.id,
          team_id: submission.team_id,
          is_complete: Math.random() > 0.7 // 30% chance of being completed
        })
      }
    }
    
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('evaluations')
      .upsert(evaluationAssignments, { onConflict: 'assignment_id,evaluator_id,submission_id' })
      .select()
    
    if (evaluationsError) throw evaluationsError
    console.log(`✅ Created ${evaluations.length} evaluation assignments`)
    
    // 6. Create some sample investments
    console.log('💰 Creating sample investments...')
    const sampleInvestments = []
    const completedEvaluations = evaluations.filter(e => e.is_complete)
    
    for (const evaluation of completedEvaluations.slice(0, 10)) { // Create 10 sample investments
      const submission = submissions.find(s => s.id === evaluation.submission_id)
      if (submission) {
        sampleInvestments.push({
          submission_id: submission.id,
          assignment_id: evaluation.assignment_id,
          team_id: evaluation.team_id,
          investor_id: evaluation.evaluator_id,
          amount: Math.floor(Math.random() * 41) + 10, // 10-50 tokens
          is_incomplete: Math.random() > 0.9, // 10% chance of being incomplete
          comments: Math.random() > 0.5 ? [
            'Great work! Very innovative approach.',
            'Good analysis, but could use more data.',
            'Excellent presentation and clear structure.',
            'Interesting concept, needs more technical details.',
            'Well-researched and comprehensive.',
            'Good start, but needs more depth.',
            'Creative solution to the problem.',
            'Solid foundation, room for improvement.'
          ][Math.floor(Math.random() * 8)] : null
        })
      }
    }
    
    if (sampleInvestments.length > 0) {
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .upsert(sampleInvestments, { onConflict: 'assignment_id,team_id,investor_id' })
        .select()
      
      if (investmentsError) throw investmentsError
      console.log(`✅ Created ${investments.length} sample investments`)
    }
    
    console.log('\n🎉 Test data created successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${users.length} users (1 admin, ${users.length - 1} students)`)
    console.log(`- ${teams.length} teams`)
    console.log(`- ${assignments.length} assignments`)
    console.log(`- ${submissions.length} submissions`)
    console.log(`- ${evaluations.length} evaluation assignments`)
    console.log(`- ${sampleInvestments.length} sample investments`)
    
    console.log('\n🔑 Test Login Credentials:')
    console.log('Admin: admin@startup.com')
    console.log('Students: student1@startup.com, student2@startup.com, etc.')
    console.log('Password: (use your existing password)')
    
  } catch (error) {
    console.error('❌ Error creating test data:', error)
    process.exit(1)
  }
}

// Run the script
createTestData()
