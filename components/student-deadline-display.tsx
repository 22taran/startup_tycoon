'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Users,
  DollarSign,
  Trophy,
  AlertTriangle
} from 'lucide-react'
import type { Assignment, Submission, Investment, Team } from '@/types'

interface StudentDeadlineDisplayProps {
  assignments: Assignment[]
  submissions: Submission[]
  investments: Investment[]
  teams: Team[]
  currentUserEmail: string
}

export function StudentDeadlineDisplay({
  assignments,
  submissions,
  investments,
  teams,
  currentUserEmail
}: StudentDeadlineDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = currentTime
    const startDate = new Date(assignment.startDate)
    const dueDate = new Date(assignment.dueDate)
    const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
    const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null

    if (now < startDate) {
      return { 
        status: 'upcoming', 
        phase: 'submission', 
        color: 'bg-gray-100 text-gray-600',
        icon: <Clock className="h-4 w-4" />,
        message: 'Assignment not yet available'
      }
    } else if (now >= startDate && now <= dueDate) {
      return { 
        status: 'active', 
        phase: 'submission', 
        color: 'bg-green-100 text-green-600',
        icon: <FileText className="h-4 w-4" />,
        message: 'Submission period active'
      }
    } else if (now > dueDate && (!evaluationStartDate || now < evaluationStartDate)) {
      return { 
        status: 'submission-closed', 
        phase: 'submission', 
        color: 'bg-orange-100 text-orange-600',
        icon: <AlertCircle className="h-4 w-4" />,
        message: 'Submission period closed'
      }
    } else if (evaluationStartDate && now >= evaluationStartDate && (!evaluationDueDate || now <= evaluationDueDate)) {
      return { 
        status: 'evaluation', 
        phase: 'evaluation', 
        color: 'bg-blue-100 text-blue-600',
        icon: <Users className="h-4 w-4" />,
        message: 'Evaluation period active'
      }
    } else if (evaluationDueDate && now > evaluationDueDate) {
      return { 
        status: 'completed', 
        phase: 'completed', 
        color: 'bg-purple-100 text-purple-600',
        icon: <CheckCircle className="h-4 w-4" />,
        message: 'Assignment completed'
      }
    } else {
      return { 
        status: 'unknown', 
        phase: 'submission', 
        color: 'bg-gray-100 text-gray-600',
        icon: <Clock className="h-4 w-4" />,
        message: 'Status unknown'
      }
    }
  }

  const getTimeRemaining = (date: Date | string) => {
    const now = currentTime
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

  const getSubmissionStatus = (assignment: Assignment) => {
    const userSubmission = submissions.find(s => 
      s.assignmentId === assignment.id && 
      s.teamId && // Assuming teamId is available
      s.status === 'submitted'
    )
    
    return {
      hasSubmitted: !!userSubmission,
      submission: userSubmission
    }
  }

  const getEvaluationStatus = (assignment: Assignment) => {
    const userInvestments = investments.filter(i => 
      i.assignmentId === assignment.id && 
      i.investorId // Assuming investorId is available
    )
    
    return {
      hasEvaluated: userInvestments.length > 0,
      totalInvested: userInvestments.reduce((sum, i) => sum + (i.amount || 0), 0),
      investments: userInvestments
    }
  }

  const getUrgencyLevel = (date: Date | string) => {
    const now = currentTime
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const diff = dateObj.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 0) return 'expired'
    if (hours < 24) return 'urgent'
    if (hours < 72) return 'warning'
    return 'normal'
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'expired': return 'text-red-600'
      case 'urgent': return 'text-red-500'
      case 'warning': return 'text-orange-500'
      default: return 'text-gray-600'
    }
  }

  // Sort assignments by due date
  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assignment Deadlines
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your assignment progress and upcoming deadlines
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {currentTime.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAssignments.map((assignment, index) => {
          const assignmentStatus = getAssignmentStatus(assignment)
          const submissionStatus = getSubmissionStatus(assignment)
          const evaluationStatus = getEvaluationStatus(assignment)
          const dueDateUrgency = getUrgencyLevel(assignment.dueDate)
          const evaluationDueDateUrgency = assignment.evaluationDueDate ? 
            getUrgencyLevel(assignment.evaluationDueDate) : 'normal'

          return (
            <Card key={assignment.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Assignment {index + 1}
                      </Badge>
                      <Badge className={`text-xs ${assignmentStatus.color}`}>
                        {assignmentStatus.icon}
                        <span className="ml-1">{assignmentStatus.status.replace('-', ' ')}</span>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {assignment.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Submission Deadline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Submission Deadline
                    </span>
                    <span className={`text-sm font-bold ${getUrgencyColor(dueDateUrgency)}`}>
                      {getTimeRemaining(assignment.dueDate)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(assignment.dueDate).toLocaleString()}
                  </div>
                  
                  {/* Submission Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center space-x-1">
                      {submissionStatus.hasSubmitted ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Submitted</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-500">Not Submitted</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Evaluation Deadline */}
                {assignment.evaluationStartDate && assignment.evaluationDueDate && (
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Evaluation Deadline
                      </span>
                      <span className={`text-sm font-bold ${getUrgencyColor(evaluationDueDateUrgency)}`}>
                        {getTimeRemaining(assignment.evaluationDueDate)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(assignment.evaluationStartDate).toLocaleString()} - {new Date(assignment.evaluationDueDate).toLocaleString()}
                    </div>
                    
                    {/* Evaluation Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="flex items-center space-x-1">
                        {evaluationStatus.hasEvaluated ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              Evaluated ({evaluationStatus.totalInvested} tokens)
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Not Evaluated</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Indicator */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Progress</span>
                    <span>
                      {submissionStatus.hasSubmitted && evaluationStatus.hasEvaluated ? '100%' :
                       submissionStatus.hasSubmitted ? '50%' : '0%'}
                    </span>
                  </div>
                  <Progress 
                    value={submissionStatus.hasSubmitted && evaluationStatus.hasEvaluated ? 100 :
                           submissionStatus.hasSubmitted ? 50 : 0} 
                    className="h-2"
                  />
                </div>

                {/* Action Required */}
                {assignmentStatus.phase === 'submission' && !submissionStatus.hasSubmitted && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-orange-600 text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>Action Required: Submit your assignment</span>
                    </div>
                  </div>
                )}

                {assignmentStatus.phase === 'evaluation' && !evaluationStatus.hasEvaluated && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-blue-600 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Action Required: Complete your evaluations</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress Summary</CardTitle>
          <CardDescription>
            Overview of your assignment completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  // Filter submissions to only show those from the current user's team
                  const userTeamSubmissions = teams.length > 0 
                    ? submissions.filter(s => s.status === 'submitted' && s.teamId === teams[0].id)
                    : []
                  return userTeamSubmissions.length
                })()}
              </div>
              <div className="text-sm text-gray-500">Assignments Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {investments.length}
              </div>
              <div className="text-sm text-gray-500">Evaluations Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {investments.reduce((sum, i) => sum + (i.amount || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total Tokens Invested</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
