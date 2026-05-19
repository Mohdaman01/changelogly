import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { formatRelative } from '@/lib/utils'
import type { Project } from '@/types'

export default async function ProjectsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('*').eq('clerk_user_id', userId).single()
  if (!workspace) redirect('/onboarding')

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*, changelogs(count)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="text-sm px-4 py-2.5 rounded-xl font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          + New project
        </Link>
      </div>

      {!projects?.length ? (
        <div className="text-center py-20 rounded-2xl border border-dashed">
          <p className="text-xl font-medium mb-2">Create your first project</p>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Connect a GitHub repo and start generating changelogs in minutes.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'var(--accent)' }}
          >
            Create project →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p: Project & { changelogs: { count: number }[] }) => {
            const changelogCount = p.changelogs?.[0]?.count ?? 0
            return (
              <div
                key={p.id}
                className="rounded-2xl border p-5 transition-colors hover:border-[var(--accent)]"
                style={{ background: 'var(--bg)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.is_public ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.is_public ? 'Public' : 'Private'}
                  </span>
                </div>

                {p.github_repo && (
                  <p className="text-xs font-mono mb-3 flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    {p.github_repo}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                    {changelogCount} changelog{changelogCount !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/projects/${p.id}/settings`}
                      className="text-xs px-2 py-1.5 rounded-lg font-medium"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--accent)' }}
                    >
                      ⚙ Settings
                    </Link>
                    <Link
                      href={`/changelog/${workspace.slug}/${p.slug}`}
                      target="_blank"
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      View public →
                    </Link>
                    <Link
                      href={`/dashboard/projects/${p.id}/generate`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      Generate
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
