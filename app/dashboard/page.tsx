import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FolderGit2, ScrollText, Users, Zap, Plus, ArrowRight,
  TrendingUp, ExternalLink
} from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { formatRelative } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Project, Changelog } from '@/types'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  team: 'Team',
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) redirect('/onboarding')

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

  const stats = [
    {
      label: 'Projects',
      value: projects?.length ?? 0,
      icon: FolderGit2,
      iconBg: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/dashboard/projects',
    },
    {
      label: 'Published',
      value: totalPublished ?? 0,
      icon: ScrollText,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/dashboard/changelogs',
    },
    {
      label: 'Subscribers',
      value: totalSubscribers ?? 0,
      icon: Users,
      iconBg: 'bg-violet-50 dark:bg-violet-950',
      iconColor: 'text-violet-600 dark:text-violet-400',
      href: '/dashboard/changelogs',
    },
    {
      label: 'Plan',
      value: PLAN_LABELS[workspace.plan] ?? workspace.plan,
      icon: Zap,
      iconBg: 'bg-amber-50 dark:bg-amber-950',
      iconColor: 'text-amber-600 dark:text-amber-400',
      href: '/dashboard/settings',
    },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Page header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>
              Welcome back 👋
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {workspace.name}
              <span
                className="inline-flex items-center ml-2 text-xs font-medium px-2 py-0.5 rounded-full border"
                style={{
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)',
                  background: 'var(--accent-subtle)',
                }}
              >
                {PLAN_LABELS[workspace.plan] ?? workspace.plan}
              </span>
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="w-3.5 h-3.5" />
              New project
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.label} href={s.href}>
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${s.iconColor}`} />
                      </div>
                      <TrendingUp className="w-3.5 h-3.5 opacity-20" />
                    </div>
                    <p className="text-2xl font-bold mb-0.5" style={{ letterSpacing: '-0.03em' }}>
                      {s.value}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                      {s.label}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Projects ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Projects</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/projects/new">
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {(projects ?? []).length > 0 ? (
                <ul>
                  {(projects ?? []).map((p: Project, i: number) => (
                    <li key={p.id}>
                      <Link
                        href={`/dashboard/projects/${p.id}/generate`}
                        className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-[var(--bg-subtle)] group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                            {p.github_repo ?? 'No repo connected'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <ExternalLink
                            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity"
                          />
                          <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-70 transition-opacity" />
                        </div>
                      </Link>
                      {i < (projects ?? []).length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div
                    className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4"
                  >
                    <FolderGit2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium mb-1">No projects yet</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    Connect a GitHub repo to get started
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/projects/new">Create first project</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Recent changelogs ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Changelogs</CardTitle>
                <Link
                  href="/dashboard/changelogs"
                  className="text-xs font-medium transition-colors hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  View all →
                </Link>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {(recentChangelogs ?? []).length > 0 ? (
                <ul>
                  {(recentChangelogs ?? []).map((c: Changelog, i: number) => (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/changelogs/${c.id}`}
                        className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-[var(--bg-subtle)] group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                            {formatRelative(c.created_at)}
                          </p>
                        </div>
                        <Badge
                          variant={c.status === 'published' ? 'success' : 'secondary'}
                          className="ml-3 flex-shrink-0"
                        >
                          {c.status}
                        </Badge>
                      </Link>
                      {i < (recentChangelogs ?? []).length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div
                    className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center mb-4"
                  >
                    <ScrollText className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium mb-1">No changelogs yet</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                    Generate your first changelog from a project
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/projects">Go to projects</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
