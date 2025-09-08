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
  Home,
  BarChart3,
  Shield,
  Users
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Use client-side session if available, otherwise fall back to server-side user
  const user = session?.user || serverUser
  const isLoading = status === 'loading'

  // Memoize role badge
  const getRoleBadge = useCallback((role: string) => {
    const variants = {
      admin: 'destructive',
      student: 'default',
    } as const

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {role.toUpperCase()}
      </Badge>
    )
  }, [])

  // Memoize navigation items
  const navigationItems = useMemo(() => {
    if (!user) return []

    const baseItems = [
      { href: '/', label: 'Home', icon: Home },
      { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    ]

    const roleItems = {
      admin: [
        { href: '/admin', label: 'Admin Panel', icon: Shield },
      ],
      student: [
        { href: '/dashboard', label: 'My Dashboard', icon: Users },
      ],
    }

    return [...baseItems, ...(roleItems[user.role as keyof typeof roleItems] || [])]
  }, [user])

  // Memoize sign out handler
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      })
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [router])

  // Memoize mobile menu toggle
  const toggleMobileMenu = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

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
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-8 rounded-full"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any).image || ''} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="pt-1">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-red-600"
                    disabled={isSigningOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  onClick={() => router.push('/signin')}
                >
                  Log In
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  onClick={() => router.push('/signup')}
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
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}

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
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any).image || ''} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
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
                    disabled={isSigningOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    onClick={() => {
                      router.push('/signin')
                      closeMobileMenu()
                    }}
                  >
                    Log In
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    onClick={() => {
                      router.push('/signup')
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
    </nav>
  )
}
