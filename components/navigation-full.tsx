'use client'

import { useState, useCallback, useMemo, Suspense } from 'react'
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

// Loading skeleton for navigation
function NavigationSkeleton() {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo skeleton */}
          <div className="flex-shrink-0">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Desktop menu skeleton */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Right side skeleton */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Mobile menu button skeleton */}
          <div className="md:hidden">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Optimized navigation component
function NavigationContent({ user: serverUser }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Memoize user to prevent unnecessary re-renders
  const user = useMemo(() => {
    return session?.user || serverUser
  }, [session?.user, serverUser])
  
  const isLoading = status === 'loading'

  // Memoize sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      })
      // Use router.push instead of window.location for better performance
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [router])

  // Memoize auth modal handlers
  const openAuthModal = useCallback((tab: 'signin' | 'signup') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  // Memoize mobile menu toggle
  const toggleMobileMenu = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Memoize navigation links
  const navigationLinks = useMemo(() => [
    { name: 'How it Works', href: '/#how-it-works' },
    ...(user ? [
      { name: 'Dashboard', href: '/dashboard' },
      ...(user.role === 'admin' ? [{ name: 'Admin', href: '/admin' }] : [])
    ] : [])
  ], [user])

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Startup Tycoon
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* User info */}
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </div>
                
                {/* Logout Button */}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
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
                  onClick={() => openAuthModal('signin')}
                >
                  Log In
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  onClick={() => openAuthModal('signup')}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {/* Navigation Links */}
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={closeMobileMenu}
                >
                  {link.name}
                </Link>
              ))}

              {/* User Section */}
              {isLoading ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ) : user ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* User Info */}
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.role === 'admin' ? 'Administrator' : 'Student'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="w-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
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
                      openAuthModal('signin')
                      closeMobileMenu()
                    }}
                  >
                    Log In
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    onClick={() => {
                      openAuthModal('signup')
                      closeMobileMenu()
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultTab={authModalTab}
      />
    </nav>
  )
}

// Main Navigation component with Suspense
export function Navigation(props: NavigationProps) {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationContent {...props} />
    </Suspense>
  )
}
