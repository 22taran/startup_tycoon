// Helper functions for checking submission status with per-assignment teams

export interface SubmissionStatus {
  isSubmitted: boolean
  submission?: any
  teamId?: string
}

// Check if a student has submitted for a specific assignment
export const checkAssignmentSubmissionStatus = (
  assignmentId: string,
  studentId: string,
  submissions: any[],
  studentTeamMap: Map<string, string> // assignmentId -> teamId mapping
): SubmissionStatus => {
  // Simple approach: find the student's team for this assignment
  const teamId = studentTeamMap.get(assignmentId)
  
  if (!teamId) {
    console.log(`⚠️ No team found for student ${studentId} in assignment ${assignmentId}`)
    return { isSubmitted: false }
  }
  
  // Check if this team has submitted for this assignment
  const submission = submissions.find(sub => 
    sub.assignmentId === assignmentId && 
    sub.status === 'submitted' &&
    sub.teamId === teamId
  )
  
  console.log(`🔍 Checking submission for student ${studentId}, team ${teamId}, assignment ${assignmentId}:`, {
    found: !!submission,
    submissionId: submission?.id,
    submissionStatus: submission?.status
  })
  
  return {
    isSubmitted: !!submission,
    submission,
    teamId
  }
}

// Get all assignment team mappings for a student
export const getStudentAssignmentTeamMap = async (
  studentId: string,
  assignmentIds: string[]
): Promise<Map<string, string>> => {
  const teamMap = new Map<string, string>()
  
  try {
    // First try to get per-assignment team memberships
    const promises = assignmentIds.map(async (assignmentId) => {
      try {
        const response = await fetch(`/api/assignment-teams?assignmentId=${assignmentId}&type=my-team`)
        const data = await response.json()
        
        if (data.success && data.data) {
          teamMap.set(assignmentId, data.data.teamId)
          return
        }
      } catch (error) {
        console.error(`Error fetching per-assignment team for assignment ${assignmentId}:`, error)
      }
      
      // Fallback: get course-level team for this assignment
      try {
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`)
        const assignmentData = await assignmentResponse.json()
        
        if (assignmentData.success && assignmentData.data.courseId) {
          const teamsResponse = await fetch(`/api/teams?courseId=${assignmentData.data.courseId}`)
          const teamsData = await teamsResponse.json()
          
          if (teamsData.success && teamsData.data) {
            // Find the team that includes this student
            const studentTeam = teamsData.data.find((team: any) => 
              team.members && team.members.includes(studentId)
            )
            
            if (studentTeam) {
              teamMap.set(assignmentId, studentTeam.id)
              console.log(`✅ Fallback: Found course-level team ${studentTeam.id} for student ${studentId} in assignment ${assignmentId}`)
            }
          }
        }
      } catch (fallbackError) {
        console.error(`Error fetching course-level team for assignment ${assignmentId}:`, fallbackError)
      }
    })
    
    await Promise.all(promises)
  } catch (error) {
    console.error('Error fetching assignment team mappings:', error)
  }
  
  return teamMap
}
