'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// Remove useSession import since we'll get user info from props
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  DollarSign, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Users,
  FileText,
  Target,
  BookOpen
} from 'lucide-react'
import { Assignment, Submission, Investment, Grade, Team } from '@/types'
import { SubmitWorkModal } from './submit-work-modal'
import { CreateTeamModal } from './create-team-modal'
import { EditTeamModal } from './edit-team-modal'
import { InvestmentModal } from './investment-modal'
import { EvaluationAssignments } from './evaluation-assignments'
import { StudentDeadlineDisplay } from './student-deadline-display'
import StudentGradesDisplay from './student-grades-display'

interface StudentDashboardProps {
  currentUserEmail: string
  currentUserId: string
}

export function StudentDashboard({ currentUserEmail, currentUserId }: StudentDashboardProps) {
  console.log('🔄 StudentDashboard: currentUserEmail received:', currentUserEmail)
  console.log('🔄 StudentDashboard: currentUserId received:', currentUserId)
  const user = { email: currentUserEmail, name: currentUserEmail.split('@')[0] }
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showEditTeamModal, setShowEditTeamModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Helper function to convert user IDs to emails
  const getUserEmails = (userIds: string[]) => {
    return userIds.map(id => {
      const user = allUsers.find(u => u.id === id)
      return user ? user.email : id
    }).join(', ')
  }

  const fetchDashboardData = async () => {
    try {
      const [assignmentsRes, submissionsRes, investmentsRes, gradesRes, teamsRes, usersRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/submissions'),
        fetch('/api/investments'),
        fetch('/api/grades'),
        fetch('/api/teams'),
        fetch('/api/users')
      ])

      const [assignmentsData, submissionsData, investmentsData, gradesData, teamsData, usersData] = await Promise.all([
        assignmentsRes.json(),
        submissionsRes.json(),
        investmentsRes.json(),
        gradesRes.json(),
        teamsRes.json(),
        usersRes.json()
      ])

      setAssignments(assignmentsData.data || [])
      setSubmissions(submissionsData.data || [])
      setInvestments(investmentsData.data || [])
      setGrades(gradesData.data || [])
      setAllUsers(usersData.data || [])
      
      // Filter teams to show only the ones the current user belongs to
      const userTeams = (teamsData.data || []).filter((team: Team) => 
        team.members.includes(currentUserId)
      )
      setTeams(userTeams)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeAssignments = assignments?.filter(a => a.isActive) || []
  const pendingEvaluations = investments?.filter(i => !i.isIncomplete)?.length || 0
  const totalInvestments = investments?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0
  const averageGrade = grades?.length > 0 ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length : 0

  // Helper function to check if an assignment has been submitted by the current user's team
  const isAssignmentSubmitted = (assignmentId: string) => {
    if (teams.length === 0) return false
    
    return submissions?.some(submission => 
      submission.assignmentId === assignmentId && 
      submission.status === 'submitted' &&
      submission.teamId === teams[0].id // Check if submission is from current user's team
    ) || false
  }

  // Helper function to get submission for an assignment from the current user's team
  const getSubmissionForAssignment = (assignmentId: string) => {
    if (teams.length === 0) return null
    
    return submissions?.find(submission => 
      submission.assignmentId === assignmentId && 
      submission.status === 'submitted' &&
      submission.teamId === teams[0].id // Check if submission is from current user's team
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your submissions and investments
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/courses')}
            className="flex items-center"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Courses
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeAssignments.length > 0 ? 'Due soon' : 'No active assignments'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEvaluations}</div>
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
            <div className="text-2xl font-bold">{totalInvestments}</div>
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
            <div className="text-2xl font-bold">{averageGrade?.toFixed(0) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Your team's performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Team</CardTitle>
                <CardDescription>
                  {teams.length > 0 ? 'Your team information' : 'Create or join a team to participate'}
                </CardDescription>
              </div>
              {teams.length === 0 ? (
                <Button onClick={() => setShowCreateTeamModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedTeam(teams[0])
                    setShowEditTeamModal(true)
                  }}
                >
                  Edit Team
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No team created yet</p>
                <Button onClick={() => setShowCreateTeamModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Your Team
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{team.name}</h3>
                      <Badge variant="secondary">
                        Team ID: {team.id}
                      </Badge>
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {team.description}
                      </p>
                    )}
                    <div className="text-sm text-gray-500">
                      <p><strong>Members:</strong> {getUserEmails(team.members || [])}</p>
                      <p><strong>Created:</strong> {new Date(team.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="pending-investments">Pending Investment</TabsTrigger>
          <TabsTrigger value="investments">My Investments</TabsTrigger>
          <TabsTrigger value="grades">Grades & Feedback</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>
                Submit your work and track deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAssignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{assignment.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {isAssignmentSubmitted(assignment.id) ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Completed
                            </Badge>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const submission = getSubmissionForAssignment(assignment.id)
                                if (submission) {
                                  setSelectedAssignment(assignment)
                                  setShowSubmitModal(true)
                                }
                              }}
                            >
                              View Submission
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm"
                            disabled={teams.length === 0}
                            onClick={() => {
                              setSelectedAssignment(assignment)
                              setShowSubmitModal(true)
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {teams.length === 0 ? 'Create Team First' : 'Submit Work'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-6">
          <StudentDeadlineDisplay
            assignments={assignments}
            submissions={submissions}
            investments={investments}
            teams={teams}
            currentUserEmail={currentUserEmail}
          />
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>
                Track your submitted work and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filter submissions to only show those from the current user's team
                const userTeamSubmissions = teams.length > 0 
                  ? submissions.filter(submission => submission.teamId === teams[0].id)
                  : []
                
                if (userTeamSubmissions.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No submissions yet</p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-4">
                    {userTeamSubmissions.map((submission) => {
                    // Find the assignment for this submission
                    const assignment = assignments?.find(a => a.id === submission.assignmentId)
                    return (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {assignment?.title || submission.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Assignment ID: {submission.assignmentId}
                            </p>
                          </div>
                          <Badge 
                            variant={submission.status === 'submitted' ? 'default' : 'secondary'}
                            className={submission.status === 'submitted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                          >
                            {submission.status === 'submitted' ? '✓ Submitted' : submission.status}
                          </Badge>
                        </div>
                        
                        {submission.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {submission.description}
                          </p>
                        )}

                        {/* Submission Links */}
                        <div className="space-y-2 mb-3">
                          {submission.primaryLink && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Primary Link:
                              </span>
                              <a 
                                href={submission.primaryLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                              >
                                {submission.primaryLink}
                              </a>
                            </div>
                          )}
                          
                          {submission.backupLink && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Backup Link:
                              </span>
                              <a 
                                href={submission.backupLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                              >
                                {submission.backupLink}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Submitted: {submission.submittedAt ? 
                              new Date(submission.submittedAt).toLocaleDateString() + ' at ' + 
                              new Date(submission.submittedAt).toLocaleTimeString() : 
                              'Not submitted'
                            }
                          </span>
                          <span>
                            Team ID: {submission.teamId}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Investment Tab */}
        <TabsContent value="pending-investments" className="space-y-6">
          <EvaluationAssignments 
            currentUserEmail={currentUserEmail} 
            onDataRefresh={fetchDashboardData}
          />
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Investment Portfolio</CardTitle>
              <CardDescription>
                Track your investments and returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {investments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No investments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Investment Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Investments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {investments.reduce((sum, inv) => sum + (inv.amount || 0), 0)} tokens
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Investment Count</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {investments.length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Investments */}
                  {investments.map((investment) => (
                    <div key={investment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Team Investment</h3>
                        <Badge variant={investment.isIncomplete ? 'destructive' : 'default'}>
                          {investment.isIncomplete ? 'Incomplete' : `${investment.amount} tokens`}
                        </Badge>
                      </div>
                      {investment.comments && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {investment.comments}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        Invested: {new Date(investment.createdAt).toLocaleDateString()} {new Date(investment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <StudentGradesDisplay currentUserEmail={currentUserEmail} />
        </TabsContent>
      </Tabs>

      {/* Submit Work Modal */}
      {selectedAssignment && (
        <SubmitWorkModal
          open={showSubmitModal}
          onOpenChange={setShowSubmitModal}
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          teamId={teams.length > 0 ? teams[0].id : ''}
          existingSubmission={isAssignmentSubmitted(selectedAssignment.id) ? getSubmissionForAssignment(selectedAssignment.id) : null}
          onSubmissionAdded={fetchDashboardData}
        />
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateTeamModal}
        onOpenChange={setShowCreateTeamModal}
        onTeamCreated={fetchDashboardData}
        currentUserEmail={currentUserEmail}
      />

      {/* Edit Team Modal */}
      {selectedTeam && (
        <EditTeamModal
          open={showEditTeamModal}
          onOpenChange={setShowEditTeamModal}
          teamName={selectedTeam.name}
        />
      )}

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        assignmentId={selectedAssignment?.id || ''}
        teamId={teams.length > 0 ? teams[0].id : ''}
        onSuccess={fetchDashboardData}
      />
    </div>
  )
}
