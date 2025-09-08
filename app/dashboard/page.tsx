import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { StudentDashboard } from '@/components/student-dashboard'
import { auth } from '@/auth'

export default async function DashboardPage() {
  // Get user info from Next.js Auth
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {session.user.role === 'admin' ? 
        <AdminDashboard currentUserEmail={session.user.email || ''} /> : 
        <StudentDashboard 
          currentUserEmail={session.user.email || ''} 
          currentUserId={session.user.id || ''} 
        />
      }
    </div>
  )
}
