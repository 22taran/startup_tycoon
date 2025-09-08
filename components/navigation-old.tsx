'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  Home,
  BarChart3,
  HelpCircle,
  Play,
  UserCheck
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import AuthModal from '@/components/auth-modal'

interface NavigationProps {
  user?: {
    id: string
    email: string
    name: string
    role: 'admin' | 'student'
  } | null
}

export function Navigation({ user: serverUser }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Use client-side session if available, otherwise fall back to server-side user
  const user = session?.user || serverUser
  const isLoading = status === 'loading'

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      })
      // Force a page refresh to update the auth state
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Startup Tycoon
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* How it Works - Always visible */}
            <Link 
              href="/#how-it-works" 
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              How it Works
            </Link>
            
            {/* User Actions */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                                
                {/* Logout Button */}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  onClick={() => {
                    setAuthModalTab('signin')
                    setIsAuthModalOpen(true)
                  }}
                >
                  Log In
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  onClick={() => {
                    setAuthModalTab('signup')
                    setIsAuthModalOpen(true)
                  }}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Get Started
                </Button>
              </div>
            )}
            
            {/* Theme Toggle - Moved to end */}
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-gray-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {/* How it Works - Always visible */}
              <Link
                href="/#how-it-works"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="h-4 w-4 inline mr-2" />
                How it Works
              </Link>
              
              {/* User-specific navigation */}
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Home className="h-4 w-4 inline mr-2" />
                    Dashboard
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield className="h-4 w-4 inline mr-2" />
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
              
              {/* User Actions */}
              {isLoading ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2">
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-32 rounded mb-2"></div>
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-full rounded"></div>
                  </div>
                </div>
              ) : user ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* User Info */}
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-2 mb-3">
                      {user.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-purple-600" />
                      ) : (
                        <UserCheck className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.role}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <Button
                    onClick={() => {
                      handleSignOut()
                      setIsOpen(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    onClick={() => {
                      setAuthModalTab('signin')
                      setIsAuthModalOpen(true)
                      setIsOpen(false)
                    }}
                  >
                    Log In
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    onClick={() => {
                      setAuthModalTab('signup')
                      setIsAuthModalOpen(true)
                      setIsOpen(false)
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              )}
              
              {/* Theme Toggle in Mobile Menu */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </nav>
  )
}