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
  Play, 
  Pause,
  Users,
  FileText,
  DollarSign,
  Trophy
} from 'lucide-react'
import type { Assignment, Team, Submission, Investment, Grade } from '@/types'

interface AssignmentTimelineProps {
  assignments: Assignment[]
  teams: Team[]
  submissions: Submission[]
  investments: Investment[]
  grades: Grade[]
  onDistributeAssignment: (assignment: Assignment) => void
  onEditAssignment: (assignment: Assignment) => void
  distributing: string | null
  distributionStatus: Record<string, boolean>
}

export function AssignmentTimeline({
  assignments,
  teams,
  submissions,
  investments,
  grades,
  onDistributeAssignment,
  onEditAssignment,
  distributing,
  distributionStatus
}: AssignmentTimelineProps) {
  const [currentPhase, setCurrentPhase] = useState<'submission' | 'evaluation' | 'grading' | 'completed'>('submission')

  // Sort assignments by creation date
  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date()
    const startDate = new Date(assignment.startDate)
    const dueDate = new Date(assignment.dueDate)
    const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
    const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null

    // Check if assignment has grades (indicating completion)
    const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
    if (assignmentGrades.length > 0) {
      return { status: 'completed', phase: 'completed', color: 'bg-purple-100 text-purple-600' }
    }

    // Check if assignment is completed (evaluation phase has ended)
    if (evaluationDueDate && now > evaluationDueDate && !assignment.isEvaluationActive) {
      return { status: 'completed', phase: 'completed', color: 'bg-purple-100 text-purple-600' }
    }

    // Check if assignment is in evaluation period
    if (assignment.isEvaluationActive && evaluationStartDate && now >= evaluationStartDate && (!evaluationDueDate || now <= evaluationDueDate)) {
      return { status: 'evaluation', phase: 'evaluation', color: 'bg-blue-100 text-blue-600' }
    }

    // Check if assignment is active (in submission period)
    if (assignment.isActive && now >= startDate && now <= dueDate) {
      return { status: 'active', phase: 'submission', color: 'bg-green-100 text-green-600' }
    }

    // Check if submission period has ended but evaluation hasn't started
    if (now > dueDate && !assignment.isEvaluationActive) {
      return { status: 'submission-closed', phase: 'submission', color: 'bg-orange-100 text-orange-600' }
    }

    // Check if assignment is not active yet (before start date)
    if (!assignment.isActive && now < startDate) {
      return { status: 'upcoming', phase: 'submission', color: 'bg-gray-100 text-gray-600' }
    }

    // Default to draft for inactive assignments
    if (!assignment.isActive) {
      return { status: 'draft', phase: 'submission', color: 'bg-gray-100 text-gray-600' }
    }

    return { status: 'unknown', phase: 'submission', color: 'bg-gray-100 text-gray-600' }
  }

  const getAssignmentStats = (assignment: Assignment) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id)
    const assignmentInvestments = investments.filter(i => i.assignmentId === assignment.id)
    const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
    
    return {
      totalSubmissions: assignmentSubmissions.length,
      submittedSubmissions: assignmentSubmissions.filter(s => s.status === 'submitted').length,
      totalInvestments: assignmentInvestments.length,
      totalInvestmentAmount: assignmentInvestments.reduce((sum, i) => sum + (i.amount || 0), 0),
      totalGrades: assignmentGrades.length,
      averageGrade: assignmentGrades.length > 0 ? 
        assignmentGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / assignmentGrades.length : 0
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'submission': return <FileText className="h-4 w-4" />
      case 'evaluation': return <Users className="h-4 w-4" />
      case 'grading': return <Trophy className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'submission': return 'text-green-600'
      case 'evaluation': return 'text-blue-600'
      case 'grading': return 'text-purple-600'
      case 'completed': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assignment Timeline
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track all 6 assignments through their complete lifecycle
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Current Phase:</span>
          <Badge variant="outline" className={getPhaseColor(currentPhase)}>
            {getPhaseIcon(currentPhase)}
            <span className="ml-1 capitalize">{currentPhase}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedAssignments.map((assignment, index) => {
          const assignmentStatus = getAssignmentStatus(assignment)
          const stats = getAssignmentStats(assignment)
          const isDistributed = distributionStatus[assignment.id]
          const isDistributing = distributing === assignment.id

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
                        {assignmentStatus.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {assignment.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditAssignment(assignment)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Timeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Submission Period</span>
                    <span className="font-medium">
                      {new Date(assignment.startDate).toLocaleDateString()} {new Date(assignment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {assignment.evaluationStartDate && assignment.evaluationDueDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Evaluation Period</span>
                      <span className="font-medium">
                        {new Date(assignment.evaluationStartDate).toLocaleDateString()} {new Date(assignment.evaluationStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(assignment.evaluationDueDate).toLocaleDateString()} {new Date(assignment.evaluationDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{Math.round((stats.submittedSubmissions / Math.max(teams.length, 1)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(stats.submittedSubmissions / Math.max(teams.length, 1)) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{stats.submittedSubmissions}/{teams.length} submissions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>{stats.totalInvestmentAmount} tokens</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{stats.totalInvestments} evaluations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    <span>{stats.averageGrade.toFixed(1)}% avg</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {assignmentStatus.phase === 'submission' && !isDistributed && (
                    <Button
                      size="sm"
                      onClick={() => onDistributeAssignment(assignment)}
                      disabled={isDistributing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isDistributing ? (
                        <>
                          <Clock className="h-4 w-4 mr-1 animate-spin" />
                          Setting Deadline...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Set Deadline & Distribute
                        </>
                      )}
                    </Button>
                  )}

                  {isDistributed && (
                    <div className="flex items-center justify-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Distributed for Evaluation
                    </div>
                  )}

                  {assignmentStatus.phase === 'evaluation' && (
                    <div className="flex items-center justify-center text-blue-600 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      Evaluation in Progress
                    </div>
                  )}

                  {assignmentStatus.phase === 'completed' && (
                    <div className="flex items-center justify-center text-purple-600 text-sm">
                      <Trophy className="h-4 w-4 mr-1" />
                      Completed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            Summary of all assignments across the course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter(a => getAssignmentStatus(a).phase === 'submission').length}
              </div>
              <div className="text-sm text-gray-500">Active Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {assignments.filter(a => getAssignmentStatus(a).phase === 'evaluation').length}
              </div>
              <div className="text-sm text-gray-500">In Evaluation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {assignments.filter(a => getAssignmentStatus(a).phase === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(distributionStatus).filter(Boolean).length}
              </div>
              <div className="text-sm text-gray-500">Distributed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
