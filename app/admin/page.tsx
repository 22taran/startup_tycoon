import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { auth } from '@/auth'

export default async function AdminPage() {
  // Get user info from Next.js Auth
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (session.user.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminDashboard currentUserEmail={session.user.email || ''} />
    </div>
  )
}
