import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCommitsBetween, getLatestRelease, parseGitHubRepo } from '@/lib/github'
import { generateChangelogGroq } from '@/lib/ai-groq'
import { sendChangelogNotification } from '@/lib/email'
import { verifySignature, decryptSecret } from '@/lib/encryption'
import type { ChangelogTone } from '@/types'

/**
 * GitHub webhook handler for auto-publishing changelogs on release events
 * 
 * Webhook setup:
 * - Register in GitHub repo settings → Webhooks
 * - Payload URL: https://your-domain.com/api/webhooks/github
 * - Events: Releases
 * - Secret: Generated per project (stored encrypted)
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const event = req.headers.get('x-github-event')
  const signature = req.headers.get('x-github-signature-256') || ''

  // ─── Step 1: Validate event type ─────────────────────────────────────
  if (event !== 'release') {
    return NextResponse.json({ ok: true }) // Silently ignore non-release events
  }

  // ─── Step 2: Parse and validate payload ─────────────────────────────────
  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const repoFullName = payload.repository?.full_name
  if (!repoFullName) {
    return NextResponse.json({ error: 'Missing repository info' }, { status: 400 })
  }

  // Only trigger on published releases (not draft/pre-release)
  if (payload.action !== 'published') {
    return NextResponse.json({ ok: true })
  }

  // ─── Step 3: Find project and verify webhook secret ────────────────────
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*, workspaces(*)')
    .eq('github_repo', repoFullName)
    .single()

  if (!project) {
    // Repo not connected to any project, skip silently
    return NextResponse.json({ ok: true })
  }

  const workspace = project.workspaces

  // Verify webhook signature if secret is set
  if (project.github_webhook_secret) {
    try {
      const decryptedSecret = decryptSecret(project.github_webhook_secret)
      const isValid = verifySignature(body, signature, decryptedSecret)
      
      if (!isValid) {
        // Log failed signature verification
        await supabaseAdmin.from('webhook_logs').insert({
          project_id: project.id,
          event_type: 'release',
          payload: { action: payload.action, tag: payload.release?.tag_name },
          status: 'invalid_signature',
          error_message: 'GitHub signature verification failed',
        })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } catch (error) {
      console.error('[webhook] Signature verification error:', error)
      await supabaseAdmin.from('webhook_logs').insert({
        project_id: project.id,
        event_type: 'release',
        payload: { action: payload.action, tag: payload.release?.tag_name },
        status: 'failed',
        error_message: `Signature verification error: ${error instanceof Error ? error.message : 'Unknown'}`,
      })
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 500 })
    }
  }

  // ─── Step 4: Check plan (only Starter+ gets auto-publish) ──────────────
  if (workspace.plan === 'free') {
    // Free plan doesn't get auto-publish feature
    return NextResponse.json({ ok: true })
  }

  // ─── Step 5: Prepare for changelog generation ──────────────────────────
  const parsed = parseGitHubRepo(repoFullName)
  if (!parsed) {
    await supabaseAdmin.from('webhook_logs').insert({
      project_id: project.id,
      event_type: 'release',
      payload: { action: payload.action, tag: payload.release?.tag_name, repo: repoFullName },
      status: 'invalid_event',
      error_message: 'Invalid repository format',
    })
    return NextResponse.json({ ok: true })
  }

  if (!workspace.github_access_token) {
    await supabaseAdmin.from('webhook_logs').insert({
      project_id: project.id,
      event_type: 'release',
      payload: { action: payload.action, tag: payload.release?.tag_name },
      status: 'failed',
      error_message: 'GitHub access token not found for workspace',
    })
    return NextResponse.json({ ok: true })
  }

  const release = payload.release
  const tag = release.tag_name

  try {
    // ─── Step 6: Fetch commits between releases ──────────────────────────
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

    if (!commits.length) {
      await supabaseAdmin.from('webhook_logs').insert({
        project_id: project.id,
        event_type: 'release',
        payload: { action: payload.action, tag, from_tag: previousRelease?.tag },
        status: 'success',
        error_message: 'No commits found between releases',
      })
      return NextResponse.json({ ok: true })
    }

    // ─── Step 7: Generate changelog using tone preference ────────────────
    const tone = (project.webhook_tone_preference || 'user-friendly') as ChangelogTone
    const { title, content, tags, tokensUsed } = await generateChangelogGroq({
      commits,
      version: tag,
      projectName: project.name,
      tone,
    })

    // ─── Step 8: Save and auto-publish changelog ─────────────────────────
    const { data: changelog, error: insertError } = await supabaseAdmin
      .from('changelogs')
      .insert({
        project_id: project.id,
        workspace_id: workspace.id,
        title,
        version: tag,
        content_md: content,
        tone,
        status: 'published',
        published_at: new Date().toISOString(),
        from_commit: previousRelease?.tag ?? null,
        to_commit: tag,
        tags,
        generation_tokens: tokensUsed,
      })
      .select()
      .single()

    if (insertError || !changelog) {
      console.error('[webhook] Failed to insert changelog:', insertError)
      await supabaseAdmin.from('webhook_logs').insert({
        project_id: project.id,
        event_type: 'release',
        payload: { action: payload.action, tag },
        status: 'failed',
        error_message: `Failed to save changelog: ${insertError?.message || 'Unknown error'}`,
      })
      return NextResponse.json({ ok: true })
    }

    // ─── Step 9: Log usage for billing ──────────────────────────────────
    await supabaseAdmin.from('generation_usage').insert({
      workspace_id: workspace.id,
      project_id: project.id,
      changelog_id: changelog.id,
      tokens_used: tokensUsed,
    })

    // ─── Step 10: Log successful webhook ────────────────────────────────
    await supabaseAdmin.from('webhook_logs').insert({
      project_id: project.id,
      event_type: 'release',
      payload: { action: payload.action, tag, tone },
      status: 'success',
      changelog_id: changelog.id,
    })

    // ─── Step 11: Notify email subscribers ────────────────────────────────
    const { data: subscribers } = await supabaseAdmin
      .from('changelog_subscribers')
      .select('email')
      .eq('project_id', project.id)
      .eq('confirmed', true)

    const emails = (subscribers ?? []).map((s: { email: string }) => s.email)
    if (emails.length > 0) {
      sendChangelogNotification({ subscribers: emails, changelog, project, workspace }).catch((err) => {
        console.error('[webhook] Failed to send notifications:', err)
      })
    }

    return NextResponse.json({ ok: true, changelogId: changelog.id, subscribers: emails.length })
  } catch (error) {
    console.error('[webhook] Unexpected error:', error)
    await supabaseAdmin.from('webhook_logs').insert({
      project_id: project.id,
      event_type: 'release',
      payload: { action: payload.action, tag: release?.tag_name },
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ ok: true }) // Return success to prevent webhook retry
  }
}
