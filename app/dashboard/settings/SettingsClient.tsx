'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Workspace } from '@/types'
import { PLAN_LIMITS } from '@/types'

const PLANS = [
  { key: 'free', label: 'Free', price: '$0', features: ['1 project', '10 generations/mo'] },
  { key: 'starter', label: 'Starter', price: '$19', features: ['3 projects', 'Unlimited generations', 'Custom domain', 'Auto-publish'] },
  { key: 'pro', label: 'Pro', price: '$49', features: ['10 projects', 'In-app widget', 'Remove branding', '3 team members'] },
  { key: 'team', label: 'Team', price: '$99', features: ['Unlimited projects', 'API access', 'Unlimited team members'] },
]

export default function SettingsClient({ workspace }: { workspace: Workspace }) {
  const params = useSearchParams()
  const [name, setName] = useState(workspace.name)
  const [brandColor, setBrandColor] = useState(workspace.brand_color ?? '#6366f1')
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portaling, setPortaling] = useState(false)

  const success = params.get('success')
  const error = params.get('error')

  const saveWorkspace = async () => {
    setSaving(true)
    const res = await fetch('/api/workspace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand_color: brandColor }),
    })
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan)
    const res = await fetch('/api/razorpay/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Something went wrong'); setUpgrading(null); return }

    // Load Razorpay checkout.js and open the modal
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: data.name,
        description: data.description,
        prefill: data.prefill,
        theme: data.theme,
        handler: () => {
          toast.success('Payment successful! Your plan will be updated shortly.')
          window.location.href = '/dashboard/settings?success=upgraded'
        },
      })
      rzp.open()
      setUpgrading(null)
    }
    document.body.appendChild(script)
  }

  const handlePortal = async () => {
    setPortaling(true)
    const res = await fetch('/api/razorpay/portal', { method: 'POST' })
    const data = await res.json()
    if (data.cancelled) {
      toast.success('Subscription cancelled. You\'ve been moved to the Free plan.')
      window.location.reload()
    } else {
      toast.error(data.error ?? 'Something went wrong')
    }
    setPortaling(false)
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your workspace, integrations, and billing.</p>
      </div>

      {/* Banners */}
      {success === 'github_connected' && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          GitHub connected successfully ✓
        </div>
      )}
      {error === 'github_denied' && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
          GitHub connection was denied. Please try again.
        </div>
      )}
      {success === 'upgraded' && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          Plan upgraded successfully! Welcome to {workspace.plan} ✓
        </div>
      )}

      {/* Workspace settings */}
      <section className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <h2 className="font-semibold mb-5">Workspace</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Workspace name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Brand color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-lg border cursor-pointer p-0.5"
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-32 px-3 py-2.5 rounded-lg border text-sm outline-none font-mono"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Used on your public changelog page</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Your changelog URL</label>
            <div className="flex items-center gap-2">
              <code className="text-sm px-3 py-2 rounded-lg border" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                {process.env.NEXT_PUBLIC_APP_URL}/changelog/{workspace.slug}/
              </code>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <button
            onClick={saveWorkspace}
            disabled={saving}
            className="px-5 py-2 rounded-lg font-medium text-sm text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* GitHub integration */}
      <section className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <h2 className="font-semibold mb-1">GitHub integration</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Connect GitHub to auto-fetch commits and set up release webhooks.</p>
        {workspace.github_access_token ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
            <a
              href="/api/auth/github"
              className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-[var(--bg-subtle)]"
            >
              Reconnect
            </a>
          </div>
        ) : (
          <a
            href="/api/auth/github"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white"
            style={{ background: '#24292e' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Connect GitHub
          </a>
        )}
      </section>

      {/* In-app widget snippet */}
      <section className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-semibold">In-app widget</h2>
          {workspace.plan !== 'pro' && workspace.plan !== 'team' && (
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>Pro+</span>
          )}
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Add this snippet to your app to show a "What's new" popup to your users.
        </p>
        {(workspace.plan === 'pro' || workspace.plan === 'team') ? (
          <div className="rounded-xl border overflow-hidden">
            <div className="px-3 py-2 text-xs font-medium" style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              index.html
            </div>
            <pre className="p-4 text-xs overflow-auto" style={{ background: 'var(--bg-subtle)', fontFamily: 'var(--font-mono)' }}>
              {`<script
  src="${process.env.NEXT_PUBLIC_APP_URL}/widget.js"
  data-project="YOUR_PROJECT_ID"
  data-position="bottom-right"
  data-brand-color="${brandColor}"
></script>`}
            </pre>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Upgrade to Pro to use the in-app widget</p>
            <button
              onClick={() => handleUpgrade('pro')}
              className="text-sm px-4 py-2 rounded-lg font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              Upgrade to Pro →
            </button>
          </div>
        )}
      </section>

      {/* Billing */}
      <section className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <h2 className="font-semibold mb-1">Plan & billing</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Current plan: <span className="font-semibold capitalize">{workspace.plan}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {PLANS.filter((p) => p.key !== 'free' && p.key !== workspace.plan).map((plan) => (
            <div
              key={plan.key}
              className="rounded-xl border p-4"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-semibold text-sm">{plan.label}</span>
                <span className="font-bold">{plan.price}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/mo</span></span>
              </div>
              <ul className="space-y-1 mb-3">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={upgrading === plan.key}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {upgrading === plan.key ? 'Redirecting…' : `Upgrade to ${plan.label}`}
              </button>
            </div>
          ))}
        </div>

        {workspace.razorpay_customer_id && (
          <button
            onClick={handlePortal}
            disabled={portaling}
            className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-50"
            style={{ color: '#dc2626', borderColor: '#fecaca' }}
          >
            {portaling ? 'Cancelling…' : 'Cancel subscription →'}
          </button>
        )}
      </section>
    </div>
  )
}
