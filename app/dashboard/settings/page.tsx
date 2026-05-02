import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (!workspace) redirect('/onboarding')

  return <SettingsClient workspace={workspace} />
}
