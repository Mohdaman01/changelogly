import Link from 'next/link'
import { Show } from '@clerk/nextjs'
import {
  Zap, Sparkles, Globe, Mail, Bell, Bot,
  CheckCircle2, ArrowRight, GitBranch, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const features = [
  {
    icon: GitBranch,
    title: 'GitHub-native',
    desc: 'Connect any repo in one click. We fetch commits, PRs, and release tags automatically.',
    color: 'text-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-900',
  },
  {
    icon: Sparkles,
    title: 'AI-powered writing',
    desc: 'AI transforms cryptic commit messages into clean, readable release notes with perfect tone.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950',
  },
  {
    icon: Globe,
    title: 'Branded public page',
    desc: 'Get yourapp.changelogly.com instantly. Custom domain on paid plans. RSS included.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: Mail,
    title: 'Email subscribers',
    desc: 'Let users subscribe. Auto-send polished notification emails whenever you publish.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
  },
  {
    icon: Bell,
    title: 'In-app widget',
    desc: "Embed a 'What's new' popup in your app with a 2-line JS snippet.",
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950',
  },
  {
    icon: Bot,
    title: 'Auto-publish',
    desc: 'Create a GitHub release tag → changelog auto-generated and published. Zero manual work.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    sub: 'forever',
    features: ['1 project', '10 AI generations/mo', 'Public changelog page', 'Changelogly branding'],
    featured: false,
    cta: 'Get started free',
  },
  {
    name: 'Starter',
    price: '$19',
    sub: '/month',
    features: ['3 projects', 'Unlimited AI generations', 'Custom domain', 'Auto-publish on release', 'Email subscribers'],
    featured: false,
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$49',
    sub: '/month',
    features: ['10 projects', 'In-app widget', 'Slack / Discord alerts', 'Remove branding', '3 team members'],
    featured: true,
    cta: 'Get started',
  },
  {
    name: 'Team',
    price: '$99',
    sub: '/month',
    features: ['Unlimited projects', 'Unlimited team members', 'API access', 'Custom AI tone presets', 'Priority support'],
    featured: false,
    cta: 'Get started',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <nav className="flex items-center justify-between px-6 py-3.5 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ background: 'var(--accent)' }}
            >
              C
            </div>
            <span className="font-bold text-[15px] tracking-tight">Changelogly</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="#features"
              className="text-sm px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: 'var(--text-muted)' }}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: 'var(--text-muted)' }}
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">
                  Get started free
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button size="sm" asChild>
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </Show>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient orb */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative text-center px-6 pt-24 pb-24 max-w-4xl mx-auto">
          <Badge variant="accent" className="mb-6 text-xs py-1 px-3">
            <Zap className="w-3 h-3" />
            Connect GitHub · Auto-generate · Publish in seconds
          </Badge>

          <h1
            className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6 text-balance"
            style={{ letterSpacing: '-0.035em' }}
          >
            Changelogs your users
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
              }}
            >
              will actually read
            </span>
          </h1>

          <p
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            Connect your GitHub repo, pick a date range, and let AI transform raw
            commits into polished, human-friendly release notes — published to your
            own branded page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="xl" asChild>
              <Link href="/login">
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/changelog/demo/main">See an example</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm" style={{ color: 'var(--text-subtle)' }}>
            No credit card required · Free plan forever
          </p>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 flex-wrap">
            {['Trusted by 500+ developers', '1M+ changelogs generated', '4.9★ rating'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Features ── */}
      <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Badge variant="accent" className="mb-4">Features</Badge>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Everything you need to ship
            <br />beautiful changelogs
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            From commit to published changelog in under 60 seconds. No writing required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <Card
                key={f.title}
                className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-[var(--border)]"
                style={{ background: 'var(--bg-subtle)' }}
              >
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="leading-relaxed text-[13.5px]">
                    {f.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* ── Pricing ── */}
      <section id="pricing" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Badge variant="accent" className="mb-4">Pricing</Badge>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ letterSpacing: '-0.02em' }}
          >
            Simple, transparent pricing
          </h2>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border flex flex-col p-6 transition-shadow duration-200 hover:shadow-md ${
                plan.featured
                  ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]'
                  : 'border-[var(--border)]'
              }`}
              style={{ background: plan.featured ? 'var(--accent-subtle)' : 'var(--bg)' }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="text-[11px] shadow-sm">
                    Most popular
                  </Badge>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-subtle)' }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold" style={{ letterSpacing: '-0.03em' }}>
                    {plan.price}
                  </span>
                  <span className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {plan.sub}
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? 'default' : 'outline'}
                className="w-full"
                asChild
              >
                <Link href="/login">
                  {plan.cta}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-24">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
            }}
          />
          <h2 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            Ready to ship better changelogs?
          </h2>
          <p className="text-white/80 mb-8 text-base">
            Join hundreds of developers who use Changelogly to communicate releases professionally.
          </p>
          <Button size="xl" className="bg-white text-[var(--accent)] hover:bg-white/90" asChild>
            <Link href="/login">
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'var(--accent)' }}
            >
              C
            </div>
            <span className="font-semibold text-sm">Changelogly</span>
            <span className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              © 2025
            </span>
          </div>
          <div className="flex gap-5 text-sm" style={{ color: 'var(--text-subtle)' }}>
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors">Terms</Link>
            <Link href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
