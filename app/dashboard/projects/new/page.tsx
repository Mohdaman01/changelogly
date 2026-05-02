'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Repo {
  id: number
  full_name: string
  name: string
  private: boolean
  description: string | null
}

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [reposLoading, setReposLoading] = useState(false)
  const [githubConnected, setGithubConnected] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setReposLoading(true)
    fetch('/api/github/repos')
      .then((r) => r.json())
      .then((data) => {
        if (data.repos) setRepos(data.repos)
        else setGithubConnected(false)
      })
      .catch(() => setGithubConnected(false))
      .finally(() => setReposLoading(false))
  }, [])

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Project name required')
    setSaving(true)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description, github_repo: selectedRepo }),
    })

    if (res.ok) {
      const { project } = await res.json()
      toast.success('Project created!')
      router.push(`/dashboard/projects/${project.id}`)
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to create project')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm mb-4 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          ← Back
        </button>
        <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>New project</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>A project maps to one GitHub repo and gets its own changelog page.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Project name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My App"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description <span style={{ color: 'var(--text-subtle)' }}>(optional)</span></label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this project do?"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-shadow"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Changelog URL slug</label>
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
            <span className="px-3 py-2.5 text-sm border-r" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
              /changelog/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="my-app"
              className="flex-1 px-3 py-2.5 text-sm outline-none"
              style={{ background: 'var(--bg-subtle)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">GitHub repository</label>
          {!githubConnected ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Connect GitHub to pick a repo</p>
              <a
                href="/api/auth/github"
                className="inline-block text-sm px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                Connect GitHub →
              </a>
            </div>
          ) : reposLoading ? (
            <div className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>Loading repos…</div>
          ) : (
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <option value="">No repo (manual entry)</option>
              {repos.map((r) => (
                <option key={r.id} value={r.full_name}>
                  {r.full_name} {r.private ? '(private)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? 'Creating…' : 'Create project →'}
          </button>
        </div>
      </div>
    </div>
  )
}
