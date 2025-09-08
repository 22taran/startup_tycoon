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
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import type { Assignment, Team, Submission, Investment, Grade } from '@/types'

interface AssignmentKanbanProps {
  assignments: Assignment[]
  teams: Team[]
  submissions: Submission[]
  investments: Investment[]
  grades: Grade[]
  onDistributeAssignment: (assignment: Assignment) => void
  onEditAssignment: (assignment: Assignment) => void
  distributing: string | null
  distributionStatus: Record<string, boolean>
  onRefresh?: () => void
}

type AssignmentStage = 'draft' | 'active' | 'submitted' | 'evaluation' | 'completed'

interface StageConfig {
  title: string
  color: string
  bgColor: string
  icon: React.ReactNode
  description: string
}

const STAGE_CONFIG: Record<AssignmentStage, StageConfig> = {
  draft: {
    title: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <Edit className="h-4 w-4" />,
    description: 'Assignment created but not yet active'
  },
  active: {
    title: 'Active',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: <Play className="h-4 w-4" />,
    description: 'Assignment is live and accepting submissions'
  },
  submitted: {
    title: 'Submitted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <FileText className="h-4 w-4" />,
    description: 'Submission period ended, ready for evaluation'
  },
  evaluation: {
    title: 'Evaluation',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: <Users className="h-4 w-4" />,
    description: 'Students are evaluating submissions'
  },
  completed: {
    title: 'Completed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <CheckCircle className="h-4 w-4" />,
    description: 'Assignment fully completed and graded'
  }
}

export function AssignmentKanban({
  assignments,
  teams,
  submissions,
  investments,
  grades,
  onDistributeAssignment,
  onEditAssignment,
  distributing,
  distributionStatus,
  onRefresh
}: AssignmentKanbanProps) {
  const [draggedAssignment, setDraggedAssignment] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Debug logging for data changes
  useEffect(() => {
    console.log('🔄 Kanban data updated:', {
      assignments: assignments.length,
      submissions: submissions.length,
      investments: investments.length,
      teams: teams.length,
      grades: grades.length
    })
    console.log('📊 All submissions:', submissions)
    console.log('📊 All investments:', investments)
    setLastRefresh(new Date())
  }, [assignments, submissions, investments, teams, grades])

  // Determine assignment stage based on dates and status
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
      return 'active'
    }

    // Check if submission period has ended but evaluation hasn't started
    if (now > dueDate && !assignment.isEvaluationActive) {
      return 'submitted'
    }

    // Check if assignment is not active yet (before start date)
    if (!assignment.isActive && now < startDate) {
      return 'draft'
    }

    // Default to draft for inactive assignments
    if (!assignment.isActive) {
      return 'draft'
    }

    return 'draft'
  }

  // Get assignment statistics
  const getAssignmentStats = (assignment: Assignment) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id)
    const assignmentInvestments = investments.filter(i => i.assignmentId === assignment.id)
    const assignmentGrades = grades.filter(g => g.assignmentId === assignment.id)
    
    // Debug logging
    console.log(`📊 Assignment ${assignment.title} stats:`, {
      assignmentId: assignment.id,
      totalSubmissions: assignmentSubmissions.length,
      submittedSubmissions: assignmentSubmissions.filter(s => s.status === 'submitted').length,
      allSubmissions: assignmentSubmissions,
      submissionStatuses: assignmentSubmissions.map(s => ({ id: s.id, status: s.status, assignmentId: s.assignmentId })),
      totalInvestments: assignmentInvestments.length,
      totalInvestmentAmount: assignmentInvestments.reduce((sum, i) => sum + (i.amount || 0), 0)
    })
    
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

  const handleDragStart = (e: React.DragEvent, assignmentId: string) => {
    setDraggedAssignment(assignmentId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetStage: AssignmentStage) => {
    e.preventDefault()
    if (draggedAssignment) {
      // Here you could implement stage transitions
      // For now, we'll just reset the drag state
      setDraggedAssignment(null)
    }
  }

  const renderAssignmentCard = (assignment: Assignment) => {
    const stage = getAssignmentStage(assignment)
    const stats = getAssignmentStats(assignment)
    const isDistributed = distributionStatus[assignment.id]
    const isDistributing = distributing === assignment.id

    return (
      <Card 
        key={assignment.id}
        className={`mb-4 cursor-move hover:shadow-md transition-shadow ${
          draggedAssignment === assignment.id ? 'opacity-50' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, assignment.id)}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditAssignment(assignment)}
              className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Dates */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Start</span>
              <span className="font-medium">
                {new Date(assignment.startDate).toLocaleDateString()} {new Date(assignment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Due</span>
              <span className="font-medium">
                {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {assignment.evaluationStartDate && assignment.evaluationDueDate && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Eval Start</span>
                  <span className="font-medium">
                    {new Date(assignment.evaluationStartDate).toLocaleDateString()} {new Date(assignment.evaluationStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Eval Due</span>
                  <span className="font-medium">
                    {new Date(assignment.evaluationDueDate).toLocaleDateString()} {new Date(assignment.evaluationDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Progress */}
          {stage === 'active' || stage === 'submitted' ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Submissions</span>
                <span>{stats.submittedSubmissions}/{teams.length}</span>
              </div>
              <Progress 
                value={(stats.submittedSubmissions / Math.max(teams.length, 1)) * 100} 
                className="h-1"
              />
            </div>
          ) : null}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-gray-400" />
              <span>{stats.submittedSubmissions}/{stats.totalSubmissions}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3 text-gray-400" />
              <span>{stats.totalInvestmentAmount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span>{stats.totalInvestments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Trophy className="h-3 w-3 text-gray-400" />
              <span>{stats.averageGrade.toFixed(0)}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-gray-100">
            {stage === 'draft' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7"
                onClick={() => onDistributeAssignment(assignment)}
                disabled={isDistributing}
              >
                {isDistributing ? (
                  <>
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Activate
                  </>
                )}
              </Button>
            )}

            {stage === 'submitted' && !isDistributed && (
              <Button
                size="sm"
                className="w-full text-xs h-7 bg-blue-600 hover:bg-blue-700"
                onClick={() => onDistributeAssignment(assignment)}
                disabled={isDistributing}
              >
                {isDistributing ? (
                  <>
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Distributing...
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3 mr-1" />
                    Start Evaluation
                  </>
                )}
              </Button>
            )}

            {isDistributed && (
              <div className="flex items-center justify-center text-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Distributed
              </div>
            )}

            {stage === 'submitted' && isDistributed && (
              <div className="flex items-center justify-center text-blue-600 text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Ready for Evaluation
              </div>
            )}

            {stage === 'evaluation' && (
              <div className="flex items-center justify-center text-purple-600 text-xs">
                <Users className="h-3 w-3 mr-1" />
                In Progress
              </div>
            )}

            {stage === 'completed' && (
              <div className="flex items-center justify-center text-gray-600 text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Completed
              </div>
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
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, stage)}
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
            Assignment Pipeline
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track assignments through their complete lifecycle
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Total: {assignments.length} assignments</span>
            <span>•</span>
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          )}
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
            Overview of assignments across all stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
