import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/changelog/(.*)',
  '/api/changelog/subscribe',
  '/api/changelog/widget',
  '/api/webhooks/github',
  '/api/webhooks/razorpay',
  '/widget.js',
  '/subscribed',
  '/privacy',
  '/terms',
])

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Define main domains to ignore
  const mainDomains = [
    'changelogly.com',
    'localhost:3000',
    'changelogly.vercel.app',
    process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', ''),
  ].filter(Boolean)

  const isMainDomain = mainDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))

  // If it's a custom domain, rewrite to the internal domain handler
  if (!isMainDomain && !url.pathname.startsWith('/_domains')) {
    return NextResponse.rewrite(new URL(`/_domains/${hostname}${url.pathname}${url.search}`, request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
