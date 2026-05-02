'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Changelog } from '@/types'

export default function ChangelogEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const [changelog, setChangelog] = useState<Changelog | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  useEffect(() => {
    fetch(`/api/changelog/${id}`)
      .then((r) => r.json())
      .then(({ changelog }) => {
        setChangelog(changelog)
        setContent(changelog.content_md)
        setTitle(changelog.title)
      })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/changelog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content_md: content }),
    })
    if (res.ok) toast.success('Saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  const handlePublish = async () => {
    setPublishing(true)
    const res = await fetch(`/api/changelog/${id}/publish`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Published! ${data.notified > 0 ? `Notified ${data.notified} subscribers.` : ''}`)
      setChangelog((prev) => prev ? { ...prev, status: 'published' } : prev)
    } else {
      toast.error(data.error ?? 'Failed to publish')
    }
    setPublishing(false)
  }

  if (!changelog) {
    return <div className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back</button>
          <div className="flex rounded-lg border overflow-hidden text-sm">
            <button
              onClick={() => setTab('edit')}
              className="px-3 py-1.5 transition-colors"
              style={{ background: tab === 'edit' ? 'var(--accent-subtle)' : 'var(--bg)', color: tab === 'edit' ? 'var(--accent)' : 'var(--text-muted)' }}
            >Edit</button>
            <button
              onClick={() => setTab('preview')}
              className="px-3 py-1.5 border-l transition-colors"
              style={{ background: tab === 'preview' ? 'var(--accent-subtle)' : 'var(--bg)', color: tab === 'preview' ? 'var(--accent)' : 'var(--text-muted)' }}
            >Preview</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${changelog.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {changelog.status}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-4 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          {changelog.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="text-sm px-4 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {publishing ? 'Publishing…' : 'Publish →'}
            </button>
          )}
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 overflow-auto p-8 max-w-3xl mx-auto w-full">
        {tab === 'edit' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Changelog title"
              className="w-full text-2xl font-bold outline-none border-b pb-3"
              style={{ borderColor: 'var(--border)', background: 'transparent', letterSpacing: '-0.02em' }}
            />
            <div className="flex gap-2 flex-wrap">
              {changelog.tags?.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full border" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
                  {tag}
                </span>
              ))}
              {changelog.version && (
                <span className="text-xs px-2 py-1 rounded-full border font-mono" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {changelog.version}
                </span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[500px] text-sm font-mono outline-none resize-none leading-relaxed"
              style={{ background: 'transparent', color: 'var(--text)' }}
              placeholder="Write your changelog in Markdown…"
            />
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>{title}</h1>
            <div className="flex gap-2 mb-6 flex-wrap">
              {changelog.tags?.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full border" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', background: 'var(--accent-subtle)' }}>
                  {tag}
                </span>
              ))}
            </div>
            <div
              className="changelog-content prose max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Simple markdown renderer (replace with a proper lib like marked/remark in production)
function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
}
