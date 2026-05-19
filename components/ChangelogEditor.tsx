'use client'
import { useState, useCallback, useEffect } from 'react'
import { marked } from 'marked'
import { Save, Send, Trash2, RotateCcw, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Changelog } from '@/types'

interface ChangelogEditorProps {
  changelog: Changelog
  projectId: string
}

interface FormData {
  title: string
  content_md: string
  version?: string
  tags: string[]
}

export default function ChangelogEditor({ changelog, projectId }: ChangelogEditorProps) {
  const [formData, setFormData] = useState<FormData>({
    title: changelog.title,
    content_md: changelog.content_md,
    version: changelog.version,
    tags: changelog.tags || [],
  })

  const [originalData, setOriginalData] = useState<FormData>(formData)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preview, setPreview] = useState('')
  const [newTag, setNewTag] = useState('')
  const [showMetadata, setShowMetadata] = useState(true)
  const [unsaved, setUnsaved] = useState(false)

  // Generate preview on content change
  useEffect(() => {
    const generatePreview = async () => {
      try {
        const html = await marked(formData.content_md)
        setPreview(html)
      } catch (error) {
        console.error('Failed to render preview:', error)
        setPreview('<p style="color: red;">Error rendering preview</p>')
      }
    }

    generatePreview()
  }, [formData.content_md])

  // Track unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.title !== originalData.title ||
      formData.content_md !== originalData.content_md ||
      formData.version !== originalData.version ||
      JSON.stringify(formData.tags) !== JSON.stringify(originalData.tags)

    setUnsaved(hasChanges)
  }, [formData, originalData])

  const handleUpdateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    if (formData.tags.includes(newTag.trim())) {
      toast.error('Tag already exists')
      return
    }
    if (formData.tags.length >= 10) {
      toast.error('Maximum 10 tags allowed')
      return
    }

    handleUpdateField('tags', [...formData.tags, newTag.trim()])
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    handleUpdateField(
      'tags',
      formData.tags.filter((t) => t !== tag)
    )
  }

  const handleSave = async () => {
    // Validate
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (formData.content_md.length < 10) {
      toast.error('Content must be at least 10 characters')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/changelog/${changelog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content_md: formData.content_md.trim(),
          version: formData.version?.trim() || null,
          tags: formData.tags,
        }),
      })

      if (res.ok) {
        setOriginalData(formData)
        toast.success('Changelog saved')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save changelog')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save changelog')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required to publish')
      return
    }

    if (!window.confirm('Publish this changelog? It will be visible to subscribers.')) {
      return
    }

    setPublishing(true)
    try {
      // Save first
      const saveRes = await fetch(`/api/changelog/${changelog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content_md: formData.content_md.trim(),
          version: formData.version?.trim() || null,
          tags: formData.tags,
        }),
      })

      if (!saveRes.ok) {
        toast.error('Failed to save before publishing')
        setPublishing(false)
        return
      }

      // Then publish
      const publishRes = await fetch(`/api/changelog/${changelog.id}/publish`, {
        method: 'POST',
      })

      if (publishRes.ok) {
        const data = await publishRes.json()
        toast.success(`Published! Notified ${data.subscribers || 0} subscribers`)
        window.location.reload()
      } else {
        const error = await publishRes.json()
        toast.error(error.error || 'Failed to publish')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this draft? This action cannot be undone. You can regenerate a new changelog from your GitHub commits.'
      )
    ) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/changelog/${changelog.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Changelog deleted')
        window.location.href = `/dashboard/projects/${projectId}`
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleDiscard = () => {
    if (!unsaved || window.confirm('Discard unsaved changes?')) {
      setFormData(originalData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Warning */}
      {unsaved && (
        <div
          className="px-4 py-3 rounded-lg text-sm flex items-center justify-between"
          style={{ background: '#fef3c7', color: '#92400e' }}
        >
          <span>You have unsaved changes</span>
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded font-medium"
            style={{ background: '#fbbf24', color: '#78350f' }}
          >
            Save now
          </button>
        </div>
      )}

      {/* Metadata Section */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="flex items-center gap-2 w-full font-semibold mb-4"
        >
          <ChevronDown
            size={18}
            style={{
              transform: showMetadata ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
          Metadata
        </button>

        {showMetadata && (
          <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            {/* Tone (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Tone
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-subtle)' }}
              >
                {changelog.tone || 'user-friendly'}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                {changelog.generation_tokens ? `Generated using ${changelog.generation_tokens} tokens` : 'Generated'}
              </p>
            </div>

            {/* Commit Range (Read-only) */}
            {(changelog.from_commit || changelog.to_commit) && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Commit Range
                </label>
                <div
                  className="px-3 py-2 rounded-lg text-sm font-mono space-y-1"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-subtle)' }}
                >
                  {changelog.from_commit && <div>From: {changelog.from_commit}</div>}
                  {changelog.to_commit && <div>To: {changelog.to_commit}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Section */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <h3 className="font-semibold mb-4">Edit Changelog</h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleUpdateField('title', e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              placeholder="Enter changelog title"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              {formData.title.length}/200
            </p>
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Version</label>
            <input
              type="text"
              value={formData.version || ''}
              onChange={(e) => handleUpdateField('version', e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              placeholder="e.g. v2.1.0"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                maxLength={30}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                placeholder="Add a tag and press Enter"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 rounded-lg font-medium text-sm text-white"
                style={{ background: 'var(--accent)' }}
              >
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-75 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              {formData.tags.length}/10 tags
            </p>
          </div>
        </div>
      </div>

      {/* Split Pane Editor + Preview */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-h-[500px]">
          {/* Editor Pane */}
          <div className="border-r" style={{ borderColor: 'var(--border)' }}>
            <div className="p-4 border-b text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Markdown
            </div>
            <textarea
              value={formData.content_md}
              onChange={(e) => handleUpdateField('content_md', e.target.value)}
              className="w-full h-full p-4 outline-none font-mono text-sm resize-none"
              style={{ background: 'var(--bg)', color: 'var(--text)' }}
              placeholder="# Your changelog content in Markdown&#10;&#10;## Features&#10;- Feature 1&#10;- Feature 2&#10;&#10;## Bug Fixes&#10;- Fixed issue..."
            />
          </div>

          {/* Preview Pane */}
          <div className="hidden md:block overflow-y-auto">
            <div className="p-4 border-b text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Preview
            </div>
            <div className="p-4 prose prose-sm max-w-none" style={{ color: 'var(--text)' }}>
              <div
                className="changelog-preview"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end pt-4">
        {changelog.status === 'draft' && (
          <>
            <button
              onClick={handleDiscard}
              className="px-4 py-2 rounded-lg border font-medium text-sm flex items-center gap-2"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <RotateCcw size={16} /> Discard
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border font-medium text-sm text-red-600 flex items-center gap-2 disabled:opacity-50"
              style={{ borderColor: 'currentColor' }}
            >
              <Trash2 size={16} /> Delete
            </button>

            <button
              onClick={handleSave}
              disabled={!unsaved || saving}
              className="px-4 py-2 rounded-lg font-medium text-sm text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              <Save size={16} /> {saving ? 'Saving…' : 'Save draft'}
            </button>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 py-2 rounded-lg font-medium text-sm text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: '#10b981' }}
            >
              <Send size={16} /> {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </>
        )}

        {changelog.status === 'published' && changelog.published_at && (
          <div className="text-sm font-medium px-4 py-2 rounded-lg" style={{ background: '#f0fdf4', color: '#166534' }}>
            ✓ Published on {new Date(changelog.published_at || new Date()).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Markdown Styling */}
      <style>{`
        .changelog-preview h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem 0;
          letter-spacing: -0.02em;
        }
        .changelog-preview h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.625rem 0;
          letter-spacing: -0.02em;
        }
        .changelog-preview h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        .changelog-preview ul, .changelog-preview ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .changelog-preview li {
          margin: 0.5rem 0;
        }
        .changelog-preview code {
          background: var(--bg-subtle);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        .changelog-preview pre {
          background: var(--bg-muted);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .changelog-preview pre code {
          background: transparent;
          padding: 0;
        }
        .changelog-preview blockquote {
          border-left: 4px solid var(--accent);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: var(--text-muted);
        }
        .changelog-preview a {
          color: var(--accent);
          text-decoration: underline;
        }
        .changelog-preview table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .changelog-preview th, .changelog-preview td {
          border: 1px solid var(--border);
          padding: 0.5rem;
          text-align: left;
        }
        .changelog-preview th {
          background: var(--bg-subtle);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
