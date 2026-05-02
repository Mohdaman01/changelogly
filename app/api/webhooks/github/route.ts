import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCommitsBetween, getLatestRelease, parseGitHubRepo } from '@/lib/github'
import { generateChangelog } from '@/lib/ai'
import { sendChangelogNotification } from '@/lib/email'
import crypto from 'crypto'

function verifyGitHubSignature(payload: string, sig: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(sig))
}

export async function POST(req: NextRequest) {
  const event = req.headers.get('x-github-event')
  if (event !== 'release') return NextResponse.json({ ok: true })

  const body = await req.text()
  const payload = JSON.parse(body)

  // Only trigger on published releases
  if (payload.action !== 'published') return NextResponse.json({ ok: true })

  const repoFullName = payload.repository?.full_name
  if (!repoFullName) return NextResponse.json({ error: 'No repo' }, { status: 400 })

  // Find the project connected to this repo
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*, workspaces(*)')
    .eq('github_repo', repoFullName)
    .single()

  if (!project) return NextResponse.json({ ok: true }) // not our user's repo

  const workspace = project.workspaces

  // Only auto-publish for starter+ plans
  if (workspace.plan === 'free') return NextResponse.json({ ok: true })

  const parsed = parseGitHubRepo(repoFullName)
  if (!parsed || !workspace.github_access_token) return NextResponse.json({ ok: true })

  const release = payload.release
  const tag = release.tag_name

  // Get previous release to find commit range
  const previousRelease = await getLatestRelease(
    workspace.github_access_token,
    parsed.owner,
    parsed.repo
  )

  const commits = await getCommitsBetween(
    workspace.github_access_token,
    parsed.owner,
    parsed.repo,
    undefined,
    undefined,
    previousRelease?.tag ?? undefined,
    tag
  )

  if (!commits.length) return NextResponse.json({ ok: true })

  // Generate changelog
  const { title, content, tags, tokensUsed } = await generateChangelog({
    commits,
    version: tag,
    projectName: project.name,
    tone: 'user-friendly',
  })

  // Save and auto-publish
  const { data: changelog } = await supabaseAdmin
    .from('changelogs')
    .insert({
      project_id: project.id,
      workspace_id: workspace.id,
      title,
      version: tag,
      content_md: content,
      tone: 'user-friendly',
      status: 'published',
      published_at: new Date().toISOString(),
      from_commit: previousRelease?.tag ?? null,
      to_commit: tag,
      tags,
      generation_tokens: tokensUsed,
    })
    .select()
    .single()

  if (!changelog) return NextResponse.json({ ok: true })

  // Log usage
  await supabaseAdmin.from('generation_usage').insert({
    workspace_id: workspace.id,
    project_id: project.id,
    changelog_id: changelog.id,
    tokens_used: tokensUsed,
  })

  // Notify subscribers
  const { data: subscribers } = await supabaseAdmin
    .from('changelog_subscribers')
    .select('email')
    .eq('project_id', project.id)
    .eq('confirmed', true)

  const emails = (subscribers ?? []).map((s: { email: string }) => s.email)
  if (emails.length > 0) {
    sendChangelogNotification({ subscribers: emails, changelog, project, workspace }).catch(console.error)
  }

  return NextResponse.json({ ok: true, changelogId: changelog.id })
}
