'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  FileText, 
  DollarSign, 
  Trophy, 
  Plus,
  Edit,
  Settings,
  BarChart3,
  Download,
  Share2,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { Team, Assignment, Submission, Investment, Grade } from '@/types'
import { AddTeamModal } from './add-team-modal'
import { AddAssignmentModal } from './add-assignment-modal'
import { EditAssignmentModal } from './edit-assignment-modal'
import { ManageTeamsModal } from './manage-teams-modal'
import { SetEvaluationDeadlineModal } from './set-evaluation-deadline-modal'
import { AssignmentKanban } from './assignment-kanban'
import GradesDisplay from './grades-display'

interface AdminDashboardProps {
  currentUserEmail: string
}

export function AdminDashboard({ currentUserEmail }: AdminDashboardProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTeamModal, setShowAddTeamModal] = useState(false)
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false)
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showManageTeamsModal, setShowManageTeamsModal] = useState(false)
  const [showSetDeadlineModal, setShowSetDeadlineModal] = useState(false)
  const [selectedAssignmentForDeadline, setSelectedAssignmentForDeadline] = useState<Assignment | null>(null)
  const [distributionStatus, setDistributionStatus] = useState<Record<string, boolean>>({})
  const [distributing, setDistributing] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...')
      
      // Optimized: Fetch only essential data first, then load additional data
      const [teamsRes, assignmentsRes, submissionsRes] = await Promise.all([
        fetch('/api/teams', { credentials: 'include' }),
        fetch('/api/assignments', { credentials: 'include' }),
        fetch('/api/submissions', { credentials: 'include' })
      ])

      const [teamsData, assignmentsData, submissionsData] = await Promise.all([
        teamsRes.json(),
        assignmentsRes.json(),
        submissionsRes.json()
      ])

      // Set core data immediately
      setTeams(teamsData.data || [])
      setAssignments(assignmentsData.data || [])
      setSubmissions(submissionsData.data || [])
      
      // Check distribution status immediately (no API calls needed)
      checkDistributionStatus(assignmentsData.data || [])
      
      // Load additional data in background and auto-complete expired assignments
      Promise.all([
        fetch('/api/investments', { credentials: 'include' }).then(res => res.json()),
        fetch('/api/grades', { credentials: 'include' }).then(res => res.json()),
        fetch('/api/admin/evaluations', { credentials: 'include' }).then(res => res.json()),
        fetch('/api/assignments/auto-complete', { 
          credentials: 'include',
          method: 'POST'
        }).then(res => res.json()).catch(() => ({ success: false })) // Don't fail if auto-complete fails
      ]).then(([investmentsData, gradesData, evaluationsData, autoCompleteData]) => {
        setInvestments(investmentsData.data || [])
        
        
        setGrades(gradesData.data || [])
        
        // Handle evaluations data with better error checking
        if (evaluationsData.success) {
          setEvaluations(evaluationsData.data || [])
          console.log('✅ Evaluations loaded successfully:', evaluationsData.data?.length || 0)
        } else {
          console.error('❌ Failed to load evaluations:', evaluationsData.error)
          setEvaluations([])
        }
        
        // Log auto-completion results
        if (autoCompleteData.success && autoCompleteData.data.completedCount > 0) {
          console.log(`✅ Auto-completed ${autoCompleteData.data.completedCount} assignments`)
        }
      }).catch(error => {
        console.error('❌ Error loading additional data:', error)
      })
      
      console.log('✅ Dashboard data updated')
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkDistributionStatus = async (assignments: Assignment[]) => {
    const statusMap: Record<string, boolean> = {}
    
    // Optimized: Check distribution status based on isEvaluationActive flag instead of API calls
    for (const assignment of assignments) {
      statusMap[assignment.id] = assignment.isEvaluationActive || false
    }
    
    setDistributionStatus(statusMap)
  }

  const checkDistributionRequirements = async (assignment: Assignment) => {
    try {
      // Check if there are students by fetching users and filtering
      const usersResponse = await fetch('/api/users', { credentials: 'include' })
      const usersData = await usersResponse.json()
      const students = usersData.data?.filter((user: any) => user.role === 'student') || []
      const studentCount = students.length

      // Check if there are submissions for this assignment
      const submissionsForAssignment = submissions.filter(s => s.assignmentId === assignment.id && s.status === 'submitted')
      const submissionCount = submissionsForAssignment.length

      console.log('Distribution requirements check:', {
        studentCount,
        submissionCount,
        students: students.map((s: any) => ({ email: s.email, role: s.role }))
      })

      if (studentCount === 0) {
        alert('Cannot distribute assignment: No students registered. At least 1 student is required.')
        return false
      }

      if (submissionCount === 0) {
        alert('Cannot distribute assignment: No submissions found for this assignment. At least 1 team must submit work.')
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking distribution requirements:', error)
      alert('Error checking distribution requirements. Please try again.')
      return false
    }
  }

  const handleDistributeAssignment = async (assignment: Assignment) => {
    const canDistribute = await checkDistributionRequirements(assignment)
    if (canDistribute) {
      setSelectedAssignmentForDeadline(assignment)
      setShowSetDeadlineModal(true)
    }
  }

  const handleDeadlineSet = async (startDate: Date, dueDate: Date, evaluationsPerStudent: number) => {
    if (!selectedAssignmentForDeadline) return

    setDistributing(selectedAssignmentForDeadline.id)
    
    try {
      // First, update the assignment with evaluation deadlines
      const updateResponse = await fetch(`/api/assignments/${selectedAssignmentForDeadline.id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationStartDate: startDate.toISOString(),
          evaluationDueDate: dueDate.toISOString(),
          isEvaluationActive: false
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update assignment with evaluation deadlines')
      }

      // Then distribute the assignment
      const response = await fetch(`/api/assignments/${selectedAssignmentForDeadline.id}/distribute`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationsPerStudent
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update distribution status
        setDistributionStatus(prev => ({
          ...prev,
          [selectedAssignmentForDeadline.id]: true
        }))
        
        // Refresh dashboard data to show updated assignment info
        await fetchDashboardData()
        
        // Show success message
        alert(`Successfully set evaluation deadline and distributed assignment! Created ${data.data.totalEvaluations} evaluation assignments.`)
      } else {
        alert(`Error: ${data.message || 'Failed to distribute assignment'}`)
      }
    } catch (error) {
      console.error('Error distributing assignment:', error)
      alert('Failed to distribute assignment. Please try again.')
    } finally {
      setDistributing(null)
      setSelectedAssignmentForDeadline(null)
    }
  }

  const totalTeams = teams.length
  const totalAssignments = assignments.length
  const activeAssignments = assignments.filter(a => a.isActive).length
  const totalSubmissions = submissions.length
  const pendingEvaluations = evaluations.filter(e => !e.isComplete).length
  const completedEvaluations = evaluations.filter(e => e.isComplete).length

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage the Startup Tycoon game
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Active teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">
              of {totalAssignments} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Total submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluations</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              of {pendingEvaluations + completedEvaluations} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Pipeline</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest submissions and evaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{submission.title}</p>
                        <p className="text-sm text-gray-500">
                          Team {(submission as any).team_id || submission.teamId}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {submission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage the game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setShowAddAssignmentModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowManageTeamsModal(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Teams
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Game Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kanban Pipeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <AssignmentKanban
            assignments={assignments}
            teams={teams}
            submissions={submissions}
            investments={investments}
            grades={grades}
            onDistributeAssignment={handleDistributeAssignment}
            onEditAssignment={(assignment) => {
              setSelectedAssignment(assignment)
              setShowEditAssignmentModal(true)
            }}
            distributing={distributing}
            distributionStatus={distributionStatus}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Teams Management</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create, edit, and manage all teams and their members
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddTeamModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowManageTeamsModal(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Teams</CardTitle>
                  <CardDescription>
                    Overview of all teams and their members
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {teams.length} team{teams.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No teams created yet</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Create your first team to get started with the game
                  </p>
                  <Button onClick={() => setShowAddTeamModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Team
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => (
                    <div key={team.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <Badge variant="secondary">
                            {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowManageTeamsModal(true)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                      
                      {team.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {team.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>
                          <strong>Created:</strong> {(team as any).created_at ? new Date((team as any).created_at).toLocaleDateString() : 
                                 team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                        <div>
                          <strong>Team ID:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{team.id}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assignments</CardTitle>
                  <CardDescription>
                    Manage assignment rounds and deadlines
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddAssignmentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{assignment.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                            {assignment.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {distributionStatus[assignment.id] && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Distributed
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment)
                              setShowEditAssignmentModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {assignment.description}
                      </p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>
                          <strong>Start:</strong> {assignment.startDate ? new Date(assignment.startDate).toLocaleString() : 'Unknown'}
                        </div>
                        <div>
                          <strong>Due:</strong> {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'Unknown'}
                        </div>
                        {assignment.evaluationStartDate && assignment.evaluationDueDate && (
                          <>
                            <div>
                              <strong>Evaluation Period:</strong> {new Date(assignment.evaluationStartDate).toLocaleString()} - {new Date(assignment.evaluationDueDate).toLocaleString()}
                            </div>
                            <div>
                              <strong>Evaluation Status:</strong> 
                              <span className={`ml-1 ${
                                grades.some(g => g.assignmentId === assignment.id) 
                                  ? 'text-purple-600 font-semibold' 
                                  : assignment.isEvaluationActive 
                                    ? 'text-green-600' 
                                    : 'text-gray-500'
                              }`}>
                                {grades.some(g => g.assignmentId === assignment.id) 
                                  ? 'Completed' 
                                  : assignment.isEvaluationActive 
                                    ? 'Active' 
                                    : 'Inactive'
                                }
                              </span>
                            </div>
                          </>
                        )}
                        {assignment.documentUrl && (
                          <div>
                            <strong>Document:</strong> 
                            <a 
                              href={assignment.documentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1"
                            >
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Distribution Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {(() => {
                              const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
                              const hasGrades = assignmentGrades.length > 0
                              
                              
                              return hasGrades ? (
                                <span className="flex items-center text-purple-600 font-semibold">
                                  <Trophy className="h-4 w-4 mr-1" />
                                  Assignment completed with grades ({assignmentGrades.length} grades)
                                </span>
                              ) : distributionStatus[assignment.id] ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Assignment distributed to students for evaluation
                                </span>
                              ) : (
                                <span className="flex items-center text-orange-600">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Ready for distribution
                                </span>
                              )
                            })()}
                          </div>
                          {!distributionStatus[assignment.id] && 
                            grades.filter(g => g.assignmentId === assignment.id).length === 0 && (
                            <div className="flex flex-col items-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleDistributeAssignment(assignment)}
                                disabled={distributing === assignment.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {distributing === assignment.id ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-1 animate-spin" />
                                    Distributing...
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="h-4 w-4 mr-1" />
                                    Set Deadline & Distribute
                                  </>
                                )}
                              </Button>
                              <div className="text-xs text-gray-500 text-right">
                                Requires: 1+ students, 1+ submissions
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>
                View and manage all team submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{submission.title}</h3>
                        <Badge 
                          variant={submission.status === 'submitted' ? 'default' : 'secondary'}
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {submission.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Team: {(submission as any).team_id || submission.teamId}</span>
                        <span>
                          Submitted: {(submission as any).submitted_at ? 
                            new Date((submission as any).submitted_at).toLocaleDateString() : 
                            submission.submittedAt ? 
                            new Date(submission.submittedAt).toLocaleDateString() : 
                            'Not submitted'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Management</CardTitle>
              <CardDescription>
                Monitor evaluation progress and assign teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Evaluation Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Completed</span>
                      <span className="font-medium">{completedEvaluations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending</span>
                      <span className="font-medium">{pendingEvaluations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${((completedEvaluations / Math.max(completedEvaluations + pendingEvaluations, 1)) * 100) || 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full">
                      Assign Teams
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Process Grades
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      Send Reminders
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <GradesDisplay showCalculateButton={true} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                Generate reports and view game statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Export Data</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Grades Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Investment Report
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Game Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Teams:</span>
                      <span className="font-medium">{totalTeams}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Submissions:</span>
                      <span className="font-medium">{totalSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Investments:</span>
                      <span className="font-medium">{investments.reduce((sum, i) => sum + (i.amount || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Grade:</span>
                      <span className="font-medium">
                        {grades.length > 0 ? 
                          (grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length).toFixed(1) + '%' : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddTeamModal
        open={showAddTeamModal}
        onOpenChange={setShowAddTeamModal}
        onTeamAdded={fetchDashboardData}
        currentUserEmail={currentUserEmail}
        userRole="admin"
      />
      
      <AddAssignmentModal
        open={showAddAssignmentModal}
        onOpenChange={setShowAddAssignmentModal}
        onAssignmentAdded={fetchDashboardData}
      />

      <ManageTeamsModal
        open={showManageTeamsModal}
        onOpenChange={setShowManageTeamsModal}
        onTeamsUpdated={fetchDashboardData}
      />

      <EditAssignmentModal
        open={showEditAssignmentModal}
        onOpenChange={setShowEditAssignmentModal}
        assignment={selectedAssignment}
        onAssignmentUpdated={fetchDashboardData}
      />

      <SetEvaluationDeadlineModal
        open={showSetDeadlineModal}
        onOpenChange={setShowSetDeadlineModal}
        onDeadlineSet={handleDeadlineSet}
        assignmentTitle={selectedAssignmentForDeadline?.title || ''}
        assignmentDueDate={selectedAssignmentForDeadline?.dueDate || new Date()}
      />
    </div>
  )
}
