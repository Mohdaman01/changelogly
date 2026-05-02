import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { formatRelative } from '@/lib/utils'
import type { Workspace, Project, Changelog } from '@/types'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  // Fetch workspace
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) redirect('/onboarding')

  // Fetch projects + recent changelogs
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentChangelogs } = await supabaseAdmin
    .from('changelogs')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalPublished } = await supabaseAdmin
    .from('changelogs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .eq('status', 'published')

  const { count: totalSubscribers } = await supabaseAdmin
    .from('changelog_subscribers')
    .select('*', { count: 'exact', head: true })
    .in('project_id', (projects ?? []).map((p: Project) => p.id))
    .eq('confirmed', true)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
          Welcome back 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {workspace.name} · {workspace.plan} plan
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Projects', value: projects?.length ?? 0 },
          { label: 'Published changelogs', value: totalPublished ?? 0 },
          { label: 'Subscribers', value: totalSubscribers ?? 0 },
          { label: 'Plan', value: workspace.plan },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-subtle)' }}>{s.label}</p>
            <p className="text-2xl font-semibold" style={{ letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Projects</h2>
            <Link href="/dashboard/projects/new" className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg-subtle)]">
              + New project
            </Link>
          </div>
          <div className="space-y-2">
            {(projects ?? []).map((p: Project) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="flex items-center justify-between p-4 rounded-xl border transition-colors hover:bg-[var(--bg-subtle)]"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                    {p.github_repo ?? 'No repo connected'}
                  </p>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>→</span>
              </Link>
            ))}
            {!projects?.length && (
              <div className="text-center py-8 rounded-xl border border-dashed">
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No projects yet</p>
                <Link href="/dashboard/projects/new" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  Create your first project →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent changelogs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent changelogs</h2>
            <Link href="/dashboard/changelogs" className="text-xs" style={{ color: 'var(--text-muted)' }}>View all</Link>
          </div>
          <div className="space-y-2">
            {(recentChangelogs ?? []).map((c: Changelog) => (
              <Link
                key={c.id}
                href={`/dashboard/changelogs/${c.id}`}
                className="flex items-center justify-between p-4 rounded-xl border transition-colors hover:bg-[var(--bg-subtle)]"
              >
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                    {formatRelative(c.created_at)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.status === 'published'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {c.status}
                </span>
              </Link>
            ))}
            {!recentChangelogs?.length && (
              <div className="text-center py-8 rounded-xl border border-dashed">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No changelogs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
