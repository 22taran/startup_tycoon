'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import { AssignmentEvaluation, AssignmentInvestment } from '@/types'

interface IndividualEvaluationDashboardProps {
  assignmentId: string
  currentUserId: string
}

export function IndividualEvaluationDashboard({ assignmentId, currentUserId }: IndividualEvaluationDashboardProps) {
  const [evaluations, setEvaluations] = useState<AssignmentEvaluation[]>([])
  const [investments, setInvestments] = useState<AssignmentInvestment[]>([])
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [investing, setInvesting] = useState<string | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState<Record<string, number>>({})
  const [isIncomplete, setIsIncomplete] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [evaluationsRes, investmentsRes, assignmentRes] = await Promise.all([
        fetch(`/api/student-evaluations?assignmentId=${assignmentId}`),
        fetch(`/api/student-investments?assignmentId=${assignmentId}`),
        fetch(`/api/assignments/${assignmentId}`)
      ])

      const [evaluationsData, investmentsData, assignmentData] = await Promise.all([
        evaluationsRes.json(),
        investmentsRes.json(),
        assignmentRes.json()
      ])

      if (evaluationsData.success) {
        setEvaluations(evaluationsData.data)
      }

      if (investmentsData.success) {
        setInvestments(investmentsData.data)
      }

      if (assignmentData.success) {
        setAssignment(assignmentData.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isInvestmentAllowed = () => {
    if (!assignment?.evaluationDueDate) return true // Allow if no evaluation due date set
    
    const evaluationDueDate = new Date(assignment.evaluationDueDate)
    const now = new Date()
    
    return now <= evaluationDueDate
  }

  const handleInvestment = async (evaluationId: string, teamId: string) => {
    const tokens = investmentAmount[teamId]
    const incomplete = isIncomplete[teamId] || false
    const comment = comments[teamId] || ''
    
    if (!tokens || tokens < 10 || tokens > 50) {
      setError('Please enter a valid investment amount (10-50 tokens)')
      return
    }

    if (incomplete && !comment.trim()) {
      setError('Please provide comments when marking assignment as incomplete')
      return
    }

    if (!isInvestmentAllowed()) {
      const evaluationDueDate = new Date(assignment.evaluationDueDate)
      setError(`Investment period has ended. Evaluation due date was ${evaluationDueDate.toLocaleDateString()} at ${evaluationDueDate.toLocaleTimeString()}`)
      return
    }

    try {
      setInvesting(teamId)
      
      const response = await fetch('/api/student-investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          teamId,
          tokens,
          isIncomplete: incomplete,
          comments: comment.trim() || null
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh data
        await fetchData()
        setInvestmentAmount(prev => ({ ...prev, [teamId]: 0 }))
        setIsIncomplete(prev => ({ ...prev, [teamId]: false }))
        setComments(prev => ({ ...prev, [teamId]: '' }))
        setError('') // Clear any previous errors
      } else {
        setError(data.error || 'Failed to process investment')
      }
    } catch (err) {
      setError('An error occurred while processing investment')
    } finally {
      setInvesting(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'late':
        return 'bg-red-100 text-red-800'
      case 'missed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getTotalInvested = () => {
    return investments.reduce((sum, inv) => sum + inv.tokensInvested, 0)
  }

  const getRemainingTokens = () => {
    return 100 - getTotalInvested()
  }

  const isAlreadyInvested = (teamId: string) => {
    return investments.some(inv => inv.investedTeamId === teamId)
  }

  const canInvestMore = () => {
    return investments.length < 3 && getRemainingTokens() >= 10
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your evaluations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5 mr-3" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Investment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Summary</CardTitle>
          <CardDescription>
            You have {getRemainingTokens()} tokens remaining out of 100
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalInvested()}</div>
              <div className="text-sm text-gray-600">Tokens Invested</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getRemainingTokens()}</div>
              <div className="text-sm text-gray-600">Tokens Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{investments.length}/3</div>
              <div className="text-sm text-gray-600">Teams Invested</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Assigned Evaluations</h3>
        
        {evaluations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No evaluations assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(evaluation.evaluationStatus)}
                      <CardTitle className="text-lg">
                        {evaluation.evaluatedTeam?.name || 'Unknown Team'}
                      </CardTitle>
                    </div>
                    <Badge className={getStatusColor(evaluation.evaluationStatus)}>
                      {evaluation.evaluationStatus}
                    </Badge>
                  </div>
                  <CardDescription>
                    Due: {new Date(evaluation.dueAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Team Members */}
                    <div>
                      <Label className="text-sm font-medium">Team Members</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {evaluation.evaluatedTeam?.members?.length || 0} members
                      </p>
                    </div>

                    {/* Submission Links */}
                    {evaluation.submission && (
                      <div>
                        <Label className="text-sm font-medium">Submission</Label>
                        <div className="space-y-2">
                          {evaluation.submission.primaryLink && (
                            <div className="flex items-center space-x-2">
                              <ExternalLink className="h-4 w-4" />
                              <a 
                                href={evaluation.submission.primaryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Primary Link
                              </a>
                            </div>
                          )}
                          {evaluation.submission.backupLink && (
                            <div className="flex items-center space-x-2">
                              <ExternalLink className="h-4 w-4" />
                              <a 
                                href={evaluation.submission.backupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Backup Link
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Investment Section */}
                    {evaluation.evaluationStatus === 'assigned' && canInvestMore() && isInvestmentAllowed() && (
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium">Investment</Label>
                        <div className="space-y-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="10"
                              max="50"
                              placeholder="10-50 tokens"
                              value={investmentAmount[evaluation.evaluatedTeamId] || ''}
                              onChange={(e) => setInvestmentAmount(prev => ({
                                ...prev,
                                [evaluation.evaluatedTeamId]: parseInt(e.target.value) || 0
                              }))}
                              className="w-32"
                            />
                            <Button
                              onClick={() => handleInvestment(evaluation.id, evaluation.evaluatedTeamId)}
                              disabled={investing === evaluation.evaluatedTeamId}
                              size="sm"
                            >
                              {investing === evaluation.evaluatedTeamId ? 'Investing...' : 'Invest'}
                            </Button>
                          </div>
                          
                          {/* Incomplete Toggle */}
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`incomplete-${evaluation.evaluatedTeamId}`}
                              checked={isIncomplete[evaluation.evaluatedTeamId] || false}
                              onCheckedChange={(checked) => setIsIncomplete(prev => ({
                                ...prev,
                                [evaluation.evaluatedTeamId]: checked
                              }))}
                            />
                            <Label htmlFor={`incomplete-${evaluation.evaluatedTeamId}`} className="text-sm">
                              Mark as incomplete
                            </Label>
                          </div>
                          
                          {/* Comments Section */}
                          {isIncomplete[evaluation.evaluatedTeamId] && (
                            <div className="space-y-2">
                              <Label htmlFor={`comments-${evaluation.evaluatedTeamId}`} className="text-sm font-medium">
                                Comments (Required for incomplete assignments)
                              </Label>
                              <Textarea
                                id={`comments-${evaluation.evaluatedTeamId}`}
                                placeholder="Please explain why this assignment is incomplete..."
                                value={comments[evaluation.evaluatedTeamId] || ''}
                                onChange={(e) => setComments(prev => ({
                                  ...prev,
                                  [evaluation.evaluatedTeamId]: e.target.value
                                }))}
                                className="min-h-[80px]"
                              />
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            Minimum: 10 tokens, Maximum: 50 tokens
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Investment Period Ended Message */}
                    {evaluation.evaluationStatus === 'assigned' && canInvestMore() && !isInvestmentAllowed() && (
                      <div className="border-t pt-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Investment period has ended
                          </p>
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                            Evaluation due date: {assignment?.evaluationDueDate ? new Date(assignment.evaluationDueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Already Invested */}
                    {isAlreadyInvested(evaluation.evaluatedTeamId) && (
                      <div className="border-t pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              Already invested {investments.find(inv => inv.investedTeamId === evaluation.evaluatedTeamId)?.tokensInvested} tokens
                            </span>
                          </div>
                          {(() => {
                            const investment = investments.find(inv => inv.investedTeamId === evaluation.evaluatedTeamId)
                            return investment?.isIncomplete && (
                              <div className="ml-6 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm text-orange-600 font-medium">Marked as incomplete</span>
                                </div>
                                {investment.comments && (
                                  <div className="ml-6 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm text-orange-700 dark:text-orange-300">
                                    <strong>Comments:</strong> {investment.comments}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Cannot Invest More */}
                    {evaluation.evaluationStatus === 'assigned' && !canInvestMore() && !isAlreadyInvested(evaluation.evaluatedTeamId) && (
                      <div className="border-t pt-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600">
                            {investments.length >= 3 ? 'Maximum 3 teams reached' : 'Insufficient tokens remaining'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
