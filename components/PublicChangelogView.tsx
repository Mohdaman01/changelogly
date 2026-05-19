import { formatDate, simpleMarkdown } from '@/lib/utils'
import SubscribeForm from './SubscribeForm'
import type { Workspace, Project, Changelog } from '@/types'

interface Props {
  workspace: Workspace
  project: Project
  changelogs: Changelog[]
}

export default function PublicChangelogView({ workspace, project, changelogs }: Props) {
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
            href={process.env.NEXT_PUBLIC_APP_URL || 'https://changelogly.com'}
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
