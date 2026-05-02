import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { exchangeCodeForToken } from '@/lib/github'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(new URL('/login', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=github_denied', req.url))
  }

  try {
    const accessToken = await exchangeCodeForToken(code)

    await supabaseAdmin
      .from('workspaces')
      .update({ github_access_token: accessToken })
      .eq('clerk_user_id', userId)

    return NextResponse.redirect(new URL('/dashboard/settings?success=github_connected', req.url))
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    return NextResponse.redirect(new URL('/dashboard/settings?error=github_failed', req.url))
  }
}
