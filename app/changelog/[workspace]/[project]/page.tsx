import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import SubscribeForm from './SubscribeForm'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ workspace: string; project: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('name, description, workspaces(name)')
    .eq('slug', params.project)
    .eq('is_public', true)
    .single()

  if (!project) return { title: 'Changelog' }
  return {
    title: `${project.name} Changelog`,
    description: project.description ?? `Latest updates from ${project.name}`,
  }
}

export default async function PublicChangelogPage(props: Props) {
  const params = await props.params
  // Fetch workspace
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('slug', params.workspace)
    .single()

  if (!workspace) notFound()

  // Fetch project
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('slug', params.project)
    .eq('is_public', true)
    .single()

  if (!project) notFound()

  // Fetch published changelogs
  const { data: changelogs } = await supabaseAdmin
    .from('changelogs')
    .select('*')
    .eq('project_id', project.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const brandColor = workspace.brand_color ?? '#6366f1'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-start justify-between">
          <div>
            {workspace.logo_url && (
              <img src={workspace.logo_url} alt={workspace.name} className="h-8 mb-3" />
            )}
            <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>{project.name} Changelog</h1>
            {project.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
            )}
          </div>
          <SubscribeForm projectId={project.id} brandColor={brandColor} />
        </div>
      </header>

      {/* Changelogs */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {!changelogs?.length ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <p className="text-lg mb-2">No changelogs yet</p>
            <p className="text-sm">Subscribe to get notified when the first one drops.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {changelogs.map((cl) => (
              <article key={cl.id}>
                <div className="flex items-center gap-3 mb-4">
                  {cl.version && (
                    <span
                      className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: brandColor + '18', color: brandColor }}
                    >
                      {cl.version}
                    </span>
                  )}
                  <time className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                    {formatDate(cl.published_at ?? cl.created_at)}
                  </time>
                  <div className="flex gap-1.5 flex-wrap">
                    {cl.tags?.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full border" style={{ color: 'var(--text-muted)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>{cl.title}</h2>
                <div
                  className="changelog-content"
                  dangerouslySetInnerHTML={{ __html: cl.content_html ?? simpleMarkdown(cl.content_md) }}
                />
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      {project.show_branding && (
        <footer className="border-t py-6 px-6 text-center">
          <a
            href={process.env.NEXT_PUBLIC_APP_URL}
            className="text-xs"
            style={{ color: 'var(--text-subtle)' }}
          >
            Powered by Changelogly
          </a>
        </footer>
      )}
    </div>
  )
}

function simpleMarkdown(md: string): string {
  if (!md) return ''
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)\n?(?=<li>|$)/g, '$1')
    .replace(/(<li>.*(?:\n(?!<li>).+)*)/gs, '<ul>$&</ul>')
    .replace(/\n\n+/g, '<br/><br/>')
}
