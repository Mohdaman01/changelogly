'use client'
import { useRouter } from 'next/navigation'
import WebhookManager from '@/components/WebhookManager'

interface ProjectSettings {
  id: string
  name: string
  webhook_tone_preference?: string
  github_webhook_secret?: string
}

interface WorkspaceSettings {
  id: string
  plan: string
}

export default function ProjectSettingsClient({
  project,
  workspace,
}: {
  project: ProjectSettings
  workspace: WorkspaceSettings
}) {
  const router = useRouter()

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm mb-4 flex items-center gap-1 hover:opacity-75 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.02em' }}>
          {project.name} — Settings
        </h1>
      </div>

      {/* Webhook Configuration */}
      <section className="rounded-2xl border p-6" style={{ background: 'var(--bg)' }}>
        <WebhookManager
          projectId={project.id}
          projectName={project.name}
          currentTone={project.webhook_tone_preference}
          isWebhookRegistered={!!project.github_webhook_secret}
          plan={workspace.plan}
        />
      </section>
    </div>
  )
}
