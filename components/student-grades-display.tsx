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
  interestEarned?: number
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
  courseId?: string
}

export default function StudentGradesDisplay({ currentUserEmail, currentUserId, courseId }: StudentGradesDisplayProps) {
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
      
        if (!currentUserId) {
          setGrades([])
          return
        }
      
      // Fetch both grades and interest data
      const gradesUrl = courseId ? `/api/grades?courseId=${courseId}` : '/api/grades'
      const [gradesResponse, interestResponse] = await Promise.all([
        fetch(gradesUrl),
        fetch(`/api/student-interest?studentId=${currentUserId}`)
      ])
      
      const gradesData = await gradesResponse.json()
      const interestData = await interestResponse.json()
      
      if (gradesData.success) {
        console.log('🔍 Student Grades Debug:')
        console.log('All grades from API:', gradesData.data.length)
        console.log('Grades data:', gradesData.data.map((g: any) => ({ 
          id: g.id, 
          assignmentId: g.assignmentId, 
          status: g.status,
          teamMembers: g.team?.members 
        })))
        
        // Filter grades for the current user's team
        const userGrades = gradesData.data.filter((grade: Grade) => 
          grade.team && grade.team.members && grade.team.members.includes(currentUserId)
        )
        
        console.log('Filtered user grades:', userGrades.length)
        console.log('User grades:', userGrades.map((g: Grade) => ({ 
          id: g.id, 
          assignmentId: g.assignmentId, 
          status: g.status 
        })))
        
        // Add interest data to each grade
        const gradesWithInterest = userGrades.map((grade: Grade) => {
          // Find interest data for this assignment from the array
          const assignmentInterest = interestData.success && interestData.data?.interestByAssignment?.find(
            (item: any) => item.assignmentId === grade.assignmentId
          )
          return {
            ...grade,
            interestEarned: assignmentInterest?.totalInterest || 0
          }
        })
        
        setGrades(gradesWithInterest)
      } else {
        setError(gradesData.error || 'Failed to fetch grades')
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
          View your team's performance for each assignment
        </p>
      </div>

      {/* Individual Assignment Grades */}
      {grades.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No grades available yet. Your assignments will be graded after the evaluation period.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-900">Individual Assignment Grades</h4>
            <p className="text-sm text-gray-600">Each card below shows your team's grade for a specific assignment</p>
          </div>
          {grades.map((grade) => (
            <Card key={grade.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {grade.assignment?.title || 'Assignment'}
                    </CardTitle>
                    <CardDescription>
                      Due: {grade.assignment?.due_date ? new Date(grade.assignment.due_date).toLocaleDateString() : 'TBD'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getGradeColor(grade.grade)}>
                      {getGradeIcon(grade.grade)}
                      <span className="ml-1 capitalize">{grade.grade}</span>
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{grade.percentage || 0}%</div>
                      <div className="text-sm text-gray-600 font-medium">Your Grade</div>
                      <div className="text-xs text-gray-500">
                        {(grade.averageInvestment || 0).toFixed(1)} avg investment
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Team Performance:</span>
                    <span className="text-sm text-gray-600">{grade.team?.name || 'Unknown Team'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total investments your work received:</span>
                    <span className="text-sm text-gray-600">{grade.totalInvestments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Interest received from this assignment:</span>
                    <span className="text-sm text-green-600 font-semibold">{grade.interestEarned?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-700">{getGradeMessage(grade.grade)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Performance Summary - Only show if multiple assignments */}
      {totalGrades > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
            <CardDescription>
              Your overall performance across all assignments (individual grades shown above)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{averageGrade.toFixed(1)}%</div>
                <div className="text-sm text-blue-700">Overall Average</div>
                <div className="text-xs text-blue-600 mt-1">Across all assignments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{highGrades}</div>
                <div className="text-sm text-green-700">High Grades</div>
                <div className="text-xs text-green-600 mt-1">Individual assignments</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalGrades}</div>
                <div className="text-sm text-purple-700">Total Assignments</div>
                <div className="text-xs text-purple-600 mt-1">Graded so far</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}