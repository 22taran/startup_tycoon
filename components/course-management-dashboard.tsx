'use client'

import { useState, useEffect } from 'react'
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
  DollarSign, 
  Trophy, 
  Plus,
  Edit,
  Settings,
  BarChart3,
  FolderOpen,
  Bell,
  Target,
  GraduationCap,
  Clock,
  CheckCircle
} from 'lucide-react'
import { AssignmentKanban } from './assignment-kanban'
import GradesDisplay from './grades-display'
import { BreadcrumbNavigation } from './breadcrumb-navigation'
import { AddTeamModal } from './add-team-modal'
import { ManageTeamsModal } from './manage-teams-modal'
import { AddAssignmentModal } from './add-assignment-modal'
import { EditAssignmentModal } from './edit-assignment-modal'
import { Course, CourseEnrollment } from '@/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CourseManagementDashboardProps {
  courseId: string
  currentUserEmail: string
  userRole: 'admin' | 'instructor'
}

interface CourseWithEnrollments extends Course {
  enrollments?: CourseEnrollment[]
  instructor?: {
    name: string
    email: string
  }
  studentCount?: number
  teamCount?: number
  assignmentCount?: number
}


export function CourseManagementDashboard({ courseId, currentUserEmail, userRole }: CourseManagementDashboardProps) {
  const [course, setCourse] = useState<CourseWithEnrollments | null>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false)
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showManageTeamsModal, setShowManageTeamsModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollmentEmails, setEnrollmentEmails] = useState('')
  const [enrollmentRole, setEnrollmentRole] = useState<'student' | 'instructor' | 'ta'>('student')
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details')
      }
      const courseData = await courseResponse.json()
      if (courseData.success) {
        setCourse(courseData.data as CourseWithEnrollments)
      }

      // Fetch all course-related data
      const [assignmentsRes, teamsRes, submissionsRes, investmentsRes, gradesRes] = await Promise.all([
        fetch(`/api/assignments?courseId=${courseId}`),
        fetch(`/api/teams?courseId=${courseId}`),
        fetch(`/api/submissions?courseId=${courseId}`),
        fetch(`/api/investments?courseId=${courseId}`),
        fetch(`/api/grades?courseId=${courseId}`)
      ])

      const [assignmentsData, teamsData, submissionsData, investmentsData, gradesData] = await Promise.all([
        assignmentsRes.json(),
        teamsRes.json(),
        submissionsRes.json(),
        investmentsRes.json(),
        gradesRes.json()
      ])

      setAssignments(assignmentsData.data || [])
      setTeams(teamsData.data || [])
      setSubmissions(submissionsData.data || [])
      setInvestments(investmentsData.data || [])
      setGrades(gradesData.data || [])

    } catch (error) {
      console.error('Error fetching course data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignment(assignment)
    setShowEditAssignmentModal(true)
  }

  const handleEnrollStudents = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollmentEmails.trim()) return

    setEnrolling(true)
    try {
      // Parse email addresses (one per line)
      const emails = enrollmentEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      const response = await fetch(`/api/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmails: emails,
          role: enrollmentRole
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEnrollmentEmails('')
        setEnrollmentRole('student')
        setShowEnrollModal(false)
        fetchCourseData() // Refresh course data
      } else {
        alert(data.error || 'Failed to enroll students')
      }
    } catch (error) {
      console.error('Error enrolling students:', error)
      alert('An error occurred while enrolling students')
    } finally {
      setEnrolling(false)
    }
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

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Course Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The course you are looking for does not exist or you do not have access.</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-4 sm:py-8">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation 
        items={[
          { 
            label: userRole === 'admin' ? 'Global Admin' : 'My Courses',
            href: '/dashboard'
          },
          { 
            label: course.name,
            current: true
          }
        ]} 
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {course.name}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {course.code}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {course.semester} {course.year}
              </span>
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {course.studentCount} students
              </span>
            </div>
            {course.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                {course.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Course Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course?.enrollments?.filter((e: any) => e.role === 'student').length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
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
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="assignments">📝 Assignments</TabsTrigger>
          <TabsTrigger value="announcements">📢 Announcements</TabsTrigger>
          <TabsTrigger value="teams">👥 Teams</TabsTrigger>
          <TabsTrigger value="students">🎓 Students</TabsTrigger>
          <TabsTrigger value="grades">📊 Grades</TabsTrigger>
          <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
          <TabsTrigger value="resources">📁 Resources</TabsTrigger>
          <TabsTrigger value="calendar">📅 Calendar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AssignmentKanban
            assignments={assignments}
            teams={teams}
            submissions={submissions}
            investments={investments}
            grades={grades}
            onDistributeAssignment={() => {}}
            onEditAssignment={handleEditAssignment}
            distributing={null}
            distributionStatus={{}}
            onRefresh={fetchCourseData}
          />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assignments</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage course assignments and deadlines
              </p>
            </div>
            <Button onClick={() => setShowCreateAssignmentModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
          
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first assignment to get started
                  </p>
                  <Button onClick={() => setShowCreateAssignmentModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
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
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Announcements</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Communicate with your students
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Post Announcement
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Post announcements to keep students informed
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post First Announcement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Teams</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage student teams and members
              </p>
            </div>
            <Button onClick={() => setShowCreateTeamModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
          
          {teams.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create teams for your students to collaborate
                  </p>
                  <Button onClick={() => setShowCreateTeamModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {team.members.length} members
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        Team ID: {team.id.slice(0, 8)}...
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Members:</strong> {team.members.join(', ')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Created:</strong> {team.createdAt ? formatDate(team.createdAt.toString()) : 'Unknown'}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowManageTeamsModal(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Team
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowManageTeamsModal(true)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Members
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Students</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage student roster and enrollment
              </p>
            </div>
            <Button onClick={() => setShowEnrollModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Enroll Students
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Student Roster</h3>
                  <Badge variant="secondary">
                    {course?.studentCount || 0} students enrolled
                  </Badge>
                </div>
                
                {course?.enrollments && course.enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {course.enrollments
                      .filter((enrollment: any) => enrollment.role === 'student')
                      .map((enrollment: any) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                {enrollment.user?.name?.charAt(0) || enrollment.user?.email?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{enrollment.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{enrollment.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                              {enrollment.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Students Enrolled</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Enroll students to get started with this course
                    </p>
                    <Button onClick={() => {/* TODO: Add enroll students functionality */}}>
                      <Plus className="h-4 w-4 mr-2" />
                      Enroll Students
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <GradesDisplay showCalculateButton={true} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Course performance and engagement metrics
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Resources</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Course materials and files
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Course Resources</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upload and organize course materials
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Resource
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Calendar</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Assignment deadlines and important dates
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Course Calendar</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  View and manage important dates
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Assignment Modal */}
      <AddAssignmentModal
        open={showCreateAssignmentModal}
        onOpenChange={setShowCreateAssignmentModal}
        onAssignmentAdded={fetchCourseData}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        open={showEditAssignmentModal}
        onOpenChange={setShowEditAssignmentModal}
        assignment={selectedAssignment}
        onAssignmentUpdated={fetchCourseData}
      />

      {/* Create Team Modal */}
      <AddTeamModal
        open={showCreateTeamModal}
        onOpenChange={setShowCreateTeamModal}
        onTeamAdded={fetchCourseData}
        currentUserEmail={currentUserEmail}
        userRole="admin"
        courseId={courseId}
      />

      {/* Manage Teams Modal */}
      <ManageTeamsModal
        open={showManageTeamsModal}
        onOpenChange={setShowManageTeamsModal}
        onTeamsUpdated={fetchCourseData}
      />

      {/* Enroll Students Modal */}
      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Add students to {course?.name} by entering their email addresses.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnrollStudents} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={enrollmentRole} onValueChange={(value: 'student' | 'instructor' | 'ta') => setEnrollmentRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="ta">Teaching Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                value={enrollmentEmails}
                onChange={(e) => setEnrollmentEmails(e.target.value)}
                placeholder="Enter email addresses, one per line:&#10;student1@example.com&#10;student2@example.com"
                rows={6}
                required
              />
              <p className="text-sm text-gray-500">
                Enter one email address per line
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEnrollModal(false)}
                disabled={enrolling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={enrolling}>
                {enrolling ? 'Enrolling...' : 'Enroll Students'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
