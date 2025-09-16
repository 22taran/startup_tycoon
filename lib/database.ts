import { createClient } from '@supabase/supabase-js'
import { 
  User, Team, Assignment, Submission, Investment, Grade, Evaluation,
  UserRow, TeamRow, AssignmentRow, SubmissionRow, InvestmentRow, GradeRow, EvaluationRow
} from '@/types'

// Helper function to get Supabase client with service role key
export const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Helper function to get simple Supabase client (no cookies)
export const getSimpleSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Users
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getUserByEmail = async (email: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const getUserById = async (id: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const getAllUsers = async () => {
  // Use service role key like the signup process
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    throw error
  }
  
  // Map database fields to TypeScript interface
  const mappedUsers = (data || []).map((user: UserRow): User => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    teamId: user.team_id,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at)
  }))
  
  return mappedUsers
}

export const updateUserRole = async (id: string, role: 'admin' | 'student') => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
  
  if (error) throw error
  return true
}

export const deleteUser = async (id: string) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Teams
export const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
  const supabase = getSupabaseClient()
  
  // Validate course enrollment if courseId is provided
  if (teamData.courseId && teamData.members && teamData.members.length > 0) {
    // Check if all students are enrolled in the course
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('user_id, users:user_id(email)')
      .eq('course_id', teamData.courseId)
      .in('user_id', teamData.members)
      .eq('status', 'active')
    
    if (enrollmentError) throw enrollmentError
    
    const enrolledIds = enrollments?.map(e => e.user_id) || []
    const notEnrolled = teamData.members.filter(id => !enrolledIds.includes(id))
    
    if (notEnrolled.length > 0) {
      // Get email addresses for better error message
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', notEnrolled)
      
      if (usersError) throw usersError
      
      const notEnrolledEmails = users?.map(user => user.email) || notEnrolled
      throw new Error(`Students ${notEnrolledEmails.join(', ')} are not enrolled in this course`)
    }
  }
  
  // Check if any student is already in a team for this course
  if (teamData.courseId && teamData.members && teamData.members.length > 0) {
    const { data: existingTeams, error: checkError } = await supabase
      .from('teams')
      .select('id, name, members')
      .eq('course_id', teamData.courseId)
      .not('members', 'is', null)
    
    if (checkError) throw checkError
    
    // Check if any of the new team members are already in other teams
    const conflictingStudentIds: string[] = []
    if (existingTeams) {
      for (const team of existingTeams) {
        for (const newMember of teamData.members) {
          if (team.members && team.members.includes(newMember)) {
            // Check if the student is solo in their current team
            const isSolo = team.members.length === 1
            if (!isSolo) {
              conflictingStudentIds.push(newMember)
            }
          }
        }
      }
    }
    
    if (conflictingStudentIds.length > 0) {
      // Convert user IDs to email addresses for better error message
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', conflictingStudentIds)
      
      if (usersError) throw usersError
      
      const conflictingEmails = users?.map(user => user.email) || conflictingStudentIds
      throw new Error(`Students ${conflictingEmails.join(', ')} are already in teams for this course`)
    }
  }
  
  // Map camelCase to snake_case for database
  const dbTeamData = {
    name: teamData.name,
    description: teamData.description,
    members: teamData.members,
    course_id: teamData.courseId // Map courseId to course_id
  }
  
  const { data, error } = await supabase
    .from('teams')
    .insert([dbTeamData])
    .select()
    .single()
  
  if (error) {
    throw error
  }
  return data
}

export const getTeams = async () => {
  console.log('🔄 Querying teams from Supabase...')
  const supabase = getSimpleSupabaseClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Supabase error:', error)
    throw error
  }
  
  // Map database fields to TypeScript interface
  const mappedTeams = (data || []).map((team: any) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    members: team.members,
    courseId: team.course_id, // Map course_id to courseId
    createdAt: new Date(team.created_at),
    updatedAt: new Date(team.updated_at)
  }))
  
  return mappedTeams
}

export const getTeamById = async (id: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    members: data.members,
    courseId: data.course_id, // Map course_id to courseId
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const updateTeam = async (id: string, teamData: Partial<Team>) => {
  const supabase = getSupabaseClient()
  
  // Check if any student is already in a team for this course (when updating members)
  if (teamData.members && teamData.members.length > 0) {
    // Get current team's course_id
    const { data: currentTeam, error: currentTeamError } = await supabase
      .from('teams')
      .select('course_id')
      .eq('id', id)
      .single()
    
    if (currentTeamError) throw currentTeamError
    
    const courseId = teamData.courseId || currentTeam.course_id
    
    if (courseId) {
      // Validate course enrollment for new members
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('user_id, users:user_id(email)')
        .eq('course_id', courseId)
        .in('user_id', teamData.members)
        .eq('status', 'active')
      
      if (enrollmentError) throw enrollmentError
      
      const enrolledIds = enrollments?.map(e => e.user_id) || []
      const notEnrolled = teamData.members.filter(id => !enrolledIds.includes(id))
      
      if (notEnrolled.length > 0) {
        // Get email addresses for better error message
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', notEnrolled)
        
        if (usersError) throw usersError
        
        const notEnrolledEmails = users?.map(user => user.email) || notEnrolled
        throw new Error(`Students ${notEnrolledEmails.join(', ')} are not enrolled in this course`)
      }
      const { data: existingTeams, error: checkError } = await supabase
        .from('teams')
        .select('id, name, members')
        .eq('course_id', courseId)
        .neq('id', id) // Exclude current team
        .not('members', 'is', null)
      
      if (checkError) throw checkError
      
      // Check if any of the new team members are already in other teams
      const conflictingStudentIds: string[] = []
      if (existingTeams) {
        for (const team of existingTeams) {
          for (const newMember of teamData.members) {
            if (team.members && team.members.includes(newMember)) {
              // Check if the student is solo in their current team
              const isSolo = team.members.length === 1
              if (!isSolo) {
                conflictingStudentIds.push(newMember)
              }
            }
          }
        }
      }
      
      if (conflictingStudentIds.length > 0) {
        // Convert user IDs to email addresses for better error message
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', conflictingStudentIds)
        
        if (usersError) throw usersError
        
        const conflictingEmails = users?.map(user => user.email) || conflictingStudentIds
        throw new Error(`Students ${conflictingEmails.join(', ')} are already in teams for this course`)
      }
    }
  }
  
  // Map camelCase to snake_case for database
  const dbTeamData: any = {}
  if (teamData.name !== undefined) dbTeamData.name = teamData.name
  if (teamData.description !== undefined) dbTeamData.description = teamData.description
  if (teamData.members !== undefined) dbTeamData.members = teamData.members
  if (teamData.courseId !== undefined) dbTeamData.course_id = teamData.courseId
  
  const { data, error } = await supabase
    .from('teams')
    .update(dbTeamData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Map database fields back to TypeScript interface
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    members: data.members,
    courseId: data.course_id, // Map course_id to courseId
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const deleteTeam = async (id: string) => {
  const supabase = getSupabaseClient()
  
  try {
    // First, delete all related records in the correct order
    // 1. Delete evaluations where team is either evaluated OR evaluator
    await supabase
      .from('evaluations')
      .delete()
      .or(`team_id.eq.${id},evaluator_team_id.eq.${id}`)
    
    // 2. Delete grades (references teams, submissions, assignments)
    await supabase
      .from('grades')
      .delete()
      .eq('team_id', id)
    
    // 3. Delete investments (references teams, submissions, assignments)
    await supabase
      .from('investments')
      .delete()
      .eq('team_id', id)
    
    // 4. Delete submissions (references teams, assignments)
    await supabase
      .from('submissions')
      .delete()
      .eq('team_id', id)
    
    // 5. Finally, delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting team and related data:', error)
    throw error
  }
}

// Assignments
export const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => {
  // Convert camelCase to snake_case for database
  const dbData = {
    title: assignmentData.title,
    description: assignmentData.description,
    start_date: assignmentData.startDate,
    due_date: assignmentData.dueDate,
    document_url: assignmentData.documentUrl,
    is_active: assignmentData.isActive,
    evaluation_start_date: assignmentData.evaluationStartDate,
    evaluation_due_date: assignmentData.evaluationDueDate,
    is_evaluation_active: assignmentData.isEvaluationActive || false,
    course_id: assignmentData.courseId,
    created_by: (assignmentData as any).created_by
  }
  
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('assignments')
    .insert([dbData])
    .select()
    .single()
  
  if (error) throw error
  
  // Map database response to TypeScript interface
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    startDate: new Date(data.start_date),
    dueDate: new Date(data.due_date),
    documentUrl: data.document_url,
    isActive: data.is_active,
    evaluationStartDate: data.evaluation_start_date ? new Date(data.evaluation_start_date) : undefined,
    evaluationDueDate: data.evaluation_due_date ? new Date(data.evaluation_due_date) : undefined,
    isEvaluationActive: data.is_evaluation_active || false,
    courseId: data.course_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const getAssignments = async (courseId?: string | null) => {
  const supabase = getSimpleSupabaseClient()
  
  let query = supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Filter by courseId if provided
  if (courseId) {
    query = query.eq('course_id', courseId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return (data || []).map((assignment: any) => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    startDate: new Date(assignment.start_date),
    dueDate: new Date(assignment.due_date),
    documentUrl: assignment.document_url,
    isActive: assignment.is_active,
    evaluationStartDate: assignment.evaluation_start_date ? new Date(assignment.evaluation_start_date) : undefined,
    evaluationDueDate: assignment.evaluation_due_date ? new Date(assignment.evaluation_due_date) : undefined,
    isEvaluationActive: assignment.is_evaluation_active || false,
    createdAt: new Date(assignment.created_at),
    updatedAt: new Date(assignment.updated_at),
    courseId: assignment.course_id
  }))
}

export const getAssignmentById = async (id: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    startDate: new Date(data.start_date),
    dueDate: new Date(data.due_date),
    documentUrl: data.document_url,
    isActive: data.is_active,
    evaluationStartDate: data.evaluation_start_date ? new Date(data.evaluation_start_date) : null,
    evaluationDueDate: data.evaluation_due_date ? new Date(data.evaluation_due_date) : null,
    isEvaluationActive: data.is_evaluation_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const updateAssignment = async (id: string, assignmentData: Partial<Assignment>) => {
  // Convert camelCase to snake_case for database
  const dbData: any = {}
  if (assignmentData.title !== undefined) dbData.title = assignmentData.title
  if (assignmentData.description !== undefined) dbData.description = assignmentData.description
  if (assignmentData.startDate !== undefined) dbData.start_date = assignmentData.startDate
  if (assignmentData.dueDate !== undefined) dbData.due_date = assignmentData.dueDate
  if (assignmentData.documentUrl !== undefined) dbData.document_url = assignmentData.documentUrl
  if (assignmentData.isActive !== undefined) dbData.is_active = assignmentData.isActive
  if (assignmentData.evaluationStartDate !== undefined) dbData.evaluation_start_date = assignmentData.evaluationStartDate
  if (assignmentData.evaluationDueDate !== undefined) dbData.evaluation_due_date = assignmentData.evaluationDueDate
  if (assignmentData.isEvaluationActive !== undefined) dbData.is_evaluation_active = assignmentData.isEvaluationActive
  
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('assignments')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Map database response to TypeScript interface
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    startDate: new Date(data.start_date),
    dueDate: new Date(data.due_date),
    documentUrl: data.document_url,
    isActive: data.is_active,
    evaluationStartDate: data.evaluation_start_date ? new Date(data.evaluation_start_date) : undefined,
    evaluationDueDate: data.evaluation_due_date ? new Date(data.evaluation_due_date) : undefined,
    isEvaluationActive: data.is_evaluation_active || false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const deleteAssignment = async (id: string) => {
  const supabase = getSupabaseClient()
  
  try {
    // First, delete all related records in the correct order
    // 1. Delete evaluations (references submissions, teams, assignments)
    await supabase
      .from('evaluations')
      .delete()
      .eq('assignment_id', id)
    
    // 2. Delete grades (references submissions, teams, assignments)
    await supabase
      .from('grades')
      .delete()
      .eq('assignment_id', id)
    
    // 3. Delete investments (references submissions, teams, assignments)
    await supabase
      .from('investments')
      .delete()
      .eq('assignment_id', id)
    
    // 4. Delete submissions (references teams, assignments)
    await supabase
      .from('submissions')
      .delete()
      .eq('assignment_id', id)
    
    // 5. Finally, delete the assignment
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting assignment and related data:', error)
    throw error
  }
}

// Submissions
export const createSubmission = async (submissionData: {
  assignment_id: string
  team_id: string
  primary_link?: string
  backup_link?: string
  status?: 'draft' | 'submitted' | 'evaluated'
}) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('submissions')
    .insert([submissionData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getSubmissions = async () => {
  const supabase = getSimpleSupabaseClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return (data || []).map((submission: any) => ({
    id: submission.id,
    assignmentId: submission.assignment_id,
    teamId: submission.team_id,
    title: `Submission for Assignment ${submission.assignment_id}`, // Generate title since column doesn't exist
    description: '', // Default empty since column doesn't exist
    content: submission.primary_link || '', // Use primary_link as content
    primaryLink: submission.primary_link,
    backupLink: submission.backup_link,
    fileUrl: undefined, // Column doesn't exist
    attachments: [], // Column doesn't exist
    status: submission.status,
    submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
    createdAt: new Date(submission.created_at),
    updatedAt: new Date(submission.updated_at)
  }))
}

export const getSubmissionById = async (id: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return {
    id: data.id,
    assignmentId: data.assignment_id,
    teamId: data.team_id,
    title: `Submission for Assignment ${data.assignment_id}`, // Generate title since column doesn't exist
    description: '', // Default empty since column doesn't exist
    content: data.primary_link || '', // Use primary_link as content
    primaryLink: data.primary_link,
    backupLink: data.backup_link,
    fileUrl: undefined, // Column doesn't exist
    attachments: [], // Column doesn't exist
    status: data.status,
    submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

export const getSubmissionsByTeam = async (teamId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return (data || []).map((submission: any) => ({
    id: submission.id,
    assignmentId: submission.assignment_id,
    teamId: submission.team_id,
    title: `Submission for Assignment ${submission.assignment_id}`, // Generate title since column doesn't exist
    description: '', // Default empty since column doesn't exist
    content: submission.primary_link || '', // Use primary_link as content
    primaryLink: submission.primary_link,
    backupLink: submission.backup_link,
    fileUrl: undefined, // Column doesn't exist
    attachments: [], // Column doesn't exist
    status: submission.status,
    submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : undefined,
    createdAt: new Date(submission.created_at),
    updatedAt: new Date(submission.updated_at)
  }))
}

export const updateSubmission = async (id: string, submissionData: Partial<Submission>) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('submissions')
    .update(submissionData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteSubmission = async (id: string) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Investments
export const createInvestment = async (investmentData: {
  submission_id: string
  investor_id: string
  team_id: string
  assignment_id: string
  amount: number
  is_incomplete?: boolean
  comments?: string
}) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('investments')
    .insert([investmentData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getInvestments = async () => {
  const supabase = getSimpleSupabaseClient()
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const getInvestmentsByUser = async (userId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('investor_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const getInvestmentsBySubmission = async (submissionId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const updateInvestment = async (id: string, investmentData: Partial<Investment>) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('investments')
    .update(investmentData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteInvestment = async (id: string) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Grades
export const createGrade = async (gradeData: {
  assignment_id: string
  team_id: string
  submission_id: string
  average_investment?: number
  grade?: 'high' | 'median' | 'low'
  percentage?: number
  total_investments?: number
}) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .insert([gradeData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getGrades = async () => {
  const supabase = getSimpleSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const getGradesByTeam = async (teamId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const updateGrade = async (id: string, gradeData: Partial<Grade>) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .update(gradeData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteGrade = async (id: string) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Analytics and aggregated queries
export const getInvestmentStats = async (assignmentId?: string) => {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('investments')
    .select('amount, is_incomplete')
  
  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  const stats = {
    totalInvestments: data?.length || 0,
    totalAmount: data?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) || 0,
    averageAmount: 0,
    incompleteCount: data?.filter((inv: any) => inv.is_incomplete).length || 0
  }
  
  if (stats.totalInvestments > 0) {
    stats.averageAmount = stats.totalAmount / stats.totalInvestments
  }
  
  return stats
}

export const getTeamPerformance = async (teamId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Assignment status management
export const updateAssignmentStatus = async () => {
  const now = new Date()
  
  // Activate assignments that have reached their start date
  const supabase = getSimpleSupabaseClient()
  const { error: activateError } = await supabase
    .from('assignments')
    .update({ is_active: true })
    .lte('start_date', now.toISOString())
    .eq('is_active', false)
  
  if (activateError) throw activateError
  
  // Deactivate assignments that have passed their due date
  const { error: deactivateError } = await supabase
    .from('assignments')
    .update({ is_active: false })
    .lt('due_date', now.toISOString())
    .eq('is_active', true)
  
  if (deactivateError) throw deactivateError
  
  return true
}

// Auto-complete assignments when evaluation due date passes
export const autoCompleteAssignments = async () => {
  const now = new Date()
  
  // Find assignments where evaluation due date has passed but they're still in evaluation phase
  const supabase = getSimpleSupabaseClient()
  const { data: expiredAssignments, error: fetchError } = await supabase
    .from('assignments')
    .select('id, title, evaluation_due_date')
    .eq('is_evaluation_active', true)
    .not('evaluation_due_date', 'is', null)
    .lt('evaluation_due_date', now.toISOString())
  
  if (fetchError) throw fetchError
  
  if (expiredAssignments && expiredAssignments.length > 0) {
    console.log(`🔄 Auto-completing ${expiredAssignments.length} assignments that have passed evaluation due date`)
    
    // Mark these assignments as completed (set is_evaluation_active to false)
    const assignmentIds = expiredAssignments.map(a => a.id)
    const { error: completeError } = await supabase
      .from('assignments')
      .update({ is_evaluation_active: false })
      .in('id', assignmentIds)
    
    if (completeError) throw completeError
    
    console.log(`✅ Auto-completed assignments: ${expiredAssignments.map(a => a.title).join(', ')}`)
  }
  
  return expiredAssignments || []
}

// Get active assignments (those that are currently active)
export const getActiveAssignments = async () => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Map database fields to TypeScript interface
  return (data || []).map((assignment: any) => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    startDate: new Date(assignment.start_date),
    dueDate: new Date(assignment.due_date),
    documentUrl: assignment.document_url,
    isActive: assignment.is_active,
    evaluationStartDate: assignment.evaluation_start_date ? new Date(assignment.evaluation_start_date) : undefined,
    evaluationDueDate: assignment.evaluation_due_date ? new Date(assignment.evaluation_due_date) : undefined,
    isEvaluationActive: assignment.is_evaluation_active || false,
    createdAt: new Date(assignment.created_at),
    updatedAt: new Date(assignment.updated_at)
  }))
}

// Evaluation Assignments - New functions for Startup Tycoon game mechanics
export const createEvaluationAssignment = async (evaluationData: {
  assignment_id: string
  evaluator_id: string
  submission_id: string
  team_id: string
  is_complete?: boolean
}) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('evaluations')
    .insert([evaluationData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getEvaluationAssignments = async () => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      assignments:assignment_id (
        id,
        title,
        description,
        due_date,
        is_active,
        is_evaluation_active
      ),
      submissions:submission_id (
        id,
        primary_link,
        backup_link,
        status,
        submitted_at
      ),
      teams:team_id (
        id,
        name,
        members
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Transform the data to match the expected interface
  return (data || []).map((evaluation: any) => ({
    id: evaluation.id,
    assignmentId: evaluation.assignment_id,
    evaluatorId: evaluation.evaluator_id,
    submissionId: evaluation.submission_id,
    teamId: evaluation.team_id,
    isComplete: evaluation.is_complete,
    assignment: {
      id: evaluation.assignments?.id || evaluation.assignment_id,
      title: evaluation.assignments?.title || 'Unknown Assignment',
      description: evaluation.assignments?.description || '',
      dueDate: evaluation.assignments?.due_date || new Date().toISOString(),
      isActive: evaluation.assignments?.is_active || false,
      isEvaluationActive: evaluation.assignments?.is_evaluation_active || false
    },
    submission: {
      id: evaluation.submissions?.id || evaluation.submission_id,
      primaryLink: evaluation.submissions?.primary_link || '',
      backupLink: evaluation.submissions?.backup_link || '',
      status: evaluation.submissions?.status || 'unknown',
      submittedAt: evaluation.submissions?.submitted_at || null
    },
    team: {
      id: evaluation.teams?.id || evaluation.team_id,
      name: evaluation.teams?.name || 'Unknown Team',
      members: evaluation.teams?.members || []
    },
    evaluator: {
      id: evaluation.evaluator_id,
      name: 'Unknown Evaluator',
      email: ''
    }
  }))
}

export const getEvaluationAssignmentsByEvaluator = async (evaluatorId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      assignments:assignment_id (
        id,
        title,
        description,
        due_date,
        is_active
      ),
      submissions:submission_id (
        id,
        primary_link,
        backup_link,
        status,
        submitted_at
      ),
      teams:team_id (
        id,
        name,
        members
      )
    `)
    .eq('evaluator_id', evaluatorId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  
  // Transform the data to match the expected interface
  const transformedEvaluations = (data || []).map((evaluation: any) => ({
    id: evaluation.id,
    assignmentId: evaluation.assignment_id,
    submissionId: evaluation.submission_id,
    teamId: evaluation.team_id,
    isComplete: evaluation.is_complete,
    assignment: {
      id: evaluation.assignments?.id || evaluation.assignment_id,
      title: evaluation.assignments?.title || 'Unknown Assignment',
      description: evaluation.assignments?.description || '',
      dueDate: evaluation.assignments?.due_date || new Date().toISOString(),
      isActive: evaluation.assignments?.is_active || false
    },
    submission: {
      id: evaluation.submissions?.id || evaluation.submission_id,
      primaryLink: evaluation.submissions?.primary_link || '',
      backupLink: evaluation.submissions?.backup_link || '',
      status: evaluation.submissions?.status || 'unknown',
      submittedAt: evaluation.submissions?.submitted_at || null
    },
    team: {
      id: evaluation.teams?.id || evaluation.team_id,
      name: evaluation.teams?.name || 'Unknown Team',
      members: evaluation.teams?.members || []
    }
  }))
  
  
  return transformedEvaluations
}

export const getEvaluationAssignmentsByEvaluatorTeam = async (evaluatorTeamId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      assignments:assignment_id (
        id,
        title,
        description,
        due_date,
        is_active
      ),
      submissions:submission_id (
        id,
        primary_link,
        backup_link,
        status,
        submitted_at
      ),
      teams:team_id (
        id,
        name,
        members
      )
    `)
    .eq('evaluator_team_id', evaluatorTeamId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  
  // Transform the data to match the expected interface
  const transformedEvaluations = (data || []).map((evaluation: any) => ({
    id: evaluation.id,
    assignmentId: evaluation.assignment_id,
    evaluatorId: evaluation.evaluator_id,
    evaluatorTeamId: evaluation.evaluator_team_id,
    submissionId: evaluation.submission_id,
    teamId: evaluation.team_id,
    isComplete: evaluation.is_complete,
    assignment: {
      id: evaluation.assignments?.id || evaluation.assignment_id,
      title: evaluation.assignments?.title || 'Unknown Assignment',
      description: evaluation.assignments?.description || '',
      dueDate: evaluation.assignments?.due_date || new Date().toISOString(),
      isActive: evaluation.assignments?.is_active || false
    },
    submission: {
      id: evaluation.submissions?.id || evaluation.submission_id,
      primaryLink: evaluation.submissions?.primary_link || '',
      backupLink: evaluation.submissions?.backup_link || '',
      status: evaluation.submissions?.status || 'unknown',
      submittedAt: evaluation.submissions?.submitted_at || null
    },
    team: {
      id: evaluation.teams?.id || evaluation.team_id,
      name: evaluation.teams?.name || 'Unknown Team',
      members: evaluation.teams?.members || []
    },
    evaluator: { // Fallback for evaluator data
      id: evaluation.evaluator_id || evaluation.evaluator_team_id,
      name: 'Team Evaluation',
      email: ''
    }
  }))
  
  
  return transformedEvaluations
}

export const getEvaluationAssignmentsByAssignment = async (assignmentId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const updateEvaluationAssignment = async (id: string, evaluationData: Partial<Evaluation>) => {
  const supabase = getSupabaseClient()
  
  // Map camelCase to snake_case for database
  const dbData: any = {}
  if (evaluationData.assignmentId !== undefined) dbData.assignment_id = evaluationData.assignmentId
  if (evaluationData.evaluatorId !== undefined) dbData.evaluator_id = evaluationData.evaluatorId
  if (evaluationData.submissionId !== undefined) dbData.submission_id = evaluationData.submissionId
  if (evaluationData.teamId !== undefined) dbData.team_id = evaluationData.teamId
  if (evaluationData.isComplete !== undefined) dbData.is_complete = evaluationData.isComplete
  
  const { data, error } = await supabase
    .from('evaluations')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteEvaluationAssignment = async (id: string) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// Assignment Distribution Algorithm
export const distributeAssignments = async (assignmentId: string, evaluationsPerStudent: number = 5) => {
  console.log('🎯 Starting assignment distribution for assignment:', assignmentId)
  
  // Use service role key for database operations
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Get all students (non-admin users)
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('role', 'student')
  
  if (studentsError) throw studentsError
  
  // Get all teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, members, description')
  
  if (teamsError) throw teamsError
  
  // Get all submissions for this assignment
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('id, team_id')
    .eq('assignment_id', assignmentId)
    .eq('status', 'submitted')
  
  if (submissionsError) throw submissionsError
  
  
  // Helper function to find which team a student belongs to
  const findStudentTeam = (studentId: string) => {
    return teams?.find(team => team.members.includes(studentId))
  }
  
  if (!students || students.length === 0) {
    throw new Error('No students found for assignment distribution')
  }
  
  if (!submissions || submissions.length === 0) {
    throw new Error('No submissions found for assignment distribution')
  }
  
  // Check if we have enough submissions for proper distribution
  if (submissions.length < 2) {
    throw new Error('Need at least 2 team submissions for evaluation distribution')
  }
  
  // Check if we have enough teams for the requested evaluation count
  const uniqueTeams = new Set(submissions.map(s => s.team_id))
  if (uniqueTeams.size < 2) {
    throw new Error('Need at least 2 different teams for evaluation distribution')
  }
  
  // Warn if evaluation count is higher than available teams
  if (evaluationsPerStudent > uniqueTeams.size - 1) {
    console.log(`⚠️ Warning: Requested ${evaluationsPerStudent} evaluations per student, but only ${uniqueTeams.size - 1} other teams available`)
  }
  
  // Clear existing evaluation assignments for this assignment
  const { error: clearError } = await supabase
    .from('evaluations')
    .delete()
    .eq('assignment_id', assignmentId)
  
  if (clearError) throw clearError
  
  // Create evaluation assignments (each team evaluates specified number of random submissions from other teams)
  const evaluationAssignments: any[] = []
  let processedTeams = 0
  let skippedTeams = 0
  
  // Get teams that have submissions (teams that submitted work)
  const teamsWithSubmissions = new Set(submissions.map(s => s.team_id))
  
  // Get teams that have students (teams that can evaluate)
  const teamsWithStudents = teams?.filter(team => 
    team.members && team.members.length > 0
  ) || []
  
  
  for (const team of teamsWithStudents) {
    // Filter out submissions from this team's own submissions
    const otherTeamSubmissions = submissions.filter(submission => 
      submission.team_id !== team.id
    )
    
    console.log(`🔍 Team ${team.name} (${team.id}):`)
    console.log(`   - Team members: ${team.members?.join(', ') || 'none'}`)
    console.log(`   - Total submissions: ${submissions.length}`)
    console.log(`   - Other team submissions: ${otherTeamSubmissions.length}`)
    console.log(`   - Other team IDs: ${otherTeamSubmissions.map(s => s.team_id).join(', ')}`)
    
    if (otherTeamSubmissions.length === 0) {
      console.log(`⚠️ Skipping team ${team.name} - no other team submissions`)
      skippedTeams++
      continue
    }
    
    processedTeams++
    
    // Shuffle other team submissions and take specified number (or all if less)
    const shuffledSubmissions = [...otherTeamSubmissions].sort(() => Math.random() - 0.5)
    const assignedSubmissions = shuffledSubmissions.slice(0, Math.min(evaluationsPerStudent, shuffledSubmissions.length))
    
    // CRITICAL: Double-check for self-evaluations before creating assignments
    for (const submission of assignedSubmissions) {
      // Verify this is not a self-evaluation by checking if the submission belongs to the same team
      const isSelfEvaluation = submission.team_id === team.id
      
      if (isSelfEvaluation) {
        console.error(`❌ CRITICAL BUG: Team ${team.name} (${team.id}) is being assigned to evaluate their own team!`)
        console.error(`   - Evaluator team ID: ${team.id}`)
        console.error(`   - Evaluated team ID: ${submission.team_id}`)
        console.error(`   - Team members: ${team.members}`)
        continue // Skip this assignment
      }
      
      evaluationAssignments.push({
        assignment_id: assignmentId,
        evaluator_id: null, // No individual evaluator for team-based evaluations
        evaluator_team_id: team.id, // Team that will evaluate
        submission_id: submission.id,
        team_id: submission.team_id,
        is_complete: false,
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      })
    }
  }
  
  // Final verification: Check for any self-evaluations before inserting
  console.log(`🔍 Final verification: Checking ${evaluationAssignments.length} evaluation assignments for self-evaluations...`)
  
  const selfEvaluations = evaluationAssignments.filter(evaluation => {
    return evaluation.evaluator_team_id === evaluation.team_id
  })
  
  if (selfEvaluations.length > 0) {
    console.error(`❌ CRITICAL: Found ${selfEvaluations.length} self-evaluations that would be created!`)
    selfEvaluations.forEach(evaluation => {
      console.error(`   - Team ${evaluation.evaluator_team_id} evaluating team ${evaluation.team_id}`)
    })
    throw new Error(`Prevented creation of ${selfEvaluations.length} self-evaluations. This indicates a bug in the filtering logic.`)
  }
  
  console.log(`✅ Verification passed: No self-evaluations found`)
  
  // Insert all evaluation assignments
  const { data: createdEvaluations, error: insertError } = await supabase
    .from('evaluations')
    .insert(evaluationAssignments)
    .select()
  
  if (insertError) throw insertError
  
  console.log(`✅ Created ${createdEvaluations?.length || 0} evaluation assignments`)
  
  // Log distribution summary
  const distributionSummary = teamsWithStudents.map(team => {
    const teamEvaluations = evaluationAssignments.filter(evaluation => evaluation.evaluator_team_id === team.id)
    return {
      teamId: team.id,
      teamName: team.name,
      teamMembers: team.members?.length || 0,
      assignedEvaluations: teamEvaluations.length,
      evaluatingTeams: Array.from(new Set(teamEvaluations.map(evaluation => evaluation.team_id)))
    }
  })
  

  // Update assignment status to evaluation phase
  const { error: updateError } = await supabase
    .from('assignments')
    .update({ is_evaluation_active: true })
    .eq('id', assignmentId)
  
  if (updateError) {
    console.error('⚠️ Failed to update assignment status:', updateError)
  } else {
    console.log('✅ Assignment status updated to evaluation phase')
  }
  
  return createdEvaluations || []
}

// Check if assignment has been distributed
export const isAssignmentDistributed = async (assignmentId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('assignment_evaluations')
    .select('id')
    .eq('assignment_id', assignmentId)
    .limit(1)
  
  if (error) throw error
  return (data && data.length > 0)
}

// Grading Calculation System - Core Startup Tycoon game mechanics
export const calculateGradesForAssignment = async (assignmentId: string) => {
  
  // Get all submissions for this assignment
  const { data: submissions, error: submissionsError } = await getSupabaseClient()
    .from('submissions')
    .select('id, team_id')
    .eq('assignment_id', assignmentId)
    .eq('status', 'submitted')
  
  if (submissionsError) throw submissionsError
  
  if (!submissions || submissions.length === 0) {
    throw new Error('No submissions found for grading')
  }
  
  
  // Clear existing grades for this assignment
  const { error: clearError, count: deletedCount } = await getSupabaseClient()
    .from('grades')
    .delete({ count: 'exact' })
    .eq('assignment_id', assignmentId)
  
  if (clearError) {
    console.error('❌ Error clearing existing grades:', clearError)
    throw clearError
  }
  
  
  const grades = []
  
  // Get all investments for this assignment from the new assignment_investments table
  const { data: allInvestments, error: investmentsError } = await getSupabaseClient()
    .from('assignment_investments')
    .select(`
      invested_team_id,
      tokens_invested,
      teams!inner(id, name)
    `)
    .eq('assignment_id', assignmentId)
  
  if (investmentsError) throw investmentsError
  
  
  // Group investments by team_id for efficient lookup
  const investmentsByTeam = (allInvestments || []).reduce((acc, inv) => {
    const teamId = inv.invested_team_id
    if (!acc[teamId]) {
      acc[teamId] = []
    }
    acc[teamId].push({
      amount: inv.tokens_invested,
      is_incomplete: false // assignment_investments are always complete
    })
    return acc
  }, {} as Record<string, Array<{ amount: number, is_incomplete: boolean }>>)
  
  
  // Calculate grades for each submission
  for (const submission of submissions) {
    const teamId = submission.team_id
    const teamInvestments = investmentsByTeam[teamId] || []
    const investments = teamInvestments.filter(inv => !inv.is_incomplete)
    const incompleteInvestments = teamInvestments.filter(inv => inv.is_incomplete)
    
    if (investments.length === 0) {
      // No investments = Incomplete grade
      grades.push({
        assignment_id: assignmentId,
        team_id: submission.team_id,
        submission_id: submission.id,
        average_investment: 0,
        grade: 'incomplete',
        percentage: 0,
        total_investments: 0,
        status: 'draft'
      })
      continue
    }
    
    if (incompleteInvestments.length > 0) {
      // Marked as incomplete = 0% grade
      grades.push({
        assignment_id: assignmentId,
        team_id: submission.team_id,
        submission_id: submission.id,
        average_investment: 0,
        grade: 'incomplete',
        percentage: 0,
        total_investments: investments.length,
        status: 'draft'
      })
      continue
    }
    
    // Calculate average investment (drop highest and lowest)
    const amounts = investments.map(inv => inv.amount).sort((a, b) => a - b)
    
    if (amounts.length <= 2) {
      // If 2 or fewer investments, use all of them
      const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      grades.push({
        assignment_id: assignmentId,
        team_id: submission.team_id,
        submission_id: submission.id,
        average_investment: average,
        grade: 'low', // Default to low if insufficient data
        percentage: 60,
        total_investments: amounts.length,
        status: 'draft'
      })
      continue
    }
    
    // Drop highest and lowest, calculate average of remaining
    const trimmedAmounts = amounts.slice(1, -1) // Remove first (lowest) and last (highest)
    const average = trimmedAmounts.reduce((sum, amount) => sum + amount, 0) / trimmedAmounts.length
    
    // Determine grade band based on average investment
    let grade: 'high' | 'median' | 'low' = 'low'
    let percentage = 60
    
    if (average >= 40) {
      grade = 'high'
      percentage = 100
    } else if (average >= 25) {
      grade = 'median'
      percentage = 80
    }
    
    grades.push({
      assignment_id: assignmentId,
      team_id: submission.team_id,
      submission_id: submission.id,
      average_investment: average,
      grade,
      percentage,
      total_investments: amounts.length,
      status: 'draft'
    })
  }
  
  // Insert all grades
  const { data: createdGrades, error: insertError } = await getSupabaseClient()
    .from('grades')
    .insert(grades)
    .select()
  
  if (insertError) {
    console.error('Error inserting grades:', insertError)
    throw insertError
  }
  
  
  // Calculate interest for all students who invested in this assignment
  try {
    // Get all unique students who invested in this assignment
    const { data: investments, error: invError } = await getSupabaseClient()
      .from('assignment_investments')
      .select('investor_student_id')
      .eq('assignment_id', assignmentId)
    
    if (!invError && investments) {
      // Get unique student IDs
      const uniqueStudentIds = Array.from(new Set(investments.map(inv => inv.investor_student_id)))
      console.log(`💰 Calculating interest for ${uniqueStudentIds.length} students`)
      
      // Calculate interest for each student using the direct function
      for (const studentId of uniqueStudentIds) {
        try {
          await calculateStudentInterestDirect(studentId, assignmentId)
        } catch (error) {
          console.error(`Error calculating interest for student ${studentId}:`, error)
        }
      }
      
      console.log(`✅ Interest calculation completed for assignment ${assignmentId}`)
    }
  } catch (error) {
    console.error('Error calculating interest:', error)
  }
  
  return createdGrades || []
}

// Direct interest calculation function (avoiding dynamic import issues)
const calculateStudentInterestDirect = async (studentId: string, assignmentId: string) => {
  const supabase = getSupabaseClient()
  
  // Get student investments
  const { data: investments, error: invError } = await supabase
    .from('assignment_investments')
    .select('invested_team_id, tokens_invested')
    .eq('investor_student_id', studentId)
    .eq('assignment_id', assignmentId);
  
  if (invError) throw invError;
  
  let totalInterest = 0;
  
  for (const investment of investments || []) {
    // Get team performance (grades)
    const { data: grade, error: gradeError } = await supabase
      .from('grades')
      .select('grade, percentage')
      .eq('assignment_id', assignmentId)
      .eq('team_id', investment.invested_team_id)
      .single();
    
    if (gradeError) {
      console.warn(`⚠️ No grade found for team ${investment.invested_team_id}:`, gradeError.message);
      continue;
    }
    
    // Calculate interest based on team performance
    let interestRate = 0;
    switch (grade.grade) {
      case 'high':
        interestRate = 0.2; // 20% interest
        break;
      case 'median':
        interestRate = 0.1; // 10% interest
        break;
      case 'low':
        interestRate = 0.05; // 5% interest
        break;
      case 'incomplete':
        interestRate = 0; // No interest
        break;
    }
    
    const interest = investment.tokens_invested * interestRate;
    totalInterest += interest;
    
    // Clear existing interest for this student/assignment/team combination first
    await supabase
      .from('student_interest_tracking')
      .delete()
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .eq('invested_team_id', investment.invested_team_id);
    
    // Store interest earned
    await supabase
      .from('student_interest_tracking')
      .insert({
        student_id: studentId,
        assignment_id: assignmentId,
        invested_team_id: investment.invested_team_id,
        tokens_invested: investment.tokens_invested,
        team_performance_tier: grade.grade,
        interest_earned: interest
      });
  }
  
  return totalInterest;
};

// Get grades for a specific assignment
export const getGradesByAssignment = async (assignmentId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .select(`
      *,
      teams:team_id (
        id,
        name,
        members
      )
    `)
    .eq('assignment_id', assignmentId)
    .order('average_investment', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Get all grades with team information
export const getAllGradesWithTeams = async () => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .select(`
      *,
      teams:team_id (
        id,
        name,
        members
      ),
      assignments:assignment_id (
        id,
        title,
        due_date
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Get grades for a specific course
export const getGradesByCourse = async (courseId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('grades')
    .select(`
      *,
      teams:team_id (
        id,
        name,
        members
      ),
      assignments:assignment_id (
        id,
        title,
        due_date,
        course_id
      )
    `)
    .eq('assignments.course_id', courseId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Get grade statistics for an assignment
export const getGradeStatistics = async (assignmentId: string) => {
  const grades = await getGradesByAssignment(assignmentId)
  
  if (grades.length === 0) {
    return {
      totalTeams: 0,
      highGrades: 0,
      medianGrades: 0,
      lowGrades: 0,
      incompleteGrades: 0,
      averageInvestment: 0,
      totalInvestments: 0
    }
  }
  
  const stats = {
    totalTeams: grades.length,
    highGrades: grades.filter(g => g.grade === 'high').length,
    medianGrades: grades.filter(g => g.grade === 'median').length,
    lowGrades: grades.filter(g => g.grade === 'low').length,
    incompleteGrades: grades.filter(g => g.grade === 'incomplete').length,
    averageInvestment: grades.reduce((sum, g) => sum + (g.average_investment || 0), 0) / grades.length,
    totalInvestments: grades.reduce((sum, g) => sum + (g.total_investments || 0), 0)
  }
  
  return stats
}
