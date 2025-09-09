import { redirect } from 'next/navigation'
import { CourseDashboard } from '@/components/course-dashboard'
import { CourseManagementDashboard } from '@/components/course-management-dashboard'
import { auth } from '@/auth'

interface CoursePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/signin')
  }

  const { id } = await params

  // Show course management dashboard for admins and instructors
  if (session.user.role === 'admin' || session.user.role === 'instructor') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CourseManagementDashboard 
          courseId={id}
          currentUserEmail={session.user.email || ''} 
          userRole={session.user.role as 'admin' | 'instructor'}
        />
      </div>
    )
  }

  // Show student course dashboard for students
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CourseDashboard 
        courseId={id}
        currentUserEmail={session.user.email || ''} 
        currentUserId={session.user.id || ''} 
      />
    </div>
  )
}
