import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import PublicChangelogView from '@/components/PublicChangelogView'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ domain: string; slug?: string[] }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const domain = decodeURIComponent(params.domain)
  
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('name')
    .eq('custom_domain', domain)
    .single()

  if (!workspace) return { title: 'Changelog' }
  return {
    title: `${workspace.name} Changelog`,
  }
}

export default async function DomainPage(props: Props) {
  const params = await props.params
  const domain = decodeURIComponent(params.domain)
  const pathSlug = params.slug?.[0] // e.g. custom.com/my-project -> slug is ['my-project']

  // 1. Find workspace by custom domain
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('custom_domain', domain)
    .single()

  if (!workspace) notFound()

  // 2. Find project
  let projectQuery = supabaseAdmin
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('is_public', true)

  if (pathSlug) {
    projectQuery = projectQuery.eq('slug', pathSlug)
  } else {
    // If no slug, just get the first project
    projectQuery = projectQuery.order('created_at', { ascending: true }).limit(1)
  }

  const { data: project } = await projectQuery.single()

  if (!project) notFound()

  // 3. Fetch published changelogs
  const { data: changelogs } = await supabaseAdmin
    .from('changelogs')
    .select('*')
    .eq('project_id', project.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <PublicChangelogView
      workspace={workspace}
      project={project}
      changelogs={changelogs ?? []}
    />
  )
}
