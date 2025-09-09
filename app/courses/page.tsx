import { redirect } from 'next/navigation'
import { CourseCatalog } from '@/components/course-catalog'
import { auth } from '@/auth'

export default async function CoursesPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CourseCatalog 
        currentUserEmail={session.user.email || ''} 
        userRole={session.user.role}
      />
    </div>
  )
}
