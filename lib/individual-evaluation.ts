import { getSupabaseClient, getSimpleSupabaseClient } from './database'
import { AssignmentEvaluation, AssignmentInvestment, StudentInterestTracking, AssignmentTeamMembership } from '@/types'

// Individual Evaluation Distribution
export const distributeEvaluationsToStudents = async (
  assignmentId: string,
  evaluationsPerStudent: number = 5,
  evaluationStartDate?: string,
  evaluationDueDate?: string
) => {
  console.log('🎯 Starting individual evaluation distribution for assignment:', assignmentId)
  
  const supabase = getSimpleSupabaseClient()
  
  // Get all students in the course
  const { data: courseData, error: courseError } = await supabase
    .from('assignments')
    .select('course_id')
    .eq('id', assignmentId)
    .single()
  
  if (courseError) throw courseError
  
  const { data: students, error: studentsError } = await supabase
    .from('course_enrollments')
    .select(`
      user_id,
      users:user_id(id, email, name)
    `)
    .eq('course_id', courseData.course_id)
    .eq('role', 'student')
    .eq('status', 'active')
  
  if (studentsError) throw studentsError
  
  // Get all teams with submissions for this assignment
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select(`
      id,
      team_id,
      teams:team_id(id, name, members)
    `)
    .eq('assignment_id', assignmentId)
    .eq('status', 'submitted')
  
  if (submissionsError) throw submissionsError
  
  console.log(`📊 Found ${students?.length || 0} students, ${submissions?.length || 0} submissions`)
  
  if (!students || students.length === 0) {
    throw new Error('No students found for evaluation distribution')
  }
  
  if (!submissions || submissions.length < 5) {
    throw new Error('Need at least 5 team submissions for evaluation distribution')
  }
  
  // Clear existing evaluations for this assignment
  const { error: clearError } = await supabase
    .from('assignment_evaluations')
    .delete()
    .eq('assignment_id', assignmentId)
  
  if (clearError) throw clearError
  
  // Use provided evaluation dates or calculate default due date
  let dueDate: Date
  
  if (evaluationDueDate) {
    dueDate = new Date(evaluationDueDate)
  } else {
    // Fallback: Calculate evaluation due date (3 days after assignment due date)
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('due_date')
      .eq('id', assignmentId)
      .single()
    
    if (assignmentError) throw assignmentError
    
    dueDate = new Date(assignment.due_date)
    dueDate.setDate(dueDate.getDate() + 3) // 3 days after due date
  }
  
  // Distribute evaluations to each student
  const evaluationAssignments: any[] = []
  
  for (const student of students) {
    // Get teams that this student is NOT part of
    const studentTeams = submissions.filter(sub => 
      sub.teams?.members?.includes(student.user_id)
    )
    const otherTeamSubmissions = submissions.filter(sub => 
      !sub.teams?.members?.includes(student.user_id)
    )
    
    if (otherTeamSubmissions.length < evaluationsPerStudent) {
      console.warn(`⚠️ Not enough other teams for student ${student.users?.email}`)
      continue
    }
    
    // Shuffle and select random teams
    const shuffledSubmissions = [...otherTeamSubmissions].sort(() => Math.random() - 0.5)
    const selectedSubmissions = shuffledSubmissions.slice(0, evaluationsPerStudent)
    
    for (const submission of selectedSubmissions) {
      evaluationAssignments.push({
        assignment_id: assignmentId,
        evaluator_student_id: student.user_id,
        evaluated_team_id: submission.team_id,
        submission_id: submission.id,
        evaluation_status: 'assigned',
        due_at: dueDate.toISOString()
      })
    }
    
    console.log(`📝 Assigned ${selectedSubmissions.length} evaluations to student ${student.users?.email}`)
  }
  
  // Insert all evaluation assignments
  const { data: createdEvaluations, error: insertError } = await supabase
    .from('assignment_evaluations')
    .insert(evaluationAssignments)
    .select()
  
  if (insertError) throw insertError
  
  console.log(`✅ Created ${createdEvaluations?.length || 0} individual evaluation assignments`)
  
  // Update assignment status to evaluation phase
  const updateData: any = { is_evaluation_active: true }
  
  if (evaluationStartDate) {
    updateData.evaluation_start_date = evaluationStartDate
  }
  
  if (evaluationDueDate) {
    updateData.evaluation_due_date = evaluationDueDate
  }
  
  const { error: updateError } = await supabase
    .from('assignments')
    .update(updateData)
    .eq('id', assignmentId)
  
  if (updateError) {
    console.error('⚠️ Failed to update assignment status:', updateError)
  } else {
    console.log('✅ Assignment status updated to evaluation phase')
    if (evaluationStartDate) console.log('📅 Evaluation start date set:', evaluationStartDate)
    if (evaluationDueDate) console.log('📅 Evaluation due date set:', evaluationDueDate)
  }
  
  return createdEvaluations || []
}

// Get student's assigned evaluations
export const getStudentEvaluations = async (studentId: string, assignmentId?: string) => {
  const supabase = getSimpleSupabaseClient()
  
  let query = supabase
    .from('assignment_evaluations')
    .select(`
      *,
      assignments:assignment_id(title, due_date),
      evaluated_teams:teams!evaluated_team_id(id, name, members),
      submissions:submission_id(id, primary_link, backup_link, status, submitted_at)
    `)
    .eq('evaluator_student_id', studentId)
  
  if (assignmentId) {
    query = query.eq('assignment_id', assignmentId)
  }
  
  const { data, error } = await query.order('assigned_at', { ascending: false })
  
  if (error) throw error
  
  return (data || []).map((evaluation: any) => ({
    id: evaluation.id,
    assignmentId: evaluation.assignment_id,
    evaluatorStudentId: evaluation.evaluator_student_id,
    evaluatedTeamId: evaluation.evaluated_team_id,
    submissionId: evaluation.submission_id,
    evaluationStatus: evaluation.evaluation_status,
    assignedAt: new Date(evaluation.assigned_at),
    completedAt: evaluation.completed_at ? new Date(evaluation.completed_at) : undefined,
    dueAt: new Date(evaluation.due_at),
    createdAt: new Date(evaluation.created_at),
    updatedAt: new Date(evaluation.updated_at),
    assignment: {
      title: evaluation.assignments?.title,
      dueDate: evaluation.assignments?.due_date
    },
    evaluatedTeam: {
      id: evaluation.evaluated_teams?.id,
      name: evaluation.evaluated_teams?.name,
      members: evaluation.evaluated_teams?.members
    },
    submission: {
      id: evaluation.submissions?.id,
      primaryLink: evaluation.submissions?.primary_link,
      backupLink: evaluation.submissions?.backup_link,
      status: evaluation.submissions?.status,
      submittedAt: evaluation.submissions?.submitted_at
    }
  }))
}

// Process student investment
export const processStudentInvestment = async (
  assignmentId: string,
  studentId: string,
  teamId: string,
  tokens: number
) => {
  const supabase = getSimpleSupabaseClient()
  
  // Validate investment
  if (tokens < 10 || tokens > 50) {
    throw new Error('Investment must be between 10 and 50 tokens')
  }
  
  // Check if student is assigned to evaluate this team
  const { data: evaluation, error: evalError } = await supabase
    .from('assignment_evaluations')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('evaluator_student_id', studentId)
    .eq('evaluated_team_id', teamId)
    .single()
  
  if (evalError || !evaluation) {
    throw new Error('You are not assigned to evaluate this team')
  }
  
  // Check if student has already invested in 3 teams
  const { data: existingInvestments, error: investmentsError } = await supabase
    .from('assignment_investments')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('investor_student_id', studentId)
  
  if (investmentsError) throw investmentsError
  
  if (existingInvestments && existingInvestments.length >= 3) {
    throw new Error('You can only invest in up to 3 teams')
  }
  
  // Check if student has enough tokens
  const totalInvested = existingInvestments?.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0) || 0
  const availableTokens = 100 - totalInvested
  
  if (tokens > availableTokens) {
    throw new Error(`You only have ${availableTokens} tokens remaining`)
  }
  
  // Check if already invested in this team
  const { data: existingInvestment, error: existingError } = await supabase
    .from('assignment_investments')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('investor_student_id', studentId)
    .eq('invested_team_id', teamId)
    .single()
  
  if (existingInvestment) {
    throw new Error('You have already invested in this team')
  }
  
  // Create investment record
  const investmentRank = (existingInvestments?.length || 0) + 1
  
  const { data: investment, error: investmentError } = await supabase
    .from('assignment_investments')
    .insert({
      assignment_id: assignmentId,
      investor_student_id: studentId,
      invested_team_id: teamId,
      tokens_invested: tokens,
      investment_rank: investmentRank
    })
    .select()
    .single()
  
  if (investmentError) throw investmentError
  
  // Update evaluation status to completed
  const { error: updateError } = await supabase
    .from('assignment_evaluations')
    .update({ 
      evaluation_status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('assignment_id', assignmentId)
    .eq('evaluator_student_id', studentId)
    .eq('evaluated_team_id', teamId)
  
  if (updateError) throw updateError
  
  console.log(`✅ Student ${studentId} invested ${tokens} tokens in team ${teamId}`)
  
  return investment
}

// Get student's investments for an assignment
export const getStudentInvestments = async (studentId: string, assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const { data, error } = await supabase
    .from('assignment_investments')
    .select(`
      *,
      invested_teams:teams!invested_team_id(id, name, members)
    `)
    .eq('assignment_id', assignmentId)
    .eq('investor_student_id', studentId)
    .order('investment_rank', { ascending: true })
  
  if (error) throw error
  
  return (data || []).map((investment: any) => ({
    id: investment.id,
    assignmentId: investment.assignment_id,
    investorStudentId: investment.investor_student_id,
    investedTeamId: investment.invested_team_id,
    tokensInvested: investment.tokens_invested,
    investmentRank: investment.investment_rank,
    createdAt: new Date(investment.created_at),
    updatedAt: new Date(investment.updated_at),
    investedTeam: {
      id: investment.invested_teams?.id,
      name: investment.invested_teams?.name,
      members: investment.invested_teams?.members
    }
  }))
}

// Calculate team performance tiers (PER-ASSIGNMENT)
export const calculateTeamPerformance = async (assignmentId: string, teamId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  // Get all investments for this team in THIS ASSIGNMENT ONLY
  const { data: investments, error: investmentsError } = await supabase
    .from('assignment_investments')
    .select('tokens_invested')
    .eq('assignment_id', assignmentId)
    .eq('invested_team_id', teamId)
  
  if (investmentsError) throw investmentsError
  
  if (!investments || investments.length === 0) {
    return { tier: 'incomplete', averageInvestment: 0, grade: 0 }
  }
  
  // Sort investments by token amount
  const sortedInvestments = investments
    .map(inv => inv.tokens_invested)
    .sort((a, b) => a - b)
  
  // Remove highest and lowest (if we have enough investments)
  let trimmedInvestments = sortedInvestments
  if (sortedInvestments.length > 2) {
    trimmedInvestments = sortedInvestments.slice(1, -1)
  }
  
  // Calculate average investment
  const totalTokens = trimmedInvestments.reduce((sum, tokens) => sum + tokens, 0)
  const averageInvestment = totalTokens / trimmedInvestments.length
  
  // Get all team averages for THIS ASSIGNMENT ONLY
  const { data: allInvestments, error: allInvestmentsError } = await supabase
    .from('assignment_investments')
    .select('invested_team_id, tokens_invested')
    .eq('assignment_id', assignmentId) // PER-ASSIGNMENT RANKING
  
  if (allInvestmentsError) throw allInvestmentsError
  
  // Calculate averages for all teams in this assignment
  const teamAverages: { teamId: string; average: number }[] = []
  const teamGroups = allInvestments?.reduce((acc, inv) => {
    if (!acc[inv.invested_team_id]) acc[inv.invested_team_id] = []
    acc[inv.invested_team_id].push(inv.tokens_invested)
    return acc
  }, {} as Record<string, number[]>) || {}
  
  for (const [teamId, tokens] of Object.entries(teamGroups)) {
    const sorted = tokens.sort((a, b) => a - b)
    const trimmed = sorted.length > 2 ? sorted.slice(1, -1) : sorted
    const average = trimmed.reduce((sum, t) => sum + t, 0) / trimmed.length
    teamAverages.push({ teamId, average })
  }
  
  // Sort by average investment (PER-ASSIGNMENT RANKING)
  const sortedAverages = teamAverages.sort((a, b) => b.average - a.average)
  const teamIndex = sortedAverages.findIndex(t => t.teamId === teamId)
  const totalTeams = sortedAverages.length
  
  let tier: string
  let grade: number
  
  // PER-ASSIGNMENT TIERS: Top 1/3 = High, Middle 1/3 = Median, Bottom 1/3 = Low
  if (teamIndex < Math.ceil(totalTeams / 3)) {
    tier = 'high'
    grade = 100
  } else if (teamIndex < Math.ceil((totalTeams * 2) / 3)) {
    tier = 'median'
    grade = 80
  } else {
    tier = 'low'
    grade = 60
  }
  
  console.log(`📊 Assignment ${assignmentId} - Team ${teamId}: ${tier} tier (${grade}%) - Rank ${teamIndex + 1}/${totalTeams}`)
  
  return { tier, averageInvestment, grade }
}

// Calculate interest for a student
export const calculateStudentInterest = async (studentId: string, assignmentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const investments = await getStudentInvestments(studentId, assignmentId)
  let totalInterest = 0
  
  for (const investment of investments) {
    const teamPerformance = await calculateTeamPerformance(assignmentId, investment.investedTeamId)
    
    // Calculate interest based on team performance
    let interestRate = 0
    switch (teamPerformance.tier) {
      case 'high':
        interestRate = 0.2 // 20% interest
        break
      case 'median':
        interestRate = 0.1 // 10% interest
        break
      case 'low':
        interestRate = 0.05 // 5% interest
        break
      case 'incomplete':
        interestRate = 0 // No interest
        break
    }
    
    const interest = investment.tokensInvested * interestRate
    totalInterest += interest
    
    // Record interest earned
    await supabase
      .from('student_interest_tracking')
      .upsert({
        student_id: studentId,
        assignment_id: assignmentId,
        invested_team_id: investment.investedTeamId,
        tokens_invested: investment.tokensInvested,
        team_performance_tier: teamPerformance.tier,
        interest_earned: interest
      })
  }
  
  return totalInterest
}

// Get total interest for a student across all assignments
export const getTotalStudentInterest = async (studentId: string) => {
  const supabase = getSimpleSupabaseClient()
  
  const { data, error } = await supabase
    .from('student_interest_tracking')
    .select('interest_earned')
    .eq('student_id', studentId)
  
  if (error) throw error
  
  const totalInterest = data?.reduce((sum, record) => sum + (record.interest_earned || 0), 0) || 0
  const bonusPercentage = Math.min(totalInterest / 100, 0.20) // Cap at 20%
  
  return {
    totalInterest,
    bonusPercentage,
    maxBonus: 20
  }
}
