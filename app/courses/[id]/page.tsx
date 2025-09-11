import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import dynamicImport from 'next/dynamic'
import type { Metadata } from 'next'

// Lazy load heavy components for better performance
const CourseDashboard = dynamicImport(() => import('@/components/course-dashboard').then(mod => ({ default: mod.CourseDashboard })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
})

const CourseManagementDashboard = dynamicImport(() => import('@/components/course-management-dashboard').then(mod => ({ default: mod.CourseManagementDashboard })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
})

interface CoursePageProps {
  params: Promise<{
    id: string
  }>
}

// Disable ISR for dynamic session-dependent pages
export const dynamic = 'force-dynamic'

// Generate metadata for better SEO and performance
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { id } = await params
  
  return {
    title: `Course ${id} - Startup Tycoon`,
    description: 'Manage your course assignments, teams, and evaluations',
    robots: 'noindex, nofollow', // Private course pages shouldn't be indexed
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/')
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
