import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { name, slug } = parsed.data

  // Check slug uniqueness
  const { data: existing } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'That URL is already taken. Try another.' }, { status: 409 })
  }

  // Check if workspace already exists for this user
  const { data: existingWorkspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (existingWorkspace) {
    return NextResponse.json({ error: 'Workspace already exists' }, { status: 409 })
  }

  const { data: workspace, error } = await supabaseAdmin
    .from('workspaces')
    .insert({ clerk_user_id: userId, name, slug, plan: 'free' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ workspace })
}
