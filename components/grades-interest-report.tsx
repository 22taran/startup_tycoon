'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  DollarSign, 
  Users, 
  BarChart3, 
  Download,
  TrendingUp,
  Target,
  Award
} from 'lucide-react'

interface ReportData {
  summary: {
    assignments: number
    grades: number
    interestRecords: number
    investments: number
    users: number
    totalInterest: number
    totalInvestments: number
    averageGrade: number
  }
  assignments: Array<{
    id: string
    title: string
    courseId: string
    dueDate: string | null
    status: string | null
    isEvaluationActive: boolean
    grades: Array<{
      id: string
      teamId: string
      teamName: string
      teamMembers: string
      score: number
      averageInvestment: number
      totalInvestments: number
      performanceTier: string
      createdAt: string
    }>
    interestDistribution: Array<{
      studentId: string
      studentName: string
      studentEmail: string
      totalInterest: number
      bonusPotential: number
      investments: Array<{
        teamId: string
        teamName: string
        tokensInvested: number
        interestEarned: number
        performanceTier: string
      }>
    }>
    investmentSummary: {
      totalTokensInvested: number
      averageInvestment: number
      numberOfInvestments: number
    }
  }>
  topPerformers: Array<{
    student: {
      id: string
      name: string
      email: string
    }
    totalInterest: number
  }>
}

export default function GradesInterestReport() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/reports/grades-interest-data')
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
      } else {
        setError(data.error || 'Failed to fetch report data')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const downloadReport = () => {
    window.open('/api/admin/reports/grades-interest', '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={fetchReportData}>Retry</Button>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No report data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📋 Grades & Interest Report</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive report showing how grades are calculated and interest is distributed
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchReportData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={downloadReport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData.summary.totalInterest.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.totalInvestments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              tokens invested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.averageGrade.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              across all teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.summary.assignments}
            </div>
            <p className="text-xs text-muted-foreground">
              total assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Interest Earners
          </CardTitle>
          <CardDescription>
            Students with the highest interest earnings across all assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.topPerformers.slice(0, 6).map((performer, index) => (
              <div key={performer.student.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{performer.student.name}</p>
                    <p className="text-sm text-gray-500">{performer.student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{performer.totalInterest.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">interest</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      {reportData.assignments.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {assignment.title}
            </CardTitle>
            <CardDescription>
              Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'TBD'}
              {assignment.isEvaluationActive && (
                <Badge className="ml-2" variant="secondary">Evaluation Active</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grades Summary */}
            <div>
              <h4 className="font-semibold mb-3">📊 Grades ({assignment.grades.length} teams)</h4>
              {assignment.grades.length > 0 ? (
                <div className="space-y-2">
                  {assignment.grades
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((grade, index) => (
                    <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{grade.teamName}</p>
                          <p className="text-sm text-gray-500">{grade.teamMembers}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="font-bold">{grade.score}%</p>
                          <p className="text-xs text-gray-500">score</p>
                        </div>
                        <div>
                          <p className="font-bold">{grade.averageInvestment}</p>
                          <p className="text-xs text-gray-500">avg investment</p>
                        </div>
                        <div>
                          <Badge 
                            variant={grade.performanceTier === 'high' ? 'default' : 
                                   grade.performanceTier === 'median' ? 'secondary' : 'destructive'}
                          >
                            {grade.performanceTier}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No grades found for this assignment</p>
              )}
            </div>

            {/* Interest Distribution */}
            <div>
              <h4 className="font-semibold mb-3">💰 Interest Distribution ({assignment.interestDistribution.length} students)</h4>
              {assignment.interestDistribution.length > 0 ? (
                <div className="space-y-2">
                  {assignment.interestDistribution
                    .sort((a, b) => b.totalInterest - a.totalInterest)
                    .map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-gray-500">{student.studentEmail}</p>
                        <div className="mt-1 text-xs text-gray-600">
                          {student.investments.map((inv, idx) => (
                            <span key={idx}>
                              {inv.teamName}: {inv.tokensInvested} tokens → {inv.interestEarned} interest ({inv.performanceTier})
                              {idx < student.investments.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{student.totalInterest.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{student.bonusPotential.toFixed(1)}% bonus</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No interest records found for this assignment</p>
              )}
            </div>

            {/* Investment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{assignment.investmentSummary.totalTokensInvested}</p>
                <p className="text-sm text-gray-600">Total Tokens</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{assignment.investmentSummary.averageInvestment.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Average Investment</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{assignment.investmentSummary.numberOfInvestments}</p>
                <p className="text-sm text-gray-600">Total Investments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
