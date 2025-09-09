import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { InstructorDashboard } from '@/components/instructor-dashboard'
import { auth } from '@/auth'

export default async function DashboardPage() {
  // Get user info from Next.js Auth
  const session = await auth()
  
  if (!session?.user) {
    redirect('/signin')
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
