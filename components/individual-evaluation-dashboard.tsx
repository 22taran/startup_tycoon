'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import { AssignmentEvaluation, AssignmentInvestment } from '@/types'

interface IndividualEvaluationDashboardProps {
  assignmentId: string
  currentUserId: string
}

export function IndividualEvaluationDashboard({ assignmentId, currentUserId }: IndividualEvaluationDashboardProps) {
  const [evaluations, setEvaluations] = useState<AssignmentEvaluation[]>([])
  const [investments, setInvestments] = useState<AssignmentInvestment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [investing, setInvesting] = useState<string | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [evaluationsRes, investmentsRes] = await Promise.all([
        fetch(`/api/student-evaluations?assignmentId=${assignmentId}`),
        fetch(`/api/student-investments?assignmentId=${assignmentId}`)
      ])

      const [evaluationsData, investmentsData] = await Promise.all([
        evaluationsRes.json(),
        investmentsRes.json()
      ])

      if (evaluationsData.success) {
        setEvaluations(evaluationsData.data)
      }

      if (investmentsData.success) {
        setInvestments(investmentsData.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInvestment = async (evaluationId: string, teamId: string) => {
    const tokens = investmentAmount[teamId]
    
    if (!tokens || tokens < 10 || tokens > 50) {
      alert('Please enter a valid investment amount (10-50 tokens)')
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
          tokens
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh data
        await fetchData()
        setInvestmentAmount(prev => ({ ...prev, [teamId]: 0 }))
      } else {
        alert(data.error || 'Failed to process investment')
      }
    } catch (err) {
      alert('An error occurred while processing investment')
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
                    {evaluation.evaluationStatus === 'assigned' && canInvestMore() && (
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium">Investment</Label>
                        <div className="flex items-center space-x-2 mt-2">
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
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum: 10 tokens, Maximum: 50 tokens
                        </p>
                      </div>
                    )}

                    {/* Already Invested */}
                    {isAlreadyInvested(evaluation.evaluatedTeamId) && (
                      <div className="border-t pt-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">
                            Already invested {investments.find(inv => inv.investedTeamId === evaluation.evaluatedTeamId)?.tokensInvested} tokens
                          </span>
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
