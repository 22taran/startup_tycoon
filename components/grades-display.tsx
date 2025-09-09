'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Users, Target } from 'lucide-react'

interface Grade {
  id: string
  assignmentId: string
  teamId: string
  submissionId: string
  averageInvestment: number
  grade: 'high' | 'median' | 'low' | 'incomplete'
  percentage: number
  totalInvestments: number
  team: {
    id: string
    name: string
    members: string[]
  }
  assignment?: {
    id: string
    title: string
    due_date: string
  }
}

interface GradeStatistics {
  totalTeams: number
  highGrades: number
  medianGrades: number
  lowGrades: number
  incompleteGrades: number
  averageInvestment: number
  totalInvestments: number
}

interface GradesDisplayProps {
  assignmentId?: string
  showCalculateButton?: boolean
}

export default function GradesDisplay({ assignmentId, showCalculateButton = true }: GradesDisplayProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [statistics, setStatistics] = useState<GradeStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGrades = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = assignmentId 
        ? `/api/grades?assignmentId=${assignmentId}`
        : '/api/grades'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setGrades(data.data)
      } else {
        setError(data.error || 'Failed to fetch grades')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }

  const calculateGrades = async () => {
    if (!assignmentId) return
    
    try {
      setCalculating(true)
      setError(null)
      
      const response = await fetch(`/api/assignments/${assignmentId}/calculate-grades`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setGrades(data.data.grades)
        setStatistics(data.data.statistics)
      } else {
        setError(data.error || 'Failed to calculate grades')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to calculate grades')
    } finally {
      setCalculating(false)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200'
      case 'median': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'incomplete': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'high': return <CheckCircle className="h-4 w-4" />
      case 'median': return <AlertCircle className="h-4 w-4" />
      case 'low': return <XCircle className="h-4 w-4" />
      case 'incomplete': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  useEffect(() => {
    fetchGrades()
  }, [assignmentId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Calculate Button */}
      {showCalculateButton && assignmentId && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Assignment Grades</h3>
            <p className="text-sm text-gray-600">
              Calculate grades based on investment averages
            </p>
          </div>
          <Button 
            onClick={calculateGrades} 
            disabled={calculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {calculating ? 'Calculating...' : 'Calculate Grades'}
          </Button>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalTeams}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Grades</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.highGrades}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageInvestment.toFixed(1)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalInvestments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades List */}
      {grades.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No grades found. {assignmentId ? 'Click "Calculate Grades" to generate grades for this assignment.' : 'No assignments have been graded yet.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => (
            <Card key={grade.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{grade.team.name}</CardTitle>
                    <CardDescription>
                      {grade.team.members.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getGradeColor(grade.grade)}>
                      {getGradeIcon(grade.grade)}
                      <span className="ml-1 capitalize">{grade.grade}</span>
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{grade.percentage}%</div>
                      <div className="text-sm text-gray-600">
                        {grade.averageInvestment.toFixed(1)} avg investment
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Investment Average</span>
                    <span>{grade.averageInvestment.toFixed(1)} tokens</span>
                  </div>
                  <Progress 
                    value={grade.averageInvestment} 
                    max={50} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Investments: {grade.totalInvestments}</span>
                    <span>Grade: {grade.percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
