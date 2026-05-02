import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRepos, getTags } from '@/lib/github'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('github_access_token')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace?.github_access_token) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
  }

  const repos = await getUserRepos(workspace.github_access_token)
  return NextResponse.json({ repos })
}

export async function POST(req: NextRequest) {
  // Get tags for a specific repo
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { repo } = await req.json()

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('github_access_token')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace?.github_access_token) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
  }

  const [owner, repoName] = repo.split('/')
  const tags = await getTags(workspace.github_access_token, owner, repoName)
  return NextResponse.json({ tags })
}
