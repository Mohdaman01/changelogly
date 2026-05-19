import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import WebhookManager from '@/components/WebhookManager'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectSettingsPage(props: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const params = await props.params
  const projectId = params.id

  // Fetch workspace
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) redirect('/onboarding')

  // Fetch project
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!project) redirect('/dashboard/projects')

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <button
          onClick={() => history.back()}
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
          projectId={projectId}
          projectName={project.name}
          currentTone={project.webhook_tone_preference}
          isWebhookRegistered={!!project.github_webhook_secret}
          plan={workspace.plan}
        />
      </section>
    </div>
  )
}
