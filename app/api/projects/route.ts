import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { z } from 'zod'
import { PLAN_LIMITS } from '@/types'

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional(),
  github_repo: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { name, description, github_repo } = parsed.data

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Check plan limits
  const { count } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)

  const limit = PLAN_LIMITS[workspace.plan as keyof typeof PLAN_LIMITS].projects
  if (limit !== -1 && (count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Your ${workspace.plan} plan allows ${limit} project(s). Upgrade to add more.` },
      { status: 402 }
    )
  }

  const slug = parsed.data.slug ?? slugify(name)

  const { data: project, error } = await supabaseAdmin
    .from('projects')
    .insert({
      workspace_id: workspace.id,
      name,
      slug,
      description,
      github_repo: github_repo || null,
      show_branding: workspace.plan === 'free' || workspace.plan === 'starter',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A project with that slug already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project })
}
