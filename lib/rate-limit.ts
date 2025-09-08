import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests' } = options

  return (request: NextRequest): { success: true } | { success: false; response: NextResponse } => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up expired entries
    for (const [key, value] of Array.from(rateLimitMap.entries())) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }

    // Get or create rate limit entry
    const entry = rateLimitMap.get(ip)
    
    if (!entry) {
      // First request from this IP
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
      return { success: true }
    }

    if (entry.resetTime < now) {
      // Window has expired, reset
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
      return { success: true }
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: message },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
            }
          }
        )
      }
    }

    // Increment count
    entry.count++
    return { success: true }
  }
}

// Predefined rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: 'Too many API requests. Please slow down.'
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
  message: 'Too many file uploads. Please wait before uploading again.'
})
