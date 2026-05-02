'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Project, ChangelogTone } from '@/types'

export default function GenerateChangelogPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [fromTag, setFromTag] = useState('')
  const [toTag, setToTag] = useState('')
  const [tone, setTone] = useState<ChangelogTone>('user-friendly')
  const [loading, setLoading] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then(({ project }) => {
        setProject(project)
        if (project?.github_repo) fetchTags(project.github_repo)
      })
  }, [projectId])

  const fetchTags = async (repo: string) => {
    setTagsLoading(true)
    const res = await fetch('/api/github/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo }),
    })
    const { tags } = await res.json()
    setTags(tags ?? [])
    if (tags?.length >= 2) {
      setToTag(tags[0])
      setFromTag(tags[1])
    }
    setTagsLoading(false)
  }

  const handleGenerate = async () => {
    if (!fromTag && !toTag) return toast.error('Select at least one tag or date range')
    setLoading(true)

    const res = await fetch('/api/changelog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, tone, fromTag, toTag }),
    })

    const data = await res.json()

    if (res.ok) {
      toast.success('Changelog generated!')
      router.push(`/dashboard/changelogs/${data.changelog.id}`)
    } else {
      toast.error(data.error ?? 'Generation failed')
      setLoading(false)
    }
  }

  const tones: { value: ChangelogTone; label: string; desc: string }[] = [
    { value: 'user-friendly', label: 'User-friendly', desc: 'Plain English, great for end users' },
    { value: 'technical', label: 'Technical', desc: 'Precise, for developer audiences' },
    { value: 'marketing', label: 'Marketing', desc: 'Benefit-focused, for announcements' },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm mb-6 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Generate changelog</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        {project?.name} · {project?.github_repo ?? 'No repo'}
      </p>

      <div className="space-y-6">
        {/* Tag range */}
        <div>
          <label className="block text-sm font-medium mb-3">Commit range</label>
          {tagsLoading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading tags…</p>
          ) : tags.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>From tag</label>
                <select
                  value={fromTag}
                  onChange={(e) => setFromTag(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <option value="">Beginning</option>
                  {tags.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>To tag</label>
                <select
                  value={toTag}
                  onChange={(e) => setToTag(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <option value="">Latest</option>
                  {tags.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No tags found. We'll use the last 30 days of commits.
              </p>
            </div>
          )}
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium mb-3">Writing tone</label>
          <div className="grid grid-cols-3 gap-3">
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className="p-3 rounded-xl border text-left transition-all"
                style={{
                  borderColor: tone === t.value ? 'var(--accent)' : 'var(--border)',
                  background: tone === t.value ? 'var(--accent-subtle)' : 'var(--bg)',
                }}
              >
                <p className="text-sm font-medium mb-0.5" style={{ color: tone === t.value ? 'var(--accent)' : 'var(--text)' }}>
                  {t.label}
                </p>
                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating with AI…
            </>
          ) : '✨ Generate changelog'}
        </button>
      </div>
    </div>
  )
}
