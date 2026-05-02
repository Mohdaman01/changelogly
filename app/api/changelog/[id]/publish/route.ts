import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendChangelogNotification } from '@/lib/email'

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: changelog } = await supabaseAdmin
    .from('changelogs')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()

  if (!changelog) return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })

  // Update to published
  const { data: updated, error } = await supabaseAdmin
    .from('changelogs')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch project
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', changelog.project_id)
    .single()

  if (!project) return NextResponse.json({ changelog: updated })

  // Fetch confirmed subscribers
  const { data: subscribers } = await supabaseAdmin
    .from('changelog_subscribers')
    .select('email')
    .eq('project_id', project.id)
    .eq('confirmed', true)

  const emails = (subscribers ?? []).map((s: { email: string }) => s.email)

  // Send emails in background (don't await)
  if (emails.length > 0) {
    sendChangelogNotification({
      subscribers: emails,
      changelog: updated,
      project,
      workspace,
    }).catch(console.error)
  }

  return NextResponse.json({ changelog: updated, notified: emails.length })
}
