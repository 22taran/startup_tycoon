import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { HowItWorks } from '@/components/how-it-works'
import { CTA } from '@/components/cta'

export default async function HomePage() {
  // Check if user is logged in
  const session = await auth()
  
  // If user is logged in, redirect them to appropriate page
  if (session?.user) {
    if (session.user.role === 'student') {
      redirect('/courses')
    } else {
      redirect('/dashboard')
    }
  }

  // If not logged in, show landing page
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </main>
  )
}
