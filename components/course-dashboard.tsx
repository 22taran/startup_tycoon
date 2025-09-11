'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  User,
  Settings,
  Upload,
  DollarSign,
  Trophy,
  Target,
  Edit
} from 'lucide-react'
import { Course, Assignment, Team, Submission, Grade, Investment } from '@/types'
import { SubmitWorkModal } from './submit-work-modal'
import { CreateTeamModal } from './create-team-modal'
import { EditTeamModal } from './edit-team-modal'
import { InvestmentModal } from './investment-modal'
import { EvaluationAssignments } from './evaluation-assignments'
import StudentGradesDisplay from './student-grades-display'
import { StudentAssignmentKanban } from './student-assignment-kanban'
import { IndividualEvaluationDashboard } from './individual-evaluation-dashboard'
import { AssignmentTeamManager } from './assignment-team-manager'

interface CourseDashboardProps {
  courseId: string
  currentUserEmail: string
  currentUserId: string
}

interface CourseWithDetails extends Course {
  instructor: {
    name: string
    email: string
  }
  enrollment?: {
    role: string
    enrolledAt: string
  }
}

interface CourseStats {
  totalAssignments: number
  activeAssignments: number
  totalTeams: number
  myTeam?: Team
  submissions: number
  grades: number
}

export function CourseDashboard({ courseId, currentUserEmail, currentUserId }: CourseDashboardProps) {
  const [course, setCourse] = useState<CourseWithDetails | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [studentTeamMap, setStudentTeamMap] = useState<Map<string, string>>(new Map())
  const [interestData, setInterestData] = useState<{
    totalInterest: number
    bonusPercentage: number
    assignmentsWithInterest: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showEditTeamModal, setShowEditTeamModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  // Update team mappings when assignments change
  useEffect(() => {
    if (assignments.length > 0 && currentUserId) {
      updateStudentTeamMappings()
    }
  }, [assignments, currentUserId])

  const updateStudentTeamMappings = async () => {
    const assignmentIds = assignments.map(a => a.id)
    const { getStudentAssignmentTeamMap } = await import('@/lib/submission-helpers')
    const teamMap = await getStudentAssignmentTeamMap(currentUserId, assignmentIds)
    setStudentTeamMap(teamMap)
  }

  const fetchCourseData = async () => {
    try {
      console.log('🔄 fetchCourseData called - refreshing data...')
      setLoading(true)
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details')
      }
      const courseData = await courseResponse.json()
      if (courseData.success) {
        setCourse(courseData.data)
      }

      // Fetch all data in parallel
      const [assignmentsRes, submissionsRes, investmentsRes, gradesRes, teamsRes, usersRes, interestRes] = await Promise.all([
        fetch(`/api/assignments?courseId=${courseId}`),
        fetch(`/api/submissions?courseId=${courseId}`),
        fetch(`/api/investments?courseId=${courseId}`),
        fetch(`/api/grades?courseId=${courseId}`),
        fetch(`/api/teams?courseId=${courseId}`),
        fetch('/api/users'),
        fetch(`/api/student-interest?studentId=${currentUserId}`)
      ])

      const [assignmentsData, submissionsData, investmentsData, gradesData, teamsData, usersData, interestData] = await Promise.all([
        assignmentsRes.json(),
        submissionsRes.json(),
        investmentsRes.json(),
        gradesRes.json(),
        teamsRes.json(),
        usersRes.json(),
        interestRes.json()
      ])

      setAssignments(assignmentsData.data || [])
      setSubmissions(submissionsData.data || [])
      setInvestments(investmentsData.data || [])
      setGrades(gradesData.data || [])
      setAllUsers(usersData.data || [])
      
      // Set interest data
      if (interestData.success) {
        setInterestData(interestData.data)
      }
      
      console.log('📊 Data refreshed:', {
        assignments: (assignmentsData.data || []).length,
        submissions: (submissionsData.data || []).length,
        teams: (teamsData.data || []).length
      })
      
      // For per-assignment teams, we'll fetch team info per assignment
      // For now, keep the existing logic but we'll update the submission checking
      const userTeams = (teamsData.data || []).filter((team: Team) => 
        team.members.includes(currentUserId)
      )
      setTeams(userTeams)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper functions
  const getUserEmails = (userIds: string[]) => {
    return userIds.map(id => {
      const user = allUsers.find(u => u.id === id)
      return user ? user.email : id
    }).join(', ')
  }

  const isAssignmentSubmitted = (assignmentId: string) => {
    const { checkStudentSubmissionStatus } = require('@/lib/simple-submission-check')
    const status = checkStudentSubmissionStatus(assignmentId, currentUserId, submissions, teams)
    return status.isSubmitted
  }

  const getSubmissionForAssignment = (assignmentId: string) => {
    const { checkStudentSubmissionStatus } = require('@/lib/simple-submission-check')
    const status = checkStudentSubmissionStatus(assignmentId, currentUserId, submissions, teams)
    return status.submission || null
  }

  const getPendingEvaluations = () => {
    return assignments.filter(assignment => 
      assignment.isEvaluationActive && 
      !submissions.some(sub => sub.assignmentId === assignment.id)
    ).length
  }

  const getTotalInvested = () => {
    return investments.reduce((total, investment) => total + investment.amount, 0)
  }

  const getAverageGrade = () => {
    if (grades.length === 0) return 0
    const totalPercentage = grades.reduce((sum, grade) => sum + (grade.percentage || 0), 0)
    return Math.round(totalPercentage / grades.length)
  }

  const getActiveAssignments = () => {
    return assignments.filter(assignment => assignment.isActive).length
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Course
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || 'Course not found or access denied'}
            </p>
            <Button onClick={() => router.push('/courses')} variant="outline">
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {course.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {course.code}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {course.semester} {course.year}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/courses')}
            className="flex items-center w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveAssignments()}</div>
            <p className="text-xs text-muted-foreground">
              {getActiveAssignments() === 0 ? 'No active assignments' : 'Assignments to work on'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPendingEvaluations()}</div>
            <p className="text-xs text-muted-foreground">
              Teams to evaluate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalInvested()}</div>
            <p className="text-xs text-muted-foreground">
              Tokens invested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageGrade()}%</div>
            <p className="text-xs text-muted-foreground">
              Your team's performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interestData?.totalInterest?.toFixed(1) || 0}</div>
            <p className="text-xs text-muted-foreground">
              Interest earned from investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Potential</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof interestData?.bonusPercentage === 'number'
                ? (interestData.bonusPercentage * 100).toFixed(1)
                : '0'}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Bonus to final grade (max 20%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Team Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">My Team</CardTitle>
              <CardDescription>
                {teams.length > 0 ? 'Your team information' : 'Create or join a team to participate'}
              </CardDescription>
            </div>
            {teams.length > 0 ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedTeam(teams[0])
                  setShowEditTeamModal(true)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={() => setShowCreateTeamModal(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {teams.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{teams[0].name}</span>
                <Badge variant="secondary">Team ID: {teams[0].id.slice(0, 8)}...</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Members:</strong> {getUserEmails(teams[0].members)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Created:</strong> {teams[0].createdAt ? formatDate(teams[0].createdAt.toString()) : 'Unknown'}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Team Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to be part of a team to participate in assignments and evaluations.
              </p>
              <Button onClick={() => setShowCreateTeamModal(true)}>
                <Users className="h-4 w-4 mr-2" />
                Create Your Team
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="pipeline" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="pipeline" className="text-xs sm:text-sm whitespace-nowrap">Pipeline</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs sm:text-sm whitespace-nowrap">Assignments</TabsTrigger>
            <TabsTrigger value="evaluations" className="text-xs sm:text-sm whitespace-nowrap">My Evaluations</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs sm:text-sm whitespace-nowrap">Team Management</TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs sm:text-sm whitespace-nowrap">My Submissions</TabsTrigger>
            <TabsTrigger value="pending-investments" className="text-xs sm:text-sm whitespace-nowrap">Pending Investment</TabsTrigger>
            <TabsTrigger value="investments" className="text-xs sm:text-sm whitespace-nowrap">My Investments</TabsTrigger>
            <TabsTrigger value="grades" className="text-xs sm:text-sm whitespace-nowrap">Grades & Feedback</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipeline" className="space-y-4">
          <StudentAssignmentKanban 
            assignments={assignments}
            submissions={submissions}
            investments={investments}
            grades={grades}
            teams={teams}
            currentUserEmail={currentUserEmail}
            currentUserId={currentUserId}
            onAssignmentAction={(assignment: Assignment, action: 'submit' | 'invest' | 'view-grades') => {
              if (action === 'submit') {
                setSelectedAssignment(assignment)
                setShowSubmitModal(true)
              } else if (action === 'invest') {
                setSelectedAssignment(assignment) // ✅ Set the assignment for investment
                setSelectedSubmission(null)
                setShowInvestmentModal(true)
              } else if (action === 'view-grades') {
                const gradesTab = document.querySelector('[value="grades"]') as HTMLElement
                if (gradesTab) gradesTab.click()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid gap-4">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No assignments have been created for this course yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription className="mt-1">
                        {assignment.startDate ? formatDate(assignment.startDate.toString()) : 'TBD'} to {assignment.dueDate ? formatDate(assignment.dueDate.toString()) : 'TBD'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {assignment.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {assignment.isEvaluationActive && (
                          <Badge variant="secondary">Evaluation</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                      Duration: {assignment.startDate ? formatDate(assignment.startDate.toString()) : 'TBD'} to {assignment.dueDate ? formatDate(assignment.dueDate.toString()) : 'TBD'}
                      </div>
                      <div className="flex space-x-2">
                        {assignment.isActive && (
                          <Button 
                            size="sm"
                            variant={isAssignmentSubmitted(assignment.id) ? "outline" : "default"}
                            onClick={() => {
                              setSelectedAssignment(assignment)
                              setShowSubmitModal(true)
                            }}
                          >
                            {isAssignmentSubmitted(assignment.id) ? (
                              <>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Submission
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Submit Work
                              </>
                            )}
                          </Button>
                        )}
                        {assignment.isEvaluationActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedAssignment(assignment) // ✅ Set the assignment for investment
                              setSelectedSubmission(null)
                              setShowInvestmentModal(true)
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Invest
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Individual Evaluations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have been assigned 5 teams to evaluate for each assignment. Complete your evaluations and investments to earn interest.
            </p>
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription>
                        Due: {assignment.dueDate ? formatDate(assignment.dueDate.toString()) : 'TBD'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IndividualEvaluationDashboard
                        assignmentId={assignment.id}
                        currentUserId={currentUserId}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No assignments available for evaluation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Team Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Form teams for each assignment. You can change teams before the submission deadline.
            </p>
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription>
                        Due: {assignment.dueDate ? formatDate(assignment.dueDate.toString()) : 'TBD'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AssignmentTeamManager
                        assignmentId={assignment.id}
                        currentUserId={currentUserId}
                        userRole="student"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No assignments available for team formation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="grid gap-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Submissions</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You haven't submitted any work for this course yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{submission.title || 'Untitled Submission'}</CardTitle>
                        <CardDescription className="mt-1">
                          Submitted: {submission.submittedAt ? formatDate(submission.submittedAt.toString()) : 'Draft'}
                        </CardDescription>
                      </div>
                      <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {submission.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Assignment: {assignments.find(a => a.id === submission.assignmentId)?.title || 'Unknown'}
                      </div>
                      <Button size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending-investments" className="space-y-4">
          <EvaluationAssignments 
            currentUserEmail={currentUserEmail} 
            onDataRefresh={fetchCourseData}
          />
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <div className="grid gap-4">
            {investments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Investments</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You haven't made any investments yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              investments.map((investment) => (
                <Card key={investment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {assignments.find(a => a.id === investment.assignmentId)?.title || 'Unknown Assignment'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Investment: {investment.amount} tokens
                        </CardDescription>
                      </div>
                      <Badge variant={investment.isIncomplete ? 'destructive' : 'default'}>
                        {investment.isIncomplete ? 'Incomplete' : 'Complete'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {investment.comments && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {investment.comments}
                      </p>
                    )}
                    <div className="text-sm text-gray-500">
                      Date: {investment.createdAt ? formatDate(investment.createdAt.toString()) : 'Unknown'}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <StudentGradesDisplay 
            currentUserEmail={currentUserEmail}
            currentUserId={currentUserId}
          />
          
          {/* Interest Breakdown */}
          {interestData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Interest Breakdown
                </CardTitle>
                <CardDescription>
                  Your investment performance and interest earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {interestData.totalInterest.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-700">Total Interest</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(interestData.bonusPercentage * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-700">Bonus Potential</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {interestData.assignmentsWithInterest}
                    </div>
                    <div className="text-sm text-purple-700">Assignments</div>
                  </div>
                </div>
                
                {interestData.totalInterest > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">How Interest Works:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>High tier teams:</strong> 20% interest on your investment</li>
                      <li>• <strong>Median tier teams:</strong> 10% interest on your investment</li>
                      <li>• <strong>Low tier teams:</strong> 5% interest on your investment</li>
                      <li>• <strong>Incomplete teams:</strong> 0% interest</li>
                      <li>• <strong>Bonus cap:</strong> Maximum 20% bonus to final grade</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedAssignment && (
        <SubmitWorkModal
          open={showSubmitModal}
          onOpenChange={setShowSubmitModal}
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          teamId={teams.length > 0 ? teams[0].id : ''}
          existingSubmission={isAssignmentSubmitted(selectedAssignment.id) ? getSubmissionForAssignment(selectedAssignment.id) : null}
          onSubmissionAdded={async () => {
            console.log('🔄 onSubmissionAdded called - refreshing data...')
            await fetchCourseData()
            console.log('✅ Data refresh completed')
          }}
        />
      )}

      <CreateTeamModal
        open={showCreateTeamModal}
        onOpenChange={setShowCreateTeamModal}
        onTeamCreated={fetchCourseData}
        currentUserEmail={currentUserEmail}
        courseId={courseId}
      />

      {selectedTeam && (
        <EditTeamModal
          open={showEditTeamModal}
          onOpenChange={setShowEditTeamModal}
          teamName={selectedTeam.name}
        />
      )}

      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        assignmentId={selectedAssignment?.id || ''}
        teamId={teams.length > 0 ? teams[0].id : ''}
        onSuccess={fetchCourseData}
      />
    </div>
  )
}
