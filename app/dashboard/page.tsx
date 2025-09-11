import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import dynamicImport from 'next/dynamic'
import type { Metadata } from 'next'

// Lazy load dashboard components
const AdminDashboard = dynamicImport(() => import('@/components/admin-dashboard').then(mod => ({ default: mod.AdminDashboard })), {
  loading: () => <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
})

const InstructorDashboard = dynamicImport(() => import('@/components/instructor-dashboard').then(mod => ({ default: mod.InstructorDashboard })), {
  loading: () => <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
})

// Add metadata for better performance
export const metadata: Metadata = {
  title: 'Dashboard - Startup Tycoon',
  description: 'Manage your courses, assignments, and students',
  robots: 'noindex, nofollow', // Private dashboard pages shouldn't be indexed
}

// Disable static generation for session-dependent pages
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Get user info from Next.js Auth
  const session = await auth()
  
  if (!session?.user) {
    redirect('/')
  }

  // Redirect students to course catalog
  if (session.user.role === 'student') {
    redirect('/courses')
  }

  // For admins and instructors, show appropriate dashboard
  return (
    <>
      {session.user.role === 'admin' ? (
        <AdminDashboard currentUserEmail={session.user.email || ''} />
      ) : (
        <InstructorDashboard currentUserEmail={session.user.email || ''} />
      )}
    </>
  )
}
