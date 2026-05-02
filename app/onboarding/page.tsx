'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [name, setName] = useState(user?.fullName ?? '')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) return toast.error('Name is required')
    setLoading(true)

    const res = await fetch('/api/workspace/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-subtle)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg" style={{ background: 'var(--accent)' }}>C</div>
          <h1 className="text-2xl font-bold mb-2" style={{ letterSpacing: '-0.02em' }}>Set up your workspace</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Takes 30 seconds. You can change this later.</p>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1.5">Workspace name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5">Your changelog URL</label>
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <span className="px-3 py-2.5 text-sm border-r" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                changelogly.com/c/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="acme-corp"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-subtle)' }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? 'Creating workspace…' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
