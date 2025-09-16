import { getSupabaseClient, getSimpleSupabaseClient } from './database'
import { AssignmentTeamMembership, AssignmentTeamChangeHistory } from '@/types'

// Validate that students are enrolled in the course
const validateStudentCourseEnrollment = async (studentIds: string[], courseId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('user_id, users:user_id(email)')
    .eq('course_id', courseId)
    .in('user_id', studentIds)
    .eq('status', 'active')
  
  if (enrollmentError) throw enrollmentError
  
  const enrolledIds = enrollments?.map(e => e.user_id) || []
  const notEnrolled = studentIds.filter(id => !enrolledIds.includes(id))
  
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

// Create a team for a specific assignment
export const createAssignmentTeam = async (
  assignmentId: string,
  teamName: string,
  studentIds: string[],
  description?: string
) => {
  const supabase = getSimpleSupabaseClient()
  
  // Validate team size (exactly 2 students)
  if (studentIds.length !== 2) {
    throw new Error('Teams must have exactly 2 students')
  }
  
  // Get assignment details to get course_id
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('course_id')
    .eq('id', assignmentId)
    .single()
  
  if (assignmentError) throw assignmentError
  if (!assignment?.course_id) {
    throw new Error('Assignment not found or not associated with a course')
  }
  
  // Validate that all students are enrolled in the course
  await validateStudentCourseEnrollment(studentIds, assignment.course_id)
  
  // Check if any student is already in a team for this assignment
  const { data: existingMemberships, error: checkError } = await supabase
    .from('assignment_team_memberships')
    .select('student_id, team_id, teams:team_id(name)')
    .eq('assignment_id', assignmentId)
    .in('student_id', studentIds)
  
  if (checkError) throw checkError
  
  if (existingMemberships && existingMemberships.length > 0) {
    const conflictingStudents = existingMemberships.map(m => m.student_id)
    throw new Error(`Students ${conflictingStudents.join(', ')} are already in teams for this assignment`)
  }
  
  // Create the team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: teamName,
      description: description || '',
      members: studentIds,
      max_members: 2,
      current_member_count: 2,
      course_id: assignment.course_id // Set course_id from assignment
    })
    .select()
    .single()
  
  if (teamError) throw teamError
  
  // Create team memberships for this assignment
  const membershipData = studentIds.map(studentId => ({
    assignment_id: assignmentId,
    student_id: studentId,
    team_id: team.id,
    is_locked: false
  }))
  
  const { data: memberships, error: membershipError } = await supabase
    .from('assignment_team_memberships')
    .insert(membershipData)
    .select()
  
  if (membershipError) throw membershipError
  
  console.log(`✅ Created team "${teamName}" for assignment ${assignmentId} with ${studentIds.length} members`)
  
  return {
    team,
    memberships
  }
}

// Get student's current team for an assignment
export const getStudentAssignmentTeam = async (studentId: string, assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const { data, error } = await supabase
    .from('assignment_team_memberships')
    .select(`
      *,
      teams:team_id(id, name, description, members, current_member_count)
    `)
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .eq('is_locked', false)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  
  if (!data) return null
  
  return {
    id: data.id,
    assignmentId: data.assignment_id,
    studentId: data.student_id,
    teamId: data.team_id,
    joinedAt: new Date(data.joined_at),
    isLocked: data.is_locked,
    lockedAt: data.locked_at ? new Date(data.locked_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    team: {
      id: data.teams?.id,
      name: data.teams?.name,
      description: data.teams?.description,
      members: data.teams?.members,
      currentMemberCount: data.teams?.current_member_count
    }
  }
}

// Change student's team for an assignment
export const changeStudentTeam = async (
  assignmentId: string,
  studentId: string,
  newTeamId: string,
  reason?: string
) => {
  const supabase = getSimpleSupabaseClient()
  
  // Check if assignment is still open for team changes
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('due_date, team_locked_at')
    .eq('id', assignmentId)
    .single()
  
  if (assignmentError) throw assignmentError
  
  const now = new Date()
  const dueDate = new Date(assignment.due_date)
  
  if (now >= dueDate) {
    throw new Error('Team changes not allowed after assignment deadline')
  }
  
  if (assignment.team_locked_at) {
    throw new Error('Teams are locked for this assignment')
  }
  
  // Check if student already submitted
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('assignment_id', assignmentId)
    .eq('team_id', (await getStudentAssignmentTeam(studentId, assignmentId))?.teamId)
    .single()
  
  if (submission && submission.status === 'submitted') {
    throw new Error('Team changes not allowed after submission')
  }
  
  // Check if new team has space
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('current_member_count, max_members')
    .eq('id', newTeamId)
    .single()
  
  if (teamError) throw teamError
  
  if (team.current_member_count >= team.max_members) {
    throw new Error('Team is full')
  }
  
  // Get current team for logging
  const currentTeam = await getStudentAssignmentTeam(studentId, assignmentId)
  
  // Deactivate current team membership
  if (currentTeam) {
    await supabase
      .from('assignment_team_memberships')
      .update({ is_locked: false })
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
  }
  
  // Create new team membership
  const { data: newMembership, error: membershipError } = await supabase
    .from('assignment_team_memberships')
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      team_id: newTeamId,
      is_locked: false
    })
    .select()
    .single()
  
  if (membershipError) throw membershipError
  
  // Update team member count
  await supabase
    .from('teams')
    .update({ current_member_count: team.current_member_count + 1 })
    .eq('id', newTeamId)
  
  // Decrease old team member count if exists
  if (currentTeam) {
    await supabase
      .from('teams')
      .update({ current_member_count: team.current_member_count - 1 })
      .eq('id', currentTeam.teamId)
  }
  
  // Log the change
  await supabase
    .from('assignment_team_change_history')
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      from_team_id: currentTeam?.teamId,
      to_team_id: newTeamId,
      change_type: 'student_change'
    })
  
  console.log(`✅ Student ${studentId} changed teams for assignment ${assignmentId}`)
  
  return newMembership
}

// Get available teams for an assignment (teams with space)
export const getAvailableTeamsForAssignment = async (assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      description,
      members,
      current_member_count,
      max_members
    `)
    .lt('current_member_count', 'max_members')
  
  if (error) throw error
  
  return (data || []).map(team => ({
    id: team.id,
    name: team.name,
    description: team.description,
    members: team.members,
    currentMemberCount: team.current_member_count,
    maxMembers: team.max_members,
    availableSpots: team.max_members - team.current_member_count
  }))
}

// Lock teams for an assignment (after deadline or submission)
export const lockTeamsForAssignment = async (assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const now = new Date()
  
  // Lock all team memberships for this assignment
  const { error: lockError } = await supabase
    .from('assignment_team_memberships')
    .update({ 
      is_locked: true, 
      locked_at: now.toISOString() 
    })
    .eq('assignment_id', assignmentId)
    .eq('is_locked', false)
  
  if (lockError) throw lockError
  
  // Update assignment to mark teams as locked
  await supabase
    .from('assignments')
    .update({ team_locked_at: now.toISOString() })
    .eq('id', assignmentId)
  
  console.log(`✅ Locked all teams for assignment ${assignmentId}`)
  
  return true
}

// Get team change history for a student
export const getStudentTeamChangeHistory = async (studentId: string, assignmentId?: string) => {
  const supabase = getSimpleSupabaseClient()
  
  let query = supabase
    .from('assignment_team_change_history')
    .select(`
      *,
      from_teams:teams!from_team_id(id, name),
      to_teams:teams!to_team_id(id, name)
    `)
    .eq('student_id', studentId)
  
  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId)
  }
  
  const { data, error } = await query.order('changed_at', { ascending: false })
  
  if (error) throw error
  
  return (data || []).map(change => ({
    id: change.id,
    assignmentId: change.assignment_id,
    studentId: change.student_id,
    fromTeamId: change.from_team_id,
    toTeamId: change.to_team_id,
    changedAt: new Date(change.changed_at),
    changeType: change.change_type,
    fromTeam: change.from_teams ? {
      id: change.from_teams.id,
      name: change.from_teams.name
    } : null,
    toTeam: change.to_teams ? {
      id: change.to_teams.id,
      name: change.to_teams.name
    } : null
  }))
}

// Get all teams for an assignment
export const getAssignmentTeams = async (assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const { data, error } = await supabase
    .from('assignment_team_memberships')
    .select(`
      *,
      teams:team_id(id, name, description, members, current_member_count, max_members),
      users:users!student_id(id, name, email)
    `)
    .eq('assignment_id', assignmentId)
    .order('joined_at', { ascending: true })
  
  if (error) throw error
  
  // Group by team
  const teamMap = new Map()
  
  for (const membership of data || []) {
    const teamId = membership.team_id
    
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        id: membership.teams?.id,
        name: membership.teams?.name,
        description: membership.teams?.description,
        members: membership.teams?.members,
        currentMemberCount: membership.teams?.current_member_count,
        maxMembers: membership.teams?.max_members,
        isLocked: membership.is_locked,
        lockedAt: membership.locked_at ? new Date(membership.locked_at) : undefined,
        studentMembers: []
      })
    }
    
    teamMap.get(teamId).studentMembers.push({
      id: membership.users?.id,
      name: membership.users?.name,
      email: membership.users?.email,
      joinedAt: new Date(membership.joined_at)
    })
  }
  
  return Array.from(teamMap.values())
}

// Check if student can change teams
export const canStudentChangeTeams = async (studentId: string, assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  // Check assignment deadline
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('due_date, team_locked_at')
    .eq('id', assignmentId)
    .single()
  
  if (assignmentError) throw assignmentError
  
  const now = new Date()
  const dueDate = new Date(assignment.due_date)
  
  if (now >= dueDate) {
    return { canChange: false, reason: 'Assignment deadline has passed' }
  }
  
  if (assignment.team_locked_at) {
    return { canChange: false, reason: 'Teams are locked for this assignment' }
  }
  
  // Check if student has submitted
  const currentTeam = await getStudentAssignmentTeam(studentId, assignmentId)
  if (currentTeam) {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('status')
      .eq('assignment_id', assignmentId)
      .eq('team_id', currentTeam.teamId)
      .single()
    
    if (submission && submission.status === 'submitted') {
      return { canChange: false, reason: 'Cannot change teams after submission' }
    }
  }
  
  return { canChange: true, reason: 'Team changes allowed' }
}
