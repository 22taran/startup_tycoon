'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Coins,
  Users,
  Calendar
} from 'lucide-react'
import { InvestmentModal } from './investment-modal'

interface EvaluationAssignment {
  id: string
  assignmentId: string
  submissionId: string
  teamId: string
  isComplete: boolean
  assignment: {
    id: string
    title: string
    description: string
    dueDate: string
    isActive: boolean
  }
  submission: {
    id: string
    primaryLink: string
    backupLink: string
    status: string
    submittedAt: string
  }
  team: {
    id: string
    name: string
    members: string[]
  }
}

interface EvaluationAssignmentsProps {
  currentUserEmail: string
  onDataRefresh?: () => void
}

export function EvaluationAssignments({ currentUserEmail, onDataRefresh }: EvaluationAssignmentsProps) {
  const [evaluations, setEvaluations] = useState<EvaluationAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationAssignment | null>(null)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  const [remainingTokens, setRemainingTokens] = useState<number>(100)

  useEffect(() => {
    fetchEvaluations()
    fetchRemainingTokens()
  }, [])

  const fetchRemainingTokens = async () => {
    try {
      // Get the first assignment ID from evaluations to fetch tokens
      if (evaluations.length > 0) {
        const assignmentId = evaluations[0].assignmentId
        const response = await fetch(`/api/investments/tokens?assignmentId=${assignmentId}`)
        if (response.ok) {
          const data = await response.json()
          setRemainingTokens(data.data?.remainingTokens || 100)
        }
      }
    } catch (error) {
      console.error('Error fetching remaining tokens:', error)
    }
  }

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluations')
      const data = await response.json()
      
      if (data.success) {
        setEvaluations(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch evaluations')
      }
    } catch (err) {
      setError('Failed to fetch evaluations')
      console.error('Error fetching evaluations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvest = (evaluation: EvaluationAssignment) => {
    setSelectedEvaluation(evaluation)
    setShowInvestmentModal(true)
  }

  const handleInvestmentSuccess = () => {
    // Refresh the evaluations list
    fetchEvaluations()
    // Refresh remaining tokens
    fetchRemainingTokens()
    // Also refresh the parent dashboard data
    onDataRefresh?.()
  }

  const getStatusBadge = (evaluation: EvaluationAssignment) => {
    if (evaluation.isComplete) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
  }

  const getAssignmentStatus = (assignment: EvaluationAssignment['assignment']) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    
    if (dueDate < now) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
    }
    if (assignment.isActive) {
      return <Badge variant="default" className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />Active</Badge>
    }
    return <Badge variant="outline">Inactive</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Pending Investments</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Pending Investments</h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const completedEvaluations = evaluations.filter(e => e.isComplete)
  const pendingEvaluations = evaluations.filter(e => !e.isComplete)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending Investments</h2>
          <p className="text-sm text-gray-600">Evaluate other teams' submissions (not your own team)</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Coins className="h-4 w-4" />
          <span>{remainingTokens} tokens available</span>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No evaluation assignments available. Check back later or contact your instructor.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending ({pendingEvaluations.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedEvaluations.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{evaluation.assignment?.title || 'Unknown Assignment'}</CardTitle>
                      <CardDescription>
                        {evaluation.assignment?.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(evaluation)}
                      {evaluation.assignment && getAssignmentStatus(evaluation.assignment)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Evaluating Team: {evaluation.team?.name || 'Unknown Team'}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Members: {evaluation.team?.members?.join(', ') || 'Unknown'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Due: {evaluation.assignment?.dueDate ? `${new Date(evaluation.assignment.dueDate).toLocaleDateString()} ${new Date(evaluation.assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Unknown'}</span>
                      </div>
                      {evaluation.submission?.submittedAt && (
                        <div className="text-sm text-gray-600">
                          Submitted: {new Date(evaluation.submission.submittedAt).toLocaleDateString()} {new Date(evaluation.submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(evaluation.submission?.primaryLink || evaluation.submission?.backupLink) && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Submission Links:</h4>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.submission?.primaryLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(evaluation.submission.primaryLink, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Primary Link
                          </Button>
                        )}
                        {evaluation.submission?.backupLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(evaluation.submission.backupLink, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Backup Link
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleInvest(evaluation)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Coins className="h-4 w-4 mr-2" />
                      Invest Tokens
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{evaluation.assignment?.title || 'Unknown Assignment'}</CardTitle>
                      <CardDescription>
                        {evaluation.assignment?.description || 'No description available'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(evaluation)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span>Team: {evaluation.team?.name || 'Unknown Team'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Completed on {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        assignmentId={selectedEvaluation?.assignmentId}
        teamId={selectedEvaluation?.teamId}
        onSuccess={handleInvestmentSuccess}
      />
    </div>
  )
}
