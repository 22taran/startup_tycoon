'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  DollarSign, 
  Trophy, 
  Plus,
  Settings,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react'
import { CourseManagement } from './course-management'
import { UserManagement } from './user-management'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminSidebar } from './admin-sidebar'
import { AdminMobileNav } from './admin-mobile-nav'

interface AdminDashboardProps {
  currentUserEmail: string
}

export function AdminDashboard({ currentUserEmail }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('home')
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false)
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    semester: '',
    year: new Date().getFullYear(),
    instructorName: ''
  })
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    activeSessions: 0,
    systemStatus: 'Online'
  })
  const searchParams = useSearchParams()
  
  // Update current tab when search params change
  useEffect(() => {
    const tab = searchParams.get('tab') || 'home'
    setCurrentTab(tab)
  }, [searchParams])

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch all stats in parallel
      const [coursesRes, usersRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/users')
      ])

      const [coursesData, usersData] = await Promise.all([
        coursesRes.json(),
        usersRes.json()
      ])

      setStats({
        totalCourses: coursesData.data?.length || 0,
        totalUsers: usersData.data?.length || 0,
        activeSessions: usersData.data?.length || 0, // For now, same as total users
        systemStatus: 'Online'
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
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
        body: JSON.stringify({
          ...courseForm,
          instructorId: currentUserEmail
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setShowCreateCourseModal(false)
      setCourseForm({
        name: '',
        code: '',
        description: '',
        semester: '',
        year: new Date().getFullYear(),
        instructorName: ''
      })
        // Refresh the stats to show the new course
        fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'courses':
    return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h2>
                <p className="text-gray-600 dark:text-gray-300">Create and manage your courses</p>
          </div>
              <Button onClick={() => setShowCreateCourseModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
        </div>
            <CourseManagement currentUserEmail={currentUserEmail} />
      </div>
    )

      case 'users':
        return <UserManagement currentUserEmail={currentUserEmail} />
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h2>
                <p className="text-gray-600 dark:text-gray-300">Configure platform-wide policies and settings</p>
            </div>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Token Settings
                  </CardTitle>
                  <CardDescription>Configure investment tokens and limits</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4">
                <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Token Configuration</p>
                      <p className="text-sm text-gray-400">Coming soon - configure token limits and policies</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          

          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Grading Rules
                  </CardTitle>
                  <CardDescription>Set up grading policies and weightings</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4">
                <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Grading Configuration</p>
                      <p className="text-sm text-gray-400">Coming soon - configure grading rules and weightings</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    RLS Policies
                  </CardTitle>
                  <CardDescription>Manage row-level security and access controls</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4">
                <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Security Settings</p>
                      <p className="text-sm text-gray-400">Coming soon - configure RLS policies</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Configure platform notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">Notification Settings</p>
                      <p className="text-sm text-gray-400">Coming soon - configure notifications and alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  </div>
                </div>
        )
      
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Global Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage courses, users, and platform settings
              </p>
              </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <p className="text-xs text-muted-foreground">
                    Active courses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Platform users
                  </p>
            </CardContent>
          </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Online users
                  </p>
                </CardContent>
              </Card>

          <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.systemStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>
                  </div>
                </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar currentUserEmail={currentUserEmail} />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
                    </div>
                  </div>
                </div>
              </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar currentUserEmail={currentUserEmail} />
      <div className="flex-1 overflow-y-auto">
        <AdminMobileNav currentUserEmail={currentUserEmail} />
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>

      {/* Create Course Modal */}
      <Dialog open={showCreateCourseModal} onOpenChange={setShowCreateCourseModal}>
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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Course description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={courseForm.semester} onValueChange={(value) => setCourseForm({ ...courseForm, semester: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={courseForm.year}
                  onChange={(e) => setCourseForm({ ...courseForm, year: parseInt(e.target.value) })}
                  min="2020"
                  max="2030"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateCourseModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Course</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
