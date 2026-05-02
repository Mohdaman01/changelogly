import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: changelogs } = await supabaseAdmin
    .from('changelogs')
    .select('id, title, version, tags, published_at')
    .eq('project_id', projectId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  return NextResponse.json(
    { changelogs: changelogs ?? [] },
    {
      headers: {
        'Access-Control-Allow-Origin': '*', // Public widget endpoint
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
