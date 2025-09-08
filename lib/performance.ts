// Performance monitoring utilities
export const performanceMonitor = {
  // Measure function execution time
  measureTime: <T>(fn: () => T, label: string): T => {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  // Measure async function execution time
  measureTimeAsync: async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}

// Lazy loading utility
export const lazyLoad = (importFn: () => Promise<any>) => {
  return importFn().then(module => module.default || module)
}

// Preload critical resources
export const preloadResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link')
    fontLink.rel = 'preload'
    fontLink.href = '/fonts/inter.woff2'
    fontLink.as = 'font'
    fontLink.type = 'font/woff2'
    fontLink.crossOrigin = 'anonymous'
    document.head.appendChild(fontLink)
  }
}
