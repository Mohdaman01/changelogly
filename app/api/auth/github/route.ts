import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getGitHubOAuthUrl } from '@/lib/github'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = Buffer.from(userId + ':' + Date.now()).toString('base64')
  const url = getGitHubOAuthUrl(state)
  return NextResponse.redirect(url)
}
