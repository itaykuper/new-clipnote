import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes - allow access without authentication
  if (req.nextUrl.pathname.startsWith('/review/')) {
    return res
  }

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/projects')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Auth routes - redirect to dashboard if already authenticated
  if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/review/:path*', '/login', '/signup'],
} 