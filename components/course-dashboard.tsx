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
  Edit,
  ChevronDown,
  ChevronRight
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

interface CourseDashboardProps {
  courseId: string
  currentUserEmail: string
  currentUserId: string
}

interface ExpandableAssignmentCardProps {
  assignment: Assignment
  assignmentNumber: number
  currentUserId: string
  submissions: Submission[]
  teams: Team[]
  onAssignmentAction: (assignment: Assignment, action: 'submit' | 'view-grades') => void
}

interface ExpandableSubmissionCardProps {
  submission: Submission
  assignment: Assignment
}

interface ExpandableEvaluationCardProps {
  assignment: Assignment
  assignmentNumber: number
  currentUserId: string
}

function ExpandableAssignmentCard({ assignment, assignmentNumber, currentUserId, submissions, teams, onAssignmentAction }: ExpandableAssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isAssignmentSubmitted = (assignmentId: string) => {
    return submissions.some(sub => sub.assignmentId === assignmentId && sub.status === 'submitted')
  }

  // Determine current phase and status
  const getAssignmentPhase = () => {
    const now = new Date()
    const startDate = assignment.startDate ? new Date(assignment.startDate) : null
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
    const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
    const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null

    // Check if assignment has grades (completed) - this would need to be passed as a prop or checked differently
    // For now, we'll rely on the evaluation phase completion logic below

    // Check if evaluation phase is active
    if (assignment.isEvaluationActive) {
      if (evaluationStartDate && evaluationDueDate) {
        if (now >= evaluationStartDate && now <= evaluationDueDate) {
          return { phase: 'evaluation', status: 'Evaluation Active', color: 'bg-blue-100 text-blue-800', icon: '👥' }
        } else if (now > evaluationDueDate) {
          return { phase: 'completed', status: 'Evaluation Complete', color: 'bg-purple-100 text-purple-800', icon: '✅' }
        }
      }
      return { phase: 'evaluation', status: 'Evaluation Phase', color: 'bg-blue-100 text-blue-800', icon: '👥' }
    }

    // Check submission phase
    if (startDate && dueDate) {
      if (now < startDate) {
        return { phase: 'upcoming', status: 'Upcoming', color: 'bg-gray-100 text-gray-800', icon: '⏰' }
      } else if (now >= startDate && now <= dueDate) {
        return { phase: 'submission', status: 'Submission Active', color: 'bg-green-100 text-green-800', icon: '📝' }
      } else if (now > dueDate) {
        return { phase: 'submission-closed', status: 'Submission Closed', color: 'bg-orange-100 text-orange-800', icon: '⏰' }
      }
    }

    return { phase: 'unknown', status: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' }
  }

  const getTimeRemaining = (date: Date | string) => {
    const now = new Date()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const diff = dateObj.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getUrgencyColor = (date: Date | string) => {
    const now = new Date()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const diff = dateObj.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 0) return 'text-red-600'
    if (hours < 24) return 'text-orange-600'
    if (hours < 72) return 'text-yellow-600'
    return 'text-green-600'
  }

  const phase = getAssignmentPhase()
  const submitted = isAssignmentSubmitted(assignment.id)

  const handleAction = (e: React.MouseEvent, action: 'submit' | 'view-grades') => {
    e.stopPropagation() // Prevent card expansion
    onAssignmentAction(assignment, action)
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${phase.phase === 'submission' ? 'ring-2 ring-green-200 bg-green-50/30' : phase.phase === 'evaluation' ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
      {/* Phase Indicator Bar */}
      <div className={`h-1 w-full ${phase.phase === 'upcoming' ? 'bg-gray-300' : 
        phase.phase === 'submission' ? 'bg-green-500' : 
        phase.phase === 'evaluation' ? 'bg-blue-500' : 
        phase.phase === 'completed' ? 'bg-purple-500' : 'bg-gray-300'}`} />
      
      <CardHeader 
        className="pb-4 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <Badge variant="outline" className="text-xs font-medium">
                Assignment {assignmentNumber}
              </Badge>
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {assignment.dueDate ? `${new Date(assignment.dueDate).toLocaleDateString()} at ${new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span className={submitted ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                    {submitted ? 'Submitted' : 'Not Submitted'}
                </span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs font-medium px-3 py-1 ${phase.color}`}>
              <span className="mr-1">{phase.icon}</span>
              {phase.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Assignment Description */}
            {assignment.description && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {assignment.description}
              </p>
            </div>
          )}

          {/* Phase Timeline */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Assignment Timeline</h4>
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className={`flex items-center space-x-1 ${phase.phase === 'upcoming' ? 'text-blue-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${phase.phase === 'upcoming' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span>Upcoming</span>
              </div>
              <div className="flex-1 h-px bg-gray-300" />
              <div className={`flex items-center space-x-1 ${phase.phase === 'submission' ? 'text-green-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${phase.phase === 'submission' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Submission</span>
              </div>
              <div className="flex-1 h-px bg-gray-300" />
              <div className={`flex items-center space-x-1 ${phase.phase === 'evaluation' ? 'text-blue-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${phase.phase === 'evaluation' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span>Evaluation</span>
              </div>
              <div className="flex-1 h-px bg-gray-300" />
              <div className={`flex items-center space-x-1 ${phase.phase === 'completed' ? 'text-purple-600 font-medium' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${phase.phase === 'completed' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                <span>Completed</span>
              </div>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Submission Info */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Submission Details
              </h5>
              <div className="space-y-2">
            <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium">
                    {assignment.dueDate ? `${new Date(assignment.dueDate).toLocaleDateString()} at ${new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}
                  </span>
              </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Left:</span>
                  <span className={`text-sm font-bold ${getUrgencyColor(assignment.dueDate)}`}>
                    {assignment.dueDate ? getTimeRemaining(assignment.dueDate) : 'TBD'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="flex items-center space-x-1">
                    {submitted ? (
                      <>
                        <span className="text-green-600">✅</span>
                        <span className="text-sm text-green-600 font-medium">Submitted</span>
                      </>
                    ) : (
                      <>
                        <span className="text-orange-500">⚠️</span>
                        <span className="text-sm text-orange-500 font-medium">Not Submitted</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation Info */}
            {assignment.evaluationStartDate && assignment.evaluationDueDate && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Evaluation Details
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="text-sm font-medium">
                      {new Date(assignment.evaluationStartDate).toLocaleDateString()} - {new Date(assignment.evaluationDueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time Left:</span>
                    <span className={`text-sm font-bold ${getUrgencyColor(assignment.evaluationDueDate)}`}>
                      {getTimeRemaining(assignment.evaluationDueDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center space-x-1">
                      {phase.phase === 'evaluation' ? (
                        <>
                          <span className="text-blue-600">👥</span>
                          <span className="text-sm text-blue-600 font-medium">Active</span>
                        </>
                      ) : phase.phase === 'completed' ? (
                        <>
                          <span className="text-purple-600">✅</span>
                          <span className="text-sm text-purple-600 font-medium">Complete</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">⏰</span>
                          <span className="text-sm text-gray-500 font-medium">Not Started</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Required Alert */}
          {phase.phase === 'submission' && !submitted && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center text-orange-800 dark:text-orange-200">
                <span className="text-xl mr-3">⚠️</span>
                <div>
                  <p className="font-medium">Action Required</p>
                  <p className="text-sm">Submit your assignment before the deadline</p>
                </div>
              </div>
            </div>
          )}

          {phase.phase === 'evaluation' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center text-blue-800 dark:text-blue-200">
                <span className="text-xl mr-3">👥</span>
                <div>
                  <p className="font-medium">Evaluation Phase Active</p>
                  <p className="text-sm">Invest tokens in other teams' submissions to complete evaluations</p>
                </div>
              </div>
            </div>
          )}

          {phase.phase === 'completed' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center text-green-800 dark:text-green-200">
                <span className="text-xl mr-3">✅</span>
                <div>
                  <p className="font-medium">Assignment Completed</p>
                  <p className="text-sm">This assignment is fully completed and graded</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {assignment.isActive && (
                  <Button 
                    size="sm"
                variant={submitted ? "outline" : "default"}
                    onClick={(e) => handleAction(e, 'submit')}
                className="flex items-center space-x-1"
              >
                <span>{submitted ? '👁️' : '📝'}</span>
                <span>{submitted ? 'View Submission' : 'Submit Work'}</span>
                  </Button>
                )}
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleAction(e, 'view-grades')}
              className="flex items-center space-x-1"
                >
              <span>📊</span>
              <span>View Grades & Feedback</span>
                </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ExpandableSubmissionCard({ submission, assignment }: ExpandableSubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusBadge = () => {
    if (submission.status === 'submitted') {
      return <Badge className="bg-green-600">Submitted</Badge>
    } else {
      return <Badge variant="secondary">Draft</Badge>
    }
  }


  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <Badge variant="outline" className="text-xs">
                Submission
              </Badge>
            </div>
            <div>
              <CardTitle className="text-lg">
                Submission for {assignment.title}
              </CardTitle>
              <CardDescription className="flex items-center space-x-4 mt-1">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Submitted: {submission.submittedAt ? `${new Date(submission.submittedAt).toLocaleDateString()} ${new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Draft'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>{submission.status}</span>
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {submission.description && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {submission.description}
                </p>
              </div>
            )}

            {submission.content && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Content</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {submission.content}
                  </p>
                </div>
              </div>
            )}

            {(submission.primaryLink || submission.backupLink) && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Links</h4>
                <div className="space-y-2">
                  {submission.primaryLink && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Primary:</span>
                      <a 
                        href={submission.primaryLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        {submission.primaryLink}
                      </a>
                    </div>
                  )}
                  {submission.backupLink && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Backup:</span>
                      <a 
                        href={submission.backupLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        {submission.backupLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {submission.fileUrl && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">File</h4>
                <a 
                  href={submission.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Download File
                </a>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
              <span>
                Status: <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                  {submission.status}
                </Badge>
              </span>
              <span>
                Assignment: {assignment.title}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ExpandableEvaluationCard({ assignment, assignmentNumber, currentUserId }: ExpandableEvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusBadge = () => {
    if (assignment.isActive) {
      return <Badge className="bg-blue-600">Active</Badge>
    } else if (assignment.isEvaluationActive) {
      return <Badge variant="secondary">Evaluation</Badge>
    } else {
      return <Badge variant="outline">Inactive</Badge>
    }
  }

  const getAssignmentStatus = () => {
    const now = new Date()
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
    
    if (dueDate && dueDate < now) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    return null
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <Badge variant="outline" className="text-xs">
                Assignment {assignmentNumber}
              </Badge>
            </div>
            <div>
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription className="flex items-center space-x-4 mt-1">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Due: {assignment.dueDate ? `${new Date(assignment.dueDate).toLocaleDateString()} ${new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>Click to view evaluations</span>
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {getAssignmentStatus()}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <IndividualEvaluationDashboard
            assignmentId={assignment.id}
            currentUserId={currentUserId}
          />
        </CardContent>
      )}
    </Card>
  )
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
  const [activeTab, setActiveTab] = useState('pipeline')

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

  // Check if team editing should be allowed
  // Allow editing if:
  // 1. Student has a team, AND
  // 2. Either assignment is not yet submitted OR assignment is completed with grades
  const canEditTeam = useMemo(() => {
    if (teams.length === 0) return false
    
    return assignments.some(assignment => {
      // Check if this assignment has been submitted by the student's team
      const teamSubmission = submissions.find(sub => 
        sub.assignmentId === assignment.id && 
        sub.teamId === teams[0].id && 
        sub.status === 'submitted'
      )
      
      // If not submitted yet, allow editing
      if (!teamSubmission) {
        return true
      }
      
      // If submitted, only allow editing if assignment is completed (has grades)
      const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
      if (assignmentGrades.length > 0) {
        return true
      }
      
      // Check if evaluation phase has ended
      const now = new Date()
      const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null
      if (evaluationDueDate && now > evaluationDueDate && !assignment.isEvaluationActive) {
        return true
      }
      
      return false
    })
  }, [assignments, grades, submissions, teams])

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
    return `${dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
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


  const getAverageGrade = () => {
    if (grades.length === 0) return 0
    
    // Filter grades for the current user's team only
    const userTeamGrades = grades.filter((grade: any) => 
      grade.team && grade.team.members && grade.team.members.includes(currentUserId)
    )
    
    if (userTeamGrades.length === 0) return 0
    
    const totalPercentage = userTeamGrades.reduce((sum, grade) => sum + (grade.percentage || 0), 0)
    return Math.round(totalPercentage / userTeamGrades.length)
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
            <CardTitle className="text-sm font-medium">Your Average Grade</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageGrade()}%</div>
            <p className="text-xs text-muted-foreground">
              Across your team's assignments
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="pipeline" className="text-xs sm:text-sm whitespace-nowrap">Pipeline</TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs sm:text-sm whitespace-nowrap">Assignments</TabsTrigger>
            <TabsTrigger value="evaluations" className="text-xs sm:text-sm whitespace-nowrap">My Evaluations</TabsTrigger>
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
            onAssignmentAction={(assignment: Assignment, action: 'submit' | 'view-grades') => {
              if (action === 'submit') {
                setSelectedAssignment(assignment)
                setShowSubmitModal(true)
              } else if (action === 'view-grades') {
                setActiveTab('grades')
              }
            }}
          />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Course Assignments</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any assignment to view details and take actions.
            </p>
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
                <ExpandableAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  assignmentNumber={assignments.indexOf(assignment) + 1}
                  currentUserId={currentUserId}
                  submissions={submissions}
                  teams={teams}
                  onAssignmentAction={(assignment, action) => {
                    if (action === 'submit') {
                      setSelectedAssignment(assignment)
                      setShowSubmitModal(true)
                    } else if (action === 'view-grades') {
                      setActiveTab('grades')
                    }
                  }}
                />
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
                  <ExpandableEvaluationCard
                    key={assignment.id}
                    assignment={assignment}
                    assignmentNumber={assignments.indexOf(assignment) + 1}
                    currentUserId={currentUserId}
                  />
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


        <TabsContent value="submissions" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Submissions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any submission to view details and status.
            </p>
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
              submissions.map((submission) => {
                const assignment = assignments.find(a => a.id === submission.assignmentId)
                return (
                  <ExpandableSubmissionCard
                    key={submission.id}
                    submission={submission}
                    assignment={assignment || { id: submission.assignmentId, title: 'Unknown Assignment' } as Assignment}
                  />
                )
              })
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
          allowEditing={canEditTeam}
          teamData={selectedTeam}
          currentUserEmail={currentUserEmail}
          onTeamUpdated={fetchCourseData}
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
