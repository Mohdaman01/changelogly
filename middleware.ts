import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/changelog/(.*)',
  '/api/changelog/subscribe',
  '/api/changelog/widget',
  '/api/webhooks/github',
  '/api/webhooks/stripe',
  '/widget.js',
  '/subscribed',
  '/privacy',
  '/terms',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
