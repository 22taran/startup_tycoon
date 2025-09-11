// Simple submission status checking - directly from submissions table

export interface SimpleSubmissionStatus {
  isSubmitted: boolean
  submission?: any
  teamId?: string
}

// Simple function to check if a student's team has submitted an assignment
export const checkStudentSubmissionStatus = (
  assignmentId: string,
  studentId: string,
  submissions: any[],
  studentTeams: any[] // Array of teams the student belongs to
): SimpleSubmissionStatus => {
  console.log(`🔍 Checking submission status for student ${studentId} in assignment ${assignmentId}`)
  console.log(`📊 Available submissions:`, submissions.map(s => ({
    id: s.id,
    assignmentId: s.assignmentId,
    teamId: s.teamId,
    status: s.status
  })))
  console.log(`👥 Student teams:`, studentTeams.map(t => ({
    id: t.id,
    name: t.name,
    members: t.members
  })))
  
  // Find the team this student belongs to
  const studentTeam = studentTeams.find(team => 
    team.members && team.members.includes(studentId)
  )
  
  if (!studentTeam) {
    console.log(`⚠️ Student ${studentId} is not in any team`)
    return { isSubmitted: false }
  }
  
  console.log(`✅ Student ${studentId} belongs to team ${studentTeam.id} (${studentTeam.name})`)
  
  // Check if this team has submitted for this assignment
  const submission = submissions.find(sub => 
    sub.assignmentId === assignmentId && 
    sub.status === 'submitted' &&
    sub.teamId === studentTeam.id
  )
  
  console.log(`🔍 Submission check result:`, {
    found: !!submission,
    submissionId: submission?.id,
    submissionTeamId: submission?.teamId,
    submissionStatus: submission?.status
  })
  
  return {
    isSubmitted: !!submission,
    submission,
    teamId: studentTeam.id
  }
}
