import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSubscriberConfirmation } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  projectId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { email, projectId } = parsed.data

  // Fetch project + workspace
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*, workspaces(*)')
    .eq('id', projectId)
    .single()

  if (!project || !project.is_public) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Upsert subscriber (don't leak if already subscribed)
  const { data: subscriber, error } = await supabaseAdmin
    .from('changelog_subscribers')
    .upsert({ project_id: projectId, email, confirmed: false }, { onConflict: 'project_id,email', ignoreDuplicates: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send confirmation email
  await sendSubscriberConfirmation({
    email,
    token: subscriber.token,
    project,
    workspace: project.workspaces,
  })

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('changelog_subscribers')
    .update({ confirmed: true })
    .eq('token', token)

  if (error) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  return NextResponse.redirect(
    new URL('/subscribed?confirmed=true', process.env.NEXT_PUBLIC_APP_URL!)
  )
}
