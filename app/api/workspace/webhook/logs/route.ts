import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const querySchema = z.object({
  projectId: z.string().uuid(),
  limit: z.string().optional().default('20'),
  offset: z.string().optional().default('0'),
})

/**
 * GET /api/workspace/webhook/logs
 * Fetch webhook attempt logs for a project
 * 
 * Query:
 * - projectId: UUID of the project (required)
 * - limit: Number of logs to return (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * 
 * Response: { logs, total }
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({
    projectId: searchParams.get('projectId'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
  }

  const { projectId, limit, offset } = parsed.data
  const parsedLimit = Math.min(parseInt(limit), 100) // Cap at 100
  const parsedOffset = Math.max(parseInt(offset), 0)

  // ─── Verify workspace ownership ────────────────────────────────────────
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // ─── Verify project ownership ─────────────────────────────────────────
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // ─── Fetch webhook logs ────────────────────────────────────────────────
  const { data: logs, count } = await supabaseAdmin
    .from('webhook_logs')
    .select('id, event_type, status, error_message, changelog_id, created_at, payload', {
      count: 'exact',
    })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(parsedOffset, parsedOffset + parsedLimit - 1)

  return NextResponse.json({
    logs: logs ?? [],
    total: count ?? 0,
    limit: parsedLimit,
    offset: parsedOffset,
  })
}

/**
 * DELETE /api/workspace/webhook/logs
 * Clear all webhook logs for a project
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
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // ─── Verify project ownership ─────────────────────────────────────────
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // ─── Delete logs ───────────────────────────────────────────────────────
  const { error } = await supabaseAdmin
    .from('webhook_logs')
    .delete()
    .eq('project_id', projectId)

  if (error) {
    console.error('[webhook] Failed to delete logs:', error)
    return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Webhook logs cleared' })
}
