import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCommitsBetween, getTags, parseGitHubRepo } from '@/lib/github'
import { generateChangelogGroq } from '@/lib/ai-groq'
import type { ChangelogTone, Plan } from '@/types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, tone = 'user-friendly', fromTag, toTag, since, until } = body

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Fetch workspace + project
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Check generation limits for free plan
  if (workspace.plan === 'free') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabaseAdmin
      .from('generation_usage')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Monthly generation limit reached. Upgrade to Starter for unlimited generations.' },
        { status: 402 }
      )
    }
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!project.github_repo) return NextResponse.json({ error: 'No GitHub repo connected' }, { status: 400 })
  if (!workspace.github_access_token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })

  const parsed = parseGitHubRepo(project.github_repo)
  if (!parsed) return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 })

  // Fetch commits from GitHub
  const commits = await getCommitsBetween(
    workspace.github_access_token,
    parsed.owner,
    parsed.repo,
    since,
    until,
    fromTag,
    toTag
  )

  if (!commits.length) {
    return NextResponse.json({ error: 'No commits found in the specified range' }, { status: 400 })
  }

  // Generate with AI
  const { title, content, tags, tokensUsed } = await generateChangelogGroq({
    commits,
    version: toTag,
    projectName: project.name,
    tone: tone as ChangelogTone,
  })

  // Save as draft
  const { data: changelog, error } = await supabaseAdmin
    .from('changelogs')
    .insert({
      project_id: projectId,
      workspace_id: workspace.id,
      title,
      version: toTag ?? null,
      content_md: content,
      tone,
      status: 'draft',
      from_commit: fromTag ?? since,
      to_commit: toTag ?? until,
      tags,
      generation_tokens: tokensUsed,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log usage
  await supabaseAdmin.from('generation_usage').insert({
    workspace_id: workspace.id,
    project_id: projectId,
    changelog_id: changelog.id,
    tokens_used: tokensUsed,
  })

  return NextResponse.json({ changelog })
}
