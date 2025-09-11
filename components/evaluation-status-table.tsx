'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, User, Users } from 'lucide-react'

interface EvaluationStatus {
  studentId: string
  studentName: string
  studentEmail: string
  totalEvaluations: number
  completedEvaluations: number
  pendingEvaluations: number
  totalInvestments: number
  completedInvestments: number
  pendingInvestments: number
  evaluationProgress: number
  investmentProgress: number
}

interface EvaluationStatusTableProps {
  assignmentId: string
}

export function EvaluationStatusTable({ assignmentId }: EvaluationStatusTableProps) {
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEvaluationStatus()
  }, [assignmentId])

  const fetchEvaluationStatus = async () => {
    try {
      setLoading(true)
      
      // Fetch evaluation status for all students
      const response = await fetch(`/api/admin/evaluation-status?assignmentId=${assignmentId}`)
      const data = await response.json()
      
      if (data.success) {
        setEvaluationStatus(data.data)
      } else {
        setError(data.error || 'Failed to fetch evaluation status')
      }
    } catch (err) {
      setError('Failed to fetch evaluation status')
      console.error('Error fetching evaluation status:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (evaluationProgress: number, investmentProgress: number) => {
    if (evaluationProgress === 100 && investmentProgress === 100) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Complete</Badge>
    } else if (evaluationProgress > 0 || investmentProgress > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><AlertCircle className="h-3 w-3 mr-1" />Not Started</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evaluation status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchEvaluationStatus} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (evaluationStatus.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No evaluation data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {evaluationStatus.map((status) => (
          <Card key={status.studentId} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <CardTitle className="text-sm font-medium">{status.studentName}</CardTitle>
                    <CardDescription className="text-xs">{status.studentEmail}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(status.evaluationProgress, status.investmentProgress)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Evaluations Progress */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Evaluations</span>
                    <span>{status.completedEvaluations}/{status.totalEvaluations}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.evaluationProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {status.pendingEvaluations} pending
                  </p>
                </div>

                {/* Investments Progress */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Investments</span>
                    <span>{status.completedInvestments}/{status.totalInvestments}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.investmentProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {status.pendingInvestments} pending
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {evaluationStatus.filter(s => s.evaluationProgress === 100).length}
              </div>
              <div className="text-sm text-gray-600">Complete Evaluations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {evaluationStatus.filter(s => s.investmentProgress === 100).length}
              </div>
              <div className="text-sm text-gray-600">Complete Investments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {evaluationStatus.filter(s => s.evaluationProgress > 0 && s.evaluationProgress < 100).length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {evaluationStatus.filter(s => s.evaluationProgress === 0 && s.investmentProgress === 0).length}
              </div>
              <div className="text-sm text-gray-600">Not Started</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
