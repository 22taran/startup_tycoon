import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - Startup Tycoon',
  description: 'Sign in or sign up to access Startup Tycoon',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
