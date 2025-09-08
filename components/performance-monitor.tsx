'use client'

import { useEffect } from 'react'

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    // Monitor navigation performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          console.log('🚀 Navigation Performance:', {
            'DOM Content Loaded': navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            'Load Complete': navEntry.loadEventEnd - navEntry.loadEventStart,
            'Total Load Time': navEntry.loadEventEnd - navEntry.fetchStart,
            'First Paint': navEntry.domContentLoadedEventEnd - navEntry.fetchStart
          })
        }
        
        if (entry.entryType === 'paint') {
          console.log(`🎨 Paint: ${entry.name}`, entry.startTime)
        }
      }
    })

    observer.observe({ entryTypes: ['navigation', 'paint'] })

    // Monitor component render times
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      console.log('⏱️ Component Render Time:', endTime - startTime, 'ms')
      observer.disconnect()
    }
  }, [])

  return null
}
