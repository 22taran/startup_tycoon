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
  Trophy,
  Edit,
  Settings,
  Upload,
  Target
} from 'lucide-react'
import type { Assignment, Submission, Investment, Grade } from '@/types'

interface StudentAssignmentKanbanProps {
  assignments: Assignment[]
  submissions: Submission[]
  investments: Investment[]
  grades: Grade[]
  currentUserEmail: string
  onAssignmentAction: (assignment: Assignment, action: 'submit' | 'invest' | 'view-grades') => void
}

type AssignmentStage = 'to-do' | 'in-progress' | 'evaluation' | 'completed'

interface StageConfig {
  title: string
  color: string
  bgColor: string
  icon: React.ReactNode
  description: string
}

const STAGE_CONFIG: Record<AssignmentStage, StageConfig> = {
  'to-do': {
    title: 'To Do',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <FileText className="h-4 w-4" />,
    description: 'Assignments ready for submission'
  },
  'in-progress': {
    title: 'In Progress',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: <Play className="h-4 w-4" />,
    description: 'Assignments in submission phase'
  },
  'evaluation': {
    title: 'Evaluation',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: <Users className="h-4 w-4" />,
    description: 'Time to evaluate other teams'
  },
  'completed': {
    title: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Assignments fully completed'
  }
}

export function StudentAssignmentKanban({
  assignments,
  submissions,
  investments,
  grades,
  currentUserEmail,
  onAssignmentAction
}: StudentAssignmentKanbanProps) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    setLastRefresh(new Date())
  }, [assignments, submissions, investments, grades])

  // Determine assignment stage based on student perspective
  const getAssignmentStage = (assignment: Assignment): AssignmentStage => {
    const now = new Date()
    const startDate = new Date(assignment.startDate)
    const dueDate = new Date(assignment.dueDate)
    const evaluationStartDate = assignment.evaluationStartDate ? new Date(assignment.evaluationStartDate) : null
    const evaluationDueDate = assignment.evaluationDueDate ? new Date(assignment.evaluationDueDate) : null

    // Check if assignment has grades (indicating completion)
    const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
    if (assignmentGrades.length > 0) {
      return 'completed'
    }

    // Check if assignment is completed (evaluation phase has ended)
    if (evaluationDueDate && now > evaluationDueDate && !assignment.isEvaluationActive) {
      return 'completed'
    }

    // Check if assignment is in evaluation period
    if (assignment.isEvaluationActive && evaluationStartDate && now >= evaluationStartDate && (!evaluationDueDate || now <= evaluationDueDate)) {
      return 'evaluation'
    }

    // Check if assignment is active (in submission period)
    if (assignment.isActive && now >= startDate && now <= dueDate) {
      return 'in-progress'
    }

    // Check if submission period has ended but evaluation hasn't started
    if (now > dueDate && !assignment.isEvaluationActive) {
      return 'evaluation'
    }

    // Check if assignment is not active yet (before start date)
    if (!assignment.isActive && now < startDate) {
      return 'to-do'
    }

    // Default to to-do for inactive assignments
    if (!assignment.isActive) {
      return 'to-do'
    }

    return 'to-do'
  }

  // Get assignment statistics from student perspective
  const getAssignmentStats = (assignment: Assignment) => {
    const isSubmitted = submissions.some(s => s.assignmentId === assignment.id && s.status === 'submitted')
    const hasInvested = investments.some(i => i.assignmentId === assignment.id)
    const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
    
    return {
      isSubmitted,
      hasInvested,
      totalGrades: assignmentGrades.length,
      averageGrade: assignmentGrades.length > 0 ? 
        assignmentGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / assignmentGrades.length : 0
    }
  }

  // Group assignments by stage
  const assignmentsByStage = assignments.reduce((acc, assignment) => {
    const stage = getAssignmentStage(assignment)
    if (!acc[stage]) {
      acc[stage] = []
    }
    acc[stage].push(assignment)
    return acc
  }, {} as Record<AssignmentStage, Assignment[]>)

  // Sort assignments within each stage by creation date
  Object.keys(assignmentsByStage).forEach(stage => {
    assignmentsByStage[stage as AssignmentStage].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderAssignmentCard = (assignment: Assignment) => {
    const stage = getAssignmentStage(assignment)
    const stats = getAssignmentStats(assignment)

    return (
      <Card 
        key={assignment.id}
        className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium line-clamp-2">
                {assignment.title}
              </CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {assignment.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {stage === 'to-do' ? 'Ready' : 
               stage === 'in-progress' ? 'Active' :
               stage === 'evaluation' ? 'Evaluation' : 'Completed'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Dates */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Start</span>
              <span className="font-medium">
                {formatDate(assignment.startDate.toString())}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Due</span>
              <span className="font-medium">
                {formatDate(assignment.dueDate.toString())}
              </span>
            </div>
            {assignment.evaluationStartDate && assignment.evaluationDueDate && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Eval Start</span>
                  <span className="font-medium">
                    {formatDate(assignment.evaluationStartDate.toString())}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Eval Due</span>
                  <span className="font-medium">
                    {formatDate(assignment.evaluationDueDate.toString())}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Student Status */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-gray-400" />
              <span>{stats.isSubmitted ? 'Submitted' : 'Not Submitted'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3 text-gray-400" />
              <span>{stats.hasInvested ? 'Invested' : 'Not Invested'}</span>
            </div>
            {stats.totalGrades > 0 && (
              <div className="flex items-center space-x-1 col-span-2">
                <Trophy className="h-3 w-3 text-gray-400" />
                <span>Grade: {stats.averageGrade.toFixed(0)}%</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-gray-100">
            {stage === 'to-do' && (
              <div className="flex items-center justify-center text-blue-600 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Not Started Yet
              </div>
            )}

            {stage === 'in-progress' && (
              <Button
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => onAssignmentAction(assignment, 'submit')}
                disabled={stats.isSubmitted}
              >
                {stats.isSubmitted ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Submitted
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    Submit Work
                  </>
                )}
              </Button>
            )}

            {stage === 'evaluation' && (
              <div className="space-y-2">
                {!stats.isSubmitted && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-7"
                    onClick={() => onAssignmentAction(assignment, 'submit')}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Submit Work
                  </Button>
                )}
                <Button
                  size="sm"
                  className="w-full text-xs h-7 bg-purple-600 hover:bg-purple-700"
                  onClick={() => onAssignmentAction(assignment, 'invest')}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Invest in Teams
                </Button>
              </div>
            )}

            {stage === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7"
                onClick={() => onAssignmentAction(assignment, 'view-grades')}
              >
                <Trophy className="h-3 w-3 mr-1" />
                View Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderStageColumn = (stage: AssignmentStage) => {
    const config = STAGE_CONFIG[stage]
    const stageAssignments = assignmentsByStage[stage] || []

    return (
      <div
        key={stage}
        className={`flex-1 min-w-0 ${config.bgColor} rounded-lg border-2 border-dashed p-4`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={config.color}>
              {config.icon}
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${config.color}`}>
                {config.title}
              </h3>
              <p className="text-xs text-gray-500">
                {stageAssignments.length} assignment{stageAssignments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {stageAssignments.length}
          </Badge>
        </div>

        <div className="space-y-2 min-h-[200px]">
          {stageAssignments.map(renderAssignmentCard)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Assignment Pipeline
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your assignments and progress
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Total: {assignments.length} assignments</span>
            <span>•</span>
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.keys(STAGE_CONFIG).map(stage => 
          renderStageColumn(stage as AssignmentStage)
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Summary</CardTitle>
          <CardDescription>
            Overview of your assignments across all stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
              const count = assignmentsByStage[stage as AssignmentStage]?.length || 0
              return (
                <div key={stage} className="text-center">
                  <div className={`text-2xl font-bold ${config.color}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-500">{config.title}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
