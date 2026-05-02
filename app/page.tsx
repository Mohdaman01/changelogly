import Link from 'next/link'
import { Show } from '@clerk/nextjs'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--accent)' }}>C</div>
          <span className="font-semibold text-[15px]">Changelogly</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-sm" style={{ color: 'var(--text-muted)' }}>Pricing</Link>
          <Show when="signed-out">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-[var(--bg-subtle)]">
              Sign in
            </Link>
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg font-medium text-white transition-colors" style={{ background: 'var(--accent)' }}>
              Get started free
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: 'var(--accent)' }}>
              Dashboard →
            </Link>
          </Show>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-24 pb-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border mb-8" style={{ color: 'var(--accent)', background: 'var(--accent-subtle)', borderColor: 'var(--accent)' }}>
          ✦ Connect GitHub. Auto-generate. Publish in seconds.
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6 text-balance" style={{ letterSpacing: '-0.03em' }}>
          Changelogs your users<br />will actually read
        </h1>
        <p className="text-xl leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
          Connect your GitHub repo, pick a date range, and let AI transform raw commits into polished, human-friendly release notes — published to your own branded page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login" className="px-6 py-3 rounded-xl font-semibold text-white text-[15px] transition-all hover:opacity-90 active:scale-95" style={{ background: 'var(--accent)' }}>
            Start for free →
          </Link>
          <Link href="/changelog/demo/main" className="px-6 py-3 rounded-xl font-semibold text-[15px] border transition-all hover:bg-[var(--bg-subtle)]">
            See example
          </Link>
        </div>
        <p className="mt-4 text-sm" style={{ color: 'var(--text-subtle)' }}>No credit card required · Free plan forever</p>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'GitHub-native', desc: 'Connect any repo in one click. We fetch commits, PRs, and release tags automatically.' },
            { icon: '✨', title: 'AI-powered writing', desc: 'GPT-4o-mini transforms cryptic commit messages into clean, readable release notes.' },
            { icon: '🌐', title: 'Branded public page', desc: 'Get yourapp.changelogly.com instantly. Custom domain on paid plans. RSS included.' },
            { icon: '📬', title: 'Email subscribers', desc: 'Let users subscribe. Auto-send notification emails whenever you publish.' },
            { icon: '🔔', title: 'In-app widget', desc: 'Embed a "What\'s new" popup in your app with a 2-line JS snippet. Pro plan.' },
            { icon: '🤖', title: 'Auto-publish', desc: 'Create a GitHub release tag → changelog auto-generated and published. Zero manual work.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border" style={{ background: 'var(--bg-subtle)' }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ letterSpacing: '-0.02em' }}>Simple pricing</h2>
        <p className="text-center mb-12" style={{ color: 'var(--text-muted)' }}>Start free. Upgrade when you need more.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: 'Free', price: '$0', sub: 'forever', features: ['1 project', '10 AI generations/mo', 'Public changelog page', 'Changelogly branding'], featured: false },
            { name: 'Starter', price: '$19', sub: '/month', features: ['3 projects', 'Unlimited AI generations', 'Custom domain', 'Auto-publish on release', 'Email subscribers'], featured: false },
            { name: 'Pro', price: '$49', sub: '/month', features: ['10 projects', 'In-app widget', 'Slack / Discord alerts', 'Remove branding', '3 team members'], featured: true },
            { name: 'Team', price: '$99', sub: '/month', features: ['Unlimited projects', 'Unlimited team members', 'API access', 'Custom AI tone presets', 'Priority support'], featured: false },
          ].map((p) => (
            <div key={p.name} className={`p-6 rounded-2xl border flex flex-col ${p.featured ? 'border-indigo-400 ring-2 ring-indigo-200' : ''}`} style={{ background: 'var(--bg)' }}>
              {p.featured && <div className="text-xs font-semibold text-indigo-600 mb-3">Most popular</div>}
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{p.name}</div>
              <div className="text-3xl font-bold mb-0.5" style={{ letterSpacing: '-0.02em' }}>{p.price}</div>
              <div className="text-sm mb-6" style={{ color: 'var(--text-subtle)' }}>{p.sub}</div>
              <ul className="space-y-2 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <span style={{ color: 'var(--success)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`text-sm text-center py-2.5 rounded-xl font-medium border transition-colors ${p.featured ? 'text-white' : 'hover:bg-[var(--bg-subtle)]'}`} style={p.featured ? { background: 'var(--accent)' } : {}}>
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm" style={{ color: 'var(--text-subtle)' }}>
          <span>© 2025 Changelogly</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
