import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Allow access to landing page (/) and public routes
  if (pathname === '/' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Require authentication for protected pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || 
      pathname.startsWith('/courses') || pathname.startsWith('/profile') || 
      pathname.startsWith('/settings')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}