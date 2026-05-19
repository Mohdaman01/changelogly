import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { changelogUpdateSchema } from '@/lib/changelog-schema'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('clerk_user_id', userId).single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: changelog } = await supabaseAdmin
    .from('changelogs').select('*').eq('id', params.id).eq('workspace_id', workspace.id).single()

  if (!changelog) return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })
  return NextResponse.json({ changelog })
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('clerk_user_id', userId).single()
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Verify changelog exists and belongs to user's workspace
  const { data: existing } = await supabaseAdmin
    .from('changelogs')
    .select('*')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })

  const body = await req.json()

  // Validate using schema
  const parsed = changelogUpdateSchema.safeParse({
    title: body.title,
    content_md: body.content_md,
    version: body.version,
    tags: body.tags,
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten()
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: errors.fieldErrors,
      },
      { status: 400 }
    )
  }

  // Prepare update object
  const update = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }

  // Update changelog
  const { data: changelog, error } = await supabaseAdmin
    .from('changelogs')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[changelog] Update error:', error)
    return NextResponse.json({ error: 'Failed to update changelog' }, { status: 500 })
  }

  return NextResponse.json({ changelog, message: 'Changelog updated successfully' })
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('clerk_user_id', userId).single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Verify changelog exists and belongs to user's workspace
  const { data: changelog } = await supabaseAdmin
    .from('changelogs')
    .select('status')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single()

  if (!changelog) return NextResponse.json({ error: 'Changelog not found' }, { status: 404 })

  // Only allow deleting drafts
  if (changelog.status !== 'draft') {
    return NextResponse.json(
      { error: 'Can only delete draft changelogs' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('changelogs')
    .delete()
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)

  if (error) {
    console.error('[changelog] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete changelog' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Changelog deleted successfully' })
}
