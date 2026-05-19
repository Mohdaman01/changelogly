import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSecret, encryptSecret } from '@/lib/encryption'
import { getOctokit } from '@/lib/github'
import { z } from 'zod'

const schema = z.object({
  projectId: z.string().uuid(),
  tone: z.enum(['technical', 'marketing', 'user-friendly']).optional(),
})

/**
 * POST /api/workspace/webhook/register
 * Registers a GitHub webhook for a project and stores the secret
 * 
 * Required:
 * - projectId: UUID of the project
 * 
 * Optional:
 * - tone: Preferred tone for auto-generated changelogs (default: user-friendly)
 * 
 * Response: { webhookUrl, secret, projectId }
 * Secret should be stored in GitHub webhook settings
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
  }

  const { projectId, tone = 'user-friendly' } = parsed.data

  // ─── Verify workspace ownership ────────────────────────────────────────
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, github_access_token, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // ─── Verify project ownership and get details ──────────────────────────
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // ─── Check plan (only Starter+ can use webhooks) ────────────────────────
  if (workspace.plan === 'free') {
    return NextResponse.json(
      { error: 'Webhook auto-publish requires Starter plan or higher' },
      { status: 402 }
    )
  }

  // ─── Verify GitHub connection ─────────────────────────────────────────
  if (!workspace.github_access_token || !project.github_repo) {
    return NextResponse.json(
      { error: 'GitHub not connected or repo not configured' },
      { status: 400 }
    )
  }

  // ─── Generate webhook secret ──────────────────────────────────────────
  const secret = generateSecret()
  const encryptedSecret = encryptSecret(secret)

  // ─── Register webhook on GitHub ────────────────────────────────────────
  let githubWebhookId: string | null = null
  try {
    const [owner, repo] = project.github_repo.split('/')
    const octokit = getOctokit(workspace.github_access_token)

    const webhookResponse = await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://changelogly.com'}/api/webhooks/github`,
        content_type: 'json',
        secret,
        insecure_ssl: '0',
      },
      events: ['release'],
      active: true,
    })

    githubWebhookId = String(webhookResponse.data.id)
  } catch (error) {
    console.error('[webhook] Failed to register webhook on GitHub:', error)
    return NextResponse.json(
      { error: 'Failed to register webhook on GitHub. Check your GitHub credentials.' },
      { status: 500 }
    )
  }

  // ─── Save webhook secret and GitHub ID to project ──────────────────────
  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({
      github_webhook_secret: encryptedSecret,
      github_webhook_id: githubWebhookId,
      webhook_tone_preference: tone,
    })
    .eq('id', projectId)

  if (updateError) {
    console.error('[webhook] Failed to save webhook secret:', updateError)
    return NextResponse.json({ error: 'Failed to save webhook configuration' }, { status: 500 })
  }

  // ─── Return webhook URL and secret for user to verify ─────────────────
  return NextResponse.json({
    success: true,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://changelogly.com'}/api/webhooks/github`,
    projectId,
    tone,
    message: 'Webhook registered successfully. The secret has been configured on GitHub.',
  })
}

/**
 * DELETE /api/workspace/webhook/register
 * Removes webhook secret and disables auto-publish for a project
 */
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  // ─── Verify workspace ownership ────────────────────────────────────────
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, github_access_token')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // ─── Verify project ownership ─────────────────────────────────────────
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // ─── Delete webhook from GitHub ────────────────────────────────────────
  if (project.github_webhook_id && workspace.github_access_token && project.github_repo) {
    try {
      const [owner, repo] = project.github_repo.split('/')
      const octokit = getOctokit(workspace.github_access_token)

      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: parseInt(project.github_webhook_id),
      })
    } catch (error) {
      console.error('[webhook] Failed to delete webhook from GitHub:', error)
      // Continue anyway - remove from our DB
    }
  }

  // ─── Clear webhook data from project ────────────────────────────────────
  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update({
      github_webhook_secret: null,
      github_webhook_id: null,
    })
    .eq('id', projectId)

  if (updateError) {
    console.error('[webhook] Failed to clear webhook data:', updateError)
    return NextResponse.json({ error: 'Failed to clear webhook data' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Webhook unregistered successfully',
  })
}
