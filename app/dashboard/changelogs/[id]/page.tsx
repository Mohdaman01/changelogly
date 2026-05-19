import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import ChangelogEditor from '@/components/ChangelogEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChangelogDetailPage(props: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const params = await props.params
  const changelogId = params.id

  // Fetch workspace
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) redirect('/onboarding')

  // Fetch changelog
  const { data: changelog } = await supabaseAdmin
    .from('changelogs')
    .select('*')
    .eq('id', changelogId)
    .eq('workspace_id', workspace.id)
    .single()

  if (!changelog) redirect('/dashboard/changelogs')

  // Fetch project for navigation
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, name, slug')
    .eq('id', changelog.project_id)
    .single()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        <Link href="/dashboard/changelogs" style={{ color: 'var(--text-muted)' }} className="hover:underline">
          Changelogs
        </Link>
        {project && (
          <>
            <span style={{ color: 'var(--text-subtle)' }}>/</span>
            <span>{project.name}</span>
          </>
        )}
        <span style={{ color: 'var(--text-subtle)' }}>/</span>
        <span className="font-medium">{changelog.title}</span>
      </div>

      {/* Editor */}
      <ChangelogEditor changelog={changelog} projectId={changelog.project_id} />
    </div>
  )
}
