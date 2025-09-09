'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Calendar, ArrowRight, Plus } from 'lucide-react'
import { Course } from '@/types'

interface CourseCatalogProps {
  currentUserEmail: string
  userRole?: 'admin' | 'student' | 'instructor'
}

interface CourseWithEnrollment extends Course {
  instructor: {
    name: string
    email: string
  }
  enrollment?: {
    role: string
    enrolledAt: string
  }
}

export function CourseCatalog({ currentUserEmail, userRole = 'student' }: CourseCatalogProps) {
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      // Fetch courses based on user role
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      if (data.success) {
        setCourses(data.data)
      } else {
        setError(data.error || 'Failed to fetch courses')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your courses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Courses
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchCourses} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {userRole === 'admin' ? 'Course Management' : 'Welcome to Startup Tycoon!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {userRole === 'admin' 
                ? 'Manage your courses and enroll students'
                : 'Select a course below to access your assignments, teams, and track your progress'
              }
            </p>
          </div>
          {userRole === 'admin' && (
            <Button onClick={() => router.push('/admin')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {userRole === 'admin' ? 'No Courses Created' : 'No Courses Found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {userRole === 'admin' 
              ? 'You haven\'t created any courses yet. Create your first course to get started.'
              : 'You haven\'t been enrolled in any courses yet. Contact your instructor to get enrolled.'
            }
          </p>
          <div className="flex justify-center space-x-4">
            {userRole === 'admin' ? (
              <Button onClick={() => router.push('/admin')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            ) : (
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300 dark:hover:border-blue-600"
              onClick={() => handleCourseSelect(course.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {course.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                      {course.code} • {course.semester} {course.year}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {course.enrollment?.role || 'Student'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {course.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Instructor: {course.instructor?.name || course.instructorName || 'Unknown'}</span>
                  </div>
                  
                  {course.enrollment && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Enrolled: {formatDate(course.enrollment.enrolledAt)}</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCourseSelect(course.id)
                  }}
                >
                  Enter Course
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
