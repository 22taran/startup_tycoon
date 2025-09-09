'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-6">
      <Link 
        href="/dashboard"
        className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Dashboard
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.current ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          ) : item.href ? (
            <Link 
              href={item.href}
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
