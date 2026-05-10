'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, FolderGit2, ScrollText, Settings, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderGit2 },
  { href: '/dashboard/changelogs', label: 'Changelogs', icon: ScrollText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-60 flex-shrink-0 border-r flex flex-col"
        style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform group-hover:scale-105"
              style={{ background: 'var(--accent)' }}
            >
              C
            </div>
            <span className="font-bold text-[15px] tracking-tight">Changelogly</span>
          </Link>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-1">
          {nav.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'shadow-sm'
                    : 'hover:bg-[var(--bg-muted)]'
                )}
                style={
                  active
                    ? {
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                      }
                    : { color: 'var(--text-muted)' }
                }
              >
                <Icon
                  className={cn('w-4 h-4 flex-shrink-0', active ? '' : 'opacity-70')}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* Upgrade banner */}
        <div className="p-3">
          <div
            className="rounded-lg p-3 mb-3"
            style={{ background: 'var(--accent-subtle)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                Upgrade to Pro
              </span>
            </div>
            <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
              Get in-app widgets, custom domains & more.
            </p>
            <Link
              href="/dashboard/settings"
              className="text-[11px] font-semibold underline underline-offset-2"
              style={{ color: 'var(--accent)' }}
            >
              View plans →
            </Link>
          </div>

          {/* User */}
          <div className="flex items-center gap-2 px-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7',
                },
              }}
            />
            <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              Account settings
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto flex flex-col">
        {children}
      </main>
    </div>
  )
}
