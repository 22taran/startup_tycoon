'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Play,
  Settings,
  UserCircle
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

// Optimized navigation component
function NavigationContent({ user: serverUser }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Use only client-side session to avoid conflicts
  const user = useMemo(() => {
    return session?.user || null
  }, [session?.user])
  
  const isLoading = status === 'loading'

  // Memoize handlers
  const handleSignOut = useCallback(async () => {
    try {
      // Clear any cached session data
      if (typeof window !== 'undefined') {
        // Clear NextAuth.js session cookies
        document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
      
      // Sign out without redirect first
      await signOut({ 
        redirect: false 
      })
      
      // Force a hard redirect to clear all state
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback to manual redirect
      window.location.href = '/'
    }
  }, [])

  const openAuthModal = useCallback((tab: 'signin' | 'signup') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Memoize navigation links
  const navigationLinks = useMemo(() => [
    { name: 'How it Works', href: '/#how-it-works' },
    ...(user ? [
      { name: 'Dashboard', href: '/dashboard' }
    ] : [])
  ], [user])

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Startup Tycoon
              </span>
            </Link>
          </div>

          {/* Center - Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-baseline space-x-4">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any).image || ''} alt={user.name || ''} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="pt-1">
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <div className="md:hidden flex items-center space-x-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

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
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any).image || ''} alt={user.name || ''} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'default'} className="text-xs">
                          {user.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile Links */}
                  <div className="px-3 py-2 space-y-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </div>
                  
                  {/* Sign Out Button */}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
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
                      setIsOpen(false)
                    }}
                  >
                    Log In
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    onClick={() => {
                      openAuthModal('signup')
                      setIsOpen(false)
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
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          defaultTab={authModalTab}
        />
      )}
    </nav>
  )
}

// Main Navigation component
export function Navigation(props: NavigationProps) {
  return <NavigationContent {...props} />
}
