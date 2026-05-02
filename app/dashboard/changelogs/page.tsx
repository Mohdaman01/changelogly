import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { formatRelative } from '@/lib/utils'
import type { Changelog } from '@/types'

export default async function ChangelogsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { data: workspace } = await supabaseAdmin
    .from('workspaces').select('id').eq('clerk_user_id', userId).single()
  if (!workspace) redirect('/onboarding')

  const { data: changelogs } = await supabaseAdmin
    .from('changelogs')
    .select('*, projects(name, slug)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>Changelogs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{changelogs?.length ?? 0} total</p>
        </div>
      </div>

      {!changelogs?.length ? (
        <div className="text-center py-20 rounded-2xl border border-dashed">
          <p className="text-lg font-medium mb-2">No changelogs yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Go to a project and generate your first changelog from GitHub commits.</p>
          <Link href="/dashboard/projects" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            View projects →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Title</th>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Project</th>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-left px-5 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {changelogs.map((cl: Changelog & { projects: { name: string; slug: string } }, i) => (
                <tr key={cl.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-xs">{cl.title}</span>
                      {cl.version && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                          {cl.version}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {cl.tags?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {cl.projects?.name ?? '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${cl.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {cl.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatRelative(cl.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/changelogs/${cl.id}`}
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
