'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, Copy, RotateCw, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface WebhookLog {
  id: string
  event_type: string
  status: 'success' | 'failed' | 'invalid_signature' | 'invalid_event'
  error_message?: string
  changelog_id?: string
  created_at: string
}

interface WebhookManagerProps {
  projectId: string
  projectName: string
  currentTone?: string
  isWebhookRegistered?: boolean
  plan: string
}

export default function WebhookManager({
  projectId,
  projectName,
  currentTone = 'user-friendly',
  isWebhookRegistered = false,
  plan,
}: WebhookManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUnregistering, setIsUnregistering] = useState(false)
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [tone, setTone] = useState(currentTone)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)

  // Fetch webhook logs
  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await fetch(
        `/api/workspace/webhook/logs?projectId=${projectId}&limit=10`
      )
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      toast.error('Failed to load webhook logs')
    } finally {
      setLogsLoading(false)
    }
  }

  // Register webhook
  const handleRegisterWebhook = async () => {
    if (plan === 'free') {
      toast.error('Webhook auto-publish requires Starter plan or higher')
      return
    }

    setIsRegistering(true)
    try {
      const res = await fetch('/api/workspace/webhook/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, tone }),
      })

      if (res.ok) {
        const data = await res.json()
        setWebhookUrl(data.webhookUrl)
        setSecret(data.secret || '(Configured on GitHub)')
        setShowSecretDialog(true)
        toast.success('Webhook registered successfully!')
        setIsOpen(true)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to register webhook')
      }
    } catch (error) {
      console.error('Failed to register webhook:', error)
      toast.error('Failed to register webhook')
    } finally {
      setIsRegistering(false)
    }
  }

  // Unregister webhook
  const handleUnregisterWebhook = async () => {
    if (!window.confirm('Are you sure you want to unregister the webhook?')) return

    setIsUnregistering(true)
    try {
      const res = await fetch(`/api/workspace/webhook/register?projectId=${projectId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Webhook unregistered')
        setIsOpen(false)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to unregister webhook')
      }
    } catch (error) {
      console.error('Failed to unregister webhook:', error)
      toast.error('Failed to unregister webhook')
    } finally {
      setIsUnregistering(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'invalid_signature':
      case 'invalid_event':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-red-600 bg-red-50'
    }
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold" style={{ letterSpacing: '-0.02em' }}>
            GitHub Auto-Publish
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {isWebhookRegistered
              ? 'Webhook is active. New releases will auto-generate changelogs.'
              : 'Automatically generate and publish changelogs when you create a GitHub release.'}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ background: isOpen ? 'var(--bg-subtle)' : 'transparent' }}
        >
          <ChevronDown
            size={18}
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </button>
      </div>

      {/* Status Badge */}
      {isWebhookRegistered && (
        <div
          className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
          style={{ background: '#f0fdf4', color: '#166534' }}
        >
          <span>●</span> Webhook Active
        </div>
      )}

      {/* Expandable Content */}
      {isOpen && (
        <div className="space-y-6 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          {/* Register/Unregister */}
          {!isWebhookRegistered ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Changelog Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <option value="user-friendly">User-Friendly</option>
                  <option value="technical">Technical</option>
                  <option value="marketing">Marketing</option>
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Choose the tone for AI-generated changelogs from your releases.
                </p>
              </div>

              <button
                onClick={handleRegisterWebhook}
                disabled={isRegistering || plan === 'free'}
                className="w-full px-4 py-2.5 rounded-lg font-medium text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'var(--accent)' }}
              >
                {isRegistering ? '…' : '↗ Register Webhook'}
              </button>

              {plan === 'free' && (
                <div
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{ background: '#fef3c7', color: '#92400e' }}
                >
                  Auto-publish requires Starter plan or higher
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tone Preference */}
              <div>
                <label className="block text-sm font-medium mb-2">Current Tone</label>
                <div
                  className="px-3 py-2 rounded-lg text-sm font-mono"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text)' }}
                >
                  {currentTone}
                </div>
              </div>

              {/* Unregister Button */}
              <button
                onClick={handleUnregisterWebhook}
                disabled={isUnregistering}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium border text-red-600 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                style={{ borderColor: 'currentColor' }}
              >
                <Trash2 size={16} /> Unregister Webhook
              </button>
            </div>
          )}

          {/* Webhook URL Info (after registration) */}
          {showSecretDialog && (
            <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
              <p className="text-sm font-medium">Webhook Configuration</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Your GitHub webhook has been automatically registered with the secret below.
              </p>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-subtle)' }}>
                  Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 px-2 py-1.5 text-xs rounded bg-white border overflow-x-auto"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {webhookUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowSecretDialog(false)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Webhook Logs */}
          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => {
                setShowLogs(!showLogs)
                if (!showLogs) fetchLogs()
              }}
              className="flex items-center gap-2 text-sm font-medium w-full p-2 hover:bg-gray-100 rounded"
              style={{ color: 'var(--accent)' }}
            >
              <ChevronDown
                size={16}
                style={{
                  transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
              Webhook Logs ({logs.length})
            </button>

            {showLogs && (
              <div className="space-y-2">
                {logsLoading ? (
                  <div className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    Loading…
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No webhook events yet
                  </div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`px-3 py-2 rounded text-xs font-mono border ${statusColor(log.status)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium capitalize">{log.status}</div>
                            {log.error_message && (
                              <div className="text-opacity-80">{log.error_message}</div>
                            )}
                          </div>
                          <time style={{ fontSize: '10px', opacity: 0.7 }}>
                            {new Date(log.created_at).toLocaleTimeString()}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {logs.length > 0 && (
                  <button
                    onClick={async () => {
                      const res = await fetch(
                        `/api/workspace/webhook/logs?projectId=${projectId}`,
                        { method: 'DELETE' }
                      )
                      if (res.ok) {
                        setLogs([])
                        toast.success('Logs cleared')
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium w-full py-1.5"
                  >
                    Clear logs
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Documentation Link */}
          <div className="text-xs p-3 rounded-lg" style={{ background: '#f3f4f6' }}>
            <a
              href="https://docs.github.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              GitHub Webhooks Documentation <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
