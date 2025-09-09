'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home,
  BookOpen, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react'

interface AdminMobileNavProps {
  currentUserEmail: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

const navigationItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="h-5 w-5" />,
    href: '/dashboard'
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: <BookOpen className="h-5 w-5" />,
    href: '/dashboard?tab=courses'
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users className="h-5 w-5" />,
    href: '/dashboard?tab=users'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    href: '/dashboard?tab=settings'
  }
]

export function AdminMobileNav({ currentUserEmail }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get current tab from search params
  const currentTab = searchParams.get('tab') || 'home'
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin Panel
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Platform Management
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-1 border-t border-gray-200 dark:border-gray-700">
          {navigationItems.map((item) => {
            const isActive = currentTab === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-left",
                  isActive 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
