'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BookOpen, 
  Plus, 
  Users, 
  Calendar, 
  Edit, 
  Trash2, 
  UserPlus,
  Settings
} from 'lucide-react'
import { Course, CourseForm, EnrollmentForm } from '@/types'

interface CourseManagementProps {
  currentUserEmail: string
}

interface CourseWithEnrollment extends Course {
  instructor: {
    name: string
    email: string
  }
  enrollments: Array<{
    id: string
    user_id: string
    role: string
    status: string
    user: {
      name: string
      email: string
    }
  }>
}

export function CourseManagement({ currentUserEmail }: CourseManagementProps) {
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseWithEnrollment | null>(null)
  const router = useRouter()
  const [enrollmentEmails, setEnrollmentEmails] = useState('')
  const [enrollmentRole, setEnrollmentRole] = useState<'student' | 'instructor' | 'ta'>('student')

  // Form state for creating courses
  const [courseForm, setCourseForm] = useState<CourseForm>({
    name: '',
    description: '',
    code: '',
    semester: '',
    year: new Date().getFullYear(),
    instructorName: ''
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses?role=instructor')
      
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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseForm),
      })

      const data = await response.json()
      if (data.success) {
      setCourseForm({
        name: '',
        description: '',
        code: '',
        semester: '',
        year: new Date().getFullYear(),
        instructorName: ''
      })
        setIsCreateModalOpen(false)
        fetchCourses()
      } else {
        setError(data.error || 'Failed to create course')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleEnrollStudents = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return

    const emails = enrollmentEmails.split('\n').map(email => email.trim()).filter(email => email)
    
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmails: emails,
          role: enrollmentRole
        }),
      })

      const data = await response.json()
      if (data.success) {
        setEnrollmentEmails('')
        setEnrollmentRole('student')
        setIsEnrollModalOpen(false)
        setSelectedCourse(null)
        fetchCourses()
      } else {
        setError(data.error || 'Failed to enroll students')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger asChild>
          <div style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Create a new course for your students to enroll in.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="e.g., CS101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructorName">Instructor Name</Label>
                <Input
                  id="instructorName"
                  value={courseForm.instructorName}
                  onChange={(e) => setCourseForm({ ...courseForm, instructorName: e.target.value })}
                  placeholder="e.g., Dr. John Smith"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                    placeholder="e.g., Fall 2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={courseForm.year}
                    onChange={(e) => setCourseForm({ ...courseForm, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Course description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Course</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Created</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first course to get started with managing students and assignments.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/courses/${course.id}`)}
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
                  <Badge variant="secondary">
                    {course.enrollments.length} enrolled
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
                    <span>{course.enrollments.filter(e => e.role === 'student').length} students</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created: {course.createdAt ? formatDate(course.createdAt.toString()) : 'Unknown'}</span>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enrollment Modal */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Add students to {selectedCourse?.name} by entering their email addresses.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEnrollStudents} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={enrollmentRole} onValueChange={(value: 'student' | 'instructor' | 'ta') => setEnrollmentRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="ta">Teaching Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                value={enrollmentEmails}
                onChange={(e) => setEnrollmentEmails(e.target.value)}
                placeholder="Enter email addresses, one per line:&#10;student1@example.com&#10;student2@example.com"
                rows={6}
                required
              />
              <p className="text-sm text-gray-500">
                Enter one email address per line
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEnrollModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Enroll Students</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
