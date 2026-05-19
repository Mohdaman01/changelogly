import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import WebhookManager from '@/components/WebhookManager'
import ProjectSettingsClient from '../ProjectSettingsClient'

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

  return <ProjectSettingsClient project={project} workspace={workspace} />
}
