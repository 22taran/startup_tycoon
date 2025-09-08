'use client'

import { useEffect } from 'react'

export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Reset any scroll position when navigating between auth pages
    window.scrollTo(0, 0)
  }, [])

  return <>{children}</>
}
