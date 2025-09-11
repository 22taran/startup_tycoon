'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Trophy, Target } from 'lucide-react'

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

interface StudentGradesDisplayProps {
  currentUserEmail: string
  currentUserId?: string
}

export default function StudentGradesDisplay({ currentUserEmail, currentUserId }: StudentGradesDisplayProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGrades()
  }, [currentUserEmail, currentUserId])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/grades')
      const data = await response.json()
      
      if (data.success) {
        if (!currentUserId) {
          setGrades([])
          return
        }
        
        // Filter grades for the current user's team
        const userGrades = data.data.filter((grade: Grade) => 
          grade.team && grade.team.members && grade.team.members.includes(currentUserId)
        )
        setGrades(userGrades)
      } else {
        setError(data.error || 'Failed to fetch grades')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grades')
    } finally {
      setLoading(false)
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

  const getGradeMessage = (grade: string) => {
    switch (grade) {
      case 'high': return 'Excellent work! Your team received high investment confidence.'
      case 'median': return 'Good work! Your team received moderate investment confidence.'
      case 'low': return 'Room for improvement. Consider enhancing your submission quality.'
      case 'incomplete': return 'Your submission was marked as incomplete by evaluators.'
      default: return 'Grade pending or not available.'
    }
  }

  useEffect(() => {
    fetchGrades()
  }, [currentUserEmail, currentUserId])

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

  // Calculate overall statistics
  const totalGrades = grades.length
  const highGrades = grades.filter(g => g.grade === 'high').length
  const medianGrades = grades.filter(g => g.grade === 'median').length
  const lowGrades = grades.filter(g => g.grade === 'low').length
  const incompleteGrades = grades.filter(g => g.grade === 'incomplete').length
  const averageGrade = totalGrades > 0 ? grades.reduce((sum, g) => sum + g.percentage, 0) / totalGrades : 0
  const averageInvestment = totalGrades > 0 ? grades.reduce((sum, g) => sum + g.averageInvestment, 0) / totalGrades : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Your Team's Grades</h3>
        <p className="text-sm text-gray-600">
          View your team's performance across all assignments
        </p>
      </div>

      {/* Overall Statistics */}
      {totalGrades > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageGrade.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Across {totalGrades} assignment{totalGrades !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Grades</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{highGrades}</div>
              <p className="text-xs text-muted-foreground">
                {totalGrades > 0 ? `${((highGrades / totalGrades) * 100).toFixed(0)}%` : '0%'} of assignments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Investment</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageInvestment.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Average tokens received
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGrades}</div>
              <p className="text-xs text-muted-foreground">
                Graded assignments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades List */}
      {grades.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No grades available yet. Grades will appear here once assignments are evaluated.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => (
            <Card key={grade.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {grade.assignment?.title || `Assignment ${grade.assignmentId}`}
                    </CardTitle>
                    <CardDescription>
                      {grade.team.name} • {grade.team.members.join(', ')}
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
                <div className="space-y-3">
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
                    <span>Final Grade: {grade.percentage}%</span>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {getGradeMessage(grade.grade)}
                    </p>
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
