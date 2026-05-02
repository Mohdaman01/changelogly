'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  projectId: string
  brandColor: string
}

export default function SubscribeForm({ projectId, brandColor }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) return toast.error('Enter a valid email')
    setLoading(true)

    const res = await fetch('/api/changelog/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, projectId }),
    })

    if (res.ok) {
      setSubscribed(true)
      toast.success('Check your email to confirm!')
    } else {
      toast.error('Failed to subscribe. Try again.')
    }
    setLoading(false)
  }

  if (subscribed) {
    return (
      <div className="text-right">
        <p className="text-sm font-medium" style={{ color: brandColor }}>✓ Check your inbox</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>Confirm your email to subscribe</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
        placeholder="your@email.com"
        className="px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 transition-shadow w-44"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      />
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="text-sm px-3 py-2 rounded-lg font-medium text-white whitespace-nowrap disabled:opacity-60 transition-opacity"
        style={{ background: brandColor }}
      >
        {loading ? '…' : 'Subscribe'}
      </button>
    </div>
  )
}
